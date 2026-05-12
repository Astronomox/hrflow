"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { useCreateDepartment } from "@/hooks/use-departments";
import { useEmployees } from "@/hooks/use-employees";
import { createDepartmentSchema, type CreateDepartmentInput } from "@/lib/validations/department";

export default function NewDepartmentPage() {
  const router = useRouter();
  const createDept = useCreateDepartment();
  const { data: empData } = useEmployees({ pageSize: 100 } as never);
  const employees = empData?.data ?? [];

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateDepartmentInput>({
    resolver: zodResolver(createDepartmentSchema),
  });

  return (
    <div>
      <PageHeader title="New Department" description="Create a new department" />
      <div className="max-w-lg">
        <form onSubmit={handleSubmit((d) => createDept.mutate(d, { onSuccess: () => router.push("/departments") }))}>
          <Card>
            <CardHeader><CardTitle className="text-base">Department Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Department name</Label>
                <Input placeholder="Engineering" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
                <Input placeholder="What does this department do?" {...register("description")} />
              </div>
              <div className="space-y-2">
                <Label>Department Head <span className="text-muted-foreground">(optional)</span></Label>
                <Select onValueChange={(v) => setValue("headId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select head" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e: { id: string; user: { name: string } }) => (
                      <SelectItem key={e.id} value={e.id}>{e.user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={createDept.isPending}>
                  {createDept.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Department
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
