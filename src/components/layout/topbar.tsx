"use client";

import { Menu, Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { UserAvatar } from "@/components/shared/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLES } from "@/lib/constants";
import { Role } from "@prisma/client";
import { cn } from "@/lib/utils";

const pageMeta: Record<string, { title: string; desc?: string }> = {
  "/":             { title: "Dashboard",        desc: "Overview of your workspace" },
  "/employees":    { title: "Employees",        desc: "Manage your team" },
  "/departments":  { title: "Departments",      desc: "Organisational structure" },
  "/attendance":   { title: "Attendance",       desc: "Track working hours" },
  "/leave":        { title: "Leave Requests",   desc: "Your time off requests" },
  "/leave/manage": { title: "Leave Management", desc: "Review and approve requests" },
  "/messages":     { title: "Messages",         desc: "Internal communications" },
  "/files":        { title: "Files",            desc: "Shared documents and uploads" },
};

export function Topbar() {
  const { toggleSidebar } = useUIStore();
  const { user } = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const meta = Object.entries(pageMeta).find(([key]) =>
    key === "/" ? pathname === "/" : pathname.startsWith(key)
  )?.[1] ?? { title: "HRFlow" };

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Menu className="h-4.5 w-[18px] h-[18px]" />
        </button>
        <div className="hidden sm:block">
          <h2 className="font-semibold text-sm leading-none">{meta.title}</h2>
          {meta.desc && <p className="text-xs text-muted-foreground mt-0.5">{meta.desc}</p>}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </button>

        <button className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative">
          <Bell className="h-4 w-4" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 ml-1 rounded-xl px-2 py-1.5 hover:bg-accent transition-colors">
              <UserAvatar name={user?.name ?? "User"} size="sm" />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold leading-none">{user?.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {user?.role ? ROLES[user.role as Role] : ""}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="pb-1">
              <p className="font-semibold text-sm">{user?.name}</p>
              <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer text-sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
