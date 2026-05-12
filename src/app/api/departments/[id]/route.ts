import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateDepartmentSchema } from "@/lib/validations/department";
import { Role } from "@prisma/client";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dept = await prisma.department.findUnique({
      where: { id: params.id },
      include: {
        head: { select: { id: true, user: { select: { name: true, email: true } } } },
        employees: {
          include: { user: { select: { name: true, email: true } } },
          orderBy: { user: { name: "asc" } },
        },
        _count: { select: { employees: true } },
      },
    });

    if (!dept) return NextResponse.json({ error: "Department not found" }, { status: 404 });
    return NextResponse.json({ data: dept });
  } catch (error) {
    console.error("[DEPT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== Role.ADMIN && session.user.role !== Role.HR_MANAGER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateDepartmentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

    const updated = await prisma.department.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.name && { name: parsed.data.name }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description ?? null }),
        ...(parsed.data.headId !== undefined && { headId: parsed.data.headId ?? null }),
      },
      include: {
        head: { select: { id: true, user: { select: { name: true } } } },
        _count: { select: { employees: true } },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[DEPT_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== Role.ADMIN) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const count = await prisma.employee.count({ where: { departmentId: params.id } });
    if (count > 0) return NextResponse.json({ error: "Cannot delete a department with employees. Reassign them first." }, { status: 409 });

    await prisma.department.delete({ where: { id: params.id } });
    return NextResponse.json({ data: { message: "Department deleted" } });
  } catch (error) {
    console.error("[DEPT_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
