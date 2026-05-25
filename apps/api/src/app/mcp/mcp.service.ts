import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { McpClientService, McpServerConfig } from "./mcp-client.service";
import { McpRegistryService } from "./mcp-registry.service";
import { Prisma } from "@generated/prisma/client.js";
import {
  CreateMcpServerDto,
  AttachMcpServerDto,
  UpdateAgentMcpToolsDto,
} from "./dto/mcp.dto";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mcpClient: McpClientService,
    private readonly registry: McpRegistryService,
    private readonly configService: ConfigService,
  ) {
    const key =
      this.configService.get<string>("MCP_ENCRYPTION_KEY") ||
      "default-dev-key-32-bytes-long!!";
    this.encryptionKey = Buffer.from(key.padEnd(32, "0").slice(0, 32));
  }

  getRegistry() {
    return this.registry.getAllPackages();
  }

  async listServers(userId: string) {
    return this.prisma.mcpServer.findMany({
      where: {
        OR: [{ userId }, { isGlobal: true }],
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        transport: true,
        status: true,
        isGlobal: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createServer(userId: string, dto: CreateMcpServerDto) {
    // MCP connections created from user APIs must always be user-owned.
    // Keep globals reserved for system seeding/admin flows.
    if (!userId) {
      throw new UnauthorizedException("Authentication required");
    }

    const packageInfo = this.registry.getPackageInfo(dto.name);

    // Use registry info if available, otherwise use raw DTO values
    const command = dto.command || "npx";
    const args = dto.args || (packageInfo ? ["-y", packageInfo.package] : []);
    const displayName = dto.displayName || packageInfo?.displayName || dto.name;

    // Encrypt env vars
    const envEncrypted = dto.env ? this.encryptJson(dto.env) : Prisma.DbNull;

    const server = await this.prisma.mcpServer.create({
      data: {
        name: dto.name,
        displayName,
        transport: dto.transport || "stdio",
        command,
        args,
        url: dto.url,
        envEncrypted,
        userId,
        status: "connected",
      },
    });

    return {
      id: server.id,
      name: server.name,
      displayName: server.displayName,
      transport: server.transport,
      status: server.status,
    };
  }

  async listServerTools(userId: string, serverId: string) {
    const server = await this.getServerForUser(userId, serverId);
    const config = this.buildConfig(server);

    try {
      await this.mcpClient.connectServer(config);
      const tools = await this.mcpClient.listTools(config.id);
      await this.mcpClient.disconnectServer(config.id);
      return { tools };
    } catch (err: any) {
      this.logger.error(
        `Failed to list tools for ${server.name}: ${err.message}`,
      );
      throw new Error(`Failed to connect to MCP server: ${err.message}`);
    }
  }

  async testConnection(userId: string, serverId: string) {
    const server = await this.getServerForUser(userId, serverId);
    const config = this.buildConfig(server);

    try {
      await this.mcpClient.connectServer(config);
      const tools = await this.mcpClient.listTools(config.id);
      await this.mcpClient.disconnectServer(config.id);

      await this.prisma.mcpServer.update({
        where: { id: serverId },
        data: { status: "connected" },
      });

      return {
        status: "connected",
        toolCount: tools.length,
        tools: tools.map((t) => t.name),
      };
    } catch (err: any) {
      await this.prisma.mcpServer.update({
        where: { id: serverId },
        data: { status: "error" },
      });
      return { status: "error", error: err.message };
    }
  }

  async deleteServer(userId: string, serverId: string) {
    const server = await this.getServerForUser(userId, serverId);
    if (server.isGlobal) {
      throw new ForbiddenException("Cannot delete global MCP servers");
    }

    await this.mcpClient.disconnectServer(serverId);
    await this.prisma.mcpServer.delete({ where: { id: serverId } });
    return { deleted: true };
  }

  async attachToAgent(
    userId: string,
    agentId: string,
    dto: AttachMcpServerDto,
  ) {
    // Verify agent ownership
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, userId },
    });
    if (!agent) throw new NotFoundException("Agent not found");

    // Verify server access
    await this.getServerForUser(userId, dto.mcpServerId);

    return this.prisma.agentMcpServer.create({
      data: {
        agentId,
        mcpServerId: dto.mcpServerId,
        allowedTools: dto.allowedTools ?? Prisma.DbNull,
      },
      include: {
        mcpServer: {
          select: { id: true, name: true, displayName: true, status: true },
        },
      },
    });
  }

  async listAgentMcpServers(userId: string, agentId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, OR: [{ userId }, { isPublic: true }] },
    });
    if (!agent) throw new NotFoundException("Agent not found");

    return this.prisma.agentMcpServer.findMany({
      where: { agentId },
      include: {
        mcpServer: {
          select: {
            id: true,
            name: true,
            displayName: true,
            transport: true,
            status: true,
          },
        },
      },
    });
  }

  async updateAgentMcpTools(
    userId: string,
    agentId: string,
    serverId: string,
    dto: UpdateAgentMcpToolsDto,
  ) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, userId },
    });
    if (!agent) throw new NotFoundException("Agent not found");

    return this.prisma.agentMcpServer.updateMany({
      where: { agentId, mcpServerId: serverId },
      data: { allowedTools: dto.allowedTools ?? Prisma.DbNull },
    });
  }

  async detachFromAgent(userId: string, agentId: string, serverId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, userId },
    });
    if (!agent) throw new NotFoundException("Agent not found");

    await this.prisma.agentMcpServer.deleteMany({
      where: { agentId, mcpServerId: serverId },
    });
    return { detached: true };
  }

  /**
   * Get MCP server configs for an agent (used by AgentToolService during execution)
   */
  async getAgentMcpConfigs(
    agentId: string,
  ): Promise<
    Array<{ config: McpServerConfig; allowedTools: string[] | null }>
  > {
    const agentServers = await this.prisma.agentMcpServer.findMany({
      where: { agentId },
      include: { mcpServer: true },
    });

    return agentServers.map((as) => ({
      config: this.buildConfig(as.mcpServer),
      allowedTools: as.allowedTools as string[] | null,
    }));
  }

  // ─── Helpers ───

  private async getServerForUser(userId: string, serverId: string) {
    const server = await this.prisma.mcpServer.findFirst({
      where: {
        id: serverId,
        OR: [{ userId }, { isGlobal: true }],
      },
    });
    if (!server) throw new NotFoundException("MCP server not found");
    return server;
  }

  buildConfig(server: any): McpServerConfig {
    const env = server.envEncrypted
      ? this.decryptJson(server.envEncrypted)
      : {};

    return {
      id: server.id,
      name: server.name,
      transport: server.transport as "stdio" | "sse",
      command: server.command || undefined,
      args: (server.args as string[]) || undefined,
      url: server.url || undefined,
      env,
    };
  }

  private encryptJson(data: Record<string, string>): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.encryptionKey, iv);
    let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
  }

  private decryptJson(encrypted: any): Record<string, string> {
    try {
      const parts = (encrypted as string).split(":");
      if (parts.length !== 3) return {};
      const [ivHex, tagHex, data] = parts;
      const iv = Buffer.from(ivHex, "hex");
      const tag = Buffer.from(tagHex, "hex");
      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        this.encryptionKey,
        iv,
      );
      decipher.setAuthTag(tag);
      let decrypted = decipher.update(data, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return JSON.parse(decrypted);
    } catch {
      return {};
    }
  }
}
