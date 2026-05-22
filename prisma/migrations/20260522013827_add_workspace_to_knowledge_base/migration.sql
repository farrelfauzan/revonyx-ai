-- AlterTable
ALTER TABLE "knowledge_bases" ADD COLUMN     "workspace_id" TEXT;

-- CreateIndex
CREATE INDEX "knowledge_bases_workspace_id_idx" ON "knowledge_bases"("workspace_id");

-- AddForeignKey
ALTER TABLE "knowledge_bases" ADD CONSTRAINT "knowledge_bases_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
