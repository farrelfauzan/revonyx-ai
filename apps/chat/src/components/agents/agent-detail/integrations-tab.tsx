"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAttachIntegration, useRemoveIntegration } from "@/hooks/use-agents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IntegrationConnectDialog } from "@/components/agents/agent-detail/integration-connect-dialog";
import { IntegrationProviderLogo } from "@/components/agents/agent-detail/integration-provider-logo";
import {
  INTEGRATION_PROVIDERS,
  type IntegrationProvider,
} from "@/components/agents/agent-detail/integration-provider-config";

type IntegrationsTabProps = {
  agent: any;
  agentId: string;
};

export function IntegrationsTab({ agent, agentId }: IntegrationsTabProps) {
  const [activeProvider, setActiveProvider] = useState<IntegrationProvider | null>(null);
  const attachIntegration = useAttachIntegration();
  const removeIntegration = useRemoveIntegration();

  const handleConnect = async (
    values: Record<string, string>,
    provider: IntegrationProvider,
  ) => {
    try {
      await attachIntegration.mutateAsync({
        agentId,
        data: {
          provider: provider.id,
          config: values,
          scopes: provider.scopes,
        },
      });
      setActiveProvider(null);
      toast.success(`${provider.name} connected`);
    } catch {
      toast.error(`Failed to connect ${provider.name}`);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Connect external services to enable integration tools.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATION_PROVIDERS.map((provider) => {
          const existing = agent.integrations.find(
            (i: any) => i.provider === provider.id,
          );

          return (
            <div key={provider.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IntegrationProviderLogo
                    name={provider.name}
                    logoUrl={provider.logoUrl}
                    size="sm"
                  />
                  <div>
                    <p className="font-medium text-sm">{provider.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {provider.description}
                    </p>
                  </div>
                </div>
                {existing ? (
                  <Badge
                    variant="outline"
                    className="text-green-500 border-green-500/30"
                  >
                    Connected
                  </Badge>
                ) : null}
              </div>

              {existing && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    try {
                      await removeIntegration.mutateAsync({
                        agentId,
                        integrationId: existing.id,
                      });
                      toast.success(`${provider.name} disconnected`);
                    } catch {
                      toast.error("Failed to disconnect");
                    }
                  }}
                >
                  Disconnect
                </Button>
              )}

              {!existing && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setActiveProvider(provider)}
                >
                  Connect
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <IntegrationConnectDialog
        open={Boolean(activeProvider)}
        provider={activeProvider}
        isSubmitting={attachIntegration.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setActiveProvider(null);
          }
        }}
        onSubmit={handleConnect}
      />
    </div>
  );
}
