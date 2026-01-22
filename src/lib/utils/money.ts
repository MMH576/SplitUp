/**
 * Money Formatting Utilities
 *
 * All money is stored as integer cents in the database.
 * These utilities handle conversion and display.
 */

/**
 * Convert cents to dollars.
 * Example: 1250 -> 12.50
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Convert dollars to cents.
 * Rounds to nearest cent to handle floating point imprecision.
 * Example: 12.50 -> 1250
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Format cents as a currency string.
 * Example: 1250 -> "$12.50"
 */
export function formatMoney(cents: number): string {
  const dollars = centsToDollars(cents);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(dollars);
}

/**
 * Format cents as a simple dollar string (no currency symbol).
 * Example: 1250 -> "12.50"
 */
export function formatDollars(cents: number): string {
  return centsToDollars(cents).toFixed(2);
}

/**
 * Parse a dollar string to cents.
 * Handles inputs like "12.50", "$12.50", "12", etc.
 * Returns null if invalid.
 */
export function parseDollarsToCents(input: string): number | null {
  // Remove currency symbols and whitespace
  const cleaned = input.replace(/[$,\s]/g, "").trim();

  if (!cleaned) return null;

  const dollars = parseFloat(cleaned);

  if (isNaN(dollars) || dollars < 0) return null;

  return dollarsToCents(dollars);
}
