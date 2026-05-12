"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/avatar";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { useDepartment, useUpdateDepartment } from "@/hooks/use-departments";
import { useEmployees } from "@/hooks/use-employees";
import { updateDepartmentSchema, type UpdateDepartmentInput } from "@/lib/validations/department";
import { formatDate } from "@/lib/utils";

export default function DepartmentDetailPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useDepartment(params.id);
  const { data: empData } = useEmployees({ departmentId: params.id, pageSize: 100 });
  const updateDept = useUpdateDepartment(params.id);
  const { data: allEmpData } = useEmployees({ pageSize: 100 });
  const allEmployees = allEmpData?.data ?? [];

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<UpdateDepartmentInput>({
    resolver: zodResolver(updateDepartmentSchema),
    values: data?.data ? {
      name: data.data.name,
      description: data.data.description ?? "",
      headId: data.data.headId ?? "",
    } : undefined,
  });

  if (isLoading) return <Skeleton className="h-96 w-full rounded-lg" />;
  const dept = data?.data;
  if (!dept) return <p className="text-muted-foreground">Department not found.</p>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/departments"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold flex-1">{dept.name}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={handleSubmit((d) => updateDept.mutate(d))}>
          <Card>
            <CardHeader><CardTitle className="text-base">Department Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input {...register("description")} placeholder="What does this department do?" />
              </div>
              <div className="space-y-2">
                <Label>Department Head</Label>
                <Select defaultValue={watch("headId") ?? ""} onValueChange={(v) => setValue("headId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select head" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No head assigned</SelectItem>
                    {allEmployees.map((e: { id: string; user: { name: string } }) => (
                      <SelectItem key={e.id} value={e.id}>{e.user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={updateDept.isPending}>
                {updateDept.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Changes</>}
              </Button>
            </CardContent>
          </Card>
        </form>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Employees ({dept._count?.employees ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(empData?.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No employees in this department.</p>
            ) : (
              <div className="space-y-3">
                {(empData?.data ?? []).map((e: { id: string; user: { name: string; email: string }; position: string; dateJoined: Date }) => (
                  <div key={e.id} className="flex items-center gap-3">
                    <UserAvatar name={e.user.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <Link href={`/employees/${e.id}`} className="text-sm font-medium hover:underline truncate block">{e.user.name}</Link>
                      <p className="text-xs text-muted-foreground">{e.position}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(e.dateJoined)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
