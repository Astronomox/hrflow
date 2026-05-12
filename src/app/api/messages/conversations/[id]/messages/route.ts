import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMessageSchema } from "@/lib/validations/message";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.employeeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        senderId: session.user.employeeId,
        content: parsed.data.content,
      },
      include: {
        sender: { include: { user: { select: { name: true } } } },
        files: true,
      },
    });

    await prisma.conversation.update({ where: { id: params.id }, data: { updatedAt: new Date() } });

    return NextResponse.json({ data: message }, { status: 201 });
  } catch (error) {
    console.error("[MESSAGE_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
