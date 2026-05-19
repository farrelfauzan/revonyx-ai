/*
  Warnings:

  - You are about to drop the column `agent_id` on the `channel_messages` table. All the data in the column will be lost.
  - You are about to drop the column `chat_room_id` on the `channel_messages` table. All the data in the column will be lost.
  - You are about to drop the `channel_chat_rooms` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `channel_agent_id` to the `channel_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `channel_messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "channel_chat_rooms" DROP CONSTRAINT "channel_chat_rooms_channel_id_fkey";

-- DropForeignKey
ALTER TABLE "channel_messages" DROP CONSTRAINT "channel_messages_chat_room_id_fkey";

-- DropIndex
DROP INDEX "channel_messages_agent_id_idx";

-- DropIndex
DROP INDEX "channel_messages_chat_room_id_idx";

-- AlterTable
ALTER TABLE "channel_messages" DROP COLUMN "agent_id",
DROP COLUMN "chat_room_id",
ADD COLUMN     "channel_agent_id" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "channel_chat_rooms";

-- CreateIndex
CREATE INDEX "channel_messages_channel_agent_id_user_id_idx" ON "channel_messages"("channel_agent_id", "user_id");

-- CreateIndex
CREATE INDEX "channel_messages_user_id_idx" ON "channel_messages"("user_id");

-- AddForeignKey
ALTER TABLE "channel_messages" ADD CONSTRAINT "channel_messages_channel_agent_id_fkey" FOREIGN KEY ("channel_agent_id") REFERENCES "channel_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_messages" ADD CONSTRAINT "channel_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
