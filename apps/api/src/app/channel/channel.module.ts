import { Module } from "@nestjs/common";
import { GowaWebhookController } from "./gowa/gowa.webhook.controller";
import { GowaService } from "./gowa/gowa.service";
import { AgentModule } from "../agent/agent.module";
import { ProvidersModule } from "../providers/providers.module";
import { ConfigRegistryModule } from "../config/config-registry.module";
import { ChannelController } from "./channel.controller";
import { ChannelService } from "./channel.service";
import { ChannelChatService } from "./channel-chat.service";

@Module({
  imports: [AgentModule, ProvidersModule, ConfigRegistryModule],
  controllers: [GowaWebhookController, ChannelController],
  providers: [GowaService, ChannelService, ChannelChatService],
  exports: [GowaService, ChannelService],
})
export class ChannelModule {}
