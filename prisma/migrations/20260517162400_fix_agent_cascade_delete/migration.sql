-- DropForeignKey
ALTER TABLE "agent_runs" DROP CONSTRAINT "agent_runs_agentId_fkey";

-- AddForeignKey
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
