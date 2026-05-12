"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EditEmployeeForm } from "@/components/employees/employee-form";
import { useEmployee, useUpdateEmployee } from "@/hooks/use-employees";
import { Skeleton } from "@/components/shared/loading-skeleton";
import type { UpdateEmployeeInput } from "@/lib/validations/employee";

export default function EditEmployeePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data, isLoading } = useEmployee(params.id);
  const updateEmployee = useUpdateEmployee(params.id);

  function handleSubmit(data: UpdateEmployeeInput) {
    updateEmployee.mutate(data, {
      onSuccess: () => router.push(`/employees/${params.id}`),
    });
  }

  if (isLoading) return <Skeleton className="h-96 w-full rounded-lg" />;
  if (!data?.data) return <p className="text-muted-foreground">Employee not found.</p>;

  return (
    <div>
      <PageHeader title="Edit Employee" description="Update employee information" />
      <EditEmployeeForm
        employee={data.data}
        onSubmit={handleSubmit}
        isLoading={updateEmployee.isPending}
      />
    </div>
  );
}
