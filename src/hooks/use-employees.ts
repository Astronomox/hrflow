import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import type { EmployeeFilters, CreateEmployeeInput, UpdateEmployeeInput } from "@/types";

const EMPLOYEES_KEY = "employees";

async function fetchEmployees(filters: EmployeeFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.departmentId) params.set("departmentId", filters.departmentId);
  if (filters.status) params.set("status", filters.status);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  const res = await fetch(`/api/employees?${params}`);
  if (!res.ok) throw new Error("Failed to fetch employees");
  return res.json();
}

async function fetchEmployee(id: string) {
  const res = await fetch(`/api/employees/${id}`);
  if (!res.ok) throw new Error("Employee not found");
  return res.json();
}

export function useEmployees(filters: EmployeeFilters = {}) {
  return useQuery({
    queryKey: [EMPLOYEES_KEY, filters],
    queryFn: () => fetchEmployees(filters),
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: [EMPLOYEES_KEY, id],
    queryFn: () => fetchEmployee(id),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateEmployeeInput) => {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create employee");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMPLOYEES_KEY] });
      toast({ title: "Employee created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create employee", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateEmployeeInput) => {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update employee");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMPLOYEES_KEY] });
      toast({ title: "Employee updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update employee", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeactivateEmployee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to deactivate employee");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMPLOYEES_KEY] });
      toast({ title: "Employee deactivated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to deactivate employee", description: error.message, variant: "destructive" });
    },
  });
}
