import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ModelRegistryService } from "../config/model-registry.service";
import { ProviderRouter } from "../providers/provider-router";
import { ChannelService } from "./channel.service";
import { AgentToolService } from "../agent/agent-tool.service";

const MAX_TOOL_ITERATIONS = 6;

@Injectable()
export class ChannelChatService {
  private readonly logger = new Logger(ChannelChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: ModelRegistryService,
    private readonly providerRouter: ProviderRouter,
    private readonly channelService: ChannelService,
    private readonly toolService: AgentToolService,
  ) {}

  async chat(
    userId: string,
    channelId: string,
    agentId: string,
    message: string,
  ): Promise<{ content: string; totalTokens: number }> {
    // Resolve the channel agent (verifies access)
    const channelAgent = await this.channelService.resolveChannelAgent(
      userId,
      channelId,
      agentId,
    );
    const agent = channelAgent.agent;

    // Load sub-agents if this is a parent agent
    const subAgents =
      agent.agentType === "parent"
        ? await this.prisma.agent.findMany({
            where: { parentAgentId: agent.id, status: "active" },
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
              model: true,
            },
          })
        : [];

    // Save user message
    await this.channelService.saveMessage(channelAgent.id, userId, {
      role: "user",
      content: message,
    });

    // Build context
    const modelEntry = await this.registry.resolveModel(agent.model);
    if (!modelEntry) {
      throw new BadRequestException(`Model "${agent.model}" is not available`);
    }

    // Get recent history for this agent in the channel room
    const chatRoom = await this.channelService.getOrCreateChatRoom(
      channelAgent.channelId,
    );
    const history = await this.prisma.channelMessage.findMany({
      where: {
        chatRoomId: chatRoom.id,
        agentId: channelAgent.agentId,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    history.reverse();

    // Build system prompt with sub-agent info
    let systemContent = agent.systemPrompt || "You are a helpful assistant.";
    if (subAgents.length > 0) {
      const subAgentList = subAgents
        .map(
          (sa) =>
            `- ${sa.name} (id: ${sa.id})${sa.description ? `: ${sa.description}` : ""}`,
        )
        .join("\n");
      systemContent += `\n\n## Available Sub-Agents\n${subAgentList}\n\nDelegation policy:\n- Use delegate_to_subagent tool to delegate tasks.\n- Execute delegation immediately, do not ask confirmation.\n- Never invent sub-agent names or IDs not in this list.`;
    }

    // Build messages
    const currentMessages: any[] = [
      { role: "system", content: systemContent },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    // Build tool schemas (auto-inject delegation for parent agents)
    const toolSchemas = this.toolService.buildToolSchemas(agent.tools, {
      injectDelegation: agent.agentType === "parent" && subAgents.length > 0,
    });

    // Tool execution loop
    let iterations = 0;
    let totalTokens = 0;

    while (iterations < MAX_TOOL_ITERATIONS) {
      const callParams: any = {
        model: modelEntry.slug,
        providerId: modelEntry.providerId,
        messages: currentMessages,
        temperature: agent.temperature,
        max_tokens: agent.maxTokens ?? 4096,
      };

      if (toolSchemas.length > 0) {
        callParams.tools = toolSchemas;
        callParams.tool_choice = "auto";
      }

      const payloadSize = (JSON.stringify(callParams).length / 1024).toFixed(1);
      this.logger.log(
        `[chat] iteration=${iterations} | model=${modelEntry.providerId} messages=${currentMessages.length} tools=${toolSchemas.length} payload=${payloadSize}KB`,
      );

      const startTime = Date.now();
      const response: any = await this.providerRouter.chat(
        modelEntry.provider,
        callParams,
      );
      const elapsed = Date.now() - startTime;

      const choice = response.choices?.[0];
      totalTokens += response.usage?.total_tokens || 0;

      this.logger.log(
        `[chat] iteration=${iterations} | RESPONSE in ${elapsed}ms | prompt=${response.usage?.prompt_tokens ?? "?"} completion=${response.usage?.completion_tokens ?? "?"} total=${response.usage?.total_tokens ?? "?"} cumulative=${totalTokens} | finish_reason=${choice?.finish_reason}`,
      );

      if (!choice) {
        break;
      }

      // If tool calls, execute them and loop
      if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
        this.logger.log(
          `[chat] Tool calls: ${choice.message.tool_calls.map((tc: any) => tc.function.name).join(", ")}`,
        );

        currentMessages.push(choice.message);

        for (const toolCall of choice.message.tool_calls) {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            let result: string;

            if (toolCall.function.name === "delegate_to_subagent") {
              result = await this.executeSubAgent(agent, args, userId);
            } else {
              result = await this.toolService.executeTool(
                toolCall.function.name,
                args,
                agent,
              );
            }

            currentMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: result,
            });
          } catch (err: any) {
            currentMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: `Error: ${err.message}`,
            });
          }
        }

        iterations++;
        continue;
      }

      // Final text response
      const fullContent = choice.message?.content || "";

      // Save assistant message
      if (fullContent) {
        await this.channelService.saveMessage(channelAgent.id, userId, {
          role: "assistant",
          content: fullContent,
          tokens: totalTokens,
        });
      }

      return { content: fullContent, totalTokens };
    }

    return { content: "Reached maximum tool iterations.", totalTokens };
  }

  private async executeSubAgent(
    parentAgent: any,
    args: any,
    userId: string,
  ): Promise<string> {
    const rawIdentifier = [args?.subAgentId, args?.subAgentName]
      .find((v) => typeof v === "string" && v.trim().length > 0)
      ?.trim();
    const task = typeof args?.task === "string" ? args.task.trim() : "";

    if (!rawIdentifier) return "Error: Missing sub-agent identifier.";
    if (!task) return "Error: Missing task for sub-agent.";

    const subAgent = await this.prisma.agent.findFirst({
      where: {
        parentAgentId: parentAgent.id,
        agentType: "sub_agent",
        OR: [
          { id: rawIdentifier },
          { name: { equals: rawIdentifier, mode: "insensitive" } },
        ],
      },
      include: { tools: { where: { enabled: true } } },
    });

    if (!subAgent) {
      this.logger.warn(
        `[executeSubAgent] Not found: "${rawIdentifier}" under parent ${parentAgent.id}`,
      );
      return "Error: Sub-agent not found.";
    }

    const modelEntry = await this.registry.resolveModel(subAgent.model);
    if (!modelEntry)
      return `Error: Sub-agent model "${subAgent.model}" unavailable.`;

    this.logger.log(
      `[executeSubAgent] Running: ${subAgent.name} (${subAgent.id}) | model=${modelEntry.providerId} | task="${task.slice(0, 80)}"`,
    );

    const subMessages: any[] = [
      {
        role: "system",
        content: subAgent.systemPrompt || "You are a helpful assistant.",
      },
      {
        role: "user",
        content: `Task delegated from "${parentAgent.name}": ${task}`,
      },
    ];

    // Don't pass tools to sub-agent during delegation — it should respond with text only
    const startTime = Date.now();
    const response: any = await this.providerRouter.chat(modelEntry.provider, {
      model: modelEntry.slug,
      providerId: modelEntry.providerId,
      messages: subMessages,
      temperature: subAgent.temperature,
      max_tokens: subAgent.maxTokens ?? 4096,
    } as any);

    const result =
      response.choices?.[0]?.message?.content ||
      "Sub-agent returned empty response.";
    this.logger.log(
      `[executeSubAgent] Done in ${Date.now() - startTime}ms | tokens=${response.usage?.total_tokens ?? "?"} | result=${result.slice(0, 150)}`,
    );

    return result;
  }
}
