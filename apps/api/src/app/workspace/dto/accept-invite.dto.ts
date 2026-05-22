import { z } from "zod";

export const AcceptInviteSchema = z.object({
  token: z.string().min(1),
});

export type AcceptInviteDto = z.infer<typeof AcceptInviteSchema>;
