import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewLeaveSchema } from "@/lib/validations/leave";
import { Role, LeaveStatus } from "@prisma/client";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== Role.ADMIN && session.user.role !== Role.HR_MANAGER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = reviewLeaveSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

    const leave = await prisma.leaveRequest.findUnique({ where: { id: params.id } });
    if (!leave) return NextResponse.json({ error: "Leave request not found" }, { status: 404 });

    // Only pending requests can be reviewed — prevents re-reviewing
    if (leave.status !== LeaveStatus.PENDING) {
      return NextResponse.json(
        { error: `This request is already ${leave.status.toLowerCase()}` },
        { status: 409 }
      );
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: params.id },
      data: {
        status: parsed.data.status,
        reviewerId: session.user.id,
        reviewNote: parsed.data.reviewNote ?? null,
      },
      include: {
        employee: { include: { user: { select: { name: true } } } },
        reviewer: { select: { name: true } },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[LEAVE_REVIEW]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
