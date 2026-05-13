import { Link } from "wouter";
import { Calculator, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 sm:py-24 step-enter">
      <div className="max-w-xl w-full text-center space-y-8">

        {/* Hero icon */}
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/25 to-pink-200/40 dark:from-primary/20 dark:to-pink-900/30 flex items-center justify-center shadow-soft ring-1 ring-primary/15">
              <span className="text-4xl leading-none float-blob select-none">🌸</span>
            </div>
            <span className="absolute -top-1 -right-1 text-xl select-none">✨</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight" data-testid="home-title">
              Kalkulator{" "}
              <span className="text-primary">Fiqh Darah</span>{" "}
              Wanita
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md mx-auto" data-testid="home-subtitle">
              Panduan spiritual yang lembut & praktis untuk memahami hukum haidl, nifas, dan istihadloh. 💕
            </p>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/kalkulator" data-testid="btn-start-calculator">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base gap-2.5 h-12 px-8 rounded-full shadow-soft shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all font-semibold"
            >
              <Calculator className="w-5 h-5" />
              Mulai Perhitungan
            </Button>
          </Link>
          <Link href="/panduan" data-testid="btn-read-guide">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base gap-2.5 h-12 px-8 rounded-full border-primary/25 text-foreground hover:bg-primary/6 hover:border-primary/40 transition-all font-medium"
            >
              <BookOpen className="w-5 h-5" />
              Baca Panduan
            </Button>
          </Link>
        </div>

        {/* Divider 🌸 */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-lg select-none">🌸</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Feature pills */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Haidl", desc: "Hukum menstruasi", emoji: "❤️" },
            { label: "Nifas", desc: "Darah melahirkan", emoji: "💗" },
            { label: "Istihadloh", desc: "Darah penyakit", emoji: "✨" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-primary/6 border border-primary/12 shadow-sm hover:shadow-soft transition-all">
              <span className="text-xl select-none">{item.emoji}</span>
              <span className="text-sm font-semibold text-primary">{item.label}</span>
              <span className="text-xs text-muted-foreground text-center leading-tight">{item.desc}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/60 mt-2">
          🔒 Data diproses sepenuhnya di perangkat Anda. Privasi Anda terjaga.
        </p>
      </div>
    </div>
  );
}
