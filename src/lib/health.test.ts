import { describe, it, expect } from "vitest";
import { calcBMI, bmiCategory, idealWeight, bmr, dailyCalories, calculate } from "./health";

describe("health calculations", () => {
  it("BMI normal", () => {
    expect(calcBMI(70, 175)).toBeCloseTo(22.86, 1);
    expect(bmiCategory(22.86)).toBe("Normal");
  });
  it("BMI underweight/overweight/obese", () => {
    expect(bmiCategory(17)).toBe("Underweight");
    expect(bmiCategory(27)).toBe("Overweight");
    expect(bmiCategory(31)).toBe("Obese");
  });
  it("Ideal weight Devine (male 175cm)", () => {
    // 175cm = 68.9in -> 8.9 over 60 -> 50 + 2.3*8.9 = 70.47
    expect(idealWeight("male", 175)).toBeCloseTo(70.47, 1);
  });
  it("Ideal weight Devine (female 160cm)", () => {
    // 160cm = 62.99in -> 2.99 over 60 -> 45.5 + 2.3*2.99 = 52.38
    expect(idealWeight("female", 160)).toBeCloseTo(52.38, 1);
  });
  it("Mifflin-St Jeor BMR male", () => {
    // M=10*70+6.25*175-5*25+5 = 700+1093.75-125+5 = 1673.75
    expect(bmr("male", 70, 175, 25)).toBeCloseTo(1673.75, 1);
  });
  it("Mifflin-St Jeor BMR female", () => {
    // F=10*60+6.25*165-5*30-161 = 600+1031.25-150-161 = 1320.25
    expect(bmr("female", 60, 165, 30)).toBeCloseTo(1320.25, 1);
  });
  it("daily calories applies activity factor", () => {
    const c = dailyCalories("male", 70, 175, 25, "moderate");
    expect(c).toBe(Math.round(1673.75 * 1.55));
  });
  it("calculate() shape", () => {
    const r = calculate({ gender: "male", age: 25, weightKg: 70, heightCm: 175, activity: "sedentary" });
    expect(r.bmi).toBeCloseTo(22.9, 1);
    expect(r.category).toBe("Normal");
    expect(r.idealWeightKg).toBeCloseTo(70.5, 1);
    expect(r.dailyCalories).toBe(Math.round(1673.75 * 1.2));
  });
});
