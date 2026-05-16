import { Link } from "wouter";
import { ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAdminConfig } from "@/lib/adminConfig";
import { useState, useEffect } from "react";

const MONTHS_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
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
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function WeekStrip() {
  const today = new Date();
  const week = getWeekDays();
  return (
    <div className="flex justify-around items-end px-4 py-3 bg-white border-b border-gray-100">
      {week.map((day, i) => {
        const isToday = isSameDay(day, today);
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", isToday ? "text-[#be185d]" : "text-gray-400")}>
              {isToday ? "HRNI" : DAY_SHORT[i]}
            </span>
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold transition-all",
              isToday ? "bg-[#be185d] text-white shadow-md" : "text-gray-600"
            )}>
              {day.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WomanIllustration() {
  return (
    <svg viewBox="0 0 160 180" className="w-36 h-auto drop-shadow-sm" fill="none">
      <ellipse cx="80" cy="152" rx="40" ry="14" fill="#ffccd5" opacity="0.5"/>
      <ellipse cx="65" cy="148" rx="24" ry="12" fill="#f472b6"/>
      <ellipse cx="95" cy="148" rx="24" ry="12" fill="#f472b6"/>
      <rect x="56" y="97" width="48" height="54" rx="20" fill="#be185d"/>
      <ellipse cx="44" cy="118" rx="13" ry="8" fill="#f472b6" transform="rotate(-18 44 118)"/>
      <ellipse cx="116" cy="118" rx="13" ry="8" fill="#f472b6" transform="rotate(18 116 118)"/>
      <ellipse cx="72" cy="136" rx="9" ry="6" fill="#fda4af"/>
      <ellipse cx="88" cy="136" rx="9" ry="6" fill="#fda4af"/>
      <rect x="73" y="87" width="14" height="14" rx="6" fill="#fda4af"/>
      <circle cx="80" cy="73" r="23" fill="#fda4af"/>
      <circle cx="74" cy="71" r="2.5" fill="#9f1239"/>
      <circle cx="86" cy="71" r="2.5" fill="#9f1239"/>
      <path d="M75 80 Q80 85 85 80" stroke="#9f1239" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <ellipse cx="80" cy="64" rx="25" ry="17" fill="#be185d"/>
      <ellipse cx="80" cy="82" rx="30" ry="18" fill="#be185d"/>
      <ellipse cx="80" cy="60" rx="19" ry="13" fill="#e11d6a"/>
      <path d="M110 42 L112 36 L114 42 L120 44 L114 46 L112 52 L110 46 L104 44 Z" fill="#fbbf24" opacity="0.9"/>
      <path d="M122 60 L123 57 L124 60 L127 61 L124 62 L123 65 L122 62 L119 61 Z" fill="#fbbf24" opacity="0.7"/>
    </svg>
  );
}

const QUESTIONS = [
  "Apa itu istihadloh?",
  "Kapan sholat boleh dilanjutkan?",
  "Haidl maksimal berapa hari?",
  "Bedanya Mubtadi'ah & Mu'tadah?",
];

export default function Home() {
  const today = new Date();
  const dateLabel = `${today.getDate()} ${MONTHS_ID[today.getMonth()]}`;
  const [config] = useState(getAdminConfig);

  const banners = config.featureToggles.bannerEnabled ? config.banners : [];
  const tips = config.tips;

  return (
    <div className="flex-1 flex flex-col bg-[#fffaf1] step-enter">

      {/* ── Date Header ── */}
      <div className="text-center pt-5 pb-0 bg-white">
        <h1 className="font-display text-xl font-bold text-gray-800 tracking-tight">{dateLabel}</h1>
      </div>

      {/* ── Weekly Strip ── */}
      <WeekStrip />

      {/* ── Hero ── */}
      <div className="relative flex flex-col items-center pt-5 pb-4 overflow-hidden">
        <div className="glow-hero absolute inset-0 pointer-events-none" />
        <div className="float-blob">
          <WomanIllustration />
        </div>
        <h2 className="font-display text-2xl font-bold text-gray-800 mt-2 text-center leading-tight">
          Kalkulator Fiqh Darah
        </h2>
        <Link href="/kalkulator">
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[#be185d] text-sm font-semibold">Mulai hitung sekarang</span>
            <ChevronRight className="w-4 h-4 text-[#be185d]" />
          </div>
        </Link>
        <Link href="/kalkulator" className="w-full max-w-xs px-5 mt-3">
          <button className="w-full h-12 rounded-full btn-gradient text-white font-bold text-sm shadow-md active:scale-[0.98] transition-all">
            Mulai Perhitungan Haidl / Nifas
          </button>
        </Link>
      </div>

      {/* ── Banner Slider (Panduan Content) ── */}
      {banners.length > 0 && (
        <div className="px-5 mt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">Panduan Fiqh</h3>
            <Link href="/panduan">
              <span className="text-xs text-[#be185d] font-semibold">Lihat semua →</span>
            </Link>
          </div>
          <div className="card-slider">
            {banners.map((b) => (
              <Link key={b.id} href={b.link}>
                <div
                  className="w-32 h-40 rounded-[28px] flex flex-col justify-between p-4 cursor-pointer active:scale-[0.97] transition-all shadow-card"
                  style={{ backgroundColor: b.bg }}
                >
                  <span className="text-3xl leading-none">{b.emoji}</span>
                  <div>
                    <p className="text-white text-xs font-bold leading-tight mb-0.5">{b.title}</p>
                    <p className="text-white/70 text-[10px] leading-snug">{b.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── AI / Questions ── */}
      {config.featureToggles.aiQuestionsEnabled && (
        <div className="px-5 mt-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-bold text-gray-800">Punya pertanyaan? Tanya Panduan Fiqh</h3>
            <Sparkles className="w-4 h-4 text-[#be185d] flex-shrink-0" />
          </div>
          <div className="card-slider">
            {QUESTIONS.map((q) => (
              <Link key={q} href="/panduan">
                <div className="px-4 py-2.5 rounded-full border-2 border-[#ffccd5] bg-white text-[12px] font-semibold text-[#be185d] whitespace-nowrap active:scale-[0.97] transition-all cursor-pointer">
                  {q}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Tips Harian (SIM Card mode) ── */}
      <div className="px-5 mt-5">
        <h3 className="text-sm font-bold text-gray-800 mb-3">Tips Harian</h3>
        <div className="card-slider">
          {tips.map((tip, i) => (
            <div
              key={i}
              className="w-52 rounded-[24px] bg-white border border-[#ffccd5] px-4 py-3 shadow-card flex-shrink-0"
            >
              <span className="text-xl leading-none block mb-2">🌸</span>
              <p className="text-[12px] text-gray-700 font-medium leading-snug">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SIM Cards Grid: Fitur Utama ── */}
      <div className="px-5 mt-5 pb-4">
        <h3 className="text-sm font-bold text-gray-800 mb-3">Fitur Utama</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { emoji: "🩸", label: "Haidl", desc: "Menstruasi", href: "/kalkulator" },
            { emoji: "💗", label: "Nifas", desc: "Nifas", href: "/kalkulator" },
            { emoji: "✨", label: "Istihadloh", desc: "Penyakit", href: "/kalkulator" },
          ].map((item) => (
            <Link key={item.label} href={item.href}>
              <div className="flex flex-col items-center gap-2 p-4 rounded-[24px] bg-white border border-[#ffccd5] shadow-card active:scale-[0.97] transition-all cursor-pointer">
                <span className="text-2xl">{item.emoji}</span>
                <p className="text-[11px] font-bold text-gray-800 text-center">{item.label}</p>
                <p className="text-[9px] text-gray-400 text-center">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Compact Info Cards ── */}
      <div className="card-slider px-5 pb-6">
        {[
          { emoji: "🔒", title: "Privasi Terjaga", desc: "Data lokal, tidak dikirim", bg: "bg-gray-50", border: "border-gray-100" },
          { emoji: "📖", title: "Mazhab Syafi'i", desc: "Fiqh klasik terperinci", bg: "bg-rose-50", border: "border-[#ffccd5]" },
          { emoji: "⚡", title: "Instan", desc: "Hasil langsung otomatis", bg: "bg-amber-50", border: "border-amber-100" },
        ].map((c) => (
          <div key={c.title} className={cn("p-4 rounded-[24px] border w-40 flex-shrink-0 shadow-card", c.bg, c.border)}>
            <span className="text-2xl block mb-2">{c.emoji}</span>
            <p className="text-[11px] font-bold text-gray-800 mb-1">{c.title}</p>
            <p className="text-[10px] text-gray-500 leading-snug">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
