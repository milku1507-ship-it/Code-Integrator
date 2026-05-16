import { useState, useEffect } from "react";
import { User, Calendar, Clock, Download, Trash2, BookOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfilData {
  nama: string;
  tanggalLahir: string;
  status: "mubtadiah" | "mutadah";
  haidDuration: string;
  suciDuration: string;
}

const DEFAULT_PROFIL: ProfilData = {
  nama: "",
  tanggalLahir: "",
  status: "mutadah",
  haidDuration: "",
  suciDuration: "",
};

const STORAGE_KEY = "fiqh-profil";

function loadProfil(): ProfilData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFIL;
    return { ...DEFAULT_PROFIL, ...JSON.parse(raw) };
  } catch { return DEFAULT_PROFIL; }
}

function saveProfil(data: ProfilData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getKalkulatorSummary() {
  try {
    const raw = localStorage.getItem("fiqh-last-result");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function getAllData() {
  const profil = loadProfil();
  const adminConfig = localStorage.getItem("fiqh-admin-config");
  const lastResult = localStorage.getItem("fiqh-last-result");
  return { profil, adminConfig, lastResult };
}

export default function Profil() {
  const [data, setData] = useState<ProfilData>(loadProfil);
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const summary = getKalkulatorSummary();

  const handleChange = (field: keyof ProfilData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveProfil(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const lines = [
      "== LAPORAN FIQH DARAH ==",
      `Nama       : ${data.nama || "-"}`,
      `Tgl Lahir  : ${data.tanggalLahir || "-"}`,
      `Status     : ${data.status === "mubtadiah" ? "Mubtadi'ah (Pemula)" : "Mu'tadah (Berpengalaman)"}`,
      data.status === "mutadah" ? `Adat Haidl : ${data.haidDuration || "-"} hari` : "",
      data.status === "mutadah" ? `Adat Suci  : ${data.suciDuration || "-"} hari` : "",
      "",
      "== RINGKASAN IBADAH ==",
      summary ? `Hasil Terakhir: ${summary.statusHaidl ?? "-"}` : "Belum ada hasil kalkulator.",
      summary?.qodloSholat ? `Hutang Qodlo Sholat: ${summary.qodloSholat} waktu` : "",
      summary?.qodloPuasa ? `Hutang Qodlo Puasa: ${summary.qodloPuasa} hari` : "",
      "",
      `Diekspor: ${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
    ].filter(Boolean).join("\n");

    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-fiqh-darah-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (!showReset) { setShowReset(true); return; }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("fiqh-last-result");
    setData(DEFAULT_PROFIL);
    setShowReset(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#fffaf1] step-enter pb-4">

      {/* ── Header ── */}
      <div className="bg-white px-5 pt-6 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-[24px] bg-[#ffccd5] flex items-center justify-center shadow-card flex-shrink-0">
            <span className="text-3xl">🧕</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl font-bold text-gray-800 leading-tight">
              {data.nama || "Profil Saya"}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {data.status === "mubtadiah" ? "Mubtadi'ah — Pemula" : "Mu'tadah — Berpengalaman"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 px-5 pt-5 overflow-y-auto">

        {/* ── Identitas Fiqh ── */}
        <section className="bg-white rounded-[28px] p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-[#be185d]" />
            <h2 className="font-display text-sm font-bold text-gray-800">Identitas Fiqh</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Nama</label>
              <input
                type="text"
                value={data.nama}
                onChange={e => handleChange("nama", e.target.value)}
                placeholder="Nama lengkap..."
                className="w-full h-11 px-4 rounded-2xl border border-gray-200 bg-[#fffaf1] text-sm font-medium focus:outline-none focus:border-[#be185d] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Tanggal Lahir</label>
              <input
                type="date"
                value={data.tanggalLahir}
                onChange={e => handleChange("tanggalLahir", e.target.value)}
                className="w-full h-11 px-4 rounded-2xl border border-gray-200 bg-[#fffaf1] text-sm font-medium focus:outline-none focus:border-[#be185d] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-2">Status Fiqh</label>
              <div className="grid grid-cols-2 gap-2">
                {(["mubtadiah", "mutadah"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleChange("status", s)}
                    className={cn(
                      "h-12 rounded-2xl border-2 text-xs font-bold transition-all",
                      data.status === s
                        ? "border-[#be185d] bg-[#ffccd5]/30 text-[#be185d]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    )}
                  >
                    {s === "mubtadiah" ? "🌱 Mubtadi'ah" : "🌸 Mu'tadah"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Data Adat (Mu'tadah only) ── */}
        {data.status === "mutadah" && (
          <section className="bg-white rounded-[28px] p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-[#be185d]" />
              <h2 className="font-display text-sm font-bold text-gray-800">Data Adat Kebiasaan</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Riwayat haidl dan suci terakhir digunakan sebagai basis perhitungan algoritma.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Lama Haidl (hari)</label>
                <input
                  type="number"
                  value={data.haidDuration}
                  onChange={e => handleChange("haidDuration", e.target.value)}
                  placeholder="Contoh: 7"
                  min="1" max="15"
                  className="w-full h-11 px-4 rounded-2xl border border-gray-200 bg-[#fffaf1] text-sm font-medium focus:outline-none focus:border-[#be185d]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Lama Suci (hari)</label>
                <input
                  type="number"
                  value={data.suciDuration}
                  onChange={e => handleChange("suciDuration", e.target.value)}
                  placeholder="Contoh: 21"
                  min="15"
                  className="w-full h-11 px-4 rounded-2xl border border-gray-200 bg-[#fffaf1] text-sm font-medium focus:outline-none focus:border-[#be185d]"
                />
              </div>
            </div>
          </section>
        )}

        {/* ── Ringkasan Ibadah ── */}
        <section className="bg-white rounded-[28px] p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-[#be185d]" />
            <h2 className="font-display text-sm font-bold text-gray-800">Ringkasan Ibadah</h2>
          </div>
          {summary ? (
            <div className="space-y-3">
              {summary.statusHaidl && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#fffaf1] border border-[#ffccd5]">
                  <span className="text-xs font-semibold text-gray-600">Status Terakhir</span>
                  <span className="text-xs font-bold text-[#be185d]">{summary.statusHaidl}</span>
                </div>
              )}
              {summary.qodloSholat != null && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-100">
                  <span className="text-xs font-semibold text-gray-600">🕌 Hutang Sholat</span>
                  <span className="text-xs font-bold text-amber-700">{summary.qodloSholat} waktu</span>
                </div>
              )}
              {summary.qodloPuasa != null && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <span className="text-xs font-semibold text-gray-600">🌙 Hutang Puasa</span>
                  <span className="text-xs font-bold text-emerald-700">{summary.qodloPuasa} hari</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <Sparkles className="w-8 h-8 text-gray-300" />
              <p className="text-xs text-gray-500 text-center">Belum ada hasil kalkulator.<br/>Lengkapi kalkulator untuk melihat ringkasan ibadah.</p>
              <a href="/kalkulator" className="text-xs text-[#be185d] font-bold mt-1">→ Buka Kalkulator</a>
            </div>
          )}
        </section>

        {/* ── Simpan ── */}
        <button
          type="button"
          onClick={handleSave}
          className={cn(
            "w-full h-12 rounded-full font-bold text-sm transition-all",
            saved
              ? "bg-emerald-500 text-white"
              : "btn-gradient text-white shadow-md active:scale-[0.98]"
          )}
        >
          {saved ? "✓ Tersimpan!" : "Simpan Profil"}
        </button>

        {/* ── Data Control ── */}
        <section className="bg-white rounded-[28px] p-5 shadow-card">
          <h2 className="font-display text-sm font-bold text-gray-800 mb-4">Manajemen Data</h2>
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleExport}
              className="w-full flex items-center gap-3 h-12 px-4 rounded-2xl border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              <Download className="w-4 h-4 text-[#be185d]" />
              <span className="text-sm font-semibold text-gray-700">Export Laporan (.txt)</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className={cn(
                "w-full flex items-center gap-3 h-12 px-4 rounded-2xl border transition-all active:scale-[0.98]",
                showReset
                  ? "border-red-400 bg-red-50 text-red-600"
                  : "border-gray-200 hover:bg-gray-50 text-gray-600"
              )}
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {showReset ? "⚠️ Ketuk lagi untuk konfirmasi reset" : "Reset Seluruh Data"}
              </span>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
