import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().min(2, "Department name is required").max(100),
  description: z.string().max(500).optional(),
  headId: z.string().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
