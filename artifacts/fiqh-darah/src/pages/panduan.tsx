import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, Droplets, Clock, AlertCircle, HelpCircle, BookOpen,
  ChevronDown, ChevronUp, X, ChevronRight, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// ─── Story Data ───────────────────────────────────────────────────────────────

interface StorySlide {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  gradient: string;
  textColor: string;
  body: React.ReactNode;
}

const STORIES: StorySlide[] = [
  {
    id: "warna-darah",
    emoji: "🎨",
    title: "Kenali Warna Darahmu",
    subtitle: "Haid atau Istihadloh? Cek bedanya di sini.",
    gradient: "from-pink-400 via-rose-400 to-pink-500",
    textColor: "text-white",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-white/80 leading-relaxed">
          Warna darah menentukan <strong className="text-white">kekuatan</strong> darah dalam Fiqh Syafi'i.
          Urutan dari terkuat ke terlemah:
        </p>
        <div className="space-y-2">
          {[
            { rank: 1, warna: "Hitam", dot: "bg-slate-800", desc: "Paling kuat — prioritas utama haidl" },
            { rank: 2, warna: "Merah", dot: "bg-red-500", desc: "Warna haidl yang paling umum" },
            { rank: 3, warna: "Merah Kekuningan (Saja')", dot: "bg-orange-400", desc: "Warna campuran, masih cukup kuat" },
            { rank: 4, warna: "Kuning", dot: "bg-yellow-400", desc: "Tergolong darah lemah" },
            { rank: 5, warna: "Keruh", dot: "bg-slate-300", desc: "Paling lemah — kemungkinan istihadloh" },
          ].map(item => (
            <div key={item.rank} className="flex items-center gap-3 bg-white/15 rounded-2xl p-3">
              <span className="text-white/60 text-xs font-bold w-5 text-center">{item.rank}</span>
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${item.dot}`} />
              <div>
                <div className="text-white font-semibold text-sm">{item.warna}</div>
                <div className="text-white/70 text-xs">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white/20 rounded-2xl p-3 text-xs text-white/80">
          💡 Sifat kental & berbau menambah kekuatan darah, tetapi hanya diperhitungkan jika <strong className="text-white">warna sama</strong>.
        </div>
      </div>
    ),
  },
  {
    id: "tiga-jenis",
    emoji: "🩸",
    title: "3 Jenis Darah Wanita",
    subtitle: "Haidl, Nifas, atau Istihadloh?",
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    textColor: "text-white",
    body: (
      <div className="space-y-3">
        {[
          {
            nama: "Haidl (Menstruasi)", emoji: "🌙",
            bg: "bg-pink-500/30",
            poin: ["Darah sehat dari rahim", "Min: 24 jam", "Maks: 15 hari 15 malam", "Suci min: 15 hari"],
          },
          {
            nama: "Nifas (Setelah Lahir)", emoji: "👶",
            bg: "bg-fuchsia-500/30",
            poin: ["Darah setelah melahirkan", "Min: Sekejap", "Kebiasaan: 40 hari", "Maks: 60 hari 60 malam"],
          },
          {
            nama: "Istihadloh (Darah Penyakit)", emoji: "⚕️",
            bg: "bg-amber-500/30",
            poin: ["Darah di luar haidl/nifas", "Atau melebihi batas maksimal", "Tetap wajib sholat & puasa", "Wudlu/mandi setiap sholat fardlu"],
          },
        ].map(item => (
          <div key={item.nama} className={`${item.bg} rounded-2xl p-3 border border-white/20`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{item.emoji}</span>
              <span className="text-white font-bold text-sm">{item.nama}</span>
            </div>
            <ul className="space-y-0.5">
              {item.poin.map((p, i) => (
                <li key={i} className="text-white/80 text-xs flex items-start gap-1.5">
                  <span className="mt-0.5 text-white/50">•</span>{p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "batas-waktu",
    emoji: "⏰",
    title: "Batas 15 Hari",
    subtitle: "Kapan darah berhenti dianggap haid?",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    textColor: "text-white",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-white/80 leading-relaxed">
          Angka <strong className="text-white">15 hari</strong> adalah kunci utama dalam fiqh darah. Ini yang perlu kamu hafal:
        </p>
        <div className="space-y-3">
          {[
            { label: "Minimal Haidl", val: "24 jam", icon: "⬇️", desc: "Kurang dari ini → bukan haidl" },
            { label: "Maksimal Haidl", val: "15 hari", icon: "⬆️", desc: "Lebih dari ini → istihadloh" },
            { label: "Minimal Suci", val: "15 hari", icon: "✨", desc: "Jeda wajib antara dua haidl" },
            { label: "Kebiasaan Haidl", val: "6–7 hari", icon: "📅", desc: "Rata-rata umum wanita" },
            { label: "Maksimal Nifas", val: "60 hari", icon: "👶", desc: "Setelah melahirkan" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 bg-white/15 rounded-2xl p-3">
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <div className="flex-1">
                <div className="text-white/70 text-xs">{item.label}</div>
                <div className="text-white font-bold">{item.val}</div>
                <div className="text-white/60 text-xs">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "kuat-lemah",
    emoji: "💪",
    title: "Darah Kuat vs Lemah",
    subtitle: "Cara menentukan status darahmu.",
    gradient: "from-amber-400 via-orange-400 to-red-400",
    textColor: "text-white",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-white/80 leading-relaxed">
          Ketika darah keluar lebih dari 15 hari, kita perlu membedakan mana yang <strong className="text-white">Kuat</strong> (haidl) dan <strong className="text-white">Lemah</strong> (istihadloh).
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/20 rounded-2xl p-3">
            <div className="text-lg mb-1">🔴</div>
            <div className="text-white font-bold text-sm mb-2">Darah Kuat</div>
            <ul className="space-y-1">
              {["Warna hitam/merah tua", "Bertekstur kental", "Berbau khas", "Didahulukan sebagai haidl"].map((s, i) => (
                <li key={i} className="text-white/80 text-xs flex gap-1"><span>•</span>{s}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white/20 rounded-2xl p-3">
            <div className="text-lg mb-1">🟡</div>
            <div className="text-white font-bold text-sm mb-2">Darah Lemah</div>
            <ul className="space-y-1">
              {["Warna kuning/keruh", "Bertekstur encer", "Tidak berbau", "Kemungkinan istihadloh"].map((s, i) => (
                <li key={i} className="text-white/80 text-xs flex gap-1"><span>•</span>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="bg-white/20 rounded-2xl p-3 text-xs text-white/80">
          💡 <strong className="text-white">Warna adalah faktor utama.</strong> Sifat kental/berbau hanya menentukan jika dua darah berwarna sama.
        </div>
        <div className="bg-white/20 rounded-2xl p-3 text-xs text-white">
          <div className="font-bold mb-1">Contoh cepat:</div>
          <div className="text-white/80">Hitam 5 hari → Kuning 25 hari</div>
          <div className="mt-1">✅ Hitam = Haidl, Kuning = Istihadloh</div>
        </div>
      </div>
    ),
  },
  {
    id: "syarat-mumayyizah",
    emoji: "✅",
    title: "4 Syarat Mumayyizah",
    subtitle: "Semua harus terpenuhi untuk tamyiz berlaku.",
    gradient: "from-emerald-400 via-teal-400 to-cyan-500",
    textColor: "text-white",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-white/80 leading-relaxed">
          Mumayyizah = wanita yang bisa membedakan darah kuat dan lemah. Agar tamyiz berlaku, <strong className="text-white">semua 4 syarat ini harus terpenuhi:</strong>
        </p>
        {[
          { no: "1", judul: "Darah kuat ≥ 24 jam", desc: "Darah kuat tidak boleh kurang dari sehari semalam." },
          { no: "2", judul: "Darah kuat ≤ 15 hari", desc: "Darah kuat tidak boleh melebihi batas maksimal haidl." },
          { no: "3", judul: "Darah lemah ≥ 15 hari*", desc: "Jika darah masih keluar setelah lemah, lemah harus ≥ 15 hari. (*ada pengecualian)" },
          { no: "4", judul: "Darah lemah mengalir menerus", desc: "Tidak boleh ada darah kuat di tengah-tengah fase lemah." },
        ].map(item => (
          <div key={item.no} className="flex gap-3 bg-white/15 rounded-2xl p-3">
            <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {item.no}
            </div>
            <div>
              <div className="text-white font-semibold text-sm">{item.judul}</div>
              <div className="text-white/70 text-xs mt-0.5">{item.desc}</div>
            </div>
          </div>
        ))}
        <div className="bg-white/20 rounded-2xl p-3 text-xs text-white/80">
          ⚠️ Jika satu syarat saja tidak terpenuhi → <strong className="text-white">Ghoiru Mumayyizah</strong> (gunakan adat atau hukum khusus).
        </div>
      </div>
    ),
  },
  {
    id: "tujuh-golongan",
    emoji: "👥",
    title: "7 Golongan Mustahadloh",
    subtitle: "Kamu termasuk golongan mana?",
    gradient: "from-indigo-500 via-blue-500 to-violet-500",
    textColor: "text-white",
    body: (
      <div className="space-y-3">
        <p className="text-sm text-white/80">Wanita istihadloh haidl dibagi 7 golongan. Kenali posisimu:</p>
        {[
          { no: "01", nama: "Mubtadi'ah Mumayyizah", kunci: "Pertama haidl + bisa bedakan darah" },
          { no: "02", nama: "Mubtadi'ah Ghoiru Mumayyizah", kunci: "Pertama haidl + tidak bisa bedakan" },
          { no: "03", nama: "Mu'tadah Mumayyizah", kunci: "Punya adat + bisa bedakan darah" },
          { no: "04", nama: "Mu'tadah – Ingat Waktu & Lama", kunci: "Punya adat + ingat kebiasaan lengkap" },
          { no: "05", nama: "Mu'tadah Mutahayyiroh", kunci: "Punya adat + lupa kebiasaan sepenuhnya" },
          { no: "06", nama: "Mu'tadah – Ingat Lama saja", kunci: "Punya adat + ingat durasi, lupa waktu" },
          { no: "07", nama: "Mu'tadah – Ingat Waktu saja", kunci: "Punya adat + ingat waktu, lupa durasi" },
        ].map(item => (
          <div key={item.no} className="flex items-center gap-3 bg-white/15 rounded-xl p-2.5">
            <span className="text-xs font-bold text-white/60 w-6 text-center flex-shrink-0">{item.no}</span>
            <div>
              <div className="text-white font-medium text-xs leading-tight">{item.nama}</div>
              <div className="text-white/60 text-xs">{item.kunci}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "hukum-sholat",
    emoji: "🕌",
    title: "Hukum Qodlo Sholat",
    subtitle: "Jangan bingung — hitung hutang sholatmu.",
    gradient: "from-cyan-500 via-teal-500 to-emerald-500",
    textColor: "text-white",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-white/80 leading-relaxed">
          Wanita istihadloh <strong className="text-white">tetap wajib sholat</strong> seperti wanita suci. Ini aturan qodlo'-nya:
        </p>
        <div className="bg-white/20 rounded-2xl p-3">
          <div className="text-white font-bold text-sm mb-2">📋 Kewajiban Wanita Istihadloh</div>
          <ul className="space-y-1.5">
            {[
              "Wajib sholat fardlu setiap waktu",
              "Wajib bersuci (wudlu) sebelum setiap sholat",
              "Wajib mandi jika diperlukan (setelah masa haidl/nifas)",
              "Wajib puasa (fardlu & sunnah)",
              "Boleh berhubungan suami-istri",
            ].map((s, i) => (
              <li key={i} className="text-white/80 text-xs flex gap-2"><span className="text-green-300">✓</span>{s}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white/20 rounded-2xl p-3">
          <div className="text-white font-bold text-sm mb-2">🔄 Kapan Wajib Qodlo'?</div>
          <ul className="space-y-1.5">
            {[
              "Hari yang dihukumi istihadloh tetapi sudah ditinggalkan sholat → wajib qodlo'",
              "Hari yang dihukumi ihtiyath → wajib qodlo' jika sholat ditinggalkan",
              "Hari haidl/nifas yang sebenarnya → tidak perlu qodlo'",
            ].map((s, i) => (
              <li key={i} className="text-white/80 text-xs flex gap-2"><span className="text-amber-300">!</span>{s}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white/20 rounded-2xl p-3 text-xs text-white/80">
          💡 Gunakan kalkulator di halaman <strong className="text-white">Kalkulator</strong> untuk menghitung hari mana yang haidl dan mana yang istihadloh.
        </div>
      </div>
    ),
  },
  {
    id: "mutahayyiroh",
    emoji: "🔄",
    title: "Wanita Mutahayyiroh",
    subtitle: "Lupa kebiasaan haid? Ini solusinya.",
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    textColor: "text-white",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-white/80 leading-relaxed">
          <strong className="text-white">Mutahayyiroh</strong> = wanita yang lupa kapan dan berapa lama kebiasaan haidlnya. Ia dalam kebingungan antara haidl dan suci.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-red-500/30 rounded-2xl p-3 border border-red-300/30">
            <div className="text-white font-bold text-xs mb-2">🚫 Dilarang (seperti haidl)</div>
            <ul className="space-y-1">
              {["Hubungan suami-istri", "Baca Al-Qur'an di luar sholat", "Diam di masjid"].map((s, i) => (
                <li key={i} className="text-white/70 text-xs">• {s}</li>
              ))}
            </ul>
          </div>
          <div className="bg-green-500/30 rounded-2xl p-3 border border-green-300/30">
            <div className="text-white font-bold text-xs mb-2">✅ Wajib (seperti suci)</div>
            <ul className="space-y-1">
              {["Sholat fardlu", "Puasa fardlu", "Mandi tiap sholat"].map((s, i) => (
                <li key={i} className="text-white/70 text-xs">• {s}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="bg-white/20 rounded-2xl p-3">
          <div className="text-white font-bold text-sm mb-2">🌙 Puasa Ramadlan Mutahayyiroh</div>
          <ol className="space-y-1.5">
            <li className="text-white/80 text-xs flex gap-2"><span className="text-amber-300">1.</span>Puasa penuh 1 bulan Ramadlan</li>
            <li className="text-white/80 text-xs flex gap-2"><span className="text-amber-300">2.</span>Tambah 30 hari puasa berturut-turut (qodlo')</li>
          </ol>
          <p className="text-white/60 text-xs mt-2">Dengan ini semua kemungkinan haidl terantisipasi.</p>
        </div>
      </div>
    ),
  },
  {
    id: "nifas",
    emoji: "👶",
    title: "Panduan Nifas",
    subtitle: "Setelah melahirkan — ini yang perlu kamu tahu.",
    gradient: "from-purple-500 via-violet-500 to-fuchsia-500",
    textColor: "text-white",
    body: (
      <div className="space-y-4">
        <p className="text-sm text-white/80 leading-relaxed">
          <strong className="text-white">Nifas</strong> adalah darah yang keluar setelah rahim kosong dari kehamilan. Berlaku hukum seperti haidl.
        </p>
        <div className="space-y-2">
          {[
            { icon: "⬇️", label: "Minimal", val: "Sekejap (walau setetes)" },
            { icon: "📅", label: "Kebiasaan", val: "40 hari" },
            { icon: "⬆️", label: "Maksimal", val: "60 hari 60 malam" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 bg-white/15 rounded-2xl p-3">
              <span className="text-xl">{item.icon}</span>
              <div>
                <div className="text-white/60 text-xs">{item.label}</div>
                <div className="text-white font-bold">{item.val}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white/20 rounded-2xl p-3 text-xs">
          <div className="text-white font-bold mb-1">📌 Penting:</div>
          <ul className="space-y-1.5">
            {[
              "Jeda bersih ≥ 15 hari memutus siklus nifas → darah selanjutnya = haidl",
              "Jeda bersih < 15 hari → darah selanjutnya masih dihitung nifas (naqo')",
              "Darah >60 hari → istihadloh (hukum seperti mustahadloh haidl)",
            ].map((s, i) => (
              <li key={i} className="text-white/80 flex gap-2"><span className="text-violet-200">•</span>{s}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white/20 rounded-2xl p-3 text-xs text-white/80">
          💡 Gunakan kalkulator dengan memilih mode <strong className="text-white">Nifas</strong> untuk perhitungan otomatis.
        </div>
      </div>
    ),
  },
];

// ─── Story Overlay ────────────────────────────────────────────────────────────

function StoryOverlay({
  stories,
  initialIndex,
  onClose,
}: {
  stories: StorySlide[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);
  const [direction, setDirection] = useState<1 | -1>(1);
  const story = stories[current];

  const goNext = useCallback(() => {
    if (current < stories.length - 1) {
      setDirection(1);
      setCurrent(c => c + 1);
    } else {
      onClose();
    }
  }, [current, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (current > 0) {
      setDirection(-1);
      setCurrent(c => c - 1);
    }
  }, [current]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, goNext, goPrev]);

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <motion.div
        className="relative w-full sm:max-w-sm mx-auto h-[92dvh] sm:h-[85dvh] overflow-hidden rounded-t-3xl sm:rounded-3xl shadow-2xl"
        initial={{ y: "100%", scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: "100%", scale: 0.95 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
      >
        {/* Gradient background */}
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={story.id + "-bg"}
            className={`absolute inset-0 bg-gradient-to-br ${story.gradient}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: "easeInOut" }}
          />
        </AnimatePresence>

        {/* Progress bars */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
          {stories.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden cursor-pointer"
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
            >
              {i < current && <div className="h-full w-full bg-white/80" />}
              {i === current && (
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 8, ease: "linear" }}
                  onAnimationComplete={goNext}
                />
              )}
            </div>
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-10 right-4 z-20 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={story.id + "-content"}
            className="absolute inset-0 flex flex-col pt-16 px-5 pb-8 overflow-y-auto"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: "easeInOut" }}
          >
            {/* Story header */}
            <div className="flex-shrink-0 mb-5">
              <div className="text-5xl mb-3">{story.emoji}</div>
              <h2 className="text-2xl font-bold text-white leading-tight">{story.title}</h2>
              <p className="text-white/70 text-sm mt-1">{story.subtitle}</p>
            </div>

            {/* Story body */}
            <div className="flex-1">{story.body}</div>
          </motion.div>
        </AnimatePresence>

        {/* Invisible tap zones */}
        <button
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
          onClick={goPrev}
        />
        <button
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
          onClick={goNext}
        />

        {/* Navigation arrows */}
        <div className="absolute bottom-5 left-5 right-5 flex justify-between z-20">
          <button
            onClick={goPrev}
            disabled={current === 0}
            className="flex items-center gap-1.5 text-white/70 disabled:opacity-0 text-sm font-medium bg-black/20 rounded-full px-3 py-1.5 hover:bg-black/30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Sebelumnya
          </button>
          <button
            onClick={goNext}
            className="flex items-center gap-1.5 text-white text-sm font-medium bg-black/20 rounded-full px-3 py-1.5 hover:bg-black/30 transition-colors"
          >
            {current < stories.length - 1 ? (
              <></>
            ) : null}
            {current < stories.length - 1 ? "Selanjutnya" : "Selesai"}
            {current < stories.length - 1 ? <ChevronRight className="w-4 h-4" /> : <span className="ml-1">✓</span>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Story Card (Thumbnail) ───────────────────────────────────────────────────

function StoryCard({ story, onClick }: { story: StorySlide; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={`relative flex-shrink-0 w-36 h-52 rounded-3xl bg-gradient-to-br ${story.gradient} overflow-hidden shadow-lg cursor-pointer group`}
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)" }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        <div className="text-3xl">{story.emoji}</div>
        <div className="text-left">
          <div className="text-white font-bold text-sm leading-tight">{story.title}</div>
          <div className="text-white/70 text-xs mt-1 leading-snug line-clamp-2">{story.subtitle}</div>
        </div>
      </div>

      {/* Play indicator */}
      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
        <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[7px] border-l-white ml-0.5" />
      </div>
    </motion.button>
  );
}

// ─── Reusable Detail Components ───────────────────────────────────────────────

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
  nomor, judul, subJudul, color = "primary", children,
}: {
  nomor: string; judul: string; subJudul?: string;
  color?: "primary" | "amber" | "violet" | "green" | "red" | "slate";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const border: Record<string, string> = {
    primary: "border-primary/30", amber: "border-amber-300 dark:border-amber-700",
    violet: "border-violet-300 dark:border-violet-700", green: "border-green-300 dark:border-green-700",
    red: "border-red-300 dark:border-red-700", slate: "border-slate-300 dark:border-slate-600",
  };
  const badge: Record<string, string> = {
    primary: "bg-primary text-primary-foreground", amber: "bg-amber-500 text-white",
    violet: "bg-violet-500 text-white", green: "bg-green-600 text-white",
    red: "bg-red-500 text-white", slate: "bg-slate-500 text-white",
  };
  return (
    <section className={`bg-card border-2 rounded-2xl shadow-sm overflow-hidden ${border[color]}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-5 text-left hover:bg-muted/30 transition-colors">
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Panduan() {
  const [activeStory, setActiveStory] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const storyGroups = [
    { label: "Dasar Haid", indices: [0, 1, 2] },
    { label: "Darah Kuat & Lemah", indices: [3, 4, 5] },
    { label: "Panduan Ibadah", indices: [6, 7, 8] },
  ];

  return (
    <>
      <div className="max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="px-4 pt-8 pb-4">
          <Link href="/" data-testid="link-back-home">
            <Button variant="ghost" size="sm" className="gap-2 mb-5 -ml-3 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground" data-testid="guide-title">
            Panduan Fiqh Darah
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Menurut Mazhab Syafi'i · Kitab Uyunul Masa-il Linnisa
          </p>
        </div>

        {/* ── STORIES SECTION ─────────────────────────────────────── */}
        <div className="mb-8">
          {storyGroups.map(group => (
            <div key={group.label} className="mb-5">
              <div className="px-4 mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">{group.label}</h2>
                <span className="text-xs text-muted-foreground">{group.indices.length} panduan</span>
              </div>

              {/* Horizontal scroll */}
              <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto pb-3 px-4 scrollbar-hide"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {group.indices.map(idx => (
                  <div key={idx} style={{ scrollSnapAlign: "start" }}>
                    <StoryCard
                      story={STORIES[idx]}
                      onClick={() => setActiveStory(idx)}
                    />
                  </div>
                ))}
              </div>

              {/* Dots indicator */}
              <div className="flex justify-center gap-1.5 mt-2">
                {group.indices.map((idx, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStory(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      i === 0 ? "bg-primary w-4" : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── DIVIDER ───────────────────────────────────────────────── */}
        <div className="px-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium px-2">Panduan Lengkap & Referensi</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        </div>

        {/* ── DETAIL REFERENCE SECTION ──────────────────────────────── */}
        <div className="px-4 space-y-10 pb-16">

          {/* Istilah Dasar */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" /> Istilah Dasar
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { title: "Mubtadi'ah", desc: "Wanita yang baru pertama kali mengalami haidl (belum punya kebiasaan)." },
                { title: "Mu'tadah", desc: "Wanita yang sudah pernah haidl dan suci sehingga memiliki kebiasaan (adat)." },
                { title: "Mumayyizah (Tamyiz)", desc: "Dapat membedakan darah kuat (hitam/merah/kental/berbau) dan darah lemah (kuning/encer), serta memenuhi 4 syarat tamyiz." },
                { title: "Ghoiru Mumayyizah", desc: "Tidak bisa membedakan sifat darah (satu warna) atau bisa dibedakan namun tidak memenuhi seluruh 4 syarat mumayyizah." },
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

          {/* Jenis Darah */}
          <div className="space-y-3">
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

          {/* 7 Golongan Haidl */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Pembagian Mustahadloh Haidl (7 Golongan)</h2>
            </div>
            <p className="text-sm text-muted-foreground -mt-1">
              Wanita yang mengalami istihadloh haidl (darah keluar melebihi 15 hari) dibagi menjadi tujuh golongan. Klik tiap golongan untuk membuka detail.
            </p>

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
                <p className="text-sm font-semibold text-foreground">4 Syarat Mumayyizah (semuanya harus terpenuhi):</p>
                <Syarat items={[
                  "Darah kuat tidak kurang dari sehari semalam (24 jam).",
                  "Darah kuat tidak melebihi 15 hari 15 malam.",
                  "Darah lemah tidak kurang dari 15 hari jika darah masih terus keluar. Syarat ini tidak berlaku jika darah berhenti setelah fase lemah (tidak ada darah kuat kedua). Juga tidak berlaku jika kuat + lemah ≤ 15 hari (Kaidah Catatan).",
                  "Darah lemah keluar terus-menerus tanpa dijeda oleh darah kuat. Jika pola darah bergantian (kuat-lemah-kuat-lemah...) maka lemah tidak dianggap menerus → syarat 4 tidak terpenuhi.",
                ]} />
              </div>
              <div className="rounded-xl bg-muted/60 border p-4 space-y-3">
                <p className="text-xs font-semibold text-foreground">Hierarki Kekuatan Darah (dari terkuat ke terlemah):</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Hitam kental+bau", color: "bg-slate-800 text-white" },
                    { label: "Hitam", color: "bg-slate-700 text-white" },
                    { label: "Merah kental+bau", color: "bg-red-700 text-white" },
                    { label: "Merah", color: "bg-red-500 text-white" },
                    { label: "Merah kekuningan", color: "bg-orange-400 text-white" },
                    { label: "Kuning", color: "bg-yellow-400 text-slate-800" },
                    { label: "Keruh", color: "bg-slate-300 text-slate-700" },
                  ].map((d, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.color}`}>{d.label}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Contoh-Contoh:</p>
                <p className="text-xs text-muted-foreground font-medium mt-2">Contoh 1 — Kuat lalu Lemah:</p>
                <Contoh items={[
                  { label: "Darah Kuat", nilai: "5 hari", hukum: "haidl" },
                  { label: "Darah Lemah", nilai: "25 hari", hukum: "istihadloh" },
                ]} />
                <p className="text-xs text-muted-foreground font-medium mt-3">Contoh 2 — Kuat-Lemah-Kuat (lemah ≥ 15 hari):</p>
                <Contoh items={[
                  { label: "Darah Kuat 1", nilai: "3 hari", hukum: "haidl" },
                  { label: "Darah Lemah", nilai: "16 hari", hukum: "istihadloh" },
                  { label: "Darah Kuat 2", nilai: "7 hari", hukum: "haidl" },
                ]} />
                <p className="text-xs text-muted-foreground mt-1">Haidl = 3 + 7 = 10 hari. Lemah = istihadloh.</p>
                <p className="text-xs text-muted-foreground font-medium mt-3">Contoh 3 — Kuat-Lemah-Kuat (lemah &lt; 15 hari):</p>
                <Contoh items={[
                  { label: "Darah Kuat 1", nilai: "8 hari", hukum: "haidl" },
                  { label: "Darah Lemah", nilai: "8 hari", hukum: "istihadloh" },
                  { label: "Darah Kuat 2", nilai: "8 hari", hukum: "istihadloh" },
                ]} />
                <p className="text-xs text-muted-foreground mt-1">Lemah (8 hari) &lt; 15 hari → syarat 3 tidak terpenuhi → lihat Kaidah Catatan. Kuat1+lemah = 16 &gt; 15 → haidl hanya kuat pertama (8 hari).</p>
              </div>
              <div className="rounded-xl bg-muted/60 border p-4">
                <p className="text-xs font-semibold text-foreground mb-2">📌 Kaidah Catatan — Pola Kuat-Lemah-Kuat (Lemah &lt; 15 hari)</p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1 pl-4 list-disc">
                  <li><strong>Kuat1 + Lemah ≤ 15 hari</strong> → kuat1 dan lemah keduanya = haidl; kuat2 = istihadloh.</li>
                  <li><strong>Kuat1 + Lemah &gt; 15 hari</strong> → hanya kuat1 = haidl; lemah + kuat2 = istihadloh.</li>
                </ul>
                <p className="text-xs text-muted-foreground font-medium mt-3">Contoh A (8+7=15 ≤ 15 → keduanya haidl):</p>
                <Contoh items={[
                  { label: "Kuat 1", nilai: "8 hari", hukum: "haidl" },
                  { label: "Lemah", nilai: "7 hari", hukum: "haidl" },
                  { label: "Kuat 2", nilai: "8 hari", hukum: "istihadloh" },
                ]} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Ketentuan Mandi:</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1 pl-4 list-disc">
                  <li><strong>Bulan pertama:</strong> harus menunggu 15 hari dahulu sebelum mandi.</li>
                  <li><strong>Bulan kedua dan seterusnya:</strong> mandi wajib saat melihat perpindahan dari darah kuat ke darah lemah.</li>
                </ul>
              </div>
            </GolonganCard>

            <GolonganCard nomor="02" judul="Mubtadi'ah Ghoiru Mumayyizah" subJudul="Baru pertama haidl · Tidak bisa membedakan darah" color="amber">
              <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
                Wanita yang baru pertama kali mengalami haidl, darah melebihi 15 hari, namun darahnya <strong>satu warna/sifat</strong> (tidak dapat dibedakan kuat-lemah), atau bisa dibedakan tetapi tidak memenuhi seluruh 4 syarat mumayyizah. Dan ia <strong>ingat betul kapan mulai keluar darah</strong>.
              </p>
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm">
                <span className="font-semibold text-primary">Hukum: </span>
                <span className="text-muted-foreground">Sehari semalam (24 jam) pertama = Haidl. Selebihnya = Istihadloh. Berlaku setiap bulan.</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Contoh-Contoh:</p>
                <p className="text-xs text-muted-foreground font-medium mt-2">Contoh 1 — Seluruh darah satu sifat selama 1 bulan:</p>
                <Contoh items={[
                  { label: "Hari ke-1", nilai: "1 hari", hukum: "haidl" },
                  { label: "Hari ke-2 s/d akhir", nilai: "29 hari", hukum: "istihadloh" },
                ]} />
                <p className="text-xs text-muted-foreground font-medium mt-3">Contoh 2 — Darah kuat &lt; 24 jam lalu darah lemah:</p>
                <Contoh items={[
                  { label: "Darah Kuat", nilai: "20 jam", hukum: "haidl" },
                  { label: "Darah Lemah", nilai: "sisa", hukum: "istihadloh" },
                ]} />
                <p className="text-xs text-muted-foreground mt-1">Darah kuat hanya 20 jam (&lt; 24 jam) → tidak memenuhi syarat mumayyizah. Haidl tetap 1 hari pertama.</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Ketentuan Mandi & Qodlo':</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1 pl-4 list-disc">
                  <li><strong>Bulan pertama:</strong> harus menunggu 15 hari sebelum mandi. Wajib mengqodlo' sholat hari ke-2 s/d ke-15 (14 hari).</li>
                  <li><strong>Bulan berikutnya:</strong> mandi tidak perlu menunggu 15 hari; cukup saat darah telah genap sehari semalam.</li>
                </ul>
              </div>
            </GolonganCard>

            <GolonganCard nomor="03" judul="Mu'tadah Mumayyizah" subJudul="Sudah pernah haidl · Dapat membedakan darah" color="green">
              <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
                Wanita yang sudah pernah haidl dan suci (memiliki kebiasaan/adat), kemudian darahnya melebihi 15 hari, serta darahnya dapat dibedakan kuat-lemah dan memenuhi seluruh 4 syarat mumayyizah.
              </p>
              <InfoBox color="green">
                <strong>Tamyiz (perbedaan sifat darah) didahulukan atas adat.</strong> Meskipun sudah punya kebiasaan haidl, jika tamyiz memenuhi 4 syarat, maka darah kuat = haidl dan darah lemah = istihadloh — bukan mengikuti hitungan adat.
              </InfoBox>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Contoh — Tamyiz menggantikan adat:</p>
                <p className="text-xs text-muted-foreground">Adat haidl 6 hari. Darah keluar: hitam 8 hari lalu merah 10 hari (total 18 hari).</p>
                <Contoh items={[
                  { label: "Hitam (kuat)", nilai: "8 hari", hukum: "haidl" },
                  { label: "Merah (lemah)", nilai: "10 hari", hukum: "istihadloh" },
                ]} />
                <p className="text-xs text-muted-foreground mt-1">Meskipun adat hanya 6 hari, tamyiz berlaku: hitam 8 hari = haidl. Bukan 6 hari sesuai adat.</p>
              </div>
            </GolonganCard>

            <GolonganCard nomor="04" judul="Mu'tadah Ghoiru Mumayyizah — Ingat Waktu & Lama" subJudul="Sudah pernah haidl · Tidak bisa membedakan · Ingat adat lengkap" color="violet">
              <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
                Wanita yang sudah pernah haidl dan suci, darahnya melebihi 15 hari, tidak bisa membedakan kuat-lemah, namun <strong>ingat kebiasaan lama masa haidl (kuantitas) dan waktu mulainya</strong>.
              </p>
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm">
                <span className="font-semibold text-primary">Hukum: </span>
                <span className="text-muted-foreground">Haidl dan suci mengikuti adat yang diingat.</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Contoh (adat tetap 5 hari, mulai awal bulan):</p>
                <Contoh items={[
                  { label: "Hari ke-1 s/d 5", nilai: "5 hari", hukum: "haidl" },
                  { label: "Hari ke-6 s/d 30", nilai: "25 hari", hukum: "istihadloh" },
                ]} />
                <p className="text-xs text-muted-foreground mt-1">Berlaku sama setiap bulan selama istihadloh.</p>
              </div>
            </GolonganCard>

            <GolonganCard nomor="05" judul="Mu'tadah Ghoiru Mumayyizah — Lupa Waktu & Lama (Mutahayyiroh)" subJudul="Sudah pernah haidl · Tidak bisa membedakan · Lupa adat sepenuhnya" color="red">
              <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
                Wanita yang sudah pernah haidl dan suci, kemudian darahnya melebihi 15 hari, tidak bisa membedakan kuat-lemah, dan <strong>lupa kebiasaan waktu mulai dan lama haidlnya</strong>. Disebut juga <em>Mutahayyiroh / Muhayyaroh</em>.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 p-3">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Haram (seperti orang haidl):</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5 pl-3 list-disc">
                    <li>Bersentuhan kulit dengan suami (antara pusar dan lutut)</li>
                    <li>Membaca Al-Qur'an di luar sholat</li>
                    <li>Menyentuh / membawa Al-Qur'an</li>
                    <li>Berdiam di masjid</li>
                  </ul>
                </div>
                <div className="rounded-xl border bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 p-3">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Wajib (seperti orang suci):</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5 pl-3 list-disc">
                    <li>Sholat (fardlu & sunah)</li>
                    <li>Thawaf</li>
                    <li>Puasa (fardlu & sunah)</li>
                    <li>Mandi setiap akan sholat fardlu</li>
                  </ul>
                </div>
              </div>
              <div className="rounded-xl bg-muted/60 border p-4">
                <p className="text-xs font-semibold text-foreground mb-2">📌 Tata Cara Puasa Ramadlan Mutahayyiroh:</p>
                <ol className="text-xs text-muted-foreground space-y-1 pl-4 list-decimal">
                  <li>Puasa penuh satu bulan Ramadlan (29/30 hari).</li>
                  <li>Kemudian puasa 30 hari berturut-turut (qodlo' tambahan).</li>
                </ol>
              </div>
            </GolonganCard>

            <GolonganCard nomor="06" judul="Mu'tadah Ghoiru Mumayyizah — Ingat Lama, Lupa Waktu Mulai" subJudul="Ingat kuantitas haidl · Lupa kapan mulainya" color="slate">
              <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
                Wanita yang sudah pernah haidl dan suci, darahnya melebihi 15 hari, tidak bisa membedakan kuat-lemah, dan <strong>ingat lama masa haidlnya tetapi lupa kapan tanggal mulainya</strong>.
              </p>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Hukum:</p>
                <ul className="text-sm text-muted-foreground space-y-1 pl-4 list-disc">
                  <li>Hari yang <strong>yakin haidl</strong> → dihukumi haidl.</li>
                  <li>Hari yang <strong>yakin suci</strong> → dihukumi suci/istihadloh.</li>
                  <li>Hari yang <strong>mungkin haidl/suci</strong> → ihtiyath (waspada).</li>
                </ul>
              </div>
            </GolonganCard>

            <GolonganCard nomor="07" judul="Mu'tadah Ghoiru Mumayyizah — Ingat Waktu Mulai, Lupa Lama" subJudul="Ingat kapan mulai · Lupa kuantitas haidl" color="slate">
              <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
                Wanita yang sudah pernah haidl dan suci, darahnya melebihi 15 hari, tidak bisa membedakan kuat-lemah, dan <strong>ingat kapan mulai haidl tetapi lupa berapa lama haidlnya</strong>.
              </p>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Contoh (ingat mulai haidl tgl 1, lupa berapa hari lamanya):</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex gap-2"><span className="font-medium w-28">Tgl 1:</span><span>Yakin haidl → haidl</span></div>
                  <div className="flex gap-2"><span className="font-medium w-28">Tgl 2 – 15:</span><span>Mungkin haidl / suci → ihtiyath</span></div>
                  <div className="flex gap-2"><span className="font-medium w-28">Tgl 16 – akhir:</span><span>Yakin suci → istihadloh</span></div>
                </div>
                <InfoBox color="amber">
                  Masa yakin haidl berlaku hukum haidl. Masa mungkin berlaku hukum ihtiyath. Masa yakin suci berlaku hukum istihadloh.
                </InfoBox>
              </div>
            </GolonganCard>
          </div>

          {/* 7 Golongan Nifas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-500" />
              <h2 className="text-base font-semibold text-foreground">Pembagian Mustahadloh Nifas (7 Golongan)</h2>
            </div>
            <p className="text-sm text-muted-foreground -mt-1">
              Wanita yang mengeluarkan darah nifas melebihi 60 hari 60 malam dibagi menjadi tujuh golongan — sama seperti mustahadloh haidl, dengan batas maksimal 60 hari.
            </p>

            <GolonganCard nomor="N1" judul="Mubtadi'ah Mumayyizah fin Nifas" subJudul="Pertama kali nifas · Dapat membedakan darah" color="violet">
              <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
                Wanita yang pertama kali nifas, darah melebihi 60 hari, dan darah <strong>dapat dibedakan kuat-lemah</strong> serta darah kuat tidak melebihi 60 hari. Berlaku 4 syarat tamyiz seperti pada haidl.
              </p>
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm">
                <span className="font-semibold text-primary">Hukum: </span>
                <span className="text-muted-foreground">Darah kuat = Nifas. Darah lemah = Istihadloh.</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Contoh — Kuat dulu, lalu lemah:</p>
                <Contoh items={[
                  { label: "Hitam (kuat)", nilai: "20 hari", hukum: "nifas" },
                  { label: "Merah (lemah)", nilai: "50 hari", hukum: "istihadloh" },
                ]} />
                <p className="text-xs text-muted-foreground mt-1">Nifas = 20 hari (hitam). Merah 50 hari = istihadloh.</p>
              </div>
            </GolonganCard>

            <GolonganCard nomor="N2" judul="Mubtadi'ah Ghoiru Mumayyizah fin Nifas" subJudul="Pertama kali nifas · Tidak bisa membedakan darah" color="violet">
              <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
                Wanita yang pertama kali nifas, darah melebihi 60 hari, dan darah tidak dapat dibedakan (atau darah kuat melebihi 60 hari).
              </p>
              <div>
                <p className="text-xs font-semibold text-foreground mt-1 mb-2">a. Belum pernah haidl dan suci:</p>
                <p className="text-xs text-muted-foreground">Darah setetes pertama = nifas. Kemudian: 29 hari istihadloh, 1 hari haidl, berulang.</p>
                <Contoh items={[
                  { label: "Awal (setetes)", nilai: "1 hari", hukum: "nifas" },
                  { label: "Istihadloh", nilai: "29 hari", hukum: "istihadloh" },
                  { label: "Haidl", nilai: "1 hari", hukum: "haidl" },
                ]} />
                <p className="text-xs font-semibold text-foreground mt-3 mb-2">b. Sudah pernah haidl dan suci:</p>
                <p className="text-xs text-muted-foreground">Mengikuti pola adat: setetes pertama = nifas → adat suci = istihadloh → adat haidl = haidl → berulang.</p>
              </div>
            </GolonganCard>

            <GolonganCard nomor="N3–N7" judul="Golongan N3–N7 (Mu'tadah fin Nifas)" subJudul="Sama dengan golongan 03–07 haidl, batas maksimal 60 hari" color="violet">
              <p className="text-sm text-muted-foreground pt-4 leading-relaxed">
                Golongan N3 hingga N7 mengikuti pola yang sama dengan golongan 03–07 pada mustahadloh haidl, dengan perbedaan utama:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 pl-4 list-disc">
                <li>Batas maksimal adalah <strong>60 hari</strong> (bukan 15 hari seperti haidl).</li>
                <li>Adat yang digunakan adalah <strong>adat nifas</strong>, bukan adat haidl.</li>
                <li>Jika lupa adat nifas sepenuhnya (Mutahayyiroh fin Nifas / N5): mandi setiap akan sholat fardlu sampai hari ke-60, setelah itu cukup wudlu.</li>
              </ul>
              <InfoBox color="amber">
                Semua hari yang dihukumi istihadloh dalam masalah nifas, sholat yang ditinggalkan wajib diqodlo'. Demikian pula puasa jika bertepatan dengan bulan Ramadlan.
              </InfoBox>
            </GolonganCard>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground pb-4">
            Panduan ini disusun berdasarkan kitab fiqh Mazhab Syafi'i. Untuk masalah yang rumit, silakan berkonsultasi dengan ulama setempat.
          </p>
        </div>
      </div>

      {/* ── STORY OVERLAY ──────────────────────────────────────────── */}
      <AnimatePresence>
        {activeStory !== null && (
          <StoryOverlay
            stories={STORIES}
            initialIndex={activeStory}
            onClose={() => setActiveStory(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
