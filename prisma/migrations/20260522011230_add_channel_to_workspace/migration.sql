/*
  Warnings:

  - A unique constraint covering the columns `[channel_id]` on the table `workspaces` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "workspaces_owner_id_slug_key";

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "channel_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_channel_id_key" ON "workspaces"("channel_id");

-- CreateIndex
CREATE INDEX "workspaces_channel_id_idx" ON "workspaces"("channel_id");

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
