import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createConversationSchema } from "@/lib/validations/message";
import { ConversationType } from "@prisma/client";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.employeeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employeeId = session.user.employeeId;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { employeeId } },
      },
      include: {
        participants: {
          include: {
            employee: { include: { user: { select: { name: true, email: true } } } },
            department: { select: { id: true, name: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { include: { user: { select: { name: true } } } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ data: conversations });
  } catch (error) {
    console.error("[CONVERSATIONS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.employeeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = createConversationSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });

    const { type, recipientEmployeeId, recipientDepartmentId, initialMessage } = parsed.data;
    const senderEmployeeId = session.user.employeeId;

    // For DIRECT — check if conversation already exists
    if (type === ConversationType.DIRECT && recipientEmployeeId) {
      const existing = await prisma.conversation.findFirst({
        where: {
          type: ConversationType.DIRECT,
          AND: [
            { participants: { some: { employeeId: senderEmployeeId } } },
            { participants: { some: { employeeId: recipientEmployeeId } } },
          ],
        },
      });

      if (existing) {
        await prisma.message.create({
          data: { conversationId: existing.id, senderId: senderEmployeeId, content: initialMessage },
        });
        await prisma.conversation.update({ where: { id: existing.id }, data: { updatedAt: new Date() } });
        return NextResponse.json({ data: existing }, { status: 200 });
      }
    }

    const participants = [{ employeeId: senderEmployeeId }];
    if (recipientEmployeeId) participants.push({ employeeId: recipientEmployeeId });

    const conversation = await prisma.conversation.create({
      data: {
        type,
        participants: {
          create: [
            { employeeId: senderEmployeeId },
            ...(recipientEmployeeId ? [{ employeeId: recipientEmployeeId }] : []),
            ...(recipientDepartmentId ? [{ departmentId: recipientDepartmentId }] : []),
          ],
        },
        messages: {
          create: { senderId: senderEmployeeId, content: initialMessage },
        },
      },
      include: {
        participants: {
          include: {
            employee: { include: { user: { select: { name: true, email: true } } } },
            department: { select: { id: true, name: true } },
          },
        },
        messages: { include: { sender: { include: { user: { select: { name: true } } } } } },
      },
    });

    return NextResponse.json({ data: conversation }, { status: 201 });
  } catch (error) {
    console.error("[CONVERSATIONS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
