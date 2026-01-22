import { z } from "zod";

export const createExpenseSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  amountCents: z
    .number()
    .int("Amount must be a whole number of cents")
    .positive("Amount must be positive"),
  payerClerkUserId: z.string().min(1, "Payer is required"),
  participantIds: z
    .array(z.string())
    .min(1, "At least one participant is required"),
  category: z.string().max(50).optional(),
  expenseDate: z.string().datetime().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
