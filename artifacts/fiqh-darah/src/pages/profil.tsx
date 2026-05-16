import { useState } from "react";
import { Settings, Download, Trash2, BookOpen, Sparkles, ChevronRight, FileText } from "lucide-react";
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

function LaurelWreath() {
  return (
    <div className="flex items-center justify-center gap-1 mb-1">
      <svg width="40" height="48" viewBox="0 0 40 48" fill="none">
        <path d="M36 42 C30 36 26 28 28 18 M28 18 C26 22 24 26 20 28" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M36 42 C34 38 30 32 32 24" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="28" cy="18" r="3.5" fill="#E5E7EB"/>
        <circle cx="33" cy="26" r="3" fill="#E5E7EB"/>
        <circle cx="36" cy="34" r="2.5" fill="#E5E7EB"/>
        <circle cx="35" cy="40" r="2" fill="#E5E7EB"/>
        <path d="M28 42 C22 36 22 28 20 20" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="20" cy="20" r="3" fill="#E5E7EB"/>
      </svg>

      {/* Avatar */}
      <div className="w-20 h-20 rounded-[22px] bg-[#EDE9FE] flex items-center justify-center shadow-card mx-1">
        <span className="text-4xl">🧕</span>
      </div>

      <svg width="40" height="48" viewBox="0 0 40 48" fill="none" style={{ transform: "scaleX(-1)" }}>
        <path d="M36 42 C30 36 26 28 28 18 M28 18 C26 22 24 26 20 28" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M36 42 C34 38 30 32 32 24" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="28" cy="18" r="3.5" fill="#E5E7EB"/>
        <circle cx="33" cy="26" r="3" fill="#E5E7EB"/>
        <circle cx="36" cy="34" r="2.5" fill="#E5E7EB"/>
        <circle cx="35" cy="40" r="2" fill="#E5E7EB"/>
        <path d="M28 42 C22 36 22 28 20 20" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="20" cy="20" r="3" fill="#E5E7EB"/>
      </svg>
    </div>
  );
}

