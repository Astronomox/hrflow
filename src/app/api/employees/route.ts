import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { createEmployeeSchema } from "@/lib/validations/employee";
import { Role, EmploymentStatus } from "@prisma/client";
import { notifyNewEmployee } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status") as EmploymentStatus | null;
    const page = parseInt(searchParams.get("page") ?? "1");
    const pageSize = parseInt(searchParams.get("pageSize") ?? "10");

    const where = {
      ...(search && {
        OR: [
          { user: { name: { contains: search, mode: "insensitive" as const } } },
          { user: { email: { contains: search, mode: "insensitive" as const } } },
          { position: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(departmentId && { departmentId }),
      ...(status && { status }),
    };

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          department: { select: { id: true, name: true } },
        },
        orderBy: { user: { name: "asc" } },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json({
      data: employees,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("[EMPLOYEES_GET]", error);
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
    const parsed = createEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, role, phone, position, status, dateJoined, departmentId, profileImage } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        employee: {
          create: {
            phone: phone ?? null,
            position,
            status,
            dateJoined: new Date(dateJoined),
            departmentId: departmentId ?? null,
            profileImage: profileImage || null,
          },
        },
      },
      include: {
        employee: {
          include: {
            department: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Notify HR/Admin about new employee (non-blocking)
    if (user.employee) {
      notifyNewEmployee(name, position, session.user.id).catch(() => {});
    }

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    console.error("[EMPLOYEES_POST]", error);
    const code = (error as { code?: string })?.code;
    if (code === "P2002") return NextResponse.json({ error: "A record with this value already exists" }, { status: 409 });
    if (code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
