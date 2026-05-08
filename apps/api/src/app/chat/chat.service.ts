import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import type { Decimal } from "@prisma/client/runtime/client";
import { ModelRegistryService } from "../config/model-registry.service";
import { BillingService } from "../billing/billing.service";
import { ProviderRouter } from "../providers/provider-router";
import { UsageService } from "../usage/usage.service";
import { PromptTuningService } from "./prompt-tuning.service";
import { ConversationService } from "./conversation.service";
import { ChatCompletionRequest } from "./dto/chat-completion.dto";

interface AuthenticatedUser {
  id: string;
  email: string;
  balance: Decimal;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly billing: BillingService,
    private readonly providerRouter: ProviderRouter,
    private readonly usage: UsageService,
    private readonly registry: ModelRegistryService,
    private readonly promptTuning: PromptTuningService,
    private readonly conversation: ConversationService,
  ) {}

  async createCompletion(body: ChatCompletionRequest, user: AuthenticatedUser) {
    const startTime = Date.now();

    // 1. Validate model exists
    const modelConfig = await this.registry.getModel(body.model);
    if (!modelConfig) {
      const available = await this.registry.getAllModels();
      throw new BadRequestException(
        `Model "${body.model}" is not supported. Available models: ${available.map((m) => m.slug).join(", ")}`,
      );
    }

    const pricing = await this.registry.getUserPrice(body.model);
    if (!pricing) {
      throw new BadRequestException(
        `Pricing not found for model "${body.model}"`,
      );
    }

    // 2. Estimate cost
    const estimatedTokens = this.billing.estimateTokens(body.messages);
    const estimatedCost = this.billing.estimateCost(
      estimatedTokens,
      pricing.inputPrice.toNumber(),
    );

    // 3. Reserve credits (atomic balance check + deduction)
    let reservedAmount: Decimal;
    try {
      reservedAmount = await this.billing.reserveCredits(
        user.id,
        estimatedCost,
      );
    } catch {
      throw new BadRequestException(
        "Insufficient balance. Please top up your account.",
      );
    }

    // 4. Apply prompt tuning (inject system prompt)
    const tunedMessages = await this.promptTuning.applyTuning(body.messages);

    // 5. Call provider
    let providerResponse;
    try {
      providerResponse = await this.providerRouter.chat(modelConfig.provider, {
        model: body.model,
        providerId: modelConfig.providerId,
        messages: tunedMessages,
        temperature: body.temperature,
        max_tokens: body.max_tokens,
      });
    } catch (error: any) {
      // Refund on provider failure
      await this.billing.refundReservation(user.id, reservedAmount);
      this.logger.error(`Provider call failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        "Failed to get response from model provider. Your balance has been refunded.",
      );
    }

    const latencyMs = Date.now() - startTime;

    // 6. Calculate actual cost
    const actualCost = this.billing.calculateActualCost(
      providerResponse.usage.prompt_tokens,
      providerResponse.usage.completion_tokens,
      pricing.inputPrice.toNumber(),
      pricing.outputPrice.toNumber(),
    );

    // 7. Adjust balance (refund difference)
    await this.billing.adjustBalance(user.id, reservedAmount, actualCost);

    // 8. Log usage (async — don't block response)
    this.usage
      .logUsage({
        userId: user.id,
        model: body.model,
        inputTokens: providerResponse.usage.prompt_tokens,
        outputTokens: providerResponse.usage.completion_tokens,
        cost: actualCost,
        latencyMs,
        provider: modelConfig.provider,
      })
      .catch((err) => this.logger.error("Failed to log usage", err));

    // 9. Save chat history only when store=true (web chat)
    let conversationId: string | undefined;

    if (body.store) {
      const assistantContent =
        providerResponse.choices[0]?.message?.content ?? "";

      conversationId = await this.conversation.getOrCreateConversation(
        user.id,
        body.model,
        body.conversation_id,
      );

      this.conversation
        .saveMessages(conversationId, body.messages, assistantContent)
        .then(async () => {
          // Generate title for new conversations (no conversation_id means new)
          if (!body.conversation_id) {
            const firstUserMsg = body.messages.find((m) => m.role === "user");
            if (firstUserMsg) {
              await this.conversation.generateTitle(
                conversationId!,
                firstUserMsg.content,
              );
            }
          }
        })
        .catch((err) => this.logger.error("Failed to save chat history", err));
    }

    // 10. Return response
    return {
      id: providerResponse.id,
      object: "chat.completion",
      model: body.model,
      ...(conversationId && { conversation_id: conversationId }),
      choices: providerResponse.choices,
      usage: {
        prompt_tokens: providerResponse.usage.prompt_tokens,
        completion_tokens: providerResponse.usage.completion_tokens,
        total_tokens: providerResponse.usage.total_tokens,
      },
    };
  }
}
