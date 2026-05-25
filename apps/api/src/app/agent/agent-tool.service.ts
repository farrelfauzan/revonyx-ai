import { Injectable, Logger } from "@nestjs/common";
import { McpClientService } from "../mcp/mcp-client.service";
import { McpService } from "../mcp/mcp.service";
import { AgentMemoryService } from "./agent-memory.service";

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
  private readonly logger = new Logger(AgentToolService.name);

  private stripSchemaDescriptions(schema: unknown): void {
    if (!schema || typeof schema !== "object") return;

    const obj = schema as Record<string, unknown>;
    delete obj.description;

    for (const value of Object.values(obj)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          this.stripSchemaDescriptions(item);
        }
        continue;
      }

      this.stripSchemaDescriptions(value);
    }
  }

  constructor(
    private readonly mcpClient: McpClientService,
    private readonly mcpService: McpService,
    private readonly memoryService: AgentMemoryService,
  ) {}

  // ─── Built-in tool definitions (internal tools that need direct DB/process access) ───
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
  };

  // Track which MCP server owns which tool (populated during buildToolSchemas)
  private mcpToolMap = new Map<string, string>(); // toolName -> serverId

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

  /**
   * Build tool schemas including MCP tools from connected servers.
   * Connects to each MCP server, discovers tools, and merges them with built-in tools.
   */
  async buildToolSchemasWithMcp(
    agentTools: any[],
    agentId: string,
    options?: { injectDelegation?: boolean },
  ): Promise<ToolSchema[]> {
    // 1. Built-in tools
    const schemas = this.buildToolSchemas(agentTools, options);

    // 2. Discover MCP tools from connected servers
    try {
      const mcpConfigs = await this.mcpService.getAgentMcpConfigs(agentId);

      for (const { config, allowedTools } of mcpConfigs) {
        try {
          await this.mcpClient.connectServer(config);
          const mcpTools = await this.mcpClient.listTools(config.id);

          for (const tool of mcpTools) {
            // Only enforce explicit per-agent allow-list when configured
            if (allowedTools && !allowedTools.includes(tool.name)) {
              continue;
            }

            const schema = this.mcpClient.mcpToolToOpenAI(tool);
            // Trim top-level description
            if (schema.function.description && schema.function.description.length > 120) {
              schema.function.description = schema.function.description.slice(0, 120);
            }
            // Remove nested parameter descriptions to reduce request payload size.
            this.stripSchemaDescriptions(schema.function.parameters);
            schemas.push(schema);
            this.mcpToolMap.set(tool.name, config.id);
          }
        } catch (err: any) {
          this.logger.warn(
            `Failed to connect MCP server ${config.name}: ${err.message}`,
          );
        }
      }
    } catch (err: any) {
      this.logger.warn(
        `Failed to load MCP configs for agent ${agentId}: ${err.message}`,
      );
    }

    return schemas;
  }

  async executeTool(toolName: string, args: any, agent: any, userId?: string, channelId?: string): Promise<string> {
    const timeout = 30000; // 30s timeout per tool

    const executeWithTimeout = async (): Promise<string> => {
      // Check if it's an MCP tool
      const mcpServerId = this.mcpToolMap.get(toolName);
      if (mcpServerId) {
        return this.executeMcpTool(mcpServerId, toolName, args);
      }

      // Built-in tools
      switch (toolName) {
        case "calculator":
          return this.executeCalculator(args);
        case "web_search":
          return this.executeWebSearch(args);
        case "knowledge_retrieval":
          return this.executeKnowledgeRetrieval(args, agent);
        case "memory_store":
          return this.executeMemoryStore(args, agent, userId, channelId);
        case "code_exec":
          return this.executeCodeExec(args);
        default:
          return `Tool "${toolName}" is not available. It may require an MCP integration to be connected.`;
      }
    };

    return Promise.race([
      executeWithTimeout(),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("Tool execution timeout")), timeout),
      ),
    ]);
  }

  /**
   * Execute a tool via MCP server
   */
  private async executeMcpTool(
    serverId: string,
    toolName: string,
    args: any,
  ): Promise<string> {
    try {
      const result = await this.mcpClient.callTool(serverId, toolName, args);

      // MCP returns content as an array of content blocks
      if (result.content && Array.isArray(result.content)) {
        return result.content
          .map((block: any) => {
            if (block.type === "text") return block.text;
            if (block.type === "image") return `[Image: ${block.mimeType}]`;
            return JSON.stringify(block);
          })
          .join("\n");
      }

      return JSON.stringify(result);
    } catch (err: any) {
      this.logger.error(`MCP tool ${toolName} error: ${err.message}`);
      return `Error executing ${toolName}: ${err.message}`;
    }
  }

  /**
   * Disconnect all MCP servers after a run completes
   */
  async cleanupMcpConnections(): Promise<void> {
    await this.mcpClient.disconnectAll();
    this.mcpToolMap.clear();
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
    userId?: string,
    channelId?: string,
  ): Promise<string> {
    if (!userId) {
      this.logger.warn(`[memory_store] No userId provided for agent ${agent.id}`);
      return `Memory store failed: user context unavailable.`;
    }
    try {
      this.logger.log(
        `[memory_store] Storing for agent=${agent.id} userId=${userId} channelId=${channelId ?? "null"} type=${args.type} fact="${(args.fact || "").slice(0, 80)}"`,
      );
      await this.memoryService.storeExplicit(
        agent.id,
        userId,
        args.fact,
        args.type || "context",
        channelId,
      );
      return `Successfully stored memory: "${args.fact}" (type: ${args.type})`;
    } catch (err: any) {
      this.logger.error(`Memory store failed: ${err.message}`, err.stack);
      return `Failed to store memory: ${err.message}`;
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
}
