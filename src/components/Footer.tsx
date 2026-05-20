import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3 md:px-8">
        <div>
          <div className="font-display text-2xl font-bold">
            Fit<span className="text-primary">Life</span>
          </div>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Pantau kondisi tubuh dengan ilmu yang transparan. Dibuat untuk membantu kamu mengambil keputusan kesehatan yang lebih baik.
          </p>
        </div>
        <div className="text-sm">
          <div className="mb-3 font-semibold">Produk</div>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Calculator</Link></li>
            <li><Link to="/history" className="hover:text-foreground">Riwayat</Link></li>
            <li><Link to="/about" className="hover:text-foreground">Metodologi</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <div className="mb-3 font-semibold">Disclaimer</div>
          <p className="text-muted-foreground">
            Hasil bersifat edukatif dan bukan diagnosis. Konsultasikan kondisi spesifik dengan tenaga medis.
          </p>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} FitLife. Dibangun dengan ❤︎.
      </div>
    </footer>
  );
}
