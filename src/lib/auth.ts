import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role, EmploymentStatus } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { employee: { select: { id: true, status: true } } },
        });

        // Same error for wrong email AND wrong password — prevents enumeration
        const INVALID = "Invalid email or password";
        if (!user) throw new Error(INVALID);

        const isPasswordValid = await compare(credentials.password, user.password);
        if (!isPasswordValid) throw new Error(INVALID);

        // Block deactivated or terminated employees
        if (
          user.employee?.status === EmploymentStatus.INACTIVE ||
          user.employee?.status === EmploymentStatus.TERMINATED
        ) {
          throw new Error("This account has been deactivated. Contact HR.");
        }

        // Auto-create employee profile if missing (self-registered users)
        let employeeId = user.employee?.id;
        if (!employeeId) {
          const employee = await prisma.employee.create({
            data: { userId: user.id, position: "Employee", dateJoined: new Date() },
            select: { id: true },
          });
          employeeId = employee.id;
        }

        return { id: user.id, email: user.email, name: user.name, role: user.role, employeeId };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
        token.employeeId = (user as { employeeId?: string }).employeeId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.employeeId = token.employeeId as string | undefined;
      }
      return session;
    },
  },
};

declare module "next-auth" {
  interface User { role: Role; employeeId?: string; }
  interface Session {
    user: { id: string; email: string; name: string; role: Role; employeeId?: string; };
  }
}
declare module "next-auth/jwt" {
  interface JWT { id: string; role: Role; employeeId?: string; }
}
