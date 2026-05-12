import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { Role } from "@prisma/client";

async function resolveEmployeeId(userId: string, sessionEmployeeId?: string) {
  if (sessionEmployeeId) return sessionEmployeeId;
  const emp = await prisma.employee.findUnique({ where: { userId }, select: { id: true } });
  return emp?.id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employeeId = await resolveEmployeeId(session.user.id, session.user.employeeId);
    if (!employeeId) return NextResponse.json({ data: [] });

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") ?? "mine";
    const isHROrAdmin = session.user.role === Role.ADMIN || session.user.role === Role.HR_MANAGER;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { departmentId: true },
    });

    let where: object;

    if (scope === "mine") {
      where = { uploaderId: employeeId, messageId: null };
    } else if (scope === "department") {
      // Department files = files explicitly tagged with a departmentId
      where = {
        departmentId: employee?.departmentId ?? "__none__",
        messageId: null,
      };
    } else if (scope === "all" && isHROrAdmin) {
      // All non-message files
      where = { messageId: null };
    } else {
      where = { uploaderId: employeeId, messageId: null };
    }

    const files = await prisma.file.findMany({
      where,
      include: { uploader: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 100,
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
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employeeId = await resolveEmployeeId(session.user.id, session.user.employeeId);
    if (!employeeId) return NextResponse.json({ error: "No employee profile found" }, { status: 403 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    // "private" | "department" | "all"
    const visibility = (formData.get("visibility") as string) ?? "private";

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 });
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

    // Determine departmentId based on visibility:
    // "private" → null (only uploader sees it)
    // "department" → uploader's departmentId (dept members see it)
    // "all" → null BUT we mark it differently — use a special query in GET
    let departmentId: string | null = null;
    if (visibility === "department") {
      const emp = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { departmentId: true },
      });
      departmentId = emp?.departmentId ?? null;
    }
    // For "all" — departmentId stays null, uploaderId is set
    // The "all" tab in GET returns messageId:null with no other filter for HR/Admin

    const record = await prisma.file.create({
      data: {
        name: file.name,
        url: `/uploads/${filename}`,
        size: file.size,
        mimeType: file.type,
        uploaderId: employeeId,
        departmentId,
      },
      include: { uploader: { include: { user: { select: { name: true } } } } },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error("[FILES_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
