import { prisma } from "@/lib/prisma";
import { NotificationType, Role } from "@prisma/client";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({ data: input });
}

export async function createNotificationForRole(
  roles: Role[],
  input: Omit<CreateNotificationInput, "userId">,
  excludeUserId?: string
) {
  const users = await prisma.user.findMany({
    where: {
      role: { in: roles },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });

  if (!users.length) return;

  await prisma.notification.createMany({
    data: users.map((u) => ({ ...input, userId: u.id })),
  });
}

// ─── Notification factory methods ─────────────────────────────────────────

export async function notifyLeaveSubmitted(
  employeeName: string,
  leaveType: string,
  leaveId: string,
  submitterUserId: string
) {
  await createNotificationForRole(
    [Role.ADMIN, Role.HR_MANAGER],
    {
      type: NotificationType.LEAVE_SUBMITTED,
      title: "New Leave Request",
      message: `${employeeName} submitted a ${leaveType.toLowerCase()} leave request.`,
      link: "/leave/manage",
    },
    submitterUserId
  );
}

export async function notifyLeaveReviewed(
  employeeUserId: string,
  status: "APPROVED" | "REJECTED",
  reviewerName: string,
  leaveType: string
) {
  await createNotification({
    userId: employeeUserId,
    type: status === "APPROVED" ? NotificationType.LEAVE_APPROVED : NotificationType.LEAVE_REJECTED,
    title: `Leave Request ${status === "APPROVED" ? "Approved" : "Rejected"}`,
    message: `${reviewerName} ${status === "APPROVED" ? "approved" : "rejected"} your ${leaveType.toLowerCase()} leave request.`,
    link: "/leave",
  });
}

export async function notifyNewMessage(
  conversationId: string,
  senderName: string,
  senderEmployeeId: string,
  preview: string
) {
  // Get all participants except sender
  const participants = await prisma.conversationParticipant.findMany({
    where: {
      conversationId,
      employeeId: { not: senderEmployeeId },
      employee: { isNot: null },
    },
    include: { employee: { include: { user: { select: { id: true } } } } },
  });

  if (!participants.length) return;

  await prisma.notification.createMany({
    data: participants
      .filter((p) => p.employee?.user?.id)
      .map((p) => ({
        userId: p.employee!.user.id,
        type: NotificationType.NEW_MESSAGE,
        title: `New message from ${senderName}`,
        message: preview.length > 60 ? `${preview.slice(0, 60)}…` : preview,
        link: `/messages/${conversationId}`,
      })),
  });
}

export async function notifyNewEmployee(
  employeeName: string,
  position: string,
  creatorUserId: string
) {
  await createNotificationForRole(
    [Role.ADMIN, Role.HR_MANAGER],
    {
      type: NotificationType.NEW_EMPLOYEE,
      title: "New Employee Added",
      message: `${employeeName} has joined as ${position}.`,
      link: "/employees",
    },
    creatorUserId
  );
}
