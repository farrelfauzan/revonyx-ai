-- CreateTable
CREATE TABLE "user_memories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "source_message_id" TEXT,
    "source_conversation_id" TEXT,
    "lastConfirmedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ,
    "is_user_pinned" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_memories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_memories_userId_status_idx" ON "user_memories"("userId", "status");

-- CreateIndex
CREATE INDEX "user_memories_userId_type_idx" ON "user_memories"("userId", "type");

-- AddForeignKey
ALTER TABLE "user_memories" ADD CONSTRAINT "user_memories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
