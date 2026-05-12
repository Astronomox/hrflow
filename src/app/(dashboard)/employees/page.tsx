"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmployeeTable } from "@/components/employees/employee-table";
import { useEmployees, useDeactivateEmployee } from "@/hooks/use-employees";
import { useDepartments } from "@/hooks/use-departments";
import { useCurrentUser } from "@/hooks/use-current-user";
import { EMPLOYMENT_STATUSES } from "@/lib/constants";
import { EmploymentStatus } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function EmployeesPage() {
  const { isAdminOrHR } = useCurrentUser();
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  const { data, isLoading } = useEmployees({ search, departmentId, status: status as EmploymentStatus, page });
  const { data: deptData } = useDepartments();
  const deactivate = useDeactivateEmployee();

  const employees = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const departments = deptData?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Employees"
        description={`${data?.total ?? 0} total employees`}
        action={
          isAdminOrHR && (
            <Button asChild>
              <Link href="/employees/new">
                <Plus className="h-4 w-4 mr-2" /> Add Employee
              </Link>
            </Button>
          )
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, position..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={departmentId} onValueChange={(v) => { setDepartmentId(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d: { id: string; name: string }) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(EMPLOYMENT_STATUSES).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description={search ? "Try a different search term." : "Get started by adding your first employee."}
          action={isAdminOrHR ? <Button asChild><Link href="/employees/new"><Plus className="h-4 w-4 mr-2" />Add Employee</Link></Button> : undefined}
        />
      ) : (
        <>
          <EmployeeTable
            employees={employees}
            onDeactivate={setDeactivateId}
            canManage={isAdminOrHR}
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deactivateId}
        onOpenChange={() => setDeactivateId(null)}
        title="Deactivate employee?"
        description="This will mark the employee as inactive. They will lose access to the platform."
        confirmLabel="Deactivate"
        variant="destructive"
        isLoading={deactivate.isPending}
        onConfirm={() => {
          if (deactivateId) {
            deactivate.mutate(deactivateId, { onSuccess: () => setDeactivateId(null) });
          }
        }}
      />
    </div>
  );
}
