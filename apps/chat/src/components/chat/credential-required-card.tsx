"use client";

import { ExternalLink, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStartUserOAuth } from "@/hooks/use-user-mcp";
import { toast } from "sonner";

const PROVIDER_LABELS: Record<string, string> = {
  "google-gmail": "Google Gmail",
  "google-calendar": "Google Calendar",
  "google-sheets": "Google Sheets",
  github: "GitHub",
  slack: "Slack",
};

interface CredentialRequiredCardProps {
  provider: string;
  workspaceId: string | null;
}

/**
 * Inline card shown in chat when an agent needs a tool
 * that the user hasn't connected yet.
 */
export function CredentialRequiredCard({
  provider,
  workspaceId,
}: CredentialRequiredCardProps) {
  const startOAuth = useStartUserOAuth();
  const label = PROVIDER_LABELS[provider] || provider;

  const handleConnect = async () => {
    if (!workspaceId) {
      toast.error("No workspace context available");
      return;
    }
    try {
      const { authUrl } = await startOAuth.mutateAsync({
        provider,
        workspaceId,
      });
      window.location.href = authUrl;
    } catch {
      toast.error("Failed to start authorization");
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 max-w-md">
      <div className="flex items-start gap-3">
        <KeyRound className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Connection required
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            This action requires access to your {label} account. Connect it to
            allow the agent to perform this task on your behalf.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900"
            onClick={handleConnect}
            disabled={startOAuth.isPending || !workspaceId}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Connect {label}
          </Button>
        </div>
      </div>
    </div>
  );
}
