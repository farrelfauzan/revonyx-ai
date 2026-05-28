/*
  Warnings:

  - You are about to drop the `agent_mcp_servers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mcp_servers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "agent_mcp_servers" DROP CONSTRAINT "agent_mcp_servers_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "agent_mcp_servers" DROP CONSTRAINT "agent_mcp_servers_mcp_server_id_fkey";

-- DropForeignKey
ALTER TABLE "mcp_servers" DROP CONSTRAINT "mcp_servers_user_id_fkey";

-- DropTable
DROP TABLE "agent_mcp_servers";

-- DropTable
DROP TABLE "mcp_servers";
