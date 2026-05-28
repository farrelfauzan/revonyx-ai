export interface McpServer {
  id: string;
  name: string;
  displayName: string;
  transport: "stdio" | "sse";
  isGlobal: boolean;
  status: "connected" | "expired" | "revoked";
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
