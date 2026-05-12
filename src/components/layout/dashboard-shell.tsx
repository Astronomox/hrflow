"use client";

import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useUIStore();

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarOpen ? "md:pl-[260px]" : "md:pl-[68px]"
      )}
    >
      {children}
    </div>
  );
}
