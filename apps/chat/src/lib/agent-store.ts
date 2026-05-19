import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Agent {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
  avatarColor?: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens?: number;
  status: "draft" | "active" | "archived";
  isPublic: boolean;
  agentType: "standalone" | "parent" | "sub_agent";
  parentAgentId?: string;
  tools: AgentTool[];
  integrations: AgentIntegration[];
  knowledgeBases: AgentKnowledgeBaseRef[];
  channels: AgentChannel[];
  subAgents?: { id: string; name: string; status: string }[];
  _count?: { runs: number };
  createdAt: string;
  updatedAt: string;
}

export interface AgentTool {
  id: string;
  agentId: string;
  toolType: string;
  config?: Record<string, any>;
  enabled: boolean;
}

export interface AgentIntegration {
  id: string;
  agentId: string;
  provider: string;
  config: Record<string, any>;
  scopes: string[];
  status: string;
}

export interface AgentKnowledgeBaseRef {
  id: string;
  agentId: string;
  knowledgeBaseId: string;
  knowledgeBase?: { id: string; name: string; description?: string };
}

export interface AgentChannel {
  id: string;
  agentId: string;
  channelType: string;
  config?: Record<string, any>;
  status: string;
}

export interface AgentRun {
  id: string;
  agentId: string;
  sessionId: string;
  channelType: string;
  status: string;
  messages?: AgentMessage[];
  _count?: { messages: number };
  createdAt: string;
  updatedAt: string;
}

export interface AgentMessage {
  id: string;
  runId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls?: any;
  toolResult?: any;
  tokens?: number;
  cost?: string;
  createdAt: string;
}

export interface AgentBuilderDraft {
  name: string;
  description?: string;
  avatar?: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens?: number;
  isPublic: boolean;
  agentType: "standalone" | "parent" | "sub_agent";
  parentAgentId?: string;
  tools: string[];
  knowledgeBaseIds: string[];
}

interface AgentState {
  // Agent list
  agents: Agent[];
  setAgents: (agents: Agent[]) => void;

  // Selected agent
  selectedAgentId: string | null;
  setSelectedAgentId: (id: string | null) => void;

  // Agent builder
  builderStep: number;
  setBuilderStep: (step: number) => void;
  builderDraft: AgentBuilderDraft;
  updateBuilderDraft: (partial: Partial<AgentBuilderDraft>) => void;
  resetBuilderDraft: () => void;

  // Agent chat
  activeRunId: string | null;
  setActiveRunId: (id: string | null) => void;
  agentMessages: AgentMessage[];
  setAgentMessages: (messages: AgentMessage[]) => void;
  addAgentMessage: (msg: AgentMessage) => void;
  isAgentStreaming: boolean;
  setAgentStreaming: (val: boolean) => void;
  streamingAgentContent: string;
  setStreamingAgentContent: (content: string) => void;
  appendStreamingAgentContent: (chunk: string) => void;
  streamingRunId: string | null;
  setStreamingRunId: (id: string | null) => void;
}

const defaultBuilderDraft: AgentBuilderDraft = {
  name: "",
  systemPrompt: "",
  model: "",
  temperature: 0.7,
  isPublic: false,
  agentType: "standalone",
  tools: [],
  knowledgeBaseIds: [],
};

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: [],
      setAgents: (agents) => set({ agents }),

      selectedAgentId: null,
      setSelectedAgentId: (id) => set({ selectedAgentId: id }),

      builderStep: 0,
      setBuilderStep: (step) => set({ builderStep: step }),
      builderDraft: { ...defaultBuilderDraft },
      updateBuilderDraft: (partial) =>
        set((s) => ({
          builderDraft: { ...s.builderDraft, ...partial },
        })),
      resetBuilderDraft: () =>
        set({ builderDraft: { ...defaultBuilderDraft }, builderStep: 0 }),

      activeRunId: null,
      setActiveRunId: (id) => set({ activeRunId: id }),
      agentMessages: [],
      setAgentMessages: (messages) => set({ agentMessages: messages }),
      addAgentMessage: (msg) =>
        set((s) => ({ agentMessages: [...s.agentMessages, msg] })),
      isAgentStreaming: false,
      setAgentStreaming: (val) => set({ isAgentStreaming: val }),
      streamingAgentContent: "",
      setStreamingAgentContent: (content) =>
        set({ streamingAgentContent: content }),
      appendStreamingAgentContent: (chunk) =>
        set((s) => ({
          streamingAgentContent: s.streamingAgentContent + chunk,
        })),
      streamingRunId: null,
      setStreamingRunId: (id) => set({ streamingRunId: id }),
    }),
    {
      name: "agent-store",
      partialize: (state) => ({
        selectedAgentId: state.selectedAgentId,
        builderDraft: state.builderDraft,
        builderStep: state.builderStep,
      }),
    },
  ),
);
