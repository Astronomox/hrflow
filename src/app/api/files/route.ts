import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.employeeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") ?? "mine"; // mine | department | all

    const where = scope === "mine"
      ? { uploaderId: session.user.employeeId, messageId: null }
      : scope === "department"
      ? { departmentId: { not: null }, messageId: null }
      : { messageId: null };

    const files = await prisma.file.findMany({
      where,
      include: { uploader: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: files });
  } catch (error) {
    console.error("[FILES_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.employeeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const departmentId = formData.get("departmentId") as string | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    if (!ALLOWED_FILE_TYPES.includes(file.type as typeof ALLOWED_FILE_TYPES[number])) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name);
    const filename = `${randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const record = await prisma.file.create({
      data: {
        name: file.name,
        url: `/uploads/${filename}`,
        size: file.size,
        mimeType: file.type,
        uploaderId: session.user.employeeId,
        departmentId: departmentId ?? null,
      },
      include: { uploader: { include: { user: { select: { name: true } } } } },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error("[FILES_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
