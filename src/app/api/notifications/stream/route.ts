import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userId = session.user.id;
  const encoder = new TextEncoder();
  let closed = false;
  let lastCheck = new Date();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode("event: ping\ndata: connected\n\n"));

      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return; }
        try {
          const newNotifs = await prisma.notification.findMany({
            where: { userId, createdAt: { gt: lastCheck } },
            orderBy: { createdAt: "desc" },
          });

          if (newNotifs.length > 0) {
            lastCheck = new Date();
            const unreadCount = await prisma.notification.count({
              where: { userId, read: false },
            });
            controller.enqueue(
              encoder.encode(`event: notification\ndata: ${JSON.stringify({ notifications: newNotifs, unreadCount })}\n\n`)
            );
          }
        } catch { /* keep alive */ }
      }, 1500);

      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
