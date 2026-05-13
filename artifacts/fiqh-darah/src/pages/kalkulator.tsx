import { useState } from "react";
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
  RefreshCw,
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
    kebiasaanHaidHari: z.coerce.number().min(0).max(15).optional(),
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

const WAKTU_ENUM = ["subuh", "dzuhur", "ashar", "maghrib", "isya", "tidak_tahu", ""] as const;

const step4Schema = z.object({
  isBulanPertamaIstihadloh: z.boolean().default(true),
  waktuMulaiDarah: z.enum(WAKTU_ENUM, { required_error: "Pilih waktu mulai darah" }),
  sudahSholatSebelumDarah: z.boolean().default(false),
  waktuBerhentiTotal: z.enum(WAKTU_ENUM, { required_error: "Pilih waktu berhenti" }),
});

export type StatusHariInput = "kuat" | "lemah" | "bersih";

function kalenderKePhase(harian: Record<number, StatusHariInput>): FaseItem[] {
  const keys = Object.keys(harian).map(Number).sort((a, b) => a - b);
  if (keys.length === 0) return [];

  const firstDay = keys[0];
  const lastDay = keys[keys.length - 1];
  const phases: FaseItem[] = [];
  let currentStatus: StatusHariInput | null = null;
  let currentCount = 0;

  for (let day = firstDay; day <= lastDay; day++) {
    const status: StatusHariInput = harian[day] ?? "bersih";
    if (status === currentStatus) {
      currentCount++;
    } else {
      if (currentStatus !== null && currentCount > 0) {
        if (currentStatus === "bersih") {
          phases.push({ tipe: "bersih", hari: currentCount, jam: 0 });
        } else {
          phases.push({
            tipe: "darah",
            warna: currentStatus === "kuat" ? "hitam" : "kuning",
            kental: false,
            bau: false,
            hari: currentCount,
            jam: 0,
          });
        }
      }
      currentStatus = status;
      currentCount = 1;
    }
  }
  if (currentStatus !== null && currentCount > 0) {
    if (currentStatus === "bersih") {
      phases.push({ tipe: "bersih", hari: currentCount, jam: 0 });
    } else {
      phases.push({
        tipe: "darah",
        warna: currentStatus === "kuat" ? "hitam" : "kuning",
        kental: false,
        bau: false,
        hari: currentCount,
        jam: 0,
      });
    }
  }
  return phases;
}

const STATUS_INPUT_CONFIG: Record<StatusHariInput, {
  label: string;
  singkat: string;
  bg: string;
  border: string;
  text: string;
  dot: string;
}> = {
  kuat: {
    label: "Darah Kuat",
    singkat: "K",
    bg: "bg-rose-100 dark:bg-rose-900/50",
    border: "border-rose-500 dark:border-rose-600",
    text: "text-rose-900 dark:text-rose-100",
    dot: "bg-rose-600",
  },
  lemah: {
    label: "Darah Lemah",
    singkat: "L",
    bg: "bg-amber-100 dark:bg-amber-900/50",
    border: "border-amber-500 dark:border-amber-600",
    text: "text-amber-900 dark:text-amber-100",
    dot: "bg-amber-500",
  },
  bersih: {
    label: "Bersih / Suci",
    singkat: "B",
    bg: "bg-emerald-100 dark:bg-emerald-900/50",
    border: "border-emerald-500 dark:border-emerald-600",
    text: "text-emerald-900 dark:text-emerald-100",
    dot: "bg-emerald-500",
  },
};

