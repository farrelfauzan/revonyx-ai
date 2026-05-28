"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface WorkspaceKnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  workspaceId: string;
  active: boolean;
  createdAt: string;
  _count: { chunks: number };
}

export interface KnowledgeChunk {
  id: string;
  content: string;
  metadata: Record<string, unknown> | null;
  tokenCount: number;
  createdAt: string;
}

// ─── Query Keys ───

export const wsKnowledgeKeys = {
  all: (channelId: string) => ["workspace-knowledge", channelId] as const,
  list: (channelId: string) =>
    [...wsKnowledgeKeys.all(channelId), "list"] as const,
  chunks: (channelId: string, kbId: string) =>
    [...wsKnowledgeKeys.all(channelId), "chunks", kbId] as const,
};

// ─── Query Hooks ───

export function useWorkspaceKnowledgeBases(channelId: string | null) {
  return useQuery({
    queryKey: wsKnowledgeKeys.list(channelId!),
    queryFn: () =>
      apiClient.get<WorkspaceKnowledgeBase[]>(
        `/channels/${channelId}/workspace/knowledge`,
      ),
    enabled: !!channelId,
    staleTime: 30_000,
  });
}

export function useWorkspaceKnowledgeChunks(
  channelId: string | null,
  kbId: string | null,
) {
  return useQuery({
    queryKey: wsKnowledgeKeys.chunks(channelId!, kbId!),
    queryFn: () =>
      apiClient.get<{ chunks: KnowledgeChunk[]; total: number }>(
        `/channels/${channelId}/workspace/knowledge/${kbId}/chunks`,
      ),
    enabled: !!channelId && !!kbId,
  });
}

// ─── Mutation Hooks ───

export function useCreateWorkspaceKB() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      channelId,
      data,
    }: {
      channelId: string;
      data: { name: string; description?: string };
    }) => apiClient.post(`/channels/${channelId}/workspace/knowledge`, data),
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({
        queryKey: wsKnowledgeKeys.list(channelId),
      });
    },
  });
}

export function useDeleteWorkspaceKB() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, kbId }: { channelId: string; kbId: string }) =>
      apiClient.delete(`/channels/${channelId}/workspace/knowledge/${kbId}`),
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({
        queryKey: wsKnowledgeKeys.list(channelId),
      });
    },
  });
}

export function useAddWorkspaceChunks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      channelId,
      kbId,
      chunks,
    }: {
      channelId: string;
      kbId: string;
      chunks: { content: string; metadata?: Record<string, unknown> }[];
    }) =>
      apiClient.post(
        `/channels/${channelId}/workspace/knowledge/${kbId}/chunks`,
        { chunks },
      ),
    onSuccess: (_, { channelId, kbId }) => {
      queryClient.invalidateQueries({
        queryKey: wsKnowledgeKeys.chunks(channelId, kbId),
      });
      queryClient.invalidateQueries({
        queryKey: wsKnowledgeKeys.list(channelId),
      });
    },
  });
}

export function useDeleteWorkspaceChunk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      channelId,
      kbId,
      chunkId,
    }: {
      channelId: string;
      kbId: string;
      chunkId: string;
    }) =>
      apiClient.delete(
        `/channels/${channelId}/workspace/knowledge/${kbId}/chunks/${chunkId}`,
      ),
    onSuccess: (_, { channelId, kbId }) => {
      queryClient.invalidateQueries({
        queryKey: wsKnowledgeKeys.chunks(channelId, kbId),
      });
      queryClient.invalidateQueries({
        queryKey: wsKnowledgeKeys.list(channelId),
      });
    },
  });
}

export function useSearchWorkspaceKnowledge() {
  return useMutation({
    mutationFn: ({
      channelId,
      query,
      topK,
    }: {
      channelId: string;
      query: string;
      topK?: number;
    }) =>
      apiClient.post(`/channels/${channelId}/workspace/knowledge/search`, {
        query,
        topK,
      }),
  });
}
