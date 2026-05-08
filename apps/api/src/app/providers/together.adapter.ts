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

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>("TOGETHER_API_KEY");
  }

  async chat(params: ChatRequest): Promise<ChatResponse> {
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: params.providerId,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.max_tokens ?? 4096,
      },
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
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: params.providerId,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.max_tokens ?? 4096,
        stream: true,
      },
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
