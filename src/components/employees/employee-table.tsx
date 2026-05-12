"use client";

import Link from "next/link";
import { Eye, Pencil, UserX, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/avatar";
import { EMPLOYMENT_STATUS_COLORS, EMPLOYMENT_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { EmployeeWithUser } from "@/types";

interface EmployeeTableProps {
  employees: EmployeeWithUser[];
  onDeactivate: (id: string) => void;
  canManage: boolean;
}

export function EmployeeTable({ employees, onDeactivate, canManage }: EmployeeTableProps) {
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/40">
            <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide">Employee</th>
            <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide hidden md:table-cell">Department</th>
            <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide hidden lg:table-cell">Position</th>
            <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide hidden lg:table-cell">Joined</th>
            <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide">Status</th>
            <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {employees.map((emp) => (
            <tr key={emp.id} className="table-row-hover bg-card">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <UserAvatar name={emp.user.name} imageUrl={emp.profileImage} size="sm" />
                  <div>
                    <Link href={`/employees/${emp.id}`} className="font-semibold hover:text-primary transition-colors leading-none">
                      {emp.user.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">{emp.user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                {emp.department?.name
                  ? <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs font-medium">{emp.department.name}</span>
                  : <span className="text-muted-foreground/40">—</span>
                }
              </td>
              <td className="px-4 py-3 text-muted-foreground text-sm hidden lg:table-cell">{emp.position}</td>
              <td className="px-4 py-3 text-muted-foreground text-sm hidden lg:table-cell">{formatDate(emp.dateJoined)}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${EMPLOYMENT_STATUS_COLORS[emp.status]}`}>
                  {EMPLOYMENT_STATUSES[emp.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem asChild>
                      <Link href={`/employees/${emp.id}`} className="flex items-center gap-2 cursor-pointer">
                        <Eye className="h-3.5 w-3.5" /> View profile
                      </Link>
                    </DropdownMenuItem>
                    {canManage && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href={`/employees/${emp.id}/edit`} className="flex items-center gap-2 cursor-pointer">
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onClick={() => onDeactivate(emp.id)}
                        >
                          <UserX className="h-3.5 w-3.5 mr-2" /> Deactivate
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
