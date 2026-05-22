# PR Description

## Summary
This PR introduces a full AI Agents platform across database, API, and chat UI, adds channel orchestration capabilities, improves provider/tool-calling reliability, and rebrands product-facing text from Revonyx to Renovix AI.

## What Changed

### 1. Provider + Model Routing Improvements (API)
- Added model resolution by `providerId` in model registry.
- Extended provider request contract to support tools (`tools`, `tool_choice`).
- Added richer provider router logging for chat and stream paths.
- Upgraded Together adapter:
  - Tool-calling payload support
  - Retry with exponential backoff for transient errors
  - Longer request timeouts for stability
  - Better stream lifecycle and error logging

### 2. Database Schema + Migrations (Agents + Channels)
- Added AI agent domain models:
  - `Agent`, `AgentTool`, `AgentIntegration`, `AgentKnowledgeBase`, `AgentChannel`
  - `AgentRun`, `AgentMessage`, `AgentSubscription`
- Added channel system models:
  - `Channel`, `ChannelAgent`, `ChannelChatRoom`, `ChannelMessage`
- Linked users and knowledge bases to the new agent/channel relations.
- Added migrations:
  - `20260517135402_add_ai_agent_portal`
  - `20260517160955_add_channels_and_avatar_color`
  - `20260517162400_fix_agent_cascade_delete`
  - `20260518004904_simplify_channel_model`
  - `20260518150500_restore_channel_chat_rooms`
- Added `prisma/seed-agents.ts` for agent seed/setup data.
- Added `bcryptjs` dependency for agent/auth related flows.

### 3. API Backend Modules (Agents + Channels)
- Registered new modules in app bootstrap:
  - `AgentModule`
  - `ChannelModule`
- Added comprehensive agent backend implementation:
  - Agent CRUD
  - Agent run/chat flow
  - Agent tool and memory services
- Added channel backend implementation:
  - Channel management and chat services
  - Channel integrations and GoWA webhook handling

### 4. Chat Frontend: AI Agents Portal
- Added new route group and pages under `apps/chat/src/app/agents`:
  - Agent list, create, detail, explore, and per-agent chat pages
- Added agent-focused UI components and tabs:
  - Settings, tools, sub-agents, knowledge, deployments, integrations
- Added new hooks and client state modules:
  - `use-agents`, `use-agent-chat`, `use-channels`, `use-channel-chat`
  - `agent-store`
- Updated sidebar/navigation to expose AI Agents and related sections.
- Added knowledge and memory pages aligned with the new navigation model.

### 5. Branding Update
- Renamed product references from **Revonyx** to **Renovix AI** in:
  - Chat metadata and UI copy
  - System knowledge defaults
  - Seeded identity prompts
  - README branding references

### 6. Documentation
- Added strategy and test planning docs:
  - `AGENT_CHAT_IMPROVEMENT_PLAN.md`
  - `AGENT_SUBAGENT_SIMPLE_TEST.md`
  - `AI_AGENT_PORTAL_STRATEGY.md`

## Commit Breakdown
1. `feat(api): add provider tool-calling and together reliability`
2. `feat(db): add ai agents and channel schema with migrations`
3. `feat(api): add ai agent and channel backend modules`
4. `feat(chat): add ai agents and channel portal interface`
5. `chore(brand): rename Revonyx to Renovix AI`
6. `docs(agent): add ai agent portal strategy and test notes`

## Migration / Deployment Notes
1. Run Prisma migrations before deploying this branch.
2. Ensure any environment variables used by channel integrations/webhooks are configured.
3. Run or include `seed-agents.ts` where agent bootstrap data is required.

## Testing Notes
- This PR is large and spans schema, API, and frontend surfaces.
- Recommended verification before merge:
  1. API smoke test for agent CRUD and agent-run chat endpoints.
  2. Channel creation + chat room/message flow checks.
  3. Frontend navigation through agents list, create, detail, and chat pages.
  4. Tool-calling regression test on Together-backed models.

## Risk Notes
- High change breadth across persistence, backend services, and UI means integration regressions are possible if migrations or seeds are skipped.
- Channel webhook/integration paths should be validated in an environment with real credentials/webhook callbacks.
