import { z } from "zod";

export const UpdateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  avatar: z.string().max(255).optional().nullable(),
  avatarColor: z.string().max(7).optional().nullable(),
  systemPrompt: z.string().min(1).max(10000).optional(),
  model: z.string().min(1).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(128000).optional().nullable(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  isPublic: z.boolean().optional(),
  agentType: z.enum(["standalone", "parent", "sub_agent"]).optional(),
  parentAgentId: z.string().uuid().optional().nullable(),
});

export type UpdateAgentDto = z.infer<typeof UpdateAgentSchema>;
