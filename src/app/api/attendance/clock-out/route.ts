import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";

export async function PATCH(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let employeeId = session.user.employeeId;
    if (!employeeId) {
      const emp = await prisma.employee.findUnique({ where: { userId: session.user.id }, select: { id: true } });
      employeeId = emp?.id;
    }
    if (!employeeId) return NextResponse.json({ error: "No employee profile found" }, { status: 403 });

    const today = startOfDay(new Date());
    const record = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (!record) return NextResponse.json({ error: "No clock-in found for today" }, { status: 404 });
    if (record.clockOut) return NextResponse.json({ error: "Already clocked out" }, { status: 409 });

    const updated = await prisma.attendance.update({
      where: { employeeId_date: { employeeId, date: today } },
      data: { clockOut: new Date() },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[CLOCK_OUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
