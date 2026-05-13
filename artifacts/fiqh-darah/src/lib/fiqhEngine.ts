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
  /** "haidl_normal" = Hukum Jam'u (total ≤ 15 hari); "istihadloh" = jeda dalam masa adat */
  tipeKasus: "haidl_normal" | "istihadloh";
}

/**
 * Satu entri per hari (atau segmen parsial) dalam lini masa harian.
 * Digunakan untuk menampilkan kalender per-hari di hasil akhir.
 */
export type HukumHari = "haid" | "nifas" | "istihadloh" | "ihtiyath" | "suci";

export interface EntriHarian {
  /** Nomor hari (1-indeks, dalam konteks siklus ini) */
  hari: number;
  /** Apakah hari ini fase darah atau bersih */
  tipe: "darah" | "bersih";
  /** Status hukum fiqh hari ini */
  hukum: HukumHari;
  /** Warna darah asli (hanya untuk tipe "darah") */
  warnaAsli?: WarnaDarah;
  /** Apakah wajib qodlo puasa di hari ini */
  wajibQodloPuasa: boolean;
  /** Keterangan singkat */
  keterangan: string;
  /** Jumlah jam aktual di hari ini (24 untuk hari penuh, < 24 untuk parsial) */
  jamDiHari: number;
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
  /** Lini masa harian: array EntriHarian untuk setiap hari dalam rangkaian */
  liniMasaHarian?: EntriHarian[];
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
  const qodloPuasaHari = totalJedaJam > 0 ? Math.ceil(totalJedaJam / 24) : undefined;

