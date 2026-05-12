"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useUIStore } from "@/stores/ui-store";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const { sidebarOpen } = useUIStore();
  useIdleTimeout();

  if (status === "unauthenticated") redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarOpen ? "md:pl-[260px]" : "md:pl-[68px]"
      )}>
        <Topbar />
        <main className="p-4 md:p-5 min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
