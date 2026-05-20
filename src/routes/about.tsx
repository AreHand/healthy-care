import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Metodologi — FitLife" },
      { name: "description", content: "Rumus dan referensi yang digunakan FitLife: BMI WHO, Devine IBW, dan Mifflin-St Jeor." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
        <h1 className="font-display text-4xl font-bold tracking-tight">Metodologi & rumus</h1>
        <p className="mt-3 text-muted-foreground">
          FitLife menggunakan rumus standar yang dipakai praktisi gizi & kebugaran. Semua perhitungan diuji
          dengan unit-test sebelum dipublikasikan.
        </p>

        <div className="mt-8 grid gap-4">
          <Card className="p-6">
            <h2 className="font-display text-xl font-semibold">1. BMI (Body Mass Index)</h2>
            <p className="mt-1 text-sm text-muted-foreground">BMI = berat (kg) / tinggi (m)²</p>
            <ul className="mt-3 text-sm">
              <li>• &lt; 18.5 — Underweight</li>
              <li>• 18.5 – 24.9 — Normal</li>
              <li>• 25.0 – 29.9 — Overweight</li>
              <li>• ≥ 30 — Obese</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-xl font-semibold">2. Berat ideal (Devine, 1974)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pria: 50 + 2.3 × (tinggi dalam inci − 60)<br />
              Wanita: 45.5 + 2.3 × (tinggi dalam inci − 60)
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-xl font-semibold">3. Kalori harian (Mifflin-St Jeor)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              BMR pria = 10W + 6.25H − 5A + 5 &nbsp;·&nbsp; BMR wanita = 10W + 6.25H − 5A − 161
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              TDEE = BMR × faktor aktivitas (1.2 sedentary, 1.375 ringan, 1.55 sedang, 1.725 aktif, 1.9 sangat aktif).
            </p>
          </Card>

          <Card className="border-accent/30 bg-accent/10 p-6">
            <h2 className="font-display text-xl font-semibold">Disclaimer</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hasil bersifat edukatif dan tidak menggantikan saran medis profesional. Konsultasikan dengan
              tenaga medis untuk keputusan klinis.
            </p>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
