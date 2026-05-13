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
  /**
   * true  = ini PERTAMA KALI istihadloh terjadi (harus menunggu 15 hari → ada hutang ibadah).
   * false = bulan kedua/seterusnya (sudah tahu adat → langsung mandi, tidak ada hutang penantian).
   */
  isBulanPertamaIstihadloh: boolean;
}

export interface SiklusInfo {
  nomorSiklus: number;
  totalJamSiklus: number;
  darahJamSiklus: number;
  bersihDalamJam: number;
  /** Dari total bersihDalamJam, berapa jam yang jatuh dalam periode haid sesungguhnya.
   *  Untuk haidl_normal: sama dengan bersihDalamJam (semua bersih = haid, Hukum Jam'u).
   *  Untuk istihadloh: hanya bersih yang berada dalam jendela haidJamSebenarnya pertama. */
  bersihDalamHaidJam: number;
  kesimpulan: string;
  hukumDetail: string;
  tipe: "haidl_normal" | "istihadloh" | "error";
}

export interface AturanIbadah {
  judul: string;
  wajib: string[];
  haram: string[];
}

export interface PeringatanJedaSuci {
  totalJedaJam: number;
  qodloPuasaHari?: number;
  statusPuasa: string;
  statusSholat: string;
}

export interface HasilAnalisis {
  kesimpulan: string;
  kategori: string;
  hukumHaidl: string;
  hukumIstihadloh: string;
  qodloSholatMulai: string;
  qodloSholat: string;
  hutangIbadah: string;
  peringatanJedaSuci?: PeringatanJedaSuci;
  aturanIbadah?: AturanIbadah;
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

function buatPeringatanJedaSuci(totalJedaJam: number): PeringatanJedaSuci {
  // Secara otomatis: saat darah berhenti sementara, wanita WAJIB sholat dan puasa
  // (tidak tahu darah akan keluar lagi), sehingga ibadahnya tidak sah dan wajib diqodlo.
  const qodloPuasaHari = totalJedaJam > 0 ? Math.ceil(totalJedaJam / 24) : undefined;

  return {
    totalJedaJam,
    qodloPuasaHari,
    statusPuasa: `Puasa yang Anda kerjakan selama masa berhenti sementara (${formatDurasi(totalJedaJam)}) TIDAK SAH dan WAJIB DIQODLO sebanyak ${qodloPuasaHari} hari. Sebab masa berhenti itu secara dzahir mewajibkan puasa — namun hakikatnya masih dalam rangkaian masa haid (Hukum Jam'u — darah keluar lagi sebelum 15 hari suci penuh), sehingga puasanya gugur.`,
    statusSholat: `Sholat yang Anda kerjakan pada masa berhenti sementara tersebut juga TIDAK SAH secara hukum. Namun, Anda TIDAK BERDOSA mengerjakannya karena Anda tidak tahu darah akan keluar kembali (mengira sudah suci). Anda juga TIDAK WAJIB MENGQODLO sholat-sholat tersebut, karena kewajiban sholat memang gugur selama masa haid.`,
  };
}

/**
 * Varian untuk kasus istihadloh.
 * konteks = "adat_haid"  : Bersih jatuh dalam jendela adat haid (Golongan 2, 4, 6, 7).
 * konteks = "mumayyizah" : Bersih jatuh di antara dua fase darah kuat (Golongan 1 & 3).
 */
function buatPeringatanJedaSuciIstihadloh(
  bersihDalamHaidJam: number,
  konteks: "adat_haid" | "mumayyizah" = "adat_haid",
): PeringatanJedaSuci {
  const qodloPuasaHari = bersihDalamHaidJam > 0 ? Math.ceil(bersihDalamHaidJam / 24) : undefined;
  const alasan = konteks === "mumayyizah"
    ? `Sebab masa bersih tersebut mengapit dua fase darah kuat, sehingga secara hukum fiqh dihukumi berada dalam rangkaian masa haid (mengikuti sifat darah yang mengelilinginya).`
    : `Sebab secara hukum fiqh, masa bersih yang berada di dalam jendela waktu haid (sesuai adat yang telah ditetapkan) tetap dihukumi haid, sehingga puasanya batal.`;
  return {
    totalJedaJam: bersihDalamHaidJam,
    qodloPuasaHari,
    statusPuasa: `Puasa yang Anda kerjakan selama masa berhenti sementara (${formatDurasi(bersihDalamHaidJam)}) TIDAK SAH dan WAJIB DIQODLO sebanyak ${qodloPuasaHari} hari. ${alasan}`,
    statusSholat: `Sholat yang Anda kerjakan di masa berhenti sementara yang jatuh dalam periode haid tersebut juga TIDAK SAH secara hukum. Namun, Anda TIDAK BERDOSA mengerjakannya karena secara dzahir Anda wajib sholat saat darah tidak terlihat. Sholat tersebut TIDAK PERLU DIQODLO, karena kewajiban sholat gugur selama masa haid.`,
  };
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
  aturanIbadah?: AturanIbadah;
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
      // ── Mu'tadah Ghoiru Mumayyizah — 4 Sub-Kategori ──
      if (ingatKebiasaan === "ingat_semua") {
        return {
          kategori: "Mu'tadah Ghoiru Mumayyizah — Dzakiroh Li'adatiha Qodran wa Waqtan (Golongan 4)",
          hukum: `Dikembalikan ke adat lama. ${kebiasaanHari} hari pertama adalah HAIDL. Sisanya adalah ISTIHADLOH.`,
          haidJamSebenarnya: kebiasaanHari * 24,
          aturanIbadah: {
            judul: "Aturan Ibadah (Ingat Durasi & Waktu Adat)",
            wajib: [
              `Selama ${kebiasaanHari} hari pertama (masa adat haid): berlaku hukum haid — haram sholat, puasa, jima', membaca Al-Qur'an, menyentuh mushaf, dan berdiam di masjid.`,
              `Setelah masa adat ${kebiasaanHari} hari selesai: wajib mandi besar (mandi wajib) segera.`,
              "Pada hari-hari istihadloh setelah masa adat: wajib sholat dan puasa, serta halal berhubungan suami-istri — dengan menggunakan tata cara bersuci mustahadloh (lihat panduan bersuci di bawah).",
            ],
            haram: [
              `Selama ${kebiasaanHari} hari pertama: sholat, puasa, jima' (bersetubuh), membaca Al-Qur'an di luar sholat, menyentuh/membawa mushaf, dan berdiam di masjid.`,
            ],
          },
        };
      } else if (ingatKebiasaan === "lupa_semua") {
        return {
          kategori: "Mu'tadah Mutahayyiroh / Nasiyah (Golongan 5)",
          hukum: "Keadaan membingungkan (lupa total). Wajib ihtiyat (berhati-hati). Haid hanya diakui 24 jam pertama sebagai batas minimal mutlak.",
          haidJamSebenarnya: 24,
          aturanIbadah: {
            judul: "Aturan Ibadah Mutahayyiroh / Nasiyah (Ihtiyat Penuh)",
            wajib: [
              "Wajib mengerjakan sholat 5 waktu, puasa, dan thowaf — dihukumi seperti orang suci dalam hal kewajiban ibadah.",
              "Wajib mandi besar setiap kali akan sholat fardlu, karena tidak diketahui kapan haid benar-benar berhenti.",
            ],
            haram: [
              "Bersetubuh (bersentuhan kulit antara pusar hingga lutut dengan suami).",
              "Membaca ayat Al-Qur'an di luar sholat.",
              "Menyentuh atau membawa mushaf Al-Qur'an.",
              "Lewat di dalam masjid jika khawatir menetes darah.",
              "Berdiam diri di masjid (i'tikaf).",
            ],
          },
        };
      } else if (ingatKebiasaan === "ingat_durasi") {
        return {
          kategori: "Mu'tadah Ghoiru Mumayyizah — Ingat Durasi, Lupa Waktu (Golongan 6)",
          hukum: `Haidl sejumlah ${kebiasaanHari} hari, namun karena lupa tanggal mulainya, hari-hari yang dimungkinkan sebagai haid atau suci dihukumi Mutahayyiroh.`,
          haidJamSebenarnya: kebiasaanHari * 24,
          aturanIbadah: {
            judul: "Aturan Ibadah Ihtiyat (Ingat Durasi, Lupa Waktu Mulai)",
            wajib: [
              "Pada hari-hari yang diragukan (dimungkinkan haid atau suci): dihukumi Mutahayyiroh.",
              "Wajib sholat, puasa, dan thowaf pada hari-hari yang diragukan tersebut.",
              `Wajib mandi besar setiap kali akan sholat fardlu pada hari-hari yang dimungkinkan sebagai waktu berakhirnya haid (sekitar ${kebiasaanHari} hari yang kemungkinan menjadi akhir masa haid).`,
            ],
            haram: [
              "Bersetubuh (bersentuhan kulit antara pusar hingga lutut dengan suami) pada hari-hari yang diragukan.",
              "Membaca Al-Qur'an di luar sholat pada hari-hari yang diragukan.",
              "Menyentuh atau membawa mushaf Al-Qur'an pada hari-hari yang diragukan.",
              "Berdiam diri di masjid (i'tikaf) pada hari-hari yang diragukan.",
            ],
          },
        };
      } else {
        return {
          kategori: "Mu'tadah Ghoiru Mumayyizah — Ingat Waktu, Lupa Durasi (Golongan 7)",
          hukum: "Hari/waktu yang diyakini biasa mulai haid = HAIDL (24 jam pertama). Hari-hari setelahnya yang meragukan dihukumi Mutahayyiroh.",
          haidJamSebenarnya: 24,
          aturanIbadah: {
            judul: "Aturan Ibadah Ihtiyat (Ingat Waktu Mulai, Lupa Durasi)",
            wajib: [
              "Hari pertama (24 jam yang diyakini sebagai awal haid): berlaku hukum haid penuh — haram sholat, puasa, jima', dsb.",
              "Pada hari-hari setelahnya yang meragukan (dihukumi Mutahayyiroh): wajib sholat, puasa, dan thowaf.",
              "Wajib mandi besar setiap kali akan sholat fardlu pada hari-hari yang meragukan tersebut.",
            ],
            haram: [
              "Bersetubuh (bersentuhan kulit antara pusar hingga lutut dengan suami) pada hari-hari yang meragukan.",
              "Membaca Al-Qur'an di luar sholat pada hari-hari yang meragukan.",
              "Menyentuh atau membawa mushaf Al-Qur'an pada hari-hari yang meragukan.",
              "Berdiam diri di masjid (i'tikaf) pada hari-hari yang meragukan.",
            ],
          },
        };
      }
    }
  }
}

