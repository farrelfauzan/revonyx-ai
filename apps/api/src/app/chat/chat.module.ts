import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ConversationController } from "./conversation.controller";
import { ConversationService } from "./conversation.service";
import { ModelsController } from "./models.controller";
import { PromptTemplateService } from "./prompt-template.service";
import { PromptTuningService } from "./prompt-tuning.service";
import { BillingModule } from "../billing/billing.module";
import { ProvidersModule } from "../providers/providers.module";
import { UsageModule } from "../usage/usage.module";
import { KnowledgeModule } from "../knowledge/knowledge.module";
import { DocumentModule } from "../document/document.module";
import { MemoryModule } from "../memory/memory.module";

@Module({
  imports: [
    BillingModule,
    ProvidersModule,
    UsageModule,
    KnowledgeModule,
    DocumentModule,
    MemoryModule,
  ],
  controllers: [ChatController, ConversationController, ModelsController],
  providers: [
    ChatService,
    ConversationService,
    PromptTemplateService,
    PromptTuningService,
  ],
  exports: [ConversationService, PromptTuningService],
})
export class ChatModule {}
