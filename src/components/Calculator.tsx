import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import {
  Activity, Apple, Calculator as CalcIcon, Download, FileText,
  Save, Share2, User2, Users, Zap, Ruler, Weight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ACTIVITY_LABELS, calculate, cmToIn, kgToLbs, inToCm, lbsToKg,
  recommendationFor, type ActivityLevel, type CalcInput, type Gender,
} from "@/lib/health";
import { BMIGauge } from "@/components/BMIGauge";
import { saveLocalEntry } from "@/lib/calc-storage";
import { downloadPDF } from "@/lib/pdf";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { saveCalculation } from "@/lib/calc.functions";
import { createShare } from "@/lib/share.functions";

type Unit = "metric" | "imperial";

const Schema = z.object({
  gender: z.enum(["male", "female"]),
  age: z.number().int().min(2, "Min 2 tahun").max(120, "Max 120 tahun"),
  weight: z.number().positive("Berat harus > 0").max(1000),
  height: z.number().positive("Tinggi harus > 0").max(400),
  activity: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
});

export function Calculator() {
  const { user } = useAuth();
  const [unit, setUnit] = useState<Unit>("metric");
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState<string>("25");
  const [weight, setWeight] = useState<string>("70");
  const [height, setHeight] = useState<string>("175");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Convert when unit toggles
  const switchUnit = (u: Unit) => {
    if (u === unit) return;
    const w = Number(weight);
    const h = Number(height);
    if (u === "imperial") {
      if (w) setWeight(kgToLbs(w).toFixed(1));
      if (h) setHeight(cmToIn(h).toFixed(1));
    } else {
      if (w) setWeight(lbsToKg(w).toFixed(1));
      if (h) setHeight(inToCm(h).toFixed(1));
    }
    setUnit(u);
  };

  const parsed = useMemo(() => {
    const candidate = {
      gender,
      age: Number(age),
      weight: Number(weight),
      height: Number(height),
      activity,
    };
    const res = Schema.safeParse(candidate);
    if (!res.success) {
      const errs: Record<string, string> = {};
      for (const issue of res.error.issues) errs[String(issue.path[0])] = issue.message;
      return { ok: false as const, errors: errs };
    }
    const weightKg = unit === "metric" ? res.data.weight : lbsToKg(res.data.weight);
    const heightCm = unit === "metric" ? res.data.height : inToCm(res.data.height);
    if (weightKg < 10 || weightKg > 500) return { ok: false as const, errors: { weight: "Berat di luar rentang wajar" } };
    if (heightCm < 50 || heightCm > 300) return { ok: false as const, errors: { height: "Tinggi di luar rentang wajar" } };
    const input: CalcInput = {
      gender: res.data.gender, age: res.data.age, weightKg, heightCm, activity: res.data.activity,
    };
    return { ok: true as const, input, result: calculate(input) };
  }, [gender, age, weight, height, activity, unit]);

  useEffect(() => {
    if (parsed.ok) setErrors({});
    else setErrors(parsed.errors);
  }, [parsed]);

  const saveServer = useServerFn(saveCalculation);
  const createShareFn = useServerFn(createShare);

  const handleSave = async () => {
    if (!parsed.ok) return;
    const entry = {
      id: nanoid(),
      createdAt: new Date().toISOString(),
      input: parsed.input,
      result: parsed.result,
      unitPreference: unit,
    };
    saveLocalEntry(entry);
    toast.success("Tersimpan ke riwayat lokal");
    if (user) {
      try {
        await saveServer({
          data: {
            gender: parsed.input.gender,
            age: parsed.input.age,
            weight_kg: parsed.input.weightKg,
            height_cm: parsed.input.heightCm,
            activity_level: parsed.input.activity,
            bmi: parsed.result.bmi,
            category: parsed.result.category,
            ideal_weight_kg: parsed.result.idealWeightKg,
            daily_calories: parsed.result.dailyCalories,
          },
        });
        toast.success("Tersinkron ke akunmu");
      } catch (e) {
        toast.error("Gagal sinkron: " + (e instanceof Error ? e.message : "Unknown"));
      }
    }
  };

  const handlePDF = () => {
    if (!parsed.ok) return;
    downloadPDF(
      {
        input: parsed.input,
        result: parsed.result,
        displayName: user?.email ?? undefined,
        unitPreference: unit,
      },
      `fitlife-${new Date().toISOString().slice(0, 10)}.pdf`
    );
    toast.success("PDF diunduh");
  };

  const handleShare = async () => {
    if (!parsed.ok) return;
    try {
      const res = await createShareFn({
        data: {
          gender: parsed.input.gender,
          age: parsed.input.age,
          weightKg: parsed.input.weightKg,
          heightCm: parsed.input.heightCm,
          activity: parsed.input.activity,
          bmi: parsed.result.bmi,
          category: parsed.result.category,
          idealWeightKg: parsed.result.idealWeightKg,
          dailyCalories: parsed.result.dailyCalories,
          displayName: user?.email?.split("@")[0],
        },
      });
      const url = `${window.location.origin}/share/${res.id}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link disalin!", { description: url });
    } catch (e) {
      toast.error("Gagal membuat link: " + (e instanceof Error ? e.message : "Unknown"));
    }
  };

  const wUnit = unit === "metric" ? "kg" : "lbs";
  const hUnit = unit === "metric" ? "cm" : "in";

  const rec = parsed.ok ? recommendationFor(parsed.result.category) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
      {/* Form */}
      <Card className="overflow-hidden border-border/60 bg-gradient-card p-6 shadow-soft md:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
              <CalcIcon className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl font-bold">Health Calculator</h2>
          </div>
          <Tabs value={unit} onValueChange={(v) => switchUnit(v as Unit)}>
            <TabsList className="rounded-full">
              <TabsTrigger value="metric" className="rounded-full">Metric</TabsTrigger>
              <TabsTrigger value="imperial" className="rounded-full">Imperial</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-5">
          <div>
            <Label className="mb-2 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Jenis kelamin</Label>
            <RadioGroup
              value={gender}
              onValueChange={(v) => setGender(v as Gender)}
              className="grid grid-cols-2 gap-3"
            >
              {([
                { v: "male", label: "Pria" },
                { v: "female", label: "Wanita" },
              ] as const).map((o) => (
                <label
                  key={o.v}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition-all ${
                    gender === o.v ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem value={o.v} className="sr-only" />
                  <User2 className={`h-5 w-5 ${gender === o.v ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="font-medium">{o.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              icon={<User2 className="h-3.5 w-3.5" />}
              label="Usia (tahun)"
              value={age} onChange={setAge}
              error={errors.age}
              min={2} max={120}
            />
            <Field
              icon={<Activity className="h-3.5 w-3.5" />}
              label={`Berat (${wUnit})`}
              value={weight} onChange={setWeight}
              error={errors.weight}
              step="0.1"
            />
            <Field
              icon={<Ruler className="h-3.5 w-3.5" />}
              label={`Tinggi (${hUnit})`}
              value={height} onChange={setHeight}
              error={errors.height}
              step="0.1"
            />
            <div>
              <Label className="mb-2 flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Aktivitas</Label>
              <Select value={activity} onValueChange={(v) => setActivity(v as ActivityLevel)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((k) => (
                    <SelectItem key={k} value={k}>{ACTIVITY_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={handleSave} disabled={!parsed.ok} className="rounded-full bg-primary text-primary-foreground shadow-glow">
              <Save className="mr-1.5 h-4 w-4" /> Simpan
            </Button>
            <Button onClick={handlePDF} disabled={!parsed.ok} variant="outline" className="rounded-full">
              <FileText className="mr-1.5 h-4 w-4" /> PDF
            </Button>
            <Button onClick={handleShare} disabled={!parsed.ok} variant="outline" className="rounded-full">
              <Share2 className="mr-1.5 h-4 w-4" /> Bagikan
            </Button>
            {!user && (
              <p className="w-full text-xs text-muted-foreground">
                Tip: <a href="/auth" className="underline">Masuk</a> untuk menyinkronkan riwayat antar perangkat.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Results */}
      <motion.div
        key={parsed.ok ? `${parsed.result.bmi}-${parsed.result.dailyCalories}` : "empty"}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card className="relative overflow-hidden border-border/60 bg-card p-6 shadow-soft md:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-hero opacity-20 blur-3xl" />

          {parsed.ok ? (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Hasil Analisis</div>
                  <h3 className="mt-1 font-display text-2xl font-bold">Body Mass Index</h3>
                </div>
              </div>

              <div className="mt-4">
                <BMIGauge bmi={parsed.result.bmi} category={parsed.result.category} />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Stat icon={<Weight className="h-4 w-4" />} label="Berat ideal" value={`${parsed.result.idealWeightKg.toFixed(1)} kg`} />
                <Stat icon={<Apple className="h-4 w-4" />} label="Kalori / hari" value={`${parsed.result.dailyCalories} kkal`} accent />
                <Stat icon={<Zap className="h-4 w-4" />} label="BMR" value={`${parsed.result.bmr} kkal`} />
                <Stat icon={<Activity className="h-4 w-4" />} label="Aktivitas" value={ACTIVITY_LABELS[parsed.input.activity].split(" ")[0]} />
              </div>

              {rec && (
                <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <div className="text-xs uppercase tracking-[0.18em] text-primary">Rekomendasi</div>
                  <div className="mt-1 font-display text-lg font-semibold">{rec.title}</div>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {rec.tips.map((t, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <CalcIcon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">Lengkapi data di sebelah kiri</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Hasil dihitung secara real-time menggunakan rumus WHO BMI, Devine, dan Mifflin-St Jeor.
              </p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

function Field({
  icon, label, value, onChange, error, min, max, step,
}: {
  icon: React.ReactNode; label: string; value: string;
  onChange: (v: string) => void; error?: string;
  min?: number; max?: number; step?: string;
}) {
  return (
    <div>
      <Label className="mb-2 flex items-center gap-1.5">{icon} {label}</Label>
      <Input
        type="number"
        inputMode="decimal"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-xl ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-accent/40 bg-accent/10" : "border-border bg-muted/30"}`}>
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
