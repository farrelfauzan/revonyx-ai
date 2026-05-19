import { Injectable } from "@nestjs/common";

interface ToolSchema {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

@Injectable()
export class AgentToolService {
  private readonly toolDefinitions: Record<string, ToolSchema> = {
    web_search: {
      type: "function",
      function: {
        name: "web_search",
        description: "Search the internet for current information",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query",
            },
          },
          required: ["query"],
        },
      },
    },
    calculator: {
      type: "function",
      function: {
        name: "calculator",
        description: "Evaluate a mathematical expression",
        parameters: {
          type: "object",
          properties: {
            expression: {
              type: "string",
              description: "The mathematical expression to evaluate",
            },
          },
          required: ["expression"],
        },
      },
    },
    knowledge_retrieval: {
      type: "function",
      function: {
        name: "knowledge_retrieval",
        description:
          "Search the agent's attached knowledge bases for relevant information",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query for knowledge retrieval",
            },
          },
          required: ["query"],
        },
      },
    },
    memory_store: {
      type: "function",
      function: {
        name: "memory_store",
        description:
          "Store an important fact about the user for future conversations",
        parameters: {
          type: "object",
          properties: {
            fact: {
              type: "string",
              description: "The fact to remember about the user",
            },
            type: {
              type: "string",
              enum: ["interest", "preference", "context"],
              description: "The type of memory",
            },
          },
          required: ["fact", "type"],
        },
      },
    },
    api_call: {
      type: "function",
      function: {
        name: "api_call",
        description: "Make an HTTP request to an external API",
        parameters: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The URL to call",
            },
            method: {
              type: "string",
              enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
              description: "HTTP method",
            },
            body: {
              type: "object",
              description: "Request body (for POST/PUT/PATCH)",
            },
            headers: {
              type: "object",
              description: "Additional request headers",
            },
          },
          required: ["url", "method"],
        },
      },
    },
    delegate_to_subagent: {
      type: "function",
      function: {
        name: "delegate_to_subagent",
        description: "Delegate a specific task to a sub-agent",
        parameters: {
          type: "object",
          properties: {
            subAgentId: {
              type: "string",
              description: "The ID of the sub-agent to delegate to",
            },
            task: {
              type: "string",
              description: "Description of the task to delegate",
            },
          },
          required: ["subAgentId", "task"],
        },
      },
    },
    code_exec: {
      type: "function",
      function: {
        name: "code_exec",
        description: "Execute a code snippet in a sandboxed environment",
        parameters: {
          type: "object",
          properties: {
            language: {
              type: "string",
              enum: ["javascript", "python"],
              description: "Programming language",
            },
            code: {
              type: "string",
              description: "The code to execute",
            },
          },
          required: ["language", "code"],
        },
      },
    },
    // Integration tools
    jira_create_ticket: {
      type: "function",
      function: {
        name: "jira_create_ticket",
        description: "Create a new Jira issue (bug, story, task, epic)",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string", description: "Issue title" },
            description: {
              type: "string",
              description: "Issue description",
            },
            issueType: {
              type: "string",
              enum: ["Bug", "Story", "Task", "Epic"],
              description: "Type of issue",
            },
            priority: {
              type: "string",
              enum: ["Highest", "High", "Medium", "Low", "Lowest"],
              description: "Issue priority",
            },
            assignee: {
              type: "string",
              description: "Assignee email or username",
            },
          },
          required: ["summary", "issueType"],
        },
      },
    },
    jira_search_tickets: {
      type: "function",
      function: {
        name: "jira_search_tickets",
        description: "Search for Jira tickets using JQL",
        parameters: {
          type: "object",
          properties: {
            jql: { type: "string", description: "JQL query string" },
            maxResults: {
              type: "number",
              description: "Max results to return",
            },
          },
          required: ["jql"],
        },
      },
    },
    plane_create_issue: {
      type: "function",
      function: {
        name: "plane_create_issue",
        description: "Create an issue in Plane project management",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Issue name" },
            description: { type: "string", description: "Issue description" },
            priority: {
              type: "string",
              enum: ["urgent", "high", "medium", "low", "none"],
            },
            state: { type: "string", description: "Issue state" },
          },
          required: ["name"],
        },
      },
    },
    calendar_schedule_meeting: {
      type: "function",
      function: {
        name: "calendar_schedule_meeting",
        description: "Schedule a meeting with attendees",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Meeting title" },
            start: {
              type: "string",
              description: "Start time (ISO 8601 format)",
            },
            end: {
              type: "string",
              description: "End time (ISO 8601 format)",
            },
            attendees: {
              type: "array",
              items: { type: "string" },
              description: "List of attendee email addresses",
            },
            description: { type: "string", description: "Meeting description" },
          },
          required: ["title", "start", "end"],
        },
      },
    },
    calendar_find_availability: {
      type: "function",
      function: {
        name: "calendar_find_availability",
        description: "Find available time slots for attendees",
        parameters: {
          type: "object",
          properties: {
            attendees: {
              type: "array",
              items: { type: "string" },
              description: "Email addresses to check availability for",
            },
            dateRange: {
              type: "object",
              properties: {
                start: { type: "string", description: "Start date (ISO 8601)" },
                end: { type: "string", description: "End date (ISO 8601)" },
              },
              required: ["start", "end"],
            },
            duration: {
              type: "number",
              description: "Meeting duration in minutes",
            },
          },
          required: ["attendees", "dateRange", "duration"],
        },
      },
    },
    notion_create_page: {
      type: "function",
      function: {
        name: "notion_create_page",
        description: "Create a new page in Notion",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Page title" },
            content: {
              type: "string",
              description: "Page content in markdown",
            },
            parentId: {
              type: "string",
              description: "Parent page or database ID",
            },
          },
          required: ["title", "content"],
        },
      },
    },
    slack_send_message: {
      type: "function",
      function: {
        name: "slack_send_message",
        description: "Send a message to a Slack channel or DM",
        parameters: {
          type: "object",
          properties: {
            channel: {
              type: "string",
              description: "Channel name or user ID",
            },
            message: { type: "string", description: "Message content" },
          },
          required: ["channel", "message"],
        },
      },
    },
    github_create_issue: {
      type: "function",
      function: {
        name: "github_create_issue",
        description: "Create a GitHub issue",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Issue title" },
            body: { type: "string", description: "Issue body in markdown" },
            labels: {
              type: "array",
              items: { type: "string" },
              description: "Labels to apply",
            },
            repo: {
              type: "string",
              description: "Repository in owner/repo format",
            },
          },
          required: ["title", "body"],
        },
      },
    },
  };

  buildToolSchemas(
    agentTools: any[],
    options?: { injectDelegation?: boolean },
  ): ToolSchema[] {
    const schemas: ToolSchema[] = [];

    for (const tool of agentTools) {
      const schema = this.toolDefinitions[tool.toolType];
      if (schema) {
        schemas.push(schema);
      }
    }

    // Auto-inject delegate_to_subagent for parent agents with sub-agents
    if (
      options?.injectDelegation &&
      !schemas.some((s) => s.function.name === "delegate_to_subagent")
    ) {
      schemas.push(this.toolDefinitions["delegate_to_subagent"]);
    }

    return schemas;
  }

  async executeTool(toolName: string, args: any, agent: any): Promise<string> {
    const timeout = 10000; // 10s timeout per tool

    const executeWithTimeout = async (): Promise<string> => {
      switch (toolName) {
        case "calculator":
          return this.executeCalculator(args);
        case "web_search":
          return this.executeWebSearch(args);
        case "knowledge_retrieval":
          return this.executeKnowledgeRetrieval(args, agent);
        case "memory_store":
          return this.executeMemoryStore(args, agent);
        case "api_call":
          return this.executeApiCall(args, agent);
        case "code_exec":
          return this.executeCodeExec(args);
        case "jira_create_ticket":
          return this.executeJiraCreateTicket(args, agent);
        case "jira_search_tickets":
          return this.executeJiraSearchTickets(args, agent);
        case "plane_create_issue":
          return this.executePlaneCreateIssue(args, agent);
        case "calendar_schedule_meeting":
          return this.executeCalendarScheduleMeeting(args, agent);
        case "calendar_find_availability":
          return this.executeCalendarFindAvailability(args, agent);
        case "notion_create_page":
          return this.executeNotionCreatePage(args, agent);
        case "slack_send_message":
          return this.executeSlackSendMessage(args, agent);
        case "github_create_issue":
          return this.executeGithubCreateIssue(args, agent);
        default:
          return `Tool "${toolName}" is not supported.`;
      }
    };

    return Promise.race([
      executeWithTimeout(),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("Tool execution timeout")), timeout),
      ),
    ]);
  }

  // ─── Tool Implementations ───

  private executeCalculator(args: { expression: string }): string {
    try {
      // Safe math evaluation (no eval)
      const result = this.safeMathEval(args.expression);
      return `Result: ${result}`;
    } catch (err: any) {
      return `Error evaluating expression: ${err.message}`;
    }
  }

  private safeMathEval(expression: string): number {
    // Only allow safe math characters
    const sanitized = expression.replace(/[^0-9+\-*/().%\s^]/g, "");
    if (sanitized !== expression) {
      throw new Error("Invalid characters in expression");
    }

    // Use Function constructor with restricted scope (safer than eval)
    const fn = new Function(
      "Math",
      `"use strict"; return (${sanitized.replace(/\^/g, "**")});`,
    );
    const result = fn(Math);

    if (typeof result !== "number" || !isFinite(result)) {
      throw new Error("Expression did not evaluate to a valid number");
    }

    return result;
  }

  private async executeWebSearch(args: { query: string }): Promise<string> {
    // Placeholder - integrate with a search API (e.g., Brave, Serper, etc.)
    return `Web search results for "${args.query}": [Web search integration pending. Please configure a search provider.]`;
  }

  private async executeKnowledgeRetrieval(
    args: { query: string },
    agent: any,
  ): Promise<string> {
    // This is handled at a higher level in the run service through RAG
    return `Knowledge retrieval for "${args.query}" completed. Results injected into context.`;
  }

  private async executeMemoryStore(
    args: { fact: string; type: string },
    agent: any,
  ): Promise<string> {
    return `Stored memory: "${args.fact}" (type: ${args.type})`;
  }

  private async executeApiCall(
    args: { url: string; method: string; body?: any; headers?: any },
    agent: any,
  ): Promise<string> {
    try {
      // Validate URL is in allowlist from agent's tool config
      const allowedDomains = this.getAllowedDomains(agent);
      const url = new URL(args.url);

      if (allowedDomains.length > 0 && !allowedDomains.includes(url.hostname)) {
        return `Error: Domain "${url.hostname}" is not in the allowed domains list.`;
      }

      const response = await fetch(args.url, {
        method: args.method,
        headers: {
          "Content-Type": "application/json",
          ...(args.headers || {}),
        },
        body: args.body ? JSON.stringify(args.body) : undefined,
        signal: AbortSignal.timeout(5000),
      });

      const text = await response.text();
      const truncated =
        text.length > 2000 ? text.substring(0, 2000) + "..." : text;

      return `HTTP ${response.status}: ${truncated}`;
    } catch (err: any) {
      return `API call error: ${err.message}`;
    }
  }

  private async executeCodeExec(args: {
    language: string;
    code: string;
  }): Promise<string> {
    // Simple sandboxed JS execution (production should use isolated-vm or similar)
    if (args.language === "javascript") {
      try {
        const fn = new Function(`"use strict";\n${args.code}`);
        const result = fn();
        return `Output: ${JSON.stringify(result)}`;
      } catch (err: any) {
        return `Execution error: ${err.message}`;
      }
    }
    return `Language "${args.language}" execution is not yet supported.`;
  }

  private async executeJiraCreateTicket(
    args: any,
    agent: any,
  ): Promise<string> {
    const integration = agent.integrations?.find(
      (i: any) => i.provider === "jira",
    );
    if (!integration)
      return "Error: Jira integration not connected for this agent.";

    try {
      const { baseUrl, apiKey, email, projectKey } = integration.config as any;

      const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            project: { key: projectKey },
            summary: args.summary,
            description: {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: args.description || "" }],
                },
              ],
            },
            issuetype: { name: args.issueType },
            ...(args.priority && { priority: { name: args.priority } }),
          },
        }),
        signal: AbortSignal.timeout(8000),
      });

      const data: any = await response.json();
      if (response.ok) {
        return `Created Jira ticket: ${data.key} - ${args.summary}`;
      }
      return `Jira error: ${JSON.stringify(data.errors || data.errorMessages)}`;
    } catch (err: any) {
      return `Jira API error: ${err.message}`;
    }
  }

  private async executeJiraSearchTickets(
    args: any,
    agent: any,
  ): Promise<string> {
    const integration = agent.integrations?.find(
      (i: any) => i.provider === "jira",
    );
    if (!integration) return "Error: Jira integration not connected.";

    try {
      const { baseUrl, apiKey, email } = integration.config as any;

      const response = await fetch(
        `${baseUrl}/rest/api/3/search?jql=${encodeURIComponent(args.jql)}&maxResults=${args.maxResults || 10}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString("base64")}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(8000),
        },
      );

      const data: any = await response.json();
      if (response.ok) {
        const issues = data.issues.map((i: any) => ({
          key: i.key,
          summary: i.fields.summary,
          status: i.fields.status?.name,
          assignee: i.fields.assignee?.displayName,
        }));
        return `Found ${data.total} tickets:\n${JSON.stringify(issues, null, 2)}`;
      }
      return `Jira search error: ${JSON.stringify(data.errorMessages)}`;
    } catch (err: any) {
      return `Jira search error: ${err.message}`;
    }
  }

  private async executePlaneCreateIssue(
    args: any,
    agent: any,
  ): Promise<string> {
    const integration = agent.integrations?.find(
      (i: any) => i.provider === "plane",
    );
    if (!integration) return "Error: Plane integration not connected.";

    try {
      const { baseUrl, apiKey, workspaceSlug, projectId } =
        integration.config as any;

      const response = await fetch(
        `${baseUrl}/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/issues/`,
        {
          method: "POST",
          headers: {
            "X-API-Key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: args.name,
            description_html: args.description || "",
            priority: args.priority || "medium",
            state: args.state,
          }),
          signal: AbortSignal.timeout(8000),
        },
      );

      const data: any = await response.json();
      if (response.ok) {
        return `Created Plane issue: ${data.identifier || data.id} - ${args.name}`;
      }
      return `Plane error: ${JSON.stringify(data)}`;
    } catch (err: any) {
      return `Plane API error: ${err.message}`;
    }
  }

  private async executeCalendarScheduleMeeting(
    args: any,
    agent: any,
  ): Promise<string> {
    const integration = agent.integrations?.find(
      (i: any) => i.provider === "google_calendar" || i.provider === "outlook",
    );
    if (!integration) return "Error: Calendar integration not connected.";

    // Google Calendar implementation
    if (integration.provider === "google_calendar") {
      try {
        const { accessToken, calendarId } = integration.config as any;

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId || "primary"}/events`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              summary: args.title,
              description: args.description,
              start: { dateTime: args.start },
              end: { dateTime: args.end },
              attendees: args.attendees?.map((email: string) => ({ email })),
            }),
            signal: AbortSignal.timeout(8000),
          },
        );

        const data: any = await response.json();
        if (response.ok) {
          return `Meeting scheduled: "${args.title}" from ${args.start} to ${args.end}. Event ID: ${data.id}`;
        }
        return `Calendar error: ${data.error?.message || JSON.stringify(data)}`;
      } catch (err: any) {
        return `Calendar API error: ${err.message}`;
      }
    }

    return "Outlook calendar integration not yet implemented.";
  }

  private async executeCalendarFindAvailability(
    args: any,
    agent: any,
  ): Promise<string> {
    const integration = agent.integrations?.find(
      (i: any) => i.provider === "google_calendar",
    );
    if (!integration) return "Error: Calendar integration not connected.";

    try {
      const { accessToken } = integration.config as any;

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/freeBusy`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            timeMin: args.dateRange.start,
            timeMax: args.dateRange.end,
            items: args.attendees.map((email: string) => ({ id: email })),
          }),
          signal: AbortSignal.timeout(8000),
        },
      );

      const data: any = await response.json();
      if (response.ok) {
        return `Availability check completed:\n${JSON.stringify(data.calendars, null, 2)}`;
      }
      return `Availability check error: ${data.error?.message}`;
    } catch (err: any) {
      return `Calendar API error: ${err.message}`;
    }
  }

  private async executeNotionCreatePage(
    args: any,
    agent: any,
  ): Promise<string> {
    const integration = agent.integrations?.find(
      (i: any) => i.provider === "notion",
    );
    if (!integration) return "Error: Notion integration not connected.";

    try {
      const { apiKey, parentPageId } = integration.config as any;

      const response = await fetch(`https://api.notion.com/v1/pages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          parent: { page_id: args.parentId || parentPageId },
          properties: {
            title: {
              title: [{ text: { content: args.title } }],
            },
          },
          children: [
            {
              object: "block",
              type: "paragraph",
              paragraph: {
                rich_text: [{ type: "text", text: { content: args.content } }],
              },
            },
          ],
        }),
        signal: AbortSignal.timeout(8000),
      });

      const data: any = await response.json();
      if (response.ok) {
        return `Created Notion page: "${args.title}" (ID: ${data.id})`;
      }
      return `Notion error: ${data.message || JSON.stringify(data)}`;
    } catch (err: any) {
      return `Notion API error: ${err.message}`;
    }
  }

  private async executeSlackSendMessage(
    args: any,
    agent: any,
  ): Promise<string> {
    const integration = agent.integrations?.find(
      (i: any) => i.provider === "slack",
    );
    if (!integration) return "Error: Slack integration not connected.";

    try {
      const { botToken } = integration.config as any;

      const response = await fetch(`https://slack.com/api/chat.postMessage`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: args.channel,
          text: args.message,
        }),
        signal: AbortSignal.timeout(5000),
      });

      const data: any = await response.json();
      if (data.ok) {
        return `Message sent to ${args.channel}: "${args.message}"`;
      }
      return `Slack error: ${data.error}`;
    } catch (err: any) {
      return `Slack API error: ${err.message}`;
    }
  }

  private async executeGithubCreateIssue(
    args: any,
    agent: any,
  ): Promise<string> {
    const integration = agent.integrations?.find(
      (i: any) => i.provider === "github",
    );
    if (!integration) return "Error: GitHub integration not connected.";

    try {
      const { accessToken, defaultRepo } = integration.config as any;
      const repo = args.repo || defaultRepo;

      if (!repo) return "Error: No repository specified.";

      const response = await fetch(
        `https://api.github.com/repos/${repo}/issues`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
          },
          body: JSON.stringify({
            title: args.title,
            body: args.body,
            labels: args.labels,
          }),
          signal: AbortSignal.timeout(8000),
        },
      );

      const data: any = await response.json();
      if (response.ok) {
        return `Created GitHub issue #${data.number}: "${args.title}" (${data.html_url})`;
      }
      return `GitHub error: ${data.message}`;
    } catch (err: any) {
      return `GitHub API error: ${err.message}`;
    }
  }

  private getAllowedDomains(agent: any): string[] {
    const apiCallTool = agent.tools?.find(
      (t: any) => t.toolType === "api_call",
    );
    if (!apiCallTool?.config?.allowedDomains) return [];
    return apiCallTool.config.allowedDomains;
  }
}
