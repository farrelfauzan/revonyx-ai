"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchKnowledgeBases,
  createKnowledgeBase,
  deleteKnowledgeBase,
  uploadKnowledgeBaseFile,
  fetchKnowledgeChunks,
  deleteKnowledgeChunk,
} from "@/lib/api";
import { useAuthStore } from "@/lib/stores";

export function useKnowledgeBases() {
  const { isLoggedIn } = useAuthStore();

  return useQuery({
    queryKey: ["knowledge-bases"],
    queryFn: fetchKnowledgeBases,
    enabled: isLoggedIn(),
    staleTime: 30_000,
  });
}

export function useCreateKnowledgeBase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      createKnowledgeBase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
    },
  });
}

export function useDeleteKnowledgeBase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteKnowledgeBase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
    },
  });
}

export function useUploadKBFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      knowledgeBaseId,
      file,
    }: {
      knowledgeBaseId: string;
      file: File;
    }) => uploadKnowledgeBaseFile(knowledgeBaseId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-chunks"] });
    },
  });
}

export function useKnowledgeChunks(knowledgeBaseId: string | null) {
  return useQuery({
    queryKey: ["knowledge-chunks", knowledgeBaseId],
    queryFn: () => fetchKnowledgeChunks(knowledgeBaseId!),
    enabled: !!knowledgeBaseId,
    staleTime: 30_000,
  });
}

export function useDeleteKnowledgeChunk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      knowledgeBaseId,
      chunkId,
    }: {
      knowledgeBaseId: string;
      chunkId: string;
    }) => deleteKnowledgeChunk(knowledgeBaseId, chunkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-chunks"] });
    },
  });
}
