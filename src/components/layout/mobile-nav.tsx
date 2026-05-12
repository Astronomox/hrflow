"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, MessageSquare, FolderOpen, CalendarOff } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNav = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Attendance", href: "/attendance", icon: Clock },
  { title: "Leave", href: "/leave", icon: CalendarOff },
  { title: "Messages", href: "/messages", icon: MessageSquare },
  { title: "Files", href: "/files", icon: FolderOpen },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t flex items-center justify-around h-16 px-2">
      {mobileNav.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
