import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
  HttpCode,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  ParseUUIDPipe,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { FastifyReply } from "fastify";
import { PortalGuard, PortalIdentity } from "./portal.guard";
import { PortalTierService } from "./portal-tier.service";
import { ModelRegistryService } from "../config/model-registry.service";
import { BillingService } from "../billing/billing.service";
import { ProviderRouter } from "../providers/provider-router";
import { UsageService } from "../usage/usage.service";
import { PromptTuningService } from "../chat/prompt-tuning.service";
import { ConversationService } from "../chat/conversation.service";
import { KnowledgeService } from "../knowledge/knowledge.service";
import { DocumentService } from "../document/document.service";
import {
  ChatCompletionRequest,
  ChatCompletionRequestSchema,
} from "../chat/dto/chat-completion.dto";
import type { Decimal } from "@prisma/client/runtime/client";

const PortalCompletionSchema = ChatCompletionRequestSchema.extend({
  model: ChatCompletionRequestSchema.shape.model.optional(),
});

@Controller("chat/portal")
export class PortalController {
  private readonly logger = new Logger(PortalController.name);

  constructor(
    private readonly tierService: PortalTierService,
    private readonly registry: ModelRegistryService,
    private readonly billing: BillingService,
    private readonly providerRouter: ProviderRouter,
    private readonly usage: UsageService,
    private readonly promptTuning: PromptTuningService,
    private readonly conversation: ConversationService,
    private readonly knowledge: KnowledgeService,
    private readonly documentService: DocumentService,
  ) {}

  @Post("completions")
  @UseGuards(PortalGuard)
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async createCompletion(
    @Body() body: unknown,
    @Req() req: any,
    @Res() res: FastifyReply,
  ) {
    const identity: PortalIdentity = req.portalIdentity;

    const parsed = PortalCompletionSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: {
          message: "Invalid request body",
          type: "invalid_request_error",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }

    const requestData = parsed.data as ChatCompletionRequest;

    // Extract IP for session creation
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      undefined;

    if (identity.tier === "free") {
      return this.handleFreeRequest(identity, requestData, ip, res);
    }

    return this.handlePaidRequest(identity, requestData, res);
  }

  @Get("usage")
  @UseGuards(PortalGuard)
  async getUsage(@Req() req: any) {
    const identity: PortalIdentity = req.portalIdentity;
    return this.tierService.getUsage(
      identity.sessionId,
      identity.user?.balance,
    );
  }

  @Get("models")
  @UseGuards(PortalGuard)
  async getModels(@Req() req: any) {
    const identity: PortalIdentity = req.portalIdentity;

    if (identity.tier === "free") {
      const cheapest = await this.registry.getCheapestModel();
      if (!cheapest) return { models: [] };
      return {
        models: [{ slug: cheapest.slug, name: cheapest.modelName }],
      };
    }

    // Paid: return all models with pricing
    const models = await this.registry.getAllModels();
    const markup = await this.registry.getMarkup();
    return {
      models: models.map((m) => ({
        slug: m.slug,
        name: m.modelName,
        inputPrice: m.inputPrice.mul(markup).toString(),
        outputPrice: m.outputPrice.mul(markup).toString(),
      })),
    };
  }

  @Post("link-session")
  @UseGuards(PortalGuard)
  @HttpCode(200)
  async linkSession(@Req() req: any) {
    const identity: PortalIdentity = req.portalIdentity;

    if (!identity.user) {
      throw new BadRequestException("Authentication required");
    }

    await this.tierService.linkSessionToUser(
      identity.sessionId,
      identity.user.id,
    );

    return { linked: true };
  }

  // ─── Conversation History Endpoints ───

  @Get("conversations")
  @UseGuards(PortalGuard)
  async listConversations(
    @Req() req: any,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    const identity: PortalIdentity = req.portalIdentity;
    if (!identity.user) {
      throw new BadRequestException("Authentication required");
    }

    const l = Math.min(Math.max(parseInt(limit || "20", 10) || 20, 1), 100);
    const o = Math.max(parseInt(offset || "0", 10) || 0, 0);

    const { conversations, total } = await this.conversation.listConversations(
      identity.user.id,
      l,
      o,
    );

    return { object: "list", data: conversations, total, limit: l, offset: o };
  }

