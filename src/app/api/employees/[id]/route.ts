import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateEmployeeSchema } from "@/lib/validations/employee";
import { Role, EmploymentStatus } from "@prisma/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
        department: { select: { id: true, name: true } },
        attendance: { orderBy: { date: "desc" }, take: 10 },
        leaveRequests: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    return NextResponse.json({ data: employee });
  } catch (error) {
    console.error("[EMPLOYEE_GET]", error);
    const code = (error as { code?: string })?.code;
    if (code === "P2002") return NextResponse.json({ error: "A record with this value already exists" }, { status: 409 });
    if (code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== Role.ADMIN && session.user.role !== Role.HR_MANAGER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, role, ...employeeData } = parsed.data;

    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    await prisma.$transaction([
      ...(name || email || role
        ? [prisma.user.update({
            where: { id: employee.userId },
            data: { ...(name && { name }), ...(email && { email: email.toLowerCase() }), ...(role && { role }) },
          })]
        : []),
      prisma.employee.update({
        where: { id: params.id },
        data: {
          ...(employeeData.phone !== undefined && { phone: employeeData.phone }),
          ...(employeeData.position && { position: employeeData.position }),
          ...(employeeData.status && { status: employeeData.status }),
          ...(employeeData.departmentId !== undefined && { departmentId: employeeData.departmentId }),
          ...(employeeData.profileImage !== undefined && { profileImage: employeeData.profileImage || null }),
        },
      }),
    ]);

    const updated = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        department: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[EMPLOYEE_PATCH]", error);
    const code = (error as { code?: string })?.code;
    if (code === "P2002") return NextResponse.json({ error: "A record with this value already exists" }, { status: 409 });
    if (code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Only admins can deactivate employees" }, { status: 403 });
    }

    const employee = await prisma.employee.findUnique({ where: { id: params.id } });
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    await prisma.employee.update({
      where: { id: params.id },
      data: { status: EmploymentStatus.INACTIVE },
    });

    return NextResponse.json({ data: { message: "Employee deactivated" } });
  } catch (error) {
    console.error("[EMPLOYEE_DELETE]", error);
    const code = (error as { code?: string })?.code;
    if (code === "P2002") return NextResponse.json({ error: "A record with this value already exists" }, { status: 409 });
    if (code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
