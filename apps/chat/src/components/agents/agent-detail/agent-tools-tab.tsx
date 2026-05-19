"use client";

import { toast } from "sonner";
import {
  useAttachTool,
  useAvailableTools,
  useRemoveTool,
} from "@/hooks/use-agents";
import { Button } from "@/components/ui/button";

type AgentToolsTabProps = {
  agent: any;
  agentId: string;
};

export function AgentToolsTab({ agent, agentId }: AgentToolsTabProps) {
  const attachTool = useAttachTool();
  const removeTool = useRemoveTool();
  const { data: availableTools } = useAvailableTools();

  const handleToggleTool = async (toolType: string, isActive: boolean) => {
    try {
      if (isActive) {
        const tool = agent?.tools.find((t: any) => t.toolType === toolType);
        if (tool) {
          await removeTool.mutateAsync({ agentId, toolId: tool.id });
        }
      } else {
        await attachTool.mutateAsync({
          agentId,
          data: { toolType, enabled: true },
        });
      }
    } catch {
      toast.error("Failed to update tool");
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        Enable or disable tools for this agent.
      </p>
      {(availableTools || []).map((tool: any) => {
        const isActive = agent.tools.some((t: any) => t.toolType === tool.type);
        return (
          <div
            key={tool.type}
            className="flex items-center justify-between p-4 rounded-lg border"
          >
            <div>
              <p className="font-medium text-sm">{tool.name}</p>
              <p className="text-xs text-muted-foreground">{tool.description}</p>
            </div>
            <Button
              variant={isActive ? "destructive" : "default"}
              size="sm"
              onClick={() => handleToggleTool(tool.type, isActive)}
            >
              {isActive ? "Remove" : "Add"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
