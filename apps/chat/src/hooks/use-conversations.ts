"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchConversations,
  fetchConversation,
  deleteConversation,
} from "@/lib/api";
import { useAuthStore } from "@/lib/stores";

export function useConversations(limit = 20, offset = 0) {
  const { isLoggedIn } = useAuthStore();

  return useQuery({
    queryKey: ["conversations", limit, offset],
    queryFn: () => fetchConversations(limit, offset),
    enabled: isLoggedIn(),
    staleTime: 30_000,
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: ["conversation", id],
    queryFn: () => fetchConversation(id!),
    enabled: !!id,
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
