import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface PromptTemplate {
  slug: string;
  name: string;
  content: string;
  keywords: string[];
  priority: number;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

@Injectable()
export class PromptTemplateService {
  private readonly logger = new Logger(PromptTemplateService.name);

  private cachedTemplates: PromptTemplate[] = [];
  private cacheExpiresAt = 0;
  private readonly cacheTtlMs = 60_000;

  constructor(private readonly prisma: PrismaService) {}

  private async getTemplates(): Promise<PromptTemplate[]> {
    const now = Date.now();

    if (this.cachedTemplates.length > 0 && now < this.cacheExpiresAt) {
      return this.cachedTemplates;
    }

    const templates = await this.prisma.promptTemplate.findMany({
      where: { active: true },
      orderBy: { priority: "desc" },
    });

    this.cachedTemplates = templates.map((t) => ({
      slug: t.slug,
      name: t.name,
      content: t.content,
      keywords: t.keywords,
      priority: t.priority,
    }));
    this.cacheExpiresAt = now + this.cacheTtlMs;

    this.logger.debug(
      `Loaded ${templates.length} active prompt template(s) from DB`,
    );

    return this.cachedTemplates;
  }

  /**
   * Extracts user text from the last few user messages for intent classification.
   */
  private extractUserText(messages: ChatMessage[]): string {
    return messages
      .filter((m) => m.role === "user")
      .slice(-3) // last 3 user messages for context
      .map((m) => m.content)
      .join(" ")
      .toLowerCase();
  }

  /**
   * Scores each template against the user's text using keyword matching.
   * Returns the best matching template, or null if no template has any match.
   */
  async classify(messages: ChatMessage[]): Promise<PromptTemplate | null> {
    const templates = await this.getTemplates();

    if (templates.length === 0) {
      return null;
    }

    const userText = this.extractUserText(messages);

    if (!userText) {
      return null;
    }

    let bestTemplate: PromptTemplate | null = null;
    let bestScore = 0;

    for (const template of templates) {
      let score = 0;

      for (const keyword of template.keywords) {
        if (userText.includes(keyword.toLowerCase())) {
          // Multi-word keywords get higher weight
          score += keyword.includes(" ") ? 3 : 1;
        }
      }

      // Use priority as tiebreaker
      const finalScore = score * 100 + template.priority;

      if (score > 0 && finalScore > bestScore) {
        bestScore = finalScore;
        bestTemplate = template;
      }
    }

    if (bestTemplate) {
      this.logger.debug(
        `Classified intent as "${bestTemplate.slug}" (score: ${bestScore})`,
      );
    }

    return bestTemplate;
  }
}
