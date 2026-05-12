import { useState } from "react";
import { Link } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Calculator,
  Plus,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Droplets,
  Wind,
  Info,
  BookOpen,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  jalankanMesinFiqh,
  InputUser,
  HasilAnalisis,
  FaseItem,
  FaseDarahItem,
  MasaBersihItem,
  formatDurasi,
} from "@/lib/fiqhEngine";
import { cn } from "@/lib/utils";

const step1Schema = z.object({
  usiaTahun: z
    .coerce.number()
    .min(1, "Usia minimal 1 tahun")
    .max(100, "Usia tidak valid"),
  kondisiAwal: z.enum(["haidl", "nifas"], {
    required_error: "Pilih kondisi awal",
  }),
  statusPengalaman: z.enum(["mubtadiah", "mutadah"], {
    required_error: "Pilih status pengalaman",
  }),
});

const faseItemSchema = z
  .object({
    tipe: z.enum(["darah", "bersih"]),
    warna: z
      .enum(["hitam", "merah", "merah kekuningan", "kuning", "keruh"])
      .optional(),
    kental: z.boolean().default(false),
    bau: z.boolean().default(false),
    hari: z.coerce
      .number()
      .min(0, "Tidak boleh negatif")
      .max(100, "Jumlah hari tidak valid"),
    jam: z.coerce
      .number()
      .min(0, "Tidak boleh negatif")
      .max(23, "Maksimal 23 jam"),
  })
  .superRefine((data, ctx) => {
    if (Number(data.hari) * 24 + Number(data.jam) === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Masukkan minimal 1 jam atau setengah hari",
        path: ["hari"],
      });
    }
    if (data.tipe === "darah" && !data.warna) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pilih warna darah",
        path: ["warna"],
      });
    }
  });

const step2Schema = z.object({
  daftarFase: z
    .array(faseItemSchema)
    .min(1, "Minimal 1 fase")
    .max(10, "Maksimal 10 fase"),
});

