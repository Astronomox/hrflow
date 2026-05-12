import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function requireAuth(requiredRoles?: Role[]) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (requiredRoles && !requiredRoles.includes(session.user.role as Role)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, error: null };
}

export function requireEmployeeId(session: { user: { employeeId?: string } }) {
  if (!session.user.employeeId) {
    return NextResponse.json(
      { error: "No employee profile found for this account" },
      { status: 403 }
    );
  }
  return null;
}
