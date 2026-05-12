export type WarnaDarah = "hitam" | "merah" | "merah kekuningan" | "kuning" | "keruh";
export type KondisiAwal = "haidl" | "nifas";
export type StatusPengalaman = "mubtadiah" | "mutadah";
export type IngatKebiasaan = "ingat_semua" | "lupa_semua" | "ingat_durasi" | "ingat_waktu";
export type WaktuBerhenti = "subuh" | "dzuhur" | "ashar" | "maghrib" | "isya" | "";

export interface FaseDarah {
  warna: WarnaDarah;
  kental: boolean;
  bau: boolean;
  hari: number;
  jam: number;
}

export interface InputUser {
  usiaTahun: number;
  kondisiAwal: KondisiAwal;
  daftarFaseDarah: FaseDarah[];
  statusPengalaman: StatusPengalaman;
  ingatKebiasaan: IngatKebiasaan;
  kebiasaanHaidHari: number;
  waktuBerhentiTotal: WaktuBerhenti;
}

export interface HasilAnalisis {
  kesimpulan: string;
  kategori: string;
  hukumHaidl: string;
  hukumIstihadloh: string;
  qodloSholat: string;
  panduanBersuci: string;
  tipeHasil: "haidl_normal" | "nifas" | "istihadloh" | "error";
}

function skorWarnaSifat(fase: FaseDarah): number {
  const hierarki: Record<WarnaDarah, number> = {
    hitam: 5,
    merah: 4,
    "merah kekuningan": 3,
    kuning: 2,
    keruh: 1,
  };
  let skor = hierarki[fase.warna] ?? 0;
  if (fase.kental) skor += 1;
  if (fase.bau) skor += 1;
  return skor;
}

function jamKeFaseDarah(fase: FaseDarah): number {
  return (fase.jam || 0) + (fase.hari || 0) * 24;
}

function formatDurasi(jam: number): string {
  const hari = jam / 24;
  if (jam % 24 === 0) return `${hari} hari`;
  return `${hari.toFixed(1)} hari (${jam} jam)`;
}

function kalkQodloSholat(waktu: WaktuBerhenti): string {
  if (!waktu) return "";
  const map: Record<string, string> = {
    ashar: "Wajib mengqodlo sholat DZUHUR dan ASHAR (karena bisa di-jama').",
    isya: "Wajib mengqodlo sholat MAGHRIB dan ISYA' (karena bisa di-jama').",
    subuh: "Wajib mengqodlo sholat SUBUH.",
    dzuhur: "Wajib mengqodlo sholat DZUHUR.",
    maghrib: "Wajib mengqodlo sholat MAGHRIB.",
  };
  return map[waktu] ?? "";
}

const PANDUAN_BERSUCI = `Tata Cara Bersuci bagi Wanita Mustahadloh:
1. Bersihkan farji dari najis darah yang keluar, lalu sumbat dengan kapas/pembalut.
2. Wudlu dilakukan SETELAH masuk waktu sholat.
3. Niat wudlu: "Niat berwudlu agar diperbolehkan melaksanakan sholat" (Istibahah — bukan menghilangkan hadats).
4. Segera laksanakan sholat setelah wudlu (Muwalah — tidak boleh terputus).
*PENTING: Satu rangkaian bersuci ini HANYA berlaku untuk 1 kali sholat fardlu.`;

function tentukanKategoriMushtadloh(
  statusPengalaman: StatusPengalaman,
  isTamyiz: boolean,
  ingatKebiasaan: IngatKebiasaan,
  kebiasaanHari: number,
  kuatJam: number,
  lemahJam: number
): { kategori: string; hukum: string } {
  const kuatLabel = formatDurasi(kuatJam);
  const lemahLabel = formatDurasi(lemahJam);

  if (statusPengalaman === "mubtadiah") {
    if (isTamyiz) {
      return {
        kategori: "Mubtadi'ah Mumayyizah (Golongan 1)",
        hukum: `${kuatLabel} darah kuat adalah HAIDL. ${lemahLabel} darah lemah adalah ISTIHADLOH.`,
      };
    } else {
      return {
        kategori: "Mubtadi'ah Ghoiru Mumayyizah (Golongan 2)",
        hukum: "1 Hari 1 Malam (24 jam) pertama dihukumi HAIDL. Sisanya dihukumi ISTIHADLOH.",
      };
    }
  } else {
    if (isTamyiz) {
      return {
        kategori: "Mu'tadah Mumayyizah (Golongan 3)",
        hukum: `${kuatLabel} darah kuat adalah HAIDL. ${lemahLabel} darah lemah adalah ISTIHADLOH.`,
      };
    } else {
      if (ingatKebiasaan === "ingat_semua") {
        return {
          kategori: "Mu'tadah Ghoiru Mumayyizah — Dzakiroh Li'adatiha Qodran wa Waqtan (Golongan 4)",
          hukum: `Dikembalikan ke adat lama. ${kebiasaanHari} hari pertama adalah HAIDL. Sisanya adalah ISTIHADLOH.`,
        };
      } else if (ingatKebiasaan === "lupa_semua") {
        return {
          kategori: "Mu'tadah Mutahayyiroh / Nasiyah (Golongan 5)",
          hukum: "Keadaan membingungkan. Wajib ihtiyat (berhati-hati). Wajib mandi setiap akan sholat fardlu. Haram membaca Al-Qur'an di luar sholat.",
        };
      } else if (ingatKebiasaan === "ingat_durasi") {
        return {
          kategori: "Mu'tadah Ghoiru Mumayyizah — Ingat Durasi, Lupa Waktu (Golongan 6)",
          hukum: `Haidl sejumlah ${kebiasaanHari} hari, namun karena lupa tanggal mulainya, hari yang diyakini harus diteliti lebih lanjut.`,
        };
      } else {
        return {
          kategori: "Mu'tadah Ghoiru Mumayyizah — Ingat Waktu, Lupa Durasi (Golongan 7)",
          hukum: "Waktu yang diyakini biasa mulai haidl adalah HAIDL. Waktu yang diyakini suci adalah ISTIHADLOH.",
        };
      }
    }
  }
}

