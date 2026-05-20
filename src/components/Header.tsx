import { Link, useRouter } from "@tanstack/react-router";
import { Activity, Moon, Sun, LogOut, History, User as UserIcon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth, signOut } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Header() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const navItems = [
    { to: "/", label: "Calculator" },
    { to: "/history", label: "Riwayat" },
    { to: "/about", label: "Metode" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link to="/" className="group flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero text-white shadow-glow transition-transform group-hover:scale-105">
            <Activity className="h-5 w-5" />
          </div>
          <div className="font-display text-xl font-bold tracking-tight">
            Fit<span className="text-primary">Life</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "rounded-full px-4 py-2 text-sm font-semibold bg-primary/10 text-primary" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" className="rounded-full">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <>
              <Link to="/history" className="hidden md:inline-flex">
                <Button variant="ghost" size="sm" className="rounded-full">
                  <History className="mr-1.5 h-4 w-4" /> Riwayat
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={async () => {
                  await signOut();
                  router.invalidate();
                }}
              >
                <LogOut className="mr-1.5 h-4 w-4" /> Keluar
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="rounded-full bg-gradient-hero text-white shadow-glow hover:opacity-95">
                <UserIcon className="mr-1.5 h-4 w-4" /> Masuk
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
