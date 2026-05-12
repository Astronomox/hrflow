import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDepartmentSchema } from "@/lib/validations/department";
import { Role } from "@prisma/client";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const departments = await prisma.department.findMany({
      include: {
        head: { select: { id: true, user: { select: { name: true } } } },
        _count: { select: { employees: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: departments });
  } catch (error) {
    console.error("[DEPARTMENTS_GET]", error);
    const code = (error as { code?: string })?.code;
    if (code === "P2002") return NextResponse.json({ error: "A record with this value already exists" }, { status: 409 });
    if (code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== Role.ADMIN && session.user.role !== Role.HR_MANAGER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createDepartmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const existing = await prisma.department.findUnique({ where: { name: parsed.data.name } });
    if (existing) return NextResponse.json({ error: "Department name already exists" }, { status: 409 });

    const department = await prisma.department.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        headId: parsed.data.headId ?? null,
      },
      include: {
        head: { select: { id: true, user: { select: { name: true } } } },
        _count: { select: { employees: true } },
      },
    });

    return NextResponse.json({ data: department }, { status: 201 });
  } catch (error) {
    console.error("[DEPARTMENTS_POST]", error);
    const code = (error as { code?: string })?.code;
    if (code === "P2002") return NextResponse.json({ error: "A record with this value already exists" }, { status: 409 });
    if (code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
