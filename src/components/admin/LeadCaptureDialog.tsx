import { useMemo, useState } from "react";
import { BriefcaseBusiness, Copy, ExternalLink, FileUp, Loader2, MapPin, MessageCircle, Plus, Search, Star, Upload } from "lucide-react";
import { salvarOrcamento, type Orcamento, TIPOS_PROJETO } from "@/lib/orcamentos";
import { buildLeadBriefing, leadImportKey, parseLeadCsv, type LeadImportRow } from "@/lib/lead-import";
import {
  PROSPECT_NICHE_GROUPS,
  PROSPECT_OFFERS,
  prospectToLeadImport,
  searchLeadProspects,
  type LeadProspect,
  type ProspectOfferMode,
} from "@/lib/lead-prospecting";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface LeadCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingLeads: Orcamento[];
  onImported: () => Promise<void> | void;
}

const emptyLead: LeadImportRow = {
  name: "",
  company: "",
  email: "",
  phone: "",
  city: "",
  niche: "",
  projectType: "Landing page / Site institucional",
  objective: "",
  address: "",
  website: "",
  instagram: "",
  source: "manual",
};

function toExistingKey(lead: Orcamento): string {
  return leadImportKey({ name: lead.nome, company: lead.empresa, email: lead.email });
}

async function persistLead(lead: LeadImportRow) {
  const briefing = buildLeadBriefing(lead);
  return salvarOrcamento({
    nome: lead.name || lead.company,
    email: lead.email,
    empresa: lead.company || lead.name,
    descricao: briefing.description,
    descricao_detalhada: briefing.details,
    tipo_projeto: lead.projectType,
    nicho: lead.niche,
    objetivo: lead.objective,
    origem_lead: lead.source === "google_places" ? "google" : lead.source === "csv" ? "outro" : lead.source || "outro",
    aceita_mvp: true,
    telefone: lead.phone,
    endereco: lead.address,
    cidade: lead.city,
    google_place_id: lead.googlePlaceId,
    google_maps_url: lead.googleMapsUrl,
    avaliacao_google: lead.rating,
    total_avaliacoes: lead.reviewCount,
    status_negocio_google: lead.businessStatus,
    horario_funcionamento: lead.openingHours,
    score_prospeccao: lead.prospectScore,
    motivos_score: lead.scoreReasons,
    oferta_prospeccao: lead.suggestedOffer,
    projeto_sugerido: lead.suggestedProject,
    resumo_projeto_sugerido: lead.projectSummary,
    mensagem_prospeccao: lead.readyMessage,
  });
}