  @Get("conversations/:id")
  @UseGuards(PortalGuard)
  async getConversation(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const identity: PortalIdentity = req.portalIdentity;
    if (!identity.user) {
      throw new BadRequestException("Authentication required");
    }

    const conv = await this.conversation.getConversation(id, identity.user.id);
    if (!conv) {
      throw new NotFoundException("Conversation not found");
    }
    return conv;
  }

  @Delete("conversations/:id")
  @UseGuards(PortalGuard)
  @HttpCode(204)
  async deleteConversation(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const identity: PortalIdentity = req.portalIdentity;
    if (!identity.user) {
      throw new BadRequestException("Authentication required");
    }

    const deleted = await this.conversation.deleteConversation(
      id,
      identity.user.id,
    );
    if (!deleted) {
      throw new NotFoundException("Conversation not found");
    }
  }

  // ─── Knowledge Base Endpoints ───

  @Get("knowledge")
  @UseGuards(PortalGuard)
  async listKnowledgeBases(@Req() req: any) {
    const identity: PortalIdentity = req.portalIdentity;
    if (!identity.user) {
      throw new BadRequestException("Authentication required");
    }
    if (identity.user.balance <= 0) {
      throw new BadRequestException(
        "Top up required to use knowledge base features",
      );
    }

    return this.knowledge.listKnowledgeBases(identity.user.id);
  }

  @Post("knowledge")
  @UseGuards(PortalGuard)
  @HttpCode(201)
  async createKnowledgeBase(@Body() body: unknown, @Req() req: any) {
    const identity: PortalIdentity = req.portalIdentity;
    if (!identity.user) {
      throw new BadRequestException("Authentication required");
    }
    if (identity.user.balance <= 0) {
      throw new BadRequestException(
        "Top up required to use knowledge base features",
      );
    }

    const { name, description } = body as {
      name?: string;
      description?: string;
    };
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new BadRequestException("Name is required");
    }

