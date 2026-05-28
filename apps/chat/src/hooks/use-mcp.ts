"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { McpServer, McpRegistryEntry } from "@/lib/mcp-types";
import { useAuthStore } from "@/lib/stores";

// ─── Query Keys ───

export const mcpKeys = {
  all: ["mcp"] as const,
  servers: () => [...mcpKeys.all, "servers"] as const,
  registry: () => [...mcpKeys.all, "registry"] as const,
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

async function testMcpConnection(
  credentialId: string,
): Promise<{ status: string }> {
  return apiClient.post(`/mcp/servers/${credentialId}/test`);
}

async function deleteMcpServer(credentialId: string): Promise<void> {
  return apiClient.delete(`/mcp/servers/${credentialId}`);
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

export function useTestMcpConnection() {
  return useMutation({
    mutationFn: (credentialId: string) => testMcpConnection(credentialId),
  });
}

export function useDeleteMcpServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentialId: string) => deleteMcpServer(credentialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mcpKeys.servers() });
    },
  });
}
