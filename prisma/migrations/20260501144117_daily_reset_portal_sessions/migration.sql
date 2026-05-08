/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `portal_sessions` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "portal_sessions_expiresAt_idx";

-- AlterTable
ALTER TABLE "portal_sessions" DROP COLUMN "expiresAt",
ADD COLUMN     "lastResetAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "portal_sessions_lastResetAt_idx" ON "portal_sessions"("lastResetAt");
