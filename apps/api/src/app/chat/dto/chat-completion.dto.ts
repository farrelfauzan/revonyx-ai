import { z } from "zod";

export const ChatCompletionRequestSchema = z.object({
  model: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().min(1).max(100_000),
      }),
    )
    .min(1)
    .max(100),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().min(1).max(128000).optional(),
  conversation_id: z.string().uuid().optional(),
  store: z.boolean().default(false),
});

export type ChatCompletionRequest = z.infer<typeof ChatCompletionRequestSchema>;
