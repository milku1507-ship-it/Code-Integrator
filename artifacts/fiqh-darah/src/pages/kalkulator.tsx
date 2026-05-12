import { useState } from "react";
import { Link } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, ArrowRight, AlertCircle, Calculator, Plus, Trash2, CheckCircle2, RotateCcw, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { jalankanMesinFiqh, InputUser, HasilAnalisis, FaseDarah } from "@/lib/fiqhEngine";
import { cn } from "@/lib/utils";

const step1Schema = z.object({
  usiaTahun: z.coerce.number().min(1, "Usia minimal 1 tahun").max(100, "Usia tidak valid"),
  kondisiAwal: z.enum(["haidl", "nifas"], { required_error: "Pilih kondisi awal" }),
  statusPengalaman: z.enum(["mubtadiah", "mutadah"], { required_error: "Pilih status pengalaman" }),
});

const faseSchema = z.object({
  warna: z.enum(["hitam", "merah", "merah kekuningan", "kuning", "keruh"], { required_error: "Pilih warna darah" }),
  kental: z.boolean(),
  bau: z.boolean(),
  hari: z.coerce.number().min(0, "Tidak boleh negatif").max(100, "Jumlah hari tidak valid"),
  jam: z.coerce.number().min(0, "Tidak boleh negatif").max(23, "Maksimal 23 jam (gunakan hari untuk lebih dari 24 jam)"),
}).refine(data => (data.hari * 24 + data.jam) > 0, {
  message: "Masukkan minimal 1 jam atau setengah hari (0.5)",
  path: ["hari"],
});

const step2Schema = z.object({
  daftarFaseDarah: z.array(faseSchema).min(1, "Minimal 1 fase darah").max(5, "Maksimal 5 fase darah"),
});

const step3Schema = z.object({
  ingatKebiasaan: z.enum(["ingat_semua", "lupa_semua", "ingat_durasi", "ingat_waktu"], { required_error: "Pilih status kebiasaan" }),
  kebiasaanHaidHari: z.coerce.number().min(0).max(15).optional(),
}).refine(data => {
  if ((data.ingatKebiasaan === "ingat_semua" || data.ingatKebiasaan === "ingat_durasi") && !data.kebiasaanHaidHari) {
    return false;
  }
  return true;
}, {
  message: "Masukkan jumlah hari kebiasaan",
  path: ["kebiasaanHaidHari"]
});