export function jalankanMesinFiqh(input: InputUser): HasilAnalisis {
  const {
    usiaTahun,
    kondisiAwal,
    daftarFaseDarah,
    statusPengalaman,
    ingatKebiasaan,
    kebiasaanHaidHari,
    waktuBerhentiTotal,
  } = input;

  // 1. Konversi semua durasi ke jam untuk akurasi
  const totalJam = daftarFaseDarah.reduce((sum, f) => sum + jamKeFaseDarah(f), 0);
  const totalHariFloat = totalJam / 24;

  // 2. Cek usia minimal (9 Tahun Qomariyah)
  if (usiaTahun < 9 && kondisiAwal !== "nifas") {
    return {
      kesimpulan: "Darah Istihadloh (Darah Penyakit)",
      kategori: "",
      hukumHaidl: "",
      hukumIstihadloh: `Usia belum mencapai batas minimal 9 tahun Qomariyah. Total darah: ${totalJam} jam.`,
      qodloSholat: "",
      panduanBersuci: "",
      tipeHasil: "error",
    };
  }

  // 3. Deteksi Nifas (maks 60 hari = 1440 jam)
  if (kondisiAwal === "nifas") {
    if (totalJam <= 1440) {
      return {
        kesimpulan: `Semua darah (${formatDurasi(totalJam)}) adalah NIFAS`,
        kategori: "Nifas Normal",
        hukumHaidl: "",
        hukumIstihadloh: "",
        qodloSholat: kalkQodloSholat(waktuBerhentiTotal),
        panduanBersuci: "",
        tipeHasil: "nifas",
      };
    } else {
      return {
        kesimpulan: "Istihadloh Nifas (darah melebihi 60 hari)",
        kategori: "Nifas Istihadloh",
        hukumHaidl: "",
        hukumIstihadloh: "Darah melampaui 60 hari. Hukum dikembalikan pada adat nifas sebelumnya atau setetes darah pertama.",
        qodloSholat: "",
        panduanBersuci: PANDUAN_BERSUCI,
        tipeHasil: "istihadloh",
      };
    }
  }

  // 4. Deteksi Haidl Normal (min 24 jam, maks 360 jam / 15 hari)
  if (totalJam < 24) {
    return {
      kesimpulan: "Darah Istihadloh",
      kategori: "",
      hukumHaidl: "",
      hukumIstihadloh: `Total darah baru ${totalJam} jam — kurang dari syarat minimal 24 jam (1 hari 1 malam).`,
      qodloSholat: "",
      panduanBersuci: "",
      tipeHasil: "error",
    };
  }

  if (totalJam >= 24 && totalJam <= 360) {
    return {
      kesimpulan: `Semua darah (${formatDurasi(totalJam)}) adalah HAIDL`,
      kategori: "Haidl Normal",
      hukumHaidl: `Durasi ${formatDurasi(totalJam)} memenuhi syarat haidl (minimal 24 jam, maksimal 15 hari / 360 jam).`,
      hukumIstihadloh: "",
      qodloSholat: kalkQodloSholat(waktuBerhentiTotal),
      panduanBersuci: "",
      tipeHasil: "haidl_normal",
    };
  }

  // 5. Istihadloh (> 360 jam) — Analisis Tamyiz berbasis jam
  let isTamyiz = false;
  let kuatJam = 0;
  let lemahJam = 0;

  if (daftarFaseDarah.length >= 2) {
    const fase1 = daftarFaseDarah[0];
    const fase2 = daftarFaseDarah[1];
    const skor1 = skorWarnaSifat(fase1);
    const skor2 = skorWarnaSifat(fase2);
    const jam1 = jamKeFaseDarah(fase1);

    if (skor1 > skor2 && jam1 >= 24 && jam1 <= 360) {
      kuatJam = jam1;
      lemahJam = totalJam - kuatJam;

      // Cek apakah ada fase ke-3 yang lebih kuat (atau sama kuatnya) dengan fase 1
      let adaFase3Kuat = false;
      if (daftarFaseDarah.length > 2) {
        const skor3 = skorWarnaSifat(daftarFaseDarah[2]);
        if (skor3 >= skor1) adaFase3Kuat = true;
      }

      // Syarat darah lemah >= 15 hari HANYA berlaku jika diselingi darah kuat lagi
      if (adaFase3Kuat && lemahJam < 360) {
        isTamyiz = false;
      } else {
        isTamyiz = true;
      }
    }
  } else {
    lemahJam = totalJam;
  }

  const { kategori, hukum } = tentukanKategoriMushtadloh(
    statusPengalaman,
    isTamyiz,
    ingatKebiasaan,
    kebiasaanHaidHari,
    kuatJam,
    lemahJam
  );

  return {
    kesimpulan: `Darah Istihadloh (total ${formatDurasi(totalJam)} — melebihi batas maksimal haid 15 hari)`,
    kategori,
    hukumHaidl: "",
    hukumIstihadloh: hukum,
    qodloSholat: kalkQodloSholat(waktuBerhentiTotal),
    panduanBersuci: PANDUAN_BERSUCI,
    tipeHasil: "istihadloh",
  };
}
