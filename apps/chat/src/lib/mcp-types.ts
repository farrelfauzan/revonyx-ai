export interface McpServer {
  id: string;
  name: string;
  displayName: string;
  transport: "stdio" | "sse";
  isGlobal: boolean;
  status: "connected" | "disconnected" | "error";
  createdAt: string;
  updatedAt: string;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface AgentMcpServer {
  id: string;
  agentId: string;
  mcpServerId: string;
  mcpServer: McpServer;
  allowedTools: string[] | null;
  createdAt: string;
}

export interface McpRegistryEntry {
  name: string;
  displayName: string;
  description: string;
  package: string;
  transport: "stdio" | "sse";
  envKeys: string[];
  authType: "oauth" | "token" | "api_key";
  docsUrl?: string;
}

export interface CreateMcpServerPayload {
  name: string;
  displayName?: string;
  transport?: "stdio" | "sse";
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}
