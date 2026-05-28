import { z } from "zod";

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  avatar: z.string().url().nullable().optional(),
});

export type UpdateWorkspaceDto = z.infer<typeof UpdateWorkspaceSchema>;
