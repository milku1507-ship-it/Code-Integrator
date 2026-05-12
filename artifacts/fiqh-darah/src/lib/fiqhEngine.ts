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

function skorWarnaSifat(warna: WarnaDarah, kental: boolean, bau: boolean): number {
  const hierarki: Record<WarnaDarah, number> = {
    hitam: 5,
    merah: 4,
    "merah kekuningan": 3,
    kuning: 2,
    keruh: 1,
  };
  let skor = hierarki[warna] ?? 0;
  if (kental) skor += 1;
  if (bau) skor += 1;
  return skor;
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
1. Bersihkan farji dari najis darah yang keluar.
2. Sumbat farji dengan kapas/pembalut (kecuali sedang puasa atau terasa sakit).
3. Wudlu harus dengan 'muwalah' (terus-menerus — tidak boleh putus sampai anggota tubuh kering).
4. Niat wudlu: "Niat berwudlu agar diperbolehkan melaksanakan sholat" (bukan menghilangkan hadats).
5. Segera laksanakan sholat fardlu.
*PENTING: Satu rangkaian bersuci ini HANYA berlaku untuk 1 kali sholat fardlu.`;

function tentukanKategoriMushtadloh(
  statusPengalaman: StatusPengalaman,
  isTamyiz: boolean,
  ingatKebiasaan: IngatKebiasaan,
  kebiasaanHari: number,
  darahKuatHari: number,
  darahLemahHari: number
): { kategori: string; hukum: string } {
  if (statusPengalaman === "mubtadiah") {
    if (isTamyiz) {
      return {
        kategori: "Mubtadi'ah Mumayyizah (Golongan 1)",
        hukum: `${darahKuatHari} hari darah kuat adalah HAIDL. ${darahLemahHari} hari darah lemah adalah ISTIHADLOH.`,
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
        hukum: `${darahKuatHari} hari darah kuat adalah HAIDL. ${darahLemahHari} hari darah lemah adalah ISTIHADLOH.`,
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

  const totalHari = daftarFaseDarah.reduce((sum, f) => sum + f.hari, 0);

  // 1. Cek usia minimal
  if (usiaTahun < 9 && kondisiAwal !== "nifas") {
    return {
      kesimpulan: "Darah Istihadloh (Darah Penyakit)",
      kategori: "",
      hukumHaidl: "",
      hukumIstihadloh: "Usia belum mencapai batas minimal 9 tahun Qomariyah sehingga darah tidak bisa dihukumi haidl.",
      qodloSholat: "",
      panduanBersuci: "",
      tipeHasil: "error",
    };
  }

  // 2. Deteksi Nifas
  if (kondisiAwal === "nifas") {
    if (totalHari <= 60) {
      return {
        kesimpulan: `Semua darah (${totalHari} hari) adalah NIFAS`,
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

  // 3. Deteksi Haidl Normal (1–15 hari)
  if (totalHari < 1) {
    return {
      kesimpulan: "Darah Istihadloh",
      kategori: "",
      hukumHaidl: "",
      hukumIstihadloh: "Durasi kurang dari batas minimal haid (24 jam / 1 hari).",
      qodloSholat: "",
      panduanBersuci: "",
      tipeHasil: "error",
    };
  }

  if (totalHari >= 1 && totalHari <= 15) {
    return {
      kesimpulan: `Semua darah (${totalHari} hari) adalah HAIDL`,
      kategori: "Haidl Normal",
      hukumHaidl: `Durasi ${totalHari} hari memenuhi syarat haidl (minimal 1 hari, maksimal 15 hari).`,
      hukumIstihadloh: "",
      qodloSholat: kalkQodloSholat(waktuBerhentiTotal),
      panduanBersuci: "",
      tipeHasil: "haidl_normal",
    };
  }

  // 4. Istihadloh (> 15 hari) — Analisis Tamyiz
  let isTamyiz = false;
  let darahKuatHari = 0;
  let darahLemahHari = 0;

  if (daftarFaseDarah.length >= 2) {
    const fase1 = daftarFaseDarah[0];
    const fase2 = daftarFaseDarah[1];
    const skor1 = skorWarnaSifat(fase1.warna, fase1.kental, fase1.bau);
    const skor2 = skorWarnaSifat(fase2.warna, fase2.kental, fase2.bau);

    if (skor1 > skor2 && fase1.hari >= 1 && fase1.hari <= 15) {
      darahKuatHari = fase1.hari;
      darahLemahHari = fase2.hari;

      // Cek apakah ada fase ke-3 yang kuat lagi
      let adaFase3Kuat = false;
      if (daftarFaseDarah.length > 2) {
        const fase3 = daftarFaseDarah[2];
        const skor3 = skorWarnaSifat(fase3.warna, fase3.kental, fase3.bau);
        if (skor3 >= skor1) adaFase3Kuat = true;
      }

      // Syarat lemah >= 15 hari HANYA berlaku jika diselingi darah kuat lagi
      if (adaFase3Kuat && darahLemahHari < 15) {
        isTamyiz = false;
      } else {
        isTamyiz = true;
      }
    }
  } else {
    darahLemahHari = totalHari;
  }

  const { kategori, hukum } = tentukanKategoriMushtadloh(
    statusPengalaman,
    isTamyiz,
    ingatKebiasaan,
    kebiasaanHaidHari,
    darahKuatHari,
    darahLemahHari
  );

  return {
    kesimpulan: `Darah Istihadloh (melebihi batas maksimal haid 15 hari)`,
    kategori,
    hukumHaidl: "",
    hukumIstihadloh: hukum,
    qodloSholat: kalkQodloSholat(waktuBerhentiTotal),
    panduanBersuci: PANDUAN_BERSUCI,
    tipeHasil: "istihadloh",
  };
}
