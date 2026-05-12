import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLeaveSchema } from "@/lib/validations/leave";
import { Role, LeaveStatus } from "@prisma/client";

async function resolveEmployeeId(userId: string, sessionEmployeeId?: string): Promise<string | null> {
  if (sessionEmployeeId) return sessionEmployeeId;
  const emp = await prisma.employee.findUnique({ where: { userId }, select: { id: true } });
  return emp?.id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as LeaveStatus | null;
    const all = searchParams.get("all") === "true";
    const page = parseInt(searchParams.get("page") ?? "1");
    const pageSize = 10;

    const isHROrAdmin = session.user.role === Role.ADMIN || session.user.role === Role.HR_MANAGER;

    const where = {
      ...(!all || !isHROrAdmin
        ? { employee: { userId: session.user.id } }
        : {}),
      ...(status && { status }),
    };

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: {
          employee: {
            include: {
              user: { select: { name: true, email: true } },
              department: { select: { name: true } },
            },
          },
          reviewer: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return NextResponse.json({ data: requests, total, page, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error("[LEAVE_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employeeId = await resolveEmployeeId(session.user.id, session.user.employeeId);
    if (!employeeId) return NextResponse.json({ error: "No employee profile found" }, { status: 403 });

    const body = await request.json();
    const parsed = createLeaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { not: LeaveStatus.REJECTED },
        OR: [
          { startDate: { lte: new Date(parsed.data.endDate) }, endDate: { gte: new Date(parsed.data.startDate) } },
        ],
      },
    });
    if (overlap) return NextResponse.json({ error: "You have an overlapping leave request for this period." }, { status: 409 });

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType: parsed.data.leaveType,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        reason: parsed.data.reason,
      },
      include: {
        employee: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    return NextResponse.json({ data: leave }, { status: 201 });
  } catch (error) {
    console.error("[LEAVE_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
