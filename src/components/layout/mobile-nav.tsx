"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Clock, MessageSquare, FolderOpen,
  CalendarOff, UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNav = [
  { title: "Dashboard",  href: "/",           icon: LayoutDashboard },
  { title: "Attendance", href: "/attendance",  icon: Clock           },
  { title: "Leave",      href: "/leave",       icon: CalendarOff     },
  { title: "Messages",   href: "/messages",    icon: MessageSquare   },
  { title: "Profile",    href: "/profile",     icon: UserCircle      },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-14 rounded-xl transition-colors min-w-0",
                active
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground active:bg-accent"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium truncate">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
