import { z } from "zod";

export const createInviteSchema = z.object({
  expiresInDays: z
    .number()
    .int()
    .min(1, "Minimum 1 day")
    .max(30, "Maximum 30 days")
    .default(7),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
