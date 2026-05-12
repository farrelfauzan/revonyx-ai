"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores";
import { apiClient } from "@/lib/api-client";

/**
 * On mount, verify the stored JWT by calling /auth/me.
 * If valid, refresh email + balance. If invalid, clear auth state.
 * Also invalidates portal queries so tier is re-evaluated.
 */
export function useAuthHydration() {
  const { jwt, setAuth, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!jwt) return;

    apiClient
      .get<{ id: string; email: string; balance: number }>("/auth/me")
      .then((user) => {
        setAuth(jwt, user.email, Number(user.balance));
        queryClient.invalidateQueries({ queryKey: ["portal-usage"] });
        queryClient.invalidateQueries({ queryKey: ["portal-models"] });
      })
      .catch(() => {
        // JWT expired or invalid — clear auth
        logout();
        queryClient.invalidateQueries({ queryKey: ["portal-usage"] });
        queryClient.invalidateQueries({ queryKey: ["portal-models"] });
      });
  }, [jwt, setAuth, logout, queryClient]);
}
