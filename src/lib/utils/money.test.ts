import { describe, it, expect } from "vitest";
import {
  centsToDollars,
  dollarsToCents,
  formatMoney,
  formatDollars,
  parseDollarsToCents,
} from "./money";

describe("centsToDollars", () => {
  it("converts whole dollars", () => {
    expect(centsToDollars(1000)).toBe(10);
    expect(centsToDollars(100)).toBe(1);
  });

  it("converts cents to decimal", () => {
    expect(centsToDollars(1050)).toBe(10.5);
    expect(centsToDollars(1099)).toBe(10.99);
  });

  it("handles zero", () => {
    expect(centsToDollars(0)).toBe(0);
  });

  it("handles negative values", () => {
    expect(centsToDollars(-500)).toBe(-5);
  });
});

describe("dollarsToCents", () => {
  it("converts whole dollars", () => {
    expect(dollarsToCents(10)).toBe(1000);
    expect(dollarsToCents(1)).toBe(100);
  });

  it("converts decimals and rounds correctly", () => {
    expect(dollarsToCents(10.5)).toBe(1050);
    expect(dollarsToCents(10.99)).toBe(1099);
  });

  it("rounds floating point errors", () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS
    expect(dollarsToCents(0.1 + 0.2)).toBe(30);
  });

  it("handles zero", () => {
    expect(dollarsToCents(0)).toBe(0);
  });
});

describe("formatMoney", () => {
  it("formats positive amounts with currency symbol", () => {
    expect(formatMoney(1000)).toBe("$10.00");
    expect(formatMoney(1250)).toBe("$12.50");
    expect(formatMoney(99)).toBe("$0.99");
  });

  it("formats large amounts with commas", () => {
    expect(formatMoney(100000)).toBe("$1,000.00");
    expect(formatMoney(1000000)).toBe("$10,000.00");
  });

  it("formats zero", () => {
    expect(formatMoney(0)).toBe("$0.00");
  });

  it("formats negative amounts", () => {
    expect(formatMoney(-500)).toBe("-$5.00");
  });
});

describe("formatDollars", () => {
  it("formats without currency symbol", () => {
    expect(formatDollars(1000)).toBe("10.00");
    expect(formatDollars(1250)).toBe("12.50");
  });

  it("always shows two decimal places", () => {
    expect(formatDollars(1000)).toBe("10.00");
    expect(formatDollars(100)).toBe("1.00");
  });
});

describe("parseDollarsToCents", () => {
  it("parses simple dollar amounts", () => {
    expect(parseDollarsToCents("10")).toBe(1000);
    expect(parseDollarsToCents("10.00")).toBe(1000);
    expect(parseDollarsToCents("12.50")).toBe(1250);
  });

  it("parses amounts with currency symbol", () => {
    expect(parseDollarsToCents("$10.00")).toBe(1000);
    expect(parseDollarsToCents("$12.50")).toBe(1250);
  });

  it("handles whitespace", () => {
    expect(parseDollarsToCents("  10.00  ")).toBe(1000);
    expect(parseDollarsToCents(" $ 10 ")).toBe(1000);
  });

  it("handles commas in large numbers", () => {
    expect(parseDollarsToCents("1,000.00")).toBe(100000);
    expect(parseDollarsToCents("$1,234.56")).toBe(123456);
  });

  it("returns null for empty string", () => {
    expect(parseDollarsToCents("")).toBe(null);
    expect(parseDollarsToCents("   ")).toBe(null);
  });

  it("returns null for invalid input", () => {
    expect(parseDollarsToCents("abc")).toBe(null);
    expect(parseDollarsToCents("$abc")).toBe(null);
  });

  it("returns null for negative amounts", () => {
    expect(parseDollarsToCents("-10")).toBe(null);
  });
});
