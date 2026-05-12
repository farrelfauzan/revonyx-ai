"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageSquare,
  BookOpen,
  Plus,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useChatStore, useAuthStore, useHydrated } from "@/lib/stores";
import {
  useConversations,
  useDeleteConversation,
} from "@/hooks/use-conversations";
import {
  useKnowledgeBases,
  useDeleteKnowledgeBase,
  useKnowledgeChunks,
  useDeleteKnowledgeChunk,
} from "@/hooks/use-knowledge";
import { fetchConversation } from "@/lib/api";
import { KBUploadDialog } from "./kb-upload-dialog";
import type { ConversationSummary } from "@/lib/api";

type Tab = "chats" | "knowledge";

export function AppSidebar() {
  const [tab, setTab] = useState<Tab>("chats");
  const hydrated = useHydrated();
  const { isLoggedIn } = useAuthStore();
  const loggedIn = hydrated && isLoggedIn();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border">
        {/* Tab switcher */}
        <div className="flex">
          <button
            onClick={() => setTab("chats")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors rounded-md cursor-pointer ${
              tab === "chats"
                ? "text-sidebar-foreground bg-sidebar-accent"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chats
          </button>
          <button
            onClick={() => setTab("knowledge")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors rounded-md cursor-pointer ${
              tab === "knowledge"
                ? "text-sidebar-foreground bg-sidebar-accent"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Knowledge
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {!loggedIn ? (
          <div className="flex items-center justify-center h-full px-4">
            <p className="text-xs text-sidebar-foreground/60 text-center">
              Sign in and top up to access chat history and knowledge base.
            </p>
          </div>
        ) : tab === "chats" ? (
          <ChatsContent />
        ) : (
          <KnowledgeContent />
        )}
      </SidebarContent>
    </Sidebar>
  );
}

// ─── Chats Content ───

function ChatsContent() {
  const { data, isLoading } = useConversations(50, 0);
  const deleteMutation = useDeleteConversation();
  const {
    loadConversation,
    clearChat,
    conversationId,
    isStreaming,
    streamingConversationId,
    setConversationId,
  } = useChatStore();

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      if (conversationId === id) {
        clearChat();
      }
    } catch {
      // silently fail
    }
  };

  const handleLoadConversation = async (conv: ConversationSummary) => {
    if (isStreaming && streamingConversationId === conv.id) {
      setConversationId(conv.id);
      return;
    }

    try {
      const detail = await fetchConversation(conv.id);
      loadConversation(
        detail.messages.map((m) => ({
          role: m.role,
          content: m.content,
          ...(m.document ? { document: m.document } : {}),
        })),
        detail.id,
      );
    } catch {
      // silently fail
    }
  };

  const grouped = groupByDate(data?.data ?? []);

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={clearChat} className="gap-2 hover:bg-secondary/60 cursor-pointer">
              <Plus className="h-4 w-4" />
              <span>New Chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarSeparator />

      {isLoading ? (
        <SidebarGroup>
          <SidebarMenu>
            {[...Array(5)].map((_, i) => (
              <SidebarMenuItem key={i}>
                <div className="h-8 rounded-md bg-sidebar-accent/50 animate-pulse" />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ) : (data?.data?.length ?? 0) === 0 ? (
        <SidebarGroup>
          <div className="flex items-center justify-center py-8">
            <p className="text-xs text-sidebar-foreground/60">
              No conversations yet
            </p>
          </div>
        </SidebarGroup>
      ) : (
        grouped.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.conversations.map((conv) => (
                  <SidebarMenuItem key={conv.id}>
                    <SidebarMenuButton
                      isActive={conversationId === conv.id}
                      onClick={() => handleLoadConversation(conv)}
                      tooltip={conv.title || "Untitled"}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>{conv.title || "Untitled"}</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      showOnHover
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDeleteConversation(conv.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))
      )}
    </>
  );
}

// ─── Knowledge Content ───

function KnowledgeContent() {
  const [showUpload, setShowUpload] = useState(false);
  const [expandedKB, setExpandedKB] = useState<string | null>(null);
  const { data: knowledgeBases, isLoading } = useKnowledgeBases();
  const deleteMutation = useDeleteKnowledgeBase();

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setShowUpload(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Knowledge Base</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarSeparator />

      {isLoading ? (
        <SidebarGroup>
          <SidebarMenu>
            {[...Array(3)].map((_, i) => (
              <SidebarMenuItem key={i}>
                <div className="h-10 rounded-md bg-sidebar-accent/50 animate-pulse" />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ) : !knowledgeBases || knowledgeBases.length === 0 ? (
        <SidebarGroup>
          <div className="flex items-center justify-center py-8 px-4">
            <p className="text-xs text-sidebar-foreground/60 text-center">
              Upload .md files to give the AI context from your own documents.
            </p>
          </div>
        </SidebarGroup>
      ) : (
        <SidebarGroup>
          <SidebarGroupLabel>Your Knowledge Bases</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {knowledgeBases.map((kb) => (
                <SidebarMenuItem key={kb.id}>
                  <SidebarMenuButton
                    onClick={() =>
                      setExpandedKB(expandedKB === kb.id ? null : kb.id)
                    }
                  >
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${
                        expandedKB === kb.id ? "rotate-90" : ""
                      }`}
                    />
                    <span className="flex-1 truncate">{kb.name}</span>
                    <span className="text-[10px] text-sidebar-foreground/50">
                      {kb._count.chunks}
                    </span>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    showOnHover
                    onClick={() => deleteMutation.mutate(kb.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </SidebarMenuAction>

                  <AnimatePresence>
                    {expandedKB === kb.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <KBChunksList knowledgeBaseId={kb.id} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      <KBUploadDialog open={showUpload} onClose={() => setShowUpload(false)} />
    </>
  );
}

// ─── KB Chunks List (Expanded) ───

function KBChunksList({ knowledgeBaseId }: { knowledgeBaseId: string }) {
  const { data, isLoading } = useKnowledgeChunks(knowledgeBaseId);
  const deleteMutation = useDeleteKnowledgeChunk();

  if (isLoading) {
    return (
      <div className="px-4 py-2 text-[10px] text-sidebar-foreground/60">
        Loading...
      </div>
    );
  }

  if (!data?.chunks?.length) {
    return (
      <div className="px-4 py-2 text-[10px] text-sidebar-foreground/60">
        No chunks
      </div>
    );
  }

  return (
    <div className="px-4 pb-2 space-y-1 max-h-40 overflow-y-auto">
      {data.chunks.slice(0, 10).map((chunk) => (
        <div
          key={chunk.id}
          className="flex items-start gap-1.5 rounded bg-sidebar-accent/30 px-2 py-1.5"
        >
          <p className="text-[10px] text-sidebar-foreground/60 flex-1 line-clamp-2">
            {chunk.content.slice(0, 100)}...
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0"
            onClick={() =>
              deleteMutation.mutate({ knowledgeBaseId, chunkId: chunk.id })
            }
          >
            <Trash2 className="h-2.5 w-2.5 text-destructive" />
          </Button>
        </div>
      ))}
      {data.total > 10 && (
        <p className="text-[10px] text-sidebar-foreground/60 text-center">
          +{data.total - 10} more chunks
        </p>
      )}
    </div>
  );
}

// ─── Helpers ───

function groupByDate(conversations: ConversationSummary[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const last7 = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; conversations: ConversationSummary[] }[] = [
    { label: "Today", conversations: [] },
    { label: "Yesterday", conversations: [] },
    { label: "Last 7 days", conversations: [] },
    { label: "Older", conversations: [] },
  ];

  for (const conv of conversations) {
    const date = new Date(conv.updatedAt);
    if (date >= today) {
      groups[0].conversations.push(conv);
    } else if (date >= yesterday) {
      groups[1].conversations.push(conv);
    } else if (date >= last7) {
      groups[2].conversations.push(conv);
    } else {
      groups[3].conversations.push(conv);
    }
  }

  return groups.filter((g) => g.conversations.length > 0);
}
