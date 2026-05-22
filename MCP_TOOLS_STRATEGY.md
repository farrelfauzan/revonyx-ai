# MCP Tools Integration Strategy

## Overview

Integrate [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) into Renovix AI's agent system to give agents access to external tools via standardized MCP servers. This enables agents to interact with Google Workspace, GitHub, Slack, and other services through a unified protocol instead of bespoke integrations.

---

## Why MCP?

Currently, each integration (Jira, Slack, Notion, GitHub, Calendar) is hand-coded in `AgentToolService` with custom tool definitions and execution logic. MCP provides:

- **Standardized protocol** — tools are discovered dynamically from MCP servers
- **Community servers** — 100+ open-source MCP servers available (Google Workspace, GitHub, Slack, etc.)
- **Hot-pluggable** — add new tools without code changes
- **Sandboxed** — each MCP server runs as a separate process with its own auth

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Agent Run Service                      │
│                                                            │
│   LLM ←→ Tool Loop ←→ AgentToolService                   │
│                              │                             │
│              ┌───────────────┼───────────────┐             │
│              ▼               ▼               ▼             │
│        Built-in Tools   MCP Client      Integration Tools  │
│        (calculator,     (dynamic)       (legacy jira,      │
│         web_search)         │            slack, etc.)       │
│                             │                              │
└─────────────────────────────┼──────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     Google Workspace    GitHub MCP      Slack MCP
       MCP Server          Server          Server
```

---

## MCP Servers to Integrate

### 1. Google Workspace MCP Server

**Package**: Self-hosted with `@modelcontextprotocol/sdk` + `googleapis`, or community servers like `@gongrzhe/server-gmail-autoauth-mcp`

| Tool | Description |
|------|-------------|
| `gmail_send` | Send emails via Gmail |
| `gmail_search` | Search emails |
| `gmail_read` | Read email content |
| `gdrive_list` | List files in Google Drive |
| `gdrive_read` | Read document content |
| `gdrive_create` | Create a new document/sheet |
| `gcalendar_list_events` | List calendar events |
| `gcalendar_create_event` | Create calendar events |
| `gcalendar_find_free_time` | Find availability |
| `gsheets_read` | Read spreadsheet data |
| `gsheets_write` | Write to spreadsheets |
| `gdocs_read` | Read Google Doc content |
| `gdocs_create` | Create Google Doc |

**Auth**: OAuth2 with Google (service account or user consent flow)

### 2. GitHub MCP Server

**Package**: `@modelcontextprotocol/server-github`

| Tool | Description |
|------|-------------|
| `create_issue` | Create GitHub issues |
| `search_repositories` | Search repos |
| `create_pull_request` | Create PRs |
| `get_file_contents` | Read repo files |
| `list_commits` | List commits |

**Auth**: GitHub Personal Access Token

### 3. Slack MCP Server

**Package**: `@modelcontextprotocol/server-slack`

| Tool | Description |
|------|-------------|
| `send_message` | Send messages |
| `list_channels` | List channels |
| `search_messages` | Search workspace messages |
| `get_channel_history` | Read channel history |

**Auth**: Slack Bot Token (xoxb-)

### 4. Notion MCP Server

**Package**: `@modelcontextprotocol/server-notion`

| Tool | Description |
|------|-------------|
| `create_page` | Create pages |
| `search` | Search workspace |
| `query_database` | Query Notion DBs |
| `update_page` | Update pages |

**Auth**: Notion Integration Token

### 5. Linear / Jira MCP Server

**Package**: `@modelcontextprotocol/server-linear` or community Jira server

---

## Implementation Plan

### Phase 1: MCP Client Library

Create an MCP client service that can connect to MCP servers and discover/execute tools.

```typescript
// apps/api/src/app/mcp/mcp-client.service.ts

import { Injectable } from '@nestjs/common';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

interface McpServerConfig {
  id: string;
  name: string;
  transport: 'stdio' | 'sse';
  command?: string;        // for stdio
  args?: string[];         // for stdio
  url?: string;            // for sse
  env?: Record<string, string>; // environment variables (tokens, etc.)
}