    return this.knowledge.createKnowledgeBase(identity.user.id, {
      name: name.trim(),
      description: description?.trim(),
    });
  }

  @Delete("knowledge/:id")
  @UseGuards(PortalGuard)
  @HttpCode(204)
  async deleteKnowledgeBase(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const identity: PortalIdentity = req.portalIdentity;
    if (!identity.user) {
      throw new BadRequestException("Authentication required");
    }

    await this.knowledge.deleteKnowledgeBase(identity.user.id, id);
  }

  @Post("knowledge/:id/upload")
  @UseGuards(PortalGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async uploadToKnowledgeBase(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const identity: PortalIdentity = req.portalIdentity;
    if (!identity.user) {
      throw new BadRequestException("Authentication required");
    }
    if (identity.user.balance <= 0) {
      throw new BadRequestException(
        "Top up required to use knowledge base features",
      );
    }

    const file = await req.file();
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const buffer = await file.toBuffer();
    if (buffer.length > 10 * 1024 * 1024) {
      throw new BadRequestException("File size exceeds 10 MB limit");
    }

    return this.knowledge.uploadMarkdown(identity.user.id, id, {
      filename: file.filename,
      buffer,
    });
  }

  @Get("knowledge/:id/chunks")
  @UseGuards(PortalGuard)
  async listChunks(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: any,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    const identity: PortalIdentity = req.portalIdentity;
    if (!identity.user) {
      throw new BadRequestException("Authentication required");
    }

    const l = Math.min(Math.max(parseInt(limit || "50", 10) || 50, 1), 100);
    const o = Math.max(parseInt(offset || "0", 10) || 0, 0);

    return this.knowledge.listChunks(identity.user.id, id, {
      limit: l,
      offset: o,
    });
  }

  @Delete("knowledge/:id/chunks/:chunkId")
  @UseGuards(PortalGuard)
  @HttpCode(204)
  async deleteChunk(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("chunkId", ParseUUIDPipe) chunkId: string,
    @Req() req: any,
  ) {
    const identity: PortalIdentity = req.portalIdentity;
    if (!identity.user) {
      throw new BadRequestException("Authentication required");
    }

    await this.knowledge.deleteChunk(identity.user.id, id, chunkId);
  }

  private async handleFreeRequest(
    identity: PortalIdentity,
    body: ChatCompletionRequest,
    ip: string | undefined,
    res: FastifyReply,
  ) {
    // Get or create session
    const session = await this.tierService.getOrCreateSession(
      identity.sessionId,
      ip,
    );

    if (!session) {
      throw new BadRequestException(
        "Too many sessions from this IP. Please try again later.",
      );
    }

    // Check limit
    const { allowed } = await this.tierService.canMakeRequest(
      identity.sessionId,
    );
    if (!allowed) {
      throw new BadRequestException({
        error: {
          message:
            "Free request limit reached. Register and add credits to continue.",
          type: "rate_limit_error",
          remaining: 0,
          limit: 20,
        },
      });
    }

    // Force cheapest model
    const cheapest = await this.registry.getCheapestModel();
    if (!cheapest) {
      throw new InternalServerErrorException("No models available");
    }

    // Stream response
    res.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    try {
      // Emit status: understanding
      res.raw.write(`data: ${JSON.stringify({ status: "understanding" })}\n\n`);

      // Apply prompt tuning
      const { tunedMessages, matchedTemplate } =
        await this.promptTuning.applyTuning(body.messages);

      const outputFormat =
        body.output_format || matchedTemplate?.outputFormat || null;

      // Emit status: generating (or generating_document if document intent detected)
      if (outputFormat) {
        res.raw.write(
          `data: ${JSON.stringify({ status: "generating_document" })}\n\n`,
        );
      } else {
        res.raw.write(`data: ${JSON.stringify({ status: "generating" })}\n\n`);
      }

      const stream = this.providerRouter.chatStream(cheapest.provider, {
        model: cheapest.slug,
        providerId: cheapest.providerId,
        messages: tunedMessages,
        temperature: body.temperature,
        max_tokens: body.max_tokens ?? 4096,
        reasoning_effort: body.reasoning_effort,
      });

      let fullContent = "";
      for await (const chunk of stream) {
        res.raw.write(`data: ${chunk}\n\n`);
        try {
          const parsed = JSON.parse(chunk);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) fullContent += delta;
        } catch {
          // ignore
        }
      }

      // Generate document if output_format detected
      if (outputFormat && fullContent) {
        try {
          const document = await this.documentService.generate(
            fullContent,
            outputFormat,
            this.extractLatestUserPrompt(body.messages),
          );
          res.raw.write(`data: ${JSON.stringify({ document })}\n\n`);
        } catch (err: any) {
          this.logger.error(
            `Document generation failed: ${err.message}`,
            err.stack,
          );
        }
      }

      res.raw.write("data: [DONE]\n\n");
      res.raw.end();

      // Track after successful response
      await this.tierService.trackFreeRequest(identity.sessionId);
    } catch (error: any) {
      this.logger.error(`Stream error: ${error.message}`, error.stack);
      res.raw.write(
        `data: ${JSON.stringify({ error: { message: "Stream error" } })}\n\n`,
      );
      res.raw.end();
    }
  }

  private async handlePaidRequest(
    identity: PortalIdentity,
    body: ChatCompletionRequest,
    res: FastifyReply,
  ) {
    const user = identity.user!;
    const startTime = Date.now();

    // Validate model
    const modelConfig = await this.registry.getModel(body.model);
    if (!modelConfig) {
      const available = await this.registry.getAllModels();
      throw new BadRequestException(
        `Model "${body.model}" is not supported. Available: ${available.map((m) => m.slug).join(", ")}`,
      );
    }

    const pricing = await this.registry.getUserPrice(body.model);
    if (!pricing) {
      throw new BadRequestException(`Pricing not found for "${body.model}"`);
    }

    // Estimate + reserve credits
    const estimatedTokens = this.billing.estimateTokens(body.messages);
    const estimatedCost = this.billing.estimateCost(
      estimatedTokens,
      pricing.inputPrice.toNumber(),
    );

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

    // Stream response + accumulate for billing
    res.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    let fullContent = "";
    let totalUsage = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };

    try {
      // Emit status: understanding
      res.raw.write(`data: ${JSON.stringify({ status: "understanding" })}\n\n`);

      // Check if user has knowledge bases for status indicator
      const userKbs = await this.knowledge.listKnowledgeBases(user.id);
      if (userKbs.length > 0) {
        res.raw.write(
          `data: ${JSON.stringify({ status: "searching_knowledge" })}\n\n`,
        );
      }

      // Apply prompt tuning (with user KB context)
      const { tunedMessages, matchedTemplate } =
        await this.promptTuning.applyTuning(body.messages, user.id);

      const outputFormat =
        body.output_format || matchedTemplate?.outputFormat || null;

      // Emit status: generating (or generating_document if document intent detected)
      if (outputFormat) {
        res.raw.write(
          `data: ${JSON.stringify({ status: "generating_document" })}\n\n`,
        );
      } else {
        res.raw.write(`data: ${JSON.stringify({ status: "generating" })}\n\n`);
      }

      const stream = this.providerRouter.chatStream(modelConfig.provider, {
        model: body.model,
        providerId: modelConfig.providerId,
        messages: tunedMessages,
        temperature: body.temperature,
        max_tokens: body.max_tokens ?? 4096,
        reasoning_effort: body.reasoning_effort,
      });

      for await (const chunk of stream) {
        res.raw.write(`data: ${chunk}\n\n`);

        // Accumulate content for conversation saving
        try {
          const parsed = JSON.parse(chunk);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) fullContent += delta;
          if (parsed.usage) totalUsage = parsed.usage;
        } catch {
          // ignore parse errors on individual chunks
        }
      }

      const latencyMs = Date.now() - startTime;

      // Calculate actual cost (use estimated if no usage data from stream)
      const actualTokens =
        totalUsage.total_tokens > 0
          ? totalUsage
          : {
              prompt_tokens: estimatedTokens,
              completion_tokens: Math.ceil(fullContent.length / 4),
              total_tokens: estimatedTokens + Math.ceil(fullContent.length / 4),
            };

      const actualCost = this.billing.calculateActualCost(
        actualTokens.prompt_tokens,
        actualTokens.completion_tokens,
        pricing.inputPrice.toNumber(),
        pricing.outputPrice.toNumber(),
      );

      // Adjust balance
      await this.billing.adjustBalance(user.id, reservedAmount, actualCost);

      // Log usage async
      this.usage
        .logUsage({
          userId: user.id,
          model: body.model,
          inputTokens: actualTokens.prompt_tokens,
          outputTokens: actualTokens.completion_tokens,
          cost: actualCost,
          latencyMs,
          provider: modelConfig.provider,
        })
        .catch((err) => this.logger.error("Failed to log usage", err));

      let generatedDocument:
        | {
            format: string;
            url: string;
            filename: string;
            expiresAt: string;
            key: string;
          }
        | undefined;

      if (outputFormat && fullContent) {
        try {
          generatedDocument = await this.documentService.generateWithStorage(
            fullContent,
            outputFormat,
            this.extractLatestUserPrompt(body.messages),
          );
        } catch (err: any) {
          this.logger.error(
            `Document generation failed: ${err.message}`,
            err.stack,
          );
        }
      }

      // Save conversation for paid users (always store=true)
      let conversationId: string | undefined;
      if (fullContent) {
        conversationId = await this.conversation.getOrCreateConversation(
          user.id,
          body.model,
          body.conversation_id,
        );

        const assistantContent = generatedDocument
          ? this.buildDocumentResponseText(generatedDocument)
          : fullContent;

        this.conversation
          .saveMessages(
            conversationId,
            body.messages,
            assistantContent,
            generatedDocument
              ? {
                  format: generatedDocument.format,
                  filename: generatedDocument.filename,
                  key: generatedDocument.key,
                }
              : undefined,
          )
          .then(async () => {
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
          .catch((err) =>
            this.logger.error("Failed to save conversation", err),
          );
      }

      // Emit conversation_id so frontend can continue the conversation
      if (conversationId) {
        res.raw.write(
          `data: ${JSON.stringify({ conversation_id: conversationId })}\n\n`,
        );
      }

      if (generatedDocument) {
        const document = {
          format: generatedDocument.format,
          url: generatedDocument.url,
          filename: generatedDocument.filename,
          expiresAt: generatedDocument.expiresAt,
        };
        res.raw.write(`data: ${JSON.stringify({ document })}\n\n`);
      }

      res.raw.write("data: [DONE]\n\n");
      res.raw.end();
    } catch (error: any) {
      // Refund on failure
      await this.billing.refundReservation(user.id, reservedAmount);
      this.logger.error(`Stream error: ${error.message}`, error.stack);
      res.raw.write(
        `data: ${JSON.stringify({ error: { message: "Stream error. Balance refunded." } })}\n\n`,
      );
      res.raw.end();
    }
  }

  private buildDocumentResponseText(document: {
    format: string;
    filename: string;
  }): string {
    return `I've generated your ${document.format.toUpperCase()} document: **${document.filename}**`;
  }

  private extractLatestUserPrompt(
    messages: Array<{ role: string; content: string }>,
  ): string | undefined {
    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user")
      ?.content?.trim();

    return latestUserMessage || undefined;
  }
}
