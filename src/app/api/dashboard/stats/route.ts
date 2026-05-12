import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, format } from "date-fns";
import { LeaveStatus } from "@prisma/client";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = startOfDay(new Date());

    const [
      totalEmployees,
      presentToday,
      pendingLeaveRequests,
      totalDepartments,
      attendanceRaw,
      leaveRaw,
      deptRaw,
      recentLeave,
      recentEmployees,
    ] = await Promise.all([
      prisma.employee.count({ where: { status: "ACTIVE" } }),
      prisma.attendance.count({ where: { date: today } }),
      prisma.leaveRequest.count({ where: { status: LeaveStatus.PENDING } }),
      prisma.department.count(),
      // Attendance trend last 7 days
      prisma.attendance.groupBy({
        by: ["date"],
        _count: { id: true },
        where: { date: { gte: subDays(today, 6) } },
        orderBy: { date: "asc" },
      }),
      // Leave by type
      prisma.leaveRequest.groupBy({
        by: ["leaveType"],
        _count: { id: true },
      }),
      // Employees by department
      prisma.employee.groupBy({
        by: ["departmentId"],
        _count: { id: true },
        where: { status: "ACTIVE", departmentId: { not: null } },
      }),
      // Recent leave activity
      prisma.leaveRequest.findMany({
        where: { status: { not: LeaveStatus.PENDING } },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { employee: { include: { user: { select: { name: true } } } } },
      }),
      // Recent new employees
      prisma.employee.findMany({
        orderBy: { dateJoined: "desc" },
        take: 5,
        include: { user: { select: { name: true } } },
      }),
    ]);

    // Build attendance trend (fill missing days with 0)
    const attendanceTrend = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i);
      const found = attendanceRaw.find(
        (r) => format(new Date(r.date), "yyyy-MM-dd") === format(d, "yyyy-MM-dd")
      );
      return { date: format(d, "MMM d"), count: found?._count.id ?? 0 };
    });

    // Leave by type
    const leaveByType = leaveRaw.map((r) => ({
      type: r.leaveType.charAt(0) + r.leaveType.slice(1).toLowerCase(),
      count: r._count.id,
    }));

    // Employees by department — need dept names
    const deptIds = deptRaw.map((d) => d.departmentId).filter(Boolean) as string[];
    const depts = await prisma.department.findMany({
      where: { id: { in: deptIds } },
      select: { id: true, name: true },
    });
    const employeesByDepartment = deptRaw.map((d) => ({
      department: depts.find((dept) => dept.id === d.departmentId)?.name ?? "Unknown",
      count: d._count.id,
    }));

    // Build activity feed
    const recentActivity = [
      ...recentLeave.map((l) => ({
        id: l.id,
        type: l.status === "APPROVED" ? "leave_approved" : "leave_rejected",
        description: `leave request was ${l.status.toLowerCase()}`,
        actorName: l.employee.user.name,
        timestamp: l.updatedAt ?? l.createdAt,
      })),
      ...recentEmployees.map((e) => ({
        id: e.id,
        type: "employee_created",
        description: "joined the company",
        actorName: e.user.name,
        timestamp: e.dateJoined,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return NextResponse.json({
      data: {
        totalEmployees,
        presentToday,
        pendingLeaveRequests,
        totalDepartments,
        attendanceTrend,
        leaveByType,
        employeesByDepartment,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("[DASHBOARD_STATS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
