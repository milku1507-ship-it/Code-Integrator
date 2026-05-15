import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Calculator,
  CheckCircle2,
  RotateCcw,
  Droplets,
  Wind,
  Info,
  TriangleAlert,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  jalankanMesinFiqh,
  InputUser,
  HasilAnalisis,
  AturanIbadah,
  PeringatanJedaSuci,
  EntriHarian,
  HukumHari,
  FaseItem,
  FaseDarahItem,
  WarnaDarah,
  formatDurasi,
} from "@/lib/fiqhEngine";
import { cn } from "@/lib/utils";

const step1Schema = z.object({
  usiaTahun: z
    .coerce.number()
    .min(1, "Usia minimal 1 tahun")
    .max(100, "Usia tidak valid"),
  kondisiAwal: z.enum(["haidl", "nifas"], {
    required_error: "Pilih kondisi awal",
  }),
  statusPengalaman: z.enum(["mubtadiah", "mutadah"], {
    required_error: "Pilih status pengalaman",
  }),
});

const step3Schema = z
  .object({
    ingatKebiasaan: z.enum(
      ["ingat_semua", "lupa_semua", "ingat_durasi", "ingat_waktu"],
      { required_error: "Pilih status kebiasaan" },
    ),
    kebiasaanHaidHari: z.coerce.number().min(0).max(60).optional(),
  })
  .refine(
    (data) => {
      if (
        (data.ingatKebiasaan === "ingat_semua" ||
          data.ingatKebiasaan === "ingat_durasi") &&
        !data.kebiasaanHaidHari
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Masukkan jumlah hari kebiasaan",
      path: ["kebiasaanHaidHari"],
    },
  );

const step4Schema = z.object({
  isBulanPertamaIstihadloh: z.boolean().default(true),
  sudahSholatSebelumDarah: z.boolean().default(false),
});

const SHALAT_LABEL: Record<string, string> = {
  subuh: "Subuh",
  dzuhur: "Dzuhur",
  ashar: "Ashar",
  maghrib: "Maghrib",
  isya: "Isya'",
  "": "Di luar waktu shalat",
};

function jamKeShalat(jam: number): string {
  if (jam >= 4 && jam <= 5) return "subuh";
  if (jam >= 12 && jam <= 14) return "dzuhur";
  if (jam >= 15 && jam <= 17) return "ashar";
  if (jam === 18) return "maghrib";
  if (jam >= 19 || jam <= 3) return "isya";
  return "";
}

// ─── Adat pattern detection ──────────────────────────────────────────────────
function deteksiPolaDanAmbilNilai(riwayat: number[]): {
  nilai: number;
  polaDitemukan: boolean;
  polaPanjang: number;
  pesan: string;
} {
  if (riwayat.length === 0) return { nilai: 7, polaDitemukan: false, polaPanjang: 0, pesan: "Belum ada data bulan." };
  if (riwayat.length === 1)
    return { nilai: riwayat[0], polaDitemukan: false, polaPanjang: 1, pesan: `Menggunakan data Bulan 1: ${riwayat[0]} hari.` };
  const n = riwayat.length;
  const maxLen = Math.floor(n / 2);
  for (let len = 1; len <= maxLen; len++) {
    const candidate = riwayat.slice(0, len);
    let isPattern = true;
    for (let i = len; i < n; i++) {
      if (riwayat[i] !== candidate[i % len]) { isPattern = false; break; }
    }
    if (isPattern) {
      const nextVal = candidate[n % len];
      return {
        nilai: nextVal,
        polaDitemukan: true,
        polaPanjang: len,
        pesan: `Pola berulang [${candidate.join(", ")}] ditemukan. Nilai siklus ini: ${nextVal} hari.`,
      };
    }
  }
  const lastVal = riwayat[n - 1];
  return {
    nilai: lastVal,
    polaDitemukan: false,
    polaPanjang: n,
    pesan: `Tidak ada pola berulang. Menggunakan bulan terakhir: ${lastVal} hari (kaidah Mu'tadah Ghairu Mumayyizah).`,
  };
}

// ─── 12-Tier Blood Hierarchy Types ───────────────────────────────────────────
export type WarnaDarahInput = "hitam" | "merah" | "saja" | "kuning" | "keruh" | "bersih";
export type TeksturDarah = "kental" | "cair";
export type AromaDarah = "berbau" | "tidak_berbau";

export interface KarakteristikHari {
  warna: WarnaDarahInput;
  tekstur: TeksturDarah;
  aroma: AromaDarah;
}

export interface DurasiHari {
  jam: number;
  menit: number;
}

export type StatusHariInput = "kuat" | "lemah" | "bersih";

// ─── 15-level ranking matrix (Uyunul Masa-il Linnisa) ────────────────────────
// Rank 1 = terkuat, Rank 15 = terlemah
// Urutan warna (primer): Hitam > Merah > Saja' > Kuning > Keruh
// Sifat fisik (sekunder, hanya berlaku jika WARNA SAMA):
//   Kental+Berbau (2 poin) = terkuat, Salah satunya (1 poin), Cair+TdkBerbau (0 poin) = terlemah
// Hitam:  Kental+Berbau=1, Salah satunya=2, Cair+TdkBerbau=3
// Merah:  Kental+Berbau=4, Salah satunya=5, Cair+TdkBerbau=6
// Saja':  Kental+Berbau=7, Salah satunya=8, Cair+TdkBerbau=9
// Kuning: Kental+Berbau=10, Salah satunya=11, Cair+TdkBerbau=12
// Keruh:  Kental+Berbau=13, Salah satunya=14, Cair+TdkBerbau=15
function hitungPeringkat(k: KarakteristikHari): number {
  if (k.warna === "bersih") return 0; // Bersih tidak termasuk dalam hierarki darah
  // Warna adalah faktor primer — menentukan blok ranking utama
  const colorBase: Record<string, number> = {
    hitam:  0,
    merah:  1,
    saja:   2,
    kuning: 3,
    keruh:  4,
  };
  const base = colorBase[k.warna];
  if (base === undefined) return 99;
  // Sifat fisik adalah faktor sekunder — hanya membedakan dalam warna yang sama
  // Skor sifat: kental=1 poin, berbau=1 poin (maks 2 poin)
  const skorSifat = (k.tekstur === "kental" ? 1 : 0) + (k.aroma === "berbau" ? 1 : 0);
  // Konversi ke rank (lebih rendah = lebih kuat): 2 poin→0, 1 poin→1, 0 poin→2
  const sifatRank = 2 - skorSifat;
  return base * 3 + sifatRank + 1;
}

function warnaDarahInputToEngine(w: WarnaDarahInput): WarnaDarah {
  return w === "saja" ? "merah kekuningan" : (w as WarnaDarah);
}

// Determine kuat/lemah for each darah day based on 15-rank comparison (Uyunul Masa-il Linnisa)
function tentukanStatusKuatLemah(
  darahKeys: string[],
  harianKarakteristik: Record<string, KarakteristikHari>,
): Record<string, StatusHariInput> {
  if (darahKeys.length === 0) return {};
  // Exclude bersih days from ranking comparison
  const bersihSet = new Set(
    darahKeys.filter((k) => harianKarakteristik[k]?.warna === "bersih"),
  );
  const ranks: Record<string, number> = {};
  for (const k of darahKeys) {
    if (bersihSet.has(k)) continue;
    const kar = harianKarakteristik[k];
    ranks[k] = kar ? hitungPeringkat(kar) : 15;
  }
  const rankedKeys = Object.keys(ranks);
  const minRank = rankedKeys.length > 0 ? Math.min(...rankedKeys.map((k) => ranks[k])) : 15;
  const maxRank = rankedKeys.length > 0 ? Math.max(...rankedKeys.map((k) => ranks[k])) : 15;
  const result: Record<string, StatusHariInput> = {};
  for (const k of darahKeys) {
    if (bersihSet.has(k)) {
      result[k] = "bersih";
    } else if (ranks[k] === undefined) {
      result[k] = "kuat";
    } else if (minRank === maxRank) {
      result[k] = "kuat";
    } else {
      result[k] = ranks[k] === minRank ? "kuat" : "lemah";
    }
  }
  return result;
}

// ─── Phase conversion: calendar → FaseItem[] ─────────────────────────────────
function kalenderKePhaseDenganDurasi(
  harianDarah: Record<string, boolean>,
  harianKarakteristik: Record<string, KarakteristikHari>,
  harianDurasi: Record<string, DurasiHari>,
): FaseItem[] {
  const darahKeys = Object.keys(harianDarah).filter((k) => harianDarah[k]).sort();
  if (darahKeys.length === 0) return [];

  const phases: FaseItem[] = [];

  for (let i = 0; i < darahKeys.length; i++) {
    const key = darahKeys[i];

    // Insert bersih gap between non-consecutive darah days
    if (i > 0) {
      const prevKey = darahKeys[i - 1];
      const gapDays = diffDaysCalc(parseKey(prevKey), parseKey(key)) - 1;
      if (gapDays > 0) {
        phases.push({ tipe: "bersih", hari: gapDays, jam: 0 });
      }
    }

    const kar = harianKarakteristik[key];
    const durasi = harianDurasi[key];
    const totalMenit = durasi ? (durasi.jam * 60 + durasi.menit) : 24 * 60;
    const effectiveMenit = totalMenit === 0 ? 24 * 60 : totalMenit;
    const totalJam = Math.ceil(effectiveMenit / 60);
    const durasiHari = Math.floor(totalJam / 24);
    const durasiJamSisa = totalJam % 24;

    if (kar?.warna === "bersih") {
      // User-marked clean day → emit as bersih phase (An-Naqo')
      phases.push({ tipe: "bersih", hari: durasiHari || 1, jam: durasiJamSisa });
    } else {
      phases.push({
        tipe: "darah",
        warna: kar ? warnaDarahInputToEngine(kar.warna) : "merah",
        kental: kar ? kar.tekstur === "kental" : false,
        bau: kar ? kar.aroma === "berbau" : false,
        hari: durasiHari,
        jam: durasiJamSisa,
      } satisfies FaseDarahItem);
    }
  }

  return phases;
}

function hitungTotalMenitDarah(
  harianDarah: Record<string, boolean>,
  harianDurasi: Record<string, DurasiHari>,
): number {
  let total = 0;
  for (const [key, isDarah] of Object.entries(harianDarah)) {
    if (!isDarah) continue;
    const durasi = harianDurasi[key];
    if (!durasi) {
      total += 24 * 60;
    } else {
      const m = durasi.jam * 60 + durasi.menit;
      total += m === 0 ? 24 * 60 : m;
    }
  }
  return total;
}

// ─── Date utilities ─────────────────────────────────────────────────────────
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDaysToDate(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function diffDaysCalc(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
const MONTHS_ID_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
const MONTHS_ID_FULL = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const WEEKDAYS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
function formatDateId(key: string): string {
  const d = parseKey(key);
  return `${d.getDate()} ${MONTHS_ID_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Warna options for dropdown ──────────────────────────────────────────────
const WARNA_OPTIONS: { value: WarnaDarahInput; label: string; dotClass: string }[] = [
  { value: "hitam",  label: "Hitam",                  dotClass: "bg-gray-900" },
  { value: "merah",  label: "Merah",                   dotClass: "bg-red-500" },
  { value: "saja",   label: "Saja' (Pirang/Coklat)",  dotClass: "bg-amber-700" },
  { value: "kuning", label: "Kuning",                  dotClass: "bg-yellow-400" },
  { value: "keruh",  label: "Keruh",                   dotClass: "bg-gray-400" },
  { value: "bersih", label: "Bersih/Bening (An-Naqo')", dotClass: "bg-emerald-100 border-2 border-emerald-400" },
];

// ─── Simplified Calendar (darah / hapus only) ────────────────────────────────
function KalenderInputTanggal({
  harianDarah,
  harianStatus,
  onChange,
  kondisiAwal,
  onEditDay,
}: {
  harianDarah: Record<string, boolean>;
  harianStatus: Record<string, StatusHariInput>;
  onChange: (h: Record<string, boolean>, autoFill?: { sourceKey: string; newKeys: string[] }) => void;
  kondisiAwal?: "haidl" | "nifas";
  onEditDay?: (key: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [mode, setMode] = useState<"darah" | "hapus">("darah");
  const [anchor, setAnchor] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const allDates = Object.keys(harianDarah).filter((k) => harianDarah[k]).sort();
  const firstDate = allDates.length > 0 ? allDates[0] : null;
  const lastDate = allDates.length > 0 ? allDates[allDates.length - 1] : null;
  const totalDays = firstDate && lastDate ? diffDaysCalc(parseKey(firstDate), parseKey(lastDate)) + 1 : 0;
  const totalDarah = allDates.length;

  const nifasEndKey = firstDate && kondisiAwal === "nifas"
    ? dateKey(addDaysToDate(parseKey(firstDate), 59))
    : null;

  const previewRange = anchor && hoverDate ? {
    start: anchor < hoverDate ? anchor : hoverDate,
    end: anchor < hoverDate ? hoverDate : anchor,
  } : null;

  const fillRange = (startKey: string, endKey: string, value: boolean) => {
    const updated = { ...harianDarah };
    let d = parseKey(startKey);
    while (dateKey(d) <= endKey) {
      if (value) {
        updated[dateKey(d)] = true;
      } else {
        delete updated[dateKey(d)];
      }
      d = addDaysToDate(d, 1);
    }
    return updated;
  };

  const handleDayClick = (key: string) => {
    if (mode === "hapus") {
      const updated = { ...harianDarah };
      delete updated[key];
      onChange(updated);
      setAnchor(null);
      setHoverDate(null);
      return;
    }
    if (anchor && anchor !== key) {
      // Second click on different day: fill range + auto-copy anchor's characteristics
      const startKey = anchor < key ? anchor : key;
      const endKey = anchor < key ? key : anchor;
      const newMap = fillRange(startKey, endKey, true);
      const newKeys = Object.keys(newMap).filter((k) => !harianDarah[k]);
      onChange(newMap, { sourceKey: anchor, newKeys });
      setAnchor(null);
      setHoverDate(null);
    } else if (!harianDarah[key]) {
      // New unmarked day: mark it, set as anchor, open modal immediately
      const updated = { ...harianDarah };
      updated[key] = true;
      onChange(updated);
      setAnchor(key);
      onEditDay?.(key);
    } else {
      // Already marked day: open modal (clear anchor if same)
      if (anchor === key) setAnchor(null);
      onEditDay?.(key);
    }
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = new Date(year, month, 1).getDay();
  const days: (string | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => dateKey(new Date(year, month, i + 1))),
  ];

  const goToFirstDate = () => {
    if (firstDate) {
      const d = parseKey(firstDate);
      setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  const exceedsLimit = kondisiAwal === "nifas" ? totalDays > 60 : totalDays > 15;
  const isCurrentMonthFirst = firstDate
    ? parseKey(firstDate).getFullYear() === year && parseKey(firstDate).getMonth() === month
    : false;

  return (
    <div className="space-y-4">
      {/* ── Mode toolbar ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={() => { setMode("darah"); }}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border-2 transition-all select-none",
            "bg-rose-100 dark:bg-rose-900/50 border-rose-400 dark:border-rose-600 text-rose-900 dark:text-rose-100",
            mode === "darah"
              ? "shadow-md scale-105 ring-2 ring-offset-1 ring-primary/50"
              : "opacity-60 hover:opacity-90",
          )}
        >
          <span className="w-2 h-2 rounded-full flex-shrink-0 bg-rose-500" />
          Tandai Darah ❤️
        </button>
        <button
          type="button"
          onClick={() => { setMode("hapus"); setAnchor(null); setHoverDate(null); }}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border-2 transition-all select-none",
            mode === "hapus"
              ? "bg-destructive/10 border-destructive text-destructive shadow-md scale-105"
              : "bg-muted/40 border-muted text-muted-foreground opacity-70 hover:opacity-100",
          )}
        >
          <span className="text-sm leading-none">✕</span>
          Hapus
        </button>
        <span className="text-xs text-muted-foreground ml-1">
          Klik tanggal awal, lalu klik tanggal akhir untuk rentang
        </span>
      </div>

      {/* ── Anchor indicator ── */}
      {anchor && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 px-4 py-2.5 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="text-base select-none flex-shrink-0">📍</span>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-emerald-800 dark:text-emerald-200">
              Titik awal: {formatDateId(anchor)}
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 ml-2 text-xs">
              — sudah terisi, klik tanggal lain untuk <strong>mengisi rentang otomatis</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => { setAnchor(null); setHoverDate(null); }}
            className="flex-shrink-0 text-xs text-muted-foreground hover:text-destructive font-medium"
          >
            Batal
          </button>
        </div>
      )}

      {/* ── Calendar ── */}
      <div className="rounded-2xl border overflow-hidden shadow-sm">
        {/* Month navigation header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b">
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <span className="font-semibold text-sm">{MONTHS_ID_FULL[month]} {year}</span>
            {firstDate && !isCurrentMonthFirst && (
              <button
                type="button"
                onClick={goToFirstDate}
                className="block text-xs text-primary/80 hover:underline mt-0.5 mx-auto"
              >
                ↩ ke awal pencatatan
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Nifas zone info bar */}
        {kondisiAwal === "nifas" && nifasEndKey && (
          <div className="px-4 py-2 bg-teal-50/70 dark:bg-teal-950/30 border-b border-teal-100 dark:border-teal-900 flex items-center gap-2 text-xs text-teal-700 dark:text-teal-400">
            <span className="inline-block w-3 h-3 rounded-sm border-2 border-teal-400 bg-teal-100 flex-shrink-0" />
            <span>Zona Nifas maks. s.d. <strong>{formatDateId(nifasEndKey)}</strong> — hari setelahnya berpotensi Istihadloh (arsir abu)</span>
          </div>
        )}

        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-muted/10 border-b border-border/30">
          {WEEKDAYS_ID.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px bg-border/30">
          {days.map((key, idx) => {
            if (!key) {
              return <div key={`pad-${idx}`} className="bg-background min-h-[40px]" />;
            }
            const isDarah = harianDarah[key] === true;
            const status = isDarah ? (harianStatus[key] ?? "kuat") : null;
            const isAnchor = anchor === key;
            const inPreview = previewRange && key >= previewRange.start && key <= previewRange.end;
            const dayNum = parseInt(key.split("-")[2]);

            const isInNifasZone = nifasEndKey && firstDate && key >= firstDate && key <= nifasEndKey;
            const isAfterNifasZone = nifasEndKey && key > nifasEndKey;
            const dayFromStart = firstDate ? diffDaysCalc(parseKey(firstDate), parseKey(key)) + 1 : 0;
            const isToday = key === dateKey(new Date());

            const bgClass = status === "kuat"
              ? "bg-rose-100 dark:bg-rose-900/50 text-rose-900 dark:text-rose-100 font-semibold"
              : status === "lemah"
                ? "bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100 font-semibold"
                : "";

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleDayClick(key)}
                onMouseEnter={() => anchor && setHoverDate(key)}
                onMouseLeave={() => setHoverDate(null)}
                className={cn(
                  "relative bg-background min-h-[40px] flex flex-col items-center justify-center py-1 transition-all select-none",
                  bgClass || (
                    mode === "hapus"
                      ? "hover:bg-destructive/10 hover:text-destructive"
                      : anchor
                        ? "hover:bg-primary/8"
                        : "hover:bg-muted/50"
                  ),
                  inPreview && !isDarah && "bg-primary/8",
                  inPreview && isDarah && "ring-1 ring-inset ring-primary",
                  isAnchor && "ring-2 ring-inset ring-primary z-10",
                  !isDarah && isAfterNifasZone && kondisiAwal === "nifas" && "bg-muted/40 text-muted-foreground/40",
                  isToday && !isDarah && !isAfterNifasZone && "bg-primary/4",
                )}
              >
                {isToday && (
                  <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/50" />
                )}
                <span className={cn(
                  "text-[11px] leading-none font-medium",
                  isDarah
                    ? status === "kuat" ? "text-rose-900 dark:text-rose-100" : "text-amber-900 dark:text-amber-100"
                    : isAfterNifasZone ? "text-muted-foreground/40" : "text-muted-foreground",
                )}>
                  {dayNum}
                </span>
                {isDarah && (
                  <span className="text-sm leading-none mt-0.5">
                    {status === "kuat" ? "❤️" : "🩸"}
                  </span>
                )}
                {!isDarah && isAfterNifasZone && kondisiAwal === "nifas" && (
                  <span className="text-[8px] text-muted-foreground/40 leading-none mt-0.5">≥61</span>
                )}
                {isInNifasZone && !isAnchor && !isDarah && (
                  <div className="absolute inset-0 border border-teal-300/30 dark:border-teal-600/20 pointer-events-none" />
                )}
                {firstDate && dayFromStart > 0 && (
                  <span className={cn(
                    "absolute bottom-0.5 right-0.5 text-[7px] leading-none",
                    isAfterNifasZone ? "text-amber-500/60" : "text-muted-foreground/25",
                  )}>
                    {dayFromStart}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Stats summary ── */}
      {firstDate && lastDate ? (
        <div className="flex flex-wrap gap-2 text-sm">
          <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-3 py-1.5">
            <span className="font-medium">Rentang:</span>
            <span className="font-bold">{totalDays} hari</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">({formatDateId(firstDate)} – {formatDateId(lastDate)})</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5">
            <span className="font-medium text-rose-700 dark:text-rose-400">Darah:</span>
            <span className="font-bold text-rose-700 dark:text-rose-400">{totalDarah} hari</span>
          </div>
          {exceedsLimit && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 px-3 py-1.5">
              <TriangleAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                {kondisiAwal === "nifas"
                  ? "Melebihi 60 hari — akan dianalisis sebagai Istihadloh Nifas"
                  : "Melebihi 15 hari — akan dianalisis sebagai Mustahadloh"}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-muted/30 border border-dashed p-4 text-center text-sm text-muted-foreground space-y-1">
          <p className="font-medium">Pilih mode "Tandai Darah" lalu klik tanggal awal.</p>
          <p className="text-xs opacity-70">Klik tanggal berbeda untuk mengisi seluruh rentang sekaligus. Klik tanggal yang sama dua kali untuk menandai satu hari.</p>
        </div>
      )}
    </div>
  );
}

// ─── Bottom Sheet ────────────────────────────────────────────────────────────
function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end">
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative w-full bg-background rounded-t-[44px] shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-muted-foreground/20" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <span className="font-semibold text-base">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Date List Panel (replaces inline form) ───────────────────────────────────
function DateListPanel({
  darahKeys,
  harianKarakteristik,
  harianDurasi,
  harianStatus,
  harianRank,
  onKarChange,
  onDurChange,
  triggerOpen,
}: {
  darahKeys: string[];
  harianKarakteristik: Record<string, KarakteristikHari>;
  harianDurasi: Record<string, DurasiHari>;
  harianStatus: Record<string, StatusHariInput>;
  harianRank: Record<string, number>;
  onKarChange: (key: string, kar: KarakteristikHari) => void;
  onDurChange: (key: string, dur: DurasiHari) => void;
  triggerOpen?: { key: string; v: number } | null;
}) {
  const [sheetKey, setSheetKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ kar: KarakteristikHari | null; dur: DurasiHari }>({
    kar: null,
    dur: { jam: 0, menit: 0 },
  });

  useEffect(() => {
    if (!triggerOpen || !darahKeys.includes(triggerOpen.key)) return;
    setSheetKey(triggerOpen.key);
    setDraft({
      kar: harianKarakteristik[triggerOpen.key] ?? null,
      dur: harianDurasi[triggerOpen.key] ?? { jam: 0, menit: 0 },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerOpen]);

  if (darahKeys.length === 0) return null;

  const defaultKar: KarakteristikHari = { warna: "merah", tekstur: "cair", aroma: "tidak_berbau" };

  const openSheet = (key: string) => {
    setSheetKey(key);
    setDraft({
      kar: harianKarakteristik[key] ?? null,
      dur: harianDurasi[key] ?? { jam: 0, menit: 0 },
    });
  };

  const closeSheet = () => setSheetKey(null);

  const saveSheet = () => {
    if (!sheetKey) return;
    if (draft.kar) onKarChange(sheetKey, draft.kar);
    onDurChange(sheetKey, draft.dur);
    setSheetKey(null);
  };

  const draftKar = draft.kar ?? defaultKar;
  const isBersihDraft = draftKar.warna === "bersih";

  // Summary counts for the header
  const kuatCount = darahKeys.filter((k) => harianStatus[k] === "kuat" && harianKarakteristik[k]?.warna !== "bersih" && harianKarakteristik[k]).length;
  const lemahCount = darahKeys.filter((k) => harianStatus[k] === "lemah" && harianKarakteristik[k]).length;
  const bersihCount = darahKeys.filter((k) => harianStatus[k] === "bersih").length;

  return (
    <>
      <div className="space-y-3 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-rose-600" />
            <span className="font-semibold text-rose-700 dark:text-rose-400 text-sm">
              Karakteristik per Tanggal
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {kuatCount > 0 && <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-medium">{kuatCount} Kuat</span>}
            {lemahCount > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium">{lemahCount} Lemah</span>}
            {bersihCount > 0 && <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">{bersihCount} Bersih</span>}
          </div>
        </div>

        {/* Date list */}
        <div className="rounded-2xl border overflow-hidden divide-y">
          {darahKeys.map((k, idx) => {
            const status = harianStatus[k] ?? "kuat";
            const rank = harianRank[k];
            const kar = harianKarakteristik[k];
            const durasi = harianDurasi[k] ?? { jam: 0, menit: 0 };
            const totalMenit = durasi.jam * 60 + durasi.menit;
            const isBersihDay = kar?.warna === "bersih";
            const isKuat = status === "kuat";

            return (
              <button
                key={k}
                type="button"
                onClick={() => openSheet(k)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 active:bg-muted/70 transition-colors text-left"
              >
                {/* Day number circle */}
                <div className={cn(
                  "w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white",
                  isBersihDay
                    ? "bg-emerald-500"
                    : !kar
                    ? "bg-muted-foreground/40"
                    : isKuat
                    ? "bg-rose-500"
                    : "bg-amber-400",
                )}>
                  {idx + 1}
                </div>

                {/* Date & status summary */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{formatDateId(k)}</span>
                    {isBersihDay ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-medium">
                        Bersih (An-Naqo')
                      </span>
                    ) : kar ? (
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full border font-medium",
                        isKuat
                          ? "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700"
                          : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700",
                      )}>
                        {isKuat ? "Kuat" : "Lemah"}{rank !== undefined ? ` #${rank}` : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Tap untuk mengisi →</span>
                    )}
                  </div>
                  {kar && !isBersihDay && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {WARNA_OPTIONS.find(o => o.value === kar.warna)?.label}
                      {" · "}{kar.tekstur === "kental" ? "Kental" : "Cair"}
                      {" · "}{kar.aroma === "berbau" ? "Berbau" : "Tidak Berbau"}
                    </p>
                  )}
                </div>

                {/* Duration + chevron */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {totalMenit === 0 ? "24 jam" : `${durasi.jam}j ${durasi.menit > 0 ? `${durasi.menit}m` : ""}`}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Kuat/Lemah comparison note */}
        {lemahCount > 0 && kuatCount > 0 && (
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3 text-xs text-blue-800 dark:text-blue-300">
            <p className="font-semibold">Perbandingan Otomatis:</p>
            <p className="mt-0.5 text-muted-foreground">
              Darah dengan peringkat terkecil = <span className="text-rose-600 font-medium">Kuat</span>. Peringkat lebih besar = <span className="text-amber-600 font-medium">Lemah</span>. Warna mengalahkan sifat fisik.
            </p>
          </div>
        )}
      </div>

      {/* ── Bottom Sheet ── */}
      <BottomSheet
        open={sheetKey !== null}
        onClose={closeSheet}
        title={
          sheetKey
            ? <span>Edit <span className="text-primary">{formatDateId(sheetKey)}</span></span>
            : ""
        }
      >
        <div className="space-y-5">
          {/* Warna — shown first so bersih can hide the rest */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Warna Darah</label>
            <Select
              value={draftKar.warna}
              onValueChange={(v) =>
                setDraft((prev) => ({
                  ...prev,
                  kar: { ...(prev.kar ?? defaultKar), warna: v as WarnaDarahInput },
                }))
              }
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WARNA_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-3.5 h-3.5 rounded-full flex-shrink-0", opt.dotClass)} />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bersih notice */}
          {isBersihDraft && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3.5">
              <p className="font-semibold text-sm text-emerald-800 dark:text-emerald-200">Masa Suci / An-Naqo'</p>
              <p className="text-xs mt-1 text-emerald-700 dark:text-emerald-400 leading-relaxed">
                Hari ini dihukumi bersih — tidak ada darah yang keluar. Tekstur dan aroma tidak perlu diisi.
                Sistem akan mencatat hari ini sebagai jeda suci di antara masa darah.
              </p>
            </div>
          )}

          {/* Tekstur (hidden if bersih) */}
          {!isBersihDraft && (
            <div className="space-y-2">
              <label className="text-sm font-semibold">Tekstur</label>
              <Select
                value={draftKar.tekstur}
                onValueChange={(v) =>
                  setDraft((prev) => ({
                    ...prev,
                    kar: { ...(prev.kar ?? defaultKar), tekstur: v as TeksturDarah },
                  }))
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kental">Kental</SelectItem>
                  <SelectItem value="cair">Cair</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Aroma (hidden if bersih) */}
          {!isBersihDraft && (
            <div className="space-y-2">
              <label className="text-sm font-semibold">Aroma</label>
              <Select
                value={draftKar.aroma}
                onValueChange={(v) =>
                  setDraft((prev) => ({
                    ...prev,
                    kar: { ...(prev.kar ?? defaultKar), aroma: v as AromaDarah },
                  }))
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="berbau">Berbau</SelectItem>
                  <SelectItem value="tidak_berbau">Tidak Berbau</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Durasi */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              {isBersihDraft ? "Durasi Bersih" : "Durasi Keluar Darah"}
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="number"
                  min={0}
                  max={24}
                  value={draft.dur.jam === 0 && draft.dur.menit === 0 ? "" : draft.dur.jam}
                  placeholder="0"
                  onChange={(e) => {
                    const val = Math.min(24, Math.max(0, parseInt(e.target.value) || 0));
                    setDraft((prev) => ({ ...prev, dur: { ...prev.dur, jam: val } }));
                  }}
                  className="text-center h-11"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">jam</span>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={draft.dur.jam === 0 && draft.dur.menit === 0 ? "" : draft.dur.menit}
                  placeholder="0"
                  onChange={(e) => {
                    const val = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                    setDraft((prev) => ({ ...prev, dur: { ...prev.dur, menit: val } }));
                  }}
                  className="text-center h-11"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">menit</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {draft.dur.jam === 0 && draft.dur.menit === 0
                ? "Kosong = otomatis 24 jam (seharian penuh)"
                : `Total: ${draft.dur.jam * 60 + draft.dur.menit} menit`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1 pb-2">
            <Button variant="outline" className="flex-1 h-11" onClick={closeSheet}>
              Batal
            </Button>
            <Button className="flex-1 h-11" onClick={saveSheet}>
              Simpan
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

const HUKUM_CONFIG: Record<HukumHari, {
  label: string;
  labelRingkas: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}> = {
  haid: {
    label: "Haid",
    labelRingkas: "H",
    bgClass: "bg-rose-100 dark:bg-rose-900/40",
    textClass: "text-rose-800 dark:text-rose-200",
    borderClass: "border-rose-300 dark:border-rose-700",
    dotClass: "bg-rose-500",
  },
  nifas: {
    label: "Nifas",
    labelRingkas: "N",
    bgClass: "bg-teal-100 dark:bg-teal-900/40",
    textClass: "text-teal-800 dark:text-teal-200",
    borderClass: "border-teal-300 dark:border-teal-700",
    dotClass: "bg-teal-500",
  },
  istihadloh: {
    label: "Istihadloh",
    labelRingkas: "I",
    bgClass: "bg-amber-100 dark:bg-amber-900/40",
    textClass: "text-amber-800 dark:text-amber-200",
    borderClass: "border-amber-300 dark:border-amber-700",
    dotClass: "bg-amber-500",
  },
  ihtiyath: {
    label: "Ihtiyath",
    labelRingkas: "?",
    bgClass: "bg-violet-100 dark:bg-violet-900/40",
    textClass: "text-violet-800 dark:text-violet-200",
    borderClass: "border-violet-300 dark:border-violet-700",
    dotClass: "bg-violet-500",
  },
  suci: {
    label: "Suci",
    labelRingkas: "S",
    bgClass: "bg-sky-100 dark:bg-sky-900/40",
    textClass: "text-sky-800 dark:text-sky-200",
    borderClass: "border-sky-300 dark:border-sky-700",
    dotClass: "bg-sky-400",
  },
};

function KalenderHarian({ entri, kategoriStr, startDate }: { entri: EntriHarian[]; kategoriStr?: string; startDate?: string }) {
  const [selectedHari, setSelectedHari] = useState<number | null>(null);
  const selected = selectedHari !== null ? entri.find((e) => e.hari === selectedHari) : null;
  const qodloDays = entri.filter((e) => e.wajibQodloPuasa);
  const jumlahQodlo = qodloDays.length;
  const bersihSuciDays = entri.filter((e) => e.tipe === "bersih" && e.hukum !== "haid" && e.hukum !== "nifas" && e.hukum !== "ihtiyath");
  const ihtiyathDays = entri.filter((e) => e.hukum === "ihtiyath");

  const entryDateKey = (hari: number): string | null =>
    startDate ? dateKey(addDaysToDate(parseKey(startDate), hari - 1)) : null;
  const entryDateLabel = (hari: number): string | null => {
    const k = entryDateKey(hari);
    return k ? formatDateId(k) : null;
  };
  const entryDateShort = (hari: number): string | null => {
    const k = entryDateKey(hari);
    if (!k) return null;
    const d = parseKey(k);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <div className="p-6 sm:p-8 border-t space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-1 text-foreground flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Kalender Harian — Status per Hari
        </h3>
        <p className="text-sm text-muted-foreground">
          Ketuk kotak hari untuk melihat keterangan hukum lengkapnya.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700 shadow-sm">
          <span className="text-sm leading-none select-none">❤️</span>
          Darah Haid
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 border-teal-300 dark:border-teal-700 shadow-sm">
          <span className="text-sm leading-none select-none">💙</span>
          Nifas / Jeda Bersih Nifas
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 shadow-sm">
          <span className="text-sm leading-none select-none">🌸</span>
          Darah Istihadloh — ibadah tetap wajib
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border-green-400 dark:border-green-600 shadow-sm">
          <span className="text-sm leading-none select-none">💚</span>
          Jeda Bersih = Haid — puasanya perlu diganti ya ✨
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200 border-sky-400 dark:border-sky-600 shadow-sm">
          <span className="text-sm leading-none select-none">✨</span>
          Alhamdulillah, sholat &amp; puasa sah 🌸
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200 border-violet-300 dark:border-violet-700 shadow-sm">
          <span className="text-sm leading-none select-none">💜</span>
          Ihtiyath — masa keraguan, wajib hati-hati
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {entri.map((e) => {
          const cfg = HUKUM_CONFIG[e.hukum];
          const isIhtiyath = e.hukum === "ihtiyath";
          const isBersihHaid = e.tipe === "bersih" && e.hukum === "haid";
          const isNifas = e.hukum === "nifas";
          const isBersihSuci = e.tipe === "bersih" && !isIhtiyath && e.hukum !== "haid" && e.hukum !== "nifas";
          const isSelected = selectedHari === e.hari;
          const shortDate = entryDateShort(e.hari);

          return (
            <button
              key={e.hari}
              type="button"
              onClick={() => setSelectedHari(isSelected ? null : e.hari)}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-xl border-2 aspect-square text-center cursor-pointer transition-all shadow-sm select-none",
                isBersihHaid
                  ? "bg-green-100 dark:bg-green-900/50 border-green-500 dark:border-green-500 text-green-900 dark:text-green-100"
                  : isNifas
                    ? "bg-teal-100 dark:bg-teal-900/50 border-teal-400 dark:border-teal-500 text-teal-900 dark:text-teal-100"
                    : isBersihSuci
                      ? "bg-sky-100 dark:bg-sky-900/50 border-sky-400 dark:border-sky-500 text-sky-900 dark:text-sky-100"
                      : cn(cfg.bgClass, cfg.borderClass, cfg.textClass),
                isSelected && "ring-2 ring-offset-1 ring-primary scale-110 z-10",
                e.jamDiHari < 24 && "opacity-75",
              )}
              title={`${entryDateLabel(e.hari) ?? `Hari ke-${e.hari}`} — ${e.keterangan}`}
              data-testid={`hari-${e.hari}`}
            >
              <span className="text-[9px] font-semibold leading-none opacity-70 mb-0.5">
                {shortDate ?? e.hari}
              </span>
              <span className="text-sm leading-none select-none">
                {isIhtiyath ? "💜" : isBersihHaid ? "💚" : isNifas ? "💙" : isBersihSuci ? "✨" : e.hukum === "haid" ? "❤️" : "🌸"}
              </span>
              {shortDate && (
                <span className="absolute bottom-0.5 right-0.5 text-[7px] leading-none opacity-35">
                  {e.hari}
                </span>
              )}
              {e.wajibQodloPuasa && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400" />
              )}
              {e.jamDiHari < 24 && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] leading-none opacity-50">
                  {e.jamDiHari}j
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected && (() => {
        const selIsIhtiyath = selected.hukum === "ihtiyath";
        const selIsBersihHaid = selected.tipe === "bersih" && selected.hukum === "haid";
        const selIsNifas = selected.hukum === "nifas";
        const selIsBersihNifas = selected.tipe === "bersih" && selIsNifas;
        const selIsBersihSuci = selected.tipe === "bersih" && !selIsIhtiyath && selected.hukum !== "haid" && !selIsNifas;
        return (
          <div className={cn(
            "rounded-xl border-2 p-4 transition-all",
            selIsBersihHaid
              ? "bg-green-50 dark:bg-green-950/30 border-green-400 dark:border-green-600"
              : selIsNifas
                ? "bg-teal-50 dark:bg-teal-950/30 border-teal-400 dark:border-teal-600"
                : selIsBersihSuci
                  ? "bg-sky-50 dark:bg-sky-950/30 border-sky-400 dark:border-sky-600"
                  : cn(HUKUM_CONFIG[selected.hukum].bgClass, HUKUM_CONFIG[selected.hukum].borderClass),
          )}>
            <div className="flex items-center gap-2 mb-2">
              {selected.tipe === "bersih" ? (
                <Wind className={cn("w-4 h-4",
                  selIsBersihHaid ? "text-green-600" : selIsIhtiyath ? "text-violet-500" : selIsNifas ? "text-teal-600" : "text-sky-500"
                )} />
              ) : (
                <Droplets className={cn("w-4 h-4", selIsIhtiyath ? "text-violet-500" : selIsNifas ? "text-teal-600" : "text-rose-600")} />
              )}
              <span className="font-bold text-sm">
                {entryDateLabel(selected.hari)
                  ? <>{entryDateLabel(selected.hari)} <span className="font-normal text-xs opacity-60">(Hari ke-{selected.hari})</span></>
                  : <>Hari ke-{selected.hari}</>}
                {selected.jamDiHari < 24 && <span className="font-normal text-xs ml-1 opacity-70">({selected.jamDiHari} jam)</span>}
              </span>
              <span className={cn(
                "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full",
                selIsBersihHaid
                  ? "bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100"
                  : selIsBersihNifas
                    ? "bg-teal-200 dark:bg-teal-800 text-teal-900 dark:text-teal-100"
                  : selIsBersihSuci
                    ? "bg-sky-200 dark:bg-sky-800 text-sky-900 dark:text-sky-100"
                    : cn(HUKUM_CONFIG[selected.hukum].bgClass, HUKUM_CONFIG[selected.hukum].textClass),
              )}>
                {selIsBersihHaid
                  ? "Jeda Bersih → Haid (Q)"
                  : selIsBersihNifas
                    ? "Jeda Bersih → Nifas (Q)"
                  : selIsBersihSuci
                    ? "Jeda Bersih → Suci/Istihadloh (S)"
                    : selIsIhtiyath
                      ? `${selected.tipe === "bersih" ? "Bersih" : "Darah"} — Ihtiyath (I)`
                      : selIsNifas
                        ? `${selected.tipe === "bersih" ? "Bersih" : "Darah"} — Nifas (N)`
                        : `Darah — ${HUKUM_CONFIG[selected.hukum].label} (D)`}
              </span>
            </div>
            <p className="text-sm leading-relaxed">{selected.keterangan}</p>
            {selected.warnaAsli && (
              <p className="text-xs mt-1 opacity-70">Warna darah: {selected.warnaAsli}</p>
            )}
            {selected.tipe === "bersih" && (
              <div className={cn(
                "mt-3 rounded-lg px-3 py-2 text-xs font-medium flex items-start gap-2",
                selIsBersihHaid
                  ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"
                  : selIsBersihNifas
                    ? "bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300"
                  : selIsIhtiyath
                    ? "bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300"
                    : "bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300",
              )}>
                {selIsBersihHaid ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-0.5" />
                    <span>Sholat wajib dikerjakan namun <strong>TIDAK SAH</strong> — tidak perlu qodlo &nbsp;|&nbsp; Puasa <strong>TIDAK SAH — wajib diqodlo</strong></span>
                  </>
                ) : selIsBersihNifas ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 mt-0.5" />
                    <span>Jeda bersih dalam nifas (An-naqo') — Sholat wajib dikerjakan namun <strong>TIDAK SAH</strong> — tidak perlu qodlo &nbsp;|&nbsp; Puasa <strong>TIDAK SAH — wajib diqodlo</strong></span>
                  </>
                ) : selIsIhtiyath ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-0.5" />
                    <span>Masa ihtiyath (keraguan) — wajib sholat & puasa. Mandi besar tiap waktu sholat.</span>
                  </>
                ) : (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-sky-500 flex-shrink-0 mt-0.5" />
                    <span>Sholat <strong>SAH</strong> &nbsp;|&nbsp; Puasa <strong>SAH</strong> — tidak ada kewajiban qodlo</span>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {jumlahQodlo > 0 && (
        <details className="rounded-2xl border-2 border-green-400 dark:border-green-600 overflow-hidden" open>
          <summary className="flex items-center gap-4 bg-green-600 dark:bg-green-700 px-5 py-4 cursor-pointer list-none select-none">
            <div className="text-center flex-shrink-0">
              <p className="text-3xl font-extrabold text-white leading-none">{jumlahQodlo}</p>
              <p className="text-xs font-semibold text-green-100 mt-0.5">hari</p>
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-white">Qodlo Puasa — Hari Bersih dihukumi Haid/Nifas</p>
              <p className="text-xs text-green-100 mt-0.5 leading-snug">
                Puasa wajib diqodlo — ketuk untuk lihat detail ▾
              </p>
            </div>
          </summary>
          <div className="bg-green-50 dark:bg-green-950/40 px-5 py-3 border-b border-green-200 dark:border-green-800">
            <p className="text-xs text-green-800 dark:text-green-300 leading-relaxed">
              {kategoriStr
                ? <>Berdasarkan profil <strong>{kategoriStr}</strong>, hari-hari berikut Anda catat &lsquo;Bersih&rsquo; namun secara hukum fiqh tetap dihukumi Haid/Nifas.</>
                : "Hari-hari berikut Anda catat 'Bersih' namun secara hukum fiqh tetap dihukumi Haid/Nifas."}{" "}
              Di hari-hari tersebut: sholat wajib dikerjakan (karena tampak suci secara dzahir) namun{" "}
              <strong>TIDAK SAH</strong> — tidak perlu diqodlo.{" "}
              <strong>Puasa TIDAK SAH dan wajib diqodlo.</strong>
            </p>
          </div>
          <div className="divide-y divide-green-100 dark:divide-green-900/50 bg-white dark:bg-green-950/20">
            {qodloDays.map((e) => (
              <div key={e.hari} className="flex gap-4 px-5 py-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 dark:bg-green-700 flex items-center justify-center shadow-sm">
                  <span className="text-sm font-extrabold text-white leading-none">{e.hari}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-green-900 dark:text-green-100 mb-0.5">
                    {entryDateLabel(e.hari)
                      ? <>{entryDateLabel(e.hari)} <span className="font-normal opacity-70">(Hari ke-{e.hari}{e.jamDiHari < 24 ? `, ${e.jamDiHari} jam` : ""})</span></>
                      : <>Hari ke-{e.hari}{e.jamDiHari < 24 ? ` (${e.jamDiHari} jam)` : ""}</>
                    }{" "}— Bersih dihukumi {e.hukum === "nifas" ? "NIFAS" : "HAID"}
                  </p>
                  <p className="text-xs text-green-800 dark:text-green-300 leading-relaxed">{e.keterangan}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-green-700 dark:text-green-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-600 dark:bg-green-400" />
                    Puasa hari ini wajib diqodlo
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-green-50 dark:bg-green-950/40 px-5 py-3 border-t border-green-200 dark:border-green-800">
            <p className="text-xs text-green-700 dark:text-green-400">
              <strong>Catatan:</strong> Sholat yang Anda kerjakan di hari-hari tersebut wajib dilakukan (karena tampak suci secara dzahir) namun <strong>TIDAK SAH</strong> secara hukum — tidak perlu diqodlo. Yang wajib diqodlo adalah <strong>puasanya</strong> (jika bertepatan dengan bulan Ramadhan atau puasa wajib lainnya).
            </p>
          </div>
        </details>
      )}

      {bersihSuciDays.length > 0 && (
        <details className="rounded-2xl border-2 border-sky-400 dark:border-sky-600 overflow-hidden">
          <summary className="flex items-center gap-4 bg-sky-500 dark:bg-sky-700 px-5 py-4 cursor-pointer list-none select-none">
            <div className="text-center flex-shrink-0">
              <p className="text-3xl font-extrabold text-white leading-none">{bersihSuciDays.length}</p>
              <p className="text-xs font-semibold text-sky-100 mt-0.5">hari</p>
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-white">Hari Bersih — Suci / Istihadloh</p>
              <p className="text-xs text-sky-100 mt-0.5 leading-snug">Ibadah SAH — ketuk untuk lihat detail ▾</p>
            </div>
          </summary>
          <div className="bg-sky-50 dark:bg-sky-950/40 px-5 py-3 border-b border-sky-200 dark:border-sky-800">
            <p className="text-xs text-sky-800 dark:text-sky-300 leading-relaxed">
              {kategoriStr
                ? <>Berdasarkan profil <strong>{kategoriStr}</strong>, hari-hari berikut Anda catat &lsquo;Bersih&rsquo; dan secara hukum fiqh dihukumi <strong>Suci / Istihadloh</strong>.</>
                : "Hari-hari berikut Anda catat 'Bersih' dan secara hukum fiqh dihukumi Suci / Istihadloh."}{" "}
              Di hari-hari tersebut: <strong>sholat SAH</strong> dan <strong>puasa SAH</strong>. Tidak ada kewajiban qodlo.
            </p>
          </div>
          <div className="divide-y divide-sky-100 dark:divide-sky-900/50 bg-white dark:bg-sky-950/20">
            {bersihSuciDays.map((e) => (
              <div key={e.hari} className="flex gap-4 px-5 py-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sky-500 dark:bg-sky-700 flex items-center justify-center shadow-sm">
                  <span className="text-sm font-extrabold text-white leading-none">{e.hari}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-sky-900 dark:text-sky-100 mb-0.5">
                    {entryDateLabel(e.hari)
                      ? <>{entryDateLabel(e.hari)} <span className="font-normal opacity-70">(Hari ke-{e.hari}{e.jamDiHari < 24 ? `, ${e.jamDiHari} jam` : ""})</span></>
                      : <>Hari ke-{e.hari}{e.jamDiHari < 24 ? ` (${e.jamDiHari} jam)` : ""}</>
                    }{" "}— Bersih dihukumi {e.hukum === "ihtiyath" ? "Ihtiyath" : "Suci/Istihadloh"}
                  </p>
                  <p className="text-xs text-sky-800 dark:text-sky-300 leading-relaxed">{e.keterangan}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 dark:text-sky-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400" />
                    Sholat SAH — Puasa SAH — tidak perlu qodlo
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-sky-50 dark:bg-sky-950/40 px-5 py-3 border-t border-sky-200 dark:border-sky-800">
            <p className="text-xs text-sky-700 dark:text-sky-400">
              <strong>Catatan:</strong> Pada hari-hari ini Anda dihukumi <strong>Suci</strong>. Sholat dan puasa yang Anda kerjakan <strong>SAH</strong> secara hukum. Jika Anda Mustahadloh, gunakan tata cara bersuci Mustahadloh (wudhu tiap waktu sholat).
            </p>
          </div>
        </details>
      )}

      {ihtiyathDays.length > 0 && (
        <details className="rounded-2xl border-2 border-violet-400 dark:border-violet-600 overflow-hidden">
          <summary className="flex items-center gap-4 bg-violet-600 dark:bg-violet-800 px-5 py-4 cursor-pointer list-none select-none">
            <div className="text-center flex-shrink-0">
              <p className="text-3xl font-extrabold text-white leading-none">{ihtiyathDays.length}</p>
              <p className="text-xs font-semibold text-violet-100 mt-0.5">hari</p>
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-white">Hari Ihtiyath (Masa Keraguan)</p>
              <p className="text-xs text-violet-100 mt-0.5 leading-snug">Wajib sholat & puasa — ketuk untuk lihat detail ▾</p>
            </div>
          </summary>
          <div className="bg-violet-50 dark:bg-violet-950/40 px-5 py-3 border-b border-violet-200 dark:border-violet-800">
            <p className="text-xs text-violet-800 dark:text-violet-300 leading-relaxed">
              Hari-hari ini berlaku hukum <strong>Ihtiyath</strong> — status haid tidak pasti. Anda <strong>wajib sholat dan puasa</strong> sebagai tindakan kehati-hatian, namun juga wajib mandi besar setiap menjelang sholat fardlu.
            </p>
          </div>
          <div className="divide-y divide-violet-100 dark:divide-violet-900/50 bg-white dark:bg-violet-950/20">
            {ihtiyathDays.map((e) => (
              <div key={e.hari} className="flex gap-4 px-5 py-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-600 dark:bg-violet-800 flex items-center justify-center shadow-sm">
                  <span className="text-sm font-extrabold text-white leading-none">{e.hari}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-violet-900 dark:text-violet-100 mb-0.5">
                    {entryDateLabel(e.hari)
                      ? <>{entryDateLabel(e.hari)} <span className="font-normal opacity-70">(Hari ke-{e.hari}{e.jamDiHari < 24 ? `, ${e.jamDiHari} jam` : ""})</span></>
                      : <>Hari ke-{e.hari}{e.jamDiHari < 24 ? ` (${e.jamDiHari} jam)` : ""}</>
                    }{" "}— {e.tipe === "bersih" ? "Bersih" : "Darah"} Ihtiyath
                  </p>
                  <p className="text-xs text-violet-800 dark:text-violet-300 leading-relaxed">{e.keterangan}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-violet-700 dark:text-violet-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-violet-500 dark:bg-violet-400" />
                    Sholat & puasa wajib — mandi besar tiap waktu sholat
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-violet-50 dark:bg-violet-950/40 px-5 py-3 border-t border-violet-200 dark:border-violet-800">
            <p className="text-xs text-violet-700 dark:text-violet-400">
              <strong>Catatan:</strong> Hukum ihtiyath berlaku pada wanita Mutahayyiroh (lupa adat haid). Ibadah sholat & puasa yang dikerjakan di hari-hari ini <strong>sah</strong>, namun perlu mandi wajib setiap kali akan sholat fardlu sebagai kehati-hatian.
            </p>
          </div>
        </details>
      )}
    </div>
  );
}

export default function Kalkulator() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<InputUser>>({});
  const [hasil, setHasil] = useState<HasilAnalisis | null>(null);

  // ── New state: darah/karakteristik/durasi per day ──
  const [harianDarah, setHarianDarah] = useState<Record<string, boolean>>({});
  const [harianKarakteristik, setHarianKarakteristik] = useState<Record<string, KarakteristikHari>>({});
  const [harianDurasi, setHarianDurasi] = useState<Record<string, DurasiHari>>({});
  const [editTrigger, setEditTrigger] = useState<{ key: string; v: number } | null>(null);

  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [totalJamDarah, setTotalJamDarah] = useState<number>(0);
  const [adatMode, setAdatMode] = useState<"tetap" | "berubah">("tetap");
  const [riwayatBulan, setRiwayatBulan] = useState<number[]>([7, 7]);

  // ── Computed: sorted darah keys + status per day ──
  const darahKeys = Object.keys(harianDarah).filter((k) => harianDarah[k]).sort();
  const harianStatus = tentukanStatusKuatLemah(darahKeys, harianKarakteristik);
  const harianRank: Record<string, number> = {};
  for (const k of darahKeys) {
    const kar = harianKarakteristik[k];
    if (kar) harianRank[k] = hitungPeringkat(kar);
  }

  const form1 = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      usiaTahun: formData.usiaTahun || 9,
      kondisiAwal: formData.kondisiAwal || "haidl",
      statusPengalaman: formData.statusPengalaman || "mubtadiah",
    },
  });

  const form3 = useForm<z.infer<typeof step3Schema>>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      ingatKebiasaan: formData.ingatKebiasaan || "ingat_semua",
      kebiasaanHaidHari: formData.kebiasaanHaidHari || 7,
    },
  });

  const form4 = useForm<z.infer<typeof step4Schema>>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      isBulanPertamaIstihadloh: formData.isBulanPertamaIstihadloh ?? true,
      sudahSholatSebelumDarah: formData.sudahSholatSebelumDarah ?? false,
    },
  });

  const isNifasMode = form1.watch("kondisiAwal") === "nifas";

  const onStep1Submit = (data: z.infer<typeof step1Schema>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const onStep2Submit = () => {
    setStep2Error(null);
    if (darahKeys.length === 0) {
      setStep2Error("Tandai minimal 1 hari darah pada kalender.");
      return;
    }
    const converted = kalenderKePhaseDenganDurasi(harianDarah, harianKarakteristik, harianDurasi);
    const totalMenit = hitungTotalMenitDarah(harianDarah, harianDurasi);
    const totalJam = totalMenit / 60;
    setTotalJamDarah(totalJam);

    // Detect prayer times from first/last blood day
    const firstKey = darahKeys[0];
    const lastKey = darahKeys[darahKeys.length - 1];
    const lastDurasi = harianDurasi[lastKey] ?? { jam: 24, menit: 0 };
    const lastEndJam = Math.min(24, lastDurasi.jam + (lastDurasi.menit > 0 ? 1 : 0));
    const shalatMulai = jamKeShalat(0) as InputUser["waktuMulaiDarah"];
    const shalatBerhenti = jamKeShalat(lastEndJam === 24 ? 0 : lastEndJam) as InputUser["waktuBerhentiTotal"];

    setFormData((prev) => ({
      ...prev,
      daftarFase: converted,
      waktuMulaiDarah: shalatMulai,
      waktuBerhentiTotal: shalatBerhenti,
    }));
    if (formData.statusPengalaman === "mubtadiah") {
      setStep(4);
    } else {
      setStep(3);
    }
  };

  const onStep3Submit = (data: z.infer<typeof step3Schema>) => {
    let finalKebiasaan = parseFloat(String(data.kebiasaanHaidHari ?? 7)) || 7;
    if (adatMode === "berubah" && riwayatBulan.length > 0) {
      finalKebiasaan = deteksiPolaDanAmbilNilai(riwayatBulan).nilai;
    }
    setFormData((prev) => ({ ...prev, ...data, kebiasaanHaidHari: finalKebiasaan }));
    setStep(4);
  };

  const onStep4Submit = (data: z.infer<typeof step4Schema>) => {
    try {
      const finalData: InputUser = {
        usiaTahun: formData.usiaTahun ?? 9,
        kondisiAwal: formData.kondisiAwal ?? "haidl",
        statusPengalaman: formData.statusPengalaman ?? "mubtadiah",
        ingatKebiasaan: formData.ingatKebiasaan ?? "lupa_semua",
        kebiasaanHaidHari: parseFloat(String(formData.kebiasaanHaidHari ?? 0)) || 0,
        daftarFase: formData.daftarFase ?? [],
        isBulanPertamaIstihadloh: data.isBulanPertamaIstihadloh ?? true,
        waktuMulaiDarah: (formData.waktuMulaiDarah ?? "") as InputUser["waktuMulaiDarah"],
        sudahSholatSebelumDarah: data.sudahSholatSebelumDarah ?? false,
        waktuBerhentiTotal: (formData.waktuBerhentiTotal ?? "") as InputUser["waktuBerhentiTotal"],
      };
      setFormData(finalData);
      const result = jalankanMesinFiqh(finalData);
      setHasil(result);
      setStep(5);
    } catch (_err) {
      setHasil({
        kesimpulan: "Terjadi Kesalahan",
        kategori: "",
        hukumHaidl: "",
        hukumIstihadloh:
          "Mohon lengkapi data Anda dan pastikan semua kolom terisi dengan benar.",
        qodloSholatMulai: "",
        qodloSholat: "",
        hutangIbadah: "",
        panduanBersuci: "",
        tipeHasil: "error",
      });
      setStep(5);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFormData({});
    setHasil(null);
    setHarianDarah({});
    setHarianKarakteristik({});
    setHarianDurasi({});
    setStep2Error(null);
    setTotalJamDarah(0);
    setAdatMode("tetap");
    setRiwayatBulan([7, 7]);
    form1.reset({ usiaTahun: 9, kondisiAwal: "haidl", statusPengalaman: "mubtadiah" });
    form3.reset({ ingatKebiasaan: "ingat_semua", kebiasaanHaidHari: 7 });
    form4.reset({ isBulanPertamaIstihadloh: true, sudahSholatSebelumDarah: false });
  };

  // ── Total duration for validation display ──
  const totalMenitDarah = hitungTotalMenitDarah(harianDarah, harianDurasi);
  const totalJamDarahLive = totalMenitDarah / 60;
  const kurang24 = totalMenitDarah > 0 && totalMenitDarah < 1440;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 w-full">
      {step < 5 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 px-2">
            {[
              { n: 1, label: "Data Diri", emoji: "🌸" },
              { n: 2, label: "Kalender",  emoji: "❤️" },
              { n: 3, label: "Kebiasaan", emoji: "💗" },
              { n: 4, label: "Ibadah",    emoji: "✨" },
            ].map(({ n, label, emoji }) => (
              <div key={n} className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center text-base transition-all duration-300 select-none font-bold",
                  step === n
                    ? "bg-[#FF85A1] text-white shadow-lg shadow-pink-200 scale-110"
                    : step > n
                      ? "bg-[#FF85A1]/25 text-[#e8629e]"
                      : "bg-muted text-muted-foreground/40",
                )}>
                  {step > n ? "✓" : emoji}
                </div>
                <span className={cn(
                  "text-[10px] font-bold hidden sm:block transition-colors tracking-wide",
                  step === n ? "text-[#e8629e]" : step > n ? "text-[#e8629e]/70" : "text-muted-foreground/40"
                )}>{label}</span>
              </div>
            ))}
          </div>
          <div className="h-2 w-full bg-pink-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF85A1] to-[#e8629e] transition-all duration-500 ease-out rounded-full"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <Card className="border-0 shadow-soft step-enter overflow-hidden rounded-3xl">
          <CardHeader className="bg-gradient-to-br from-[#FF85A1]/10 via-[#E0BBE4]/10 to-white pb-6 border-b border-pink-100">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-[#FF85A1]/20 flex items-center justify-center">
                <span className="text-xl select-none">🌸</span>
              </div>
              <CardTitle className="text-2xl font-extrabold">Tentang Kamu</CardTitle>
            </div>
            <CardDescription className="text-sm font-medium">
              Ceritakan kondisimu saat ini — kami siapkan panduan yang tepat untukmu 💕
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form1}>
              <form
                onSubmit={form1.handleSubmit(onStep1Submit)}
                className="space-y-8"
                data-testid="form-step-1"
              >
                <FormField
                  control={form1.control}
                  name="usiaTahun"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usia (Tahun Qomariyah)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-usia" />
                      </FormControl>
                      <FormDescription>Menurut penanggalan Hijriyah.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form1.control}
                  name="kondisiAwal"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Kondisi Saat Darah Keluar</FormLabel>
                      <div className="flex rounded-2xl border border-muted bg-muted/30 p-1.5 gap-1.5" data-testid="radio-kondisi">
                        {(["haidl", "nifas"] as const).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => field.onChange(val)}
                            data-testid={`radio-kondisi-${val}`}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 select-none",
                              field.value === val
                                ? "bg-primary text-white shadow-md scale-[1.02]"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                            )}
                          >
                            <span className="text-base">{val === "haidl" ? "🌸" : "💙"}</span>
                            {val === "haidl" ? "Haidl" : "Nifas"}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form1.control}
                  name="statusPengalaman"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>
                        {isNifasMode ? "Status Pengalaman Nifas" : "Status Pengalaman Haid"}
                      </FormLabel>
                      <div className="grid sm:grid-cols-2 gap-4" data-testid="radio-pengalaman">
                        {(isNifasMode
                          ? [
                              { val: "mubtadiah" as const, label: "Mubtadi'ah Finnifas", desc: "Baru pertama kali mengalami nifas (melahirkan)." },
                              { val: "mutadah" as const, label: "Mu'tadah Finnifas", desc: "Sudah pernah nifas sebelumnya dan tahu kebiasaannya." },
                            ]
                          : [
                              { val: "mubtadiah" as const, label: "Mubtadi'ah", desc: "Baru pertama kali mengalami haid." },
                              { val: "mutadah" as const, label: "Mu'tadah", desc: "Sudah pernah haid dan suci sebelumnya." },
                            ]
                        ).map(({ val, label, desc }) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => field.onChange(val)}
                            data-testid={`radio-pengalaman-${val}`}
                            className={cn(
                              "flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all text-left w-full",
                              field.value === val
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-primary/50",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                                field.value === val ? "border-primary" : "border-muted-foreground",
                              )}>
                                {field.value === val && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                              </div>
                              <span className="font-medium">{label}</span>
                            </div>
                            <span className="text-sm text-muted-foreground pl-8">{desc}</span>
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" size="lg" className="rounded-full px-8 gap-2" data-testid="btn-next-1">
                    Selanjutnya <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-0 shadow-soft step-enter overflow-hidden rounded-3xl">
          <CardHeader className="bg-gradient-to-br from-rose-50/70 via-pink-50/40 to-white pb-6 border-b border-pink-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(1)}
              className="w-fit mb-4 gap-2 -ml-3 text-muted-foreground hover:text-[#e8629e] rounded-full"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                  <span className="text-xl select-none">❤️</span>
                </div>
                <CardTitle className="text-2xl font-extrabold">Kalender & Karakteristik Darah</CardTitle>
              </div>
              <CardDescription className="mt-1 font-medium">
                Tandai hari-hari darah pada kalender, lalu isi karakteristik dan durasi untuk setiap harinya.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Info banner */}
            <div className="flex items-start gap-2 rounded-2xl bg-primary/6 border border-primary/15 p-4 text-sm text-foreground/80">
              <span className="text-base select-none flex-shrink-0 mt-0.5">💡</span>
              {formData.kondisiAwal === "nifas" ? (
                <p>
                  Tandai setiap hari dari hari pertama setelah melahirkan. Jeda bersih <strong>{"<"} 15 hari</strong> di antara dua hari darah tetap dihukumi nifas (An-naqo'). Batas maksimal nifas adalah <strong>60 hari 60 malam</strong>.
                </p>
              ) : (
                <p>
                  Tandai hari-hari darah pada kalender lalu isi karakteristik tiap hari. Sistem akan menentukan status <strong>Darah Kuat/Lemah</strong> otomatis berdasarkan 15 hierarki kekuatan darah.
                </p>
              )}
            </div>

            {/* Calendar */}
            <KalenderInputTanggal
              harianDarah={harianDarah}
              harianStatus={harianStatus}
              onEditDay={(key) => setEditTrigger((prev) => ({ key, v: (prev?.v ?? 0) + 1 }))}
              onChange={(next, autoFill) => {
                setHarianDarah(next);
                // Clean up karakteristik for removed days; auto-fill for new range days
                setHarianKarakteristik((prev) => {
                  const cleaned: Record<string, KarakteristikHari> = {};
                  for (const k of Object.keys(prev)) {
                    if (next[k]) cleaned[k] = prev[k];
                  }
                  // If a range was completed and the source day has characteristics,
                  // copy them to all newly added days that don't already have data
                  if (autoFill && prev[autoFill.sourceKey]) {
                    const sourceKar = prev[autoFill.sourceKey];
                    for (const k of autoFill.newKeys) {
                      if (!cleaned[k]) cleaned[k] = { ...sourceKar };
                    }
                  }
                  return cleaned;
                });
                // Clean up durasi for removed days; auto-filled days keep default (24h)
                setHarianDurasi((prev) => {
                  const cleaned: Record<string, DurasiHari> = {};
                  for (const k of Object.keys(prev)) {
                    if (next[k]) cleaned[k] = prev[k];
                  }
                  return cleaned;
                });
              }}
              kondisiAwal={formData.kondisiAwal}
            />

            {/* Karakteristik & Durasi Panel */}
            {darahKeys.length > 0 && (
              <DateListPanel
                darahKeys={darahKeys}
                harianKarakteristik={harianKarakteristik}
                harianDurasi={harianDurasi}
                harianStatus={harianStatus}
                harianRank={harianRank}
                triggerOpen={editTrigger}
                onKarChange={(key: string, kar: KarakteristikHari) =>
                  setHarianKarakteristik((prev) => ({ ...prev, [key]: kar }))
                }
                onDurChange={(key: string, dur: DurasiHari) =>
                  setHarianDurasi((prev) => ({ ...prev, [key]: dur }))
                }
              />
            )}

            {/* Total duration summary */}
            {darahKeys.length > 0 && (
              <div className={cn(
                "rounded-xl px-4 py-3 flex items-start gap-3 text-sm border",
                kurang24
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700"
                  : "bg-background border-border",
              )}>
                {kurang24
                  ? <TriangleAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  : <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                }
                <div className="space-y-0.5">
                  <p className={cn("font-semibold", kurang24 ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>
                    Total akumulasi darah:{" "}
                    <span className="font-bold">
                      {Math.floor(totalJamDarahLive)} jam {Math.round((totalJamDarahLive % 1) * 60)} menit
                      {" "}({totalMenitDarah} menit)
                    </span>
                    {kurang24 && " — kurang dari 24 jam"}
                  </p>
                  {kurang24 && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      Darah yang totalnya kurang dari 24 jam (1.440 menit) belum memenuhi syarat minimal haid. Sistem akan menganalisis sebagai <strong>Istihadah (darah penyakit)</strong>.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 12-Tier reference table */}
            <details className="rounded-2xl border border-muted overflow-hidden">
              <summary className="flex items-center gap-2 px-4 py-3 bg-muted/20 cursor-pointer text-sm font-semibold select-none">
                <Info className="w-4 h-4 text-muted-foreground" />
                Tabel Referensi 15 Hierarki Kekuatan Darah (Uyunul Masa-il)
              </summary>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-t">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="px-3 py-2 text-left font-semibold">Peringkat</th>
                      <th className="px-3 py-2 text-left font-semibold">Warna</th>
                      <th className="px-3 py-2 text-left font-semibold">Sifat Fisik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { r: 1,  w: "Hitam",  s: "Kental & Berbau" },
                      { r: 2,  w: "Hitam",  s: "Kental saja ATAU Berbau saja" },
                      { r: 3,  w: "Hitam",  s: "Cair & Tidak Berbau" },
                      { r: 4,  w: "Merah",  s: "Kental & Berbau" },
                      { r: 5,  w: "Merah",  s: "Kental saja ATAU Berbau saja" },
                      { r: 6,  w: "Merah",  s: "Cair & Tidak Berbau" },
                      { r: 7,  w: "Saja' (Merah Kekuningan)", s: "Kental & Berbau" },
                      { r: 8,  w: "Saja' (Merah Kekuningan)", s: "Kental saja ATAU Berbau saja" },
                      { r: 9,  w: "Saja' (Merah Kekuningan)", s: "Cair & Tidak Berbau" },
                      { r: 10, w: "Kuning", s: "Kental & Berbau" },
                      { r: 11, w: "Kuning", s: "Kental saja ATAU Berbau saja" },
                      { r: 12, w: "Kuning", s: "Cair & Tidak Berbau" },
                      { r: 13, w: "Keruh",  s: "Kental & Berbau" },
                      { r: 14, w: "Keruh",  s: "Kental saja ATAU Berbau saja" },
                      { r: 15, w: "Keruh",  s: "Cair & Tidak Berbau" },
                    ].map(({ r, w, s }) => (
                      <tr key={r} className={r <= 3 ? "bg-rose-50/40 dark:bg-rose-950/10" : r <= 6 ? "bg-orange-50/40 dark:bg-orange-950/10" : "bg-background"}>
                        <td className="px-3 py-1.5 font-bold text-center">{r}</td>
                        <td className="px-3 py-1.5 font-medium">{w}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{s}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>

            {step2Error && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {step2Error}
              </div>
            )}

            <div className="flex justify-between pt-2 border-t">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                Kembali
              </Button>
              <div className="flex items-center gap-3">
                {darahKeys.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground gap-1.5"
                    onClick={() => {
                      setHarianDarah({});
                      setHarianKarakteristik({});
                      setHarianDurasi({});
                      setStep2Error(null);
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </Button>
                )}
                <Button
                  type="button"
                  size="lg"
                  className="rounded-full px-8 gap-2"
                  data-testid="btn-next-2"
                  onClick={onStep2Submit}
                >
                  Analisis <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-0 shadow-soft step-enter overflow-hidden rounded-3xl">
          <CardHeader className="bg-gradient-to-br from-pink-50/70 via-[#E0BBE4]/15 to-white pb-6 border-b border-pink-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(2)}
              className="w-fit mb-4 gap-2 -ml-3 text-muted-foreground hover:text-[#e8629e] rounded-full"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Button>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-pink-100 flex items-center justify-center">
                <span className="text-xl select-none">💗</span>
              </div>
              <CardTitle className="text-2xl font-extrabold">
                {formData.kondisiAwal === "nifas" ? "Kebiasaan Nifasmu" : "Kebiasaan Haidmu"}
              </CardTitle>
            </div>
            <CardDescription className="font-medium">
              {formData.kondisiAwal === "nifas"
                ? "Ceritakan kebiasaan nifas sebelumnya ya — ini membantu kami menentukan batas nifasmu yang sebenarnya 🌸"
                : "Ceritakan kebiasaan siklus haidmu sebelumnya ya — ini membantu kami memberi panduan yang akurat 🌸"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form3}>
              <form
                onSubmit={form3.handleSubmit(onStep3Submit)}
                className="space-y-8"
                data-testid="form-step-3"
              >
                <FormField
                  control={form3.control}
                  name="ingatKebiasaan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {formData.kondisiAwal === "nifas"
                          ? "Seberapa baik Anda mengingat kebiasaan nifas sebelumnya?"
                          : "Seberapa baik Anda mengingat kebiasaan haid sebelumnya?"}
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-ingat-kebiasaan">
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ingat_semua">Ingat semua (Tanggal mulai dan Jumlah hari)</SelectItem>
                          <SelectItem value="ingat_durasi">Hanya ingat jumlah hari (Durasi)</SelectItem>
                          <SelectItem value="ingat_waktu">Hanya ingat kapan mulai (Waktu/Tanggal)</SelectItem>
                          <SelectItem value="lupa_semua">Lupa semuanya (Waktu dan Durasi)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(form3.watch("ingatKebiasaan") === "ingat_semua" ||
                  form3.watch("ingatKebiasaan") === "ingat_durasi") && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    {formData.kondisiAwal !== "nifas" && (
                      <div className="rounded-2xl border bg-pink-50/60 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800 p-4 space-y-3">
                        <p className="text-sm font-semibold text-pink-800 dark:text-pink-300">Tipe Adat / Kebiasaan Haid</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setAdatMode("tetap")}
                            className={cn(
                              "rounded-xl border-2 p-3 text-left transition-all",
                              adatMode === "tetap"
                                ? "border-primary bg-primary/10 dark:bg-primary/20"
                                : "border-border bg-background hover:border-primary/40"
                            )}
                          >
                            <p className={cn("text-sm font-semibold", adatMode === "tetap" ? "text-primary" : "text-foreground")}>
                              Adat Tetap
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                              Haid selalu sama tiap bulan (misal: selalu 7 hari)
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdatMode("berubah")}
                            className={cn(
                              "rounded-xl border-2 p-3 text-left transition-all",
                              adatMode === "berubah"
                                ? "border-primary bg-primary/10 dark:bg-primary/20"
                                : "border-border bg-background hover:border-primary/40"
                            )}
                          >
                            <p className={cn("text-sm font-semibold", adatMode === "berubah" ? "text-primary" : "text-foreground")}>
                              Adat Berubah
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                              Haid tidak menentu tiap bulan (kasus Intiqolul 'Adah)
                            </p>
                          </button>
                        </div>
                      </div>
                    )}

                    {adatMode === "tetap" && (
                      <FormField
                        control={form3.control}
                        name="kebiasaanHaidHari"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {formData.kondisiAwal === "nifas"
                                ? "Berapa hari biasanya nifas Anda? (maks. 60 hari)"
                                : "Berapa hari biasanya haid Anda? (maks. 15 hari)"}
                            </FormLabel>
                            <FormControl>
                              <Input type="number" {...field} data-testid="input-kebiasaan-hari" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {adatMode === "berubah" && (() => {
                      const hasilDeteksi = deteksiPolaDanAmbilNilai(riwayatBulan);
                      return (
                        <div className="space-y-4 animate-in fade-in duration-200">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">
                              Riwayat Durasi Haid per Bulan
                              <span className="ml-1 text-xs text-muted-foreground font-normal">(dari yang paling lama hingga terbaru)</span>
                            </p>
                            <div className="space-y-2">
                              {riwayatBulan.map((val, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Bulan {idx + 1}</span>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={15}
                                    value={val}
                                    onChange={(e) => {
                                      const v = Math.min(15, Math.max(1, parseInt(e.target.value) || 1));
                                      setRiwayatBulan((prev) => prev.map((x, i) => i === idx ? v : x));
                                    }}
                                    className="w-28 h-8 text-sm"
                                  />
                                  <span className="text-xs text-muted-foreground">hari</span>
                                  {riwayatBulan.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                      onClick={() => setRiwayatBulan((prev) => prev.filter((_, i) => i !== idx))}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs mt-1"
                              onClick={() => setRiwayatBulan((prev) => [...prev, prev[prev.length - 1] ?? 7])}
                            >
                              <Plus className="w-3.5 h-3.5" /> Tambah Data Bulan
                            </Button>
                          </div>
                          <div className={cn(
                            "rounded-xl px-4 py-3 flex items-start gap-3 text-sm border",
                            hasilDeteksi.polaDitemukan
                              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700"
                              : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700"
                          )}>
                            <RefreshCw className={cn("w-4 h-4 flex-shrink-0 mt-0.5", hasilDeteksi.polaDitemukan ? "text-emerald-600" : "text-amber-600")} />
                            <div className="space-y-0.5">
                              <p className={cn("font-semibold", hasilDeteksi.polaDitemukan ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300")}>
                                {hasilDeteksi.polaDitemukan ? "Pola Berulang Terdeteksi" : "Tidak Ada Pola Berulang"}
                              </p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{hasilDeteksi.pesan}</p>
                              <p className={cn("text-xs font-semibold mt-1", hasilDeteksi.polaDitemukan ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")}>
                                Nilai adat yang akan digunakan: <span className="text-base">{hasilDeteksi.nilai} hari</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t">
                  <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                    Kembali
                  </Button>
                  <Button type="submit" size="lg" className="rounded-full px-8 gap-2" data-testid="btn-next-3">
                    Selanjutnya <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="border-0 shadow-soft step-enter overflow-hidden rounded-3xl">
          <CardHeader className="bg-gradient-to-br from-[#E0BBE4]/25 via-purple-50/30 to-white pb-6 border-b border-purple-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(formData.statusPengalaman === "mubtadiah" ? 2 : 3)}
              className="w-fit mb-4 gap-2 -ml-3 text-muted-foreground hover:text-[#e8629e] rounded-full"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Button>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center">
                <span className="text-xl select-none">✨</span>
              </div>
              <CardTitle className="text-2xl font-extrabold">Waktu Ibadah</CardTitle>
            </div>
            <CardDescription className="font-medium">
              Bantu kami menghitung kewajiban qodlo sholatmu — jawab sesuai yang kamu ingat ya 💕
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form4}>
              <form
                onSubmit={form4.handleSubmit(onStep4Submit)}
                className="space-y-8"
                data-testid="form-step-4"
              >
                <FormField
                  control={form4.control}
                  name="isBulanPertamaIstihadloh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        {formData.kondisiAwal === "nifas"
                          ? "Apakah ini pertama kali nifas Anda melebihi 60 hari?"
                          : "Apakah ini pertama kali darah Anda keluar lebih dari 15 hari?"}
                      </FormLabel>
                      <FormDescription className="mb-3">
                        {formData.kondisiAwal === "nifas"
                          ? "Jika nifas sebelumnya pernah melebihi 60 hari dan Anda sudah tahu berapa hari nifas Anda yang sebenarnya, pilih \"Sudah Pernah\"."
                          : "Jika di bulan-bulan sebelumnya pernah terjadi hal serupa dan Anda sudah mengetahui jadwal adat atau batas darah kuat Anda, pilih \"Sudah Pernah\"."}
                      </FormDescription>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => field.onChange(true)}
                          className={`rounded-2xl border-2 p-4 text-left transition-all focus:outline-none ${
                            field.value
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-muted bg-muted/30 hover:border-primary/40"
                          }`}
                        >
                          <div className="text-sm font-semibold mb-1">Pertama Kali</div>
                          <div className="text-xs text-muted-foreground leading-snug">
                            {formData.kondisiAwal === "nifas"
                              ? "Ini pertama kali nifas saya lebih dari 60 hari — saya belum tahu berapa hari nifas saya yang sebenarnya."
                              : "Ini adalah kali pertama darah saya keluar lebih dari 15 hari — saya belum tahu kapan seharusnya berhenti."}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange(false)}
                          className={`rounded-2xl border-2 p-4 text-left transition-all focus:outline-none ${
                            !field.value
                              ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 shadow-sm"
                              : "border-muted bg-muted/30 hover:border-emerald-400"
                          }`}
                        >
                          <div className="text-sm font-semibold mb-1">Sudah Pernah</div>
                          <div className="text-xs text-muted-foreground leading-snug">
                            {formData.kondisiAwal === "nifas"
                              ? "Nifas sebelumnya sudah pernah melebihi 60 hari — saya sudah tahu berapa hari nifas saya yang sebenarnya."
                              : "Bulan sebelumnya sudah pernah terjadi — saya sudah tahu jadwal adat atau batas darah kuat saya."}
                          </div>
                        </button>
                      </div>

                      {!field.value && (
                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span>
                            {formData.kondisiAwal === "nifas"
                              ? <>Karena Anda sudah mengetahui durasi nifas yang sebenarnya, Anda <strong>langsung mandi wajib</strong> saat masa nifas berakhir — tanpa perlu menunggu 60 hari. <strong>Tidak ada hutang sholat masa penantian.</strong></>
                              : <>Karena Anda sudah mengetahui adat/batas darah, Anda <strong>langsung mandi wajib</strong> saat masa haid berakhir — tanpa perlu menunggu 15 hari. <strong>Tidak ada hutang sholat masa penantian.</strong></>}
                          </span>
                        </div>
                      )}
                      {field.value && (
                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-3 text-xs text-orange-800 dark:text-orange-300">
                          <TriangleAlert className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span>
                            {formData.kondisiAwal === "nifas"
                              ? <>Karena ini pertama kali, Anda harus menunggu 60 hari dulu untuk memastikan status nifas. Hari-hari istihadloh nifas yang terlanjur ditinggalkan tanpa ibadah akan dihitung sebagai <strong>hutang qodlo</strong>.</>
                              : <>Karena ini pertama kali, Anda harus menunggu 15 hari dulu untuk memastikan status. Hari-hari istihadloh yang terlanjur ditinggalkan tanpa ibadah akan dihitung sebagai <strong>hutang qodlo</strong>.</>}
                          </span>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <hr className="border-muted" />

                {/* Saat Darah Mulai Keluar */}
                <div className="rounded-2xl border bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 p-5 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="w-4 h-4 text-rose-600" />
                    <span className="font-semibold text-rose-700 dark:text-rose-400 text-sm">
                      Saat Darah Mulai Keluar
                    </span>
                  </div>
                  <div className="rounded-xl bg-background border px-4 py-3 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Waktu shalat (berdasarkan tanggal pertama darah)</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-rose-500" />
                      <span className="font-semibold text-rose-700 dark:text-rose-300">
                        {darahKeys.length > 0 ? formatDateId(darahKeys[0]) : "—"} —{" "}
                        {formData.waktuMulaiDarah
                          ? SHALAT_LABEL[formData.waktuMulaiDarah]
                          : "Di luar waktu shalat"}
                      </span>
                      <span className="text-xs text-muted-foreground">(dari kalender)</span>
                    </div>
                  </div>

                  <FormField
                    control={form4.control}
                    name="sudahSholatSebelumDarah"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border bg-background p-4 shadow-sm">
                        <div className="space-y-0.5 pr-4">
                          <FormLabel className="text-base">Sudah sholat sebelum darah keluar?</FormLabel>
                          <FormDescription>
                            Jika sudah sholat terlebih dahulu sebelum darah keluar, tidak ada kewajiban qodlo untuk waktu itu.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            data-testid="switch-sudah-sholat"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Saat Darah Berhenti Total */}
                <div className="rounded-2xl border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-5 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Wind className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
                      Saat Darah Berhenti Total
                    </span>
                  </div>
                  <div className="rounded-xl bg-background border px-4 py-3 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Waktu shalat (berdasarkan tanggal terakhir darah)</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        {darahKeys.length > 0 ? formatDateId(darahKeys[darahKeys.length - 1]) : "—"} —{" "}
                        {formData.waktuBerhentiTotal
                          ? SHALAT_LABEL[formData.waktuBerhentiTotal]
                          : "Di luar waktu shalat"}
                      </span>
                      <span className="text-xs text-muted-foreground">(dari kalender)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Jika berhenti di waktu Ashar atau Isya', sholat sebelumnya (Dzuhur/Maghrib) ikut wajib diqodlo.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(formData.statusPengalaman === "mubtadiah" ? 2 : 3)}
                  >
                    Kembali
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="rounded-full px-8 gap-2 btn-gradient text-white shadow-lg shadow-pink-200 hover:shadow-pink-300 hover:opacity-90 transition-all"
                    data-testid="btn-submit-calculate"
                  >
                    <Calculator className="w-4 h-4" /> Hitung Hasil
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 5 && hasil && (
        <div className="space-y-6 step-enter">

          {totalJamDarah > 0 && totalJamDarah < 24 && (
            <div className="rounded-2xl border-2 border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/40 p-5 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-start gap-3">
                <TriangleAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800 dark:text-amber-300 text-sm uppercase tracking-wide">
                    Kasus Haid Kurang dari 24 Jam
                  </p>
                  <p className="font-semibold text-amber-900 dark:text-amber-200 mt-0.5">
                    Total akumulasi darah: <span className="text-amber-700 dark:text-amber-300">{Math.round(totalJamDarah * 60)} menit</span> — Belum memenuhi syarat minimal haid
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-amber-800 dark:text-amber-300 leading-relaxed pl-8">
                <p>
                  <strong>Status hukum:</strong> Darah yang keluar secara terputus-putus dan totalnya kurang dari 24 jam (sehari semalam) <strong>tidak dihukumi sebagai haid</strong>, melainkan sebagai <strong>Istihadah (darah penyakit)</strong>.
                </p>
                <p>
                  <strong>Kewajiban ibadah:</strong> Tetap wajib melaksanakan shalat lima waktu dan puasa. Caranya: bersihkan darah, pasang pembalut/kapas, lalu berwudu setiap kali masuk waktu shalat wajib.
                </p>
                <p>
                  <strong>Masa penantian:</strong> Saat darah pertama keluar, boleh meninggalkan shalat karena ada kemungkinan darah akan berlanjut. Namun jika setelah 15 hari total darah tetap di bawah 24 jam, wajib <strong>mengqodlo seluruh shalat yang ditinggalkan</strong> selama masa keluarnya darah.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center mb-4 text-center">
            <div className="relative mb-5">
              <div className={cn(
                "w-28 h-28 rounded-[2rem] flex items-center justify-center shadow-soft",
                hasil.tipeHasil === "haidl_normal"
                  ? "bg-gradient-to-br from-rose-100 to-pink-100"
                  : hasil.tipeHasil === "nifas"
                    ? "bg-gradient-to-br from-teal-100 to-cyan-100"
                    : hasil.tipeHasil === "istihadloh"
                      ? "bg-gradient-to-br from-amber-100 to-yellow-100"
                      : "bg-gradient-to-br from-red-100 to-orange-100",
              )}>
                <span className="text-5xl select-none float-blob">
                  {hasil.tipeHasil === "error" ? "⚠️" : hasil.tipeHasil === "haidl_normal" ? "🌸" : hasil.tipeHasil === "nifas" ? "💗" : "✨"}
                </span>
              </div>
              <span className="absolute -top-2 -right-2 text-2xl select-none animate-bounce">💕</span>
            </div>
          </div>

          <Card className={cn(
            "border-0 shadow-soft overflow-hidden rounded-3xl",
            hasil.tipeHasil === "haidl_normal"
              ? "ring-2 ring-rose-200"
              : hasil.tipeHasil === "nifas"
                ? "ring-2 ring-teal-200"
                : hasil.tipeHasil === "istihadloh"
                  ? "ring-2 ring-amber-200"
                  : "ring-2 ring-red-200",
          )}>
            <CardHeader className={cn(
              "text-center pb-8 border-b",
              hasil.tipeHasil === "haidl_normal"
                ? "bg-gradient-to-br from-rose-50 to-pink-50/50"
                : hasil.tipeHasil === "nifas"
                  ? "bg-gradient-to-br from-teal-50 to-cyan-50/50"
                  : hasil.tipeHasil === "istihadloh"
                    ? "bg-gradient-to-br from-amber-50 to-yellow-50/50"
                    : "bg-gradient-to-br from-red-50 to-orange-50/50",
            )}>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold leading-tight mb-3" data-testid="hasil-kesimpulan">
                {hasil.kesimpulan}
              </CardTitle>
              {hasil.kategori && (
                <div
                  className="inline-block px-5 py-1.5 bg-white border border-pink-100 rounded-full text-sm font-semibold text-muted-foreground shadow-sm mt-1"
                  data-testid="hasil-kategori"
                >
                  {hasil.kategori}
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y">
                {hasil.hukumHaidl && (
                  <div className="p-6 sm:p-8">
                    <h3 className="text-lg font-medium mb-2 text-foreground">Hukum Haidl</h3>
                    <p className="text-muted-foreground leading-relaxed">{hasil.hukumHaidl}</p>
                  </div>
                )}

                {hasil.peringatanJedaSuci && (
                  <div className="border-l-4 border-emerald-600 dark:border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/25 p-6 sm:p-8">
                    <div className="flex items-start gap-3 mb-4">
                      <Info className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-700 dark:text-emerald-400" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-0.5">
                          Hukum Suci di Sela-sela Haid
                        </p>
                        <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
                          Darah Terputus-putus — Total{" "}
                          <span className="font-bold">{formatDurasi(hasil.peringatanJedaSuci.totalJedaJam)}</span> masa berhenti sementara
                        </h3>
                      </div>
                    </div>
                    <div className="rounded-xl bg-emerald-100/70 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 p-4 mb-5 text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed space-y-2">
                      <p>
                        Pada saat darah berhenti sementara, Anda <strong>wajib mandi besar dan melaksanakan sholat serta puasa</strong> — karena secara dzahir (tampak) Anda dihukumi <strong>suci</strong> pada hari-hari tersebut. Tindakan Anda <strong>benar secara syariat</strong> saat itu.
                      </p>
                      {hasil.peringatanJedaSuci.tipeKasus === "haidl_normal" ? (
                        <p>
                          Namun karena darah keluar kembali dan total keseluruhan (darah + masa berhenti) tidak melebihi <strong>15 hari</strong>, masa berhenti tersebut secara hukum Fiqh <strong>ditarik kembali menjadi Haid</strong> (Hukum Jam&apos;u). Konsekuensi ibadah di masa itu pun berubah:
                        </p>
                      ) : (
                        <p>
                          Namun karena masa berhenti ini jatuh <strong>di dalam jendela adat haid Anda</strong>, secara hukum Fiqh masa bersih tersebut <strong>dihukumi Haid</strong>. Konsekuensi ibadah di masa itu pun berubah:
                        </p>
                      )}
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4 mb-3">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                          Sholat — Tidak Sah, Tidak Berdosa, Tidak Perlu Qodlo
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">
                          Sholat yang Anda kerjakan di masa berhenti tersebut hukumnya <strong>tidak sah</strong> — karena ternyata masih dalam rangkaian haid. Namun Anda <strong>tidak berdosa</strong>, karena Anda menjalankan kewajiban syariat saat darah tidak terlihat. Sholat tersebut juga <strong>tidak perlu diqodlo</strong>, karena kewajiban sholat memang gugur selama masa haid.
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30 p-4">
                      <div className="flex items-start gap-3">
                        <TriangleAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                        <div className="flex-1 space-y-2">
                          <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
                            Puasa — Tidak Sah, <span className="underline decoration-wavy">Wajib Diqodlo</span>
                          </p>
                          <p className="text-sm text-foreground leading-relaxed">
                            Karena hari-hari jeda berubah status menjadi haid, puasa yang Anda kerjakan saat itu menjadi <strong>batal</strong>. Puasa tersebut wajib diganti (diqodlo), sebab Anda memang berkewajiban berpuasa saat darah tidak terlihat — namun ternyata masa itu masih dalam rangkaian haid.
                          </p>
                          {hasil.peringatanJedaSuci.qodloPuasaHari !== undefined && (
                            <div className="mt-3 flex items-center gap-4 rounded-lg bg-rose-100 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-700 px-4 py-3">
                              <div className="text-center">
                                <p className="text-3xl font-extrabold text-rose-700 dark:text-rose-300 leading-none">
                                  {hasil.peringatanJedaSuci.qodloPuasaHari}
                                </p>
                                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5">hari</p>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-rose-700 dark:text-rose-300">Wajib Qodlo Puasa</p>
                                <p className="text-xs text-rose-600/80 dark:text-rose-400/80 leading-snug mt-0.5">
                                  Ganti puasa sebanyak ini karena masa berhenti sementara ({formatDurasi(hasil.peringatanJedaSuci.totalJedaJam)}) dihukumi haid.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {hasil.hukumIstihadloh && (
                  <div className="p-6 sm:p-8">
                    <h3 className="text-lg font-medium mb-2 text-foreground">Hukum Istihadloh</h3>
                    <p className="text-muted-foreground leading-relaxed">{hasil.hukumIstihadloh}</p>
                  </div>
                )}

                {hasil.daftarSiklus && hasil.daftarSiklus.length > 0 && (
                  <div className="p-6 sm:p-8">
                    <h3 className="text-lg font-medium mb-4 text-foreground flex items-center gap-2">
                      <Info className="w-5 h-5 text-blue-500" />
                      Rincian Siklus
                    </h3>
                    <div className="space-y-3">
                      {hasil.daftarSiklus.map((siklus) => (
                        <div
                          key={siklus.nomorSiklus}
                          className={cn(
                            "rounded-xl p-4 border",
                            siklus.tipe === "haidl_normal"
                              ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                              : siklus.tipe === "istihadloh"
                                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                                : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-sm">Siklus {siklus.nomorSiklus}</span>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-semibold",
                              siklus.tipe === "haidl_normal"
                                ? "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"
                                : "bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200"
                            )}>
                              {siklus.tipe === "haidl_normal" ? "Haid Normal" : "Istihadloh"}
                            </span>
                          </div>
                          <p className="text-sm font-medium mb-1">{siklus.kesimpulan}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{siklus.hukumDetail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hasil.qodloSholatMulai && (
                  <div className="p-6 sm:p-8">
                    <h3 className="text-lg font-medium mb-2 text-foreground">Qodlo Sholat (Datangnya Darah)</h3>
                    <p className="text-muted-foreground leading-relaxed">{hasil.qodloSholatMulai}</p>
                  </div>
                )}

                {hasil.qodloSholat && (
                  <div className="p-6 sm:p-8">
                    <h3 className="text-lg font-medium mb-2 text-foreground">Qodlo Sholat (Berhentinya Darah)</h3>
                    <p className="text-muted-foreground leading-relaxed">{hasil.qodloSholat}</p>
                  </div>
                )}

                {hasil.hutangIbadah && (
                  <div className="p-6 sm:p-8 bg-orange-50/40 dark:bg-orange-950/10">
                    <h3 className="text-lg font-medium mb-2 text-foreground">Hutang Ibadah Masa Penantian</h3>
                    <p className="text-muted-foreground leading-relaxed">{hasil.hutangIbadah}</p>
                  </div>
                )}

                {hasil.aturanIbadah && (
                  <div className="p-6 sm:p-8">
                    <h3 className="text-lg font-medium mb-4 text-foreground">{hasil.aturanIbadah.judul}</h3>
                    {hasil.aturanIbadah.wajib.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Kewajiban
                        </p>
                        <ul className="space-y-2">
                          {hasil.aturanIbadah.wajib.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {hasil.aturanIbadah.haram.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4" /> Yang Dilarang
                        </p>
                        <ul className="space-y-2">
                          {hasil.aturanIbadah.haram.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {hasil.panduanBersuci && (
                  <div className="p-6 sm:p-8 bg-blue-50/40 dark:bg-blue-950/10">
                    <h3 className="text-lg font-medium mb-2 text-foreground">Panduan Bersuci Mustahadloh</h3>
                    <pre className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">
                      {hasil.panduanBersuci}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>

            {hasil.liniMasaHarian && hasil.liniMasaHarian.length > 0 && (
              <KalenderHarian
                entri={hasil.liniMasaHarian}
                kategoriStr={hasil.kategori}
                startDate={darahKeys[0]}
              />
            )}

            <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 p-6 bg-muted/10 border-t">
              <Button
                variant="outline"
                onClick={handleReset}
                className="gap-2 w-full sm:w-auto rounded-full"
                data-testid="btn-reset"
              >
                <RotateCcw className="w-4 h-4" /> Hitung Ulang
              </Button>
              <Link href="/panduan">
                <Button variant="ghost" className="gap-2 w-full sm:w-auto rounded-full">
                  Baca Panduan Lengkap
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
