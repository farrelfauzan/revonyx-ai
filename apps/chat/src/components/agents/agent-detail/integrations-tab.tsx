"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  TestTube,
  ChevronDown,
  ChevronRight,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useMcpServers,
  useAgentMcpServers,
  useAttachMcpToAgent,
  useDetachMcpFromAgent,
  useUpdateAgentMcpTools,
  useMcpServerTools,
  useTestMcpConnection,
} from "@/hooks/use-mcp";
import { IntegrationProviderLogo } from "@/components/agents/agent-detail/integration-provider-logo";

const MCP_LOGOS: Record<string, string> = {
  "google-gmail": "https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_32dp.png",
  "google-calendar": "https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_32dp.png",
  "google-drive": "https://www.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png",
  "google-sheets": "https://www.gstatic.com/images/branding/product/1x/sheets_2020q4_32dp.png",
  github: "https://github.com/fluidicon.png",
  slack: "https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png",
  notion: "https://www.notion.so/front-static/favicon.ico",
  linear: "https://linear.app/favicon.ico",
  "brave-search": "https://brave.com/static-assets/images/brave-logo-sans-text.svg",
};

type IntegrationsTabProps = {
  agent: any;
  agentId: string;
};

export function IntegrationsTab({ agent, agentId }: IntegrationsTabProps) {
  const [expandedServer, setExpandedServer] = useState<string | null>(null);

  const { data: servers, isLoading: serversLoading } = useMcpServers();
  const { data: agentMcp, isLoading: agentMcpLoading } = useAgentMcpServers(agentId);
  const attachMcp = useAttachMcpToAgent();
  const detachMcp = useDetachMcpFromAgent();
  const testConn = useTestMcpConnection();
  const updateTools = useUpdateAgentMcpTools();

  const isLoading = serversLoading || agentMcpLoading;
  const attachedIds = agentMcp?.map((m) => m.mcpServerId) || [];

  const handleAttach = async (serverId: string) => {
    try {
      await attachMcp.mutateAsync({ agentId, data: { mcpServerId: serverId } });
      toast.success("Integration attached");
    } catch {
      toast.error("Failed to attach integration");
    }
  };

  const handleDetach = async (serverId: string, name: string) => {
    try {
      await detachMcp.mutateAsync({ agentId, serverId });
      toast.success(`${name} removed`);
    } catch {
      toast.error("Failed to remove integration");
    }
  };

  const handleTest = async (serverId: string, name: string) => {
    try {
      await testConn.mutateAsync(serverId);
      toast.success(`${name} connection OK`);
    } catch {
      toast.error(`${name} connection failed`);
    }
  };

  const handleToggleTool = async (
    serverId: string,
    toolName: string,
    currentAllowed: string[] | null,
    allTools: string[],
  ) => {
    let newAllowed: string[] | null;

    if (currentAllowed === null) {
      newAllowed = allTools.filter((t) => t !== toolName);
    } else if (currentAllowed.includes(toolName)) {
      newAllowed = currentAllowed.filter((t) => t !== toolName);
    } else {
      newAllowed = [...currentAllowed, toolName];
    }

    if (newAllowed && newAllowed.length === allTools.length) {
      newAllowed = null;
    }

    try {
      await updateTools.mutateAsync({ agentId, serverId, allowedTools: newAllowed });
    } catch {
      toast.error("Failed to update tools");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Attached MCP Servers */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium">Active Integrations</h3>
            <p className="text-xs text-muted-foreground">
              External services attached to this agent. Manage connections in your server settings.
            </p>
          </div>
        </div>

        {(!agentMcp || agentMcp.length === 0) ? (
          <div className="border border-dashed rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No integrations attached.{" "}
              {servers && servers.length > 0
                ? "Attach a service below."
                : "Connect services in your server settings first."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {agentMcp.map((mcp) => (
              <AgentMcpCard
                key={mcp.id}
                mcp={mcp}
                expanded={expandedServer === mcp.mcpServerId}
                onToggleExpand={() =>
                  setExpandedServer(
                    expandedServer === mcp.mcpServerId ? null : mcp.mcpServerId,
                  )
                }
                onDetach={() => handleDetach(mcp.mcpServerId, mcp.mcpServer.displayName)}
                onTest={() => handleTest(mcp.mcpServerId, mcp.mcpServer.displayName)}
                onToggleTool={handleToggleTool}
              />
            ))}
          </div>
        )}
      </section>

      {/* Available workspace servers (connected but not attached to this agent) */}
      {servers && servers.filter((s) => !attachedIds.includes(s.id)).length > 0 && (
        <section>
          <h3 className="text-sm font-medium mb-3">Available Server Services</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Connected to your server. Click &quot;Attach&quot; to give this agent access.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {servers
              .filter((s) => !attachedIds.includes(s.id))
              .map((server) => (
                <div
                  key={server.id}
                  className="border rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <IntegrationProviderLogo
                      name={server.displayName}
                      logoUrl={MCP_LOGOS[server.name] || ""}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium text-sm">{server.displayName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{server.status}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAttach(server.id)}
                    disabled={attachMcp.isPending}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Attach
                  </Button>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* No workspace services hint */}
      {(!servers || servers.length === 0) && (
        <section className="border border-dashed rounded-lg p-6 text-center">
          <Settings className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No services connected to your server yet. Open server settings to add integrations.
          </p>
        </section>
      )}
    </div>
  );
}

// ─── Agent MCP Server Card ───

function AgentMcpCard({
  mcp,
  expanded,
  onToggleExpand,
  onDetach,
  onTest,
  onToggleTool,
}: {
  mcp: any;
  expanded: boolean;
  onToggleExpand: () => void;
  onDetach: () => void;
  onTest: () => void;
  onToggleTool: (
    serverId: string,
    toolName: string,
    currentAllowed: string[] | null,
    allTools: string[],
  ) => void;
}) {
  const { data: tools } = useMcpServerTools(expanded ? mcp.mcpServerId : "");
  const allToolNames = tools?.map((t) => t.name) || [];

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <IntegrationProviderLogo
            name={mcp.mcpServer.displayName}
            logoUrl={MCP_LOGOS[mcp.mcpServer.name] || ""}
            size="sm"
          />
          <div>
            <p className="font-medium text-sm">{mcp.mcpServer.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {mcp.allowedTools
                ? `${mcp.allowedTools.length} tool${mcp.allowedTools.length !== 1 ? "s" : ""} enabled`
                : "All tools enabled"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              mcp.mcpServer.status === "connected"
                ? "text-green-500 border-green-500/30"
                : "text-red-500 border-red-500/30"
            }
          >
            {mcp.mcpServer.status === "connected" ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : (
              <XCircle className="h-3 w-3 mr-1" />
            )}
            {mcp.mcpServer.status}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onTest();
            }}
            title="Test connection"
          >
            <TestTube className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDetach();
            }}
            title="Remove from agent"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 py-3 bg-muted/30">
          {!tools ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading tools...</span>
            </div>
          ) : tools.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No tools discovered from this server.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {tools.map((tool) => {
                const isEnabled =
                  mcp.allowedTools === null || mcp.allowedTools.includes(tool.name);
                return (
                  <label
                    key={tool.name}
                    className="flex items-start gap-2 p-2 rounded hover:bg-background cursor-pointer"
                  >
                    <Checkbox
                      checked={isEnabled}
                      onCheckedChange={() =>
                        onToggleTool(mcp.mcpServerId, tool.name, mcp.allowedTools, allToolNames)
                      }
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tool.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
