"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const { sidebarOpen } = useUIStore();

  if (status === "unauthenticated") redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarOpen ? "md:pl-[260px]" : "md:pl-[68px]"
      )}>
        <Topbar />
        <main className="p-4 md:p-5 pb-20 md:pb-5 min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
