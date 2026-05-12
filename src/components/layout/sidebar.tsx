"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Users, Building2, Clock, CalendarOff,
  Briefcase, UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Role } from "@prisma/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { title: "Dashboard",        href: "/",             icon: LayoutDashboard, roles: [Role.ADMIN, Role.HR_MANAGER, Role.EMPLOYEE], section: "Overview"       },
  { title: "Employees",        href: "/employees",    icon: Users,           roles: [Role.ADMIN, Role.HR_MANAGER],                section: "People"         },
  { title: "Departments",      href: "/departments",  icon: Building2,       roles: [Role.ADMIN, Role.HR_MANAGER],                section: "People"         },
  { title: "Attendance",       href: "/attendance",   icon: Clock,           roles: [Role.ADMIN, Role.HR_MANAGER, Role.EMPLOYEE], section: "Work"           },
  { title: "My Leave",         href: "/leave",        icon: CalendarOff,     roles: [Role.ADMIN, Role.HR_MANAGER, Role.EMPLOYEE], section: "Work"           },
  { title: "Leave Management", href: "/leave/manage", icon: ClipboardList,   roles: [Role.ADMIN, Role.HR_MANAGER],                section: "Work"           },
  { title: "Messages",         href: "/messages",     icon: MessageSquare,   roles: [Role.ADMIN, Role.HR_MANAGER, Role.EMPLOYEE], section: "Communication"  },
  { title: "Files",            href: "/files",        icon: FolderOpen,      roles: [Role.ADMIN, Role.HR_MANAGER, Role.EMPLOYEE], section: "Communication"  },
  { title: "My Profile",       href: "/profile",      icon: UserCircle,      roles: [Role.ADMIN, Role.HR_MANAGER, Role.EMPLOYEE], section: "Account"        },
];

export function Sidebar() {
  const pathname   = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user }   = useCurrentUser();

  const visible = navItems.filter(item =>
    user?.role ? item.roles.includes(user.role as Role) : false
  );

  const sections: { label: string; items: typeof navItems }[] = [];
  let cur = "";
  for (const item of visible) {
    if (item.section !== cur) { sections.push({ label: item.section, items: [] }); cur = item.section; }
    sections[sections.length - 1].items.push(item);
  }

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "sidebar-glass hidden md:flex flex-col fixed left-0 top-0 z-30 h-full transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-[260px]" : "w-[68px]"
      )}>
        <div className={cn(
          "flex items-center h-14 px-3 border-b border-border shrink-0",
          sidebarOpen ? "justify-between" : "justify-center"
        )}>
          {sidebarOpen ? (
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-xl shrink-0 shadow-sm shadow-primary/30 transition-transform group-hover:scale-105">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight">HRFlow</span>
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Workspace</p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-xl shadow-sm shadow-primary/30">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 py-3">
          {!sidebarOpen ? (
            <div className="space-y-0.5 px-2">
              {visible.map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link href={item.href} className={cn(
                        "flex items-center justify-center h-9 w-9 mx-auto rounded-lg transition-all duration-150",
                        active ? "bg-primary text-white shadow-sm shadow-primary/25" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}>
                        <Icon className="h-[18px] w-[18px]" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">{item.title}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 px-3">
              {sections.map(({ label, items }) => (
                <div key={label}>
                  <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">{label}</p>
                  <div className="space-y-0.5">
                    {items.map(item => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link key={item.href} href={item.href} className={cn(
                          "flex items-center gap-3 h-9 px-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                          active ? "bg-primary text-white shadow-sm shadow-primary/20" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}>
                          <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-150", !active && "group-hover:scale-110")} />
                          <span className="truncate">{item.title}</span>
                          {active && <div className="ml-auto w-1 h-4 bg-white/40 rounded-full" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t border-border">
          {sidebarOpen ? (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 w-full h-9 px-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-150 group"
            >
              <LogOut className="h-4 w-4 shrink-0 group-hover:scale-110 transition-transform" />
              <span>Sign out</span>
            </button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center justify-center h-9 w-9 mx-auto rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
