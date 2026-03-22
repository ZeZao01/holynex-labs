import { useState, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { Send, ArrowRight, ArrowLeft, Check, ChevronRight } from "lucide-react";
import RevealBox from "@/components/RevealBox";
import { salvarOrcamento, uploadOrcamentoAssets, TIPOS_PROJETO, FAIXAS_INVESTIMENTO, PRAZOS, URGENCIAS, ESTAGIOS_OPERACAO } from "@/lib/orcamentos";
import { NICHES } from "@/lib/admin-types";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Dados Básicos", num: 1 },
  { label: "Contexto", num: 2 },
  { label: "Escopo", num: 3 },
  { label: "Revisão", num: 4 },
];

interface FormData {
  nome: string;
  email: string;
  empresa: string;
  descricao: string;
  descricao_detalhada: string;
  tipo_projeto: string[];
  nicho: string[];
  objetivo: string;
  dor_principal: string;
  faixa_investimento: string;
  orcamento_estimado: string;
  prazo_desejado: string;
  urgencia: string;
  numero_usuarios: string;
  precisa_login: boolean;
  precisa_admin: boolean;
  precisa_area_cliente: boolean;
  precisa_integracoes: boolean;
  precisa_app_mobile: boolean;
  aceita_mvp: boolean;
  estagio_operacao: string;
}

interface VisualRef {
  file: File;
  previewUrl: string;
}

const MAX_FILES = 6;
const MAX_FILE_SIZE = 6 * 1024 * 1024;
const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"];

