"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Megaphone, CalendarOff, MessageSquare, Users, Info, X } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { NotificationType } from "@prisma/client";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  LEAVE_SUBMITTED: { icon: CalendarOff,   color: "text-amber-600",  bg: "bg-amber-100  dark:bg-amber-900/30"  },
  LEAVE_APPROVED:  { icon: Check,         color: "text-green-600",  bg: "bg-green-100  dark:bg-green-900/30"  },
  LEAVE_REJECTED:  { icon: X,             color: "text-red-600",    bg: "bg-red-100    dark:bg-red-900/30"    },
  NEW_MESSAGE:     { icon: MessageSquare, color: "text-blue-600",   bg: "bg-blue-100   dark:bg-blue-900/30"   },
  NEW_EMPLOYEE:    { icon: Users,         color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-900/30" },
  SYSTEM:          { icon: Info,          color: "text-gray-600",   bg: "bg-gray-100   dark:bg-gray-900/30"   },
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const qc = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ data: Notification[]; unreadCount: number }>;
    },
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // SSE for real-time
  useEffect(() => {
    const es = new EventSource("/api/notifications/stream");
    esRef.current = es;

    es.addEventListener("notification", (event) => {
      const payload = JSON.parse(event.data);
      qc.setQueryData(["notifications"], (old: { data: Notification[]; unreadCount: number } | undefined) => {
        if (!old) return old;
        const existingIds = new Set(old.data.map((n) => n.id));
        const fresh = payload.notifications.filter((n: Notification) => !existingIds.has(n.id));
        return {
          data: [...fresh, ...old.data].slice(0, 30),
          unreadCount: payload.unreadCount,
        };
      });
    });

    return () => { es.close(); esRef.current = null; };
  }, [qc]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const notifications = data?.data ?? [];
  const unread = data?.unreadCount ?? 0;

  function handleNotifClick(notif: Notification) {
    if (!notif.read) markRead.mutate(notif.id);
    if (notif.link) {
      router.push(notif.link);
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
          open ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full animate-in zoom-in-50 duration-200">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in-0 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Notifications</span>
              {unread > 0 && (
                <span className="bg-primary/10 text-primary text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-4">
                <div className="flex items-center justify-center w-12 h-12 bg-muted rounded-full">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">All caught up</p>
                <p className="text-xs text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {notifications.map((notif) => {
                  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.SYSTEM;
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                        !notif.read && "bg-primary/[.03]"
                      )}
                    >
                      {/* Icon */}
                      <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5", cfg.bg)}>
                        <Icon className={cn("h-4 w-4", cfg.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm leading-snug", !notif.read ? "font-semibold" : "font-medium text-muted-foreground")}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{formatRelativeTime(notif.createdAt)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2.5">
              <p className="text-xs text-muted-foreground text-center">Showing last {notifications.length} notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
