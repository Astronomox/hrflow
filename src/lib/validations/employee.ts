import { z } from "zod";
import { EmploymentStatus, Role } from "@prisma/client";

export const createEmployeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.nativeEnum(Role).default(Role.EMPLOYEE),
  phone: z.string().optional(),
  position: z.string().min(2, "Position is required").max(100),
  status: z.nativeEnum(EmploymentStatus).default(EmploymentStatus.ACTIVE),
  dateJoined: z.string().min(1, "Date joined is required"),
  departmentId: z.string().optional(),
  profileImage: z.string().url().optional().or(z.literal("")),
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  position: z.string().min(2).max(100).optional(),
  status: z.nativeEnum(EmploymentStatus).optional(),
  departmentId: z.string().optional().nullable(),
  profileImage: z.string().url().optional().or(z.literal("")),
  role: z.nativeEnum(Role).optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
