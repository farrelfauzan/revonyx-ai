"use client";

import { usePortalUsage } from "@/hooks/use-portal";
import { useAuthStore, useHydrated } from "@/lib/stores";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import Link from "next/link";

export function ChatHeader() {
  const { data: usage } = usePortalUsage();
  const { email, logout, isLoggedIn } = useAuthStore();
  const queryClient = useQueryClient();
  const hydrated = useHydrated();
  const isPaid = usage?.tier === "paid";

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3" />

        <div className="flex items-center gap-2">
          {/* Usage pill */}
          {usage && !isPaid && (
            <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1 text-[11px] text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>
                {usage.remaining ?? 0} left
              </span>
            </div>
          )}

          {usage && isPaid && (
            <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1 text-[11px] text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              <span>${Number(usage.balance ?? 0).toFixed(2)}</span>
            </div>
          )}

          {/* <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            title="New chat"
            className="h-8 w-8 rounded-lg hover:bg-secondary/60"
          >
            <Plus className="h-4 w-4" />
          </Button> */}

          {hydrated && isLoggedIn() ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground hidden sm:inline max-w-30 truncate">
                {email}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  logout();
                  queryClient.invalidateQueries({ queryKey: ["portal-usage"] });
                  queryClient.invalidateQueries({ queryKey: ["portal-models"] });
                }}
                title="Logout"
                className="h-8 w-8 rounded-lg hover:bg-secondary/60"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : hydrated ? (
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-xs gap-1.5 hover:bg-secondary/60"
              >
                <LogIn className="h-3.5 w-3.5" /> Sign In
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
