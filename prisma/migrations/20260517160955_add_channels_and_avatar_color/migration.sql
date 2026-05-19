-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "avatar_color" TEXT DEFAULT '#6366f1';

-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT DEFAULT '#6366f1',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_agents" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'primary',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_chat_rooms" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'General',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "channel_chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_messages" (
    "id" TEXT NOT NULL,
    "chat_room_id" TEXT NOT NULL,
    "agent_id" TEXT,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokens" INTEGER,
    "cost" DECIMAL(12,6),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "channels_userId_idx" ON "channels"("userId");

-- CreateIndex
CREATE INDEX "channel_agents_channel_id_idx" ON "channel_agents"("channel_id");

-- CreateIndex
CREATE INDEX "channel_agents_agent_id_idx" ON "channel_agents"("agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "channel_agents_channel_id_agent_id_key" ON "channel_agents"("channel_id", "agent_id");

-- CreateIndex
CREATE INDEX "channel_chat_rooms_channel_id_idx" ON "channel_chat_rooms"("channel_id");

-- CreateIndex
CREATE INDEX "channel_messages_chat_room_id_idx" ON "channel_messages"("chat_room_id");

-- CreateIndex
CREATE INDEX "channel_messages_agent_id_idx" ON "channel_messages"("agent_id");

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_agents" ADD CONSTRAINT "channel_agents_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_agents" ADD CONSTRAINT "channel_agents_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_chat_rooms" ADD CONSTRAINT "channel_chat_rooms_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_messages" ADD CONSTRAINT "channel_messages_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "channel_chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
