"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  McpServer,
  McpTool,
  AgentMcpServer,
  McpRegistryEntry,
  CreateMcpServerPayload,
} from "@/lib/mcp-types";
import { useAuthStore } from "@/lib/stores";

// ─── Query Keys ───

export const mcpKeys = {
  all: ["mcp"] as const,
  servers: () => [...mcpKeys.all, "servers"] as const,
  registry: () => [...mcpKeys.all, "registry"] as const,
  serverTools: (id: string) =>
    [...mcpKeys.all, "servers", id, "tools"] as const,
  agentMcp: (agentId: string) => [...mcpKeys.all, "agent", agentId] as const,
};

// ─── API Functions ───

async function fetchMcpServers(): Promise<McpServer[]> {
  return apiClient.get("/mcp/servers");
}

async function fetchMcpRegistry(): Promise<McpRegistryEntry[]> {
  const data = await apiClient.get<Record<string, any>>("/mcp/registry");
  return Object.entries(data).map(([name, info]) => ({
    name,
    displayName: info.displayName,
    description: info.description,
    package: info.package,
    transport: "stdio" as const,
    envKeys: info.envKeys,
    authType: info.authType || "token",
    docsUrl: info.docsUrl,
  }));
}

async function startGoogleOAuth(
  provider: string,
  workspaceId: string,
): Promise<{ authUrl: string }> {
  return apiClient.get(
    `/mcp/oauth/google/start?provider=${provider}&workspaceId=${workspaceId}`,
  );
}

async function checkGoogleCredentials(
  workspaceId: string,
): Promise<{ hasCredentials: boolean }> {
  return apiClient.get(
    `/mcp/oauth/google/credentials?workspaceId=${workspaceId}`,
  );
}

async function saveGoogleCredentials(data: {
  workspaceId: string;
  clientId: string;
  clientSecret: string;
}): Promise<{ saved: boolean }> {
  return apiClient.post("/mcp/oauth/google/credentials", data);
}

async function fetchServerTools(serverId: string): Promise<McpTool[]> {
  const res = await apiClient.get<{ tools: McpTool[] }>(
    `/mcp/servers/${serverId}/tools`,
  );
  return res.tools;
}

async function createMcpServer(
  data: CreateMcpServerPayload,
): Promise<McpServer> {
  return apiClient.post("/mcp/servers", data);
}

async function testMcpConnection(
  serverId: string,
): Promise<{ status: string }> {
  return apiClient.post(`/mcp/servers/${serverId}/test`);
}

async function deleteMcpServer(serverId: string): Promise<void> {
  return apiClient.delete(`/mcp/servers/${serverId}`);
}

async function fetchAgentMcpServers(
  agentId: string,
): Promise<AgentMcpServer[]> {
  return apiClient.get(`/mcp/agents/${agentId}/mcp`);
}

async function attachMcpToAgent(
  agentId: string,
  data: { mcpServerId: string; allowedTools?: string[] },
): Promise<AgentMcpServer> {
  return apiClient.post(`/mcp/agents/${agentId}/mcp`, data);
}

async function updateAgentMcpTools(
  agentId: string,
  serverId: string,
  allowedTools: string[] | null,
): Promise<AgentMcpServer> {
  return apiClient.patch(`/mcp/agents/${agentId}/mcp/${serverId}`, {
    allowedTools,
  });
}

async function detachMcpFromAgent(
  agentId: string,
  serverId: string,
): Promise<void> {
  return apiClient.delete(`/mcp/agents/${agentId}/mcp/${serverId}`);
}

// ─── Hooks ───

export function useMcpServers() {
  const { isLoggedIn } = useAuthStore();
  return useQuery({
    queryKey: mcpKeys.servers(),
    queryFn: fetchMcpServers,
    enabled: isLoggedIn(),
    staleTime: 30_000,
  });
}

export function useMcpRegistry() {
  const { isLoggedIn } = useAuthStore();
  return useQuery({
    queryKey: mcpKeys.registry(),
    queryFn: fetchMcpRegistry,
    enabled: isLoggedIn(),
    staleTime: 60_000,
  });
}

export function useMcpServerTools(serverId: string) {
  return useQuery({
    queryKey: mcpKeys.serverTools(serverId),
    queryFn: () => fetchServerTools(serverId),
    enabled: !!serverId,
    staleTime: 60_000,
  });
}

export function useCreateMcpServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMcpServerPayload) => createMcpServer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mcpKeys.servers() });
    },
  });
}

export function useTestMcpConnection() {
  return useMutation({
    mutationFn: (serverId: string) => testMcpConnection(serverId),
  });
}

export function useDeleteMcpServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serverId: string) => deleteMcpServer(serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mcpKeys.servers() });
    },
  });
}

export function useStartGoogleOAuth() {
  return useMutation({
    mutationFn: ({
      provider,
      workspaceId,
    }: {
      provider: string;
      workspaceId: string;
    }) => startGoogleOAuth(provider, workspaceId),
  });
}

export function useGoogleCredentials(workspaceId: string | null) {
  const { isLoggedIn } = useAuthStore();
  return useQuery({
    queryKey: [...mcpKeys.all, "google-credentials", workspaceId] as const,
    queryFn: () => checkGoogleCredentials(workspaceId!),
    enabled: isLoggedIn() && !!workspaceId,
    staleTime: 60_000,
  });
}

export function useSaveGoogleCredentials() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      workspaceId: string;
      clientId: string;
      clientSecret: string;
    }) => saveGoogleCredentials(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...mcpKeys.all, "google-credentials"],
      });
    },
  });
}

export function useAgentMcpServers(agentId: string) {
  return useQuery({
    queryKey: mcpKeys.agentMcp(agentId),
    queryFn: () => fetchAgentMcpServers(agentId),
    enabled: !!agentId,
  });
}

export function useAttachMcpToAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      data,
    }: {
      agentId: string;
      data: { mcpServerId: string; allowedTools?: string[] };
    }) => attachMcpToAgent(agentId, data),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: mcpKeys.agentMcp(agentId) });
    },
  });
}

export function useUpdateAgentMcpTools() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      serverId,
      allowedTools,
    }: {
      agentId: string;
      serverId: string;
      allowedTools: string[] | null;
    }) => updateAgentMcpTools(agentId, serverId, allowedTools),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: mcpKeys.agentMcp(agentId) });
    },
  });
}

export function useDetachMcpFromAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      serverId,
    }: {
      agentId: string;
      serverId: string;
    }) => detachMcpFromAgent(agentId, serverId),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: mcpKeys.agentMcp(agentId) });
    },
  });
}
