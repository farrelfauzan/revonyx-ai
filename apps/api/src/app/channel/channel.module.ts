import { Module } from "@nestjs/common";
import { GowaWebhookController } from "./gowa/gowa.webhook.controller";
import { GowaService } from "./gowa/gowa.service";
import { AgentModule } from "../agent/agent.module";
import { ProvidersModule } from "../providers/providers.module";
import { ConfigRegistryModule } from "../config/config-registry.module";
import { KnowledgeModule } from "../knowledge/knowledge.module";
import { DocumentModule } from "../document/document.module";
import { ChannelController } from "./channel.controller";
import { ChannelService } from "./channel.service";
import { ChannelChatService } from "./channel-chat.service";

@Module({
  imports: [
    AgentModule,
    ProvidersModule,
    ConfigRegistryModule,
    KnowledgeModule,
    DocumentModule,
  ],
  controllers: [GowaWebhookController, ChannelController],
  providers: [GowaService, ChannelService, ChannelChatService],
  exports: [GowaService, ChannelService],
})
export class ChannelModule {}
