import { Link } from "wouter";
import { ArrowLeft, Droplets, Clock, AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Panduan() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/" data-testid="link-back-home">
        <Button variant="ghost" size="sm" className="gap-2 mb-8 -ml-3 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Button>
      </Link>

      <div className="space-y-2 mb-10">
        <h1 className="text-3xl sm:text-4xl font-serif text-foreground" data-testid="guide-title">
          Panduan Fiqh Darah
        </h1>
        <p className="text-muted-foreground">
          Ringkasan istilah dan konsep dasar dalam menentukan hukum darah wanita.
        </p>
      </div>

      <div className="space-y-5">
        <section className="bg-card border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3 text-primary">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Droplets className="w-4 h-4" />
            </div>
            Haidl (Menstruasi)
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Darah yang keluar dari rahim wanita dalam keadaan sehat, bukan karena melahirkan atau sakit.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Minimal", val: "24 jam" },
              { label: "Maksimal", val: "15 hari" },
              { label: "Suci Minimal", val: "15 hari" },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="text-sm font-bold text-primary">{item.val}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3 text-violet-600 dark:text-violet-400">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            Nifas
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Darah yang keluar setelah kosongnya rahim dari kehamilan (melahirkan).
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Minimal", val: "Sekejap" },
              { label: "Kebiasaan", val: "40 hari" },
              { label: "Maksimal", val: "60 hari" },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 rounded-xl bg-violet-500/5 border border-violet-200 dark:border-violet-800">
                <div className="text-sm font-bold text-violet-600 dark:text-violet-400">{item.val}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3 text-amber-600 dark:text-amber-400">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            Istihadloh
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Darah penyakit yang keluar di luar waktu haidl dan nifas, atau melebihi batas maksimal.
          </p>
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Wanita istihadloh <strong>tetap wajib sholat dan puasa</strong> dengan tata cara bersuci khusus setiap akan sholat fardlu.</span>
          </div>
        </section>

        <section className="bg-muted/40 rounded-2xl p-6">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            Istilah Penting
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: "Mubtadi'ah", desc: "Wanita yang baru pertama kali mengalami haid." },
              { title: "Mu'tadah", desc: "Wanita yang sudah pernah haid dan suci sebelumnya (memiliki kebiasaan)." },
              { title: "Mumayyizah (Tamyiz)", desc: "Dapat membedakan sifat darah kuat/lemah dari warna, kekentalan, dan bau." },
              { title: "Ghoiru Mumayyizah", desc: "Tidak bisa membedakan sifat darah, atau darah bersifat sama terus-menerus." },
            ].map((item) => (
              <div key={item.title} className="bg-background rounded-xl p-4 border shadow-sm">
                <h3 className="font-semibold text-sm text-primary mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
