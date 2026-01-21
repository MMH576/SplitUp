import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(100, "Group name must be 100 characters or less"),
});

export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(100, "Group name must be 100 characters or less")
    .optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
