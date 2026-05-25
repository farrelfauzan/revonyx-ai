import { z } from "zod";

export const CreateMcpServerSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().optional(),
  transport: z.enum(["stdio", "sse"]).optional().default("stdio"),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  url: z.url().optional(),
  /** Environment variables for the MCP server (tokens, keys, etc.). Encrypted at rest. */
  env: z.record(z.string(), z.string()).optional(),
});

export type CreateMcpServerDto = z.infer<typeof CreateMcpServerSchema>;

export const AttachMcpServerSchema = z.object({
  mcpServerId: z.string().uuid(),
  allowedTools: z.array(z.string()).optional(),
});

export type AttachMcpServerDto = z.infer<typeof AttachMcpServerSchema>;

export const UpdateAgentMcpToolsSchema = z.object({
  allowedTools: z.array(z.string()).nullable().optional(),
});

export type UpdateAgentMcpToolsDto = z.infer<typeof UpdateAgentMcpToolsSchema>;