export default function LeadCaptureDialog({ open, onOpenChange, existingLeads, onImported }: LeadCaptureDialogProps) {
  const [manual, setManual] = useState<LeadImportRow>(emptyLead);
  const [rows, setRows] = useState<LeadImportRow[]>([]);
  const [city, setCity] = useState("");
  const [niche, setNiche] = useState("");
  const [offerMode, setOfferMode] = useState<ProspectOfferMode>("marketing");
  const [prospects, setProspects] = useState<LeadProspect[]>([]);
  const [messageIndexes, setMessageIndexes] = useState<Record<string, number>>({});
  const [selectedProspects, setSelectedProspects] = useState<Set<string>>(new Set());
  const [attribution, setAttribution] = useState("");
  const [searchMeta, setSearchMeta] = useState({ totalFetched: 0, resultLimit: 60 });
  const [busy, setBusy] = useState(false);
  const existingKeys = useMemo(() => new Set(existingLeads.map(toExistingKey)), [existingLeads]);
  const uniqueRows = useMemo(() => {
    const seen = new Set(existingKeys);
    return rows.filter((row) => {
      const key = leadImportKey(row);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rows, existingKeys]);

  const saveRows = async (leads: LeadImportRow[], successMessage: string) => {
    setBusy(true);
    try {
      for (const lead of leads) await persistLead(lead);
      await onImported();
      toast.success(successMessage);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao adicionar leads ao CRM");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const runProspectSearch = async () => {
    if (city.trim().length < 2) return toast.error("Digite a cidade da busca");
    if (niche.trim().length < 2) return toast.error("Escolha ou digite o segmento");
    setBusy(true);
    try {
      const result = await searchLeadProspects(city.trim(), niche.trim(), 60, offerMode);
      setProspects(result.prospects);
      setMessageIndexes({});
      setSelectedProspects(new Set(result.prospects.map((prospect) => prospect.id)));
      setAttribution(result.attribution);
      setSearchMeta({ totalFetched: result.totalFetched, resultLimit: result.resultLimit });
      if (!result.prospects.length) toast.info("Nenhum negócio encontrado. Tente um segmento mais amplo.");
    } catch (error) {
      toast.error("Não foi possível pesquisar potenciais clientes", {
        description: error instanceof Error ? error.message : "Tente novamente em alguns instantes.",
      });
    } finally {
      setBusy(false);
    }
  };

  const importSelectedProspects = async () => {
    const selected = prospects
      .filter((prospect) => selectedProspects.has(prospect.id))
      .map((prospect) => prospectToLeadImport({ ...prospect, readyMessage: currentMessage(prospect) }, niche));
    if (!selected.length) return toast.error("Selecione ao menos um potencial cliente");
    const saved = await saveRows(selected, `${selected.length} potenciais clientes adicionados ao CRM`);
    if (saved) {
      setProspects([]);
      setSelectedProspects(new Set());
      onOpenChange(false);
    }
  };

  const saveManual = async () => {
    if (!manual.name.trim() && !manual.company.trim()) return toast.error("Informe o contato ou a empresa");
    if (existingKeys.has(leadImportKey(manual))) return toast.error("Este lead já existe no CRM");
    const saved = await saveRows([manual], "Lead adicionado ao pipeline");
    if (saved) {
      setManual(emptyLead);
      onOpenChange(false);
    }
  };

  const readCsv = async (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("O CSV deve ter no máximo 5 MB");
    const parsed = parseLeadCsv(await file.text());
    setRows(parsed.slice(0, 200));
    if (!parsed.length) toast.error("Nenhum lead válido encontrado no CSV");
  };

  const importCsv = async () => {
    if (!uniqueRows.length) return toast.error("Não há leads novos para importar");
    const saved = await saveRows(uniqueRows, `${uniqueRows.length} leads importados para o CRM`);
    if (saved) {
      setRows([]);
      onOpenChange(false);
    }
  };

  const updateManual = (field: keyof LeadImportRow, value: string) =>
    setManual((current) => ({ ...current, [field]: value }));

  const toggleProspect = (id: string, checked: boolean) => {
    setSelectedProspects((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const messageOptions = (prospect: LeadProspect) => prospect.readyMessages?.length ? prospect.readyMessages : [prospect.readyMessage];
  const currentMessage = (prospect: LeadProspect) => {
    const options = messageOptions(prospect);
    return options[(messageIndexes[prospect.id] || 0) % options.length];
  };
  const nextMessage = (prospect: LeadProspect) => setMessageIndexes((current) => ({
    ...current,
    [prospect.id]: ((current[prospect.id] || 0) + 1) % messageOptions(prospect).length,
  }));

  const copyMessage = async (prospect: LeadProspect) => {
    await navigator.clipboard.writeText(currentMessage(prospect));
    toast.success("Mensagem pronta copiada");
  };

  const whatsappUrl = (prospect: LeadProspect) => {
    const phone = prospect.phone.replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(currentMessage(prospect))}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Captar leads</DialogTitle>
          <DialogDescription>Encontre no Google Maps estabelecimentos sem site e receba a abordagem e o projeto recomendados.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="search">
          <TabsList className="grid h-auto w-full grid-cols-1 sm:grid-cols-3">
            <TabsTrigger value="search">Buscar potenciais</TabsTrigger>
            <TabsTrigger value="manual">Cadastro manual</TabsTrigger>
            <TabsTrigger value="csv">Importar CSV</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4 pt-3">
            <div className="space-y-2">
              <Label>Oferta que você deseja prospectar</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.entries(PROSPECT_OFFERS) as [ProspectOfferMode, (typeof PROSPECT_OFFERS)[ProspectOfferMode]][]).map(([key, offer]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setOfferMode(key)}
                    className={`rounded-md border p-3 text-left transition-colors ${offerMode === key ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"}`}
                  >
                    <span className="block text-sm font-semibold">{offer.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{offer.hint}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <Field label="Cidade">
                <Input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Ex.: Campinas, SP"
                  autoComplete="address-level2"
                />
              </Field>
              <Field label="Especialidade do estabelecimento">
                <Select value={niche} onValueChange={setNiche}>
                  <SelectTrigger><SelectValue placeholder="Selecione uma especialidade" /></SelectTrigger>
                  <SelectContent>
                    {PROSPECT_NICHE_GROUPS.map((group) => (
                      <SelectGroup key={group.label}>
                        <SelectLabel>{group.label}</SelectLabel>
                        {group.niches.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={niche}
                  onChange={(event) => setNiche(event.target.value)}
                  placeholder="Ou digite uma especialidade ainda mais específica"
                  className="mt-2"
                />
              </Field>
              <Button onClick={runProspectSearch} disabled={busy} className="gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar
              </Button>
            </div>

            {prospects.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{prospects.length} sem site</Badge>
                    <Badge variant="outline">{selectedProspects.size} selecionados</Badge>
                    <Badge variant="outline">{searchMeta.totalFetched} analisados no Google</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProspects(
                      selectedProspects.size === prospects.length ? new Set() : new Set(prospects.map((item) => item.id))
                    )}
                  >
                    {selectedProspects.size === prospects.length ? "Limpar seleção" : "Selecionar todos"}
                  </Button>
                </div>

                <div className="max-h-[55vh] divide-y divide-border overflow-y-auto rounded-md border">
                  {prospects.map((prospect) => (
                    <div key={prospect.id} className="flex gap-3 p-3 sm:p-4">
                      <Checkbox
                        className="mt-1"
                        checked={selectedProspects.has(prospect.id)}
                        onCheckedChange={(checked) => toggleProspect(prospect.id, checked === true)}
                        aria-label={`Selecionar ${prospect.name}`}
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-medium">{prospect.name}</p>
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="outline">Sem site no Google</Badge>
                            <Badge className={prospect.successScore >= 75 ? "bg-emerald-600" : prospect.successScore >= 55 ? "bg-amber-600" : "bg-slate-600"}>
                              {prospect.successScore}% chance {prospect.successLabel.toLowerCase()}
                            </Badge>
                          </div>
                        </div>
                        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{prospect.address}</span>
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {prospect.rating ? prospect.rating.toFixed(1) : "Sem nota"} ({prospect.reviewCount} avaliações)</span>
                          {prospect.phone && <span>{prospect.phone}</span>}
                          <a href={prospect.mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                            Ver no mapa <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <div className="mt-3 grid gap-2 rounded-md bg-muted/40 p-3 text-xs sm:grid-cols-2">
                          <div>
                            <p className="mb-1 flex items-center gap-1.5 font-semibold text-foreground"><BriefcaseBusiness className="h-3.5 w-3.5 text-primary" /> Projeto pronto</p>
                            <p className="font-medium text-foreground">{prospect.suggestedProject}</p>
                            <p className="mt-1 text-muted-foreground">{prospect.projectSummary}</p>
                          </div>
                          <div>
                            <p className="mb-1 flex items-center gap-1.5 font-semibold text-foreground"><MessageCircle className="h-3.5 w-3.5 text-primary" /> Mensagem pronta</p>
                            <p className="line-clamp-4 text-muted-foreground">{currentMessage(prospect)}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {messageOptions(prospect).length > 1 && <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => nextMessage(prospect)}>Gerar outra</Button>}
                              <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => copyMessage(prospect)}><Copy className="h-3 w-3" /> Copiar</Button>
                              {prospect.phone && <Button asChild type="button" size="sm" className="h-7 gap-1.5 text-xs"><a href={whatsappUrl(prospect)} target="_blank" rel="noreferrer"><MessageCircle className="h-3 w-3" /> Abrir WhatsApp</a></Button>}
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Cálculo: {prospect.scoreReasons.join(" • ")}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="max-w-xl text-[11px] text-muted-foreground">{attribution} A consulta analisa até {searchMeta.resultLimit} resultados por segmento e cidade.</p>
                  <Button onClick={importSelectedProspects} disabled={busy || selectedProspects.size === 0} className="gap-2">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Adicionar {selectedProspects.size} ao CRM
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 pt-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Contato"><Input value={manual.name} onChange={(event) => updateManual("name", event.target.value)} /></Field>
              <Field label="Empresa"><Input value={manual.company} onChange={(event) => updateManual("company", event.target.value)} /></Field>
              <Field label="Email"><Input type="email" value={manual.email} onChange={(event) => updateManual("email", event.target.value)} /></Field>
              <Field label="Telefone / WhatsApp"><Input value={manual.phone} onChange={(event) => updateManual("phone", event.target.value)} /></Field>
              <Field label="Cidade"><Input value={manual.city} onChange={(event) => updateManual("city", event.target.value)} placeholder="Qualquer cidade, ex.: Campinas, SP" /></Field>
              <Field label="Nicho"><Input value={manual.niche} onChange={(event) => updateManual("niche", event.target.value)} /></Field>
              <div className="space-y-2 sm:col-span-2">
                <Label>Produto provável</Label>
                <Select value={manual.projectType} onValueChange={(value) => updateManual("projectType", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS_PROJETO.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Oportunidade observada</Label>
                <Textarea value={manual.objective} onChange={(event) => updateManual("objective", event.target.value)} placeholder="O que indica que este lead pode se beneficiar da solução?" />
              </div>
            </div>
            <Button onClick={saveManual} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar ao CRM
            </Button>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4 pt-3">
            <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/20 px-6 text-center hover:border-primary/50">
              <Upload className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Selecionar arquivo CSV</span>
              <span className="text-xs text-muted-foreground">Até 200 leads por lote e 5 MB</span>
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => readCsv(event.target.files?.[0])} />
            </label>
            {rows.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{rows.length} lidos</Badge>
                  <Badge variant="outline">{uniqueRows.length} novos</Badge>
                  <Badge variant="outline">{rows.length - uniqueRows.length} duplicados</Badge>
                </div>
                <div className="max-h-52 divide-y divide-border overflow-y-auto rounded-md border">
                  {rows.slice(0, 20).map((row, index) => (
                    <div key={`${leadImportKey(row)}-${index}`} className="flex items-center justify-between gap-3 p-3 text-sm">
                      <div className="min-w-0"><p className="truncate font-medium">{row.company || row.name}</p><p className="truncate text-xs text-muted-foreground">{row.city || row.email || "Sem localização informada"}</p></div>
                      <Badge variant={existingKeys.has(leadImportKey(row)) ? "secondary" : "outline"}>{existingKeys.has(leadImportKey(row)) ? "Já existe" : "Novo"}</Badge>
                    </div>
                  ))}
                </div>
                <Button onClick={importCsv} disabled={busy || uniqueRows.length === 0} className="gap-2">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} Importar {uniqueRows.length} leads
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