export default function Profil() {
  const [data, setData] = useState<ProfilData>(loadProfil);
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const summary = getKalkulatorSummary();

  const handleChange = (field: keyof ProfilData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveProfil(data);
    setSaved(true);
    setShowEdit(false);
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
    <div className="flex-1 flex flex-col bg-[#F5F5FA] step-enter pb-4">

      {/* ── Header with Settings ── */}
      <div className="bg-white px-5 pt-4 pb-0 flex justify-end">
        <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
          <Settings className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* ── Avatar + Identity — Clover centered profile ── */}
      <div className="bg-white px-5 pt-2 pb-6 flex flex-col items-center">
        <LaurelWreath />
        <h1 className="font-display text-lg font-bold text-gray-800 mt-2 text-center">
          {data.nama || "Pengguna Fiqh Darah"}
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {data.status === "mubtadiah" ? "Mubtadi'ah — Pemula" : "Mu'tadah — Berpengalaman"}
        </p>
        <button
          onClick={() => setShowEdit(!showEdit)}
          className="mt-3 px-6 h-8 rounded-full border border-gray-300 text-xs font-semibold text-gray-600 active:scale-[0.97] transition-all"
        >
          Edit Profil
        </button>
      </div>

      {/* ── Upgrade Banner — Clover style ── */}
      <div className="mx-4 mt-3 rounded-2xl banner-upgrade px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm">🔒</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-bold leading-tight">Data tersimpan lokal di perangkat Anda</p>
          <p className="text-white/80 text-[11px] mt-0.5">Privasi terjaga — tidak ada data dikirim ke server</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 px-4 pt-3 overflow-y-auto">

        {/* ── STATISTIK — Clover 2-column style ── */}
        <div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Statistik</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-card">
              <p className="text-[10px] text-gray-500 leading-tight">Adat Haidl</p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {data.haidDuration ? `${data.haidDuration} hari` : "—"}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-card">
              <p className="text-[10px] text-gray-500 leading-tight">Adat Suci</p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {data.suciDuration ? `${data.suciDuration} hari` : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Laporan Card — Clover teal style ── */}
        <button
          type="button"
          onClick={handleExport}
          className="w-full rounded-2xl bg-[#E0F7FA] border border-[#B2EBF2] px-4 py-3.5 flex items-center gap-3 shadow-card active:scale-[0.98] transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-[#00BCD4] flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-gray-800">Laporan untuk ustadzah / dokter</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Export ringkasan data Anda</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>

        {/* ── TREN SIKLUS / Ringkasan Ibadah ── */}
        <div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Ringkasan Ibadah</p>
          <div className="bg-white rounded-2xl p-4 shadow-card">
            {summary ? (
              <div className="space-y-2.5">
                {summary.statusHaidl && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Status Terakhir</span>
                    <span className="text-xs font-bold text-[#6C63FF]">{summary.statusHaidl}</span>
                  </div>
                )}
                {summary.qodloSholat != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">🕌 Hutang Sholat</span>
                    <span className="text-xs font-bold text-amber-600">{summary.qodloSholat} waktu</span>
                  </div>
                )}
                {summary.qodloPuasa != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">🌙 Hutang Puasa</span>
                    <span className="text-xs font-bold text-emerald-600">{summary.qodloPuasa} hari</span>
                  </div>
                )}
                {!summary.statusHaidl && summary.qodloSholat == null && summary.qodloPuasa == null && (
                  <p className="text-xs text-gray-400 text-center py-2">Belum ada ringkasan tersedia</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-3">
                <Sparkles className="w-7 h-7 text-gray-300" />
                <p className="text-xs text-gray-500 text-center">Belum ada hasil kalkulator.<br/>Lengkapi kalkulator untuk melihat ringkasan ibadah.</p>
                <a href="/kalkulator" className="text-xs text-[#6C63FF] font-bold mt-1">→ Buka Kalkulator</a>
              </div>
            )}
          </div>
        </div>

        {/* ── Edit Form (collapsed by default) ── */}
        {showEdit && (
          <div className="bg-white rounded-2xl p-4 shadow-card space-y-3">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Identitas Fiqh</p>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Nama</label>
              <input
                type="text"
                value={data.nama}
                onChange={e => handleChange("nama", e.target.value)}
                placeholder="Nama lengkap..."
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:border-[#6C63FF] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Tanggal Lahir</label>
              <input
                type="date"
                value={data.tanggalLahir}
                onChange={e => handleChange("tanggalLahir", e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:border-[#6C63FF] transition-colors"
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
                      "h-11 rounded-xl border-2 text-xs font-bold transition-all",
                      data.status === s
                        ? "border-[#6C63FF] bg-[#EDE9FE]/40 text-[#6C63FF]"
                        : "border-gray-200 text-gray-500"
                    )}
                  >
                    {s === "mubtadiah" ? "🌱 Mubtadi'ah" : "🌸 Mu'tadah"}
                  </button>
                ))}
              </div>
            </div>

            {data.status === "mutadah" && (
              <>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">Lama Haidl (hari)</label>
                  <input
                    type="number"
                    value={data.haidDuration}
                    onChange={e => handleChange("haidDuration", e.target.value)}
                    placeholder="Contoh: 7"
                    min="1" max="15"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:border-[#6C63FF]"
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
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:border-[#6C63FF]"
                  />
                </div>
              </>
            )}

            <button
              type="button"
              onClick={handleSave}
              className={cn(
                "w-full h-11 rounded-full font-bold text-sm transition-all",
                saved
                  ? "bg-emerald-500 text-white"
                  : "btn-gradient text-white shadow-md active:scale-[0.98]"
              )}
            >
              {saved ? "✓ Tersimpan!" : "Simpan Profil"}
            </button>
          </div>
        )}

        {/* ── Reset Data ── */}
        <button
          type="button"
          onClick={handleReset}
          className={cn(
            "w-full flex items-center gap-3 h-11 px-4 rounded-2xl border transition-all active:scale-[0.98]",
            showReset
              ? "border-red-300 bg-red-50 text-red-600"
              : "border-gray-200 bg-white text-gray-500"
          )}
        >
          <Trash2 className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-semibold">
            {showReset ? "⚠️ Ketuk lagi untuk konfirmasi reset" : "Reset Seluruh Data"}
          </span>
        </button>

      </div>
    </div>
  );
}
