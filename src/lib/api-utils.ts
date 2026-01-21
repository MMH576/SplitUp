import { NextResponse } from "next/server";
import * as z from "zod";
import { AuthorizationError, NotFoundError } from "./auth";

// ============================================
// STANDARD API RESPONSE TYPES
// ============================================

export type ApiErrorResponse = {
  error: string;
  details?: unknown;
};

export type ApiSuccessResponse<T> = {
  data: T;
};

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Handles errors in API routes and returns appropriate responses.
 * Use this in catch blocks of API route handlers.
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error("API Error:", error);

  // Zod validation errors
  if (error instanceof z.ZodError) {
    const issues = error.issues || [];
    return NextResponse.json(
      {
        error: "Validation failed",
        details: issues.map((issue: z.ZodIssue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  // Authorization errors (401, 403)
  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  // Not found errors
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  // Generic errors
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message =
      process.env.NODE_ENV === "development"
        ? error.message
        : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Unknown errors
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

/**
 * Creates a success response with data.
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

/**
 * Creates an error response.
 */
export function apiError(
  message: string,
  status: number = 400
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}
