import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

export interface EmbeddingResult {
  embedding: number[];
  tokenCount: number;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.together.xyz/v1";
  private readonly model = "intfloat/multilingual-e5-large-instruct";

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>("TOGETHER_API_KEY");
  }

  async embed(texts: string[]): Promise<EmbeddingResult[]> {
    const response = await axios.post(
      `${this.baseUrl}/embeddings`,
      {
        model: this.model,
        input: texts,
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

    return data.data.map((item: any) => ({
      embedding: item.embedding,
      tokenCount: data.usage?.total_tokens
        ? Math.ceil(data.usage.total_tokens / texts.length)
        : Math.ceil(texts[data.data.indexOf(item)]?.length / 4),
    }));
  }

  async embedSingle(text: string): Promise<EmbeddingResult> {
    const results = await this.embed([text]);
    return results[0];
  }
}
