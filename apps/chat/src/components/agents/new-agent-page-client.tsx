"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAgentStore } from "@/lib/agent-store";
import { useCreateAgent, useAvailableTools } from "@/hooks/use-agents";
import { usePortalModels } from "@/hooks/use-portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Brain,
  Wrench,
  Rocket,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { title: "Identity", icon: Bot },
  { title: "Instructions", icon: Brain },
  { title: "Tools", icon: Wrench },
  { title: "Deploy", icon: Rocket },
];

export default function NewAgentPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedAgentType = searchParams.get("agentType");
  const requestedParentAgentId = searchParams.get("parentAgentId");
  const {
    builderStep,
    setBuilderStep,
    builderDraft,
    updateBuilderDraft,
    resetBuilderDraft,
  } = useAgentStore();
  const createAgent = useCreateAgent();
  const { data: models = [] } = usePortalModels();
  const { data: availableTools } = useAvailableTools();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (requestedAgentType === "sub_agent" && requestedParentAgentId) {
      updateBuilderDraft({
        agentType: "sub_agent",
        parentAgentId: requestedParentAgentId,
      });
    }
  }, [requestedAgentType, requestedParentAgentId, updateBuilderDraft]);

  const handleNext = () => {
    if (builderStep === 0) {
      if (!builderDraft.name.trim()) {
        toast.error("Agent name is required");
        return;
      }
      if (builderDraft.agentType === "sub_agent" && !builderDraft.parentAgentId) {
        toast.error("Sub-agent requires a parent agent");
        return;
      }
    }
    if (builderStep === 1) {
      if (!builderDraft.systemPrompt.trim()) {
        toast.error("System prompt is required");
        return;
      }
      if (!builderDraft.model) {
        toast.error("Please select a model");
        return;
      }
    }
    setBuilderStep(Math.min(builderStep + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setBuilderStep(Math.max(builderStep - 1, 0));
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const agent = await createAgent.mutateAsync({
        name: builderDraft.name.trim(),
        description: builderDraft.description?.trim() || undefined,
        avatar: builderDraft.avatar || undefined,
        systemPrompt: builderDraft.systemPrompt.trim(),
        model: builderDraft.model,
        temperature: builderDraft.temperature,
        maxTokens: builderDraft.maxTokens || undefined,
        isPublic: builderDraft.isPublic,
        agentType: builderDraft.agentType,
        parentAgentId:
          builderDraft.agentType === "sub_agent"
            ? builderDraft.parentAgentId
            : undefined,
      });

      const parentAgentId = builderDraft.parentAgentId;
      const createdAsSubAgent = builderDraft.agentType === "sub_agent";

      resetBuilderDraft();
      toast.success("Agent created successfully!");
      if (createdAsSubAgent && parentAgentId) {
        router.push(`/agents/${parentAgentId}`);
      } else {
        router.push(`/agents/${agent.id}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/agents")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create New Agent</h1>
            <p className="text-sm text-muted-foreground">
              Step {builderStep + 1} of {STEPS.length}: {STEPS[builderStep].title}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === builderStep;
            const isCompleted = idx < builderStep;
            return (
              <div
                key={step.title}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : isCompleted
                      ? "bg-green-500/10 text-green-500"
                      : "text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="text-sm font-medium hidden sm:inline">
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="border rounded-lg p-6 bg-card">
          {/* Step 1: Identity */}
          {builderStep === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Agent Name *
                </label>
                <Input
                  value={builderDraft.name}
                  onChange={(e) => updateBuilderDraft({ name: e.target.value })}
                  placeholder="e.g. Sprint Planner, Meeting Scheduler"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Description
                </label>
                <Textarea
                  value={builderDraft.description || ""}
                  onChange={(e) =>
                    updateBuilderDraft({ description: e.target.value })
                  }
                  placeholder="What does this agent do?"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Avatar (emoji)
                </label>
                <Input
                  value={builderDraft.avatar || ""}
                  onChange={(e) =>
                    updateBuilderDraft({ avatar: e.target.value })
                  }
                  placeholder="🤖"
                  maxLength={10}
                  className="w-20"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Agent Type
                </label>
                <Select
                  value={builderDraft.agentType}
                  onValueChange={(val) =>
                    updateBuilderDraft({ agentType: val as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standalone">Standalone</SelectItem>
                    <SelectItem value="parent">
                      Parent (can have sub-agents)
                    </SelectItem>
                    {builderDraft.parentAgentId && (
                      <SelectItem value="sub_agent">Sub-agent</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {builderDraft.agentType === "sub_agent" &&
                  builderDraft.parentAgentId && (
                    <p className="text-xs text-muted-foreground mt-2">
                      This agent will be linked to its parent automatically after creation.
                    </p>
                  )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={builderDraft.isPublic}
                  onChange={(e) =>
                    updateBuilderDraft({ isPublic: e.target.checked })
                  }
                  className="rounded"
                />
                <label htmlFor="isPublic" className="text-sm">
                  Make this agent public (visible in explore)
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Instructions */}
          {builderStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  System Prompt *
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Define your agent's behavior, personality, and instructions.
                </p>
                <Textarea
                  value={builderDraft.systemPrompt}
                  onChange={(e) =>
                    updateBuilderDraft({ systemPrompt: e.target.value })
                  }
                  placeholder="You are a helpful project manager bot. Your job is to help users create tickets, plan sprints, and organize work..."
                  rows={8}
                  maxLength={10000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {builderDraft.systemPrompt.length}/10000
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Model *
                </label>
                <Select
                  value={builderDraft.model}
                  onValueChange={(val) => updateBuilderDraft({ model: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m: any) => (
                      <SelectItem key={m.slug} value={m.slug}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Temperature: {builderDraft.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={builderDraft.temperature}
                  onChange={(e) =>
                    updateBuilderDraft({
                      temperature: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Max Tokens (optional)
                </label>
                <Input
                  type="number"
                  value={builderDraft.maxTokens || ""}
                  onChange={(e) =>
                    updateBuilderDraft({
                      maxTokens: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="4096"
                  min={1}
                  max={128000}
                />
              </div>
            </div>
          )}

          {/* Step 3: Tools */}
          {builderStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select tools your agent can use. You can configure integrations
                after creating the agent.
              </p>
              <div className="grid gap-3">
                {(availableTools || []).map((tool: any) => {
                  const isSelected = builderDraft.tools.includes(tool.type);
                  return (
                    <div
                      key={tool.type}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "hover:border-muted-foreground/30"
                      }`}
                      onClick={() => {
                        const tools = isSelected
                          ? builderDraft.tools.filter((t) => t !== tool.type)
                          : [...builderDraft.tools, tool.type];
                        updateBuilderDraft({ tools });
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tool.description}
                        </p>
                      </div>
                      <div
                        className={`h-5 w-5 rounded border flex items-center justify-center ${
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {builderDraft.tools.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {builderDraft.tools.map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Deploy / Review */}
          {builderStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review & Create</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{builderDraft.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{builderDraft.agentType}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Model</span>
                  <span className="font-medium">{builderDraft.model}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Temperature</span>
                  <span className="font-medium">{builderDraft.temperature}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Tools</span>
                  <span className="font-medium">
                    {builderDraft.tools.length} selected
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Public</span>
                  <span className="font-medium">
                    {builderDraft.isPublic ? "Yes" : "No"}
                  </span>
                </div>
                <div className="py-2">
                  <span className="text-muted-foreground block mb-1">
                    System Prompt
                  </span>
                  <p className="text-xs bg-muted/50 p-3 rounded-lg max-h-32 overflow-auto">
                    {builderDraft.systemPrompt}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={builderStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {builderStep < STEPS.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Agent"}
              <Rocket className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
