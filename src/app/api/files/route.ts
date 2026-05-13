import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
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
    console.log("[FILES_GET] resolved employeeId:", employeeId, "session.user.id:", session.user.id, "session.user.employeeId:", session.user.employeeId);
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
      where = {
        departmentId: employee?.departmentId ?? "__none__",
        messageId: null,
      };
    } else if (scope === "all" && isHROrAdmin) {
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
    const code = (error as { code?: string })?.code;
    if (code === "P2002") return NextResponse.json({ error: "A record with this value already exists" }, { status: 409 });
    if (code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
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
    const visibility = (formData.get("visibility") as string) ?? "private";

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 });
    if (!ALLOWED_FILE_TYPES.includes(file.type as typeof ALLOWED_FILE_TYPES[number])) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    const ext = file.name.split(".").pop();
    const filename = `${randomUUID()}.${ext}`;
    const blob = await put(filename, file, { access: "public" });

    let departmentId: string | null = null;
    if (visibility === "department") {
      const emp = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { departmentId: true },
      });
      departmentId = emp?.departmentId ?? null;
    }

    const record = await prisma.file.create({
      data: {
        name: file.name,
        url: blob.url,
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
    const code = (error as { code?: string })?.code;
    if (code === "P2002") return NextResponse.json({ error: "A record with this value already exists" }, { status: 409 });
    if (code === "P2025") return NextResponse.json({ error: "Record not found" }, { status: 404 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}