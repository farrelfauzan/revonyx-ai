import { z } from "zod";

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
});

export type InviteMemberDto = z.infer<typeof InviteMemberSchema>;
