import AgentDetailPageClient from "@/components/agents/agent-detail-page-client";

type AgentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  return <AgentDetailPageClient params={params} />;
}