const step4Schema = z.object({
  waktuBerhentiTotal: z.enum(["subuh", "dzuhur", "ashar", "maghrib", "isya", "tidak_tahu", ""], { required_error: "Pilih waktu berhenti" }),
});

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

  const form2 = useForm<z.infer<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      daftarFaseDarah: formData.daftarFaseDarah || [{ warna: "merah", kental: false, bau: false, hari: 1, jam: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form2.control,
    name: "daftarFaseDarah",
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
      waktuBerhentiTotal: formData.waktuBerhentiTotal || "",
    },
  });

  const onStep1Submit = (data: z.infer<typeof step1Schema>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const onStep2Submit = (data: z.infer<typeof step2Schema>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    if (formData.statusPengalaman === "mubtadiah") {
      setStep(4); // Skip kebiasaan if mubtadiah
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
      const waktu = (data.waktuBerhentiTotal === "tidak_tahu" ? "" : data.waktuBerhentiTotal) as InputUser["waktuBerhentiTotal"];
      const rawFases = (formData.daftarFaseDarah ?? []).map(f => ({
        ...f,
        hari: parseFloat(String(f.hari ?? 0)) || 0,
        jam: parseInt(String(f.jam ?? 0), 10) || 0,
      }));
      const finalData: InputUser = {
        usiaTahun: formData.usiaTahun ?? 9,
        kondisiAwal: formData.kondisiAwal ?? "haidl",
        statusPengalaman: formData.statusPengalaman ?? "mubtadiah",
        ingatKebiasaan: formData.ingatKebiasaan ?? "lupa_semua",
        kebiasaanHaidHari: parseFloat(String(formData.kebiasaanHaidHari ?? 0)) || 0,
        daftarFaseDarah: rawFases,
        waktuBerhentiTotal: waktu,
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
        hukumIstihadloh: "Mohon lengkapi data Anda dan pastikan semua kolom terisi dengan benar.",
        qodloSholat: "",
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
    form2.reset({ daftarFaseDarah: [{ warna: "merah", kental: false, bau: false, hari: 1, jam: 0 }] });
    form3.reset({ ingatKebiasaan: "ingat_semua", kebiasaanHaidHari: 7 });
    form4.reset({ waktuBerhentiTotal: "" });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 w-full">
      {step < 5 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Langkah {step} dari 4</span>
            <span className="text-sm font-medium text-primary">{Math.round((step / 4) * 100)}%</span>
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
            <CardDescription>Informasi umum mengenai kondisi Anda saat ini.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form1}>
              <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-8" data-testid="form-step-1">
                
                <FormField
                  control={form1.control}
                  name="usiaTahun"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usia (Tahun Qomariyah)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-usia" />
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
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid sm:grid-cols-2 gap-4"
                          data-testid="radio-kondisi"
                        >
                          <FormItem>
                            <FormControl>
                              <div className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                field.value === "haidl" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                              )}>
                                <RadioGroupItem value="haidl" className="sr-only" />
                                <div className={cn(
                                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                  field.value === "haidl" ? "border-primary" : "border-muted-foreground"
                                )}>
                                  {field.value === "haidl" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                </div>
                                <span className="font-medium">Haidl (Biasa)</span>
                              </div>
                            </FormControl>
                          </FormItem>
                          <FormItem>
                            <FormControl>
                              <div className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                field.value === "nifas" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                              )}>
                                <RadioGroupItem value="nifas" className="sr-only" />
                                <div className={cn(
                                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                  field.value === "nifas" ? "border-primary" : "border-muted-foreground"
                                )}>
                                  {field.value === "nifas" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                </div>
                                <span className="font-medium">Nifas (Setelah Melahirkan)</span>
                              </div>
                            </FormControl>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
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
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid sm:grid-cols-2 gap-4"
                          data-testid="radio-pengalaman"
                        >
                          <FormItem>
                            <FormControl>
                              <div className={cn(
                                "flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                field.value === "mubtadiah" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                              )}>
                                <div className="flex items-center gap-3">
                                  <RadioGroupItem value="mubtadiah" className="sr-only" />
                                  <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                    field.value === "mubtadiah" ? "border-primary" : "border-muted-foreground"
                                  )}>
                                    {field.value === "mubtadiah" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                  </div>
                                  <span className="font-medium">Mubtadi'ah</span>
                                </div>
                                <span className="text-sm text-muted-foreground pl-8">Baru pertama kali mengalami haid.</span>
                              </div>
                            </FormControl>
                          </FormItem>
                          <FormItem>
                            <FormControl>
                              <div className={cn(
                                "flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                field.value === "mutadah" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                              )}>
                                <div className="flex items-center gap-3">
                                  <RadioGroupItem value="mutadah" className="sr-only" />
                                  <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                    field.value === "mutadah" ? "border-primary" : "border-muted-foreground"
                                  )}>
                                    {field.value === "mutadah" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                  </div>
                                  <span className="font-medium">Mu'tadah</span>
                                </div>
                                <span className="text-sm text-muted-foreground pl-8">Sudah pernah haid dan suci sebelumnya.</span>
                              </div>
                            </FormControl>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" size="lg" className="rounded-full px-8 gap-2" data-testid="btn-next-1">
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
            <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="w-fit mb-4 gap-2 -ml-3 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Button>
            <CardTitle className="text-2xl font-serif">Fase Darah</CardTitle>
            <CardDescription>Catat warna, sifat, dan durasi darah yang keluar secara berurutan.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form2}>
              <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-8" data-testid="form-step-2">
                
                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <div key={field.id} className="relative bg-card border rounded-2xl p-5 shadow-sm">
                      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
                        {index + 1}
                      </div>
                      
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => remove(index)}
                          data-testid={`btn-remove-fase-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}

                      <div className="grid sm:grid-cols-2 gap-6 pt-2">
                        <FormField
                          control={form2.control}
                          name={`daftarFaseDarah.${index}.warna`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Warna Darah</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid={`select-warna-${index}`}>
                                    <SelectValue placeholder="Pilih warna" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="hitam"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-black" /> Hitam</div></SelectItem>
                                  <SelectItem value="merah"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-600" /> Merah</div></SelectItem>
                                  <SelectItem value="merah kekuningan"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /> Merah Kekuningan</div></SelectItem>
                                  <SelectItem value="kuning"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-400" /> Kuning</div></SelectItem>
                                  <SelectItem value="keruh"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-stone-500" /> Keruh</div></SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form2.control}
                          name={`daftarFaseDarah.${index}.hari`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Jumlah Hari</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" step="1" placeholder="0" {...field} data-testid={`input-hari-${index}`} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form2.control}
                          name={`daftarFaseDarah.${index}.jam`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tambah Jam (0–23)</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" max="23" step="1" placeholder="0" {...field} data-testid={`input-jam-${index}`} />
                              </FormControl>
                              <FormDescription>Opsional — untuk durasi yang tidak genap hari.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="sm:col-span-2 grid grid-cols-2 gap-4 border-t pt-4">
                          <FormField
                            control={form2.control}
                            name={`daftarFaseDarah.${index}.kental`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Darah Kental?</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value ?? false}
                                    onCheckedChange={field.onChange}
                                    data-testid={`switch-kental-${index}`}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form2.control}
                            name={`daftarFaseDarah.${index}.bau`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Berbau Busuk?</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value ?? false}
                                    onCheckedChange={field.onChange}
                                    data-testid={`switch-bau-${index}`}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {fields.length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed border-2 bg-transparent hover:bg-muted"
                    onClick={() => append({ warna: "merah", kental: false, bau: false, hari: 1, jam: 0 })}
                    data-testid="btn-add-fase"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Tambah Fase Darah
                  </Button>
                )}

                <div className="flex justify-between pt-4 border-t">
                  <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                    Kembali
                  </Button>
                  <Button type="submit" size="lg" className="rounded-full px-8 gap-2" data-testid="btn-next-2">
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
            <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="w-fit mb-4 gap-2 -ml-3 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Button>
            <CardTitle className="text-2xl font-serif">Kebiasaan Haid</CardTitle>
            <CardDescription>Informasi mengenai siklus haid Anda sebelumnya (Adat).</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form3}>
              <form onSubmit={form3.handleSubmit(onStep3Submit)} className="space-y-8" data-testid="form-step-3">
                
                <FormField
                  control={form3.control}
                  name="ingatKebiasaan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seberapa baik Anda mengingat kebiasaan haid sebelumnya?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-ingat-kebiasaan">
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ingat_semua">Ingat semua (Tanggal mulai dan Jumlah hari)</SelectItem>
                          <SelectItem value="ingat_durasi">Hanya ingat jumlah hari (Durasi)</SelectItem>
                          <SelectItem value="ingat_waktu">Hanya ingat kapan mulai (Waktu/Tanggal)</SelectItem>
                          <SelectItem value="lupa_semua">Lupa semuanya (Waktu dan Durasi)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(form3.watch("ingatKebiasaan") === "ingat_semua" || form3.watch("ingatKebiasaan") === "ingat_durasi") && (
                  <FormField
                    control={form3.control}
                    name="kebiasaanHaidHari"
                    render={({ field }) => (
                      <FormItem className="animate-in fade-in zoom-in-95 duration-300">
                        <FormLabel>Berapa hari biasanya haid Anda?</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-kebiasaan-hari" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-between pt-4 border-t">
                  <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                    Kembali
                  </Button>
                  <Button type="submit" size="lg" className="rounded-full px-8 gap-2" data-testid="btn-next-3">
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
            <Button variant="ghost" size="sm" onClick={() => setStep(formData.statusPengalaman === "mubtadiah" ? 2 : 3)} className="w-fit mb-4 gap-2 -ml-3 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Button>
            <CardTitle className="text-2xl font-serif">Waktu Darah Berhenti</CardTitle>
            <CardDescription>Untuk menentukan kewajiban qodlo (mengganti) sholat.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form4}>
              <form onSubmit={form4.handleSubmit(onStep4Submit)} className="space-y-8" data-testid="form-step-4">
                
                <FormField
                  control={form4.control}
                  name="waktuBerhentiTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saat darah dipastikan berhenti total (bersih), pada waktu sholat apa?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <FormDescription>Pilih waktu dimana Anda melihat kapas/pembalut sudah bersih tanpa noda darah.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between pt-4 border-t">
                  <Button type="button" variant="ghost" onClick={() => setStep(formData.statusPengalaman === "mubtadiah" ? 2 : 3)}>
                    Kembali
                  </Button>
                  <Button type="submit" size="lg" className="rounded-full px-8 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="btn-submit-calculate">
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
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center shadow-lg",
              hasil.tipeHasil === "haidl_normal" ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
              hasil.tipeHasil === "nifas" ? "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400" :
              hasil.tipeHasil === "istihadloh" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
              "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {hasil.tipeHasil === "error" ? <AlertCircle className="w-10 h-10" /> : <Droplets className="w-10 h-10" />}
            </div>
          </div>

          <Card className={cn(
            "border-t-4 shadow-md overflow-hidden",
            hasil.tipeHasil === "haidl_normal" ? "border-t-green-500" :
            hasil.tipeHasil === "nifas" ? "border-t-teal-500" :
            hasil.tipeHasil === "istihadloh" ? "border-t-amber-500" :
            "border-t-red-500"
          )}>
            <CardHeader className="text-center pb-8 border-b bg-muted/20">
              <CardTitle className="text-3xl font-serif leading-tight mb-2" data-testid="hasil-kesimpulan">
                {hasil.kesimpulan}
              </CardTitle>
              {hasil.kategori && (
                <div className="inline-block px-3 py-1 bg-background border rounded-full text-sm font-medium text-muted-foreground shadow-sm mt-2" data-testid="hasil-kategori">
                  {hasil.kategori}
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {hasil.hukumHaidl && (
                  <div className="p-6 sm:p-8">
                    <h3 className="text-lg font-medium mb-2 text-foreground">Hukum Haidl</h3>
                    <p className="text-muted-foreground leading-relaxed">{hasil.hukumHaidl}</p>
                  </div>
                )}
                
                {hasil.hukumIstihadloh && (
                  <div className="p-6 sm:p-8">
                    <h3 className="text-lg font-medium mb-2 text-foreground">Hukum Istihadloh</h3>
                    <p className="text-muted-foreground leading-relaxed">{hasil.hukumIstihadloh}</p>
                  </div>
                )}

                {hasil.qodloSholat && (
                  <div className="p-6 sm:p-8 bg-primary/5">
                    <h3 className="text-lg font-medium mb-2 text-primary flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Qodlo Sholat
                    </h3>
                    <p className="font-medium text-foreground">{hasil.qodloSholat}</p>
                  </div>
                )}

                {hasil.panduanBersuci && (
                  <div className="p-6 sm:p-8 bg-amber-50/50 dark:bg-amber-950/20">
                    <h3 className="text-lg font-medium mb-4 text-amber-800 dark:text-amber-500">Panduan Bersuci</h3>
                    <div className="whitespace-pre-wrap text-sm text-amber-900/80 dark:text-amber-200/80 leading-relaxed font-medium">
                      {hasil.panduanBersuci}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-8">
            <Button onClick={handleReset} variant="outline" size="lg" className="rounded-full px-8 gap-2" data-testid="btn-reset">
              <RotateCcw className="w-4 h-4" /> Hitung Ulang
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