@Injectable()
export class McpClientService {
  private clients = new Map<string, Client>();

  async connectServer(config: McpServerConfig): Promise<void> {
    const client = new Client({ name: 'renovix-agent', version: '1.0.0' });

    if (config.transport === 'stdio') {
      const transport = new StdioClientTransport({
        command: config.command!,
        args: config.args,
        env: { ...process.env, ...config.env },
      });
      await client.connect(transport);
    } else {
      const transport = new SSEClientTransport(new URL(config.url!));
      await client.connect(transport);
    }

    this.clients.set(config.id, client);
  }

  async listTools(serverId: string) {
    const client = this.clients.get(serverId);
    if (!client) throw new Error(`MCP server ${serverId} not connected`);
    const { tools } = await client.listTools();
    return tools;
  }

  async callTool(serverId: string, toolName: string, args: Record<string, any>) {
    const client = this.clients.get(serverId);
    if (!client) throw new Error(`MCP server ${serverId} not connected`);
    const result = await client.callTool({ name: toolName, arguments: args });
    return result;
  }

  async disconnectServer(serverId: string) {
    const client = this.clients.get(serverId);
    if (client) {
      await client.close();
      this.clients.delete(serverId);
    }
  }

  // Convert MCP tool schemas to OpenAI function-calling format
  mcpToolToOpenAI(mcpTool: any): any {
    return {
      type: 'function',
      function: {
        name: mcpTool.name,
        description: mcpTool.description,
        parameters: mcpTool.inputSchema,
      },
    };
  }
}
```

### Phase 2: Database Schema

Add MCP server configuration to the database:

```prisma
model McpServer {
  id           String   @id @default(uuid())
  name         String
  transport    String   // 'stdio' | 'sse'
  command      String?  // e.g. "npx" for stdio
  args         Json?    // e.g. ["-y", "@anthropic/mcp-server-google"]
  url          String?  // for SSE transport
  envEncrypted Json?    // encrypted env vars (tokens, keys)
  isGlobal     Boolean  @default(false)
  userId       String?
  createdAt    DateTime @default(now()) @db.Timestamptz(3)
  updatedAt    DateTime @updatedAt @db.Timestamptz(3)

  user         User?    @relation(fields: [userId], references: [id])
  agents       AgentMcpServer[]

  @@map("mcp_servers")
}

model AgentMcpServer {
  id          String @id @default(uuid())
  agentId     String
  mcpServerId String
  // Optional: restrict which tools from this server the agent can use
  allowedTools Json?  // string[] of tool names, null = all

  agent     Agent     @relation(fields: [agentId], references: [id])
  mcpServer McpServer @relation(fields: [mcpServerId], references: [id])

  @@unique([agentId, mcpServerId])
  @@map("agent_mcp_servers")
}
```

### Phase 3: Integrate with Agent Tool Loop

Modify `AgentToolService` to include MCP tools in the tool schemas sent to the LLM and route execution to the MCP client:

```typescript
// In agent-tool.service.ts

async buildToolSchemasWithMcp(
  agentTools: any[],
  mcpServers: McpServerConfig[],
  options?: { injectDelegation?: boolean }
): Promise<ToolSchema[]> {
  // 1. Built-in tools
  const schemas = this.buildToolSchemas(agentTools, options);

  // 2. Discover MCP tools from connected servers
  for (const server of mcpServers) {
    await this.mcpClient.connectServer(server);
    const mcpTools = await this.mcpClient.listTools(server.id);

    for (const tool of mcpTools) {
      schemas.push(this.mcpClient.mcpToolToOpenAI(tool));
    }
  }

  return schemas;
}

