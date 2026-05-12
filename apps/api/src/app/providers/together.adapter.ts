import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import {
  ChatRequest,
  ChatResponse,
  ProviderAdapter,
} from "./provider.interface";

@Injectable()
export class TogetherAdapter implements ProviderAdapter {
  private readonly logger = new Logger(TogetherAdapter.name);
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.together.xyz/v1";

  // Models that support reasoning_effort parameter
  private readonly modelsWithReasoningSupport = [
    "MiniMaxAI/MiniMax-M2.7",
    "deepseek-ai/DeepSeek-V4-Pro",
    "zai-org/GLM-5.1",
    "zai-org/GLM-5",
    "moonshotai/Kimi-K2.6",
    "moonshotai/Kimi-K2.5",
    "Qwen/Qwen3.6-Plus",
    "Qwen/Qwen3.5-397B-A17B",
    "Qwen/Qwen3.5-9B",
    "deepcogito/cogito-v2-1-671b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
  ];

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>("TOGETHER_API_KEY");
  }

  private supportsReasoning(modelId: string): boolean {
    return this.modelsWithReasoningSupport.includes(modelId);
  }

  async chat(params: ChatRequest): Promise<ChatResponse> {
    const body: Record<string, unknown> = {
      model: params.providerId,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.max_tokens ?? 4096,
    };

    // Only add reasoning_effort for models that support it
    if (this.supportsReasoning(params.providerId) && params.reasoning_effort) {
      body.reasoning_effort = params.reasoning_effort;
    }

    if (params.response_format) {
      body.response_format = params.response_format;
    }

    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      body,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    const data = response.data;

    return {
      id: data.id,
      model: params.model,
      choices: data.choices.map((c: any, i: number) => ({
        index: i,
        message: {
          role: c.message.role,
          content: c.message.content,
        },
        finish_reason: c.finish_reason,
      })),
      usage: {
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens,
      },
    };
  }

  async *chatStream(
    params: ChatRequest,
  ): AsyncGenerator<string, void, unknown> {
    const body: Record<string, unknown> = {
      model: params.providerId,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.max_tokens ?? 4096,
      stream: true,
    };

    // Only add reasoning_effort for models that support it
    if (this.supportsReasoning(params.providerId) && params.reasoning_effort) {
      body.reasoning_effort = params.reasoning_effort;
    }

    if (params.response_format) {
      body.response_format = params.response_format;
    }

    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      body,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
        responseType: "stream",
      },
    );

    const stream = response.data as NodeJS.ReadableStream;
    let buffer = "";

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const payload = trimmed.slice(6);
        if (payload === "[DONE]") return;
        yield payload;
      }
    }
  }
}
