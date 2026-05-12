"use client";

import Link from "next/link";
import { ArrowLeft, Pencil, Mail, Phone, Building2, Calendar, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { UserAvatar } from "@/components/shared/avatar";
import { useEmployee } from "@/hooks/use-employees";
import { useCurrentUser } from "@/hooks/use-current-user";
import { EMPLOYMENT_STATUS_COLORS, EMPLOYMENT_STATUSES, ROLES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useEmployee(params.id);
  const { isAdminOrHR } = useCurrentUser();
  const employee = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!employee) return <p className="text-muted-foreground">Employee not found.</p>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/employees"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{employee.user.name}</h1>
          <p className="text-muted-foreground text-sm">{employee.position}</p>
        </div>
        {isAdminOrHR && (
          <Button asChild variant="outline">
            <Link href={`/employees/${params.id}/edit`}><Pencil className="h-4 w-4 mr-2" />Edit</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <UserAvatar name={employee.user.name} imageUrl={employee.profileImage} size="lg" className="h-20 w-20 text-2xl" />
            <h2 className="font-semibold mt-3">{employee.user.name}</h2>
            <p className="text-sm text-muted-foreground">{employee.position}</p>
            <span className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${EMPLOYMENT_STATUS_COLORS[employee.status as keyof typeof EMPLOYMENT_STATUS_COLORS]}`}>
              {EMPLOYMENT_STATUSES[employee.status as keyof typeof EMPLOYMENT_STATUSES]}
            </span>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { icon: Mail, label: "Email", value: employee.user.email },
              { icon: Phone, label: "Phone", value: employee.phone ?? "Not provided" },
              { icon: Building2, label: "Department", value: employee.department?.name ?? "Unassigned" },
              { icon: Briefcase, label: "Role", value: ROLES[employee.user.role as keyof typeof ROLES] },
              { icon: Calendar, label: "Date Joined", value: formatDate(employee.dateJoined) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
