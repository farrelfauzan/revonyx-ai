"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreateMcpServer,
  useStartGoogleOAuth,
  useGoogleCredentials,
  useSaveGoogleCredentials,
} from "@/hooks/use-mcp";
import type { McpRegistryEntry } from "@/lib/mcp-types";

type McpConnectDialogProps = {
  provider: McpRegistryEntry;
  workspaceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function McpConnectDialog({
  provider,
  workspaceId,
  open,
  onOpenChange,
}: McpConnectDialogProps) {
  const [envValues, setEnvValues] = useState<Record<string, string>>({});
  const [googleCreds, setGoogleCreds] = useState({ clientId: "", clientSecret: "" });
  const createServer = useCreateMcpServer();
  const startOAuth = useStartGoogleOAuth();
  const { data: credStatus } = useGoogleCredentials(workspaceId);
  const saveCreds = useSaveGoogleCredentials();
  console.log("Save Cred  Status:", { credStatus, googleCreds, saveCreds });

  const isOAuthProvider = provider.authType === "oauth" && provider.name.startsWith("google-");
  const hasStoredCreds = credStatus?.hasCredentials ?? false;
  const workspaceReady = !!workspaceId;

  const handleSaveCredsAndOAuth = async () => {
    if (!googleCreds.clientId.trim() || !googleCreds.clientSecret.trim()) {
      toast.error("Please fill in both Client ID and Client Secret");
      return;
    }
    if (!workspaceId) {
      toast.error("No active workspace selected");
      return;
    }

    try {
      await saveCreds.mutateAsync({
        workspaceId: workspaceId,
        clientId: googleCreds.clientId.trim(),
        clientSecret: googleCreds.clientSecret.trim(),
      });
      // Immediately start OAuth after saving
      const { authUrl } = await startOAuth.mutateAsync({
        provider: provider.name,
        workspaceId: workspaceId,
      });
      window.location.href = authUrl;
    } catch {
      toast.error("Failed to save credentials");
    }
  };

  const handleOAuthConnect = async () => {
    if (!workspaceId) {
      toast.error("No active workspace selected");
      return;
    }
    try {
      const { authUrl } = await startOAuth.mutateAsync({
        provider: provider.name,
        workspaceId: workspaceId,
      });
      window.location.href = authUrl;
    } catch {
      toast.error(`Failed to start ${provider.displayName} authorization`);
    }
  };

  const handleConnect = async () => {
    const missing = provider.envKeys.filter((key) => !envValues[key]?.trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.join(", ")}`);
      return;
    }

    try {
      await createServer.mutateAsync({
        name: provider.name,
        displayName: provider.displayName,
        transport: provider.transport,
        command: "npx",
        args: ["-y", provider.package],
        env: envValues,
      });
      toast.success(`${provider.displayName} connected!`);
      onOpenChange(false);
      setEnvValues({});
    } catch {
      toast.error(`Failed to connect ${provider.displayName}`);
    }
  };

  const formatEnvLabel = (key: string): string => {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace("Api ", "API ")
      .replace("Oauth ", "OAuth ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect {provider.displayName}</DialogTitle>
          <DialogDescription>{provider.description}</DialogDescription>
        </DialogHeader>

        {isOAuthProvider ? (
          hasStoredCreds ? (
            // User already has credentials saved — just authorize
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Your Google OAuth credentials are configured. Click below to
                authorize {provider.displayName} access.
              </p>
              <Button
                className="w-full"
                onClick={handleOAuthConnect}
                disabled={!workspaceReady || startOAuth.isPending}
              >
                {startOAuth.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Authorize with Google
              </Button>
            </div>
          ) : (
            // First time — ask for client credentials
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Enter your Google OAuth credentials. You only need to do this once — all
                Google integrations will reuse them.
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Client ID</label>
                  <Input
                    placeholder="your-client-id.apps.googleusercontent.com"
                    value={googleCreds.clientId}
                    onChange={(e) =>
                      setGoogleCreds((p) => ({ ...p, clientId: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Client Secret</label>
                  <Input
                    type="password"
                    placeholder="GOCSPX-..."
                    value={googleCreds.clientSecret}
                    onChange={(e) =>
                      setGoogleCreds((p) => ({ ...p, clientSecret: e.target.value }))
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Create a <strong>Web application</strong> OAuth client at{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Google Cloud Console
                </a>
                . Add this as an authorized redirect URI:{" "}
                <code className="text-xs bg-muted px-1 rounded break-all">
                  {process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/v1/mcp/oauth/google/callback
                </code>
              </p>
              <Button
                className="w-full"
                onClick={handleSaveCredsAndOAuth}
                disabled={!workspaceReady || saveCreds.isPending || startOAuth.isPending}
              >
                {(!workspaceReady || saveCreds.isPending || startOAuth.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {!workspaceReady ? "Setting up workspace..." : "Save & Authorize"}
              </Button>
            </div>
          )
        ) : (
          <>
            <div className="space-y-4 py-4">
              {provider.envKeys.map((key) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-sm font-medium">{formatEnvLabel(key)}</label>
                  <Input
                    type="password"
                    placeholder={`Enter ${formatEnvLabel(key).toLowerCase()}`}
                    value={envValues[key] || ""}
                    onChange={(e) =>
                      setEnvValues((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}

              {provider.docsUrl && (
                <p className="text-xs text-muted-foreground">
                  Need help?{" "}
                  <a
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    View documentation
                  </a>
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleConnect} disabled={createServer.isPending}>
                {createServer.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Connect & Test
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
