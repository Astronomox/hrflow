"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
} from "@/lib/validations/employee";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLES, EMPLOYMENT_STATUSES } from "@/lib/constants";
import { Role, EmploymentStatus } from "@prisma/client";
import { useDepartments } from "@/hooks/use-departments";
import type { EmployeeWithUser } from "@/types";

function DepartmentSelect({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const { data: deptData } = useDepartments();
  const departments = deptData?.data ?? [];
  return (
    <Select defaultValue={value ?? ""} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No department</SelectItem>
        {departments.map((dept: { id: string; name: string }) => (
          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Create Form ─────────────────────────────────────────────────────────────

export function CreateEmployeeForm({
  onSubmit, isLoading,
}: {
  onSubmit: (data: CreateEmployeeInput) => void;
  isLoading?: boolean;
}) {
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<CreateEmployeeInput>({
      resolver: zodResolver(createEmployeeSchema),
      defaultValues: { role: Role.EMPLOYEE, status: EmploymentStatus.ACTIVE },
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="John Doe" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" placeholder="john@company.com" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Min. 8 characters" {...register("password")} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" placeholder="+234 800 000 0000" {...register("phone")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Employment Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position / Job title</Label>
              <Input id="position" placeholder="Software Engineer" {...register("position")} />
              {errors.position && <p className="text-sm text-destructive">{errors.position.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select defaultValue={watch("role")} onValueChange={(v) => setValue("role", v as Role)}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employment status</Label>
              <Select defaultValue={watch("status")} onValueChange={(v) => setValue("status", v as EmploymentStatus)}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EMPLOYMENT_STATUSES).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <DepartmentSelect value={watch("departmentId")} onChange={(v) => setValue("departmentId", v === "none" ? "" : v)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateJoined">Date joined</Label>
              <Input id="dateJoined" type="date" {...register("dateJoined")} />
              {errors.dateJoined && <p className="text-sm text-destructive">{errors.dateJoined.message}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex items-center gap-3 mt-6 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create employee
        </Button>
      </div>
    </form>
  );
}

// ─── Edit Form ────────────────────────────────────────────────────────────────

export function EditEmployeeForm({
  employee, onSubmit, isLoading,
}: {
  employee: EmployeeWithUser;
  onSubmit: (data: UpdateEmployeeInput) => void;
  isLoading?: boolean;
}) {
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<UpdateEmployeeInput>({
      resolver: zodResolver(updateEmployeeSchema),
      defaultValues: {
        name: employee.user.name,
        email: employee.user.email,
        role: employee.user.role,
        phone: employee.phone ?? "",
        position: employee.position,
        status: employee.status,
        departmentId: employee.departmentId ?? "",
      },
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" placeholder="+234 800 000 0000" {...register("phone")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Employment Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position / Job title</Label>
              <Input id="position" {...register("position")} />
              {errors.position && <p className="text-sm text-destructive">{errors.position.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select defaultValue={watch("role")} onValueChange={(v) => setValue("role", v as Role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employment status</Label>
              <Select defaultValue={watch("status")} onValueChange={(v) => setValue("status", v as EmploymentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EMPLOYMENT_STATUSES).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <DepartmentSelect value={watch("departmentId") ?? ""} onChange={(v) => setValue("departmentId", v === "none" ? undefined : v)} />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex items-center gap-3 mt-6 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes
        </Button>
      </div>
    </form>
  );
}
