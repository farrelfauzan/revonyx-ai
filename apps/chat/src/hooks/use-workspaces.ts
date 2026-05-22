"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceInvite,
  WorkspaceQuota,
  ResolvedInvite,
} from "@/lib/workspace-types";

// ─── Query Keys ───

export const workspaceKeys = {
  all: ["workspaces"] as const,
  channel: (channelId: string) =>
    [...workspaceKeys.all, "channel", channelId] as const,
  members: (channelId: string) =>
    [...workspaceKeys.all, "members", channelId] as const,
  invites: (channelId: string) =>
    [...workspaceKeys.all, "invites", channelId] as const,
  quota: (channelId: string) =>
    [...workspaceKeys.all, "quota", channelId] as const,
};

// ─── Types ───

export interface ChannelWorkspaceResponse {
  exists: boolean;
  channelId?: string;
  channelName?: string;
  workspace?: {
    id: string;
    name: string;
    status: string;
    createdAt: string;
  };
  members?: WorkspaceMember[];
}

// ─── API Functions ───

async function fetchChannelWorkspace(
  channelId: string,
): Promise<ChannelWorkspaceResponse> {
  return apiClient.get(`/channels/${channelId}/workspace`);
}

async function createChannelWorkspace(channelId: string): Promise<Workspace> {
  return apiClient.post(`/channels/${channelId}/workspace`);
}

async function fetchMembers(channelId: string): Promise<WorkspaceMember[]> {
  return apiClient.get(`/channels/${channelId}/workspace/members`);
}

async function updateMember(
  channelId: string,
  memberId: string,
  data: { role: string },
): Promise<WorkspaceMember> {
  return apiClient.patch(
    `/channels/${channelId}/workspace/members/${memberId}`,
    data,
  );
}

async function removeMember(
  channelId: string,
  memberId: string,
): Promise<void> {
  return apiClient.delete(
    `/channels/${channelId}/workspace/members/${memberId}`,
  );
}

async function fetchInvites(channelId: string): Promise<WorkspaceInvite[]> {
  return apiClient.get(`/channels/${channelId}/workspace/invites`);
}

async function createInvite(
  channelId: string,
  data: { email: string; role: string },
): Promise<WorkspaceInvite> {
  return apiClient.post(`/channels/${channelId}/workspace/invites`, data);
}

async function resendInvite(
  channelId: string,
  inviteId: string,
): Promise<void> {
  return apiClient.post(
    `/channels/${channelId}/workspace/invites/${inviteId}/resend`,
  );
}

async function revokeInvite(
  channelId: string,
  inviteId: string,
): Promise<void> {
  return apiClient.post(
    `/channels/${channelId}/workspace/invites/${inviteId}/revoke`,
  );
}

async function fetchQuota(channelId: string): Promise<WorkspaceQuota> {
  return apiClient.get(`/channels/${channelId}/workspace/quota`);
}

async function resolveInviteToken(token: string): Promise<ResolvedInvite> {
  return apiClient.get(
    `/workspace-invites/accept?token=${encodeURIComponent(token)}`,
  );
}

async function acceptInvite(
  token: string,
): Promise<{ workspaceId: string; channelId: string | null }> {
  return apiClient.post("/workspace-invites/accept", { token });
}

// ─── Query Hooks ───

export function useChannelWorkspace(channelId: string | null) {
  return useQuery({
    queryKey: workspaceKeys.channel(channelId!),
    queryFn: () => fetchChannelWorkspace(channelId!),
    enabled: !!channelId,
    staleTime: 30_000,
  });
}

export function useWorkspaceMembers(channelId: string | null) {
  return useQuery({
    queryKey: workspaceKeys.members(channelId!),
    queryFn: () => fetchMembers(channelId!),
    enabled: !!channelId,
  });
}

export function useWorkspaceInvites(channelId: string | null) {
  return useQuery({
    queryKey: workspaceKeys.invites(channelId!),
    queryFn: () => fetchInvites(channelId!),
    enabled: !!channelId,
  });
}

export function useWorkspaceQuota(channelId: string | null) {
  return useQuery({
    queryKey: workspaceKeys.quota(channelId!),
    queryFn: () => fetchQuota(channelId!),
    enabled: !!channelId,
    staleTime: 60_000,
  });
}

export function useResolveInvite(token: string | null) {
  return useQuery({
    queryKey: ["workspace-invite", "resolve", token] as const,
    queryFn: () => resolveInviteToken(token!),
    enabled: !!token,
    retry: false,
  });
}

// ─── Mutation Hooks ───

export function useCreateChannelWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => createChannelWorkspace(channelId),
    onSuccess: (_, channelId) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.channel(channelId),
      });
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      channelId,
      data,
    }: {
      channelId: string;
      data: { email: string; role: string };
    }) => createInvite(channelId, data),
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.invites(channelId),
      });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.quota(channelId),
      });
    },
  });
}

export function useResendInvite() {
  return useMutation({
    mutationFn: ({
      channelId,
      inviteId,
    }: {
      channelId: string;
      inviteId: string;
    }) => resendInvite(channelId, inviteId),
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      channelId,
      inviteId,
    }: {
      channelId: string;
      inviteId: string;
    }) => revokeInvite(channelId, inviteId),
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.invites(channelId),
      });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      channelId,
      memberId,
      data,
    }: {
      channelId: string;
      memberId: string;
      data: { role: string };
    }) => updateMember(channelId, memberId, data),
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.members(channelId),
      });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      channelId,
      memberId,
    }: {
      channelId: string;
      memberId: string;
    }) => removeMember(channelId, memberId),
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.members(channelId),
      });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.quota(channelId),
      });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => acceptInvite(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}
