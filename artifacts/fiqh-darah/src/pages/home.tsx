import { Link } from "wouter";
import { Calculator, BookOpen, ChevronRight, Shield, ScrollText } from "lucide-react";

const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function TodayHero() {
  const now = new Date();
  const day = DAYS_ID[now.getDay()];
  const date = now.getDate();
  const month = MONTHS_ID[now.getMonth()];
  const year = now.getFullYear();

  return (
    <div className="text-center pt-10 pb-6">
      <p className="text-sm font-semibold text-[#B76E79]/70 tracking-widest uppercase mb-1">{day}</p>
      <p className="font-display text-7xl font-bold text-foreground leading-none mb-2">{date}</p>
      <p className="text-lg font-semibold text-muted-foreground">{month} {year}</p>
    </div>
  );
}

const GUIDE_CARDS = [
  {
    emoji: "🎨",
    title: "Warna Darah",
    desc: "Hitam paling kuat, keruh paling lemah",
    bg: "from-rose-100 to-pink-50",
    border: "border-rose-200",
    href: "/panduan",
  },
  {
    emoji: "⏰",
    title: "Batas 15 Hari",
    desc: "Kunci utama dalam fiqh haidl",
    bg: "from-violet-100 to-purple-50",
    border: "border-violet-200",
    href: "/panduan",
  },
  {
    emoji: "💪",
    title: "Kuat vs Lemah",
    desc: "Cara menentukan status darahmu",
    bg: "from-amber-100 to-yellow-50",
    border: "border-amber-200",
    href: "/panduan",
  },
  {
    emoji: "👥",
    title: "7 Golongan",
    desc: "Kamu termasuk golongan mana?",
    bg: "from-sky-100 to-blue-50",
    border: "border-sky-200",
    href: "/panduan",
  },
  {
    emoji: "🕌",
    title: "Qodlo Sholat",
    desc: "Hitung hutang sholatmu",
    bg: "from-emerald-100 to-teal-50",
    border: "border-emerald-200",
    href: "/panduan",
  },
  {
    emoji: "👶",
    title: "Panduan Nifas",
    desc: "Setelah melahirkan — ini yang perlu kamu tahu",
    bg: "from-fuchsia-100 to-pink-50",
    border: "border-fuchsia-200",
    href: "/panduan",
  },
];

export default function Home() {
  return (
    <div className="flex-1 flex flex-col step-enter">

      {/* Today's date hero */}
      <TodayHero />

      {/* Sakura illustration */}
      <div className="flex flex-col items-center mb-8 px-5">
        <div className="relative mb-5">
          <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-[#FFD1DC]/50 via-[#FFFDD0]/60 to-[#FFD1DC]/30 flex items-center justify-center shadow-soft glow-pink float-blob">
            <span className="text-6xl leading-none select-none">🌸</span>
          </div>
          <span className="absolute -top-2 -right-1 text-xl select-none animate-bounce">✨</span>
          <span className="absolute -bottom-1 -left-2 text-lg select-none opacity-70">💕</span>
        </div>

        <h1 className="font-display text-2xl font-bold text-center text-foreground leading-tight mb-2" data-testid="home-title">
          Kalkulator{" "}
          <span className="text-[#B76E79]">Fiqh Darah</span>{" "}
          Wanita
        </h1>
        <p className="text-sm text-muted-foreground text-center leading-relaxed max-w-xs" data-testid="home-subtitle">
          Panduan spiritual yang lembut & praktis untuk memahami hukum haidl, nifas, dan istihadloh 💕
        </p>
      </div>

      {/* CTA Pill Buttons */}
      <div className="flex flex-col gap-3 px-5 mb-8 max-w-md w-full mx-auto">
        <Link href="/kalkulator" data-testid="btn-start-calculator" className="block">
          <button className="w-full h-14 rounded-full btn-gradient text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-soft hover:shadow-lg hover:opacity-95 active:scale-[0.98] transition-all">
            <Calculator className="w-5 h-5" />
            Mulai Perhitungan
          </button>
        </Link>
        <Link href="/panduan" data-testid="btn-read-guide" className="block">
          <button className="w-full h-14 rounded-full bg-white border-2 border-[#FFD1DC] text-[#B76E79] font-bold text-base flex items-center justify-center gap-2.5 hover:border-[#B76E79]/50 hover:bg-[#FFD1DC]/10 active:scale-[0.98] transition-all shadow-sm">
            <BookOpen className="w-5 h-5" />
            Baca Panduan
          </button>
        </Link>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5 px-5 max-w-md w-full mx-auto">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#FFD1DC] to-transparent" />
        <span className="text-base select-none text-[#B76E79]/60 font-display font-semibold text-xs tracking-widest uppercase">Panduan Cepat</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#FFD1DC] to-transparent" />
      </div>

      {/* Horizontal Card Slider */}
      <div className="card-slider px-5 mb-8">
        {GUIDE_CARDS.map((card) => (
          <Link key={card.title} href={card.href}>
            <div className={`flex flex-col gap-2 p-4 w-36 rounded-3xl bg-gradient-to-br ${card.bg} border ${card.border} shadow-sm hover:shadow-md active:scale-[0.97] transition-all cursor-pointer`}>
              <span className="text-3xl select-none">{card.emoji}</span>
              <p className="text-xs font-bold text-foreground leading-tight">{card.title}</p>
              <p className="text-[10px] text-muted-foreground leading-snug">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Feature summary cards */}
      <div className="space-y-3 px-5 max-w-md w-full mx-auto mb-6">
        {[
          {
            icon: <Shield className="w-5 h-5 text-[#B76E79]" />,
            title: "Privasi Terjaga",
            desc: "Data diproses sepenuhnya di perangkat Anda — tidak dikirim ke server.",
            bg: "bg-[#FFD1DC]/20",
            border: "border-[#FFD1DC]/50",
          },
          {
            icon: <ScrollText className="w-5 h-5 text-[#B76E79]" />,
            title: "Mazhab Syafi'i",
            desc: "Perhitungan mengikuti fiqh Mazhab Syafi'i secara lengkap dan terperinci.",
            bg: "bg-[#FFFDD0]/60",
            border: "border-amber-100",
          },
        ].map((item, i) => (
          <div key={i} className={`flex items-center gap-4 p-4 rounded-3xl ${item.bg} border ${item.border}`}>
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* Blood types mini cards */}
      <div className="grid grid-cols-3 gap-3 px-5 max-w-md w-full mx-auto pb-2">
        {[
          { label: "Haidl", desc: "Menstruasi", emoji: "❤️", color: "from-rose-50 to-pink-50", border: "border-rose-100" },
          { label: "Nifas", desc: "Nifas", emoji: "💗", color: "from-violet-50 to-purple-50", border: "border-violet-100" },
          { label: "Istihadloh", desc: "Penyakit", emoji: "✨", color: "from-amber-50 to-yellow-50", border: "border-amber-100" },
        ].map((item) => (
          <div
            key={item.label}
            className={`flex flex-col items-center gap-2 p-4 rounded-3xl bg-gradient-to-br ${item.color} border ${item.border} shadow-sm`}
          >
            <span className="text-2xl select-none">{item.emoji}</span>
            <span className="text-xs font-bold text-foreground text-center leading-tight">{item.label}</span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight">{item.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
