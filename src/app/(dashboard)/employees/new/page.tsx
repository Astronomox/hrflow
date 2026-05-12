"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CreateEmployeeForm } from "@/components/employees/employee-form";
import { useCreateEmployee } from "@/hooks/use-employees";
import type { CreateEmployeeInput } from "@/lib/validations/employee";

export default function NewEmployeePage() {
  const router = useRouter();
  const createEmployee = useCreateEmployee();

  function handleSubmit(data: CreateEmployeeInput) {
    createEmployee.mutate(data, {
      onSuccess: () => router.push("/employees"),
    });
  }

  return (
    <div>
      <PageHeader title="Add Employee" description="Create a new employee account" />
      <CreateEmployeeForm onSubmit={handleSubmit} isLoading={createEmployee.isPending} />
    </div>
  );
}
