import { Link } from "wouter";
import { ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAY_ABBR = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const DAY_SHORT = ["M","S","S","R","K","J","S"];

function getWeekDays(): Date[] {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function WeekStrip() {
  const today = new Date();
  const week = getWeekDays();
  return (
    <div className="flex justify-around items-end px-4 py-2">
      {week.map((day, i) => {
        const isToday = isSameDay(day, today);
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className={cn(
              "text-[10px] font-semibold uppercase tracking-wide",
              isToday ? "text-[#E0426E]" : "text-gray-400"
            )}>
              {isToday ? "HRINI" : DAY_SHORT[i]}
            </span>
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all",
              isToday
                ? "bg-[#E0426E] text-white shadow-md"
                : "text-gray-500 hover:bg-gray-100"
            )}>
              {day.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const STORY_CARDS = [
  { emoji: "🌙", bg: "bg-violet-900", text: "Panduan\nHaidl Lengkap", tag: null },
  { emoji: "📿", bg: "bg-rose-100", text: "Sholat &\nIbadah Haid", tag: "PENTING" },
  { emoji: "💧", bg: "bg-sky-800", text: "Cara Hitung\nNifas", tag: null },
  { emoji: "✨", bg: "bg-amber-600", text: "7 Golongan\nWanita", tag: "POPULER" },
  { emoji: "🕌", bg: "bg-emerald-700", text: "Qodlo\nSholat", tag: null },
];

const QUESTIONS = [
  "Apa itu istihadloh?",
  "Kapan sholat boleh dilanjutkan?",
  "Batas maksimal haidl berapa hari?",
];

export default function Home() {
  const today = new Date();
  const dateLabel = `${today.getDate()} ${MONTHS_ID[today.getMonth()]}`;
  const dayName = DAY_ABBR[today.getDay()];

  return (
    <div className="flex-1 flex flex-col bg-white step-enter">

      {/* ── Date Header ── */}
      <div className="text-center pt-5 pb-1">
        <h1 className="font-display text-xl font-bold text-gray-800 tracking-tight">{dateLabel}</h1>
      </div>

      {/* ── Weekly Strip ── */}
      <WeekStrip />

      {/* ── Hero Area ── */}
      <div className="relative flex flex-col items-center pt-4 pb-2 overflow-hidden">
        <div className="glow-hero absolute inset-0 pointer-events-none" />

        {/* Woman illustration */}
        <div className="relative float-blob">
          <div className="w-40 h-40 flex items-center justify-center">
            <svg viewBox="0 0 160 180" className="w-40 h-auto drop-shadow-sm" fill="none">
              {/* Body */}
              <ellipse cx="80" cy="145" rx="38" ry="18" fill="#FFB6C1" opacity="0.35"/>
              {/* Legs crossed */}
              <ellipse cx="65" cy="142" rx="22" ry="13" fill="#E8848F" />
              <ellipse cx="95" cy="142" rx="22" ry="13" fill="#E8848F" />
              {/* Torso */}
              <rect x="55" y="95" width="50" height="52" rx="20" fill="#C75B6A"/>
              {/* Arms */}
              <ellipse cx="45" cy="118" rx="12" ry="8" fill="#E8848F" transform="rotate(-20 45 118)"/>
              <ellipse cx="115" cy="118" rx="12" ry="8" fill="#E8848F" transform="rotate(20 115 118)"/>
              {/* Hands in lap */}
              <ellipse cx="72" cy="133" rx="8" ry="6" fill="#F4A7B0"/>
              <ellipse cx="88" cy="133" rx="8" ry="6" fill="#F4A7B0"/>
              {/* Neck */}
              <rect x="72" y="84" width="16" height="16" rx="6" fill="#F4A7B0"/>
              {/* Head */}
              <circle cx="80" cy="72" r="24" fill="#F4A7B0"/>
              {/* Face */}
              <circle cx="73" cy="70" r="2.5" fill="#8B4A55"/>
              <circle cx="87" cy="70" r="2.5" fill="#8B4A55"/>
              <path d="M74 79 Q80 84 86 79" stroke="#8B4A55" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              {/* Hijab */}
              <ellipse cx="80" cy="62" rx="26" ry="18" fill="#C75B6A"/>
              <ellipse cx="80" cy="80" rx="32" ry="20" fill="#C75B6A"/>
              <ellipse cx="80" cy="58" rx="20" ry="14" fill="#E07080"/>
              {/* Sparkle top */}
              <path d="M108 42 L110 36 L112 42 L118 44 L112 46 L110 52 L108 46 L102 44 Z" fill="#FFD700" opacity="0.9"/>
              {/* Small sparkle */}
              <path d="M120 60 L121 57 L122 60 L125 61 L122 62 L121 65 L120 62 L117 61 Z" fill="#FFD700" opacity="0.7"/>
            </svg>
          </div>
        </div>

        {/* Status text */}
        <h2 className="font-display text-2xl font-bold text-gray-800 mt-1 text-center">
          Kalkulator Fiqh Darah
        </h2>
        <Link href="/kalkulator">
          <div className="flex items-center gap-1 mt-1 mb-3">
            <span className="text-[#E0426E] text-sm font-semibold">Mulai hitung sekarang</span>
            <ChevronRight className="w-4 h-4 text-[#E0426E]" />
          </div>
        </Link>

        {/* CTA pill */}
        <Link href="/kalkulator" className="w-full max-w-xs px-5">
          <button className="w-full h-12 rounded-full btn-gradient text-white font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.98] transition-all">
            Mulai Perhitungan Haidl / Nifas
          </button>
        </Link>
      </div>

      {/* ── AI Question Section ── */}
      <div className="px-5 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-bold text-gray-800">Punya pertanyaan? Tanya Panduan Fiqh</h3>
          <Sparkles className="w-4 h-4 text-[#E0426E] flex-shrink-0" />
        </div>
        <div className="card-slider">
          {QUESTIONS.map((q) => (
            <Link key={q} href="/panduan">
              <div className="px-4 py-2.5 rounded-full border border-[#FFD1DC] bg-white text-[13px] font-semibold text-[#E0426E] whitespace-nowrap hover:bg-[#FFF0F3] active:scale-[0.97] transition-all cursor-pointer shadow-sm">
                {q}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Story Cards ── */}
      <div className="px-5 mt-6">
        <h3 className="text-sm font-bold text-gray-800 mb-3">Panduan harian</h3>
        <div className="card-slider">
          {STORY_CARDS.map((card) => (
            <Link key={card.text} href="/panduan">
              <div className={cn(
                "relative w-28 h-36 rounded-2xl overflow-hidden flex flex-col justify-between p-3 cursor-pointer active:scale-[0.97] transition-all",
                card.bg
              )}>
                {card.tag && (
                  <span className="absolute top-2 right-2 bg-white/20 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {card.tag}
                  </span>
                )}
                <span className="text-3xl leading-none">{card.emoji}</span>
                <p className={cn(
                  "text-xs font-bold leading-tight whitespace-pre-line",
                  card.bg.includes("100") || card.bg.includes("50") ? "text-gray-700" : "text-white"
                )}>
                  {card.text}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Info Cards ── */}
      <div className="grid grid-cols-2 gap-3 px-5 mt-5 pb-4">
        {[
          { emoji: "🔒", title: "Privasi Terjaga", desc: "Data dihitung lokal, tidak dikirim ke server", bg: "bg-gray-50", border: "border-gray-100" },
          { emoji: "📖", title: "Mazhab Syafi'i", desc: "Perhitungan sesuai fiqh klasik", bg: "bg-rose-50", border: "border-rose-100" },
        ].map((c) => (
          <div key={c.title} className={cn("p-4 rounded-2xl border", c.bg, c.border)}>
            <span className="text-2xl block mb-2">{c.emoji}</span>
            <p className="text-xs font-bold text-gray-800 mb-1">{c.title}</p>
            <p className="text-[11px] text-gray-500 leading-snug">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