function SelectChips({ options, value, onChange, className }: { options: readonly string[]; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
            value === opt
              ? "bg-primary/20 border-primary/50 text-primary"
              : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function MultiSelectChips({ options, value, onChange, max = 3, className }: { options: readonly string[]; value: string[]; onChange: (v: string[]) => void; max?: number; className?: string }) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else if (value.length < max) {
      onChange([...value, opt]);
    }
  };
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((opt) => {
        const selected = value.includes(opt);
        const disabled = !selected && value.length >= max;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            disabled={disabled}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              selected
                ? "bg-primary/20 border-primary/50 text-primary"
                : disabled
                  ? "bg-muted/20 border-border/30 text-muted-foreground/40 cursor-not-allowed"
                  : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            {selected && <Check className="inline h-3 w-3 mr-1" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ToggleChip({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
        checked
          ? "bg-primary/20 border-primary/50 text-primary"
          : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/30"
      )}
    >
      {checked && <Check className="inline h-3 w-3 mr-1" />}
      {label}
    </button>
  );
}

export default function Contato() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const { t } = useLanguage();
  const [visualRefs, setVisualRefs] = useState<VisualRef[]>([]);
  const [form, setForm] = useState<FormData>({
    nome: "", email: "", empresa: "", descricao: "", descricao_detalhada: "",
    tipo_projeto: [], nicho: [], objetivo: "", dor_principal: "",
    faixa_investimento: "", orcamento_estimado: "", prazo_desejado: "", urgencia: "sem_urgencia",
    numero_usuarios: "", precisa_login: false, precisa_admin: false,
    precisa_area_cliente: false, precisa_integracoes: false,
    precisa_app_mobile: false, aceita_mvp: true, estagio_operacao: "",
  });

  const set = (key: keyof FormData, val: any) => setForm((p) => ({ ...p, [key]: val }));

  const canNext = () => {
    if (step === 1) return form.nome && form.email && form.descricao;
    return true;
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const next: VisualRef[] = [];
    const errors: string[] = [];
    const remainingSlots = MAX_FILES - visualRefs.length;

    files.slice(0, remainingSlots).forEach((file) => {
      if (!ACCEPTED_MIME.includes(file.type)) {
        errors.push(`${file.name}: formato não suportado.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: excede 6MB.`);
        return;
      }
      next.push({ file, previewUrl: URL.createObjectURL(file) });
    });

    if (files.length > remainingSlots) {
      errors.push(`Limite de ${MAX_FILES} imagens atingido.`);
    }

    if (errors.length) {
      const message = errors.join(" ");
      setUploadError(message);
      toast.error(message);
    } else {
      setUploadError(null);
    }

    if (next.length) {
      setVisualRefs((prev) => [...prev, ...next]);
    }

    event.target.value = "";
  };

  const removeVisual = (index: number) => {
    setVisualRefs((prev) => {
      const item = prev[index];
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const resetVisuals = () => {
    visualRefs.forEach((ref) => URL.revokeObjectURL(ref.previewUrl));
    setVisualRefs([]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setUploadError(null);
    try {
      const fullDescricao = [form.descricao, form.descricao_detalhada].filter(Boolean).join("\n\n");
      const created = await salvarOrcamento({
        ...form,
        descricao: fullDescricao,
        tipo_projeto: form.tipo_projeto.join(", "),
        nicho: form.nicho.join(", "),
        origem_lead: "site",
      });

      if (visualRefs.length) {
        setUploading(true);
        try {
          await uploadOrcamentoAssets(created.id, visualRefs.map((ref) => ref.file));
        } catch {
          const message = "Orçamento recebido, mas houve erro no envio das imagens.";
          setUploadError(message);
          toast.error(message);
        } finally {
          setUploading(false);
        }
      }

      toast.success(t("contact.success"));

      setForm({
        nome: "", email: "", empresa: "", descricao: "", descricao_detalhada: "",
        tipo_projeto: [], nicho: [], objetivo: "", dor_principal: "",
        faixa_investimento: "", orcamento_estimado: "", prazo_desejado: "", urgencia: "sem_urgencia",
        numero_usuarios: "", precisa_login: false, precisa_admin: false,
        precisa_area_cliente: false, precisa_integracoes: false,
        precisa_app_mobile: false, aceita_mvp: true, estagio_operacao: "",
      });
      resetVisuals();
      setStep(1);
    } catch {
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-16 relative z-10">
      <div className="container mx-auto px-4">
        <RevealBox className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">{t("nav.contact")}</span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mt-3 mb-4">{t("contact.title")}</h1>
          <p className="text-muted-foreground">{t("contact.desc")}</p>
        </RevealBox>

        {/* Stepper */}
        <div className="max-w-lg mx-auto mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center gap-1.5">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                  step >= s.num ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                )}>
                  {step > s.num ? <Check className="h-3.5 w-3.5" /> : s.num}
                </div>
                <span className="text-xs text-muted-foreground hidden sm:inline">{s.label}</span>
                {i < STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        <RevealBox delay={0.2} className="max-w-lg mx-auto card-animated glass rounded-2xl p-6 sm:p-8">
          {/* Step 1: Dados Básicos */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold mb-4">Dados Básicos</h2>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t("contact.name")} *</label>
                <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder={t("contact.name.placeholder")} className="bg-muted/50 border-border/50" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t("contact.email")} *</label>
                <Input value={form.email} onChange={(e) => set("email", e.target.value)} type="email" placeholder={t("contact.email.placeholder")} className="bg-muted/50 border-border/50" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t("contact.company")}</label>
                <Input value={form.empresa} onChange={(e) => set("empresa", e.target.value)} placeholder={t("contact.company.placeholder")} className="bg-muted/50 border-border/50" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t("contact.project")} *</label>
                <Textarea value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder={t("contact.project.placeholder")} rows={4} className="bg-muted/50 border-border/50" />
              </div>
            </div>
          )}

          {/* Step 2: Contexto */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold mb-4">Contexto do Projeto</h2>
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Projeto <span className="text-muted-foreground font-normal">(até 3)</span></label>
                <MultiSelectChips options={TIPOS_PROJETO} value={form.tipo_projeto} onChange={(v) => set("tipo_projeto", v)} max={3} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Nicho / Segmento <span className="text-muted-foreground font-normal">(até 3)</span></label>
                <MultiSelectChips options={NICHES} value={form.nicho} onChange={(v) => set("nicho", v)} max={3} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Objetivo principal</label>
                <Input value={form.objetivo} onChange={(e) => set("objetivo", e.target.value)} placeholder="Ex: Automatizar vendas, gerenciar clientes..." className="bg-muted/50 border-border/50" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Maior dor / problema atual</label>
                <Textarea value={form.dor_principal} onChange={(e) => set("dor_principal", e.target.value)} placeholder="Qual problema mais urgente precisa resolver? O que mais atrapalha sua operação hoje?" rows={3} className="bg-muted/50 border-border/50" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Descrição detalhada da necessidade</label>
                <Textarea value={form.descricao_detalhada} onChange={(e) => set("descricao_detalhada", e.target.value)} placeholder="Explique o contexto, processos, dores e resultados esperados." rows={4} className="bg-muted/50 border-border/50" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Estágio da operação</label>
                <SelectChips options={ESTAGIOS_OPERACAO} value={form.estagio_operacao} onChange={(v) => set("estagio_operacao", v)} />
              </div>
            </div>
          )}

          {/* Step 3: Escopo */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold mb-4">Escopo & Investimento</h2>
              <div>
                <label className="text-sm font-medium mb-2 block">Faixa de investimento</label>
                <SelectChips options={FAIXAS_INVESTIMENTO} value={form.faixa_investimento} onChange={(v) => set("faixa_investimento", v)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Orçamento estimado (opcional)</label>
                <Input value={form.orcamento_estimado} onChange={(e) => set("orcamento_estimado", e.target.value)} placeholder="Ex: R$ 25.000" className="bg-muted/50 border-border/50" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Prazo desejado</label>
                <SelectChips options={PRAZOS} value={form.prazo_desejado} onChange={(v) => set("prazo_desejado", v)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Urgência</label>
                <SelectChips options={URGENCIAS.map(u => u.label)} value={URGENCIAS.find(u => u.value === form.urgencia)?.label || ""} onChange={(v) => set("urgencia", URGENCIAS.find(u => u.label === v)?.value || "sem_urgencia")} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nº estimado de usuários</label>
                <Input value={form.numero_usuarios} onChange={(e) => set("numero_usuarios", e.target.value)} placeholder="Ex: 10, 100, 1000+" className="bg-muted/50 border-border/50" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">O sistema precisa de:</label>
                <div className="flex flex-wrap gap-2">
                  <ToggleChip label="Login / Autenticação" checked={form.precisa_login} onChange={(v) => set("precisa_login", v)} />
                  <ToggleChip label="Painel administrativo" checked={form.precisa_admin} onChange={(v) => set("precisa_admin", v)} />
                  <ToggleChip label="Área do cliente" checked={form.precisa_area_cliente} onChange={(v) => set("precisa_area_cliente", v)} />
                  <ToggleChip label="Integrações externas" checked={form.precisa_integracoes} onChange={(v) => set("precisa_integracoes", v)} />
                  <ToggleChip label="App mobile" checked={form.precisa_app_mobile} onChange={(v) => set("precisa_app_mobile", v)} />
                  <ToggleChip label="Aceita MVP" checked={form.aceita_mvp} onChange={(v) => set("aceita_mvp", v)} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Referências visuais</label>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-3">
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFiles}
                    className="block w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>PNG, JPG ou WEBP até 6MB • Máx. {MAX_FILES} imagens</span>
                    <span>{visualRefs.length}/{MAX_FILES}</span>
                  </div>
                  {uploading && <p className="text-xs text-primary">Enviando imagens...</p>}
                  {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
                  {visualRefs.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {visualRefs.map((ref, index) => (
                        <div key={ref.previewUrl} className="relative group">
                          <img src={ref.previewUrl} alt={`Referência ${index + 1}`} className="h-20 w-full rounded-lg object-cover border border-border/50" />
                          <button
                            type="button"
                            onClick={() => removeVisual(index)}
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background/80 border border-border text-[10px] hover:bg-background"
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Revisão */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold mb-4">Revisão</h2>
              <div className="space-y-3 text-sm">
                <Row label="Nome" value={form.nome} />
                <Row label="Email" value={form.email} />
                {form.empresa && <Row label="Empresa" value={form.empresa} />}
                <Row label="Descrição" value={form.descricao} />
                {form.tipo_projeto.length > 0 && <Row label="Tipo" value={form.tipo_projeto.join(", ")} />}
                {form.nicho.length > 0 && <Row label="Nicho" value={form.nicho.join(", ")} />}
                {form.objetivo && <Row label="Objetivo" value={form.objetivo} />}
                {form.dor_principal && <Row label="Dor principal" value={form.dor_principal} />}
                {form.descricao_detalhada && <Row label="Detalhamento" value={form.descricao_detalhada} />}
                {form.faixa_investimento && <Row label="Investimento" value={form.faixa_investimento} />}
                {form.orcamento_estimado && <Row label="Orçamento" value={form.orcamento_estimado} />}
                {form.prazo_desejado && <Row label="Prazo" value={form.prazo_desejado} />}
                {form.numero_usuarios && <Row label="Usuários" value={form.numero_usuarios} />}
                {visualRefs.length > 0 && <Row label="Referências" value={`${visualRefs.length} imagem(ns)`} />}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {form.precisa_login && <Tag>Login</Tag>}
                  {form.precisa_admin && <Tag>Admin</Tag>}
                  {form.precisa_area_cliente && <Tag>Área Cliente</Tag>}
                  {form.precisa_integracoes && <Tag>Integrações</Tag>}
                  {form.precisa_app_mobile && <Tag>Mobile</Tag>}
                  {form.aceita_mvp && <Tag>MVP OK</Tag>}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
            ) : <div />}
            {step < 4 ? (
              <button
                type="button"
                disabled={!canNext()}
                onClick={() => setStep(step + 1)}
                className="btn-glow inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-foreground disabled:opacity-50"
              >
                Próximo <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="btn-glow inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-foreground disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {loading || uploading ? t("contact.sending") : t("contact.submit")}
              </button>
            )}
          </div>
        </RevealBox>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground min-w-[80px]">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/15 text-primary border border-primary/20">{children}</span>;
}
