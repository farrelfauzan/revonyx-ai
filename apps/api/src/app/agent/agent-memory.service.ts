import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ProviderRouter } from "../providers/provider-router";
import { ModelRegistryService } from "../config/model-registry.service";

@Injectable()
export class AgentMemoryService {
  private readonly logger = new Logger(AgentMemoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerRouter: ProviderRouter,
    private readonly registry: ModelRegistryService,
  ) {}

  async getMemoryContext(agentId: string, userId: string): Promise<string> {
    const memories = await this.prisma.userMemory.findMany({
      where: {
        userId,
        status: "active",
        // Filter by sourceConversationId containing agentId prefix pattern
        // or memories without agent scope (global user memories)
      },
      orderBy: { confidence: "desc" },
      take: 20,
    });

    if (memories.length === 0) return "";

    return memories.map((m) => `- [${m.type}] ${m.content}`).join("\n");
  }

  async extractAndStore(
    agentId: string,
    userId: string,
    userMessage: string,
    assistantResponse: string,
  ): Promise<void> {
    try {
      const cheapestModel = await this.registry.getCheapestModel();
      if (!cheapestModel) return;

      const extractionPrompt = `Analyze this conversation and extract key facts about the user that would be useful to remember for future conversations.

User message: "${userMessage}"
Assistant response: "${assistantResponse}"

Extract facts in JSON format. Return an empty array if no notable facts.
Format: [{"type": "interest|preference|context", "content": "the fact", "confidence": 0.5-1.0}]

Rules:
- Only extract genuinely useful facts (preferences, interests, context)
- Do not extract trivial or obvious information
- Confidence should reflect how certain the fact is
- Return [] if nothing noteworthy`;

      const response = await this.providerRouter.chat(cheapestModel.provider, {
        model: cheapestModel.slug,
        providerId: cheapestModel.providerId,
        messages: [
          {
            role: "system",
            content:
              "You extract user facts from conversations. Respond only with valid JSON.",
          },
          { role: "user", content: extractionPrompt },
        ],
        temperature: 0.1,
        max_tokens: 500,
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) return;

      // Parse JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return;

      const facts = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(facts) || facts.length === 0) return;

      // Store each fact
      for (const fact of facts.slice(0, 3)) {
        if (!fact.content || !fact.type) continue;

        // Check for duplicates
        const existing = await this.prisma.userMemory.findFirst({
          where: {
            userId,
            content: { contains: fact.content.substring(0, 50) },
            status: "active",
          },
        });

        if (existing) {
          // Update confidence
          await this.prisma.userMemory.update({
            where: { id: existing.id },
            data: {
              confidence: Math.min(1, existing.confidence + 0.1),
              lastConfirmedAt: new Date(),
            },
          });
        } else {
          await this.prisma.userMemory.create({
            data: {
              userId,
              type: fact.type,
              content: fact.content,
              confidence: fact.confidence || 0.75,
              sourceConversationId: `agent:${agentId}`,
              status: "active",
            },
          });
        }
      }
    } catch (err: any) {
      this.logger.warn(`Memory extraction failed: ${err.message}`);
    }
  }

  async storeExplicit(
    agentId: string,
    userId: string,
    fact: string,
    type: string,
  ): Promise<void> {
    await this.prisma.userMemory.create({
      data: {
        userId,
        type,
        content: fact,
        confidence: 1.0,
        sourceConversationId: `agent:${agentId}`,
        status: "active",
      },
    });
  }
}
