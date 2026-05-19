-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parent_agent_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "avatar" TEXT,
    "system_prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "max_tokens" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "agent_type" TEXT NOT NULL DEFAULT 'standalone',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_integrations" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "scopes" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'connected',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "agent_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_tools" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "tool_type" TEXT NOT NULL,
    "config" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_knowledge_bases" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "knowledge_base_id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_knowledge_bases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_channels" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "channel_type" TEXT NOT NULL,
    "config" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "agent_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_runs" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "channel_type" TEXT NOT NULL,
    "external_user_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_messages" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tool_calls" JSONB,
    "tool_result" JSONB,
    "tokens" INTEGER,
    "cost" DECIMAL(12,6),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "current_period_start" TIMESTAMPTZ NOT NULL,
    "current_period_end" TIMESTAMPTZ NOT NULL,
    "messages_used" INTEGER NOT NULL DEFAULT 0,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "agent_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agents_userId_status_idx" ON "agents"("userId", "status");

-- CreateIndex
CREATE INDEX "agents_parent_agent_id_idx" ON "agents"("parent_agent_id");

-- CreateIndex
CREATE INDEX "agents_is_public_idx" ON "agents"("is_public");

-- CreateIndex
CREATE UNIQUE INDEX "agents_userId_slug_key" ON "agents"("userId", "slug");

-- CreateIndex
CREATE INDEX "agent_integrations_agentId_idx" ON "agent_integrations"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_integrations_agentId_provider_key" ON "agent_integrations"("agentId", "provider");

-- CreateIndex
CREATE INDEX "agent_tools_agentId_idx" ON "agent_tools"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_knowledge_bases_agentId_knowledge_base_id_key" ON "agent_knowledge_bases"("agentId", "knowledge_base_id");

-- CreateIndex
CREATE INDEX "agent_channels_channel_type_status_idx" ON "agent_channels"("channel_type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "agent_channels_agentId_channel_type_key" ON "agent_channels"("agentId", "channel_type");

-- CreateIndex
CREATE INDEX "agent_runs_agentId_idx" ON "agent_runs"("agentId");

-- CreateIndex
CREATE INDEX "agent_runs_session_id_idx" ON "agent_runs"("session_id");

-- CreateIndex
CREATE INDEX "agent_runs_external_user_id_idx" ON "agent_runs"("external_user_id");

-- CreateIndex
CREATE INDEX "agent_messages_run_id_idx" ON "agent_messages"("run_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_subscriptions_userId_key" ON "agent_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "agent_subscriptions_userId_status_idx" ON "agent_subscriptions"("userId", "status");

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_parent_agent_id_fkey" FOREIGN KEY ("parent_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_integrations" ADD CONSTRAINT "agent_integrations_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_tools" ADD CONSTRAINT "agent_tools_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_knowledge_bases" ADD CONSTRAINT "agent_knowledge_bases_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_knowledge_bases" ADD CONSTRAINT "agent_knowledge_bases_knowledge_base_id_fkey" FOREIGN KEY ("knowledge_base_id") REFERENCES "knowledge_bases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_channels" ADD CONSTRAINT "agent_channels_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_subscriptions" ADD CONSTRAINT "agent_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
