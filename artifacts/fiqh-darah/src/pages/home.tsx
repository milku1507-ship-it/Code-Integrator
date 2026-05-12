import { Link } from "wouter";
import { Calculator, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 sm:py-24 animate-in fade-in duration-700">
      <div className="max-w-xl w-full text-center space-y-8">

        <div className="flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-1 ring-primary/20 shadow-lg shadow-primary/10">
            <Sparkles className="w-9 h-9 text-primary" />
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-serif text-foreground tracking-tight leading-tight" data-testid="home-title">
              Kalkulator{" "}
              <span className="text-primary">Fiqh Darah</span>{" "}
              Wanita
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md mx-auto" data-testid="home-subtitle">
              Panduan spiritual dan praktis untuk memahami hukum darah haidl, nifas, dan istihadloh.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/kalkulator" data-testid="btn-start-calculator">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base gap-2 h-12 px-8 rounded-full shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 transition-all"
            >
              <Calculator className="w-5 h-5" />
              Mulai Perhitungan
            </Button>
          </Link>
          <Link href="/panduan" data-testid="btn-read-guide">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base gap-2 h-12 px-8 rounded-full border-primary/25 text-foreground hover:bg-primary/5 hover:border-primary/40 transition-all"
            >
              <BookOpen className="w-5 h-5" />
              Baca Panduan
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-border/40">
          {[
            { label: "Haidl", desc: "Hukum menstruasi" },
            { label: "Nifas", desc: "Darah melahirkan" },
            { label: "Istihadloh", desc: "Darah penyakit" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-primary/5 border border-primary/10">
              <span className="text-sm font-semibold text-primary">{item.label}</span>
              <span className="text-xs text-muted-foreground text-center leading-tight">{item.desc}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/70 mt-2">
          Data diproses sepenuhnya di perangkat Anda. Privasi Anda terjaga.
        </p>
      </div>
    </div>
  );
}
