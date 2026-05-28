"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface ChannelAgent {
  id: string;
  name: string;
  avatar?: string;
  avatarColor?: string;
  description?: string;
  status: string;
  model?: string;
}

export interface ChannelAgentLink {
  id: string;
  channelId: string;
  agentId: string;
  role: string;
  agent: ChannelAgent;
}

export interface Channel {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  color?: string;
  agents: ChannelAgentLink[];
  _count?: { agents: number };
  createdAt: string;
  updatedAt: string;
}

export interface ChannelMessage {
  id: string;
  channelAgentId: string;
  role: "user" | "assistant";
  content: string;
  tokens?: number;
  createdAt: string;
  document?: {
    format: string;
    url: string;
    filename: string;
    expiresAt: string;
  };
}

// ─── Query Keys ───

export const channelKeys = {
  all: ["channels"] as const,
  list: () => [...channelKeys.all, "list"] as const,
  detail: (id: string) => [...channelKeys.all, "detail", id] as const,
  messages: (channelId: string, agentId: string) =>
    [...channelKeys.all, "messages", channelId, agentId] as const,
};

// ─── Hooks ───

export function useChannels() {
  return useQuery({
    queryKey: channelKeys.list(),
    queryFn: () => apiClient.get<Channel[]>("/channels"),
    staleTime: 30_000,
  });
}

export function useChannel(id: string | null) {
  return useQuery({
    queryKey: channelKeys.detail(id!),
    queryFn: () => apiClient.get<Channel>(`/channels/${id}`),
    enabled: !!id,
  });
}

export function useChannelMessages(
  channelId: string | null,
  agentId: string | null,
) {
  return useQuery({
    queryKey: channelKeys.messages(channelId!, agentId!),
    queryFn: () =>
      apiClient.get<ChannelMessage[]>(
        `/channels/${channelId}/agents/${agentId}/messages`,
      ),
    enabled: !!channelId && !!agentId,
    refetchInterval: false,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; icon?: string; color?: string }) =>
      apiClient.post<Channel>("/channels", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.list() });
    },
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; icon?: string; color?: string };
    }) => apiClient.patch<Channel>(`/channels/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: channelKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: channelKeys.list() });
    },
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/channels/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.list() });
    },
  });
}

export function useAddChannelAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      channelId,
      agentId,
      role,
    }: {
      channelId: string;
      agentId: string;
      role?: string;
    }) => apiClient.post(`/channels/${channelId}/agents`, { agentId, role }),
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({
        queryKey: channelKeys.detail(channelId),
      });
      queryClient.invalidateQueries({ queryKey: channelKeys.list() });
    },
  });
}

export function useRemoveChannelAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      channelId,
      agentId,
    }: {
      channelId: string;
      agentId: string;
    }) => apiClient.delete(`/channels/${channelId}/agents/${agentId}`),
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({
        queryKey: channelKeys.detail(channelId),
      });
      queryClient.invalidateQueries({ queryKey: channelKeys.list() });
    },
  });
}

export function useClearMessages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      channelId,
      agentId,
    }: {
      channelId: string;
      agentId: string;
    }) => apiClient.delete(`/channels/${channelId}/agents/${agentId}/messages`),
    onSuccess: (_, { channelId, agentId }) => {
      queryClient.invalidateQueries({
        queryKey: channelKeys.messages(channelId, agentId),
      });
    },
  });
}

export function useUploadChannelIcon() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient.post<{ icon: string }>(
        "/channels/upload-icon",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
    },
  });
}
