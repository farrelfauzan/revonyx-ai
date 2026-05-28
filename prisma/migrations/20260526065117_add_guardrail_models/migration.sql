-- CreateTable
CREATE TABLE "guardrail_violations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "agent_id" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "input" TEXT,
    "output" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardrail_violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardrail_configs" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT,
    "enable_input_filter" BOOLEAN NOT NULL DEFAULT true,
    "enable_output_filter" BOOLEAN NOT NULL DEFAULT true,
    "enable_pii_masking" BOOLEAN NOT NULL DEFAULT false,
    "enable_injection_check" BOOLEAN NOT NULL DEFAULT true,
    "toxicity_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "max_response_length" INTEGER NOT NULL DEFAULT 16000,
    "blocked_topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "guardrail_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guardrail_violations_user_id_createdAt_idx" ON "guardrail_violations"("user_id", "createdAt");

-- CreateIndex
CREATE INDEX "guardrail_violations_type_createdAt_idx" ON "guardrail_violations"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "guardrail_configs_agent_id_key" ON "guardrail_configs"("agent_id");

-- AddForeignKey
ALTER TABLE "guardrail_violations" ADD CONSTRAINT "guardrail_violations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardrail_violations" ADD CONSTRAINT "guardrail_violations_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardrail_configs" ADD CONSTRAINT "guardrail_configs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
