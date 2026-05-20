import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, ShieldCheck, Sparkles, FileText, Share2, Moon } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Calculator } from "@/components/Calculator";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute inset-0 text-foreground/[0.04] grain" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-12 pt-12 md:px-8 md:pb-20 md:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Versi awal — gratis untuk semua
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance md:text-7xl">
              Kenali tubuhmu dalam{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">30 detik.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">
              FitLife menghitung BMI, berat badan ideal, dan kebutuhan kalori harianmu menggunakan rumus
              yang dipakai praktisi gizi — transparan, akurat, dan bisa kamu simpan untuk pantau perkembangan.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#calculator">
                <Button size="lg" className="rounded-full bg-gradient-hero text-white shadow-glow hover:opacity-95">
                  Mulai hitung sekarang
                </Button>
              </a>
              <Link to="/about">
                <Button size="lg" variant="outline" className="rounded-full">
                  Lihat metodologi
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { icon: Activity, label: "BMI WHO" },
                { icon: FileText, label: "PDF report" },
                { icon: Share2, label: "Share link" },
                { icon: Moon, label: "Dark mode" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-3 py-2 backdrop-blur">
                  <f.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Calculator */}
      <section id="calculator" className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
        <Calculator />
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
        <div className="grid gap-6 rounded-3xl border border-border/60 bg-gradient-card p-8 md:grid-cols-3">
          <Feature
            icon={ShieldCheck}
            title="Rumus tervalidasi"
            text="Mifflin-St Jeor, Devine IBW, WHO BMI — diuji unit-test agar selalu konsisten."
          />
          <Feature
            icon={FileText}
            title="Laporan rapi"
            text="Ekspor PDF berbranding, lengkap dengan rekomendasi & disclaimer medis."
          />
          <Feature
            icon={Sparkles}
            title="Sederhana & cepat"
            text="Tidak perlu daftar untuk hitung. Login hanya bila ingin sinkron antar perangkat."
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Feature({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <div>
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
