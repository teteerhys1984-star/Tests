import { describe, expect, it } from "vitest";
import {
  averageSpeed, isEquivalentWeightFormula, massFromWeight,
  normalizeArabic, parseQuantity, weight,
} from "../src/lib/physics";

describe("physical laws and localized numerical input", () => {
  it("uses total distance over total time, not a mean of stage speeds", () => {
    expect(averageSpeed(80 + 120, 20 + 60)).toBe(2.5);
    expect((averageSpeed(80, 20) + averageSpeed(120, 60)) / 2).toBe(3);
    expect(averageSpeed(84, 2)).toBe(42);
    expect(() => averageSpeed(10, 0)).toThrow(RangeError);
  });

  it("computes gravity problems independently with correct units", () => {
    expect(weight(2.5, 10)).toBe(25);
    expect(weight(2.5, 1.6)).toBe(4);
    expect(massFromWeight(85, 10)).toBe(8.5);
    expect(() => weight(-1, 10)).toThrow(RangeError);
    expect(() => massFromWeight(10, 0)).toThrow(RangeError);
  });

  it("reads Arabic and Persian digits and validates units", () => {
    expect(parseQuantity("٢٫٥ م/ث")).toEqual({ value: 2.5, unit: "m/s", unknownUnit: false });
    expect(parseQuantity("۸٫۵ kg")).toEqual({ value: 8.5, unit: "kg", unknownUnit: false });
    expect(parseQuantity("٤ نيوتن")).toEqual({ value: 4, unit: "N", unknownUnit: false });
    expect(parseQuantity("42 km/h")?.unit).toBe("km/h");
    expect(parseQuantity("25 كمثرى")?.unknownUnit).toBe(true);
    expect(parseQuantity("foo 25")).toBeNull();
  });

  it("checks algebraic equivalence, not a literal formula string", () => {
    for (const formula of ["w=mg", "w = m × g", "m=w/g", "m = w ÷ g", "g=w/m", "mg=w"]) {
      expect(isEquivalentWeightFormula(formula), formula).toBe(true);
    }
    for (const formula of ["w=m+g", "m=w*g", "w=m*g+1", "w=w+m*g-m*g", "w=m", "not a formula"]) {
      expect(isEquivalentWeightFormula(formula), formula).toBe(false);
    }
  });

  it("normalizes Arabic variations without flattening scientific meaning", () => {
    expect(normalizeArabic("الكُتْلَةُ ثَابِتَةٌ")).toBe("الكتله ثابته");
    expect(normalizeArabic("إتّجاه الجسم")).toBe("اتجاه الجسم");
  });
});