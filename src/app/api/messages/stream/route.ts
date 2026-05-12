import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) {
    return new Response("conversationId required", { status: 400 });
  }

  let lastMessageId: string | null = null;

  // Get the latest message id to start from
  const latest = await prisma.message.findFirst({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  lastMessageId = latest?.id ?? null;

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial ping so browser confirms connection
      controller.enqueue(encoder.encode("event: ping\ndata: connected\n\n"));

      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return; }

        try {
          const newMessages = await prisma.message.findMany({
            where: {
              conversationId,
              ...(lastMessageId ? { createdAt: { gt: (await prisma.message.findUnique({ where: { id: lastMessageId }, select: { createdAt: true } }))?.createdAt ?? new Date(0) } } : {}),
            },
            include: {
              sender: { include: { user: { select: { name: true } } } },
              files: true,
            },
            orderBy: { createdAt: "asc" },
          });

          if (newMessages.length > 0) {
            lastMessageId = newMessages[newMessages.length - 1].id;
            const payload = JSON.stringify(newMessages);
            controller.enqueue(encoder.encode(`event: messages\ndata: ${payload}\n\n`));
          }
        } catch {
          // DB error — keep stream alive
        }
      }, 300); // check every 300ms — much faster than 5s polling

      // Clean up when client disconnects
      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
