import { Link } from "wouter";
import { ArrowLeft, Droplets, Clock, AlertCircle, HelpCircle, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// ─── Reusable Components ───────────────────────────────────────────────────

function Badge({ children, color = "primary" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    violet: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
    green: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    red: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${colors[color] ?? colors.primary}`}>
      {children}
    </span>
  );
}

function Contoh({ items }: { items: Array<{ label: string; nilai: string; hukum: "haidl" | "istihadloh" | "nifas" | "ihtiyath" }> }) {
  const warna: Record<string, string> = {
    haidl: "bg-primary/10 border-primary/20 text-primary",
    istihadloh: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300",
    nifas: "bg-violet-50 border-violet-200 text-violet-800 dark:bg-violet-950/30 dark:border-violet-800 dark:text-violet-300",
    ihtiyath: "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300",
  };
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {items.map((it, i) => (
        <div key={i} className={`flex-1 min-w-[80px] rounded-xl border px-3 py-2 text-center text-xs ${warna[it.hukum]}`}>
          <div className="font-semibold">{it.nilai}</div>
          <div className="mt-0.5 opacity-80">{it.label}</div>
        </div>
      ))}
    </div>
  );
}

function InfoBox({ children, color = "amber" }: { children: React.ReactNode; color?: "amber" | "green" | "primary" }) {
  const styles: Record<string, string> = {
    amber: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200",
    green: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-200",
    primary: "bg-primary/5 border-primary/20 text-primary",
  };
  return (
    <div className={`flex gap-2 rounded-xl border p-3 text-sm leading-relaxed mt-3 ${styles[color]}`}>
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function Syarat({ items }: { items: string[] }) {
  return (
    <ol className="mt-2 space-y-1 pl-5 list-decimal text-sm text-muted-foreground">
      {items.map((s, i) => <li key={i} className="leading-relaxed">{s}</li>)}
    </ol>
  );
}

function GolonganCard({
  nomor,
  judul,
  subJudul,
  color = "primary",
  children,
}: {
  nomor: string;
  judul: string;
  subJudul?: string;
  color?: "primary" | "amber" | "violet" | "green" | "red" | "slate";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  const border: Record<string, string> = {
    primary: "border-primary/30",
    amber: "border-amber-300 dark:border-amber-700",
    violet: "border-violet-300 dark:border-violet-700",
    green: "border-green-300 dark:border-green-700",
    red: "border-red-300 dark:border-red-700",
    slate: "border-slate-300 dark:border-slate-600",
  };
  const badge: Record<string, string> = {
    primary: "bg-primary text-primary-foreground",
    amber: "bg-amber-500 text-white",
    violet: "bg-violet-500 text-white",
    green: "bg-green-600 text-white",
    red: "bg-red-500 text-white",
    slate: "bg-slate-500 text-white",
  };

  return (
    <section className={`bg-card border-2 rounded-2xl shadow-sm overflow-hidden ${border[color]}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-muted/30 transition-colors"
      >
        <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${badge[color]}`}>{nomor}</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground text-sm leading-tight">{judul}</div>
          {subJudul && <div className="text-xs text-muted-foreground mt-0.5">{subJudul}</div>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4 border-t border-dashed border-muted">{children}</div>}
    </section>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function Panduan() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/" data-testid="link-back-home">
        <Button variant="ghost" size="sm" className="gap-2 mb-8 -ml-3 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Button>
      </Link>

      {/* Header */}
      <div className="space-y-2 mb-10">
        <h1 className="text-3xl sm:text-4xl font-serif text-foreground" data-testid="guide-title">
          Panduan Fiqh Darah
        </h1>
        <p className="text-muted-foreground text-sm">
          Penjelasan lengkap pembagian Mustahadloh (haidl & nifas) menurut Mazhab Syafi'i beserta hukum, syarat, dan contoh.
        </p>
      </div>

      {/* ── Ringkasan Dasar ─────────────────────────────────────────── */}
      <div className="space-y-3 mb-10">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" /> Istilah Dasar
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: "Mubtadi'ah", desc: "Wanita yang baru pertama kali mengalami haidl (belum punya kebiasaan)." },
            { title: "Mu'tadah", desc: "Wanita yang sudah pernah haidl dan suci sehingga memiliki kebiasaan (adat)." },
            { title: "Mumayyizah (Tamyiz)", desc: "Dapat membedakan darah kuat (hitam/merah/kental/berbau) dan darah lemah (kuning/encer), serta memenuhi 3 syarat tamyiz." },
            { title: "Ghoiru Mumayyizah", desc: "Tidak bisa membedakan sifat darah (satu warna) atau bisa dibedakan namun tidak memenuhi 3 syarat mumayyizah." },
            { title: "Darah Kuat", desc: "Darah yang memiliki ciri dominan: warna hitam/merah tua, kental, atau berbau. Didahulukan sebagai tanda haidl." },
            { title: "Darah Lemah", desc: "Darah dengan ciri kurang dominan: warna kuning/coklat muda, encer, atau tidak berbau." },
            { title: "Mutahayyiroh", desc: "Wanita yang lupa kebiasaan haidlnya secara keseluruhan sehingga tidak bisa memastikan hari haidl dan sucinya." },
            { title: "Aqollu Thuhri", desc: "Masa suci minimum antara dua haidl, yaitu 15 hari 15 malam." },
          ].map(item => (
            <div key={item.title} className="bg-background rounded-xl p-4 border shadow-sm">
              <h3 className="font-semibold text-sm text-primary mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Haidl / Nifas / Istihadloh ──────────────────────────────── */}
      <div className="space-y-3 mb-10">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Droplets className="w-4 h-4 text-primary" /> Jenis Darah Wanita
        </h2>
        <div className="grid gap-3">
          <div className="bg-card border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Droplets className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-primary">Haidl (Menstruasi)</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Darah yang keluar dari rahim wanita dalam keadaan sehat, bukan karena melahirkan atau sakit.</p>
            <div className="grid grid-cols-3 gap-2">
              {[{ label: "Minimal", val: "24 jam" }, { label: "Maksimal", val: "15 hari" }, { label: "Suci Minimal", val: "15 hari" }].map(i => (
                <div key={i.label} className="text-center p-2.5 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="text-sm font-bold text-primary">{i.val}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{i.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-violet-500" />
              </div>
              <h3 className="font-semibold text-violet-600 dark:text-violet-400">Nifas</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Darah yang keluar setelah kosongnya rahim dari kehamilan (setelah melahirkan).</p>
            <div className="grid grid-cols-3 gap-2">
              {[{ label: "Minimal", val: "Sekejap" }, { label: "Kebiasaan", val: "40 hari" }, { label: "Maksimal", val: "60 hari" }].map(i => (
                <div key={i.label} className="text-center p-2.5 rounded-xl bg-violet-500/5 border border-violet-200 dark:border-violet-800">
                  <div className="text-sm font-bold text-violet-600 dark:text-violet-400">{i.val}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{i.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="font-semibold text-amber-600 dark:text-amber-400">Istihadloh</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Darah penyakit yang keluar di luar waktu haidl dan nifas, atau melebihi batas maksimalnya.</p>
            <InfoBox color="amber">
              Wanita istihadloh <strong>tetap wajib sholat dan puasa</strong>. Setiap akan sholat fardlu ia wajib bersuci (wudlu, atau mandi jika diperlukan).
            </InfoBox>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MUSTAHADLOH HAIDL — 7 GOLONGAN
         ══════════════════════════════════════════════════════════════ */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Pembagian Mustahadloh Haidl (7 Golongan)</h2>
        </div>
        <p className="text-sm text-muted-foreground -mt-1">
          Wanita yang mengalami istihadloh haidl (darah keluar melebihi 15 hari) dibagi menjadi tujuh golongan.
        </p>

        {/* 01 */}
        <GolonganCard nomor="01" judul="Mubtadi'ah Mumayyizah" subJudul="Baru pertama haidl · Dapat membedakan darah" color="primary">
          <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
            Wanita yang baru pertama kali mengalami haidl, darah yang keluar melebihi 15 hari, dan darah dapat dibedakan antara yang <strong>kuat</strong> dan <strong>lemah</strong>.
          </p>

          <div>
            <p className="text-sm font-semibold text-foreground">Hukum Darah:</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm text-center">
                <div className="font-bold text-primary">Haidl</div>
                <div className="text-xs text-muted-foreground mt-1">Darah Kuat</div>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-sm text-center">
                <div className="font-bold text-amber-700 dark:text-amber-400">Istihadloh</div>
                <div className="text-xs text-muted-foreground mt-1">Darah Lemah</div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">3 Syarat Mumayyizah:</p>
            <Syarat items={[
              "Darah kuat tidak kurang dari sehari semalam (24 jam).",
              "Darah kuat tidak melebihi 15 hari 15 malam.",
              "Darah lemah tidak kurang dari 15 hari 15 malam dan keluar secara terus-menerus. (Syarat ini hanya berlaku jika ada darah kuat kedua — untuk menentukan apakah darah kuat kedua juga dihukumi haidl. Jika tidak ada darah kuat kedua, cukup syarat 1 dan 2.)",
            ]} />
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Contoh-Contoh:</p>

            <p className="text-xs text-muted-foreground font-medium mt-2">Contoh 1 — Kuat lalu Lemah (syarat 1 & 2 cukup):</p>
            <Contoh items={[
              { label: "Darah Kuat", nilai: "5 hari", hukum: "haidl" },
              { label: "Darah Lemah", nilai: "25 hari", hukum: "istihadloh" },
            ]} />

            <p className="text-xs text-muted-foreground font-medium mt-3">Contoh 2 — Kuat-Lemah-Kuat (lemah ≥ 15 hari → syarat 3 terpenuhi, kedua kuat = haidl):</p>
            <Contoh items={[
              { label: "Darah Kuat 1", nilai: "3 hari", hukum: "haidl" },
              { label: "Darah Lemah", nilai: "16 hari", hukum: "istihadloh" },
              { label: "Darah Kuat 2", nilai: "7 hari", hukum: "haidl" },
            ]} />
            <p className="text-xs text-muted-foreground mt-1">Haidl = 3 + 7 = 10 hari. Lemah 16 hari = istihadloh.</p>

            <p className="text-xs text-muted-foreground font-medium mt-3">Contoh 3 — Kuat lalu Lemah (tanpa kuat kedua):</p>
            <Contoh items={[
              { label: "Darah Kuat", nilai: "10 hari", hukum: "haidl" },
              { label: "Darah Lemah", nilai: "10 hari", hukum: "istihadloh" },
            ]} />

            <p className="text-xs text-muted-foreground font-medium mt-3">Contoh 4 — Kuat-Lemah-Kuat (lemah &lt; 15 hari → syarat 3 tidak terpenuhi, kuat kedua bukan haidl):</p>
            <Contoh items={[
              { label: "Darah Kuat 1", nilai: "8 hari", hukum: "haidl" },
              { label: "Darah Lemah", nilai: "8 hari", hukum: "istihadloh" },
              { label: "Darah Kuat 2", nilai: "8 hari", hukum: "istihadloh" },
            ]} />
            <p className="text-xs text-muted-foreground mt-1">Lemah (8 hari) &lt; 15 hari → syarat 3 tidak terpenuhi. Haidl hanya darah kuat pertama (8 hari).</p>
          </div>

          <div className="rounded-xl bg-muted/60 border p-4">
            <p className="text-xs font-semibold text-foreground mb-2">📌 Kaidah Catatan — Pola Kuat-Lemah-Kuat (Lemah &lt; 15 hari)</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Apabila darah lemah diapit dua darah kuat dan darah lemah &lt; 15 hari:
            </p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1 pl-4 list-disc">
              <li><strong>Kuat1 + Lemah ≤ 15 hari</strong> → kuat1 <em>dan</em> lemah = haidl; kuat2 = istihadloh.</li>
              <li><strong>Kuat1 + Lemah &gt; 15 hari</strong> → hanya kuat1 = haidl; lemah + kuat2 = istihadloh.</li>
            </ul>
            <p className="text-xs text-muted-foreground font-medium mt-2">Contoh (kuat1+lemah = 8+7 = 15 ≤ 15):</p>
            <Contoh items={[
              { label: "Darah Kuat 1", nilai: "8 hari", hukum: "haidl" },
              { label: "Darah Lemah", nilai: "7 hari", hukum: "haidl" },
              { label: "Darah Kuat 2", nilai: "8 hari", hukum: "istihadloh" },
            ]} />
            <p className="text-xs text-muted-foreground mt-1">Total haidl = 15 hari (kuat1 + lemah dijumlah tidak melebihi 15 hari).</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Ketentuan Mandi:</p>
            <ul className="text-sm text-muted-foreground mt-1 space-y-1 pl-4 list-disc">
              <li><strong>Bulan pertama:</strong> harus menunggu 15 hari dahulu sebelum mandi.</li>
              <li><strong>Bulan kedua dan seterusnya:</strong> mandi wajib segera saat melihat perpindahan dari darah kuat ke darah lemah.</li>
            </ul>
          </div>
        </GolonganCard>

        {/* 02 */}
        <GolonganCard nomor="02" judul="Mubtadi'ah Ghoiru Mumayyizah" subJudul="Baru pertama haidl · Tidak bisa membedakan darah" color="amber">
          <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
            Wanita yang baru pertama kali mengalami haidl, darah melebihi 15 hari, namun darahnya <strong>satu warna/sifat</strong> (tidak dapat dibedakan kuat-lemah), atau bisa dibedakan tetapi tidak memenuhi 3 syarat mumayyizah. Dan ia <strong>ingat betul kapan mulai keluar darah</strong>.
          </p>

          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm">
            <span className="font-semibold text-primary">Hukum: </span>
            <span className="text-muted-foreground">Sehari semalam (24 jam) pertama = Haidl. Selebihnya (29 hari) = Istihadloh. Berlaku setiap bulan.</span>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Contoh-Contoh:</p>

            <p className="text-xs text-muted-foreground font-medium mt-2">Contoh 1 — Seluruh darah satu sifat selama 1 bulan:</p>
            <Contoh items={[
              { label: "Hari ke-1", nilai: "1 hari", hukum: "haidl" },
              { label: "Hari ke-2 s/d akhir", nilai: "29 hari", hukum: "istihadloh" },
            ]} />

            <p className="text-xs text-muted-foreground font-medium mt-3">Contoh 2 — Darah kuat &lt; 24 jam lalu darah lemah (total 25 hari):</p>
            <Contoh items={[
              { label: "Darah Kuat", nilai: "20 jam", hukum: "haidl" },
              { label: "Darah Lemah", nilai: "sisa", hukum: "istihadloh" },
            ]} />
            <p className="text-xs text-muted-foreground mt-1">Darah kuat hanya 20 jam (&lt; 24 jam) → tidak memenuhi syarat mumayyizah. Haidl tetap 1 hari pertama.</p>

            <p className="text-xs text-muted-foreground font-medium mt-3">Contoh 3 — Darah berlangsung 3 bulan:</p>
            <p className="text-xs text-muted-foreground">Tiap awal bulan: 1 hari = haidl. Sisa bulan = istihadloh. Total haidl dalam 3 bulan = 3 hari.</p>

            <p className="text-xs text-muted-foreground font-medium mt-3">Contoh 4 — Darah silih berganti (1 hari kuat, 1 hari lemah dst. selama 30 hari):</p>
            <Contoh items={[
              { label: "Hari ke-1", nilai: "1 hari", hukum: "haidl" },
              { label: "Selebihnya", nilai: "29 hari", hukum: "istihadloh" },
            ]} />
            <p className="text-xs text-muted-foreground mt-1">Darah lemah tidak mengalir terus-menerus selama 15 hari → syarat mumayyizah tidak terpenuhi.</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Ketentuan Mandi & Qodlo':</p>
            <ul className="text-sm text-muted-foreground mt-1 space-y-1 pl-4 list-disc">
              <li><strong>Bulan pertama:</strong> harus menunggu 15 hari sebelum mandi. Wajib mengqodlo' sholat hari ke-2 s/d ke-15 (14 hari).</li>
              <li><strong>Bulan berikutnya:</strong> mandi tidak perlu menunggu 15 hari; cukup saat darah telah genap sehari semalam. Tidak ada hutang sholat.</li>
            </ul>
          </div>
        </GolonganCard>

        {/* 03 */}
        <GolonganCard nomor="03" judul="Mu'tadah Mumayyizah" subJudul="Sudah pernah haidl · Dapat membedakan darah" color="green">
          <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
            Wanita yang sudah pernah haidl dan suci (memiliki kebiasaan/adat), kemudian darahnya melebihi 15 hari, serta darahnya dapat dibedakan kuat-lemah dan memenuhi syarat mumayyizah.
          </p>

          <InfoBox color="green">
            Hukumnya <strong>sama dengan Mubtadi'ah Mumayyizah</strong>: darah kuat = haidl, darah lemah = istihadloh. Demikian pula ketentuan mandinya.
          </InfoBox>

          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Contoh:</p>
            <p className="text-xs text-muted-foreground">Darah keluar 27 hari:</p>
            <Contoh items={[
              { label: "Darah Kuat", nilai: "12 hari", hukum: "haidl" },
              { label: "Darah Lemah", nilai: "15 hari", hukum: "istihadloh" },
            ]} />
          </div>

          <div className="rounded-xl bg-muted/60 border p-4">
            <p className="text-xs font-semibold text-foreground mb-2">📌 Kasus Khusus — Lemah Dulu, lalu Kuat Setelah Aqollu Thuhri (15 hari)</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Apabila darah lemah keluar terlebih dahulu, kemudian setelah melewati masa <em>aqollu thuhri</em> (15 hari) barulah muncul darah kuat:
            </p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1 pl-4 list-disc">
              <li>Sejumlah hari <strong>sesuai adat</strong> dari permulaan darah lemah = haidl.</li>
              <li>Darah lemah sisanya (antara adat dan hari ke-15) = istihadloh.</li>
              <li>Darah kuat yang muncul setelah hari ke-15 = haidl baru.</li>
            </ul>
            <p className="text-xs text-muted-foreground font-medium mt-2">Contoh (adat haidl = 3 hari, total darah 21 hari):</p>
            <Contoh items={[
              { label: "Lemah (adat)", nilai: "3 hari", hukum: "haidl" },
              { label: "Lemah (tengah)", nilai: "16 hari", hukum: "istihadloh" },
              { label: "Darah Kuat", nilai: "2 hari", hukum: "haidl" },
            ]} />
            <p className="text-xs text-muted-foreground mt-1">Darah kuat 2 hari keluar setelah lemah melewati aqollu thuhri (15 hari), sehingga dihukumi haidl baru.</p>
          </div>
        </GolonganCard>

        {/* 04 */}
        <GolonganCard nomor="04" judul="Mu'tadah Ghoiru Mumayyizah — Ingat Waktu & Lama" subJudul="Sudah pernah haidl · Tidak bisa membedakan · Ingat adat lengkap" color="violet">
          <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
            Wanita yang sudah pernah haidl dan suci, darahnya melebihi 15 hari, tidak bisa membedakan kuat-lemah (atau tidak memenuhi syarat mumayyizah), namun <strong>ingat kebiasaan lama masa haidl (kuantitas) dan waktu mulainya</strong>.
          </p>

          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm">
            <span className="font-semibold text-primary">Hukum: </span>
            <span className="text-muted-foreground">Haidl dan suci mengikuti adat yang diingat. Cukup satu kali adat haidl yang tidak berubah sebagai pedoman.</span>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Contoh (adat tetap):</p>
            <p className="text-xs text-muted-foreground">Adat haidl 5 hari, mulai awal bulan. Kemudian istihadloh beberapa bulan:</p>
            <Contoh items={[
              { label: "Hari ke-1 s/d 5", nilai: "5 hari", hukum: "haidl" },
              { label: "Hari ke-6 s/d 30", nilai: "25 hari", hukum: "istihadloh" },
            ]} />
            <p className="text-xs text-muted-foreground mt-1">Berlaku sama setiap bulan selama istihadloh.</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-2 mt-2">Jika Adat Berubah-Ubah:</p>
            <ul className="text-sm text-muted-foreground space-y-2 pl-4 list-disc">
              <li>
                <strong>Berubah secara teratur ≥ 2 putaran:</strong> haidl mengikuti putaran itu.
                <p className="text-xs mt-1">Contoh: Putaran I & II: 3, 5, 7 hari. Maka istihadloh bulan ke-7 = 3 hari, bulan ke-8 = 5 hari, bulan ke-9 = 7 hari.</p>
              </li>
              <li>
                <strong>Dua putaran tapi tidak berurutan, ingat haidl terakhir:</strong> mengikuti haidl terakhir.
                <p className="text-xs mt-1">Contoh: Putaran I: 3,5,7 — Putaran II: 3,7,5. Haidl terakhir = 5 hari → setiap bulan = 5 hari.</p>
              </li>
              <li>
                <strong>Belum dua putaran, ingat haidl terakhir:</strong> mengikuti haidl terakhir sebelum istihadloh.
                <p className="text-xs mt-1">Contoh: Bulan I=3, II=5, III=7 hari. Istihadloh mulai bulan IV → haidl setiap bulan = 7 hari.</p>
              </li>
              <li>
                <strong>Lupa haidl terakhir tapi ingat jumlah haidl sebelumnya:</strong> wajib mandi sejumlah bilangan haidl yang diingat.
                <p className="text-xs mt-1">Contoh: Ingat pernah haidl 3, 5, dan 7 hari → wajib mandi 3 kali (di akhir hari ke-3, ke-5, ke-7). Di antara mandi pertama dan terakhir harus ihtiyath (waspada).</p>
              </li>
            </ul>
          </div>
        </GolonganCard>

        {/* 05 */}
        <GolonganCard nomor="05" judul="Mu'tadah Ghoiru Mumayyizah — Lupa Waktu & Lama (Mutahayyiroh)" subJudul="Sudah pernah haidl · Tidak bisa membedakan · Lupa adat sepenuhnya" color="red">
          <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
            Wanita yang sudah pernah haidl dan suci, kemudian darahnya melebihi 15 hari, tidak bisa membedakan kuat-lemah, dan <strong>lupa kebiasaan waktu mulai dan lama haidlnya</strong>. Disebut juga <em>Mutahayyiroh / Muhayyaroh</em> karena berada dalam kebingungan antara haidl dan suci.
          </p>

          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Hukum-hukum yang Berlaku:</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 p-3">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Haram (seperti orang haidl):</p>
                <ul className="text-xs text-muted-foreground space-y-0.5 pl-3 list-disc">
                  <li>Bersentuhan kulit dengan suami (antara pusar dan lutut)</li>
                  <li>Membaca Al-Qur'an di luar sholat</li>
                  <li>Menyentuh / membawa Al-Qur'an</li>
                  <li>Berdiam di masjid</li>
                  <li>Lewat masjid jika khawatir darah menetes</li>
                </ul>
              </div>
              <div className="rounded-xl border bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 p-3">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Wajib (seperti orang suci):</p>
                <ul className="text-xs text-muted-foreground space-y-0.5 pl-3 list-disc">
                  <li>Sholat (fardlu & sunah)</li>
                  <li>Thawaf (fardlu & sunah)</li>
                  <li>Puasa (fardlu & sunah)</li>
                  <li>I'tikaf</li>
                  <li>Mandi setiap akan sholat fardlu</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Ketentuan Mandi:</p>
            <ul className="text-sm text-muted-foreground space-y-1 pl-4 list-disc">
              <li>Jika <strong>tidak ingat sama sekali</strong> kapan haidl berhenti → mandi setiap akan sholat fardlu.</li>
              <li>Jika hanya ingat waktu berhentinya → mandi pada waktu itu saja, selanjutnya cukup wudlu.</li>
            </ul>
          </div>

          <div className="rounded-xl bg-muted/60 border p-4">
            <p className="text-xs font-semibold text-foreground mb-2">📌 Tata Cara Puasa Ramadlan Mutahayyiroh:</p>
            <ol className="text-xs text-muted-foreground space-y-1 pl-4 list-decimal">
              <li>Puasa penuh satu bulan Ramadlan (29/30 hari).</li>
              <li>Kemudian puasa 30 hari berturut-turut (qodlo' tambahan).</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">
              Dengan cara ini semua kemungkinan haidl (maks. 15 hari dalam sebulan) dapat diantisipasi. Puasa Ramadlan yang sah secara yaqin: 29 hari − 16 = 13 hari (Ramadlan 29 hari) atau 30 − 16 = 14 hari (Ramadlan 30 hari). Hutang puasa = 2 hari.
            </p>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Cara mengqodlo' 2 hari puasa:</p>
            <p className="text-xs text-muted-foreground">Puasa 3 hari (1,2,3) → Ifthor 12 hari → Puasa 3 hari (4,5,6). Dengan cara ini hutang 2 hari terpenuhi secara yaqin.</p>
          </div>
        </GolonganCard>

        {/* 06 */}
        <GolonganCard nomor="06" judul="Mu'tadah Ghoiru Mumayyizah — Ingat Lama, Lupa Waktu Mulai" subJudul="Ingat kuantitas haidl · Lupa kapan mulainya" color="slate">
          <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
            Wanita yang sudah pernah haidl dan suci, darahnya melebihi 15 hari, tidak bisa membedakan kuat-lemah (atau tidak memenuhi syarat mumayyizah), dan <strong>ingat lama masa haidlnya tetapi lupa kapan tanggal mulainya</strong>.
          </p>

          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Hukum:</p>
            <ul className="text-sm text-muted-foreground space-y-1 pl-4 list-disc">
              <li>Hari yang <strong>yakin haidl</strong> → dihukumi haidl.</li>
              <li>Hari yang <strong>yakin suci</strong> → dihukumi suci/istihadloh.</li>
              <li>Hari yang <strong>mungkin haidl/suci</strong> → ihtiyath (waspada seperti mutahayyiroh).</li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Contoh (adat haidl 5 hari dalam 10 hari pertama, ingat tgl 1 ia suci):</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex gap-2"><span className="font-medium w-28">Tgl 1:</span><span>Yakin suci → istihadloh</span></div>
              <div className="flex gap-2"><span className="font-medium w-28">Tgl 2 – 5:</span><span>Mungkin haidl / suci → ihtiyath</span></div>
              <div className="flex gap-2"><span className="font-medium w-28">Tgl 6:</span><span>Yakin haidl → haidl</span></div>
              <div className="flex gap-2"><span className="font-medium w-28">Tgl 7 – 10:</span><span>Mungkin haidl / suci / putusnya haidl → ihtiyath</span></div>
              <div className="flex gap-2"><span className="font-medium w-28">Tgl 11 – akhir:</span><span>Yakin suci → istihadloh</span></div>
            </div>
            <InfoBox color="amber">
              Kewajiban mandi hanya pada waktu yang <em>mungkin mulai putusnya haidl</em> (tgl 7 s/d 10 dalam contoh ini).
            </InfoBox>
          </div>
        </GolonganCard>

        {/* 07 */}
        <GolonganCard nomor="07" judul="Mu'tadah Ghoiru Mumayyizah — Ingat Waktu Mulai, Lupa Lama" subJudul="Ingat kapan mulai · Lupa kuantitas haidl" color="slate">
          <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
            Wanita yang sudah pernah haidl dan suci, darahnya melebihi 15 hari, tidak bisa membedakan kuat-lemah (atau tidak memenuhi syarat mumayyizah), dan <strong>ingat kapan mulai haidl tetapi lupa berapa lama haidlnya</strong>.
          </p>

          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Contoh (ingat mulai haidl tgl 1, lupa berapa hari lamanya):</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex gap-2"><span className="font-medium w-28">Tgl 1:</span><span>Yakin haidl → haidl</span></div>
              <div className="flex gap-2"><span className="font-medium w-28">Tgl 2 – 15:</span><span>Mungkin haidl / suci / putusnya haidl → ihtiyath</span></div>
              <div className="flex gap-2"><span className="font-medium w-28">Tgl 16 – akhir:</span><span>Yakin suci → istihadloh</span></div>
            </div>
            <InfoBox color="amber">
              Masa yakin haidl (tgl 1) berlaku hukum haidl. Masa mungkin (tgl 2–15) berlaku hukum ihtiyath/mutahayyiroh. Masa yakin suci (tgl 16+) berlaku hukum istihadloh.
            </InfoBox>
          </div>
        </GolonganCard>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MUSTAHADLOH NIFAS — 5 GOLONGAN
         ══════════════════════════════════════════════════════════════ */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-violet-500" />
          <h2 className="text-base font-semibold text-foreground">Pembagian Mustahadloh Nifas (5 Golongan)</h2>
        </div>
        <p className="text-sm text-muted-foreground -mt-1">
          Wanita yang mengeluarkan darah nifas melebihi 60 hari 60 malam dibagi menjadi lima golongan.
        </p>

        {/* Nifas 01 */}
        <GolonganCard nomor="N1" judul="Mubtadi'ah Mumayyizah fin Nifas" subJudul="Pertama kali nifas · Dapat membedakan darah" color="violet">
          <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
            Wanita yang pertama kali nifas, darah melebihi 60 hari, dan darah <strong>dapat dibedakan kuat-lemah</strong> serta darah kuat tidak melebihi 60 hari.
          </p>
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm">
            <span className="font-semibold text-primary">Hukum: </span>
            <span className="text-muted-foreground">Darah kuat = Nifas. Darah lemah = Istihadloh.</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mt-2">Contoh:</p>
            <Contoh items={[
              { label: "Darah Kuat", nilai: "55 hari", hukum: "nifas" },
              { label: "Darah Lemah", nilai: "10 hari", hukum: "istihadloh" },
            ]} />
          </div>
        </GolonganCard>

        {/* Nifas 02 */}
        <GolonganCard nomor="N2" judul="Mubtadi'ah Ghoiru Mumayyizah fin Nifas" subJudul="Pertama kali nifas · Tidak bisa membedakan darah" color="violet">
          <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
            Wanita yang pertama kali nifas, darah melebihi 60 hari, dan darah tidak dapat dibedakan (atau darah kuat melebihi 60 hari).
          </p>

          <div>
            <p className="text-xs font-semibold text-foreground mt-1 mb-2">a. Belum pernah haidl dan suci:</p>
            <p className="text-xs text-muted-foreground">Darah setetes pertama = nifas. Kemudian bergantian: 29 hari istihadloh, 1 hari haidl, 29 hari istihadloh, 1 hari haidl, dst.</p>
            <p className="text-xs text-muted-foreground font-medium mt-2">Contoh (darah 90 hari lebih):</p>
            <Contoh items={[
              { label: "Awal (setetes)", nilai: "1 hari", hukum: "nifas" },
              { label: "Istihadloh", nilai: "29 hari", hukum: "istihadloh" },
              { label: "Haidl", nilai: "1 hari", hukum: "haidl" },
              { label: "Istihadloh", nilai: "29 hari", hukum: "istihadloh" },
            ]} />
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground mt-3 mb-2">b. Sudah pernah haidl dan suci (ingat kebiasaan haidl):</p>
            <p className="text-xs text-muted-foreground">Darah setetes pertama = nifas. Kemudian mengikuti pola adat: [adat suci] istihadloh → [adat haidl] haidl → berulang.</p>
            <p className="text-xs text-muted-foreground font-medium mt-2">Contoh (adat haidl 5 hari, suci 25 hari, nifas 70 hari lebih):</p>
            <Contoh items={[
              { label: "Nifas (setetes)", nilai: "1 hari", hukum: "nifas" },
              { label: "Istihadloh", nilai: "25 hari", hukum: "istihadloh" },
              { label: "Haidl", nilai: "5 hari", hukum: "haidl" },
              { label: "Istihadloh", nilai: "25 hari", hukum: "istihadloh" },
            ]} />
          </div>
        </GolonganCard>

        {/* Nifas 03 */}
        <GolonganCard nomor="N3" judul="Mu'tadah Mumayyizah fin Nifas" subJudul="Sudah pernah nifas · Dapat membedakan darah" color="violet">
          <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
            Wanita yang sudah pernah nifas, darah melebihi 60 hari, dan darah dapat dibedakan kuat-lemah serta darah kuat tidak melebihi 60 hari.
          </p>
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm">
            <span className="font-semibold text-primary">Hukum: </span>
            <span className="text-muted-foreground">Darah kuat = Nifas. Darah lemah = Istihadloh. <strong>Nifas tidak disamakan dengan adat nifas sebelumnya</strong>, melainkan mengikuti darah kuat.</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mt-2">Contoh (adat nifas 45 hari, kali ini kuat 55 hari + lemah 10 hari):</p>
            <Contoh items={[
              { label: "Darah Kuat", nilai: "55 hari", hukum: "nifas" },
              { label: "Darah Lemah", nilai: "10 hari", hukum: "istihadloh" },
            ]} />
            <p className="text-xs text-muted-foreground mt-1">Nifas = 55 hari (darah kuat), meski adat nifas sebelumnya hanya 45 hari.</p>
          </div>
        </GolonganCard>

        {/* Nifas 04 */}
        <GolonganCard nomor="N4" judul="Mu'tadah Ghoiru Mumayyizah fin Nifas — Ingat Adat" subJudul="Sudah pernah nifas · Tidak bisa membedakan · Ingat lama & waktu nifas" color="violet">
          <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
            Wanita yang sudah pernah nifas, darah melebihi 60 hari, tidak bisa membedakan kuat-lemah, dan <strong>ingat lama dan waktu kebiasaan nifasnya</strong>.
          </p>

          <div>
            <p className="text-xs font-semibold text-foreground mt-1 mb-1">a. Belum pernah haidl:</p>
            <p className="text-xs text-muted-foreground">Sejumlah adat nifas = nifas. Kemudian bergantian: 29 hari istihadloh + 1 hari haidl.</p>
            <p className="text-xs text-muted-foreground font-medium mt-2">Contoh (adat nifas 40 hari, darah 100 hari):</p>
            <Contoh items={[
              { label: "Nifas (adat)", nilai: "40 hari", hukum: "nifas" },
              { label: "Istihadloh", nilai: "29 hari", hukum: "istihadloh" },
              { label: "Haidl", nilai: "1 hari", hukum: "haidl" },
              { label: "Istihadloh", nilai: "29 hari", hukum: "istihadloh" },
            ]} />
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground mt-3 mb-1">b. Sudah pernah haidl:</p>
            <p className="text-xs text-muted-foreground">Adat nifas = nifas → adat suci dari haidl = istihadloh → adat haidl = haidl → berulang.</p>
            <p className="text-xs text-muted-foreground font-medium mt-2">Contoh (adat nifas 40 hari, adat haidl 5 hari, suci 25 hari, darah 100 hari):</p>
            <Contoh items={[
              { label: "Nifas (adat)", nilai: "40 hari", hukum: "nifas" },
              { label: "Istihadloh", nilai: "25 hari", hukum: "istihadloh" },
              { label: "Haidl", nilai: "5 hari", hukum: "haidl" },
              { label: "Istihadloh", nilai: "25 hari", hukum: "istihadloh" },
            ]} />
          </div>

          <div className="rounded-xl bg-muted/60 border p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Catatan Adat Nifas:</p>
            <ul className="space-y-1 pl-3 list-disc">
              <li>Satu kali nifas sudah cukup dijadikan pedoman adat.</li>
              <li>Adat yang berubah-ubah bisa jadi pedoman jika dua putaran tetap (misal 40, 60 dan 40, 60).</li>
              <li>Jika perubahan tidak sampai dua putaran / tidak tetap → nifas disamakan dengan lama nifas terakhir sebelum istihadloh.</li>
            </ul>
          </div>
        </GolonganCard>

        {/* Nifas 05 */}
        <GolonganCard nomor="N5" judul="Mu'tadah Ghoiru Mumayyizah fin Nifas — Lupa Adat" subJudul="Sudah pernah nifas · Tidak bisa membedakan · Lupa lama & waktu nifas" color="violet">
          <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
            Wanita yang sudah pernah nifas, darah melebihi 60 hari, tidak bisa membedakan kuat-lemah, dan <strong>lupa lama maupun waktu kebiasaan nifasnya</strong>.
          </p>

          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm">
            <span className="font-semibold text-primary">Hukum: </span>
            <span className="text-muted-foreground">Darah setetes pertama = nifas secara yakin. Selanjutnya wajib berhati-hati (ihtiyath): wajib mandi setiap akan sholat fardlu sampai hari ke-60. Setelah hari ke-60, cukup wudlu tiap akan sholat.</span>
          </div>

          <div>
            <p className="text-xs text-muted-foreground font-medium mt-2">Contoh (darah keluar 65 hari):</p>
            <Contoh items={[
              { label: "Nifas (yakin)", nilai: "1 hari", hukum: "nifas" },
              { label: "Ihtiyath (mandi tiap sholat)", nilai: "59 hari", hukum: "ihtiyath" },
              { label: "Wudlu tiap sholat", nilai: "5 hari", hukum: "istihadloh" },
            ]} />
          </div>

          <InfoBox color="amber">
            Hukum Golongan N5 juga berlaku bagi Mu'tadah Ghoiru Mumayyizah fin Nifas yang lupa <em>salah satu</em> dari lama atau waktu nifasnya (Qodron atau Waktan saja).
          </InfoBox>

          <InfoBox color="amber">
            Semua hari yang dihukumi istihadloh dalam masalah nifas, sholat yang ditinggalkan wajib diqodlo'. Demikian pula puasa jika bertepatan dengan bulan Ramadlan.
          </InfoBox>
        </GolonganCard>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground pb-4">
        Panduan ini disusun berdasarkan kitab fiqh Mazhab Syafi'i. Untuk masalah yang rumit, silakan berkonsultasi dengan ulama setempat.
      </p>
    </div>
  );
}
