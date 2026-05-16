import { useState, useEffect } from "react";
import { X, Plus, Trash2, Save, RefreshCw, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAdminConfig,
  saveAdminConfig,
  resetAdminConfig,
  type AdminConfig,
  type Banner,
  DEFAULT_CONFIG,
} from "@/lib/adminConfig";

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

type Tab = "banners" | "branding" | "tips" | "toggles";

export function AdminPanel({ open, onClose }: AdminPanelProps) {
  const [config, setConfig] = useState<AdminConfig>(getAdminConfig);
  const [activeTab, setActiveTab] = useState<Tab>("banners");
  const [saved, setSaved] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);

  useEffect(() => {
    if (open) setConfig(getAdminConfig());
  }, [open]);

  const handleSave = () => {
    saveAdminConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Apply branding immediately
    applyBranding(config);
  };

  const handleReset = () => {
    if (window.confirm("Reset semua konfigurasi admin ke default?")) {
      resetAdminConfig();
      setConfig({ ...DEFAULT_CONFIG });
      applyBranding(DEFAULT_CONFIG);
    }
  };

  if (!open) return null;

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: "banners", label: "Banner", emoji: "🖼️" },
    { id: "branding", label: "Branding", emoji: "🎨" },
    { id: "tips", label: "Tips", emoji: "💡" },
    { id: "toggles", label: "Fitur", emoji: "⚙️" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mt-auto w-full bg-white rounded-t-[32px] max-h-[92vh] flex flex-col shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h2 className="font-display text-lg font-bold text-gray-900">⚡ Admin Panel</h2>
            <p className="text-xs text-gray-400">God Mode — Hanya untuk administrator</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-5 py-3 overflow-x-auto border-b border-gray-100">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                activeTab === t.id
                  ? "bg-[#be185d] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <span>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── BANNERS TAB ── */}
          {activeTab === "banners" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-600">Kelola banner slide di beranda</p>
                <button
                  type="button"
                  onClick={() => setEditBanner({ id: generateId(), emoji: "🌸", title: "Banner Baru", desc: "Deskripsi", bg: "#be185d", link: "/panduan" })}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#be185d] text-white text-xs font-bold"
                >
                  <Plus className="w-3 h-3" /> Tambah
                </button>
              </div>

              {editBanner && (
                <div className="bg-[#fffaf1] rounded-2xl p-4 border border-[#ffccd5] space-y-3">
                  <p className="text-xs font-bold text-[#be185d]">
                    {config.banners.find(b => b.id === editBanner.id) ? "Edit Banner" : "Banner Baru"}
                  </p>
                  {[
                    { key: "emoji" as const, label: "Emoji", placeholder: "🌸" },
                    { key: "title" as const, label: "Judul", placeholder: "Judul banner" },
                    { key: "desc" as const, label: "Deskripsi", placeholder: "Deskripsi singkat" },
                    { key: "bg" as const, label: "Warna BG (hex)", placeholder: "#be185d" },
                    { key: "link" as const, label: "Link", placeholder: "/panduan" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">{label}</label>
                      <input
                        type="text"
                        value={editBanner[key]}
                        onChange={e => setEditBanner(prev => prev ? { ...prev, [key]: e.target.value } : null)}
                        placeholder={placeholder}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#be185d]"
                      />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!editBanner) return;
                        setConfig(prev => {
                          const exists = prev.banners.find(b => b.id === editBanner.id);
                          const banners = exists
                            ? prev.banners.map(b => b.id === editBanner.id ? editBanner : b)
                            : [...prev.banners, editBanner];
                          return { ...prev, banners };
                        });
                        setEditBanner(null);
                      }}
                      className="flex-1 h-9 rounded-xl bg-[#be185d] text-white text-xs font-bold"
                    >
                      Simpan Banner
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditBanner(null)}
                      className="h-9 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-500"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {config.banners.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: b.bg }}>
                    {b.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{b.title}</p>
                    <p className="text-[10px] text-gray-500 truncate">{b.desc}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditBanner(b)}
                      className="p-2 rounded-xl hover:bg-gray-200 text-gray-500 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, banners: prev.banners.filter(x => x.id !== b.id) }))}
                      className="p-2 rounded-xl hover:bg-red-50 text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── BRANDING TAB ── */}
          {activeTab === "branding" && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-600">Ubah tampilan visual aplikasi secara global</p>
              {[
                { key: "primaryColor" as const, label: "Warna Utama (Primary)", type: "color", placeholder: "#be185d" },
                { key: "fontFamily" as const, label: "Font Family", type: "text", placeholder: "Inter" },
                { key: "borderRadius" as const, label: "Border Radius", type: "text", placeholder: "28px" },
                { key: "logoUrl" as const, label: "URL Logo (opsional)", type: "text", placeholder: "https://..." },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">{label}</label>
                  <div className="flex gap-2 items-center">
                    {type === "color" && (
                      <input
                        type="color"
                        value={config.branding[key]}
                        onChange={e => setConfig(prev => ({ ...prev, branding: { ...prev.branding, [key]: e.target.value } }))}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-gray-200"
                      />
                    )}
                    <input
                      type="text"
                      value={config.branding[key]}
                      onChange={e => setConfig(prev => ({ ...prev, branding: { ...prev.branding, [key]: e.target.value } }))}
                      placeholder={placeholder}
                      className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#be185d]"
                    />
                  </div>
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">PIN Admin (default: 1234)</label>
                <input
                  type="password"
                  value={config.pin}
                  onChange={e => setConfig(prev => ({ ...prev, pin: e.target.value }))}
                  placeholder="****"
                  maxLength={8}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#be185d]"
                />
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-700">
                ⚠️ Tekan "Simpan & Terapkan" untuk mengaktifkan perubahan branding secara langsung.
              </div>
            </div>
          )}

          {/* ── TIPS TAB ── */}
          {activeTab === "tips" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-600">Tips harian di halaman beranda</p>
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, tips: [...prev.tips, "Tip baru..."] }))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#be185d] text-white text-xs font-bold"
                >
                  <Plus className="w-3 h-3" /> Tambah
                </button>
              </div>
              {config.tips.map((tip, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <textarea
                    value={tip}
                    onChange={e => setConfig(prev => ({ ...prev, tips: prev.tips.map((t, j) => j === i ? e.target.value : t) }))}
                    rows={2}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#be185d] resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, tips: prev.tips.filter((_, j) => j !== i) }))}
                    className="p-2 rounded-xl hover:bg-red-50 text-red-400 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── TOGGLES TAB ── */}
          {activeTab === "toggles" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-600">Aktifkan atau nonaktifkan fitur tertentu</p>
              {[
                { key: "bannerEnabled" as const, label: "🖼️ Banner Slider di Beranda", desc: "Tampilkan banner panduan fiqh" },
                { key: "aiQuestionsEnabled" as const, label: "✨ Pertanyaan Cepat", desc: "Pill pertanyaan di beranda" },
                { key: "profilEnabled" as const, label: "👤 Halaman Profil", desc: "Akses halaman profil pengguna" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="text-xs font-bold text-gray-800">{label}</p>
                    <p className="text-[10px] text-gray-500">{desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, featureToggles: { ...prev.featureToggles, [key]: !prev.featureToggles[key] } }))}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-all duration-200",
                      config.featureToggles[key] ? "bg-[#be185d]" : "bg-gray-300"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200",
                      config.featureToggles[key] ? "left-6" : "left-0.5"
                    )} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 h-11 px-4 rounded-2xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Default
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl text-sm font-bold text-white transition-all",
              saved ? "bg-emerald-500" : "bg-[#be185d]"
            )}
          >
            <Save className="w-4 h-4" />
            {saved ? "✓ Tersimpan & Diterapkan!" : "Simpan & Terapkan"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function applyBranding(config: AdminConfig) {
  const root = document.documentElement;
  const color = config.branding.primaryColor;
  // Convert hex to HSL for CSS vars
  const hex = color.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  h = Math.round(((h * 60) + 360) % 360);
  const sl = Math.round(s * 100);
  const ll = Math.round(l * 100);
  root.style.setProperty("--primary", `${h} ${sl}% ${ll}%`);
  root.style.setProperty("--ring", `${h} ${sl}% ${ll}%`);
  root.style.setProperty("--radius", config.branding.borderRadius.replace("px", "") + "px" === config.branding.borderRadius
    ? `${parseInt(config.branding.borderRadius) / 16}rem`
    : config.branding.borderRadius.includes("rem") ? config.branding.borderRadius : "1.75rem"
  );
  if (config.branding.fontFamily) {
    document.body.style.fontFamily = `'${config.branding.fontFamily}', ui-sans-serif, system-ui, sans-serif`;
  }
}

export function PinModal({ onSuccess, config }: { onSuccess: () => void; config: AdminConfig }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleDigit = (d: string) => {
    const next = (pin + d).slice(0, 4);
    setPin(next);
    setError(false);
    if (next.length === 4) {
      if (next === config.pin) {
        onSuccess();
      } else {
        setError(true);
        setTimeout(() => setPin(""), 600);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-[32px] p-8 w-72 flex flex-col items-center gap-6 shadow-2xl">
        <div className="text-center">
          <div className="text-4xl mb-2">🔐</div>
          <h3 className="font-display text-lg font-bold text-gray-800">Admin Mode</h3>
          <p className="text-xs text-gray-400 mt-1">Masukkan PIN untuk lanjut</p>
        </div>
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={cn(
              "w-4 h-4 rounded-full border-2 transition-all",
              pin.length > i
                ? error ? "bg-red-400 border-red-400" : "bg-[#be185d] border-[#be185d]"
                : "bg-transparent border-gray-300"
            )} />
          ))}
        </div>
        {error && <p className="text-xs text-red-500 -mt-4">PIN salah, coba lagi</p>}
        <div className="grid grid-cols-3 gap-3 w-full">
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
            d === "" ? <div key={i} /> :
            <button
              key={d + i}
              type="button"
              onClick={() => d === "⌫" ? setPin(p => p.slice(0, -1)) : handleDigit(d)}
              className="h-12 rounded-2xl bg-gray-50 text-gray-800 font-bold text-lg hover:bg-[#ffccd5] active:scale-95 transition-all"
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
