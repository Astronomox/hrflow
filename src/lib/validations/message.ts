import { z } from "zod";
import { ConversationType } from "@prisma/client";

export const createConversationSchema = z.object({
  type: z.nativeEnum(ConversationType),
  recipientEmployeeId: z.string().optional(),
  recipientDepartmentId: z.string().optional(),
  initialMessage: z.string().min(1, "Message cannot be empty").max(2000),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(2000),
  fileIds: z.array(z.string()).optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
