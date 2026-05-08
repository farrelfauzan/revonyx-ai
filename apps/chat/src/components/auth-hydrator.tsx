"use client";

import { useAuthHydration } from "@/hooks/use-auth-hydration";

export function AuthHydrator() {
  useAuthHydration();
  return null;
}
