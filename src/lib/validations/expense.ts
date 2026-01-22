import { z } from "zod";

// Split type enum matching Prisma
export const splitTypeEnum = z.enum(["EQUAL", "CUSTOM"]);
export type SplitType = z.infer<typeof splitTypeEnum>;

// Custom split entry - userId and their share in cents
export const customSplitSchema = z.object({
  clerkUserId: z.string().min(1),
  shareCents: z
    .number()
    .int("Share must be a whole number of cents")
    .nonnegative("Share cannot be negative"),
});

export type CustomSplit = z.infer<typeof customSplitSchema>;

// Base schema for equal splits (existing behavior)
const equalSplitExpenseSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  amountCents: z
    .number()
    .int("Amount must be a whole number of cents")
    .positive("Amount must be positive"),
  payerClerkUserId: z.string().min(1, "Payer is required"),
  splitType: z.literal("EQUAL"),
  participantIds: z
    .array(z.string())
    .min(1, "At least one participant is required"),
  category: z.string().max(50).optional(),
  expenseDate: z.string().datetime().optional(),
});

// Schema for custom splits - amountCents is optional since it's auto-calculated from splits
const customSplitExpenseSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  amountCents: z
    .number()
    .int("Amount must be a whole number of cents")
    .positive("Amount must be positive")
    .optional(), // Optional - will be calculated from customSplits
  payerClerkUserId: z.string().min(1, "Payer is required"),
  splitType: z.literal("CUSTOM"),
  customSplits: z
    .array(customSplitSchema)
    .min(1, "At least one participant is required"),
  category: z.string().max(50).optional(),
  expenseDate: z.string().datetime().optional(),
});

// Combined schema using discriminated union
// For CUSTOM splits, amountCents is optional and will be calculated from splits
export const createExpenseSchema = z.discriminatedUnion("splitType", [
  equalSplitExpenseSchema,
  customSplitExpenseSchema,
]);

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

// Update schema - similar structure but all fields optional
const equalSplitUpdateSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .optional(),
  amountCents: z
    .number()
    .int("Amount must be a whole number of cents")
    .positive("Amount must be positive")
    .optional(),
  payerClerkUserId: z.string().min(1, "Payer is required").optional(),
  splitType: z.literal("EQUAL"),
  participantIds: z
    .array(z.string())
    .min(1, "At least one participant is required")
    .optional(),
  category: z.string().max(50).nullable().optional(),
  expenseDate: z.string().datetime().optional(),
});

const customSplitUpdateSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .optional(),
  amountCents: z
    .number()
    .int("Amount must be a whole number of cents")
    .positive("Amount must be positive")
    .optional(),
  payerClerkUserId: z.string().min(1, "Payer is required").optional(),
  splitType: z.literal("CUSTOM"),
  customSplits: z
    .array(customSplitSchema)
    .min(1, "At least one participant is required")
    .optional(),
  category: z.string().max(50).nullable().optional(),
  expenseDate: z.string().datetime().optional(),
});

// For CUSTOM splits, amountCents is optional and will be calculated from splits
export const updateExpenseSchema = z.discriminatedUnion("splitType", [
  equalSplitUpdateSchema,
  customSplitUpdateSchema,
]);

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
