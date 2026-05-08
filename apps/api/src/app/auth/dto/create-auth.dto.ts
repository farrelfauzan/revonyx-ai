import { z } from "zod";

export const RegisterDto = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
export type RegisterDto = z.infer<typeof RegisterDto>;

export const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginDto = z.infer<typeof LoginDto>;