/**
 * Menghitung hutang ibadah masa penantian bagi wanita mustahadloh.
 *
 * Kaidah: Seorang wanita baru tahu dirinya mustahadloh setelah hari ke-15 (bulan pertama).
 * Pada bulan kedua dan seterusnya, ia sudah tahu adat/batas darahnya, sehingga
 * langsung mandi begitu masa haidnya habis — tidak ada masa penantian, tidak ada hutang.
 */
function kalkHutangIbadah(
  haidJamSebenarnya: number | null,
  kategori: string,
  isBulanPertama: boolean,
): string {
  // ── Bulan kedua dan seterusnya: tidak ada masa penantian 15 hari ──
  if (!isBulanPertama) {
    return `Karena Anda sudah mengetahui adat/batas darah dari bulan-bulan sebelumnya, tidak diperlukan masa penantian 15 hari. Anda langsung mandi wajib begitu masa haid Anda berakhir. Tidak ada hutang sholat/puasa masa penantian.`;
  }

  // ── Bulan pertama: durasi haid tidak dapat dipastikan ──
  if (haidJamSebenarnya === null) {
    return `Ini adalah bulan pertama istihadloh Anda. Anda termasuk ${kategori}. Karena durasi haid yang sebenarnya tidak dapat dipastikan, besaran hutang ibadah masa penantian tidak dapat dihitung secara otomatis. Harap berkonsultasi dengan ustadzah atau kyai setempat untuk menentukan jumlah sholat/puasa yang wajib diqodlo'.`;
  }

  // ── Bulan pertama: hitung hutang ──
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

  return `Ini adalah bulan pertama istihadloh Anda. Karena harus menunggu 15 hari untuk memastikan status, hari-hari yang ternyata istihadloh namun terlanjur ditinggalkan wajib diqodlo'. Dari 15 hari masa penantian, yang dihukumi haid sesungguhnya hanya ${haidTeks}. Sisa ${hutangTeks} (hari ke-${Math.ceil(haidJamSebenarnya / 24) + 1} s/d hari ke-15) adalah masa istihadloh yang ibadahnya Anda tinggalkan. Anda memiliki hutang sholat (dan puasa jika bertepatan Ramadhan) selama ${hutangTeks} yang wajib diqodlo'.`;
}

