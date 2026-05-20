import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Masuk — FitLife" }, { name: "description", content: "Masuk untuk sinkronisasi riwayat FitLife." }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const handleEmail = async (mode: "signin" | "signup") => {
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Cek email untuk konfirmasi");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Berhasil masuk");
        navigate({ to: "/" });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) { toast.error("Google sign-in gagal"); setLoading(false); return; }
    if (res.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto grid min-h-[80vh] max-w-md place-items-center px-4 py-12">
        <Card className="w-full overflow-hidden border-border/60 bg-gradient-card p-8 shadow-soft">
          <div className="mb-6 flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-hero text-white shadow-glow">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">Selamat datang</h1>
              <p className="text-sm text-muted-foreground">Masuk untuk sinkron riwayat antar perangkat</p>
            </div>
          </div>

          <Button onClick={handleGoogle} disabled={loading} variant="outline" className="w-full rounded-full">
            Lanjutkan dengan Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> atau email <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 rounded-full">
              <TabsTrigger value="signin" className="rounded-full">Masuk</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-full">Daftar</TabsTrigger>
            </TabsList>
            {(["signin", "signup"] as const).map((mode) => (
              <TabsContent key={mode} value={mode} className="space-y-3 pt-4">
                <div>
                  <Label className="mb-1.5">Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" />
                </div>
                <div>
                  <Label className="mb-1.5">Password</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} className="rounded-xl" />
                </div>
                <Button onClick={() => handleEmail(mode)} disabled={loading || !email || password.length < 6} className="w-full rounded-full bg-gradient-hero text-white shadow-glow">
                  {mode === "signin" ? "Masuk" : "Daftar"}
                </Button>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
