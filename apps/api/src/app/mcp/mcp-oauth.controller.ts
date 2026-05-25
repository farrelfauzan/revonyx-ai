import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import type { FastifyReply } from "fastify";
import { McpOAuthService } from "./mcp-oauth.service";

/**
 * Handles OAuth flows for MCP integrations that require user consent (e.g. Google).
 * Credentials are stored per-workspace. Flow:
 *   1. Admin saves Google client_id + client_secret via POST /mcp/oauth/google/credentials
 *   2. Any member calls GET /mcp/oauth/google/start → gets redirect URL
 *   3. User authorizes in browser
 *   4. Google redirects to GET /mcp/oauth/google/callback → saves token, redirects back to frontend
 */
@Controller("mcp/oauth")
export class McpOAuthController {
  constructor(
    private readonly oauthService: McpOAuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Check if workspace has Google OAuth credentials stored.
   */
  @Get("google/credentials")
  @UseGuards(AuthGuard("jwt"))
  async checkCredentials(@Query("workspaceId") workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException("workspaceId query param is required");
    }
    return this.oauthService.hasCredentials(workspaceId);
  }

  /**
   * Save the workspace's Google OAuth client credentials (client_id + client_secret).
   * These are stored encrypted in the DB and reused for all Google integrations in this workspace.
   */
  @Post("google/credentials")
  @UseGuards(AuthGuard("jwt"))
  async saveCredentials(
    @Body()
    body: {
      workspaceId?: string;
      clientId?: string;
      clientSecret?: string;
    },
  ) {
    if (!body.workspaceId?.trim()) {
      throw new BadRequestException("workspaceId is required");
    }
    if (!body.clientId?.trim() || !body.clientSecret?.trim()) {
      throw new BadRequestException("clientId and clientSecret are required");
    }
    return this.oauthService.saveCredentials(
      body.workspaceId.trim(),
      body.clientId.trim(),
      body.clientSecret.trim(),
    );
  }

  /**
   * Start the Google OAuth flow.
   * Requires credentials to be saved first for the workspace.
   */
  @Get("google/start")
  @UseGuards(AuthGuard("jwt"))
  async startGoogleOAuth(
    @Req() req: any,
    @Query("provider") provider: string,
    @Query("workspaceId") workspaceId: string,
  ) {
    if (!provider) {
      throw new BadRequestException(
        "provider query param is required (e.g. google-gmail)",
      );
    }
    if (!workspaceId) {
      throw new BadRequestException("workspaceId query param is required");
    }

    const authUrl = await this.oauthService.getGoogleAuthUrl(
      req.user.userId,
      workspaceId,
      provider,
    );
    return { authUrl };
  }

  /**
   * Google OAuth callback. Exchanges code for tokens and creates the MCP server.
   * Redirects back to the frontend after success/failure.
   */
  @Get("google/callback")
  async googleCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Res() res: FastifyReply,
  ) {
    const frontendUrl =
      this.configService.get<string>("CHAT_APP_URL") || "http://localhost:4201";

    if (!code || !state) {
      return res
        .code(302)
        .redirect(
          `${frontendUrl}/agents?view=settings&oauth=error&message=Missing+code+or+state`,
        );
    }

    try {
      await this.oauthService.handleGoogleCallback(code, state);
      return res
        .code(302)
        .redirect(`${frontendUrl}/agents?view=settings&oauth=success`);
    } catch (err: any) {
      console.error("[OAuth Callback Error]", err);
      const message = encodeURIComponent(err.message || "OAuth failed");
      return res
        .code(302)
        .redirect(
          `${frontendUrl}/agents?view=settings&oauth=error&message=${message}`,
        );
    }
  }
}
