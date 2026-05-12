"use client";

import { LogIn, LogOut, Calendar, Clock, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useAttendance, useClockIn, useClockOut } from "@/hooks/use-attendance";
import { formatDate, formatTime, calculateHoursWorked, cn } from "@/lib/utils";

export default function AttendancePage() {
  const { data, isLoading } = useAttendance();
  const clockIn  = useClockIn();
  const clockOut = useClockOut();

  const todayRecord = data?.todayRecord;
  const records     = data?.data ?? [];
  const isClockedIn = !!todayRecord && !todayRecord.clockOut;
  const isComplete  = !!todayRecord?.clockOut;

  return (
    <div className="animate-fade-up">
      <PageHeader title="Attendance" description="Track your working hours" />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        {/* Status card */}
        <Card className={cn(
          "sm:col-span-1 border-0 shadow-sm overflow-hidden",
          isComplete  ? "bg-gradient-to-br from-blue-50  to-blue-50/20  dark:from-blue-950/20  dark:to-transparent" :
          isClockedIn ? "bg-gradient-to-br from-green-50 to-green-50/20 dark:from-green-950/20 dark:to-transparent" :
                        "bg-card"
        )}>
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today&apos;s Status</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className={cn(
                "w-2.5 h-2.5 rounded-full shrink-0",
                isComplete  ? "bg-blue-500" :
                isClockedIn ? "bg-green-500 animate-pulse" :
                              "bg-muted-foreground/40"
              )} />
              <span className={cn(
                "font-bold text-lg",
                isComplete  ? "text-blue-600  dark:text-blue-400"  :
                isClockedIn ? "text-green-600 dark:text-green-400" :
                              "text-foreground"
              )}>
                {isComplete ? "Done" : isClockedIn ? "Working" : "Absent"}
              </span>
            </div>

            {todayRecord && (
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Clock in</span>
                  <span className="font-semibold">{formatTime(todayRecord.clockIn)}</span>
                </div>
                {todayRecord.clockOut && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Clock out</span>
                      <span className="font-semibold">{formatTime(todayRecord.clockOut)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm border-t border-border/60 pt-2 mt-2">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-bold text-primary">{calculateHoursWorked(todayRecord.clockIn, todayRecord.clockOut)}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {!isComplete && (
              <Button
                className={cn("w-full h-10 font-semibold shadow-sm", isClockedIn ? "variant-outline" : "")}
                variant={isClockedIn ? "outline" : "default"}
                disabled={clockIn.isPending || clockOut.isPending}
                onClick={() => isClockedIn ? clockOut.mutate() : clockIn.mutate()}
              >
                {(clockIn.isPending || clockOut.isPending)
                  ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  : isClockedIn
                    ? <LogOut className="h-4 w-4 mr-2" />
                    : <LogIn className="h-4 w-4 mr-2" />
                }
                {isClockedIn ? "Clock Out" : "Clock In"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* History */}
        <Card className="sm:col-span-2 shadow-sm border-border/60">
          <CardHeader className="pb-2 pt-4 px-5 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Attendance History</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {isLoading ? (
              <TableSkeleton rows={5} />
            ) : records.length === 0 ? (
              <EmptyState icon={Calendar} title="No records yet" description="Your history appears here after your first clock-in." />
            ) : (
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/40">
                      {["Date","Clock In","Clock Out","Hours"].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {records.map((r: { id: string; date: string; clockIn: string; clockOut: string | null }) => (
                      <tr key={r.id} className="bg-card hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-medium">{formatDate(r.date)}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{formatTime(r.clockIn)}</td>
                        <td className="px-4 py-2.5">
                          {r.clockOut
                            ? <span className="text-muted-foreground">{formatTime(r.clockOut)}</span>
                            : <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Active</span>
                          }
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-primary">{calculateHoursWorked(r.clockIn, r.clockOut)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
