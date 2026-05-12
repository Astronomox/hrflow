import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function resolveEmployeeId(userId: string, sessionEmployeeId?: string) {
  if (sessionEmployeeId) return sessionEmployeeId;
  const emp = await prisma.employee.findUnique({ where: { userId }, select: { id: true } });
  return emp?.id ?? null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employeeId = await resolveEmployeeId(session.user.id, session.user.employeeId);
    if (!employeeId) return NextResponse.json({ error: "No employee profile" }, { status: 403 });

    // Verify requester is a participant in this conversation
    const isParticipant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: params.id, employeeId },
    });
    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: params.id },
      include: {
        sender: { include: { user: { select: { name: true } } } },
        files: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: messages });
  } catch (error) {
    console.error("[MESSAGES_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
