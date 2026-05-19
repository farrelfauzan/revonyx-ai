import AgentChatPageClient from "@/components/agents/agent-chat-page-client";

type AgentChatPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AgentChatPage({ params }: AgentChatPageProps) {
  return <AgentChatPageClient params={params} />;
}