function analyzeSingleSiklus(
  items: FaseItem[],
  nomorSiklus: number,
  statusPengalaman: StatusPengalaman,
  ingatKebiasaan: IngatKebiasaan,
  kebiasaanHaidHari: number,
): SiklusInfo & { haidJamSebenarnya?: number | null; kategoriStr?: string; aturanIbadah?: AturanIbadah } {
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
      bersihDalamHaidJam: 0,
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
      // Haidl_normal: semua bersih masuk hukum haid (Hukum Jam'u, total ≤ 15 hari)
      bersihDalamHaidJam: bersihJam,
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

  const { kategori, hukum, haidJamSebenarnya, aturanIbadah } = tentukanKategoriMushtadloh(
    statusPengalaman,
    isTamyiz,
    ingatKebiasaan,
    kebiasaanHaidHari,
    kuatJam,
    lemahJam,
  );

  // ═══ Klasifikasi Masa Bersih dalam Haid — per Kategori Fiqh ═══
  //
  // Mumayyizah (Golongan 1 & 3, isTamyiz = true):
  //   Bersih mengikuti SIFAT darah yang mendahuluinya.
  //   Bersih setelah darah kuat (skor ≥ skor fase pertama) = HAID.
  //   Bersih setelah darah lemah = ISTIHADLOH.
  //
  // Golongan 5 (Nasiyah / Mutahayyirah lupa_semua):
  //   Seluruh masa jeda = masa keraguan (ihtiyath).
  //   Ibadah pada masa jeda WAJIB dikerjakan dan SAH — tidak ada qodlo.
  //   → bersihDalamHaidJam = 0 (tidak memunculkan peringatan qodlo).
  //   Aturan ihtiyath sudah dijelaskan di blok aturanIbadah.
  //
  // Non-Mumayyizah lainnya (Golongan 2, 4, 6, 7):
  //   Berbasis jendela waktu haidJamSebenarnya.
  //   Bersih yang jatuh dalam rentang [0, haidJamSebenarnya] = HAID.
  let bersihDalamHaidJam = 0;

  if (isTamyiz) {
    // Golongan 1 & 3 — berbasis kekuatan darah
    const kuatSkor = darahFases.length > 0 ? skorWarnaSifat(darahFases[0]) : 0;
    let lastBloodIsKuat = false;
    for (const fase of items) {
      const jam = jamKeFaseItem(fase);
      if (fase.tipe === "darah") {
        lastBloodIsKuat = skorWarnaSifat(fase) >= kuatSkor;
      } else if (fase.tipe === "bersih" && lastBloodIsKuat) {
        bersihDalamHaidJam += jam;
      }
    }
  } else if (ingatKebiasaan !== "lupa_semua") {
    // Golongan 2, 4, 6, 7 — berbasis jendela waktu haidJamSebenarnya
    if (haidJamSebenarnya !== null && haidJamSebenarnya !== undefined && haidJamSebenarnya > 0) {
      let cumJam = 0;
      for (const fase of items) {
        const jam = jamKeFaseItem(fase);
        if (fase.tipe === "bersih") {
          const overlapStart = Math.min(cumJam, haidJamSebenarnya);
          const overlapEnd = Math.min(cumJam + jam, haidJamSebenarnya);
          bersihDalamHaidJam += Math.max(0, overlapEnd - overlapStart);
        }
        cumJam += jam;
      }
    }
  }
  // else: Golongan 5 (lupa_semua / Nasiyah) → bersihDalamHaidJam = 0 (sudah default)

  return {
    nomorSiklus,
    totalJamSiklus: totalJam,
    darahJamSiklus: darahJam,
    bersihDalamJam: bersihJam,
    bersihDalamHaidJam,
    kesimpulan: `Istihadloh — total ${formatDurasi(totalJam)} melebihi batas 15 hari${bersihNote}`,
    hukumDetail: `${kategori}: ${hukum}`,
    tipe: "istihadloh",
    haidJamSebenarnya,
    kategoriStr: kategori,
    aturanIbadah,
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
    isBulanPertamaIstihadloh,
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
        peringatanJedaSuci: s.bersihDalamJam > 0
          ? buatPeringatanJedaSuci(s.bersihDalamJam)
          : undefined,
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

    const hutang = kalkHutangIbadah(s.haidJamSebenarnya ?? null, kategoriStr, isBulanPertamaIstihadloh);

    return {
      kesimpulan: `Darah Istihadloh (total ${formatDurasi(s.totalJamSiklus)} — melebihi batas maksimal haid 15 hari)`,
      kategori: kategoriStr,
      hukumHaidl: "",
      hukumIstihadloh: hukumStr || s.hukumDetail,
      qodloSholatMulai: qodloMulai,
      qodloSholat: qodloBerhenti,
      hutangIbadah: hutang,
      peringatanJedaSuci: s.bersihDalamHaidJam > 0
        ? buatPeringatanJedaSuciIstihadloh(
            s.bersihDalamHaidJam,
            (s.kategoriStr ?? "").includes("Mumayyizah") ? "mumayyizah" : "adat_haid",
          )
        : undefined,
      aturanIbadah: s.aturanIbadah,
      panduanBersuci: PANDUAN_BERSUCI,
      tipeHasil: "istihadloh",
      daftarSiklus: hasBersihItem ? daftarSiklusInfo : undefined,
    };
  }

  // Multi-siklus
  const anyIstihadloh = daftarSiklusInfo.some((s) => s.tipe === "istihadloh" || s.tipe === "error");
  const allHaidl = daftarSiklusInfo.every((s) => s.tipe === "haidl_normal");
  const totalDarahJam = daftarSiklusInfo.reduce((sum, s) => sum + s.darahJamSiklus, 0);

  // Peringatan jeda suci: jumlahkan bersihDalamHaidJam dari semua siklus
  const totalJedaJamHaidl = daftarSiklusInfo
    .reduce((sum, s) => sum + s.bersihDalamHaidJam, 0);
  const peringatanJedaSuciMulti = totalJedaJamHaidl > 0
    ? buatPeringatanJedaSuci(totalJedaJamHaidl)
    : undefined;

  // Hutang only computed per-istihadloh cycle when meaningful
  let hutangMulti = "";
  let aturanIbadahMulti: AturanIbadah | undefined;
  if (anyIstihadloh) {
    const istihadlohSiklus = daftarSiklusInfo.filter((s) => s.tipe === "istihadloh");
    if (istihadlohSiklus.length === 1) {
      const sIt = istihadlohSiklus[0];
      hutangMulti = kalkHutangIbadah(
        sIt.haidJamSebenarnya ?? null,
        sIt.kategoriStr ?? "",
        isBulanPertamaIstihadloh,
      );
      aturanIbadahMulti = sIt.aturanIbadah;
    } else if (istihadlohSiklus.length > 1) {
      if (!isBulanPertamaIstihadloh) {
        hutangMulti = `Karena Anda sudah mengetahui adat/batas darah dari bulan-bulan sebelumnya, tidak diperlukan masa penantian 15 hari pada siklus manapun. Anda langsung mandi wajib setiap masa haid berakhir. Tidak ada hutang sholat/puasa masa penantian.`;
      } else {
        hutangMulti = `Terdapat ${istihadlohSiklus.length} siklus istihadloh dan ini adalah bulan pertama Anda mengalaminya. Setiap siklus memiliki hutang ibadah masa penantian masing-masing. Silakan konsultasikan dengan ustadzah atau kyai untuk perhitungan rinci per siklus.`;
      }
      // Use aturan ibadah from the last istihadloh siklus as representative
      aturanIbadahMulti = istihadlohSiklus[istihadlohSiklus.length - 1].aturanIbadah;
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
    peringatanJedaSuci: peringatanJedaSuciMulti,
    aturanIbadah: aturanIbadahMulti,
    panduanBersuci: anyIstihadloh ? PANDUAN_BERSUCI : "",
    tipeHasil: anyIstihadloh ? "istihadloh" : "haidl_normal",
    daftarSiklus: daftarSiklusInfo,
    adaPemisahBersih: true,
  };
}
