import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

// Only pure admin actions — not "create employee" since HR can do that too
const ADMIN_ONLY_ROUTES = [
  "/departments/new",
];

const HR_AND_ADMIN_ROUTES = [
  "/employees",
  "/departments",
  "/leave/manage",
];

export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    const { pathname } = request.nextUrl;
    const role = request.nextauth.token?.role as Role | undefined;

    if (!role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const isAdminOnly = ADMIN_ONLY_ROUTES.some((route) =>
      pathname.startsWith(route)
    );
    if (isAdminOnly && role !== Role.ADMIN) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const isHrAndAdmin = HR_AND_ADMIN_ROUTES.some((route) =>
      pathname.startsWith(route)
    );
    if (
      isHrAndAdmin &&
      role !== Role.ADMIN &&
      role !== Role.HR_MANAGER
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/((?!api/auth|login|register|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
