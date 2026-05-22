import { z } from "zod";

export const UpdateMemberSchema = z.object({
  role: z.enum(["admin", "member", "viewer"]).optional(),
  status: z.enum(["active", "removed"]).optional(),
});

export type UpdateMemberDto = z.infer<typeof UpdateMemberSchema>;
