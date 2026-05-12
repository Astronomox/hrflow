"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Building2, Users, Trash2, Pencil, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { useDepartments, useDeleteDepartment } from "@/hooks/use-departments";
import { useCurrentUser } from "@/hooks/use-current-user";

const DEPT_COLORS = [
  "from-blue-500/10 to-blue-500/5 border-blue-200/60 dark:border-blue-800/40",
  "from-violet-500/10 to-violet-500/5 border-violet-200/60 dark:border-violet-800/40",
  "from-emerald-500/10 to-emerald-500/5 border-emerald-200/60 dark:border-emerald-800/40",
  "from-amber-500/10 to-amber-500/5 border-amber-200/60 dark:border-amber-800/40",
  "from-rose-500/10 to-rose-500/5 border-rose-200/60 dark:border-rose-800/40",
  "from-cyan-500/10 to-cyan-500/5 border-cyan-200/60 dark:border-cyan-800/40",
];

const ICON_COLORS = [
  "bg-blue-500/15 text-blue-600",
  "bg-violet-500/15 text-violet-600",
  "bg-emerald-500/15 text-emerald-600",
  "bg-amber-500/15 text-amber-600",
  "bg-rose-500/15 text-rose-600",
  "bg-cyan-500/15 text-cyan-600",
];

export default function DepartmentsPage() {
  const { isAdminOrHR, isAdmin } = useCurrentUser();
  const { data, isLoading }      = useDepartments();
  const deleteDept               = useDeleteDepartment();
  const [deleteId, setDeleteId]  = useState<string | null>(null);
  const departments              = data?.data ?? [];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Departments"
        description={`${departments.length} department${departments.length !== 1 ? "s" : ""}`}
        action={isAdminOrHR && (
          <Button asChild>
            <Link href="/departments/new"><Plus className="h-4 w-4 mr-2" />New Department</Link>
          </Button>
        )}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No departments yet"
          description="Create your first department to organise employees."
          action={isAdminOrHR ? (
            <Button asChild><Link href="/departments/new"><Plus className="h-4 w-4 mr-2" />Create Department</Link></Button>
          ) : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept: {
            id: string; name: string; description: string | null;
            head: { user: { name: string } } | null;
            _count: { employees: number };
          }, idx: number) => (
            <Card key={dept.id} className={`group bg-gradient-to-br border shadow-sm hover:shadow-md transition-all duration-200 ${DEPT_COLORS[idx % DEPT_COLORS.length]}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${ICON_COLORS[idx % ICON_COLORS.length]}`}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  {isAdminOrHR && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/70 hover:bg-background" asChild>
                        <Link href={`/departments/${dept.id}`}><Pencil className="h-3.5 w-3.5" /></Link>
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/70 hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteId(dept.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <Link href={`/departments/${dept.id}`} className="block group/link">
                  <h3 className="font-bold text-base group-hover/link:text-primary transition-colors">{dept.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {dept.head ? `Head: ${dept.head.user.name}` : "No head assigned"}
                  </p>
                  {dept.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{dept.description}</p>
                  )}
                </Link>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span className="font-medium">{dept._count.employees}</span>
                    <span>{dept._count.employees === 1 ? "employee" : "employees"}</span>
                  </div>
                  <Link href={`/departments/${dept.id}`} className="flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete department?"
        description="This cannot be undone. Departments with employees cannot be deleted."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteDept.isPending}
        onConfirm={() => { if (deleteId) deleteDept.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }}
      />
    </div>
  );
}
