import { Injectable, Logger } from "@nestjs/common";
import {
  ProviderAdapter,
  ChatRequest,
  ChatResponse,
} from "./provider.interface";
import { TogetherAdapter } from "./together.adapter";

@Injectable()
export class ProviderRouter {
  private readonly logger = new Logger(ProviderRouter.name);
  private readonly adapters: Record<string, ProviderAdapter>;

  constructor(private readonly togetherAdapter: TogetherAdapter) {
    this.adapters = {
      together: this.togetherAdapter,
    };
  }

  async chat(provider: string, params: ChatRequest): Promise<ChatResponse> {
    const adapter = this.adapters[provider];
    if (!adapter) {
      throw new Error(`No adapter found for provider: ${provider}`);
    }

    try {
      return await adapter.chat(params);
    } catch (error: any) {
      this.logger.error(
        `Provider ${provider} failed: ${error.message}`,
        error.stack,
      );

      // TODO: Add fallback provider logic here (e.g. try Groq if Together fails)
      throw error;
    }
  }

  async *chatStream(
    provider: string,
    params: ChatRequest,
  ): AsyncGenerator<string, void, unknown> {
    const adapter = this.adapters[provider];
    if (!adapter) {
      throw new Error(`No adapter found for provider: ${provider}`);
    }

    if (!adapter.chatStream) {
      throw new Error(`Provider ${provider} does not support streaming`);
    }

    yield* adapter.chatStream(params);
  }
}