const step3Schema = z
  .object({
    ingatKebiasaan: z.enum(
      ["ingat_semua", "lupa_semua", "ingat_durasi", "ingat_waktu"],
      { required_error: "Pilih status kebiasaan" },
    ),
    kebiasaanHaidHari: z.coerce.number().min(0).max(15).optional(),
  })
  .refine(
    (data) => {
      if (
        (data.ingatKebiasaan === "ingat_semua" ||
          data.ingatKebiasaan === "ingat_durasi") &&
        !data.kebiasaanHaidHari
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Masukkan jumlah hari kebiasaan",
      path: ["kebiasaanHaidHari"],
    },
  );

const WAKTU_ENUM = ["subuh", "dzuhur", "ashar", "maghrib", "isya", "tidak_tahu", ""] as const;

const step4Schema = z.object({
  waktuMulaiDarah: z.enum(WAKTU_ENUM, { required_error: "Pilih waktu mulai darah" }),
  sudahSholatSebelumDarah: z.boolean().default(false),
  waktuBerhentiTotal: z.enum(WAKTU_ENUM, { required_error: "Pilih waktu berhenti" }),
});

type Step2FormData = z.infer<typeof step2Schema>;
type FaseFormItem = z.infer<typeof faseItemSchema>;

export default function Kalkulator() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<InputUser>>({});
  const [hasil, setHasil] = useState<HasilAnalisis | null>(null);

  const form1 = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      usiaTahun: formData.usiaTahun || 9,
      kondisiAwal: formData.kondisiAwal || "haidl",
      statusPengalaman: formData.statusPengalaman || "mubtadiah",
    },
  });

  const form2 = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      daftarFase: (formData.daftarFase as FaseFormItem[] | undefined) || [
        { tipe: "darah", warna: "merah", kental: false, bau: false, hari: 1, jam: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form2.control,
    name: "daftarFase",
  });

  const form3 = useForm<z.infer<typeof step3Schema>>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      ingatKebiasaan: formData.ingatKebiasaan || "ingat_semua",
      kebiasaanHaidHari: formData.kebiasaanHaidHari || 7,
    },
  });

  const form4 = useForm<z.infer<typeof step4Schema>>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      waktuMulaiDarah: formData.waktuMulaiDarah || "",
      sudahSholatSebelumDarah: formData.sudahSholatSebelumDarah ?? false,
      waktuBerhentiTotal: formData.waktuBerhentiTotal || "",
    },
  });

  const onStep1Submit = (data: z.infer<typeof step1Schema>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const onStep2Submit = (data: Step2FormData) => {
    const converted: FaseItem[] = data.daftarFase.map((f) => {
      if (f.tipe === "bersih") {
        return { tipe: "bersih" as const, hari: Number(f.hari) || 0, jam: Number(f.jam) || 0 };
      }
      return {
        tipe: "darah" as const,
        warna: f.warna as FaseDarahItem["warna"],
        kental: f.kental ?? false,
        bau: f.bau ?? false,
        hari: Number(f.hari) || 0,
        jam: Number(f.jam) || 0,
      };
    });
    setFormData((prev) => ({ ...prev, daftarFase: converted }));
    if (formData.statusPengalaman === "mubtadiah") {
      setStep(4);
    } else {
      setStep(3);
    }
  };

  const onStep3Submit = (data: z.infer<typeof step3Schema>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(4);
  };

  const onStep4Submit = (data: z.infer<typeof step4Schema>) => {
    try {
      const toWaktu = (v: string): InputUser["waktuBerhentiTotal"] =>
        (v === "tidak_tahu" ? "" : v) as InputUser["waktuBerhentiTotal"];

      const finalData: InputUser = {
        usiaTahun: formData.usiaTahun ?? 9,
        kondisiAwal: formData.kondisiAwal ?? "haidl",
        statusPengalaman: formData.statusPengalaman ?? "mubtadiah",
        ingatKebiasaan: formData.ingatKebiasaan ?? "lupa_semua",
        kebiasaanHaidHari: parseFloat(String(formData.kebiasaanHaidHari ?? 0)) || 0,
        daftarFase: formData.daftarFase ?? [],
        waktuMulaiDarah: toWaktu(data.waktuMulaiDarah),
        sudahSholatSebelumDarah: data.sudahSholatSebelumDarah ?? false,
        waktuBerhentiTotal: toWaktu(data.waktuBerhentiTotal),
      };
      setFormData(finalData);
      const result = jalankanMesinFiqh(finalData);
      setHasil(result);
      setStep(5);
    } catch (_err) {
      setHasil({
        kesimpulan: "Terjadi Kesalahan",
        kategori: "",
        hukumHaidl: "",
        hukumIstihadloh:
          "Mohon lengkapi data Anda dan pastikan semua kolom terisi dengan benar.",
        qodloSholatMulai: "",
        qodloSholat: "",
        hutangIbadah: "",
        panduanBersuci: "",
        tipeHasil: "error",
      });
      setStep(5);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFormData({});
    setHasil(null);
    form1.reset({ usiaTahun: 9, kondisiAwal: "haidl", statusPengalaman: "mubtadiah" });
    form2.reset({
      daftarFase: [
        { tipe: "darah", warna: "merah", kental: false, bau: false, hari: 1, jam: 0 },
      ],
    });
    form3.reset({ ingatKebiasaan: "ingat_semua", kebiasaanHaidHari: 7 });
    form4.reset({ waktuMulaiDarah: "", sudahSholatSebelumDarah: false, waktuBerhentiTotal: "" });
  };

  const appendDarah = () => {
    append({ tipe: "darah", warna: "merah", kental: false, bau: false, hari: 1, jam: 0 } as FaseFormItem);
  };

  const appendBersih = () => {
    append({ tipe: "bersih", warna: undefined, kental: false, bau: false, hari: 1, jam: 0 } as unknown as FaseFormItem);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 w-full">
      {step < 5 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Langkah {step} dari 4
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round((step / 4) * 100)}%
            </span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <Card className="border-0 shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-primary/5 pb-6">
            <CardTitle className="text-2xl font-serif">Data Dasar</CardTitle>
            <CardDescription>
              Informasi umum mengenai kondisi Anda saat ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form1}>
              <form
                onSubmit={form1.handleSubmit(onStep1Submit)}
                className="space-y-8"
                data-testid="form-step-1"
              >
                <FormField
                  control={form1.control}
                  name="usiaTahun"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usia (Tahun Qomariyah)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          data-testid="input-usia"
                        />
                      </FormControl>
                      <FormDescription>
                        Menurut penanggalan Hijriyah.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form1.control}
                  name="kondisiAwal"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Kondisi Saat Darah Keluar</FormLabel>
                      <div
                        className="grid sm:grid-cols-2 gap-4"
                        data-testid="radio-kondisi"
                      >
                        {(["haidl", "nifas"] as const).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => field.onChange(val)}
                            data-testid={`radio-kondisi-${val}`}
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all text-left w-full",
                              field.value === val
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-primary/50",
                            )}
                          >
                            <div
                              className={cn(
                                "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                                field.value === val
                                  ? "border-primary"
                                  : "border-muted-foreground",
                              )}
                            >
                              {field.value === val && (
                                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                              )}
                            </div>
                            <span className="font-medium">
                              {val === "haidl"
                                ? "Haidl (Biasa)"
                                : "Nifas (Setelah Melahirkan)"}
                            </span>
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form1.control}
                  name="statusPengalaman"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Status Pengalaman Haid</FormLabel>
                      <div
                        className="grid sm:grid-cols-2 gap-4"
                        data-testid="radio-pengalaman"
                      >
                        {(
                          [
                            {
                              val: "mubtadiah",
                              label: "Mubtadi'ah",
                              desc: "Baru pertama kali mengalami haid.",
                            },
                            {
                              val: "mutadah",
                              label: "Mu'tadah",
                              desc: "Sudah pernah haid dan suci sebelumnya.",
                            },
                          ] as const
                        ).map(({ val, label, desc }) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => field.onChange(val)}
                            data-testid={`radio-pengalaman-${val}`}
                            className={cn(
                              "flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all text-left w-full",
                              field.value === val
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-primary/50",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                                  field.value === val
                                    ? "border-primary"
                                    : "border-muted-foreground",
                                )}
                              >
                                {field.value === val && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                )}
                              </div>
                              <span className="font-medium">{label}</span>
                            </div>
                            <span className="text-sm text-muted-foreground pl-8">
                              {desc}
                            </span>
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    className="rounded-full px-8 gap-2"
                    data-testid="btn-next-1"
                  >
                    Selanjutnya <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-0 shadow-md animate-in fade-in slide-in-from-right-8 duration-300">
          <CardHeader className="bg-primary/5 pb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(1)}
              className="w-fit mb-4 gap-2 -ml-3 text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Button>
            <CardTitle className="text-2xl font-serif">
              Fase Darah & Masa Bersih
            </CardTitle>
            <CardDescription>
              Catat fase darah dan masa bersih di sela-selanya secara berurutan.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-800 dark:text-blue-300">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Masa bersih <strong>kurang dari 15 hari</strong> di antara dua fase darah akan dihitung sebagai haid (Hukum Jam'u — pendapat Ar-Roajih Syafi'iyah). Masa bersih <strong>15 hari atau lebih</strong> memutus siklus haid.
              </p>
            </div>

            <Form {...form2}>
              <form
                onSubmit={form2.handleSubmit(onStep2Submit)}
                className="space-y-8"
                data-testid="form-step-2"
              >
                <div className="space-y-4">
                  {fields.map((field, index) => {
                    const tipe = form2.watch(`daftarFase.${index}.tipe`);
                    const isBersih = tipe === "bersih";

                    return (
                      <div
                        key={field.id}
                        className={cn(
                          "relative border rounded-2xl p-5 shadow-sm",
                          isBersih
                            ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                            : "bg-card border-border",
                        )}
                      >
                        <div
                          className={cn(
                            "absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm",
                            isBersih
                              ? "bg-emerald-500 text-white"
                              : "bg-primary text-primary-foreground",
                          )}
                        >
                          {index + 1}
                        </div>

                        <div className="flex items-center gap-2 mb-4 pl-5">
                          {isBersih ? (
                            <Wind className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Droplets className="w-4 h-4 text-primary" />
                          )}
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              isBersih
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-primary",
                            )}
                          >
                            {isBersih ? "Masa Bersih / Suci" : "Fase Darah"}
                          </span>

                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="ml-auto h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => remove(index)}
                              data-testid={`btn-remove-fase-${index}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-5">
                          {!isBersih && (
                            <FormField
                              control={form2.control}
                              name={`daftarFase.${index}.warna`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel>Warna Darah</FormLabel>
                                  <Select
                                    onValueChange={f.onChange}
                                    value={f.value ?? ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger
                                        data-testid={`select-warna-${index}`}
                                      >
                                        <SelectValue placeholder="Pilih warna" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="hitam">
                                        <div className="flex items-center gap-2">
                                          <div className="w-3 h-3 rounded-full bg-black" />{" "}
                                          Hitam
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="merah">
                                        <div className="flex items-center gap-2">
                                          <div className="w-3 h-3 rounded-full bg-red-600" />{" "}
                                          Merah
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="merah kekuningan">
                                        <div className="flex items-center gap-2">
                                          <div className="w-3 h-3 rounded-full bg-orange-500" />{" "}
                                          Merah Kekuningan
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="kuning">
                                        <div className="flex items-center gap-2">
                                          <div className="w-3 h-3 rounded-full bg-yellow-400" />{" "}
                                          Kuning
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="keruh">
                                        <div className="flex items-center gap-2">
                                          <div className="w-3 h-3 rounded-full bg-stone-500" />{" "}
                                          Keruh
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          <FormField
                            control={form2.control}
                            name={`daftarFase.${index}.hari`}
                            render={({ field: f }) => (
                              <FormItem className={isBersih ? "sm:col-span-1" : ""}>
                                <FormLabel>Jumlah Hari</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    placeholder="0"
                                    {...f}
                                    data-testid={`input-hari-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form2.control}
                            name={`daftarFase.${index}.jam`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormLabel>Tambah Jam (0–23)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="23"
                                    step="1"
                                    placeholder="0"
                                    {...f}
                                    data-testid={`input-jam-${index}`}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Opsional — untuk durasi yang tidak genap hari.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {!isBersih && (
                            <div className="sm:col-span-2 grid grid-cols-2 gap-4 border-t pt-4">
                              <FormField
                                control={form2.control}
                                name={`daftarFase.${index}.kental`}
                                render={({ field: f }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                      <FormLabel>Darah Kental?</FormLabel>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={f.value ?? false}
                                        onCheckedChange={f.onChange}
                                        data-testid={`switch-kental-${index}`}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form2.control}
                                name={`daftarFase.${index}.bau`}
                                render={({ field: f }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                      <FormLabel>Berbau Busuk?</FormLabel>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={f.value ?? false}
                                        onCheckedChange={f.onChange}
                                        data-testid={`switch-bau-${index}`}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}

                          {isBersih && (
                            <div className="sm:col-span-2">
                              <div className="rounded-lg bg-emerald-100/60 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-700 dark:text-emerald-400">
                                <strong>Catatan:</strong> Jika masa bersih ini kurang dari 15 hari, akan dihitung sebagai haid (Hukum Jam'u). Jika 15 hari atau lebih, siklus haid baru dimulai setelahnya.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {fields.length < 10 && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-dashed border-2 bg-transparent hover:bg-red-50 hover:border-red-400 hover:text-red-700 dark:hover:bg-red-950/20 dark:hover:border-red-700 dark:hover:text-red-400 transition-colors"
                      onClick={appendDarah}
                      data-testid="btn-add-darah"
                    >
                      <Droplets className="w-4 h-4 mr-2" /> Tambah Darah
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-dashed border-2 bg-transparent hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 dark:hover:bg-emerald-950/20 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-colors"
                      onClick={appendBersih}
                      data-testid="btn-add-bersih"
                    >
                      <Wind className="w-4 h-4 mr-2" /> Tambah Masa Bersih
                    </Button>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(1)}
                  >
                    Kembali
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="rounded-full px-8 gap-2"
                    data-testid="btn-next-2"
                  >
                    Selanjutnya <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-0 shadow-md animate-in fade-in slide-in-from-right-8 duration-300">
          <CardHeader className="bg-primary/5 pb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(2)}
              className="w-fit mb-4 gap-2 -ml-3 text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Button>
            <CardTitle className="text-2xl font-serif">
              Kebiasaan Haid
            </CardTitle>
            <CardDescription>
              Informasi mengenai siklus haid Anda sebelumnya (Adat).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form3}>
              <form
                onSubmit={form3.handleSubmit(onStep3Submit)}
                className="space-y-8"
                data-testid="form-step-3"
              >
                <FormField
                  control={form3.control}
                  name="ingatKebiasaan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Seberapa baik Anda mengingat kebiasaan haid
                        sebelumnya?
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-ingat-kebiasaan">
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ingat_semua">
                            Ingat semua (Tanggal mulai dan Jumlah hari)
                          </SelectItem>
                          <SelectItem value="ingat_durasi">
                            Hanya ingat jumlah hari (Durasi)
                          </SelectItem>
                          <SelectItem value="ingat_waktu">
                            Hanya ingat kapan mulai (Waktu/Tanggal)
                          </SelectItem>
                          <SelectItem value="lupa_semua">
                            Lupa semuanya (Waktu dan Durasi)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(form3.watch("ingatKebiasaan") === "ingat_semua" ||
                  form3.watch("ingatKebiasaan") === "ingat_durasi") && (
                  <FormField
                    control={form3.control}
                    name="kebiasaanHaidHari"
                    render={({ field }) => (
                      <FormItem className="animate-in fade-in zoom-in-95 duration-300">
                        <FormLabel>Berapa hari biasanya haid Anda?</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            data-testid="input-kebiasaan-hari"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(2)}
                  >
                    Kembali
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="rounded-full px-8 gap-2"
                    data-testid="btn-next-3"
                  >
                    Selanjutnya <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="border-0 shadow-md animate-in fade-in slide-in-from-right-8 duration-300">
          <CardHeader className="bg-primary/5 pb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setStep(formData.statusPengalaman === "mubtadiah" ? 2 : 3)
              }
              className="w-fit mb-4 gap-2 -ml-3 text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Button>
            <CardTitle className="text-2xl font-serif">
              Waktu Sholat & Qodlo
            </CardTitle>
            <CardDescription>
              Untuk menghitung kewajiban qodlo sholat akibat datang dan berhentinya haid.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form4}>
              <form
                onSubmit={form4.handleSubmit(onStep4Submit)}
                className="space-y-8"
                data-testid="form-step-4"
              >
                {/* ── Bagian 1: Datangnya Haid ── */}
                <div className="rounded-2xl border bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 p-5 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="w-4 h-4 text-rose-600" />
                    <span className="font-semibold text-rose-700 dark:text-rose-400 text-sm">
                      Saat Darah Mulai Keluar
                    </span>
                  </div>

                  <FormField
                    control={form4.control}
                    name="waktuMulaiDarah"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Darah pertama keluar pada waktu sholat apa?</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-waktu-mulai">
                              <SelectValue placeholder="Pilih waktu" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="subuh">Subuh</SelectItem>
                            <SelectItem value="dzuhur">Dzuhur</SelectItem>
                            <SelectItem value="ashar">Ashar</SelectItem>
                            <SelectItem value="maghrib">Maghrib</SelectItem>
                            <SelectItem value="isya">Isya'</SelectItem>
                            <SelectItem value="tidak_tahu">Tidak tahu / Tidak pasti</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form4.control}
                    name="sudahSholatSebelumDarah"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border bg-background p-4 shadow-sm">
                        <div className="space-y-0.5 pr-4">
                          <FormLabel className="text-base">Sudah sholat sebelum darah keluar?</FormLabel>
                          <FormDescription>
                            Jika sudah sholat terlebih dahulu sebelum darah keluar, tidak ada kewajiban qodlo untuk waktu itu.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            data-testid="switch-sudah-sholat"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* ── Bagian 2: Berhentinya Haid ── */}
                <div className="rounded-2xl border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-5 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Wind className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
                      Saat Darah Berhenti Total
                    </span>
                  </div>

                  <FormField
                    control={form4.control}
                    name="waktuBerhentiTotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Darah dipastikan berhenti total (bersih) pada waktu sholat apa?
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-waktu-berhenti">
                              <SelectValue placeholder="Pilih waktu" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="subuh">Subuh</SelectItem>
                            <SelectItem value="dzuhur">Dzuhur</SelectItem>
                            <SelectItem value="ashar">Ashar</SelectItem>
                            <SelectItem value="maghrib">Maghrib</SelectItem>
                            <SelectItem value="isya">Isya'</SelectItem>
                            <SelectItem value="tidak_tahu">Tidak tahu / Tidak pasti</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Pilih waktu saat kapas/pembalut sudah bersih tanpa noda. Jika berhenti di Ashar atau Isya', sholat sebelumnya (Dzuhur/Maghrib) ikut wajib diqodlo.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setStep(formData.statusPengalaman === "mubtadiah" ? 2 : 3)
                    }
                  >
                    Kembali
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="rounded-full px-8 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                    data-testid="btn-submit-calculate"
                  >
                    <Calculator className="w-4 h-4" /> Hitung Hasil
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 5 && hasil && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex justify-center mb-6">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center shadow-lg",
                hasil.tipeHasil === "haidl_normal"
                  ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  : hasil.tipeHasil === "nifas"
                    ? "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
                    : hasil.tipeHasil === "istihadloh"
                      ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
              )}
            >
              {hasil.tipeHasil === "error" ? (
                <AlertCircle className="w-10 h-10" />
              ) : (
                <Droplets className="w-10 h-10" />
              )}
            </div>
          </div>

          <Card
            className={cn(
              "border-t-4 shadow-md overflow-hidden",
              hasil.tipeHasil === "haidl_normal"
                ? "border-t-green-500"
                : hasil.tipeHasil === "nifas"
                  ? "border-t-teal-500"
                  : hasil.tipeHasil === "istihadloh"
                    ? "border-t-amber-500"
                    : "border-t-red-500",
            )}
          >
            <CardHeader className="text-center pb-8 border-b bg-muted/20">
              <CardTitle
                className="text-3xl font-serif leading-tight mb-2"
                data-testid="hasil-kesimpulan"
              >
                {hasil.kesimpulan}
              </CardTitle>
              {hasil.kategori && (
                <div
                  className="inline-block px-3 py-1 bg-background border rounded-full text-sm font-medium text-muted-foreground shadow-sm mt-2"
                  data-testid="hasil-kategori"
                >
                  {hasil.kategori}
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y">
                {hasil.hukumHaidl && (
                  <div className="p-6 sm:p-8">
                    <h3 className="text-lg font-medium mb-2 text-foreground">
                      Hukum Haidl
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {hasil.hukumHaidl}
                    </p>
                  </div>
                )}

                {hasil.hukumIstihadloh && (
                  <div className="p-6 sm:p-8">
                    <h3 className="text-lg font-medium mb-2 text-foreground">
                      Hukum Istihadloh
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {hasil.hukumIstihadloh}
                    </p>
                  </div>
                )}

                {hasil.daftarSiklus && hasil.daftarSiklus.length > 0 && (
                  <div className="p-6 sm:p-8">
                    <h3 className="text-lg font-medium mb-4 text-foreground flex items-center gap-2">
                      <Info className="w-5 h-5 text-blue-500" />
                      Rincian Siklus
                    </h3>
                    <div className="space-y-3">
                      {hasil.daftarSiklus.map((siklus) => (
                        <div
                          key={siklus.nomorSiklus}
                          className={cn(
                            "rounded-xl p-4 border",
                            siklus.tipe === "haidl_normal"
                              ? "border-green-200 bg-green-50/60 dark:border-green-800 dark:bg-green-950/20"
                              : "border-amber-200 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20",
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-sm">
                              Siklus {siklus.nomorSiklus}
                            </span>
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-semibold",
                                siklus.tipe === "haidl_normal"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
                              )}
                            >
                              {siklus.tipe === "haidl_normal"
                                ? "HAIDL"
                                : "ISTIHADLOH"}
                            </span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              Total: {formatDurasi(siklus.totalJamSiklus)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {siklus.hukumDetail}
                          </p>
                          {siklus.bersihDalamJam > 0 && (
                            <div className="mt-2 flex items-start gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                              <Wind className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                              <span>
                                Masa bersih {formatDurasi(siklus.bersihDalamJam)} di dalam siklus ini dihitung sebagai haid (Hukum Jam'u)
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {hasil.adaPemisahBersih && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-700 dark:text-blue-400">
                        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>
                          Siklus-siklus di atas dipisahkan oleh masa suci 15 hari atau lebih, sehingga masing-masing dihitung sebagai siklus haid yang berdiri sendiri.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {hasil.qodloSholatMulai && (
                  <div className="p-6 sm:p-8 bg-rose-50/50 dark:bg-rose-950/20">
                    <h3 className="text-lg font-medium mb-2 text-rose-700 dark:text-rose-400 flex items-center gap-2">
                      <Droplets className="w-5 h-5" />
                      Qodlo Sholat — Sebab Datangnya Haid
                    </h3>
                    <p className="text-foreground leading-relaxed">
                      {hasil.qodloSholatMulai}
                    </p>
                  </div>
                )}

                {hasil.qodloSholat && (
                  <div className="p-6 sm:p-8 bg-primary/5">
                    <h3 className="text-lg font-medium mb-2 text-primary flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Qodlo Sholat — Sebab Berhentinya Haid
                    </h3>
                    <p className="font-medium text-foreground">
                      {hasil.qodloSholat}
                    </p>
                  </div>
                )}

                {hasil.hutangIbadah && (
                  <div className="p-6 sm:p-8 bg-orange-50/60 dark:bg-orange-950/20 border-l-4 border-orange-400">
                    <h3 className="text-lg font-medium mb-3 text-orange-700 dark:text-orange-400 flex items-center gap-2">
                      <TriangleAlert className="w-5 h-5" />
                      Hutang Ibadah Masa Penantian
                    </h3>
                    <p className="text-foreground leading-relaxed">
                      {hasil.hutangIbadah}
                    </p>
                    <div className="mt-3 flex items-start gap-2 text-xs text-orange-700/80 dark:text-orange-400/80">
                      <BookOpen className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>Berdasarkan kaidah Kitab Uyunul Masa-il Linnisa': wanita mustahadloh baru mengetahui statusnya setelah hari ke-15, sehingga ibadah yang ditinggalkan selama masa istihadloh dalam periode penantian wajib diqodlo'.</span>
                    </div>
                  </div>
                )}

                {hasil.panduanBersuci && (
                  <div className="p-6 sm:p-8 bg-amber-50/50 dark:bg-amber-950/20">
                    <h3 className="text-lg font-medium mb-4 text-amber-800 dark:text-amber-500">
                      Panduan Bersuci
                    </h3>
                    <div className="whitespace-pre-wrap text-sm text-amber-900/80 dark:text-amber-200/80 leading-relaxed font-medium">
                      {hasil.panduanBersuci}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-8">
            <Button
              onClick={handleReset}
              variant="outline"
              size="lg"
              className="rounded-full px-8 gap-2"
              data-testid="btn-reset"
            >
              <RotateCcw className="w-4 h-4" /> Hitung Ulang
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
