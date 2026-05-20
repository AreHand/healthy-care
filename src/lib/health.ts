// Pure health calculation utilities. Keep this file SSR/test friendly (no React).

export type Gender = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (jarang olahraga)",
  light: "Ringan (1–3x/minggu)",
  moderate: "Sedang (3–5x/minggu)",
  active: "Aktif (6–7x/minggu)",
  very_active: "Sangat aktif (atletik)",
};

export type BmiCategory = "Underweight" | "Normal" | "Overweight" | "Obese";

export function calcBMI(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function bmiCategoryColor(c: BmiCategory): string {
  switch (c) {
    case "Underweight": return "var(--chart-3)";
    case "Normal": return "var(--chart-1)";
    case "Overweight": return "var(--chart-4)";
    case "Obese": return "var(--destructive)";
  }
}

/**
 * Devine formula ideal body weight (kg).
 * Male: 50 + 2.3 * (inches over 60)
 * Female: 45.5 + 2.3 * (inches over 60)
 */
export function idealWeight(gender: Gender, heightCm: number): number {
  const inches = heightCm / 2.54;
  const over = Math.max(0, inches - 60);
  const base = gender === "male" ? 50 : 45.5;
  return base + 2.3 * over;
}

/** Mifflin-St Jeor BMR */
export function bmr(gender: Gender, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

export function dailyCalories(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number,
  activity: ActivityLevel = "sedentary"
): number {
  return Math.round(bmr(gender, weightKg, heightCm, age) * ACTIVITY_FACTORS[activity]);
}

export interface CalcInput {
  gender: Gender;
  age: number;
  weightKg: number;
  heightCm: number;
  activity: ActivityLevel;
}

export interface CalcResult {
  bmi: number;
  category: BmiCategory;
  idealWeightKg: number;
  dailyCalories: number;
  bmr: number;
}

export function calculate(input: CalcInput): CalcResult {
  const bmiVal = calcBMI(input.weightKg, input.heightCm);
  return {
    bmi: Math.round(bmiVal * 10) / 10,
    category: bmiCategory(bmiVal),
    idealWeightKg: Math.round(idealWeight(input.gender, input.heightCm) * 10) / 10,
    dailyCalories: dailyCalories(input.gender, input.weightKg, input.heightCm, input.age, input.activity),
    bmr: Math.round(bmr(input.gender, input.weightKg, input.heightCm, input.age)),
  };
}

// Imperial conversions
export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;
export const lbsToKg = (lb: number) => lb * KG_PER_LB;
export const kgToLbs = (kg: number) => kg / KG_PER_LB;
export const inToCm = (i: number) => i * CM_PER_IN;
export const cmToIn = (c: number) => c / CM_PER_IN;

export interface Recommendation {
  title: string;
  tips: string[];
}

export function recommendationFor(cat: BmiCategory): Recommendation {
  switch (cat) {
    case "Underweight":
      return {
        title: "Bangun massa secara sehat",
        tips: [
          "Tambah surplus 300–500 kkal/hari dari sumber padat gizi (kacang, alpukat, salmon).",
          "Latihan resistance 3x/minggu untuk meningkatkan massa otot.",
          "Konsultasikan dengan ahli gizi jika BB turun > 5% dalam 6 bulan.",
        ],
      };
    case "Normal":
      return {
        title: "Pertahankan ritme yang baik",
        tips: [
          "Jaga 150 menit aktivitas aerobik moderat per minggu.",
          "Konsumsi 25–35 g serat & 0.8–1.2 g protein/kg BB per hari.",
          "Tidur 7–9 jam dan kelola stres untuk hormon metabolik stabil.",
        ],
      };
    case "Overweight":
      return {
        title: "Defisit lembut & konsisten",
        tips: [
          "Defisit 300–500 kkal/hari; targetkan -0.5 kg/minggu.",
          "Prioritaskan protein 1.4–1.8 g/kg BB untuk menjaga otot saat menurunkan lemak.",
          "Tambah NEAT: 8–10 ribu langkah/hari.",
        ],
      };
    case "Obese":
      return {
        title: "Mulai bertahap, evaluasi medis",
        tips: [
          "Diskusikan rencana dengan tenaga medis sebelum diet ketat.",
          "Mulai dengan jalan kaki 20–30 menit/hari dan kurangi minuman manis.",
          "Pantau tekanan darah, gula darah, & lipid secara rutin.",
        ],
      };
  }
}
