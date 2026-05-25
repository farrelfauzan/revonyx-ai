import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { McpService } from "./mcp.service";
import * as crypto from "crypto";

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

/**
 * Handles server-side Google OAuth token exchange for MCP integrations.
 * OAuth client credentials are stored per-workspace in the DB.
 */
@Injectable()
export class McpOAuthService {
  private readonly logger = new Logger(McpOAuthService.name);
  private readonly redirectUri: string;
  private readonly encryptionKey: Buffer;

  private readonly providerScopes: Record<string, string[]> = {
    "google-gmail": [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
    ],
    "google-calendar": [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    "google-sheets": ["https://www.googleapis.com/auth/spreadsheets"],
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mcpService: McpService,
  ) {
    const apiUrl =
      this.configService.get<string>("API_PUBLIC_URL") ||
      "http://localhost:3000";
    this.redirectUri = `${apiUrl}/api/v1/mcp/oauth/google/callback`;

    const key =
      this.configService.get<string>("MCP_ENCRYPTION_KEY") ||
      "default-dev-key-32-bytes-long!!";
    this.encryptionKey = Buffer.from(key.padEnd(32, "0").slice(0, 32));
  }

  /**
   * Save or update workspace's Google OAuth client credentials.
   */
  async saveCredentials(
    workspaceId: string,
    clientId: string,
    clientSecret: string,
  ) {
    const encrypted = this.encrypt(clientSecret);

    await this.prisma.workspaceOAuthCredential.upsert({
      where: { workspaceId_provider: { workspaceId, provider: "google" } },
      create: {
        workspaceId,
        provider: "google",
        clientId,
        clientSecretEnc: encrypted,
      },
      update: { clientId, clientSecretEnc: encrypted },
    });

    return { saved: true };
  }

  /**
   * Check if workspace has stored Google OAuth credentials.
   */
  async hasCredentials(
    workspaceId: string,
  ): Promise<{ hasCredentials: boolean }> {
    const cred = await this.prisma.workspaceOAuthCredential.findUnique({
      where: { workspaceId_provider: { workspaceId, provider: "google" } },
    });
    return { hasCredentials: !!cred };
  }

  /**
   * Generate the Google OAuth consent URL using workspace's stored credentials.
   */
  async getGoogleAuthUrl(
    userId: string,
    workspaceId: string,
    provider: string,
  ): Promise<string> {
    const scopes = this.providerScopes[provider];
    if (!scopes) {
      throw new BadRequestException(`Unknown Google provider: ${provider}`);
    }

    const cred = await this.prisma.workspaceOAuthCredential.findUnique({
      where: { workspaceId_provider: { workspaceId, provider: "google" } },
    });
    if (!cred) {
      throw new BadRequestException(
        "Google OAuth credentials not configured for this workspace. Please save your Client ID and Client Secret first.",
      );
    }

    const state = Buffer.from(
      JSON.stringify({ userId, workspaceId, provider }),
    ).toString("base64url");

    const params = new URLSearchParams({
      client_id: cred.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Handle the OAuth callback: exchange code for tokens, then create the MCP server.
   */
  async handleGoogleCallback(code: string, stateB64: string): Promise<void> {
    let state: { userId: string; workspaceId: string; provider: string };
    try {
      state = JSON.parse(Buffer.from(stateB64, "base64url").toString("utf8"));
    } catch {
      throw new Error("Invalid OAuth state parameter");
    }

    const { userId, workspaceId, provider } = state;
    if (!userId || !workspaceId || !provider) {
      throw new Error(
        "Missing userId, workspaceId, or provider in OAuth state",
      );
    }

    // Get workspace's stored credentials
    const cred = await this.prisma.workspaceOAuthCredential.findUnique({
      where: { workspaceId_provider: { workspaceId, provider: "google" } },
    });
    if (!cred) {
      throw new Error("OAuth credentials not found for workspace");
    }

    const clientSecret = this.decrypt(cred.clientSecretEnc);

    // Exchange authorization code for tokens
    const tokens = await this.exchangeCodeForTokens(
      code,
      cred.clientId,
      clientSecret,
    );
    if (!tokens.refresh_token) {
      throw new Error(
        "No refresh token received. Try revoking app access and re-authorizing.",
      );
    }

    // Create the MCP server with the obtained credentials
    const mcpServer = await this.mcpService.createServer(userId, {
      name: provider,
      displayName: undefined,
      transport: "stdio",
      command: "npx",
      args: ["-y", this.getPackageForProvider(provider)],
      env: {
        GOOGLE_CLIENT_ID: cred.clientId,
        GOOGLE_CLIENT_SECRET: clientSecret,
        GOOGLE_REFRESH_TOKEN: tokens.refresh_token,
      },
    });

    // Auto-attach the MCP server to all agents in this workspace
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { channel: { include: { agents: true } } },
    });

    if (workspace?.channel?.agents) {
      for (const channelAgent of workspace.channel.agents) {
        await this.prisma.agentMcpServer.upsert({
          where: {
            agentId_mcpServerId: {
              agentId: channelAgent.agentId,
              mcpServerId: mcpServer.id,
            },
          },
          create: {
            agentId: channelAgent.agentId,
            mcpServerId: mcpServer.id,
          },
          update: {},
        });
      }
      this.logger.log(
        `Auto-attached MCP server "${provider}" to ${workspace.channel.agents.length} agent(s) in workspace ${workspaceId}`,
      );
    }

    this.logger.log(
      `OAuth complete: created MCP server "${provider}" for workspace ${workspaceId}`,
    );
  }

  private async exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string,
  ): Promise<GoogleTokenResponse> {
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: this.redirectUri,
      grant_type: "authorization_code",
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Google token exchange failed: ${errorBody}`);
      throw new Error("Failed to exchange authorization code for tokens");
    }

    return response.json() as Promise<GoogleTokenResponse>;
  }

  private getPackageForProvider(provider: string): string {
    const packages: Record<string, string> = {
      "google-gmail": "@gongrzhe/server-gmail-autoauth-mcp",
      "google-calendar": "@cocal/google-calendar-mcp",
      "google-sheets": "google-sheets-mcp",
    };
    return packages[provider] || provider;
  }

  private encrypt(value: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.encryptionKey, iv);
    let encrypted = cipher.update(value, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
  }

  private decrypt(encrypted: string): string {
    const parts = encrypted.split(":");
    if (parts.length !== 3) throw new Error("Invalid encrypted value");
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
    return decrypted;
  }
}