  return {
    totalJedaJam,
    qodloPuasaHari,
    tipeKasus: "haidl_normal",
    statusPuasa: `Puasa yang Anda kerjakan selama masa berhenti sementara (${formatDurasi(totalJedaJam)}) TIDAK SAH dan WAJIB DIQODLO sebanyak ${qodloPuasaHari} hari. Sebab masa berhenti itu secara dzahir mewajibkan puasa — namun hakikatnya masih dalam rangkaian masa haid (Hukum Jam'u — darah keluar lagi sebelum 15 hari suci penuh), sehingga puasanya gugur.`,
    statusSholat: `Sholat yang Anda kerjakan pada masa berhenti sementara tersebut TIDAK SAH secara hukum. Namun, Anda TIDAK BERDOSA mengerjakannya karena Anda tidak tahu darah akan keluar kembali (mengira sudah suci). Anda juga TIDAK WAJIB MENGQODLO sholat-sholat tersebut, karena kewajiban sholat memang gugur selama masa haid.`,
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
    tipeKasus: "istihadloh",
    statusPuasa: `Puasa yang Anda kerjakan selama masa berhenti sementara (${formatDurasi(bersihDalamHaidJam)}) TIDAK SAH dan WAJIB DIQODLO sebanyak ${qodloPuasaHari} hari. ${alasan}`,
    statusSholat: `Sholat yang Anda kerjakan di masa berhenti sementara yang jatuh dalam periode haid tersebut TIDAK SAH secara hukum. Namun, Anda TIDAK BERDOSA mengerjakannya karena secara dzahir Anda wajib sholat saat darah tidak terlihat. Sholat tersebut TIDAK PERLU DIQODLO, karena kewajiban sholat gugur selama masa haid.`,
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
 */
function kalkHutangIbadah(
  haidJamSebenarnya: number | null,
  kategori: string,
  isBulanPertama: boolean,
): string {
  if (!isBulanPertama) {
    return `Karena Anda sudah mengetahui adat/batas darah dari bulan-bulan sebelumnya, tidak diperlukan masa penantian 15 hari. Anda langsung mandi wajib begitu masa haid Anda berakhir. Tidak ada hutang sholat/puasa masa penantian.`;
  }

  if (haidJamSebenarnya === null) {
    return `Ini adalah bulan pertama istihadloh Anda. Anda termasuk ${kategori}. Karena durasi haid yang sebenarnya tidak dapat dipastikan, besaran hutang ibadah masa penantian tidak dapat dihitung secara otomatis. Harap berkonsultasi dengan ustadzah atau kyai setempat untuk menentukan jumlah sholat/puasa yang wajib diqodlo'.`;
  }

  const penantianJam = 360;
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

/**
 * ─────────────────────────────────────────────────────────────────────
 * PRE-PROCESSING: Transformasi fase ke Lini Masa Harian
 * ─────────────────────────────────────────────────────────────────────
 *
 * Mengubah daftar fase (darah/bersih) menjadi array EntriHarian agar
 * posisi "Jeda Bersih" dapat divalidasi secara presisi per hari.
 *
 * Contoh: Fase 1 (Hitam, 3 hari) + Fase 2 (Bersih, 2 hari)
 *   → [Darah-Haid, Darah-Haid, Darah-Haid, Bersih-Haid, Bersih-Haid]
 */
function buatLiniMasaHarian(
  items: FaseItem[],
  tipeAnalisis: "haidl_normal" | "istihadloh" | "error",
  isTamyiz: boolean,
  ingatKebiasaan: IngatKebiasaan,
  haidJamSebenarnya: number | null,
  kuatSkor: number,
  hariMulai = 1,
  kategoriStr = "",
  statusPengalaman: StatusPengalaman = "mubtadiah",
): EntriHarian[] {
  const entri: EntriHarian[] = [];
  let hariKe = hariMulai;
  let cumJam = 0;

  // ── Pre-compute: untuk tamyiz, tandai bersih yang "di antara dua darah kuat" ──
  // Sebuah fase bersih hanya dihukumi Haid jika fase darah SEBELUM dan SESUDAHNYA
  // keduanya darah kuat. Bersih setelah kuat-sebelum-lemah = Istihadloh.
  const bersihAntaraKuat: boolean[] = new Array(items.length).fill(false);
  if (isTamyiz && tipeAnalisis === "istihadloh") {
    for (let i = 0; i < items.length; i++) {
      if (items[i].tipe !== "bersih") continue;
      let prevKuat = false;
      for (let j = i - 1; j >= 0; j--) {
        if (items[j].tipe === "darah") {
          prevKuat = skorWarnaSifat(items[j] as FaseDarahItem) >= kuatSkor;
          break;
        }
      }
      let nextKuat = false;
      for (let j = i + 1; j < items.length; j++) {
        if (items[j].tipe === "darah") {
          nextKuat = skorWarnaSifat(items[j] as FaseDarahItem) >= kuatSkor;
          break;
        }
      }
      bersihAntaraKuat[i] = prevKuat && nextKuat;
    }
  }

  for (let faseIdx = 0; faseIdx < items.length; faseIdx++) {
    const fase = items[faseIdx];
    const totalJamFase = jamKeFaseItem(fase);
    if (totalJamFase === 0) continue;

    const hariPenuh = Math.floor(totalJamFase / 24);
    const sisaJam = totalJamFase % 24;
    const jumlahSegmen = hariPenuh + (sisaJam > 0 ? 1 : 0);

    for (let seg = 0; seg < jumlahSegmen; seg++) {
      const isPartialDay = seg === jumlahSegmen - 1 && sisaJam > 0;
      const jamSeg = isPartialDay ? sisaJam : 24;
      const jamMulaiSeg = cumJam + seg * 24;

      let hukum: HukumHari;
      let wajibQodloPuasa = false;
      let keterangan: string;

      if (fase.tipe === "darah") {
        const faseDarah = fase as FaseDarahItem;
        const skorFase = skorWarnaSifat(faseDarah);

        if (tipeAnalisis === "haidl_normal") {
          hukum = "haid";
          keterangan = `Darah ${faseDarah.warna} — Haid`;
        } else if (tipeAnalisis === "istihadloh") {
          if (isTamyiz) {
            // Golongan 1 & 3 (Mumayyizah): darah kuat = Haid, darah lemah = Istihadloh
            if (skorFase >= kuatSkor) {
              hukum = "haid";
              keterangan = `Darah kuat (${faseDarah.warna}) — Haid`;
            } else {
              hukum = "istihadloh";
              keterangan = `Darah lemah (${faseDarah.warna}) — Istihadloh`;
            }
          } else if (ingatKebiasaan === "lupa_semua") {
            // Golongan 5 (Mutahayyiroh Mutlaqoh): haid hanya 24 jam pertama, setelahnya Ihtiyath
            if (jamMulaiSeg < 24) {
              hukum = "haid";
              keterangan = `Darah — Haid (24 jam pertama sebagai batas minimal mutlak)`;
            } else {
              hukum = "ihtiyath";
              keterangan = `Darah — Masa Ihtiyath (lupa total adat, status diragukan)`;
            }
          } else {
            // Golongan 2, 4, 6, 7: Haid = dalam jendela haidJamSebenarnya
            if (haidJamSebenarnya !== null && jamMulaiSeg < haidJamSebenarnya) {
              hukum = "haid";
              keterangan = `Darah — Haid (dalam masa adat/jatah haid hari ke-${Math.floor(jamMulaiSeg / 24) + 1})`;
            } else {
              // Setelah jendela haid habis:
              // Golongan 2 (mubtadiah, !tamyiz) & Golongan 4 (ingat_semua) → Istihadloh pasti
              // Golongan 6 (ingat_durasi) & Golongan 7 (ingat_waktu) → Ihtiyath (masih diragukan)
              if (ingatKebiasaan === "ingat_semua" || statusPengalaman === "mubtadiah") {
                hukum = "istihadloh";
                keterangan = `Darah — Istihadloh (setelah batas masa haid)`;
              } else {
                hukum = "ihtiyath";
                keterangan = `Darah — Masa Ihtiyath (setelah kemungkinan masa haid, waktu pasti tidak diketahui)`;
              }
            }
          }
        } else {
          hukum = "istihadloh";
          keterangan = `Darah — Istihadloh`;
        }
      } else {
        // tipe === "bersih"
        const profilTeks = kategoriStr ? `Berdasarkan profil ${kategoriStr}` : "Berdasarkan analisis hukum";

        if (tipeAnalisis === "haidl_normal") {
          // LOGIKA 1: Haid Terputus-putus — Total rangkaian ≤ 15 hari (Hukum Jam'u/Talfiq)
          // Seluruh jeda bersih ditarik dan dihukumi Haid
          hukum = "haid";
          wajibQodloPuasa = true;
          keterangan = `Jeda bersih dalam rangkaian haid (Hukum Jam'u — total siklus ≤ 15 hari). Masa bersih ini dihukumi HAID. Sholat wajib dikerjakan secara dzahir saat darah tidak terlihat, namun TIDAK SAH — TIDAK PERLU DIQODLO karena kewajiban sholat gugur selama haid. Puasa hari ini TIDAK SAH dan WAJIB DIQODLO.`;
        } else if (tipeAnalisis === "istihadloh") {
          // LOGIKA 2: Mustahadloh Terputus-putus — Total rangkaian > 15 hari
          // Hukum jeda bersih dikembalikan ke masing-masing golongan
          if (isTamyiz) {
            // Golongan 1 (Mubtadi'ah Mumayyizah) & Golongan 3 (Mu'tadah Mumayyizah):
            // Bersih diapit darah kuat–kuat → HAID
            // Bersih diapit kuat–lemah, lemah–kuat, atau lemah–lemah → ISTIHADLOH
            if (bersihAntaraKuat[faseIdx]) {
              hukum = "haid";
              wajibQodloPuasa = true;
              keterangan = `${profilTeks}: Jeda bersih ini diapit dua Darah Kuat (Kuat–Bersih–Kuat). Sesuai aturan Mumayyizah, masa bersih yang mengapit dua darah kuat dihukumi HAID. Sholat wajib dikerjakan secara dzahir (darah tidak terlihat), namun TIDAK SAH — TIDAK PERLU DIQODLO karena kewajiban sholat gugur selama haid. Puasa TIDAK SAH dan WAJIB DIQODLO.`;
            } else {
              hukum = "istihadloh";
              keterangan = `${profilTeks}: Jeda bersih ini tidak diapit dua Darah Kuat (berada di sela darah lemah atau setelah darah kuat berakhir). Dihukumi SUCI/ISTIHADLOH. Sholat SAH. Puasa SAH. Semua ibadah sah.`;
            }
          } else if (ingatKebiasaan === "lupa_semua") {
            // Golongan 5 (Mutahayyiroh Mutlaqoh / Nasiyah):
            // Seluruh masa bersih dianggap masa keraguan → IHTIYATH penuh
            hukum = "ihtiyath";
            keterangan = `${profilTeks}: Anda lupa total adat haid (Mutahayyiroh Mutlaqoh). Seluruh masa bersih di sela-sela darah tetap dianggap masa keraguan — IHTIYATH. Wajib sholat dan puasa, namun wajib mandi besar setiap akan sholat fardlu. Haram berhubungan suami-istri.`;
          } else if (haidJamSebenarnya !== null && jamMulaiSeg < haidJamSebenarnya) {
            // Bersih masih dalam jendela haid (sesuai adat/tamyiz/24 jam pertama):
            // Golongan 2, 4, 6, 7 — bersih di dalam rentang jatah haid → HAID
            const haidHariTotal = Math.round(haidJamSebenarnya / 24);
            const hariIni = Math.floor(jamMulaiSeg / 24) + 1;
            hukum = "haid";
            wajibQodloPuasa = true;
            keterangan = `${profilTeks}: Jeda bersih ini masih dalam rentang jatah haid Anda (hari ke-${hariIni} dari ${haidHariTotal} hari). Dihukumi HAID. Sholat wajib dikerjakan secara dzahir (darah tidak terlihat), namun TIDAK SAH — TIDAK PERLU DIQODLO karena kewajiban sholat gugur selama haid. Puasa TIDAK SAH dan WAJIB DIQODLO.`;
          } else {
            // Bersih di luar jendela haid:
            // Golongan 2 (mubtadiah, !tamyiz) & Golongan 4 (ingat_semua) → ISTIHADLOH (pasti suci)
            // Golongan 6 (ingat_durasi) & Golongan 7 (ingat_waktu) → IHTIYATH (waktu pasti tidak diketahui)
            if (ingatKebiasaan === "ingat_semua" || statusPengalaman === "mubtadiah") {
              hukum = "istihadloh";
              keterangan = `${profilTeks}: Jeda bersih ini berada di luar batas masa haid. Dihukumi SUCI/ISTIHADLOH. Sholat SAH. Puasa SAH. Semua ibadah sah.`;
            } else {
              hukum = "ihtiyath";
              keterangan = `${profilTeks}: Jeda bersih ini berada setelah kemungkinan akhir masa haid (waktu pasti tidak diketahui). Dihukumi Ihtiyath — masa keraguan. Wajib sholat dan puasa, wajib mandi besar setiap akan sholat fardlu. Haram berhubungan suami-istri.`;
            }
          }
        } else {
          hukum = "istihadloh";
          keterangan = `Bersih — Istihadloh`;
        }
      }

      entri.push({
        hari: hariKe,
        tipe: fase.tipe,
        hukum,
        warnaAsli: fase.tipe === "darah" ? (fase as FaseDarahItem).warna : undefined,
        wajibQodloPuasa,
        keterangan,
        jamDiHari: jamSeg,
      });

      hariKe++;
    }

    cumJam += totalJamFase;
  }

  return entri;
}

function analyzeSingleSiklus(
  items: FaseItem[],
  nomorSiklus: number,
  statusPengalaman: StatusPengalaman,
  ingatKebiasaan: IngatKebiasaan,
  kebiasaanHaidHari: number,
): SiklusInfo & {
  haidJamSebenarnya?: number | null;
  kategoriStr?: string;
  aturanIbadah?: AturanIbadah;
  liniMasaSiklus?: EntriHarian[];
} {
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
      liniMasaSiklus: buatLiniMasaHarian(items, "error", false, ingatKebiasaan, null, 0, 1, "", statusPengalaman),
    };
  }

  if (totalJam >= 24 && totalJam <= 360) {
    return {
      nomorSiklus,
      totalJamSiklus: totalJam,
      darahJamSiklus: darahJam,
      bersihDalamJam: bersihJam,
      bersihDalamHaidJam: bersihJam,
      kesimpulan: `HAIDL NORMAL — total ${formatDurasi(totalJam)}${bersihNote}`,
      hukumDetail: `Durasi ${formatDurasi(totalJam)} memenuhi syarat haidl (minimal 24 jam, maksimal 15 hari).${bersihNote}`,
      tipe: "haidl_normal",
      liniMasaSiklus: buatLiniMasaHarian(items, "haidl_normal", false, ingatKebiasaan, null, 0, 1, "", statusPengalaman),
    };
  }

  let isTamyiz = false;
  let kuatJam = 0;
  let lemahJam = 0;
  let kuatSkor = 0;

  if (darahFases.length >= 2) {
    const fase1 = darahFases[0];
    const fase2 = darahFases[1];
    const skor1 = skorWarnaSifat(fase1);
    const skor2 = skorWarnaSifat(fase2);
    const jam1 = jamKeFaseItem(fase1);

    if (skor1 > skor2 && jam1 >= 24 && jam1 <= 360) {
      kuatJam = jam1;
      lemahJam = totalJam - kuatJam;
      kuatSkor = skor1;

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

  let bersihDalamHaidJam = 0;

  if (isTamyiz) {
    // Bersih dihitung sebagai "dalam haid" hanya jika diapit dua darah kuat
    // (kuat–bersih–kuat). Bersih kuat→lemah atau lemah→kuat = Istihadloh.
    const kuatSkorRef = darahFases.length > 0 ? skorWarnaSifat(darahFases[0]) : 0;
    for (let i = 0; i < items.length; i++) {
      if (items[i].tipe !== "bersih") continue;
      let prevKuat = false;
      for (let j = i - 1; j >= 0; j--) {
        if (items[j].tipe === "darah") {
          prevKuat = skorWarnaSifat(items[j] as FaseDarahItem) >= kuatSkorRef;
          break;
        }
      }
      let nextKuat = false;
      for (let j = i + 1; j < items.length; j++) {
        if (items[j].tipe === "darah") {
          nextKuat = skorWarnaSifat(items[j] as FaseDarahItem) >= kuatSkorRef;
          break;
        }
      }
      if (prevKuat && nextKuat) {
        bersihDalamHaidJam += jamKeFaseItem(items[i]);
      }
    }
  } else if (ingatKebiasaan !== "lupa_semua") {
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

  const liniMasaSiklus = buatLiniMasaHarian(
    items,
    "istihadloh",
    isTamyiz,
    ingatKebiasaan,
    haidJamSebenarnya ?? null,
    kuatSkor,
    1,
    kategori,
    statusPengalaman,
  );

  return {
    nomorSiklus,
    totalJamSiklus: totalJam,
    darahJamSiklus: darahJam,
    bersihDalamJam: bersihJam,
    bersihDalamHaidJam,
    kesimpulan: `Istihadloh — total ${formatDurasi(totalJam)} melebihi batas 15 hari`,
    hukumDetail: `${kategori}: ${hukum}`,
    tipe: "istihadloh",
    haidJamSebenarnya,
    kategoriStr: kategori,
    aturanIbadah,
    liniMasaSiklus,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// NIFAS ENGINE
// ═══════════════════════════════════════════════════════════════════════

const NIFAS_MAX_JAM = 1440; // 60 hari × 24 jam
const BERSIH_PEMISAH_JAM = 360; // 15 hari × 24 jam

interface KategoriNifasResult {
  kategori: string;
  hukum: string;
  nifasJamSebenarnya: number | null;
  isLahzhotan: boolean;
  aturanIbadah?: AturanIbadah;
}

function tentukanKategoriNifasIstihadloh(
  statusPengalaman: StatusPengalaman,
  isTamyiz: boolean,
  ingatKebiasaan: IngatKebiasaan,
  kebiasaanNifasHari: number,
  kuatJam: number,
): KategoriNifasResult {
  const kuatLabel = formatDurasi(kuatJam);

  if (statusPengalaman === "mubtadiah") {
    if (isTamyiz) {
      return {
        kategori: "Mubtadi'ah Mumayyizah Finnifas (Golongan 1)",
        hukum: `${kuatLabel} darah kuat adalah NIFAS. Selebihnya adalah ISTIHADLOH.`,
        nifasJamSebenarnya: kuatJam,
        isLahzhotan: false,
      };
    } else {
      return {
        kategori: "Mubtadi'ah Ghoiru Mumayyizah Finnifas (Golongan 2)",
        hukum: "Nifas hanya sekejap (lahzhotan) di awal melahirkan — satu darah tidak dapat dibedakan kuat/lemahnya. Selebihnya adalah ISTIHADLOH.",
        nifasJamSebenarnya: 24,
        isLahzhotan: true,
      };
    }
  } else {
    if (isTamyiz) {
      return {
        kategori: "Mu'tadah Mumayyizah Finnifas (Golongan 3)",
        hukum: `Hukum mengikuti Tamyiz (bukan adat lama). ${kuatLabel} darah kuat adalah NIFAS. Selebihnya adalah ISTIHADLOH.`,
        nifasJamSebenarnya: kuatJam,
        isLahzhotan: false,
      };
    } else {
      if (ingatKebiasaan === "ingat_semua") {
        return {
          kategori: "Mu'tadah Ghoiru Mumayyizah Finnifas (Golongan 4)",
          hukum: `Dikembalikan ke adat nifas terakhir. ${kebiasaanNifasHari} hari pertama adalah NIFAS. Selebihnya adalah ISTIHADLOH.`,
          nifasJamSebenarnya: kebiasaanNifasHari * 24,
          isLahzhotan: false,
          aturanIbadah: {
            judul: "Aturan Ibadah (Mu'tadah Ghoiru Mumayyizah Finnifas)",
            wajib: [
              `Selama ${kebiasaanNifasHari} hari pertama (masa adat nifas): berlaku hukum nifas — haram sholat, puasa, jima', membaca Al-Qur'an, menyentuh mushaf, dan berdiam di masjid.`,
              `Setelah masa adat ${kebiasaanNifasHari} hari selesai: wajib mandi besar (mandi wajib) segera.`,
              "Pada hari-hari istihadloh setelah masa adat: wajib sholat dan puasa, serta halal berhubungan suami-istri — gunakan tata cara bersuci mustahadloh.",
            ],
            haram: [
              `Selama ${kebiasaanNifasHari} hari pertama: sholat, puasa, jima', membaca Al-Qur'an, menyentuh mushaf, dan berdiam di masjid.`,
            ],
          },
        };
      } else if (ingatKebiasaan === "ingat_durasi") {
        return {
          kategori: "Mutahayyiroh Zakiroh Qodron La Waqtan Finnifas (Golongan 5)",
          hukum: `Ingat durasi nifas (${kebiasaanNifasHari} hari), namun lupa kapan tepatnya mulai. Nifas ditetapkan ${kebiasaanNifasHari} hari pada waktu yang paling diyakini.`,
          nifasJamSebenarnya: kebiasaanNifasHari * 24,
          isLahzhotan: false,
          aturanIbadah: {
            judul: "Aturan Ibadah (Ingat Durasi, Lupa Waktu Mulai)",
            wajib: [
              "Pada hari-hari yang diragukan (mungkin nifas atau suci): wajib sholat dan puasa.",
              "Wajib mandi besar setiap akan sholat fardlu pada hari-hari yang diragukan.",
            ],
            haram: [
              "Bersetubuh (jima') pada hari-hari yang diragukan.",
              "Membaca Al-Qur'an di luar sholat pada hari-hari yang diragukan.",
              "Menyentuh atau membawa mushaf pada hari-hari yang diragukan.",
              "Berdiam di masjid pada hari-hari yang diragukan.",
            ],
          },
        };
      } else if (ingatKebiasaan === "ingat_waktu") {
        return {
          kategori: "Mutahayyiroh Zakiroh Waqtan La Qodron Finnifas (Golongan 6)",
          hukum: "Ingat kapan mulai nifas, namun lupa durasi. Nifas ditetapkan hanya sekejap (lahzhotan) di awal yang diyakini. Selebihnya adalah masa Ihtiyath.",
          nifasJamSebenarnya: 24,
          isLahzhotan: true,
          aturanIbadah: {
            judul: "Aturan Ibadah (Ingat Waktu Mulai, Lupa Durasi)",
            wajib: [
              "Hari pertama (sekejap lahzhotan yang diyakini awal nifas): berlaku hukum nifas penuh.",
              "Hari-hari setelahnya yang diragukan: wajib sholat dan puasa.",
              "Wajib mandi besar setiap akan sholat fardlu pada hari-hari yang diragukan.",
            ],
            haram: [
              "Bersetubuh (jima') pada hari-hari yang diragukan.",
              "Membaca Al-Qur'an di luar sholat pada hari-hari yang diragukan.",
              "Menyentuh atau membawa mushaf pada hari-hari yang diragukan.",
              "Berdiam di masjid pada hari-hari yang diragukan.",
            ],
          },
        };
      } else {
        return {
          kategori: "Mutahayyiroh Mutlaqoh Finnifas (Golongan 7)",
          hukum: "Lupa total kapan mulai dan berapa lama nifas. Nifas ditetapkan hanya sekejap (lahzhotan) di awal melahirkan. Seluruh sisanya adalah masa Ihtiyath.",
          nifasJamSebenarnya: 24,
          isLahzhotan: true,
          aturanIbadah: {
            judul: "Aturan Ibadah Ihtiyath Penuh (Mutahayyiroh Mutlaqoh Nifas)",
            wajib: [
              "Wajib sholat, puasa, dan ibadah wajib lainnya — dihukumi seperti orang suci dalam hal kewajiban.",
              "Wajib mandi besar setiap akan sholat fardlu.",
            ],
            haram: [
              "Bersetubuh (jima') — haram hingga status nifas jelas.",
              "Membaca Al-Qur'an di luar sholat.",
              "Menyentuh atau membawa mushaf.",
              "Berdiam di masjid (i'tikaf).",
            ],
          },
        };
      }
    }
  }
}

/**
 * Lini masa harian khusus Nifas.
 * Berbeda dari haid: label "nifas" (bukan "haid"), batas max 60 hari,
 * jeda bersih dalam nifas = an-naqo' fi khilalin nifas.
 */
function buatLiniMasaHarianNifas(
  items: FaseItem[],
  tipeAnalisis: "nifas_normal" | "nifas_istihadloh" | "nifas_error",
  isTamyiz: boolean,
  ingatKebiasaan: IngatKebiasaan,
  nifasJamSebenarnya: number | null,
  kuatSkor: number,
  statusPengalaman: StatusPengalaman,
  kategoriStr: string,
  hariMulai = 1,
): EntriHarian[] {
  const entri: EntriHarian[] = [];
  let hariKe = hariMulai;
  let cumJam = 0;

  const bersihAntaraKuat: boolean[] = new Array(items.length).fill(false);
  if (isTamyiz && tipeAnalisis === "nifas_istihadloh") {
    for (let i = 0; i < items.length; i++) {
      if (items[i].tipe !== "bersih") continue;
      let prevKuat = false;
      for (let j = i - 1; j >= 0; j--) {
        if (items[j].tipe === "darah") { prevKuat = skorWarnaSifat(items[j] as FaseDarahItem) >= kuatSkor; break; }
      }
      let nextKuat = false;
      for (let j = i + 1; j < items.length; j++) {
        if (items[j].tipe === "darah") { nextKuat = skorWarnaSifat(items[j] as FaseDarahItem) >= kuatSkor; break; }
      }
      bersihAntaraKuat[i] = prevKuat && nextKuat;
    }
  }

  for (let faseIdx = 0; faseIdx < items.length; faseIdx++) {
    const fase = items[faseIdx];
    const totalJamFase = jamKeFaseItem(fase);
    if (totalJamFase === 0) continue;

    const hariPenuh = Math.floor(totalJamFase / 24);
    const sisaJam = totalJamFase % 24;
    const jumlahSegmen = hariPenuh + (sisaJam > 0 ? 1 : 0);

    for (let seg = 0; seg < jumlahSegmen; seg++) {
      const isPartialDay = seg === jumlahSegmen - 1 && sisaJam > 0;
      const jamSeg = isPartialDay ? sisaJam : 24;
      const jamMulaiSeg = cumJam + seg * 24;

      let hukum: HukumHari;
      let wajibQodloPuasa = false;
      let keterangan: string;
      const profilTeks = kategoriStr ? `Berdasarkan profil ${kategoriStr}` : "Berdasarkan analisis hukum";

      if (fase.tipe === "darah") {
        const faseDarah = fase as FaseDarahItem;
        const skorFase = skorWarnaSifat(faseDarah);

        if (tipeAnalisis === "nifas_normal") {
          hukum = "nifas";
          keterangan = `Darah ${faseDarah.warna} — Nifas`;
        } else if (tipeAnalisis === "nifas_istihadloh") {
          if (isTamyiz) {
            // Golongan 1 & 3: darah kuat = Nifas, darah lemah = Istihadloh
            if (skorFase >= kuatSkor) {
              hukum = "nifas";
              keterangan = `Darah kuat (${faseDarah.warna}) — Nifas`;
            } else {
              hukum = "istihadloh";
              keterangan = `Darah lemah (${faseDarah.warna}) — Istihadloh`;
            }
          } else if (ingatKebiasaan === "lupa_semua") {
            // Golongan 7: nifas hanya sekejap (24 jam pertama), setelahnya Ihtiyath
            if (jamMulaiSeg < 24) {
              hukum = "nifas";
              keterangan = `Darah — Nifas (sekejap/lahzhotan di awal melahirkan)`;
            } else {
              hukum = "ihtiyath";
              keterangan = `Darah — Masa Ihtiyath (Mutahayyiroh Mutlaqoh Nifas)`;
            }
          } else {
            // Golongan 2, 4, 5, 6: dalam jendela nifasJamSebenarnya = nifas
            if (nifasJamSebenarnya !== null && jamMulaiSeg < nifasJamSebenarnya) {
              hukum = "nifas";
              keterangan = `Darah — Nifas (dalam masa nifas hari ke-${Math.floor(jamMulaiSeg / 24) + 1})`;
            } else {
              if (ingatKebiasaan === "ingat_semua" || statusPengalaman === "mubtadiah") {
                hukum = "istihadloh";
                keterangan = `Darah — Istihadloh (setelah batas masa nifas)`;
              } else {
                hukum = "ihtiyath";
                keterangan = `Darah — Masa Ihtiyath (setelah kemungkinan akhir nifas, waktu pasti tidak diketahui)`;
              }
            }
          }
        } else {
          hukum = "istihadloh";
          keterangan = `Darah — Istihadloh`;
        }
      } else {
        // tipe === "bersih"
        if (tipeAnalisis === "nifas_normal") {
          // An-naqo' fi khilalin nifas: jeda bersih < 15 hari dalam nifas = nifas
          hukum = "nifas";
          wajibQodloPuasa = true;
          keterangan = `Jeda bersih dalam rangkaian nifas (An-naqo' fi khilalin nifas). Masa bersih ini dihukumi NIFAS karena darah keluar kembali sebelum 15 hari suci penuh. Sholat wajib dikerjakan secara dzahir saat darah tidak terlihat, namun TIDAK SAH — TIDAK PERLU DIQODLO karena kewajiban sholat gugur selama nifas. Puasa hari ini TIDAK SAH dan WAJIB DIQODLO.`;
        } else if (tipeAnalisis === "nifas_istihadloh") {
          if (isTamyiz) {
            // Golongan 1 & 3: bersih diapit darah kuat–kuat → Nifas
            if (bersihAntaraKuat[faseIdx]) {
              hukum = "nifas";
              wajibQodloPuasa = true;
              keterangan = `${profilTeks}: Jeda bersih ini diapit dua Darah Kuat (Kuat–Bersih–Kuat). Sesuai aturan Mumayyizah Nifas, dihukumi NIFAS. Sholat wajib dikerjakan secara dzahir, namun TIDAK SAH — TIDAK PERLU DIQODLO. Puasa TIDAK SAH dan WAJIB DIQODLO.`;
            } else {
              hukum = "istihadloh";
              keterangan = `${profilTeks}: Jeda bersih ini tidak diapit dua Darah Kuat. Dihukumi SUCI/ISTIHADLOH. Sholat SAH. Puasa SAH.`;
            }
          } else if (ingatKebiasaan === "lupa_semua") {
            // Golongan 7: seluruh masa bersih = Ihtiyath
            hukum = "ihtiyath";
            keterangan = `${profilTeks}: Lupa total adat nifas (Mutahayyiroh Mutlaqoh). Seluruh masa bersih di sela darah dianggap masa keraguan — IHTIYATH. Wajib sholat dan puasa, wajib mandi besar setiap akan sholat fardlu. Haram jima'.`;
          } else if (nifasJamSebenarnya !== null && jamMulaiSeg < nifasJamSebenarnya) {
            // Bersih dalam rentang jatah nifas
            const nifasHariTotal = Math.round(nifasJamSebenarnya / 24);
            const hariIni = Math.floor(jamMulaiSeg / 24) + 1;
            hukum = "nifas";
            wajibQodloPuasa = true;
            keterangan = `${profilTeks}: Jeda bersih ini masih dalam rentang jatah nifas (hari ke-${hariIni} dari ${nifasHariTotal} hari). Dihukumi NIFAS. Sholat wajib dikerjakan secara dzahir, namun TIDAK SAH — TIDAK PERLU DIQODLO. Puasa TIDAK SAH dan WAJIB DIQODLO.`;
          } else {
            // Bersih di luar jendela nifas
            if (ingatKebiasaan === "ingat_semua" || statusPengalaman === "mubtadiah") {
              hukum = "istihadloh";
              keterangan = `${profilTeks}: Jeda bersih di luar batas masa nifas. Dihukumi SUCI/ISTIHADLOH. Sholat SAH. Puasa SAH.`;
            } else {
              hukum = "ihtiyath";
              keterangan = `${profilTeks}: Jeda bersih setelah kemungkinan akhir nifas (waktu pasti tidak diketahui). IHTIYATH. Wajib sholat dan puasa, wajib mandi besar setiap akan sholat fardlu. Haram jima'.`;
            }
          }
        } else {
          hukum = "istihadloh";
          keterangan = `Bersih — Istihadloh`;
        }
      }

      entri.push({
        hari: hariKe,
        tipe: fase.tipe,
        hukum,
        warnaAsli: fase.tipe === "darah" ? (fase as FaseDarahItem).warna : undefined,
        wajibQodloPuasa,
        keterangan,
        jamDiHari: jamSeg,
      });

      hariKe++;
    }

    cumJam += totalJamFase;
  }

  return entri;
}

/**
 * Hutang ibadah masa penantian untuk istihadloh nifas.
 * Penantian 60 hari (bukan 15 hari seperti haid).
 */
function kalkHutangIbadahNifas(
  nifasJamSebenarnya: number | null,
  kategori: string,
  isBulanPertama: boolean,
): string {
  if (!isBulanPertama) {
    return `Karena Anda sudah mengetahui adat nifas dari pengalaman sebelumnya, tidak diperlukan masa penantian 60 hari. Anda langsung mandi wajib begitu masa nifas berakhir. Tidak ada hutang sholat/puasa masa penantian.`;
  }
  if (nifasJamSebenarnya === null) {
    return `Ini adalah pertama kali istihadloh nifas Anda. Karena durasi nifas yang sebenarnya tidak dapat dipastikan, besaran hutang ibadah tidak dapat dihitung otomatis. Anda termasuk ${kategori}. Harap berkonsultasi dengan ustadzah atau kyai setempat.`;
  }

  const penantianJam = NIFAS_MAX_JAM;
  const istihadlohDalamPenantian = penantianJam - nifasJamSebenarnya;
  if (istihadlohDalamPenantian <= 0) return "";

  const hutangHari = istihadlohDalamPenantian / 24;
  const hutangTeks = istihadlohDalamPenantian % 24 === 0
    ? `${hutangHari} hari`
    : `${hutangHari.toFixed(1)} hari (${istihadlohDalamPenantian} jam)`;
  const nifasHari = nifasJamSebenarnya / 24;
  const nifasTeks = nifasJamSebenarnya % 24 === 0 ? `${nifasHari} hari` : `${nifasHari.toFixed(1)} hari`;

  return `Ini adalah pertama kali istihadloh nifas Anda. Karena harus menunggu 60 hari untuk memastikan status, hari-hari yang ternyata istihadloh namun terlanjur ditinggalkan wajib diqodlo'. Dari 60 hari masa penantian, yang dihukumi nifas sesungguhnya hanya ${nifasTeks}. Sisa ${hutangTeks} (hari ke-${Math.ceil(nifasJamSebenarnya / 24) + 1} s/d hari ke-60) adalah masa istihadloh yang ibadahnya Anda tinggalkan. Anda memiliki hutang sholat (dan puasa jika bertepatan Ramadhan) selama ${hutangTeks} yang wajib diqodlo'.`;
}

/**
 * Parsing fase nifas:
 * - Hitung jeda awal (antara melahirkan dan darah pertama)
 * - Kelompokkan fase nifas (jeda bersih < 15 hari tetap dalam nifas)
 * - Fase setelah jeda bersih ≥ 15 hari → haidSetelahItems (darah setelah suci = haid)
 */
function parseFaseNifas(daftarFase: FaseItem[]): {
  jedaAwalJam: number;
  nifasItems: FaseItem[];
  haidSetelahItems: FaseItem[];
} {
  let jedaAwalJam = 0;
  let firstBloodIdx = -1;

  for (let i = 0; i < daftarFase.length; i++) {
    if (daftarFase[i].tipe === "bersih") {
      jedaAwalJam += jamKeFaseItem(daftarFase[i]);
    } else {
      firstBloodIdx = i;
      break;
    }
  }

  if (firstBloodIdx === -1) {
    return { jedaAwalJam, nifasItems: [], haidSetelahItems: [] };
  }

  const nifasItems: FaseItem[] = [];
  const haidSetelahItems: FaseItem[] = [];
  let inNifas = true;

  for (let i = firstBloodIdx; i < daftarFase.length; i++) {
    const fase = daftarFase[i];
    const jam = jamKeFaseItem(fase);

    if (!inNifas) {
      haidSetelahItems.push(fase);
      continue;
    }

    if (fase.tipe === "bersih" && jam >= BERSIH_PEMISAH_JAM) {
      // Bersih ≥ 15 hari = suci penuh → darah setelahnya adalah haid
      inNifas = false;
    } else {
      nifasItems.push(fase);
    }
  }

  return { jedaAwalJam, nifasItems, haidSetelahItems };
}

/**
 * Analisis satu siklus nifas (setelah parseFaseNifas).
 */
function analyzeSiklusNifas(
  nifasItems: FaseItem[],
  statusPengalaman: StatusPengalaman,
  ingatKebiasaan: IngatKebiasaan,
  kebiasaanNifasHari: number,
): {
  tipe: "nifas_normal" | "nifas_istihadloh" | "nifas_error";
  totalJamSiklus: number;
  darahJam: number;
  bersihJam: number;
  bersihDalamNifasJam: number;
  kategori: string;
  hukum: string;
  nifasJamSebenarnya: number | null;
  isLahzhotan: boolean;
  aturanIbadah?: AturanIbadah;
  liniMasaHarian: EntriHarian[];
} {
  const darahFases = nifasItems.filter((f): f is FaseDarahItem => f.tipe === "darah");
  const bersihFases = nifasItems.filter((f): f is MasaBersihItem => f.tipe === "bersih");
  const darahJam = darahFases.reduce((s, f) => s + jamKeFaseItem(f), 0);
  const bersihJam = bersihFases.reduce((s, f) => s + jamKeFaseItem(f), 0);
  const totalJam = darahJam + bersihJam;

  if (darahJam === 0) {
    return {
      tipe: "nifas_error", totalJamSiklus: totalJam, darahJam, bersihJam,
      bersihDalamNifasJam: 0, kategori: "", hukum: "Tidak ada darah nifas.",
      nifasJamSebenarnya: null, isLahzhotan: false, liniMasaHarian: [],
    };
  }

  if (totalJam <= NIFAS_MAX_JAM) {
    // NIFAS NORMAL — total ≤ 60 hari
    const bersihNote = bersihJam > 0
      ? ` Jeda bersih ${formatDurasi(bersihJam)} dihukumi nifas (An-naqo' fi khilalin nifas).`
      : "";
    return {
      tipe: "nifas_normal",
      totalJamSiklus: totalJam,
      darahJam,
      bersihJam,
      bersihDalamNifasJam: bersihJam,
      kategori: bersihJam > 0 ? "Nifas Normal (dengan An-naqo')" : "Nifas Normal",
      hukum: `Total nifas ${formatDurasi(totalJam)} — dalam batas 60 hari 60 malam.${bersihNote}`,
      nifasJamSebenarnya: totalJam,
      isLahzhotan: false,
      liniMasaHarian: buatLiniMasaHarianNifas(
        nifasItems, "nifas_normal", false, ingatKebiasaan, totalJam, 0, statusPengalaman, "",
      ),
    };
  }

  // NIFAS ISTIHADLOH — total > 60 hari
  let isTamyiz = false;
  let kuatJam = 0;
  let kuatSkor = 0;

  if (darahFases.length >= 2) {
    const skor1 = skorWarnaSifat(darahFases[0]);
    const skor2 = skorWarnaSifat(darahFases[1]);
    const jam1 = jamKeFaseItem(darahFases[0]);
    if (skor1 > skor2 && jam1 >= 24 && jam1 <= NIFAS_MAX_JAM) {
      kuatJam = jam1;
      kuatSkor = skor1;
      const adaFase3Kuat = darahFases.length > 2 && skorWarnaSifat(darahFases[2]) >= skor1;
      isTamyiz = !adaFase3Kuat;
    }
  }

  const { kategori, hukum, nifasJamSebenarnya, isLahzhotan, aturanIbadah } =
    tentukanKategoriNifasIstihadloh(statusPengalaman, isTamyiz, ingatKebiasaan, kebiasaanNifasHari, kuatJam);

  // Hitung bersihDalamNifasJam
  let bersihDalamNifasJam = 0;
  if (isTamyiz) {
    const kuatRef = darahFases.length > 0 ? skorWarnaSifat(darahFases[0]) : 0;
    for (let i = 0; i < nifasItems.length; i++) {
      if (nifasItems[i].tipe !== "bersih") continue;
      let prevKuat = false;
      for (let j = i - 1; j >= 0; j--) {
        if (nifasItems[j].tipe === "darah") { prevKuat = skorWarnaSifat(nifasItems[j] as FaseDarahItem) >= kuatRef; break; }
      }
      let nextKuat = false;
      for (let j = i + 1; j < nifasItems.length; j++) {
        if (nifasItems[j].tipe === "darah") { nextKuat = skorWarnaSifat(nifasItems[j] as FaseDarahItem) >= kuatRef; break; }
      }
      if (prevKuat && nextKuat) bersihDalamNifasJam += jamKeFaseItem(nifasItems[i]);
    }
  } else if (ingatKebiasaan !== "lupa_semua" && nifasJamSebenarnya) {
    let cumJ = 0;
    for (const fase of nifasItems) {
      const jam = jamKeFaseItem(fase);
      if (fase.tipe === "bersih") {
        bersihDalamNifasJam += Math.max(0, Math.min(cumJ + jam, nifasJamSebenarnya) - Math.min(cumJ, nifasJamSebenarnya));
      }
      cumJ += jam;
    }
  }

  return {
    tipe: "nifas_istihadloh",
    totalJamSiklus: totalJam,
    darahJam,
    bersihJam,
    bersihDalamNifasJam,
    kategori,
    hukum,
    nifasJamSebenarnya,
    isLahzhotan,
    aturanIbadah,
    liniMasaHarian: buatLiniMasaHarianNifas(
      nifasItems, "nifas_istihadloh", isTamyiz, ingatKebiasaan,
      nifasJamSebenarnya, kuatSkor, statusPengalaman, kategori,
    ),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// HAID ENGINE — parseSiklus
// ═══════════════════════════════════════════════════════════════════════

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
    const { jedaAwalJam, nifasItems, haidSetelahItems } = parseFaseNifas(daftarFase);

    // Darah baru muncul setelah ≥ 15 hari suci → itu haid, bukan nifas
    if (jedaAwalJam >= BERSIH_PEMISAH_JAM) {
      return {
        kesimpulan: "Darah Haid (bukan Nifas)",
        kategori: "Haid setelah suci sempurna",
        hukumHaidl: `Darah baru keluar setelah ${formatDurasi(jedaAwalJam)} dari melahirkan — melampaui batas 15 hari suci. Darah ini BUKAN nifas, melainkan dihukumi HAID (jika memenuhi syarat minimal 24 jam dan maksimal 15 hari).`,
        hukumIstihadloh: "",
        qodloSholatMulai: qodloMulai,
        qodloSholat: qodloBerhenti,
        hutangIbadah: "",
        panduanBersuci: "",
        tipeHasil: "haidl_normal",
      };
    }

    if (nifasItems.length === 0 || !nifasItems.some((f) => f.tipe === "darah")) {
      return {
        kesimpulan: "Tidak ada darah nifas",
        kategori: "",
        hukumHaidl: "",
        hukumIstihadloh: "Tidak ditemukan fase darah nifas yang valid. Pastikan Anda menandai minimal 1 hari darah.",
        qodloSholatMulai: "",
        qodloSholat: "",
        hutangIbadah: "",
        panduanBersuci: "",
        tipeHasil: "error",
      };
    }

    const hasilNifas = analyzeSiklusNifas(nifasItems, statusPengalaman, ingatKebiasaan, kebiasaanHaidHari);
    const haidSetelahNote = haidSetelahItems.length > 0
      ? " Setelah masa suci ≥ 15 hari, darah berikutnya dapat dihukumi haid (perlu analisis terpisah)."
      : "";

    if (hasilNifas.tipe === "nifas_normal") {
      const peringatanAnNaqo: PeringatanJedaSuci | undefined = hasilNifas.bersihDalamNifasJam > 0
        ? {
            totalJedaJam: hasilNifas.bersihDalamNifasJam,
            qodloPuasaHari: Math.ceil(hasilNifas.bersihDalamNifasJam / 24),
            tipeKasus: "haidl_normal",
            statusPuasa: `Puasa yang Anda kerjakan selama jeda bersih (${formatDurasi(hasilNifas.bersihDalamNifasJam)}) TIDAK SAH dan WAJIB DIQODLO sebanyak ${Math.ceil(hasilNifas.bersihDalamNifasJam / 24)} hari. Sebab masa bersih tersebut secara hukum dihukumi NIFAS (An-naqo' fi khilalin nifas) — darah keluar kembali sebelum 15 hari suci penuh terpenuhi.`,
            statusSholat: `Sholat yang Anda kerjakan pada masa bersih sementara tersebut TIDAK SAH secara hukum. Namun, Anda TIDAK BERDOSA mengerjakannya karena secara dzahir wajib sholat saat darah tidak terlihat. Sholat tersebut TIDAK PERLU DIQODLO karena kewajiban sholat gugur selama nifas.`,
          }
        : undefined;

      return {
        kesimpulan: `Semua darah (${formatDurasi(hasilNifas.totalJamSiklus)}) adalah NIFAS`,
        kategori: hasilNifas.kategori,
        hukumHaidl: hasilNifas.hukum + haidSetelahNote,
        hukumIstihadloh: "",
        qodloSholatMulai: qodloMulai,
        qodloSholat: qodloBerhenti,
        hutangIbadah: "",
        peringatanJedaSuci: peringatanAnNaqo,
        panduanBersuci: "",
        tipeHasil: "nifas",
        liniMasaHarian: hasilNifas.liniMasaHarian.length > 0 ? hasilNifas.liniMasaHarian : undefined,
      };
    }

    // Nifas Istihadloh (total > 60 hari)
    const hutangNifas = kalkHutangIbadahNifas(
      hasilNifas.nifasJamSebenarnya,
      hasilNifas.kategori,
      isBulanPertamaIstihadloh,
    );

    let peringatanIstNifas: PeringatanJedaSuci | undefined;
    if (hasilNifas.bersihDalamNifasJam > 0) {
      const p = hasilNifas.kategori.includes("Mumayyizah")
        ? buatPeringatanJedaSuciIstihadloh(hasilNifas.bersihDalamNifasJam, "mumayyizah")
        : buatPeringatanJedaSuciIstihadloh(hasilNifas.bersihDalamNifasJam, "adat_haid");
      peringatanIstNifas = {
        ...p,
        statusPuasa: p.statusPuasa.replace(/haid/gi, "nifas"),
        statusSholat: p.statusSholat.replace(/haid/gi, "nifas"),
      };
    }

    return {
      kesimpulan: `Istihadloh Nifas (total ${formatDurasi(hasilNifas.totalJamSiklus)} — melebihi batas maksimal nifas 60 hari 60 malam)`,
      kategori: hasilNifas.kategori,
      hukumHaidl: "",
      hukumIstihadloh: hasilNifas.hukum + haidSetelahNote,
      qodloSholatMulai: qodloMulai,
      qodloSholat: qodloBerhenti,
      hutangIbadah: hutangNifas,
      peringatanJedaSuci: peringatanIstNifas,
      aturanIbadah: hasilNifas.aturanIbadah,
      panduanBersuci: PANDUAN_BERSUCI,
      tipeHasil: "istihadloh",
      liniMasaHarian: hasilNifas.liniMasaHarian.length > 0 ? hasilNifas.liniMasaHarian : undefined,
    };
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

  // Gabungkan lini masa dari semua siklus, offset hari per siklus
  function gabungkanLiniMasa(): EntriHarian[] {
    const semua: EntriHarian[] = [];
    let offsetHari = 0;
    for (const s of daftarSiklusInfo) {
      const lini = s.liniMasaSiklus ?? [];
      for (const e of lini) {
        semua.push({ ...e, hari: e.hari + offsetHari });
      }
      offsetHari += lini.length;
    }
    return semua;
  }

  if (siklus.length === 1 && !adaPemisah) {
    const s = daftarSiklusInfo[0];
    const liniMasaHarian = s.liniMasaSiklus ?? [];

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
        liniMasaHarian: hasBersihItem ? liniMasaHarian : undefined,
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
        liniMasaHarian: liniMasaHarian.length > 0 ? liniMasaHarian : undefined,
      };
    }

    // istihadloh
    const lines = s.hukumDetail.split(": ");
    const kategoriStr = s.kategoriStr ?? lines[0] ?? "";
    const hukumStr = s.kategoriStr
      ? s.hukumDetail.replace(`${s.kategoriStr}: `, "")
      : lines.slice(1).join(": ");

    const hutang = kalkHutangIbadah(s.haidJamSebenarnya ?? null, kategoriStr, isBulanPertamaIstihadloh);

    // Template narasi akhir untuk Mustahadloh dengan adat yang jelas (Golongan 4)
    const totalHari = Math.round(s.totalJamSiklus / 24);
    const adatHari = s.haidJamSebenarnya ? Math.round(s.haidJamSebenarnya / 24) : null;
    let hukumIstihadlohFinal = hukumStr || s.hukumDetail;
    if (adatHari && kategoriStr.includes("Golongan 4")) {
      hukumIstihadlohFinal = `Karena total rangkaian darah Anda adalah ${totalHari} hari, Anda berstatus Mustahadloh. Berdasarkan adat Anda (${adatHari} hari), maka hari ke-1 sampai hari ke-${adatHari} adalah masa Haid Anda. Selebihnya adalah masa Suci/Istihadloh.`;
    }

    return {
      kesimpulan: `Darah Istihadloh (total ${formatDurasi(s.totalJamSiklus)} — melebihi batas maksimal haid 15 hari)`,
      kategori: kategoriStr,
      hukumHaidl: "",
      hukumIstihadloh: hukumIstihadlohFinal,
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
      liniMasaHarian: liniMasaHarian.length > 0 ? liniMasaHarian : undefined,
    };
  }

  // Multi-siklus
  const anyIstihadloh = daftarSiklusInfo.some((s) => s.tipe === "istihadloh" || s.tipe === "error");
  const allHaidl = daftarSiklusInfo.every((s) => s.tipe === "haidl_normal");
  const totalDarahJam = daftarSiklusInfo.reduce((sum, s) => sum + s.darahJamSiklus, 0);

  const totalJedaJamHaidl = daftarSiklusInfo.reduce((sum, s) => sum + s.bersihDalamHaidJam, 0);
  const peringatanJedaSuciMulti = totalJedaJamHaidl > 0
    ? buatPeringatanJedaSuci(totalJedaJamHaidl)
    : undefined;

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
      aturanIbadahMulti = istihadlohSiklus[istihadlohSiklus.length - 1].aturanIbadah;
    }
  }

  const liniMasaGabungan = gabungkanLiniMasa();

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
    tipeHasil: allHaidl ? "haidl_normal" : "istihadloh",
    daftarSiklus: daftarSiklusInfo,
    adaPemisahBersih: adaPemisah,
    liniMasaHarian: liniMasaGabungan.length > 0 ? liniMasaGabungan : undefined,
  };
}
