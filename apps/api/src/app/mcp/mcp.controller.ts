import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { McpService } from "./mcp.service";
import {
  CreateMcpServerSchema,
  AttachMcpServerSchema,
  UpdateAgentMcpToolsSchema,
} from "./dto/mcp.dto";

@Controller("mcp")
@UseGuards(AuthGuard("jwt"))
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  /**
   * List all available MCP server packages from the registry
   */
  @Get("registry")
  getRegistry() {
    return this.mcpService.getRegistry();
  }

  /**
   * List MCP servers connected by the current user
   */
  @Get("servers")
  listServers(@Req() req: any) {
    return this.mcpService.listServers(req.user.userId);
  }

  /**
   * Connect a new MCP server
   */
  @Post("servers")
  createServer(@Req() req: any, @Body() body: unknown) {
    const parsed = CreateMcpServerSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: {
          message: "Invalid request body",
          type: "invalid_request_error",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    return this.mcpService.createServer(req.user.userId, parsed.data);
  }

  /**
   * Discover tools available on a connected MCP server
   */
  @Get("servers/:id/tools")
  listServerTools(@Req() req: any, @Param("id") id: string) {
    return this.mcpService.listServerTools(req.user.userId, id);
  }

  /**
   * Test connection to an MCP server
   */
  @Post("servers/:id/test")
  testConnection(@Req() req: any, @Param("id") id: string) {
    return this.mcpService.testConnection(req.user.userId, id);
  }

  /**
   * Disconnect / delete an MCP server
   */
  @Delete("servers/:id")
  deleteServer(@Req() req: any, @Param("id") id: string) {
    return this.mcpService.deleteServer(req.user.userId, id);
  }

  /**
   * Attach an MCP server to an agent
   */
  @Post("agents/:agentId/mcp")
  attachToAgent(
    @Req() req: any,
    @Param("agentId") agentId: string,
    @Body() body: unknown,
  ) {
    const parsed = AttachMcpServerSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: {
          message: "Invalid request body",
          type: "invalid_request_error",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    return this.mcpService.attachToAgent(req.user.userId, agentId, parsed.data);
  }

  /**
   * List MCP servers attached to an agent
   */
  @Get("agents/:agentId/mcp")
  listAgentMcpServers(@Req() req: any, @Param("agentId") agentId: string) {
    return this.mcpService.listAgentMcpServers(req.user.userId, agentId);
  }

  /**
   * Update allowed tools for an agent's MCP server
   */
  @Patch("agents/:agentId/mcp/:serverId")
  updateAgentMcpTools(
    @Req() req: any,
    @Param("agentId") agentId: string,
    @Param("serverId") serverId: string,
    @Body() body: unknown,
  ) {
    const parsed = UpdateAgentMcpToolsSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: {
          message: "Invalid request body",
          type: "invalid_request_error",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    return this.mcpService.updateAgentMcpTools(
      req.user.userId,
      agentId,
      serverId,
      parsed.data,
    );
  }

  /**
   * Detach an MCP server from an agent
   */
  @Delete("agents/:agentId/mcp/:serverId")
  detachFromAgent(
    @Req() req: any,
    @Param("agentId") agentId: string,
    @Param("serverId") serverId: string,
  ) {
    return this.mcpService.detachFromAgent(req.user.userId, agentId, serverId);
  }
}
