import { Link } from "wouter";
import { Calculator, BookOpen, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 animate-in fade-in duration-700">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-8">
          <HeartHandshake className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-serif text-foreground tracking-tight" data-testid="home-title">
          Kalkulator Fiqh Darah Wanita
        </h1>
        
        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto" data-testid="home-subtitle">
          Sebuah panduan spiritual dan praktis untuk memahami hukum darah haidl, nifas, dan istihadloh berdasarkan pedoman fiqh klasik.
        </p>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/kalkulator" data-testid="btn-start-calculator">
            <Button size="lg" className="w-full sm:w-auto text-base gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-8 rounded-full shadow-sm hover:shadow-md transition-all">
              <Calculator className="w-5 h-5" />
              Mulai Perhitungan
            </Button>
          </Link>
          <Link href="/panduan" data-testid="btn-read-guide">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base gap-2 h-14 px-8 rounded-full border-primary/20 text-foreground hover:bg-primary/5 transition-all">
              <BookOpen className="w-5 h-5" />
              Baca Panduan
            </Button>
          </Link>
        </div>

        <div className="mt-16 pt-8 border-t border-border/50 text-sm text-muted-foreground">
          Aplikasi ini memproses data secara lokal di perangkat Anda. Privasi Anda terjaga.
        </div>
      </div>
    </div>
  );
}
