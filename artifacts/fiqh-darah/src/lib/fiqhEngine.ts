export type WarnaDarah = "hitam" | "merah" | "merah kekuningan" | "kuning" | "keruh";
export type KondisiAwal = "haidl" | "nifas";
export type StatusPengalaman = "mubtadiah" | "mutadah";
export type IngatKebiasaan = "ingat_semua" | "lupa_semua" | "ingat_durasi" | "ingat_waktu";
export type WaktuBerhenti = "subuh" | "dzuhur" | "ashar" | "maghrib" | "isya" | "";

export interface FaseDarahItem {
  tipe: "darah";
  warna: WarnaDarah;
  kental: boolean;
  bau: boolean;
  hari: number;
  jam: number;
}

export interface MasaBersihItem {
  tipe: "bersih";
  hari: number;
  jam: number;
}

export type FaseItem = FaseDarahItem | MasaBersihItem;

export interface InputUser {
  usiaTahun: number;
  kondisiAwal: KondisiAwal;
  daftarFase: FaseItem[];
  statusPengalaman: StatusPengalaman;
  ingatKebiasaan: IngatKebiasaan;
  kebiasaanHaidHari: number;
  waktuMulaiDarah: WaktuBerhenti;
  sudahSholatSebelumDarah: boolean;
  waktuBerhentiTotal: WaktuBerhenti;
}

export interface SiklusInfo {
  nomorSiklus: number;
  totalJamSiklus: number;
  darahJamSiklus: number;
  bersihDalamJam: number;
  kesimpulan: string;
  hukumDetail: string;
  tipe: "haidl_normal" | "istihadloh" | "error";
}

export interface HasilAnalisis {
  kesimpulan: string;
  kategori: string;
  hukumHaidl: string;
  hukumIstihadloh: string;
  qodloSholatMulai: string;
  qodloSholat: string;
  hutangIbadah: string;
  panduanBersuci: string;
  tipeHasil: "haidl_normal" | "nifas" | "istihadloh" | "error";
  daftarSiklus?: SiklusInfo[];
  adaPemisahBersih?: boolean;
}

export function formatDurasi(jam: number): string {
  const hari = jam / 24;
  if (jam % 24 === 0) return `${hari} hari`;
  return `${hari.toFixed(1)} hari (${jam} jam)`;
}

