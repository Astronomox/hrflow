"use client";

import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";

export function useCurrentUser() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isAdmin: session?.user?.role === Role.ADMIN,
    isHR: session?.user?.role === Role.HR_MANAGER,
    isAdminOrHR:
      session?.user?.role === Role.ADMIN ||
      session?.user?.role === Role.HR_MANAGER,
    employeeId: session?.user?.employeeId,
  };
}
