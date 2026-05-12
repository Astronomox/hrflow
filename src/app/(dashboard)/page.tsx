"use client";

import Link from "next/link";
import { Users, Clock, CalendarOff, Building2, MessageSquare, TrendingUp, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { StatCardSkeleton, Skeleton } from "@/components/shared/loading-skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatRelativeTime, cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

const PIE_COLORS = ["#4f7dfc", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4"];

const STAT_CONFIG = [
  { key: "totalEmployees",     label: "Total Employees",  icon: Users,       cls: "stat-blue",   iconCls: "text-primary",   valueCls: "text-primary",  sub: "Active headcount"   },
  { key: "presentToday",       label: "Present Today",    icon: Clock,       cls: "stat-green",  iconCls: "text-green-600", valueCls: "text-green-600", sub: "Clocked in today"  },
  { key: "pendingLeaveRequests",label: "Pending Leave",  icon: CalendarOff, cls: "stat-amber",  iconCls: "text-amber-600", valueCls: "text-amber-600", sub: "Awaiting review"   },
  { key: "totalDepartments",   label: "Departments",      icon: Building2,   cls: "stat-violet", iconCls: "text-violet-600",valueCls: "text-violet-600",sub: "Active departments" },
] as const;

function useDashboard() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const r = await fetch("/api/dashboard/stats");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    refetchInterval: 30000,
  });
}

function StatCard({ label, value, icon: Icon, cls, iconCls, valueCls, sub, href }: {
  label: string; value: number; icon: React.ElementType;
  cls: string; iconCls: string; valueCls: string; sub: string; href?: string;
}) {
  return (
    <Card className={cn("border-0 shadow-sm overflow-hidden group cursor-default", cls)}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg bg-background/70 backdrop-blur-sm", iconCls)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className={cn("text-3xl font-bold tracking-tight", valueCls)}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold">{label}</p>
      <p className="text-primary">{payload[0].value} present</p>
    </div>
  );
};

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const { isAdminOrHR } = useCurrentUser();
  const s = data?.data;

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : STAT_CONFIG.map(cfg => (
            <StatCard key={cfg.key} label={cfg.label} icon={cfg.icon} cls={cfg.cls} iconCls={cfg.iconCls} valueCls={cfg.valueCls} sub={cfg.sub} value={s?.[cfg.key] ?? 0} />
          ))
        }
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm border-border/60">
          <CardHeader className="pb-1 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Attendance: Last 7 Days
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {isLoading ? <div className="h-44 bg-muted animate-pulse rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={176}>
                <LineChart data={s?.attendanceTrend ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(226 70% 55%)" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(226 70% 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 18% 91%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(220 10% 52%)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(220 10% 52%)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" stroke="hsl(226 70% 55%)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(226 70% 55%)", strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} name="Present" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">Leave by Type</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {isLoading ? <div className="h-44 bg-muted animate-pulse rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={176}>
                <PieChart>
                  <Pie data={s?.leaveByType ?? []} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={68} innerRadius={32} paddingAngle={3} strokeWidth={0}>
                    {(s?.leaveByType ?? []).map((_: unknown, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(220 18% 91%)" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm border-border/60">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">Employees by Department</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {isLoading ? <div className="h-36 bg-muted animate-pulse rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={144}>
                <BarChart data={s?.employeesByDepartment ?? []} barSize={32} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 18% 91%)" />
                  <XAxis dataKey="department" tick={{ fontSize: 11, fill: "hsl(220 10% 52%)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(220 10% 52%)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(220 18% 91%)" }} />
                  <Bar dataKey="count" fill="hsl(226 70% 55%)" radius={[5, 5, 0, 0]} name="Employees" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-2">
            {[
              { href: "/attendance", icon: Clock,       label: "Clock In / Out",  color: "text-green-600 bg-green-50 dark:bg-green-950/30"  },
              { href: "/leave",      icon: CalendarOff, label: "Request Leave",   color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30"  },
              { href: "/messages",   icon: MessageSquare,label: "Send Message",   color: "text-primary   bg-primary/5"                      },
              ...(isAdminOrHR ? [{ href: "/employees/new", icon: Users, label: "Add Employee", color: "text-violet-600 bg-violet-50 dark:bg-violet-950/30" }] : []),
            ].map(({ href, icon: Icon, label, color }) => (
              <Link key={href} href={href} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-primary/[.02] transition-all group">
                <div className={cn("flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0", color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-medium flex-1">{label}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Activity */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-1 pt-4 px-5">
          <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
          ) : (s?.recentActivity ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No recent activity.</p>
          ) : (
            <div className="space-y-1">
              {(s?.recentActivity ?? []).map((item: { id: string; description: string; actorName: string; timestamp: string }) => (
                <div key={item.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <p className="text-sm flex-1">
                    <span className="font-medium">{item.actorName}</span>{" "}
                    <span className="text-muted-foreground">{item.description}</span>
                  </p>
                  <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(item.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
