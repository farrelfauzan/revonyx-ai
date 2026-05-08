"use client";

import { ChatHeader } from "@/components/chat-header";
import { ChatMessages } from "@/components/chat-messages";
import { ChatInput } from "@/components/chat-input";
import { AppSidebar } from "@/components/chat-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useAuthStore, useHydrated } from "@/lib/stores";
import { usePortalUsage, usePortalModels } from "@/hooks/use-portal";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  const hydrated = useHydrated();
  const { isLoggedIn } = useAuthStore();
  const showSidebar = hydrated && isLoggedIn();
  const { isLoading: usageLoading } = usePortalUsage();
  const { isLoading: modelsLoading } = usePortalModels();

  const contentReady = hydrated && !usageLoading && !modelsLoading;

  return (
    <SidebarProvider defaultOpen={true}>
      {showSidebar && <AppSidebar />}
      <SidebarInset className="h-svh overflow-hidden">
        <ChatHeader />
        {contentReady ? (
          <>
            <ChatMessages />
            <ChatInput />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
