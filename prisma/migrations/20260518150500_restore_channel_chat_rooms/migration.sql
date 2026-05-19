-- Restore channel chat rooms model and migrate message linkage back to room-based schema.

-- 1) Recreate chat rooms table when missing.
CREATE TABLE IF NOT EXISTS "channel_chat_rooms" (
  "id" TEXT NOT NULL,
  "channel_id" TEXT NOT NULL,
  "name" TEXT NOT NULL DEFAULT 'general',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "channel_chat_rooms_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "channel_chat_rooms_channel_id_idx"
  ON "channel_chat_rooms"("channel_id");

-- 2) Add room-based columns back to channel_messages.
ALTER TABLE "channel_messages"
  ADD COLUMN IF NOT EXISTS "chat_room_id" TEXT,
  ADD COLUMN IF NOT EXISTS "agent_id" TEXT;

-- 3) Ensure each channel has a default room.
INSERT INTO "channel_chat_rooms" ("id", "channel_id", "name", "createdAt", "updatedAt")
SELECT c."id", c."id", 'general', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "channels" c
WHERE NOT EXISTS (
  SELECT 1
  FROM "channel_chat_rooms" r
  WHERE r."channel_id" = c."id"
);

-- 4) Backfill new columns from simplified linkage.
UPDATE "channel_messages" cm
SET
  "chat_room_id" = r."id",
  "agent_id" = ca."agent_id"
FROM "channel_agents" ca
JOIN "channel_chat_rooms" r ON r."channel_id" = ca."channel_id"
WHERE cm."channel_agent_id" = ca."id"
  AND (cm."chat_room_id" IS NULL OR cm."agent_id" IS NULL);

-- 5) Swap constraints/indexes to room-based model.
DROP INDEX IF EXISTS "channel_messages_channel_agent_id_user_id_idx";
DROP INDEX IF EXISTS "channel_messages_user_id_idx";

ALTER TABLE "channel_messages"
  DROP CONSTRAINT IF EXISTS "channel_messages_channel_agent_id_fkey";
ALTER TABLE "channel_messages"
  DROP CONSTRAINT IF EXISTS "channel_messages_user_id_fkey";

ALTER TABLE "channel_messages"
  ALTER COLUMN "chat_room_id" SET NOT NULL;

ALTER TABLE "channel_messages"
  DROP COLUMN IF EXISTS "channel_agent_id",
  DROP COLUMN IF EXISTS "user_id";

CREATE INDEX IF NOT EXISTS "channel_messages_chat_room_id_idx"
  ON "channel_messages"("chat_room_id");
CREATE INDEX IF NOT EXISTS "channel_messages_agent_id_idx"
  ON "channel_messages"("agent_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'channel_chat_rooms_channel_id_fkey'
  ) THEN
    ALTER TABLE "channel_chat_rooms"
      ADD CONSTRAINT "channel_chat_rooms_channel_id_fkey"
      FOREIGN KEY ("channel_id") REFERENCES "channels"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'channel_messages_chat_room_id_fkey'
  ) THEN
    ALTER TABLE "channel_messages"
      ADD CONSTRAINT "channel_messages_chat_room_id_fkey"
      FOREIGN KEY ("chat_room_id") REFERENCES "channel_chat_rooms"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
