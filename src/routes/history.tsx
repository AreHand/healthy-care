import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Trash2, Download, FileText, RefreshCcw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadLocalHistory, deleteLocalEntry, clearLocalHistory, type HistoryEntry } from "@/lib/calc-storage";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { listCalculations, deleteCalculation, clearCalculations, syncCalculations } from "@/lib/calc.functions";
import { downloadPDF } from "@/lib/pdf";
import { ACTIVITY_LABELS } from "@/lib/health";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Riwayat — FitLife" }, { name: "description", content: "Pantau tren BMI dan kalori harianmu." }] }),
  component: HistoryPage,
});

type Row = {
  id: string;
  createdAt: string;
  gender: "male" | "female";
  age: number;
  weightKg: number;
  heightCm: number;
  activity: "sedentary" | "light" | "moderate" | "active" | "very_active";
  bmi: number;
  category: string;
  idealWeightKg: number;
  dailyCalories: number;
  source: "local" | "cloud";
};

function toRowLocal(e: HistoryEntry): Row {
  return {
    id: e.id, createdAt: e.createdAt,
    gender: e.input.gender, age: e.input.age,
    weightKg: e.input.weightKg, heightCm: e.input.heightCm,
    activity: e.input.activity,
    bmi: e.result.bmi, category: e.result.category,
    idealWeightKg: e.result.idealWeightKg, dailyCalories: e.result.dailyCalories,
    source: "local",
  };
}

function HistoryPage() {
  const { user } = useAuth();
  const list = useServerFn(listCalculations);
  const del = useServerFn(deleteCalculation);
  const clear = useServerFn(clearCalculations);
  const sync = useServerFn(syncCalculations);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const localRows = loadLocalHistory().map(toRowLocal);
    if (!user) { setRows(localRows); return; }
    setLoading(true);
    try {
      const cloud = await list();
      const cloudRows: Row[] = cloud.map((c) => ({
        id: c.id, createdAt: c.created_at,
        gender: c.gender as Row["gender"], age: c.age,
        weightKg: Number(c.weight_kg), heightCm: Number(c.height_cm),
        activity: c.activity_level as Row["activity"],
        bmi: Number(c.bmi), category: c.category,
        idealWeightKg: Number(c.ideal_weight_kg), dailyCalories: c.daily_calories,
        source: "cloud",
      }));
      setRows([...cloudRows, ...localRows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (e) {
      toast.error("Gagal memuat: " + (e instanceof Error ? e.message : ""));
      setRows(localRows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  const handleSync = async () => {
    if (!user) { toast.info("Masuk dulu untuk sinkron"); return; }
    const local = loadLocalHistory();
    if (local.length === 0) { toast.info("Tidak ada riwayat lokal"); return; }
    try {
      const res = await sync({
        data: {
          entries: local.map((e) => ({
            gender: e.input.gender, age: e.input.age,
            weight_kg: e.input.weightKg, height_cm: e.input.heightCm,
            activity_level: e.input.activity,
            bmi: e.result.bmi, category: e.result.category,
            ideal_weight_kg: e.result.idealWeightKg, daily_calories: e.result.dailyCalories,
            created_at: e.createdAt,
          })),
        },
      });
      toast.success(`${res.inserted} entri tersinkron`);
      clearLocalHistory();
      refresh();
    } catch (e) {
      toast.error("Gagal sinkron: " + (e instanceof Error ? e.message : ""));
    }
  };

  const handleDelete = async (r: Row) => {
    if (r.source === "local") {
      deleteLocalEntry(r.id);
      setRows((p) => p.filter((x) => x.id !== r.id));
      return;
    }
    try { await del({ data: { id: r.id } }); setRows((p) => p.filter((x) => x.id !== r.id)); toast.success("Dihapus"); }
    catch (e) { toast.error("Gagal hapus"); }
  };

  const handleClear = async () => {
    if (!confirm("Hapus seluruh riwayat?")) return;
    clearLocalHistory();
    if (user) { try { await clear(); } catch {} }
    setRows([]);
    toast.success("Riwayat dibersihkan");
  };

  const handleCSV = () => {
    const header = ["created_at", "gender", "age", "weight_kg", "height_cm", "activity", "bmi", "category", "ideal_weight_kg", "daily_calories"];
    const csv = [
      header.join(","),
      ...rows.map((r) => [
        r.createdAt, r.gender, r.age, r.weightKg, r.heightCm, r.activity,
        r.bmi, r.category, r.idealWeightKg, r.dailyCalories,
      ].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `fitlife-riwayat-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chart = useMemo(
    () => [...rows].reverse().map((r) => ({
      date: new Date(r.createdAt).toLocaleDateString(),
      bmi: r.bmi, kcal: r.dailyCalories,
    })),
    [rows]
  );

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold md:text-4xl">Riwayat perhitungan</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {user ? "Tersinkron ke akunmu." : "Disimpan lokal di perangkat. Masuk untuk sinkronisasi."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="rounded-full" onClick={refresh} disabled={loading}>
                <RefreshCcw className="mr-1.5 h-4 w-4" /> Muat ulang
              </Button>
              {user && (
                <Button variant="outline" size="sm" className="rounded-full" onClick={handleSync}>
                  Sinkron lokal → akun
                </Button>
              )}
              <Button variant="outline" size="sm" className="rounded-full" onClick={handleCSV} disabled={rows.length === 0}>
                <Download className="mr-1.5 h-4 w-4" /> CSV
              </Button>
              <Button variant="outline" size="sm" className="rounded-full text-destructive" onClick={handleClear} disabled={rows.length === 0}>
                <Trash2 className="mr-1.5 h-4 w-4" /> Bersihkan
              </Button>
            </div>
          </div>

          {rows.length === 0 ? (
            <Card className="grid place-items-center p-16 text-center">
              <p className="text-muted-foreground">Belum ada perhitungan. Mulai dari halaman utama.</p>
            </Card>
          ) : (
            <>
              <Card className="mb-6 p-6">
                <div className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Tren BMI</div>
                <div className="h-64 w-full">
                  <ResponsiveContainer>
                    <LineChart data={chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={["dataMin - 1", "dataMax + 1"]} />
                      <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                      <Line type="monotone" dataKey="bmi" stroke="var(--chart-1)" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">BMI</th>
                        <th className="px-4 py-3">Kategori</th>
                        <th className="px-4 py-3">Berat / Tinggi</th>
                        <th className="px-4 py-3">Kalori</th>
                        <th className="px-4 py-3">Aktivitas</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id} className="border-t border-border/60 hover:bg-muted/30">
                          <td className="px-4 py-3 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3 font-semibold">{r.bmi.toFixed(1)}</td>
                          <td className="px-4 py-3">{r.category}</td>
                          <td className="px-4 py-3">{r.weightKg.toFixed(1)} kg / {r.heightCm.toFixed(0)} cm</td>
                          <td className="px-4 py-3">{r.dailyCalories} kkal</td>
                          <td className="px-4 py-3 text-xs">{ACTIVITY_LABELS[r.activity].split(" ")[0]}</td>
                          <td className="px-4 py-3 text-right">
                            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => {
                              downloadPDF({
                                input: { gender: r.gender, age: r.age, weightKg: r.weightKg, heightCm: r.heightCm, activity: r.activity },
                                result: { bmi: r.bmi, category: r.category as never, idealWeightKg: r.idealWeightKg, dailyCalories: r.dailyCalories, bmr: Math.round(r.dailyCalories / 1.2) },
                                unitPreference: "metric",
                              });
                            }}>
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="rounded-full text-destructive" onClick={() => handleDelete(r)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
