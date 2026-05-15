import { Link } from "wouter";
import { Calculator, BookOpen, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center px-5 pt-10 pb-16 step-enter">
      <div className="max-w-md w-full">

        {/* Hero illustration */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="relative mb-6">
            <div className="w-36 h-36 rounded-[2.5rem] bg-gradient-to-br from-[#FF85A1]/20 via-[#E0BBE4]/30 to-[#B2F7EF]/20 flex items-center justify-center shadow-soft glow-pink float-blob">
              <span className="text-7xl leading-none select-none">🌸</span>
            </div>
            <span className="absolute -top-2 -right-2 text-2xl select-none animate-bounce">✨</span>
            <span className="absolute -bottom-1 -left-3 text-xl select-none opacity-70">💕</span>
          </div>

          <h1 className="text-3xl font-extrabold text-foreground tracking-tight leading-tight mb-3" data-testid="home-title">
            Kalkulator{" "}
            <span className="text-[#e8629e]">Fiqh Darah</span>{" "}
            Wanita
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-sm" data-testid="home-subtitle">
            Panduan spiritual yang lembut & praktis untuk memahami hukum haidl, nifas, dan istihadloh 💕
          </p>
        </div>

        {/* CTA buttons — Clover style */}
        <div className="flex flex-col gap-3 mb-10">
          <Link href="/kalkulator" data-testid="btn-start-calculator" className="block">
            <button className="w-full h-14 rounded-3xl btn-gradient text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-soft shadow-pink-200 hover:shadow-lg hover:shadow-pink-300 active:scale-[0.98] transition-all">
              <Calculator className="w-5 h-5" />
              Mulai Perhitungan
            </button>
          </Link>
          <Link href="/panduan" data-testid="btn-read-guide" className="block">
            <button className="w-full h-14 rounded-3xl bg-white border-2 border-[#FF85A1]/30 text-foreground font-semibold text-base flex items-center justify-center gap-2.5 hover:border-[#FF85A1]/60 hover:bg-pink-50/50 active:scale-[0.98] transition-all">
              <BookOpen className="w-5 h-5 text-[#e8629e]" />
              Baca Panduan
            </button>
          </Link>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent" />
          <span className="text-lg select-none">🌸</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent" />
        </div>

        {/* Feature cards — Clover style rounded cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Haidl", desc: "Menstruasi", emoji: "❤️", color: "from-rose-50 to-pink-50", border: "border-rose-100" },
            { label: "Nifas", desc: "Nifas", emoji: "💗", color: "from-violet-50 to-purple-50", border: "border-violet-100" },
            { label: "Istihadloh", desc: "Penyakit", emoji: "✨", color: "from-amber-50 to-yellow-50", border: "border-amber-100" },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex flex-col items-center gap-2 p-4 rounded-3xl bg-gradient-to-br ${item.color} border ${item.border} shadow-sm hover:shadow-md transition-all`}
            >
              <span className="text-2xl select-none">{item.emoji}</span>
              <span className="text-xs font-bold text-foreground text-center leading-tight">{item.label}</span>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{item.desc}</span>
            </div>
          ))}
        </div>

        {/* Info cards — Clover style */}
        <div className="space-y-3">
          {[
            {
              icon: "🔒",
              title: "Privasi Terjaga",
              desc: "Data diproses sepenuhnya di perangkat Anda — tidak dikirim ke server.",
              bg: "bg-[#B2F7EF]/20",
              border: "border-[#B2F7EF]/50",
            },
            {
              icon: "📖",
              title: "Mazhab Syafi'i",
              desc: "Perhitungan mengikuti fiqh Mazhab Syafi'i secara lengkap dan terperinci.",
              bg: "bg-[#E0BBE4]/20",
              border: "border-[#E0BBE4]/50",
            },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-4 p-4 rounded-3xl ${item.bg} border ${item.border}`}>
              <div className="w-10 h-10 rounded-2xl bg-white/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-xl select-none">{item.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
