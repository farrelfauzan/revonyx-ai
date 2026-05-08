const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export async function portalFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const sessionToken = getOrCreateSessionToken();
  const jwt =
    typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Portal-Session": sessionToken,
    ...(options.headers as Record<string, string>),
  };
  if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function getOrCreateSessionToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem("portal_session");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("portal_session", token);
  }
  return token;
}

export type StreamStatus =
  | "understanding"
  | "searching_knowledge"
  | "generating";

export function streamCompletion(
  messages: { role: string; content: string }[],
  model?: string,
  onChunk?: (text: string) => void,
  onDone?: (conversationId?: string) => void,
  onError?: (err: Error) => void,
  conversationId?: string,
  onStatus?: (status: StreamStatus) => void,
): AbortController {
  const controller = new AbortController();
  const sessionToken = getOrCreateSessionToken();
  const jwt =
    typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Portal-Session": sessionToken,
  };
  if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

  let receivedConversationId: string | undefined;

  fetch(`${API_BASE}/chat/portal/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      messages,
      ...(model ? { model } : {}),
      ...(conversationId ? { conversation_id: conversationId } : {}),
    }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Request failed: ${res.status}`);
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              onDone?.(receivedConversationId);
              return;
            }
            try {
              const parsed = JSON.parse(data);
              // Check for status event
              if (parsed.status) {
                onStatus?.(parsed.status);
                continue;
              }
              // Check for conversation_id event
              if (parsed.conversation_id) {
                receivedConversationId = parsed.conversation_id;
                continue;
              }
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) onChunk?.(content);
            } catch {
              // skip non-JSON lines
            }
          }
        }
      }
      onDone?.(receivedConversationId);
    })
    .catch((err) => {
      if (err.name !== "AbortError") onError?.(err);
    });

  return controller;
}

// ─── Conversation History API ───

export interface ConversationSummary {
  id: string;
  title: string | null;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetail {
  id: string;
  title: string | null;
  model: string;
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
  }[];
}

export async function fetchConversations(
  limit = 20,
  offset = 0,
): Promise<{ data: ConversationSummary[]; total: number }> {
  return portalFetch(
    `/chat/portal/conversations?limit=${limit}&offset=${offset}`,
  );
}

export async function fetchConversation(
  id: string,
): Promise<ConversationDetail> {
  return portalFetch(`/chat/portal/conversations/${id}`);
}

export async function deleteConversation(id: string): Promise<void> {
  const sessionToken = getOrCreateSessionToken();
  const jwt =
    typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

  const headers: Record<string, string> = {
    "X-Portal-Session": sessionToken,
  };
  if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

  const res = await fetch(`${API_BASE}/chat/portal/conversations/${id}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
}

// ─── Knowledge Base API ───

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { chunks: number };
}

export interface KnowledgeChunk {
  id: string;
  content: string;
  metadata: Record<string, unknown> | null;
  tokenCount: number;
  createdAt: string;
}

export async function fetchKnowledgeBases(): Promise<KnowledgeBase[]> {
  return portalFetch("/chat/portal/knowledge");
}

export async function createKnowledgeBase(data: {
  name: string;
  description?: string;
}): Promise<KnowledgeBase> {
  return portalFetch("/chat/portal/knowledge", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteKnowledgeBase(id: string): Promise<void> {
  const sessionToken = getOrCreateSessionToken();
  const jwt =
    typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

  const headers: Record<string, string> = {
    "X-Portal-Session": sessionToken,
  };
  if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

  const res = await fetch(`${API_BASE}/chat/portal/knowledge/${id}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
}

export async function uploadKnowledgeBaseFile(
  knowledgeBaseId: string,
  file: File,
): Promise<{ filename: string; s3Key: string; chunksInserted: number }> {
  const sessionToken = getOrCreateSessionToken();
  const jwt =
    typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

  const headers: Record<string, string> = {
    "X-Portal-Session": sessionToken,
  };
  if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(
    `${API_BASE}/chat/portal/knowledge/${knowledgeBaseId}/upload`,
    {
      method: "POST",
      headers,
      body: formData,
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Upload failed: ${res.status}`);
  }

  return res.json();
}

export async function fetchKnowledgeChunks(
  knowledgeBaseId: string,
  limit = 50,
  offset = 0,
): Promise<{ chunks: KnowledgeChunk[]; total: number }> {
  return portalFetch(
    `/chat/portal/knowledge/${knowledgeBaseId}/chunks?limit=${limit}&offset=${offset}`,
  );
}

export async function deleteKnowledgeChunk(
  knowledgeBaseId: string,
  chunkId: string,
): Promise<void> {
  const sessionToken = getOrCreateSessionToken();
  const jwt =
    typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

  const headers: Record<string, string> = {
    "X-Portal-Session": sessionToken,
  };
  if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

  const res = await fetch(
    `${API_BASE}/chat/portal/knowledge/${knowledgeBaseId}/chunks/${chunkId}`,
    {
      method: "DELETE",
      headers,
    },
  );

  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
}
