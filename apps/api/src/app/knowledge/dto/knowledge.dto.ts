import { z } from "zod";

export const CreateKnowledgeBaseSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});

export type CreateKnowledgeBaseRequest = z.infer<
  typeof CreateKnowledgeBaseSchema
>;

export const UpdateKnowledgeBaseSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  active: z.boolean().optional(),
});

export type UpdateKnowledgeBaseRequest = z.infer<
  typeof UpdateKnowledgeBaseSchema
>;

export const AddChunksSchema = z.object({
  chunks: z
    .array(
      z.object({
        content: z.string().min(1).max(100_000),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .min(1)
    .max(100),
});

export type AddChunksRequest = z.infer<typeof AddChunksSchema>;

export const SearchChunksSchema = z.object({
  query: z.string().min(1).max(10_000),
  knowledgeBaseId: z.string().uuid().optional(),
  topK: z.number().int().min(1).max(50).default(5),
});

export type SearchChunksRequest = z.infer<typeof SearchChunksSchema>;
