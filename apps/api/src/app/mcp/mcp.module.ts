import { Module } from "@nestjs/common";
import { McpController } from "./mcp.controller";
import { McpUserController } from "./mcp-user.controller";
import { McpService } from "./mcp.service";
import { McpClientService } from "./mcp-client.service";
import { McpRegistryService } from "./mcp-registry.service";
import { McpUserService } from "./mcp-user.service";

@Module({
  controllers: [McpController, McpUserController],
  providers: [McpService, McpClientService, McpRegistryService, McpUserService],
  exports: [McpService, McpClientService, McpRegistryService, McpUserService],
})
export class McpModule {}
