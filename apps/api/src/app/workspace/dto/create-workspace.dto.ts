import { z } from "zod";

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});

export type CreateWorkspaceDto = z.infer<typeof CreateWorkspaceSchema>;
