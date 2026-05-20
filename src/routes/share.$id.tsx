import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Activity, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BMIGauge } from "@/components/BMIGauge";
import { getShare } from "@/lib/share.functions";
import { ACTIVITY_LABELS, recommendationFor, type BmiCategory } from "@/lib/health";

export const Route = createFileRoute("/share/$id")({
  loader: async ({ params }) => {
    const data = await getShare({ data: { id: params.id } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Hasil FitLife — BMI ${loaderData?.payload.bmi?.toFixed?.(1) ?? ""}` },
      { name: "description", content: `Hasil kalkulator FitLife: BMI ${loaderData?.payload.bmi?.toFixed?.(1) ?? ""} (${loaderData?.payload.category}).` },
      { property: "og:title", content: `Hasil FitLife — ${loaderData?.payload.category}` },
      { property: "og:description", content: `BMI ${loaderData?.payload.bmi?.toFixed?.(1)} · Berat ideal ${loaderData?.payload.idealWeightKg?.toFixed?.(1)} kg · ${loaderData?.payload.dailyCalories} kkal/hari` },
    ],
  }),
  component: SharePage,
});

function SharePage() {
  const { payload } = Route.useLoaderData();
  const rec = recommendationFor(payload.category as BmiCategory);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Activity className="h-3.5 w-3.5" /> Hasil dibagikan {payload.displayName ? `oleh ${payload.displayName}` : ""}
        </div>

        <Card className="overflow-hidden bg-gradient-card p-8 shadow-soft">
          <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
            <div className="grid place-items-center">
              <BMIGauge bmi={payload.bmi} category={payload.category as BmiCategory} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Berat ideal" value={`${payload.idealWeightKg.toFixed(1)} kg`} />
              <Stat label="Kalori / hari" value={`${payload.dailyCalories} kkal`} />
              <Stat label="Usia" value={`${payload.age} thn`} />
              <Stat label="Aktivitas" value={ACTIVITY_LABELS[payload.activity as keyof typeof ACTIVITY_LABELS].split(" ")[0]} />
            </div>
          </div>
        </Card>

        <Card className="mt-4 border-primary/20 bg-primary/5 p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-primary">Rekomendasi</div>
          <div className="mt-1 font-display text-lg font-semibold">{rec.title}</div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {rec.tips.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> {t}
              </li>
            ))}
          </ul>
        </Card>

        <div className="mt-8 text-center">
          <Link to="/">
            <Button className="rounded-full bg-gradient-hero text-white shadow-glow">
              Hitung milikmu <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-bold">{value}</div>
    </div>
  );
}
