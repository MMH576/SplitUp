import { z } from "zod";

export const createSettlementSchema = z.object({
  fromClerkUserId: z.string().min(1, "From user is required"),
  toClerkUserId: z.string().min(1, "To user is required"),
  amountCents: z.number().int().positive("Amount must be positive"),
});

export const updateSettlementSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED"]),
});

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
export type UpdateSettlementInput = z.infer<typeof updateSettlementSchema>;
