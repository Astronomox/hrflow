"use client";

import { useState } from "react";
import { CheckCircle, XCircle, ClipboardList, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { UserAvatar } from "@/components/shared/avatar";
import { useLeave, useReviewLeave } from "@/hooks/use-leave";
import { LEAVE_TYPES, LEAVE_STATUS_COLORS } from "@/lib/constants";
import { LeaveStatus, LeaveType } from "@prisma/client";
import { formatDate } from "@/lib/utils";

export default function LeaveManagePage() {
  const { data, isLoading } = useLeave({ all: true, status: LeaveStatus.PENDING });
  const review = useReviewLeave();
  const [reviewTarget, setReviewTarget] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [note, setNote] = useState("");
  const requests = data?.data ?? [];

  function handleReview() {
    if (!reviewTarget) return;
    review.mutate(
      { id: reviewTarget.id, data: { status: reviewTarget.action === "approve" ? LeaveStatus.APPROVED : LeaveStatus.REJECTED, reviewNote: note } },
      { onSuccess: () => { setReviewTarget(null); setNote(""); } }
    );
  }

  return (
    <div>
      <PageHeader title="Leave Management" description={`${requests.length} pending request${requests.length !== 1 ? "s" : ""}`} />

      {isLoading ? <TableSkeleton rows={5} /> : requests.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No pending requests" description="All leave requests have been reviewed." />
      ) : (
        <div className="space-y-3">
          {requests.map((r: { id: string; leaveType: LeaveType; startDate: string; endDate: string; reason: string; status: LeaveStatus; createdAt: string; employee: { user: { name: string; email: string }; department?: { name: string } | null; position: string } }) => (
            <Card key={r.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <UserAvatar name={r.employee.user.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{r.employee.user.name}</span>
                        <span className="text-xs text-muted-foreground">{r.employee.position}</span>
                        {r.employee.department && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{r.employee.department.name}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{LEAVE_TYPES[r.leaveType]} — {formatDate(r.startDate)} to {formatDate(r.endDate)}</p>
                      <p className="text-sm mt-1">{r.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300" onClick={() => setReviewTarget({ id: r.id, action: "approve" })}>
                      <CheckCircle className="h-4 w-4 mr-1.5" />Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => setReviewTarget({ id: r.id, action: "reject" })}>
                      <XCircle className="h-4 w-4 mr-1.5" />Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!reviewTarget} onOpenChange={(o) => !o && setReviewTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{reviewTarget?.action === "approve" ? "Approve" : "Reject"} Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Add an optional note for the employee.</p>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewTarget(null)}>Cancel</Button>
            <Button onClick={handleReview} disabled={review.isPending} className={reviewTarget?.action === "reject" ? "bg-destructive hover:bg-destructive/90" : ""}>
              {review.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {reviewTarget?.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
