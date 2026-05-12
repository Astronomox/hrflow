import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

const KEY = "attendance";

export function useAttendance(filters: { employeeId?: string; startDate?: string; endDate?: string; page?: number } = {}) {
  const params = new URLSearchParams();
  if (filters.employeeId) params.set("employeeId", filters.employeeId);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.page) params.set("page", String(filters.page));

  return useQuery({
    queryKey: [KEY, filters],
    queryFn: async () => {
      const res = await fetch(`/api/attendance?${params}`);
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
  });
}

export function useClockIn() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/attendance", { method: "POST" });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Failed to clock in"); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast({ title: "Clocked in successfully" }); },
    onError: (e: Error) => toast({ title: "Clock in failed", description: e.message, variant: "destructive" }),
  });
}

export function useClockOut() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/attendance/clock-out", { method: "PATCH" });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Failed to clock out"); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast({ title: "Clocked out successfully" }); },
    onError: (e: Error) => toast({ title: "Clock out failed", description: e.message, variant: "destructive" }),
  });
}
