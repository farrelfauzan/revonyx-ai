import { Module } from "@nestjs/common";
import { McpController } from "./mcp.controller";
import { McpOAuthController } from "./mcp-oauth.controller";
import { McpService } from "./mcp.service";
import { McpClientService } from "./mcp-client.service";
import { McpRegistryService } from "./mcp-registry.service";
import { McpOAuthService } from "./mcp-oauth.service";

@Module({
  controllers: [McpController, McpOAuthController],
  providers: [
    McpService,
    McpClientService,
    McpRegistryService,
    McpOAuthService,
  ],
  exports: [McpService, McpClientService, McpRegistryService],
})
export class McpModule {}
