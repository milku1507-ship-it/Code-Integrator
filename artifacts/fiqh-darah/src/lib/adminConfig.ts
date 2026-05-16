export interface Banner {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  bg: string;
  link: string;
}

export interface AdminConfig {
  pin: string;
  banners: Banner[];
  branding: {
    primaryColor: string;
    fontFamily: string;
    borderRadius: string;
    logoUrl: string;
  };
  tips: string[];
  featureToggles: {
    bannerEnabled: boolean;
    aiQuestionsEnabled: boolean;
    profilEnabled: boolean;
  };
}

export const DEFAULT_CONFIG: AdminConfig = {
  pin: "1234",
  banners: [
    { id: "1", emoji: "🌙", title: "Panduan Haidl", desc: "Aturan lengkap fiqh Syafi'i", bg: "#7c3aed", link: "/panduan" },
    { id: "2", emoji: "📿", title: "Sholat & Ibadah", desc: "Hukum sholat saat haidl", bg: "#6C63FF", link: "/panduan" },
    { id: "3", emoji: "💧", title: "Panduan Nifas", desc: "Hukum setelah melahirkan", bg: "#0e7490", link: "/panduan" },
    { id: "4", emoji: "✨", title: "7 Golongan Wanita", desc: "Kamu termasuk golongan mana?", bg: "#b45309", link: "/panduan" },
    { id: "5", emoji: "🕌", title: "Qodlo Sholat", desc: "Hitung hutang sholatmu", bg: "#065f46", link: "/panduan" },
    { id: "6", emoji: "🩺", title: "Istihadloh", desc: "Darah penyakit & hukumnya", bg: "#9f1239", link: "/panduan" },
  ],
  branding: {
    primaryColor: "#6C63FF",
    fontFamily: "Inter",
    borderRadius: "28px",
    logoUrl: "",
  },
  tips: [
    "Haidl minimum 1 hari 1 malam, maksimum 15 hari 15 malam.",
    "Nifas maksimum 60 hari. Lebih dari itu dianggap istihadloh.",
    "Warna hitam adalah darah terkuat menurut fiqh Syafi'i.",
    "Darah keruh setelah masa suci termasuk darah haidl.",
    "Bersih total antara dua haidl minimal 15 hari.",
  ],
  featureToggles: {
    bannerEnabled: true,
    aiQuestionsEnabled: true,
    profilEnabled: true,
  },
};

const STORAGE_KEY = "fiqh-admin-config";

export function getAdminConfig(): AdminConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw) as Partial<AdminConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      banners: parsed.banners ?? DEFAULT_CONFIG.banners,
      branding: { ...DEFAULT_CONFIG.branding, ...(parsed.branding ?? {}) },
      tips: parsed.tips ?? DEFAULT_CONFIG.tips,
      featureToggles: { ...DEFAULT_CONFIG.featureToggles, ...(parsed.featureToggles ?? {}) },
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveAdminConfig(config: AdminConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function resetAdminConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}
