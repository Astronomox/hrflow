import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId") ?? session.user.employeeId;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") ?? "1");
    const pageSize = 20;

    if (!employeeId) return NextResponse.json({ data: [], total: 0 });

    const where = {
      employeeId,
      ...(startDate && endDate && {
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      }),
    };

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.attendance.count({ where }),
    ]);

    // Today's record
    const today = startOfDay(new Date());
    const todayRecord = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    return NextResponse.json({ data: records, total, todayRecord });
  } catch (error) {
    console.error("[ATTENDANCE_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.employeeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employeeId = session.user.employeeId;
    const today = startOfDay(new Date());

    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (existing) {
      return NextResponse.json({ error: "Already clocked in today" }, { status: 409 });
    }

    const record = await prisma.attendance.create({
      data: {
        employeeId,
        clockIn: new Date(),
        date: today,
      },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error("[ATTENDANCE_CLOCK_IN]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
