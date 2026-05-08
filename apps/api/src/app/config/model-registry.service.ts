import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Decimal } from "@prisma/client/runtime/client";
import { PrismaService } from "../prisma/prisma.service";

export interface ModelConfig {
  slug: string;
  modelName: string;
  provider: string;
  providerId: string;
  inputPrice: Decimal;
  outputPrice: Decimal;
  maxTokens: number;
}

const CACHE_TTL_MS = 60_000; // 60 seconds

@Injectable()
export class ModelRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ModelRegistryService.name);
  private models = new Map<string, ModelConfig>();
  private markupMultiplier = new Decimal(2);
  private lastRefresh = 0;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const [aiModels, markupConfig] = await Promise.all([
      this.prisma.aiModel.findMany({ where: { active: true } }),
      this.prisma.appConfig.findUnique({ where: { key: "markup_multiplier" } }),
    ]);

    const map = new Map<string, ModelConfig>();
    for (const m of aiModels) {
      map.set(m.slug, {
        slug: m.slug,
        modelName: m.modelName,
        provider: m.provider,
        providerId: m.providerId,
        inputPrice: m.inputPrice,
        outputPrice: m.outputPrice,
        maxTokens: m.maxTokens,
      });
    }
    this.models = map;

    if (markupConfig) {
      this.markupMultiplier = new Decimal(markupConfig.value);
    }

    this.lastRefresh = Date.now();
    this.logger.log(
      `Loaded ${map.size} models, markup=${this.markupMultiplier}`,
    );
  }

  private async ensureFresh(): Promise<void> {
    if (Date.now() - this.lastRefresh > CACHE_TTL_MS) {
      await this.refresh();
    }
  }

  async getModel(slug: string): Promise<ModelConfig | undefined> {
    await this.ensureFresh();
    return this.models.get(slug);
  }

  async getAllModels(): Promise<ModelConfig[]> {
    await this.ensureFresh();
    return [...this.models.values()];
  }

  async getMarkup(): Promise<Decimal> {
    await this.ensureFresh();
    return this.markupMultiplier;
  }

  async getUserPrice(
    slug: string,
  ): Promise<{ inputPrice: Decimal; outputPrice: Decimal } | undefined> {
    await this.ensureFresh();
    const model = this.models.get(slug);
    if (!model) return undefined;
    return {
      inputPrice: model.inputPrice.mul(this.markupMultiplier),
      outputPrice: model.outputPrice.mul(this.markupMultiplier),
    };
  }

  async getCheapestModel(): Promise<ModelConfig | undefined> {
    await this.ensureFresh();
    const models = [...this.models.values()];
    if (models.length === 0) return undefined;
    return models.sort(
      (a, b) =>
        a.inputPrice.add(a.outputPrice).toNumber() -
        b.inputPrice.add(b.outputPrice).toNumber(),
    )[0];
  }
}