function skorWarnaSifat(fase: FaseDarahItem): number {
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

function jamKeFaseItem(fase: FaseItem): number {
  return (fase.jam || 0) + (fase.hari || 0) * 24;
}

/**
 * Qodlo sholat sebab DATANGNYA haid.
 * Wajib diqodlo jika darah keluar di waktu sholat dan belum sempat sholat.
 */
function kalkQodloSholatMulai(waktu: WaktuBerhenti, sudahSholat: boolean): string {
  if (!waktu || sudahSholat) return "";
  const label: Record<string, string> = {
    subuh: "SUBUH",
    dzuhur: "DZUHUR",
    ashar: "ASHAR",
    maghrib: "MAGHRIB",
    isya: "ISYA'",
  };
  const nm = label[waktu];
  if (!nm) return "";
  return `Saat darah mulai keluar, Anda belum melaksanakan sholat ${nm}. Karena waktu sholat sudah cukup untuk wudlu dan sholat namun belum dikerjakan, maka wajib mengqodlo sholat ${nm} setelah suci nanti.`;
}

/**
 * Qodlo sholat sebab BERHENTINYA haid.
 * Jika berhenti di waktu yang bisa dijama' (Ashar/Isya'), sholat sebelumnya ikut wajib diqodlo.
 */
function kalkQodloSholatBerhenti(waktu: WaktuBerhenti): string {
  if (!waktu) return "";
  const map: Record<string, string> = {
    ashar: "Wajib mengqodlo sholat DZUHUR dan ASHAR (darah berhenti saat Ashar — keduanya dapat dijama').",
    isya: "Wajib mengqodlo sholat MAGHRIB dan ISYA' (darah berhenti saat Isya' — keduanya dapat dijama').",
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

interface KategoriResult {
  kategori: string;
  hukum: string;
  haidJamSebenarnya: number | null;
}

function tentukanKategoriMushtadloh(
  statusPengalaman: StatusPengalaman,
  isTamyiz: boolean,
  ingatKebiasaan: IngatKebiasaan,
  kebiasaanHari: number,
  kuatJam: number,
  lemahJam: number,
): KategoriResult {
  const kuatLabel = formatDurasi(kuatJam);
  const lemahLabel = formatDurasi(lemahJam);

  if (statusPengalaman === "mubtadiah") {
    if (isTamyiz) {
      return {
        kategori: "Mubtadi'ah Mumayyizah (Golongan 1)",
        hukum: `${kuatLabel} darah kuat adalah HAIDL. ${lemahLabel} darah lemah adalah ISTIHADLOH.`,
        haidJamSebenarnya: kuatJam,
      };
    } else {
      return {
        kategori: "Mubtadi'ah Ghoiru Mumayyizah (Golongan 2)",
        hukum: "1 Hari 1 Malam (24 jam) pertama dihukumi HAIDL. Sisanya dihukumi ISTIHADLOH.",
        haidJamSebenarnya: 24,
      };
    }
  } else {
    if (isTamyiz) {
      return {
        kategori: "Mu'tadah Mumayyizah (Golongan 3)",
        hukum: `${kuatLabel} darah kuat adalah HAIDL. ${lemahLabel} darah lemah adalah ISTIHADLOH.`,
        haidJamSebenarnya: kuatJam,
      };
    } else {
      if (ingatKebiasaan === "ingat_semua") {
        return {
          kategori: "Mu'tadah Ghoiru Mumayyizah — Dzakiroh Li'adatiha Qodran wa Waqtan (Golongan 4)",
          hukum: `Dikembalikan ke adat lama. ${kebiasaanHari} hari pertama adalah HAIDL. Sisanya adalah ISTIHADLOH.`,
          haidJamSebenarnya: kebiasaanHari * 24,
        };
      } else if (ingatKebiasaan === "lupa_semua") {
        return {
          kategori: "Mu'tadah Mutahayyiroh / Nasiyah (Golongan 5)",
          hukum: "Keadaan membingungkan. Wajib ihtiyat (berhati-hati). Wajib mandi setiap akan sholat fardlu. Haram membaca Al-Qur'an di luar sholat.",
          haidJamSebenarnya: null,
        };
      } else if (ingatKebiasaan === "ingat_durasi") {
        return {
          kategori: "Mu'tadah Ghoiru Mumayyizah — Ingat Durasi, Lupa Waktu (Golongan 6)",
          hukum: `Haidl sejumlah ${kebiasaanHari} hari, namun karena lupa tanggal mulainya, hari yang diyakini harus diteliti lebih lanjut.`,
          haidJamSebenarnya: kebiasaanHari * 24,
        };
      } else {
        return {
          kategori: "Mu'tadah Ghoiru Mumayyizah — Ingat Waktu, Lupa Durasi (Golongan 7)",
          hukum: "Waktu yang diyakini biasa mulai haidl adalah HAIDL. Waktu yang diyakini suci adalah ISTIHADLOH.",
          haidJamSebenarnya: null,
        };
      }
    }
  }
}

/**
 * Menghitung hutang ibadah masa penantian bagi wanita mustahadloh.
 *
 * Kaidah: Seorang wanita baru tahu dirinya mustahadloh setelah hari ke-15.
 * Selama 15 hari pertama ia menunggu dan tidak sholat/puasa karena menyangka itu haid.
 * Hari-hari dalam masa penantian yang ternyata istihadloh wajib diqodlo.
 */
function kalkHutangIbadah(
  haidJamSebenarnya: number | null,
  kategori: string,
): string {
  if (haidJamSebenarnya === null) {
    return `Anda termasuk ${kategori}. Karena durasi haid yang sebenarnya tidak dapat dipastikan, besaran hutang ibadah masa penantian tidak dapat dihitung secara otomatis. Harap berkonsultasi dengan ustadzah atau kyai setempat untuk menentukan jumlah sholat/puasa yang wajib diqodlo'.`;
  }

  const penantianJam = 360; // 15 hari
  const istihadlohDalamPenantianJam = penantianJam - haidJamSebenarnya;

  if (istihadlohDalamPenantianJam <= 0) return "";

  const hutangJam = istihadlohDalamPenantianJam;
  const hutangHari = hutangJam / 24;
  const hutangTeks = hutangJam % 24 === 0
    ? `${hutangHari} hari`
    : `${hutangHari.toFixed(1)} hari (${hutangJam} jam)`;

  const haidHari = haidJamSebenarnya / 24;
  const haidTeks = haidJamSebenarnya % 24 === 0
    ? `${haidHari} hari`
    : `${haidHari.toFixed(1)} hari`;

  return `Karena Anda harus menunggu 15 hari untuk mengetahui status istihadloh, maka hari-hari istihadloh yang terlanjur ditinggalkan tanpa ibadah wajib diqodlo'. Dari 15 hari masa penantian, yang dihukumi haid sesungguhnya hanya ${haidTeks}. Sisa ${hutangTeks} (hari ${Math.ceil(haidJamSebenarnya / 24) + 1} s/d hari ke-15) adalah istihadloh yang Anda tinggalkan. Anda memiliki hutang sholat (dan puasa jika bertepatan Ramadhan) selama ${hutangTeks} yang wajib diqodlo'.`;
}

function analyzeSingleSiklus(
  items: FaseItem[],
  nomorSiklus: number,
  statusPengalaman: StatusPengalaman,
  ingatKebiasaan: IngatKebiasaan,
  kebiasaanHaidHari: number,
): SiklusInfo & { haidJamSebenarnya?: number | null; kategoriStr?: string } {
  const darahFases = items.filter((f): f is FaseDarahItem => f.tipe === "darah");
  const bersihFases = items.filter((f): f is MasaBersihItem => f.tipe === "bersih");

  const darahJam = darahFases.reduce((sum, f) => sum + jamKeFaseItem(f), 0);
  const bersihJam = bersihFases.reduce((sum, f) => sum + jamKeFaseItem(f), 0);
  const totalJam = darahJam + bersihJam;

  const bersihNote = bersihJam > 0
    ? ` (masa bersih ${formatDurasi(bersihJam)} dihitung sebagai haid — Hukum Jam'u)`
    : "";

  if (darahJam < 24) {
    return {
      nomorSiklus,
      totalJamSiklus: totalJam,
      darahJamSiklus: darahJam,
      bersihDalamJam: bersihJam,
      kesimpulan: `Istihadloh — darah hanya ${formatDurasi(darahJam)} (kurang dari minimal 24 jam)`,
      hukumDetail: `Total darah ${formatDurasi(darahJam)} — kurang dari syarat minimal 24 jam (1 hari 1 malam).`,
      tipe: "error",
    };
  }

  if (totalJam >= 24 && totalJam <= 360) {
    return {
      nomorSiklus,
      totalJamSiklus: totalJam,
      darahJamSiklus: darahJam,
      bersihDalamJam: bersihJam,
      kesimpulan: `HAIDL NORMAL — total ${formatDurasi(totalJam)}${bersihNote}`,
      hukumDetail: `Durasi ${formatDurasi(totalJam)} memenuhi syarat haidl (minimal 24 jam, maksimal 15 hari).${bersihNote}`,
      tipe: "haidl_normal",
    };
  }

  let isTamyiz = false;
  let kuatJam = 0;
  let lemahJam = 0;

  if (darahFases.length >= 2) {
    const fase1 = darahFases[0];
    const fase2 = darahFases[1];
    const skor1 = skorWarnaSifat(fase1);
    const skor2 = skorWarnaSifat(fase2);
    const jam1 = jamKeFaseItem(fase1);

    if (skor1 > skor2 && jam1 >= 24 && jam1 <= 360) {
      kuatJam = jam1;
      lemahJam = totalJam - kuatJam;

      let adaFase3Kuat = false;
      if (darahFases.length > 2) {
        const skor3 = skorWarnaSifat(darahFases[2]);
        if (skor3 >= skor1) adaFase3Kuat = true;
      }

      isTamyiz = !(adaFase3Kuat && lemahJam < 360);
    }
  } else {
    lemahJam = totalJam;
  }

  const { kategori, hukum, haidJamSebenarnya } = tentukanKategoriMushtadloh(
    statusPengalaman,
    isTamyiz,
    ingatKebiasaan,
    kebiasaanHaidHari,
    kuatJam,
    lemahJam,
  );

  return {
    nomorSiklus,
    totalJamSiklus: totalJam,
    darahJamSiklus: darahJam,
    bersihDalamJam: bersihJam,
    kesimpulan: `Istihadloh — total ${formatDurasi(totalJam)} melebihi batas 15 hari${bersihNote}`,
    hukumDetail: `${kategori}: ${hukum}`,
    tipe: "istihadloh",
    haidJamSebenarnya,
    kategoriStr: kategori,
  };
}

function parseSiklus(daftarFase: FaseItem[]): {
  siklus: FaseItem[][];
  adaPemisah: boolean;
} {
  const siklus: FaseItem[][] = [];
  let currentSiklus: FaseItem[] = [];
  let adaPemisah = false;

  for (const fase of daftarFase) {
    const jam = jamKeFaseItem(fase);
    if (fase.tipe === "bersih") {
      if (jam >= 360) {
        if (currentSiklus.some((f) => f.tipe === "darah")) {
          siklus.push(currentSiklus);
        }
        currentSiklus = [];
        adaPemisah = true;
      } else {
        currentSiklus.push(fase);
      }
    } else {
      currentSiklus.push(fase);
    }
  }

  if (currentSiklus.some((f) => f.tipe === "darah")) {
    siklus.push(currentSiklus);
  }

  return { siklus, adaPemisah };
}

export function jalankanMesinFiqh(input: InputUser): HasilAnalisis {
  const {
    usiaTahun,
    kondisiAwal,
    daftarFase,
    statusPengalaman,
    ingatKebiasaan,
    kebiasaanHaidHari,
    waktuMulaiDarah,
    sudahSholatSebelumDarah,
    waktuBerhentiTotal,
  } = input;

  const totalJamSemua = daftarFase.reduce((sum, f) => sum + jamKeFaseItem(f), 0);
  const qodloMulai = kalkQodloSholatMulai(waktuMulaiDarah, sudahSholatSebelumDarah);
  const qodloBerhenti = kalkQodloSholatBerhenti(waktuBerhentiTotal);

  const emptyHutang = "";

  if (usiaTahun < 9 && kondisiAwal !== "nifas") {
    return {
      kesimpulan: "Darah Istihadloh (Darah Penyakit)",
      kategori: "",
      hukumHaidl: "",
      hukumIstihadloh: `Usia belum mencapai batas minimal 9 tahun Qomariyah. Total darah: ${totalJamSemua} jam.`,
      qodloSholatMulai: "",
      qodloSholat: "",
      hutangIbadah: "",
      panduanBersuci: "",
      tipeHasil: "error",
    };
  }

  if (kondisiAwal === "nifas") {
    const totalNifasJam = totalJamSemua;
    if (totalNifasJam <= 1440) {
      return {
        kesimpulan: `Semua darah (${formatDurasi(totalNifasJam)}) adalah NIFAS`,
        kategori: "Nifas Normal",
        hukumHaidl: "",
        hukumIstihadloh: "",
        qodloSholatMulai: qodloMulai,
        qodloSholat: qodloBerhenti,
        hutangIbadah: "",
        panduanBersuci: "",
        tipeHasil: "nifas",
      };
    } else {
      return {
        kesimpulan: "Istihadloh Nifas (darah melebihi 60 hari)",
        kategori: "Nifas Istihadloh",
        hukumHaidl: "",
        hukumIstihadloh: "Darah melampaui 60 hari. Hukum dikembalikan pada adat nifas sebelumnya atau setetes darah pertama.",
        qodloSholatMulai: "",
        qodloSholat: "",
        hutangIbadah: "",
        panduanBersuci: PANDUAN_BERSUCI,
        tipeHasil: "istihadloh",
      };
    }
  }

  const { siklus, adaPemisah } = parseSiklus(daftarFase);
  const hasBersihItem = daftarFase.some((f) => f.tipe === "bersih");

  if (siklus.length === 0) {
    return {
      kesimpulan: "Darah Istihadloh",
      kategori: "",
      hukumHaidl: "",
      hukumIstihadloh: "Tidak ditemukan fase darah yang valid untuk dianalisis.",
      qodloSholatMulai: "",
      qodloSholat: "",
      hutangIbadah: "",
      panduanBersuci: "",
      tipeHasil: "error",
    };
  }

  const daftarSiklusInfo = siklus.map((items, idx) =>
    analyzeSingleSiklus(items, idx + 1, statusPengalaman, ingatKebiasaan, kebiasaanHaidHari),
  );

  if (siklus.length === 1 && !adaPemisah) {
    const s = daftarSiklusInfo[0];

    if (s.tipe === "error") {
      return {
        kesimpulan: "Darah Istihadloh",
        kategori: "",
        hukumHaidl: "",
        hukumIstihadloh: s.hukumDetail,
        qodloSholatMulai: "",
        qodloSholat: "",
        hutangIbadah: "",
        panduanBersuci: "",
        tipeHasil: "error",
        daftarSiklus: hasBersihItem ? daftarSiklusInfo : undefined,
      };
    }

    if (s.tipe === "haidl_normal") {
      return {
        kesimpulan: `Semua darah (${formatDurasi(s.totalJamSiklus)}) adalah HAIDL`,
        kategori: s.bersihDalamJam > 0 ? "Haidl Normal (dengan Hukum Jam'u)" : "Haidl Normal",
        hukumHaidl: s.hukumDetail,
        hukumIstihadloh: "",
        qodloSholatMulai: qodloMulai,
        qodloSholat: qodloBerhenti,
        hutangIbadah: "",
        panduanBersuci: "",
        tipeHasil: "haidl_normal",
        daftarSiklus: hasBersihItem ? daftarSiklusInfo : undefined,
      };
    }

    // istihadloh
    const lines = s.hukumDetail.split(": ");
    const kategoriStr = s.kategoriStr ?? lines[0] ?? "";
    const hukumStr = s.kategoriStr
      ? s.hukumDetail.replace(`${s.kategoriStr}: `, "")
      : lines.slice(1).join(": ");

    const hutang = kalkHutangIbadah(s.haidJamSebenarnya ?? null, kategoriStr);

    return {
      kesimpulan: `Darah Istihadloh (total ${formatDurasi(s.totalJamSiklus)} — melebihi batas maksimal haid 15 hari)`,
      kategori: kategoriStr,
      hukumHaidl: "",
      hukumIstihadloh: hukumStr || s.hukumDetail,
      qodloSholatMulai: qodloMulai,
      qodloSholat: qodloBerhenti,
      hutangIbadah: hutang,
      panduanBersuci: PANDUAN_BERSUCI,
      tipeHasil: "istihadloh",
      daftarSiklus: hasBersihItem ? daftarSiklusInfo : undefined,
    };
  }

  // Multi-siklus
  const anyIstihadloh = daftarSiklusInfo.some((s) => s.tipe === "istihadloh" || s.tipe === "error");
  const allHaidl = daftarSiklusInfo.every((s) => s.tipe === "haidl_normal");
  const totalDarahJam = daftarSiklusInfo.reduce((sum, s) => sum + s.darahJamSiklus, 0);

  // Hutang only computed per-istihadloh cycle when meaningful
  let hutangMulti = "";
  if (anyIstihadloh) {
    const istihadlohSiklus = daftarSiklusInfo.filter((s) => s.tipe === "istihadloh");
    if (istihadlohSiklus.length === 1) {
      const sIt = istihadlohSiklus[0];
      hutangMulti = kalkHutangIbadah(
        sIt.haidJamSebenarnya ?? null,
        sIt.kategoriStr ?? "",
      );
    } else if (istihadlohSiklus.length > 1) {
      hutangMulti = `Terdapat ${istihadlohSiklus.length} siklus istihadloh. Setiap siklus memiliki hutang ibadah masa penantian masing-masing. Silakan konsultasikan dengan ustadzah atau kyai untuk perhitungan rinci.`;
    }
  }

  return {
    kesimpulan: `Terdapat ${siklus.length} siklus haid terpisah (dipisahkan suci ≥15 hari)`,
    kategori: allHaidl
      ? `${siklus.length} Siklus Haidl Normal`
      : `Multi-Siklus — Ada Istihadloh`,
    hukumHaidl: allHaidl
      ? `Semua ${siklus.length} siklus memenuhi syarat haidl. Total darah: ${formatDurasi(totalDarahJam)}.`
      : "",
    hukumIstihadloh: anyIstihadloh
      ? "Satu atau lebih siklus melampaui batas 15 hari (istihadloh). Lihat rincian siklus di bawah."
      : "",
    qodloSholatMulai: qodloMulai,
    qodloSholat: qodloBerhenti,
    hutangIbadah: hutangMulti,
    panduanBersuci: anyIstihadloh ? PANDUAN_BERSUCI : "",
    tipeHasil: anyIstihadloh ? "istihadloh" : "haidl_normal",
    daftarSiklus: daftarSiklusInfo,
    adaPemisahBersih: true,
  };
}
