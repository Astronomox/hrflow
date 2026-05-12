import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.employeeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const file = await prisma.file.findUnique({ where: { id: params.id } });
    if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

    if (file.uploaderId !== session.user.employeeId) {
      return NextResponse.json({ error: "You can only delete your own files" }, { status: 403 });
    }

    // Delete physical file
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
