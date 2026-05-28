"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/stores";

export interface UserMcpCredential {
  id: string;
  provider: string;
  status: "connected" | "expired" | "revoked";
  connectedAt: string;
  expiresAt: string | null;
}

// ─── Query Keys ───

export const userMcpKeys = {
  all: ["user-mcp"] as const,
  credentials: (workspaceId: string | null) =>
    [...userMcpKeys.all, "credentials", workspaceId] as const,
};

// ─── API Functions ───

async function fetchUserCredentials(
  workspaceId: string,
): Promise<UserMcpCredential[]> {
  return apiClient.get(`/mcp/user/credentials?workspaceId=${workspaceId}`);
}

async function startUserOAuth(
  provider: string,
  workspaceId: string,
): Promise<{ authUrl: string }> {
  return apiClient.get(
    `/mcp/user/oauth/start?provider=${provider}&workspaceId=${workspaceId}`,
  );
}

async function disconnectUserMcp(
  provider: string,
  workspaceId: string,
): Promise<void> {
  return apiClient.delete(
    `/mcp/user/credentials/${provider}?workspaceId=${workspaceId}`,
  );
}

async function connectWithToken(
  provider: string,
  workspaceId: string,
  env: Record<string, string>,
): Promise<{ connected: boolean; provider: string }> {
  return apiClient.post("/mcp/user/connect", { provider, workspaceId, env });
}

// ─── Hooks ───

export function useUserMcpCredentials(workspaceId: string | null) {
  const { isLoggedIn } = useAuthStore();
  return useQuery({
    queryKey: userMcpKeys.credentials(workspaceId),
    queryFn: () => fetchUserCredentials(workspaceId!),
    enabled: isLoggedIn() && !!workspaceId,
    staleTime: 30_000,
  });
}

export function useStartUserOAuth() {
  return useMutation({
    mutationFn: ({
      provider,
      workspaceId,
    }: {
      provider: string;
      workspaceId: string;
    }) => startUserOAuth(provider, workspaceId),
  });
}

export function useDisconnectUserMcp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      provider,
      workspaceId,
    }: {
      provider: string;
      workspaceId: string;
    }) => disconnectUserMcp(provider, workspaceId),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: userMcpKeys.credentials(workspaceId),
      });
    },
  });
}

export function useConnectWithToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      provider,
      workspaceId,
      env,
    }: {
      provider: string;
      workspaceId: string;
      env: Record<string, string>;
    }) => connectWithToken(provider, workspaceId, env),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userMcpKeys.all });
    },
  });
}