function KalenderInputGrid({
  harian,
  onChange,
  maxDays,
}: {
  harian: Record<number, StatusHariInput>;
  onChange: (h: Record<number, StatusHariInput>) => void;
  maxDays: number;
}) {
  const cycle = (day: number) => {
    const cur = harian[day];
    const next: StatusHariInput | undefined =
      !cur ? "kuat" : cur === "kuat" ? "lemah" : cur === "lemah" ? "bersih" : undefined;
    const updated = { ...harian };
    if (next) updated[day] = next;
    else delete updated[day];
    onChange(updated);
  };

  const keys = Object.keys(harian).map(Number);
  const firstDay = keys.length > 0 ? Math.min(...keys) : null;
  const lastDay = keys.length > 0 ? Math.max(...keys) : null;
  const totalDays = firstDay !== null && lastDay !== null ? lastDay - firstDay + 1 : 0;
  const totalDarah = keys.filter((k) => harian[k] === "kuat" || harian[k] === "lemah").length;
  const totalBersih = lastDay !== null && firstDay !== null
    ? keys.filter((k) => harian[k] === "bersih" && k >= firstDay && k <= lastDay).length
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.entries(STATUS_INPUT_CONFIG) as [StatusHariInput, typeof STATUS_INPUT_CONFIG[StatusHariInput]][]).map(([s, cfg]) => (
          <div key={s} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border-2", cfg.bg, cfg.border, cfg.text)}>
            <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
            {cfg.label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border-2 border-muted bg-muted/40 text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
          Kosong (tap 3× untuk reset)
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1" data-testid="kalender-input-grid">
        {Array.from({ length: maxDays }, (_, i) => i + 1).map((day) => {
          const s = harian[day];
          const cfg = s ? STATUS_INPUT_CONFIG[s] : null;
          const isInRange = firstDay !== null && lastDay !== null && day >= firstDay && day <= lastDay;

          return (
            <button
              key={day}
              type="button"
              onClick={() => cycle(day)}
              data-testid={`hari-input-${day}`}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg aspect-square border-2 text-center transition-all select-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                s ? cn(cfg!.bg, cfg!.border, cfg!.text, "shadow-sm") : isInRange
                  ? "bg-muted/30 border-dashed border-muted-foreground/30 text-muted-foreground/50"
                  : "bg-background border-muted/40 text-muted-foreground/40 hover:border-muted-foreground/60",
              )}
            >
              <span className="text-[9px] font-medium leading-none mb-0.5 opacity-70">{day}</span>
              <span className="text-[11px] font-bold leading-none">{s ? STATUS_INPUT_CONFIG[s].singkat : "·"}</span>
            </button>
          );
        })}
      </div>

      {firstDay !== null && lastDay !== null ? (
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-3 py-1.5">
            <span className="font-medium">Total rentang:</span>
            <span className="font-bold">{totalDays} hari</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5">
            <span className="font-medium text-rose-700 dark:text-rose-400">Darah:</span>
            <span className="font-bold text-rose-700 dark:text-rose-400">{totalDarah} hari</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5">
            <span className="font-medium text-emerald-700 dark:text-emerald-400">Bersih:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">{totalBersih} hari</span>
          </div>
          {totalDays > 15 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 px-3 py-1.5">
              <TriangleAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Melebihi 15 hari — akan dianalisis sebagai Mustahadloh</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">Ketuk kotak hari untuk mulai mencatat. Ketuk berulang untuk ganti status.</p>
      )}
    </div>
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

function KalenderHarian({ entri, kategoriStr }: { entri: EntriHarian[]; kategoriStr?: string }) {
  const [selectedHari, setSelectedHari] = useState<number | null>(null);
  const selected = selectedHari !== null ? entri.find((e) => e.hari === selectedHari) : null;
  const qodloDays = entri.filter((e) => e.wajibQodloPuasa);
  const jumlahQodlo = qodloDays.length;
  const bersihSuciDays = entri.filter((e) => e.tipe === "bersih" && e.hukum !== "haid" && e.hukum !== "ihtiyath");
  const ihtiyathDays = entri.filter((e) => e.hukum === "ihtiyath");

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

      {/* Legenda */}
      <div className="flex flex-wrap gap-2">
        {/* D merah — Darah Haid */}
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700">
          <span className="w-2 h-2 rounded-full flex-shrink-0 bg-rose-500" />
          <span className="font-bold">D</span> — Darah Haid (sholat & puasa haram)
        </div>
        {/* D kuning — Darah Istihadloh */}
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700">
          <span className="w-2 h-2 rounded-full flex-shrink-0 bg-amber-500" />
          <span className="font-bold">D</span> — Darah Istihadloh (ibadah SAH, tata cara khusus)
        </div>
        {/* Q hijau — Bersih dihukumi Haid */}
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border-green-400 dark:border-green-600">
          <span className="w-2 h-2 rounded-full flex-shrink-0 bg-green-600" />
          <span className="font-bold">Q</span> — Jeda Bersih = Haid (sholat tidak sah, puasa qodlo)
        </div>
        {/* S biru — Bersih dihukumi Suci */}
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200 border-sky-400 dark:border-sky-600">
          <span className="w-2 h-2 rounded-full flex-shrink-0 bg-sky-500" />
          <span className="font-bold">S</span> — Jeda Bersih = Suci/Istihadloh (ibadah SAH)
        </div>
        {/* I ungu — Ihtiyath */}
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200 border-violet-300 dark:border-violet-700">
          <span className="w-2 h-2 rounded-full flex-shrink-0 bg-violet-500" />
          <span className="font-bold">I</span> — Ihtiyath (masa keraguan, wajib berhati-hati)
        </div>
      </div>

      {/* Grid hari */}
      <div className="grid grid-cols-7 gap-1.5">
        {entri.map((e) => {
          const cfg = HUKUM_CONFIG[e.hukum];
          const isIhtiyath = e.hukum === "ihtiyath";
          const isBersihHaid = e.tipe === "bersih" && e.hukum === "haid";
          const isBersihSuci = e.tipe === "bersih" && !isIhtiyath && e.hukum !== "haid";
          const isSelected = selectedHari === e.hari;

          return (
            <button
              key={e.hari}
              type="button"
              onClick={() => setSelectedHari(isSelected ? null : e.hari)}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-xl border-2 aspect-square text-center cursor-pointer transition-all shadow-sm select-none",
                isBersihHaid
                  ? "bg-green-100 dark:bg-green-900/50 border-green-500 dark:border-green-500 text-green-900 dark:text-green-100"
                  : isBersihSuci
                    ? "bg-sky-100 dark:bg-sky-900/50 border-sky-400 dark:border-sky-500 text-sky-900 dark:text-sky-100"
                    : cn(cfg.bgClass, cfg.borderClass, cfg.textClass),
                isSelected && "ring-2 ring-offset-1 ring-primary scale-110 z-10",
                e.jamDiHari < 24 && "opacity-75",
              )}
              title={e.keterangan}
              data-testid={`hari-${e.hari}`}
            >
              <span className="text-[10px] font-semibold leading-none opacity-60 mb-0.5">
                {e.hari}
              </span>
              <span className="text-xs font-bold leading-none">
                {isIhtiyath ? "I" : isBersihHaid ? "Q" : isBersihSuci ? "S" : "D"}
              </span>
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

      {/* Detail hari yang dipilih */}
      {selected && (() => {
        const selIsIhtiyath = selected.hukum === "ihtiyath";
        const selIsBersihHaid = selected.tipe === "bersih" && selected.hukum === "haid";
        const selIsBersihSuci = selected.tipe === "bersih" && !selIsIhtiyath && selected.hukum !== "haid";
        return (
          <div className={cn(
            "rounded-xl border-2 p-4 transition-all",
            selIsBersihHaid
              ? "bg-green-50 dark:bg-green-950/30 border-green-400 dark:border-green-600"
              : selIsBersihSuci
                ? "bg-sky-50 dark:bg-sky-950/30 border-sky-400 dark:border-sky-600"
                : cn(HUKUM_CONFIG[selected.hukum].bgClass, HUKUM_CONFIG[selected.hukum].borderClass),
          )}>
            <div className="flex items-center gap-2 mb-2">
              {selected.tipe === "bersih" ? (
                <Wind className={cn("w-4 h-4",
                  selIsBersihHaid ? "text-green-600" : selIsIhtiyath ? "text-violet-500" : "text-sky-500"
                )} />
              ) : (
                <Droplets className={cn("w-4 h-4", selIsIhtiyath ? "text-violet-500" : "text-rose-600")} />
              )}
              <span className="font-bold text-sm">
                Hari ke-{selected.hari}
                {selected.jamDiHari < 24 && <span className="font-normal text-xs ml-1 opacity-70">({selected.jamDiHari} jam)</span>}
              </span>
              <span className={cn(
                "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full",
                selIsBersihHaid
                  ? "bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100"
                  : selIsBersihSuci
                    ? "bg-sky-200 dark:bg-sky-800 text-sky-900 dark:text-sky-100"
                    : cn(HUKUM_CONFIG[selected.hukum].bgClass, HUKUM_CONFIG[selected.hukum].textClass),
              )}>
                {selIsBersihHaid
                  ? "Jeda Bersih → Haid (Q)"
                  : selIsBersihSuci
                    ? "Jeda Bersih → Suci/Istihadloh (S)"
                    : selIsIhtiyath
                      ? `${selected.tipe === "bersih" ? "Bersih" : "Darah"} — Ihtiyath (I)`
                      : `Darah — ${HUKUM_CONFIG[selected.hukum].label} (D)`}
              </span>
            </div>
            <p className="text-sm leading-relaxed">{selected.keterangan}</p>
            {selected.warnaAsli && (
              <p className="text-xs mt-1 opacity-70">Warna darah: {selected.warnaAsli}</p>
            )}
            {/* Status ibadah ringkas — hanya untuk hari bersih */}
            {selected.tipe === "bersih" && (
              <div className={cn(
                "mt-3 rounded-lg px-3 py-2 text-xs font-medium flex items-start gap-2",
                selIsBersihHaid
                  ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"
                  : selIsIhtiyath
                    ? "bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300"
                    : "bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300",
              )}>
                {selIsBersihHaid ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-0.5" />
                    <span>Sholat wajib dikerjakan namun <strong>TIDAK SAH</strong> — tidak perlu qodlo &nbsp;|&nbsp; Puasa <strong>TIDAK SAH — wajib diqodlo</strong></span>
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

      {/* ═══════════════ KUMPULAN QODLO PUASA ═══════════════ */}
      {jumlahQodlo > 0 && (
        <div className="rounded-2xl border-2 border-green-400 dark:border-green-600 overflow-hidden">
          {/* Header badge */}
          <div className="flex items-center gap-4 bg-green-600 dark:bg-green-700 px-5 py-4">
            <div className="text-center flex-shrink-0">
              <p className="text-3xl font-extrabold text-white leading-none">{jumlahQodlo}</p>
              <p className="text-xs font-semibold text-green-100 mt-0.5">hari</p>
            </div>
            <div>
              <p className="text-base font-bold text-white">Kumpulan Qodlo Puasa</p>
              <p className="text-xs text-green-100 mt-0.5 leading-snug">
                Hari-hari bersih yang secara hukum dihukumi Haid — puasa wajib diqodlo
              </p>
            </div>
          </div>

          {/* Penjelasan konteks */}
          <div className="bg-green-50 dark:bg-green-950/40 px-5 py-3 border-b border-green-200 dark:border-green-800">
            <p className="text-xs text-green-800 dark:text-green-300 leading-relaxed">
              {kategoriStr
                ? <>Berdasarkan profil <strong>{kategoriStr}</strong>, hari-hari berikut Anda catat &lsquo;Bersih&rsquo; namun secara hukum fiqh tetap dihukumi HAID.</>
                : "Hari-hari berikut Anda catat 'Bersih' namun secara hukum fiqh tetap dihukumi HAID."}{" "}
              Di hari-hari tersebut: sholat wajib dikerjakan (karena tampak suci secara dzahir) namun{" "}
              <strong>TIDAK SAH</strong> — tidak perlu diqodlo.{" "}
              <strong>Puasa TIDAK SAH dan wajib diqodlo.</strong>
            </p>
          </div>

          {/* Daftar hari */}
          <div className="divide-y divide-green-100 dark:divide-green-900/50 bg-white dark:bg-green-950/20">
            {qodloDays.map((e) => (
              <div
                key={e.hari}
                className="flex gap-4 px-5 py-4"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 dark:bg-green-700 flex items-center justify-center shadow-sm">
                  <span className="text-sm font-extrabold text-white leading-none">{e.hari}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-green-900 dark:text-green-100 mb-0.5">
                    Hari ke-{e.hari}{e.jamDiHari < 24 ? ` (${e.jamDiHari} jam)` : ""} — Bersih dihukumi HAID
                  </p>
                  <p className="text-xs text-green-800 dark:text-green-300 leading-relaxed">
                    {e.keterangan}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-green-700 dark:text-green-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-600 dark:bg-green-400" />
                    Puasa hari ini wajib diqodlo
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer ringkasan */}
          <div className="bg-green-50 dark:bg-green-950/40 px-5 py-3 border-t border-green-200 dark:border-green-800">
            <p className="text-xs text-green-700 dark:text-green-400">
              <strong>Catatan:</strong> Sholat yang Anda kerjakan di hari-hari tersebut wajib dilakukan (karena tampak suci secara dzahir) namun <strong>TIDAK SAH</strong> secara hukum — tidak perlu diqodlo. Yang wajib diqodlo adalah <strong>puasanya</strong> (jika bertepatan dengan bulan Ramadhan atau puasa wajib lainnya).
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════ HARI BERSIH DIHUKUMI SUCI ═══════════════ */}
      {bersihSuciDays.length > 0 && (
        <div className="rounded-2xl border-2 border-sky-400 dark:border-sky-600 overflow-hidden">
          {/* Header badge */}
          <div className="flex items-center gap-4 bg-sky-500 dark:bg-sky-700 px-5 py-4">
            <div className="text-center flex-shrink-0">
              <p className="text-3xl font-extrabold text-white leading-none">{bersihSuciDays.length}</p>
              <p className="text-xs font-semibold text-sky-100 mt-0.5">hari</p>
            </div>
            <div>
              <p className="text-base font-bold text-white">Hari Bersih Dihukumi Suci / Istihadloh</p>
              <p className="text-xs text-sky-100 mt-0.5 leading-snug">
                Ibadah SAH — tidak ada kewajiban qodlo
              </p>
            </div>
          </div>

          {/* Penjelasan konteks */}
          <div className="bg-sky-50 dark:bg-sky-950/40 px-5 py-3 border-b border-sky-200 dark:border-sky-800">
            <p className="text-xs text-sky-800 dark:text-sky-300 leading-relaxed">
              {kategoriStr
                ? <>Berdasarkan profil <strong>{kategoriStr}</strong>, hari-hari berikut Anda catat &lsquo;Bersih&rsquo; dan secara hukum fiqh dihukumi <strong>Suci / Istihadloh</strong>.</>
                : "Hari-hari berikut Anda catat 'Bersih' dan secara hukum fiqh dihukumi Suci / Istihadloh."}{" "}
              Di hari-hari tersebut: <strong>sholat SAH</strong> dan <strong>puasa SAH</strong>. Tidak ada kewajiban qodlo.
            </p>
          </div>

          {/* Daftar hari */}
          <div className="divide-y divide-sky-100 dark:divide-sky-900/50 bg-white dark:bg-sky-950/20">
            {bersihSuciDays.map((e) => (
              <div key={e.hari} className="flex gap-4 px-5 py-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sky-500 dark:bg-sky-700 flex items-center justify-center shadow-sm">
                  <span className="text-sm font-extrabold text-white leading-none">{e.hari}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-sky-900 dark:text-sky-100 mb-0.5">
                    Hari ke-{e.hari}{e.jamDiHari < 24 ? ` (${e.jamDiHari} jam)` : ""} — Bersih dihukumi {e.hukum === "ihtiyath" ? "Ihtiyath" : "Suci/Istihadloh"}
                  </p>
                  <p className="text-xs text-sky-800 dark:text-sky-300 leading-relaxed">
                    {e.keterangan}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 dark:text-sky-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400" />
                    Sholat SAH — Puasa SAH — tidak perlu qodlo
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-sky-50 dark:bg-sky-950/40 px-5 py-3 border-t border-sky-200 dark:border-sky-800">
            <p className="text-xs text-sky-700 dark:text-sky-400">
              <strong>Catatan:</strong> Pada hari-hari ini Anda dihukumi <strong>Suci</strong>. Sholat dan puasa yang Anda kerjakan <strong>SAH</strong> secara hukum. Jika Anda Mustahadloh, gunakan tata cara bersuci Mustahadloh (wudhu tiap waktu sholat).
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════ HARI IHTIYATH ═══════════════ */}
      {ihtiyathDays.length > 0 && (
        <div className="rounded-2xl border-2 border-violet-400 dark:border-violet-600 overflow-hidden">
          <div className="flex items-center gap-4 bg-violet-600 dark:bg-violet-800 px-5 py-4">
            <div className="text-center flex-shrink-0">
              <p className="text-3xl font-extrabold text-white leading-none">{ihtiyathDays.length}</p>
              <p className="text-xs font-semibold text-violet-100 mt-0.5">hari</p>
            </div>
            <div>
              <p className="text-base font-bold text-white">Hari Ihtiyath (Masa Keraguan)</p>
              <p className="text-xs text-violet-100 mt-0.5 leading-snug">
                Wajib sholat & puasa, mandi besar tiap waktu sholat
              </p>
            </div>
          </div>
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
                    Hari ke-{e.hari}{e.jamDiHari < 24 ? ` (${e.jamDiHari} jam)` : ""} — {e.tipe === "bersih" ? "Bersih" : "Darah"} Ihtiyath
                  </p>
                  <p className="text-xs text-violet-800 dark:text-violet-300 leading-relaxed">
                    {e.keterangan}
                  </p>
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
        </div>
      )}
    </div>
  );
}

export default function Kalkulator() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<InputUser>>({});
  const [hasil, setHasil] = useState<HasilAnalisis | null>(null);
  const [harianInput, setHarianInput] = useState<Record<number, StatusHariInput>>({});
  const [kalMaxDays, setKalMaxDays] = useState<30 | 60>(30);
  const [step2Error, setStep2Error] = useState<string | null>(null);

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
      waktuMulaiDarah: formData.waktuMulaiDarah || "",
      sudahSholatSebelumDarah: formData.sudahSholatSebelumDarah ?? false,
      waktuBerhentiTotal: formData.waktuBerhentiTotal || "",
    },
  });

  const onStep1Submit = (data: z.infer<typeof step1Schema>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const onStep2Submit = () => {
    setStep2Error(null);
    const keys = Object.keys(harianInput).map(Number);
    const hasDarah = keys.some((k) => harianInput[k] === "kuat" || harianInput[k] === "lemah");
    if (!hasDarah) {
      setStep2Error("Tandai minimal 1 hari darah (Kuat atau Lemah) pada kalender.");
      return;
    }
    const converted = kalenderKePhase(harianInput);
    setFormData((prev) => ({ ...prev, daftarFase: converted }));
    if (formData.statusPengalaman === "mubtadiah") {
      setStep(4);
    } else {
      setStep(3);
    }
  };

  const onStep3Submit = (data: z.infer<typeof step3Schema>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(4);
  };

  const onStep4Submit = (data: z.infer<typeof step4Schema>) => {
    try {
      const toWaktu = (v: string): InputUser["waktuBerhentiTotal"] =>
        (v === "tidak_tahu" ? "" : v) as InputUser["waktuBerhentiTotal"];

      const finalData: InputUser = {
        usiaTahun: formData.usiaTahun ?? 9,
        kondisiAwal: formData.kondisiAwal ?? "haidl",
        statusPengalaman: formData.statusPengalaman ?? "mubtadiah",
        ingatKebiasaan: formData.ingatKebiasaan ?? "lupa_semua",
        kebiasaanHaidHari: parseFloat(String(formData.kebiasaanHaidHari ?? 0)) || 0,
        daftarFase: formData.daftarFase ?? [],
        isBulanPertamaIstihadloh: data.isBulanPertamaIstihadloh ?? true,
        waktuMulaiDarah: toWaktu(data.waktuMulaiDarah),
        sudahSholatSebelumDarah: data.sudahSholatSebelumDarah ?? false,
        waktuBerhentiTotal: toWaktu(data.waktuBerhentiTotal),
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
    setHarianInput({});
    setKalMaxDays(30);
    setStep2Error(null);
    form1.reset({ usiaTahun: 9, kondisiAwal: "haidl", statusPengalaman: "mubtadiah" });
    form3.reset({ ingatKebiasaan: "ingat_semua", kebiasaanHaidHari: 7 });
    form4.reset({ isBulanPertamaIstihadloh: true, waktuMulaiDarah: "", sudahSholatSebelumDarah: false, waktuBerhentiTotal: "" });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 w-full">
      {step < 5 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Langkah {step} dari 4
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round((step / 4) * 100)}%
            </span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <Card className="border-0 shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-primary/5 pb-6">
            <CardTitle className="text-2xl font-serif">Data Dasar</CardTitle>
            <CardDescription>
              Informasi umum mengenai kondisi Anda saat ini.
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
                        <Input
                          type="number"
                          {...field}
                          data-testid="input-usia"
                        />
                      </FormControl>
                      <FormDescription>
                        Menurut penanggalan Hijriyah.
                      </FormDescription>
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
                      <div
                        className="grid sm:grid-cols-2 gap-4"
                        data-testid="radio-kondisi"
                      >
                        {(["haidl", "nifas"] as const).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => field.onChange(val)}
                            data-testid={`radio-kondisi-${val}`}
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all text-left w-full",
                              field.value === val
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-primary/50",
                            )}
                          >
                            <div
                              className={cn(
                                "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                                field.value === val
                                  ? "border-primary"
                                  : "border-muted-foreground",
                              )}
                            >
                              {field.value === val && (
                                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                              )}
                            </div>
                            <span className="font-medium">
                              {val === "haidl"
                                ? "Haidl (Biasa)"
                                : "Nifas (Setelah Melahirkan)"}
                            </span>
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
                      <FormLabel>Status Pengalaman Haid</FormLabel>
                      <div
                        className="grid sm:grid-cols-2 gap-4"
                        data-testid="radio-pengalaman"
                      >
                        {(
                          [
                            {
                              val: "mubtadiah",
                              label: "Mubtadi'ah",
                              desc: "Baru pertama kali mengalami haid.",
                            },
                            {
                              val: "mutadah",
                              label: "Mu'tadah",
                              desc: "Sudah pernah haid dan suci sebelumnya.",
                            },
                          ] as const
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
                              <div
                                className={cn(
                                  "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                                  field.value === val
                                    ? "border-primary"
                                    : "border-muted-foreground",
                                )}
                              >
                                {field.value === val && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                )}
                              </div>
                              <span className="font-medium">{label}</span>
                            </div>
                            <span className="text-sm text-muted-foreground pl-8">
                              {desc}
                            </span>
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    className="rounded-full px-8 gap-2"
                    data-testid="btn-next-1"
                  >
                    Selanjutnya <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-0 shadow-md animate-in fade-in slide-in-from-right-8 duration-300">
          <CardHeader className="bg-primary/5 pb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(1)}
              className="w-fit mb-4 gap-2 -ml-3 text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Button>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-serif">
                  Kalender Darah
                </CardTitle>
                <CardDescription className="mt-1">
                  Ketuk setiap kotak untuk menandai status hari. Ketuk berulang untuk ganti status, ketuk 3× untuk hapus.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-shrink-0 gap-1.5"
                onClick={() => setKalMaxDays(kalMaxDays === 30 ? 60 : 30)}
              >
                {kalMaxDays === 30 ? "30" : "60"} hari
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-800 dark:text-blue-300">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Tandai setiap hari mulai dari hari pertama darah keluar.
                Hari bersih di antara dua hari darah akan dianalisis sesuai kategori Mustahadloh.
                Masa bersih <strong>≥ 15 hari</strong> berturut-turut memutus siklus haid.
              </p>
            </div>

            <KalenderInputGrid
              harian={harianInput}
              onChange={setHarianInput}
              maxDays={kalMaxDays}
            />

            {step2Error && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {step2Error}
              </div>
            )}

            <div className="rounded-xl border border-muted bg-muted/20 p-4 text-xs text-muted-foreground space-y-1.5">
              <p className="font-semibold text-foreground text-sm">Panduan Singkat</p>
              <div className="grid sm:grid-cols-2 gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-rose-500 flex-shrink-0" />
                  <span><strong>Darah Kuat (K)</strong> — ciri khas: hitam, kental, berbau</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-amber-500 flex-shrink-0" />
                  <span><strong>Darah Lemah (L)</strong> — ciri khas: kuning, encer, tidak berbau</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 flex-shrink-0" />
                  <span><strong>Bersih (B)</strong> — jeda bersih di antara hari-hari darah</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-muted border border-dashed border-muted-foreground/30 flex-shrink-0" />
                  <span><strong>Kosong</strong> — hari di luar rentang (diabaikan)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(1)}
              >
                Kembali
              </Button>
              <div className="flex items-center gap-3">
                {Object.keys(harianInput).length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground gap-1.5"
                    onClick={() => { setHarianInput({}); setStep2Error(null); }}
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
        <Card className="border-0 shadow-md animate-in fade-in slide-in-from-right-8 duration-300">
          <CardHeader className="bg-primary/5 pb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(2)}
              className="w-fit mb-4 gap-2 -ml-3 text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Button>
            <CardTitle className="text-2xl font-serif">
              Kebiasaan Haid
            </CardTitle>
            <CardDescription>
              Informasi mengenai siklus haid Anda sebelumnya (Adat).
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
                        Seberapa baik Anda mengingat kebiasaan haid
                        sebelumnya?
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-ingat-kebiasaan">
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ingat_semua">
                            Ingat semua (Tanggal mulai dan Jumlah hari)
                          </SelectItem>
                          <SelectItem value="ingat_durasi">
                            Hanya ingat jumlah hari (Durasi)
                          </SelectItem>
                          <SelectItem value="ingat_waktu">
                            Hanya ingat kapan mulai (Waktu/Tanggal)
                          </SelectItem>
                          <SelectItem value="lupa_semua">
                            Lupa semuanya (Waktu dan Durasi)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(form3.watch("ingatKebiasaan") === "ingat_semua" ||
                  form3.watch("ingatKebiasaan") === "ingat_durasi") && (
                  <FormField
                    control={form3.control}
                    name="kebiasaanHaidHari"
                    render={({ field }) => (
                      <FormItem className="animate-in fade-in zoom-in-95 duration-300">
                        <FormLabel>Berapa hari biasanya haid Anda?</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            data-testid="input-kebiasaan-hari"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(2)}
                  >
                    Kembali
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="rounded-full px-8 gap-2"
                    data-testid="btn-next-3"
                  >
                    Selanjutnya <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="border-0 shadow-md animate-in fade-in slide-in-from-right-8 duration-300">
          <CardHeader className="bg-primary/5 pb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setStep(formData.statusPengalaman === "mubtadiah" ? 2 : 3)
              }
              className="w-fit mb-4 gap-2 -ml-3 text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Button>
            <CardTitle className="text-2xl font-serif">
              Waktu Sholat & Qodlo
            </CardTitle>
            <CardDescription>
              Untuk menghitung kewajiban qodlo sholat akibat datang dan berhentinya haid.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form4}>
              <form
                onSubmit={form4.handleSubmit(onStep4Submit)}
                className="space-y-8"
                data-testid="form-step-4"
              >
                {/* ── Bagian 0: Status Bulan Istihadloh ── */}
                <FormField
                  control={form4.control}
                  name="isBulanPertamaIstihadloh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        Apakah ini pertama kali darah Anda keluar lebih dari 15 hari?
                      </FormLabel>
                      <FormDescription className="mb-3">
                        Jika di bulan-bulan sebelumnya pernah terjadi hal serupa dan Anda sudah mengetahui jadwal adat atau batas darah kuat Anda, pilih "Sudah Pernah".
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
                          <div className="text-sm font-semibold mb-1">
                            Pertama Kali
                          </div>
                          <div className="text-xs text-muted-foreground leading-snug">
                            Ini adalah kali pertama darah saya keluar lebih dari 15 hari — saya belum tahu kapan seharusnya berhenti.
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
                          <div className="text-sm font-semibold mb-1">
                            Sudah Pernah
                          </div>
                          <div className="text-xs text-muted-foreground leading-snug">
                            Bulan sebelumnya sudah pernah terjadi — saya sudah tahu jadwal adat atau batas darah kuat saya.
                          </div>
                        </button>
                      </div>

                      {!field.value && (
                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span>
                            Karena Anda sudah mengetahui adat/batas darah, Anda <strong>langsung mandi wajib</strong> saat masa haid berakhir — tanpa perlu menunggu 15 hari. <strong>Tidak ada hutang sholat masa penantian.</strong>
                          </span>
                        </div>
                      )}
                      {field.value && (
                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-3 text-xs text-orange-800 dark:text-orange-300">
                          <TriangleAlert className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span>
                            Karena ini pertama kali, Anda harus menunggu 15 hari dulu untuk memastikan status. Hari-hari istihadloh yang terlanjur ditinggalkan tanpa ibadah akan dihitung sebagai <strong>hutang qodlo</strong>.
                          </span>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <hr className="border-muted" />

                {/* ── Bagian 1: Datangnya Haid ── */}
                <div className="rounded-2xl border bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 p-5 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="w-4 h-4 text-rose-600" />
                    <span className="font-semibold text-rose-700 dark:text-rose-400 text-sm">
                      Saat Darah Mulai Keluar
                    </span>
                  </div>

                  <FormField
                    control={form4.control}
                    name="waktuMulaiDarah"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Darah pertama keluar pada waktu sholat apa?</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-waktu-mulai">
                              <SelectValue placeholder="Pilih waktu" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="subuh">Subuh</SelectItem>
                            <SelectItem value="dzuhur">Dzuhur</SelectItem>
                            <SelectItem value="ashar">Ashar</SelectItem>
                            <SelectItem value="maghrib">Maghrib</SelectItem>
                            <SelectItem value="isya">Isya'</SelectItem>
                            <SelectItem value="tidak_tahu">Tidak tahu / Tidak pasti</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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

                {/* ── Bagian 2: Berhentinya Haid ── */}
                <div className="rounded-2xl border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-5 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Wind className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
                      Saat Darah Berhenti Total
                    </span>
                  </div>

                  <FormField
                    control={form4.control}
                    name="waktuBerhentiTotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Darah dipastikan berhenti total (bersih) pada waktu sholat apa?
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-waktu-berhenti">
                              <SelectValue placeholder="Pilih waktu" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="subuh">Subuh</SelectItem>
                            <SelectItem value="dzuhur">Dzuhur</SelectItem>
                            <SelectItem value="ashar">Ashar</SelectItem>
                            <SelectItem value="maghrib">Maghrib</SelectItem>
                            <SelectItem value="isya">Isya'</SelectItem>
                            <SelectItem value="tidak_tahu">Tidak tahu / Tidak pasti</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Pilih waktu saat kapas/pembalut sudah bersih tanpa noda. Jika berhenti di Ashar atau Isya', sholat sebelumnya (Dzuhur/Maghrib) ikut wajib diqodlo.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setStep(formData.statusPengalaman === "mubtadiah" ? 2 : 3)
                    }
                  >
                    Kembali
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="rounded-full px-8 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
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
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex justify-center mb-6">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center shadow-lg",
                hasil.tipeHasil === "haidl_normal"
                  ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  : hasil.tipeHasil === "nifas"
                    ? "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
                    : hasil.tipeHasil === "istihadloh"
                      ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
              )}
            >
              {hasil.tipeHasil === "error" ? (
                <AlertCircle className="w-10 h-10" />
              ) : (
                <Droplets className="w-10 h-10" />
              )}
            </div>
          </div>

          <Card
            className={cn(
              "border-t-4 shadow-md overflow-hidden",
              hasil.tipeHasil === "haidl_normal"
                ? "border-t-green-500"
                : hasil.tipeHasil === "nifas"
                  ? "border-t-teal-500"
                  : hasil.tipeHasil === "istihadloh"
                    ? "border-t-amber-500"
                    : "border-t-red-500",
            )}
          >
            <CardHeader className="text-center pb-8 border-b bg-muted/20">
              <CardTitle
                className="text-3xl font-serif leading-tight mb-2"
                data-testid="hasil-kesimpulan"
              >
                {hasil.kesimpulan}
              </CardTitle>
              {hasil.kategori && (
                <div
                  className="inline-block px-3 py-1 bg-background border rounded-full text-sm font-medium text-muted-foreground shadow-sm mt-2"
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
                    <h3 className="text-lg font-medium mb-2 text-foreground">
                      Hukum Haidl
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {hasil.hukumHaidl}
                    </p>
                  </div>
                )}

                {hasil.peringatanJedaSuci && (
                  <div className="border-l-4 border-emerald-600 dark:border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/25 p-6 sm:p-8">
                    {/* Header */}
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

                    {/* Penjelasan kewajiban dzahir — berbeda untuk Hukum Jam'u vs Istihadloh */}
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

                    {/* Konsekuensi Sholat */}
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

                    {/* Konsekuensi Puasa + Counter Qodlo */}
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
                    <h3 className="text-lg font-medium mb-2 text-foreground">
                      Hukum Istihadloh
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {hasil.hukumIstihadloh}
                    </p>
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
                              ? "border-green-200 bg-green-50/60 dark:border-green-800 dark:bg-green-950/20"
                              : "border-amber-200 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20",
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-sm">
                              Siklus {siklus.nomorSiklus}
                            </span>
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-semibold",
                                siklus.tipe === "haidl_normal"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
                              )}
                            >
                              {siklus.tipe === "haidl_normal"
                                ? "HAIDL"
                                : "ISTIHADLOH"}
                            </span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              Total: {formatDurasi(siklus.totalJamSiklus)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {siklus.hukumDetail}
                          </p>
                          {siklus.bersihDalamJam > 0 && siklus.tipe === "haidl_normal" && (
                            <div className="mt-2 flex items-start gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                              <Wind className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                              <span>
                                Masa bersih {formatDurasi(siklus.bersihDalamJam)} di dalam siklus ini dihitung sebagai haid (Hukum Jam&apos;u — total ≤ 15 hari)
                              </span>
                            </div>
                          )}
                          {siklus.bersihDalamJam > 0 && siklus.tipe === "istihadloh" && (
                            <div className="mt-2 flex items-start gap-1.5 text-xs text-sky-700 dark:text-sky-400">
                              <Wind className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                              <span>
                                Masa bersih {formatDurasi(siklus.bersihDalamJam)} ditemukan dalam siklus ini — hukumnya ditentukan berdasarkan kategori Mustahadloh (lihat kalender harian)
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {hasil.adaPemisahBersih && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-700 dark:text-blue-400">
                        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>
                          Siklus-siklus di atas dipisahkan oleh masa suci 15 hari atau lebih, sehingga masing-masing dihitung sebagai siklus haid yang berdiri sendiri.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {hasil.liniMasaHarian && hasil.liniMasaHarian.length > 0 && (
                  <KalenderHarian entri={hasil.liniMasaHarian} kategoriStr={hasil.kategori || undefined} />
                )}

                {hasil.qodloSholatMulai && (
                  <div className="p-6 sm:p-8 bg-rose-50/50 dark:bg-rose-950/20">
                    <h3 className="text-lg font-medium mb-2 text-rose-700 dark:text-rose-400 flex items-center gap-2">
                      <Droplets className="w-5 h-5" />
                      Qodlo Sholat — Sebab Datangnya Haid
                    </h3>
                    <p className="text-foreground leading-relaxed">
                      {hasil.qodloSholatMulai}
                    </p>
                  </div>
                )}

                {hasil.qodloSholat && (
                  <div className="p-6 sm:p-8 bg-primary/5">
                    <h3 className="text-lg font-medium mb-2 text-primary flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Qodlo Sholat — Sebab Berhentinya Haid
                    </h3>
                    <p className="font-medium text-foreground">
                      {hasil.qodloSholat}
                    </p>
                  </div>
                )}

                {hasil.hutangIbadah && (
                  <div className="p-6 sm:p-8 bg-orange-50/60 dark:bg-orange-950/20 border-l-4 border-orange-400">
                    <h3 className="text-lg font-medium mb-3 text-orange-700 dark:text-orange-400 flex items-center gap-2">
                      <TriangleAlert className="w-5 h-5" />
                      Hutang Ibadah Masa Penantian
                    </h3>
                    <p className="text-foreground leading-relaxed">
                      {hasil.hutangIbadah}
                    </p>
                  </div>
                )}

                {hasil.aturanIbadah && (
                  <div className="p-6 sm:p-8 bg-violet-50/60 dark:bg-violet-950/20 border-l-4 border-violet-400">
                    <h3 className="text-lg font-medium mb-4 text-violet-800 dark:text-violet-300 flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      {hasil.aturanIbadah.judul}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">
                          Wajib / Kewajiban
                        </p>
                        <ul className="space-y-2">
                          {hasil.aturanIbadah.wajib.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground leading-relaxed">
                              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {hasil.aturanIbadah.haram.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wide mb-2">
                            Haram / Larangan
                          </p>
                          <ul className="space-y-2">
                            {hasil.aturanIbadah.haram.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-foreground leading-relaxed">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {hasil.panduanBersuci && (
                  <div className="p-6 sm:p-8 bg-amber-50/50 dark:bg-amber-950/20">
                    <h3 className="text-lg font-medium mb-4 text-amber-800 dark:text-amber-500">
                      Panduan Bersuci
                    </h3>
                    <div className="whitespace-pre-wrap text-sm text-amber-900/80 dark:text-amber-200/80 leading-relaxed font-medium">
                      {hasil.panduanBersuci}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-8">
            <Button
              onClick={handleReset}
              variant="outline"
              size="lg"
              className="rounded-full px-8 gap-2"
              data-testid="btn-reset"
            >
              <RotateCcw className="w-4 h-4" /> Hitung Ulang
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
