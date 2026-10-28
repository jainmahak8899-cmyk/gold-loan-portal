/**
 * Unit tests for quoteService.ts
 *
 * Test cases 1–6 verify the core gold-loan math:
 *   pureGoldGrams = netWeightGrams × (karat / 24)
 *   goldValue     = pureGoldGrams × 7000
 *   eligibleLoan  = floor(goldValue × min(plan.maxLtv, 0.75))
 */

import { computeQuote, maskMobile, generateApplicationId } from "../services/quoteService";

describe("computeQuote — math cases 1–6", () => {
  // ── Case 1: 24K gold, EMI scheme ─────────────────────────────────────────
  it("Case 1: 24K 10g EMI → pure=10g, goldValue=70000, eligible=52500", () => {
    const q = computeQuote({ netWeightGrams: 10, karat: 24, schemeId: "emi" });
    expect(q.pureGoldGrams).toBeCloseTo(10, 4);
    expect(q.goldValue).toBe(70000);
    // EMI LTV = min(0.75, 0.75) = 0.75 → floor(70000 × 0.75) = 52500
    expect(q.eligibleLoan).toBe(52500);
  });

  // ── Case 2: 22K gold, EMI scheme ─────────────────────────────────────────
  it("Case 2: 22K 10g EMI → pure≈9.1667g, goldValue=64167, eligible=48125", () => {
    const q = computeQuote({ netWeightGrams: 10, karat: 22, schemeId: "emi" });
    const expectedPure = 10 * (22 / 24); // 9.1667
    const expectedGoldValue = Math.round(expectedPure * 7000); // 64167
    const expectedLoan = Math.floor(expectedGoldValue * 0.75); // 48125
    expect(q.pureGoldGrams).toBeCloseTo(expectedPure, 3);
    expect(q.goldValue).toBe(expectedGoldValue);
    expect(q.eligibleLoan).toBe(expectedLoan);
  });

  // ── Case 3: 18K gold, EMI scheme ─────────────────────────────────────────
  it("Case 3: 18K 10g EMI → pure=7.5g, goldValue=52500, eligible=39375", () => {
    const q = computeQuote({ netWeightGrams: 10, karat: 18, schemeId: "emi" });
    expect(q.pureGoldGrams).toBeCloseTo(7.5, 4);
    expect(q.goldValue).toBe(52500);
    // floor(52500 × 0.75) = 39375
    expect(q.eligibleLoan).toBe(39375);
  });

  // ── Case 4: Bullet scheme caps LTV at 70%, not 75% ───────────────────────
  it("Case 4: 24K 10g Bullet → LTV capped at 70% → eligible=49000", () => {
    const q = computeQuote({ netWeightGrams: 10, karat: 24, schemeId: "bullet" });
    expect(q.effectiveLtv).toBe(0.70);
    // floor(70000 × 0.70) = 49000
    expect(q.eligibleLoan).toBe(49000);
  });

  // ── Case 5: Eligible loan is floored to whole rupees ─────────────────────
  it("Case 5: result is always whole rupees (no fractions)", () => {
    const q1 = computeQuote({ netWeightGrams: 7.3, karat: 22, schemeId: "emi" });
    const q2 = computeQuote({ netWeightGrams: 13.7, karat: 18, schemeId: "bullet" });
    expect(q1.eligibleLoan).toBe(Math.floor(q1.eligibleLoan));
    expect(q2.eligibleLoan).toBe(Math.floor(q2.eligibleLoan));
    expect(Number.isInteger(q1.eligibleLoan)).toBe(true);
    expect(Number.isInteger(q2.eligibleLoan)).toBe(true);
  });

  // ── Case 6: Large gold weight (boundary) ─────────────────────────────────
  it("Case 6: 1000g max weight 24K EMI → eligible=5250000", () => {
    const q = computeQuote({ netWeightGrams: 1000, karat: 24, schemeId: "emi" });
    expect(q.goldValue).toBe(7000000);
    expect(q.eligibleLoan).toBe(Math.floor(7000000 * 0.75)); // 5250000
  });
});

describe("computeQuote — EMI calculation", () => {
  it("EMI scheme returns a non-null monthly EMI", () => {
    const q = computeQuote({ netWeightGrams: 10, karat: 24, schemeId: "emi" });
    expect(q.emi).not.toBeNull();
    expect(q.emi!).toBeGreaterThan(0);
  });

  it("Bullet scheme returns null EMI", () => {
    const q = computeQuote({ netWeightGrams: 10, karat: 24, schemeId: "bullet" });
    expect(q.emi).toBeNull();
  });

  it("EMI × 12 months is greater than principal (interest is charged)", () => {
    const q = computeQuote({ netWeightGrams: 10, karat: 24, schemeId: "emi" });
    expect(q.emi! * 12).toBeGreaterThan(q.eligibleLoan);
  });

  it("totalRepayment equals eligibleLoan + totalInterest", () => {
    const q = computeQuote({ netWeightGrams: 10, karat: 24, schemeId: "emi" });
    expect(q.totalRepayment).toBe(q.eligibleLoan + q.totalInterest);
  });
});

describe("computeQuote — invalid scheme", () => {
  it("throws on unknown schemeId", () => {
    expect(() =>
      computeQuote({ netWeightGrams: 10, karat: 24, schemeId: "nonexistent" })
    ).toThrow("Invalid scheme");
  });
});

describe("maskMobile", () => {
  it("masks digits 5–8 with XXXX", () => {
    expect(maskMobile("9876543210")).toBe("9876XXXX10");
  });

  it("preserves first 4 and last 2 digits", () => {
    const masked = maskMobile("7012345678");
    expect(masked.startsWith("7012")).toBe(true);
    expect(masked.endsWith("78")).toBe(true);
    expect(masked).toHaveLength(10);
  });
});

describe("generateApplicationId", () => {
  it("matches format GL-YYYYMMDD-XXXX", () => {
    const id = generateApplicationId();
    expect(id).toMatch(/^GL-\d{8}-[A-Z0-9]{4}$/);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 20 }, generateApplicationId));
    expect(ids.size).toBeGreaterThan(15); // extremely unlikely to collide 20 times
  });
});
