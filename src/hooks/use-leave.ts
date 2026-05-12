import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import type { CreateLeaveInput, ReviewLeaveInput } from "@/lib/validations/leave";

const KEY = "leave";

export function useLeave(filters: { status?: string; all?: boolean; page?: number } = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.all) params.set("all", "true");
  if (filters.page) params.set("page", String(filters.page));

  return useQuery({
    queryKey: [KEY, filters],
    queryFn: async () => {
      const res = await fetch(`/api/leave?${params}`);
      if (!res.ok) throw new Error("Failed to fetch leave requests");
      return res.json();
    },
  });
}

export function useCreateLeave() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: CreateLeaveInput) => {
      const res = await fetch("/api/leave", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Failed"); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast({ title: "Leave request submitted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useReviewLeave() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReviewLeaveInput }) => {
      const res = await fetch(`/api/leave/${id}/review`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Failed"); }
      return res.json();
    },
    onSuccess: (_, { data }) => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast({ title: `Leave request ${data.status.toLowerCase()}` });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
