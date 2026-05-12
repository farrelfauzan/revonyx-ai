import { z } from "zod";

export const ExportRequestSchema = z.object({
  markdown: z.string().min(1).max(100_000),
  format: z.enum(["pdf", "docx", "xlsx"]),
  filename: z.string().min(1).max(200).optional(),
});

export type ExportRequest = z.infer<typeof ExportRequestSchema>;
