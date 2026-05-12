"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, CalendarOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { useLeave, useCreateLeave } from "@/hooks/use-leave";
import { createLeaveSchema, type CreateLeaveInput } from "@/lib/validations/leave";
import { LEAVE_TYPES, LEAVE_STATUS_COLORS } from "@/lib/constants";
import { LeaveType, LeaveStatus } from "@prisma/client";
import { formatDate } from "@/lib/utils";

export default function LeavePage() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useLeave();
  const createLeave = useCreateLeave();
  const requests = data?.data ?? [];

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<CreateLeaveInput>({
    resolver: zodResolver(createLeaveSchema),
  });

  function onSubmit(data: CreateLeaveInput) {
    createLeave.mutate(data, { onSuccess: () => { setOpen(false); reset(); } });
  }

  return (
    <div>
      <PageHeader
        title="Leave Requests"
        description="Manage your time off"
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Request Leave</Button>}
      />

      {isLoading ? <TableSkeleton rows={5} /> : requests.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title="No leave requests"
          description="Submit your first leave request."
          action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Request Leave</Button>}
        />
      ) : (
        <div className="space-y-3">
          {requests.map((r: {
            id: string; leaveType: LeaveType; startDate: string;
            endDate: string; reason: string; status: LeaveStatus;
            createdAt: string; reviewNote?: string | null;
          }) => (
            <Card key={r.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-sm">{LEAVE_TYPES[r.leaveType]}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${LEAVE_STATUS_COLORS[r.status]}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatDate(r.startDate)} — {formatDate(r.endDate)}</p>
                    <p className="text-sm mt-2 text-foreground/80">{r.reason}</p>
                    {r.reviewNote && (
                      <p className="text-xs text-muted-foreground mt-1 italic border-l-2 border-muted pl-2">
                        Reviewer note: {r.reviewNote}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">{formatDate(r.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Request Leave</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Leave type</Label>
              <Select onValueChange={(v) => setValue("leaveType", v as LeaveType)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAVE_TYPES).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.leaveType && <p className="text-sm text-destructive">{errors.leaveType.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input type="date" {...register("startDate")} />
                {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>End date</Label>
                <Input type="date" {...register("endDate")} />
                {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                {...register("reason")}
                placeholder="Please describe the reason for your leave..."
                className="min-h-[100px]"
              />
              {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createLeave.isPending}>
                {createLeave.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
