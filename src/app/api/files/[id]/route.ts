import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";
import { Role } from "@prisma/client";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Resolve employeeId with fallback for self-registered users
    let employeeId = session.user.employeeId;
    if (!employeeId) {
      const emp = await prisma.employee.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      employeeId = emp?.id;
    }

    const file = await prisma.file.findUnique({ where: { id: params.id } });
    if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

    const isAdmin = session.user.role === Role.ADMIN || session.user.role === Role.HR_MANAGER;
    const isOwner = employeeId && file.uploaderId === employeeId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "You can only delete your own files" }, { status: 403 });
    }

    try {
      const filePath = path.join(process.cwd(), "public", file.url);
      await unlink(filePath);
    } catch {
      // File may not exist on disk — continue with DB deletion
    }

    await prisma.file.delete({ where: { id: params.id } });
    return NextResponse.json({ data: { message: "File deleted" } });
  } catch (error) {
    console.error("[FILE_DELETE]", error);
    const code = (error as { code?: string })?.code;
    if (code === "P2025") return NextResponse.json({ error: "File not found" }, { status: 404 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