async executeTool(toolName: string, args: any, agent: any): Promise<string> {
  // Check if it's an MCP tool
  const mcpServer = await this.findMcpServerForTool(toolName, agent.id);
  if (mcpServer) {
    const result = await this.mcpClient.callTool(mcpServer.id, toolName, args);
    return JSON.stringify(result.content);
  }

  // Fallback to built-in execution
  return this.executeBuiltinTool(toolName, args, agent);
}
```

### Phase 4: Google Workspace Setup

#### Option A: Official MCP Server (stdio)

```bash
# No third-party MCP server package needed for Google
# Use the MCP SDK + googleapis to build your own
bun add @modelcontextprotocol/sdk googleapis
```

If a community stdio server becomes available:
```json
{
  "id": "google-workspace",
  "name": "Google Workspace",
  "transport": "stdio",
  "command": "node",
  "args": ["dist/mcp/servers/google-workspace.mcp.js"],
  "env": {
    "GOOGLE_CLIENT_ID": "{{from_agent_integration}}",
    "GOOGLE_CLIENT_SECRET": "{{from_agent_integration}}",
    "GOOGLE_REFRESH_TOKEN": "{{from_agent_integration}}"
  }
}
```

#### Option B: Self-hosted MCP Server (SSE)

For multi-tenant use, run a shared Google Workspace MCP server with per-user OAuth:

```typescript
// apps/api/src/app/mcp/servers/google-workspace.mcp.ts

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { google } from 'googleapis';

const server = new McpServer({ name: 'google-workspace', version: '1.0.0' });

