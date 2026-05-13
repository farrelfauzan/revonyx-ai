"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMemories,
  updateMemory,
  deleteMemory,
  clearAllMemories,
} from "@/lib/api";
import { useAuthStore } from "@/lib/stores";

export function useMemories() {
  const { isLoggedIn } = useAuthStore();

  return useQuery({
    queryKey: ["memories"],
    queryFn: () => fetchMemories(),
    enabled: isLoggedIn(),
    staleTime: 60_000,
  });
}

export function useUpdateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { content?: string; isUserPinned?: boolean };
    }) => updateMemory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMemory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}

export function useClearMemories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clearAllMemories(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}
