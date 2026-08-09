import { useMemo, useState } from "react";
import { FileUp, Loader2, Plus, Upload } from "lucide-react";
import { salvarOrcamento, type Orcamento, TIPOS_PROJETO } from "@/lib/orcamentos";
import { buildLeadBriefing, leadImportKey, parseLeadCsv, type LeadImportRow } from "@/lib/lead-import";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    origem_lead: lead.source === "csv" ? "outro" : lead.source || "outro",
    aceita_mvp: true,
  });
}

export default function LeadCaptureDialog({ open, onOpenChange, existingLeads, onImported }: LeadCaptureDialogProps) {
  const [manual, setManual] = useState<LeadImportRow>(emptyLead);
  const [rows, setRows] = useState<LeadImportRow[]>([]);
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

  const saveManual = async () => {
    if (!manual.name.trim() && !manual.company.trim()) return toast.error("Informe o contato ou a empresa");
    if (existingKeys.has(leadImportKey(manual))) return toast.error("Este lead já existe no CRM");
    setBusy(true);
    try {
      await persistLead(manual);
      await onImported();
      setManual(emptyLead);
      onOpenChange(false);
      toast.success("Lead adicionado ao pipeline");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao cadastrar lead");
    } finally {
      setBusy(false);
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
    setBusy(true);
    try {
      for (const row of uniqueRows) await persistLead(row);
      await onImported();
      toast.success(`${uniqueRows.length} leads importados para o CRM`);
      setRows([]);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro durante a importação");
    } finally {
      setBusy(false);
    }
  };

  const updateManual = (field: keyof LeadImportRow, value: string) => setManual((current) => ({ ...current, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Captar leads</DialogTitle>
          <DialogDescription>Cadastre uma oportunidade ou importe uma base própria e revisada.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="manual">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Cadastro manual</TabsTrigger>
            <TabsTrigger value="csv">Importar CSV</TabsTrigger>
          </TabsList>

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
