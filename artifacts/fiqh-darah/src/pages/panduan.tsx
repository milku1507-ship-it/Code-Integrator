import { Link } from "wouter";
import { ArrowLeft, BookOpen, Droplets, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Panduan() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/" data-testid="link-back-home">
        <Button variant="ghost" size="sm" className="gap-2 mb-8 -ml-3 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Button>
      </Link>

      <div className="space-y-4 mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl text-primary mb-2">
          <BookOpen className="w-6 h-6" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-foreground" data-testid="guide-title">
          Panduan Memahami Fiqh Darah
        </h1>
        <p className="text-lg text-muted-foreground">
          Ringkasan istilah dan konsep dasar dalam menentukan hukum darah wanita.
        </p>
      </div>

      <div className="space-y-8">
        <section className="bg-card border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-medium flex items-center gap-2 mb-4 text-primary">
            <Droplets className="w-5 h-5" />
            Haidl (Menstruasi)
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Darah yang keluar dari rahim wanita dalam keadaan sehat, bukan karena melahirkan atau sakit.
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-foreground/80 ml-4">
            <li><strong>Batas Minimal:</strong> 1 hari 1 malam (24 jam)</li>
            <li><strong>Batas Maksimal:</strong> 15 hari 15 malam</li>
            <li><strong>Masa Suci Minimal:</strong> 15 hari 15 malam (antara dua masa haidl)</li>
          </ul>
        </section>

        <section className="bg-card border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-medium flex items-center gap-2 mb-4 text-teal-600 dark:text-teal-400">
            <Clock className="w-5 h-5" />
            Nifas
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Darah yang keluar setelah kosongnya rahim dari kehamilan (melahirkan).
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-foreground/80 ml-4">
            <li><strong>Batas Minimal:</strong> Sekejap (setetes darah)</li>
            <li><strong>Kebiasaan Normal:</strong> 40 hari</li>
            <li><strong>Batas Maksimal:</strong> 60 hari</li>
          </ul>
        </section>

        <section className="bg-card border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-medium flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
            Istihadloh
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Darah penyakit yang keluar di luar waktu haidl dan nifas, atau darah yang melebihi batas maksimal haidl (15 hari) dan nifas (60 hari).
          </p>
          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg text-sm text-amber-900 dark:text-amber-200 mt-4">
            Wanita yang mengalami istihadloh <strong>tetap wajib melaksanakan sholat dan puasa</strong>, namun ada tata cara bersuci khusus yang harus dilakukan setiap kali akan sholat fardlu.
          </div>
        </section>

        <section className="bg-muted/50 rounded-2xl p-6">
          <h2 className="text-lg font-medium mb-4">Istilah Penting Lainnya</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-background rounded-xl p-4 border shadow-sm">
              <h3 className="font-medium text-foreground mb-1">Mubtadi'ah</h3>
              <p className="text-sm text-muted-foreground">Wanita yang baru pertama kali mengalami haid.</p>
            </div>
            <div className="bg-background rounded-xl p-4 border shadow-sm">
              <h3 className="font-medium text-foreground mb-1">Mu'tadah</h3>
              <p className="text-sm text-muted-foreground">Wanita yang sudah pernah mengalami haid dan suci sebelumnya (memiliki kebiasaan).</p>
            </div>
            <div className="bg-background rounded-xl p-4 border shadow-sm">
              <h3 className="font-medium text-foreground mb-1">Tamyiz (Mumayyizah)</h3>
              <p className="text-sm text-muted-foreground">Kemampuan membedakan sifat darah (kuat/lemah) dari warna, kekentalan, dan bau.</p>
            </div>
            <div className="bg-background rounded-xl p-4 border shadow-sm">
              <h3 className="font-medium text-foreground mb-1">Ghoiru Mumayyizah</h3>
              <p className="text-sm text-muted-foreground">Tidak bisa membedakan sifat darah, atau darah memiliki sifat yang sama terus-menerus.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
