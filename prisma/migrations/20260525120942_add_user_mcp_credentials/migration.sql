/*
  Warnings:

  - You are about to drop the `workspace_oauth_credentials` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "workspace_oauth_credentials" DROP CONSTRAINT "workspace_oauth_credentials_workspace_id_fkey";

-- DropTable
DROP TABLE "workspace_oauth_credentials";

-- CreateTable
CREATE TABLE "user_mcp_credentials" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "env_encrypted" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "connected_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_mcp_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_mcp_credentials_user_id_workspace_id_idx" ON "user_mcp_credentials"("user_id", "workspace_id");

-- CreateIndex
CREATE INDEX "user_mcp_credentials_workspace_id_provider_idx" ON "user_mcp_credentials"("workspace_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "user_mcp_credentials_user_id_workspace_id_provider_key" ON "user_mcp_credentials"("user_id", "workspace_id", "provider");

-- AddForeignKey
ALTER TABLE "user_mcp_credentials" ADD CONSTRAINT "user_mcp_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mcp_credentials" ADD CONSTRAINT "user_mcp_credentials_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
