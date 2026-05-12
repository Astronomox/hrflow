import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProfileSchema = z.object({
  phone: z.string().optional(),
  position: z.string().min(1).optional(),
});

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        employee: {
          include: {
            department: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

    // Find employee
    let employeeId = session.user.employeeId;
    if (!employeeId) {
      const emp = await prisma.employee.findUnique({ where: { userId: session.user.id }, select: { id: true } });
      employeeId = emp?.id;
    }
    if (!employeeId) return NextResponse.json({ error: "No employee profile" }, { status: 403 });

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
        ...(parsed.data.position && { position: parsed.data.position }),
      },
      include: {
        user: { select: { name: true, email: true, role: true } },
        department: { select: { name: true } },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PROFILE_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
