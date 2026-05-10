import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useState, useEffect } from "react";
import type { StreamStatus } from "./api";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

interface ChatState {
  messages: Message[];
  conversationId: string | null;
  isStreaming: boolean;
  streamingContent: string;
  streamStatus: StreamStatus | null;
  selectedModel: string | null;
  addMessage: (msg: Omit<Message, "id" | "createdAt">) => void;
  setStreaming: (val: boolean) => void;
  setStreamStatus: (status: StreamStatus | null) => void;
  appendStreamContent: (chunk: string) => void;
  finalizeStream: (isJson?: boolean) => void;
  setSelectedModel: (model: string | null) => void;
  setConversationId: (id: string | null) => void;
  loadConversation: (
    messages: Omit<Message, "id" | "createdAt">[],
    conversationId: string,
  ) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      conversationId: null,
      isStreaming: false,
      streamingContent: "",
      streamStatus: null,
      selectedModel: null,

      addMessage: (msg) =>
        set((s) => ({
          messages: [
            ...s.messages,
            { ...msg, id: crypto.randomUUID(), createdAt: Date.now() },
          ],
        })),

      setStreaming: (val) =>
        set({
          isStreaming: val,
          streamingContent: val ? "" : get().streamingContent,
          streamStatus: val ? null : null,
        }),

      setStreamStatus: (status) => set({ streamStatus: status }),

      appendStreamContent: (chunk) =>
        set((s) => ({ streamingContent: s.streamingContent + chunk })),

      finalizeStream: (isJson) => {
        let content = get().streamingContent;
        if (content) {
          if (isJson) {
            // Pretty-print and wrap in markdown code block for nice rendering
            try {
              const parsed = JSON.parse(content);
              content = "```json\n" + JSON.stringify(parsed, null, 2) + "\n```";
            } catch {
              // If not valid JSON, render as-is
            }
          }
          get().addMessage({ role: "assistant", content });
        }
        set({ isStreaming: false, streamingContent: "", streamStatus: null });
      },

      setSelectedModel: (model) => set({ selectedModel: model }),

      setConversationId: (id) => set({ conversationId: id }),

      loadConversation: (msgs, conversationId) =>
        set({
          messages: msgs.map((m) => ({
            ...m,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
          })),
          conversationId,
          streamingContent: "",
          isStreaming: false,
        }),

      clearChat: () =>
        set({
          messages: [],
          conversationId: null,
          streamingContent: "",
          streamStatus: null,
          isStreaming: false,
        }),
    }),
    {
      name: "performa-chat",
      partialize: (state) => ({ selectedModel: state.selectedModel }),
    },
  ),
);

// Auth store
interface AuthState {
  jwt: string | null;
  email: string | null;
  balance: number | null;
  setAuth: (jwt: string, email: string, balance: number) => void;
  setBalance: (balance: number) => void;
  logout: () => void;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      jwt: null,
      email: null,
      balance: null,
      setAuth: (jwt, email, balance) => {
        if (typeof window !== "undefined") localStorage.setItem("jwt", jwt);
        set({ jwt, email, balance });
      },
      setBalance: (balance) => set({ balance }),
      logout: () => {
        if (typeof window !== "undefined") localStorage.removeItem("jwt");
        set({ jwt: null, email: null, balance: null });
      },
      isLoggedIn: () => !!get().jwt,
    }),
    { name: "performa-auth" },
  ),
);

/**
 * Returns true only after Zustand persist stores have rehydrated from
 * localStorage on the client. Use this to guard any UI that depends on
 * persisted state (auth, etc.) to avoid SSR/client hydration mismatches.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