server.tool('gmail_send', {
  to: { type: 'string', description: 'Recipient email' },
  subject: { type: 'string', description: 'Email subject' },
  body: { type: 'string', description: 'Email body (HTML supported)' },
}, async ({ to, subject, body }, extra) => {
  const auth = getOAuthClient(extra.meta?.userId);
  const gmail = google.gmail({ version: 'v1', auth });
  
  const raw = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/html\r\n\r\n${body}`
  ).toString('base64url');

  await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
  return { content: [{ type: 'text', text: `Email sent to ${to}` }] };
});

server.tool('gcalendar_create_event', {
  title: { type: 'string' },
  start: { type: 'string', description: 'ISO 8601 datetime' },
  end: { type: 'string', description: 'ISO 8601 datetime' },
  attendees: { type: 'string', description: 'Comma-separated emails' },
}, async ({ title, start, end, attendees }, extra) => {
  const auth = getOAuthClient(extra.meta?.userId);
  const calendar = google.calendar({ version: 'v3', auth });

  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: title,
      start: { dateTime: start },
      end: { dateTime: end },
      attendees: attendees?.split(',').map(e => ({ email: e.trim() })),
    },
  });

  return { content: [{ type: 'text', text: `Event created: ${event.data.htmlLink}` }] };
});

// ... more tools (gdrive_list, gsheets_read, etc.)
```

---

## Google OAuth2 Flow for Users

```
┌─────────┐         ┌──────────┐         ┌─────────────┐
│  User    │────────▶│ Dashboard │────────▶│ Google OAuth │
│          │◀────────│  /connect │◀────────│  Consent    │
└─────────┘         └──────────┘         └─────────────┘
                          │
                          ▼
                    Store refresh_token
                    in AgentIntegration
                    (encrypted)
```

1. User clicks "Connect Google Workspace" in dashboard
2. Redirect to Google OAuth consent (scopes: gmail, calendar, drive, sheets, docs)
3. Exchange code for refresh token
4. Store encrypted refresh token in `AgentIntegration` (type: `google_workspace`)
5. MCP server uses the refresh token to make API calls on behalf of the user

### Required Google OAuth Scopes

```
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/drive.readonly
https://www.googleapis.com/auth/drive.file
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/documents
```

---

## Dependencies

```bash
# MCP SDK (client + server)
bun add @modelcontextprotocol/sdk

# Google APIs (for self-hosted MCP server)
bun add googleapis

# Google APIs (used by self-hosted MCP server)
# No Anthropic dependency needed — MCP is an open protocol
```

---

## Configuration (per environment)

```env
# .env
MCP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
MCP_GOOGLE_CLIENT_SECRET=your-client-secret
MCP_GOOGLE_REDIRECT_URI=https://app.renovix.ai/api/integrations/google/callback
```

---

## Agent Configuration Example

In the dashboard, when creating/editing an agent:

```json
{
  "name": "Executive Assistant",
  "systemPrompt": "You are an executive assistant with access to Google Workspace...",
  "tools": ["knowledge_retrieval", "memory_store"],
  "mcpServers": [
    {
      "id": "google-workspace",
      "allowedTools": [
        "gmail_send",
        "gmail_search",
        "gcalendar_create_event",
        "gcalendar_list_events",
        "gdrive_list"
      ]
    }
  ]
}
```

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Token storage | Encrypt OAuth tokens at rest (AES-256-GCM) |
| Tool scoping | Per-agent `allowedTools` restricts which MCP tools are exposed |
| User consent | Explicit OAuth consent per Google Workspace scope |
| Rate limiting | Apply per-user rate limits on MCP tool calls |
| Sandboxing | stdio MCP servers run as child processes; no shared memory |
| Input validation | MCP SDK validates tool inputs against JSON Schema |
| Audit logging | Log all MCP tool calls to `AgentMessage` (role: "tool") |

---

## Available Community MCP Servers

| Server | Package | Description |
|--------|---------|-------------|
| Google Workspace | Self-hosted (`@modelcontextprotocol/sdk` + `googleapis`) | Gmail, Calendar, Drive, Docs, Sheets |
| GitHub | `@modelcontextprotocol/server-github` | Issues, PRs, repos, files |
| Slack | `@modelcontextprotocol/server-slack` | Messages, channels |
| Notion | `@modelcontextprotocol/server-notion` | Pages, databases |
| Linear | `@modelcontextprotocol/server-linear` | Issues, projects |
| Brave Search | `@modelcontextprotocol/server-brave-search` | Web search |
| PostgreSQL | `@modelcontextprotocol/server-postgres` | Query databases |
| Filesystem | `@modelcontextprotocol/server-filesystem` | File operations |
| Puppeteer | `@modelcontextprotocol/server-puppeteer` | Web scraping |
| Memory | `@modelcontextprotocol/server-memory` | Persistent memory |

---

## Migration Path

1. **Keep existing integrations working** — The current `jira_create_ticket`, `slack_send_message`, etc. continue to work as built-in tools
2. **Add MCP as an additional layer** — New integrations use MCP; old ones can be migrated gradually
3. **Eventually deprecate built-in integrations** — Once MCP equivalents are stable, mark old tools as deprecated

---

## File Structure

```
apps/api/src/app/mcp/
├── mcp.module.ts              # NestJS module
├── mcp-client.service.ts      # MCP client (connect, list tools, call tools)
├── mcp-server.service.ts      # Manages MCP server lifecycle
├── mcp.controller.ts          # REST endpoints for managing MCP configs
├── dto/
│   ├── create-mcp-server.dto.ts
│   └── update-mcp-server.dto.ts
└── servers/
    └── google-workspace.mcp.ts  # Self-hosted Google Workspace MCP server
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/mcp/servers` | List available MCP servers |
| `POST` | `/api/mcp/servers` | Add MCP server config |
| `GET` | `/api/mcp/servers/:id/tools` | Discover tools from a server |
| `POST` | `/api/mcp/servers/:id/test` | Test connection to MCP server |
| `POST` | `/api/agents/:id/mcp` | Attach MCP server to agent |
| `DELETE` | `/api/agents/:id/mcp/:serverId` | Detach MCP server |
| `GET` | `/api/integrations/google/connect` | Start Google OAuth flow |
| `GET` | `/api/integrations/google/callback` | OAuth callback |

---

## Timeline

| Phase | Scope | Effort |
|-------|-------|--------|
| 1 | MCP Client SDK integration + stdio transport | Small |
| 2 | Database schema + CRUD endpoints | Small |
| 3 | Agent tool loop integration (discovery + execution) | Medium |
| 4 | Google Workspace MCP server (self-hosted) | Medium |
| 5 | OAuth flow + dashboard UI for connecting services | Medium |
| 6 | Migrate existing integrations to MCP | Large (optional) |
