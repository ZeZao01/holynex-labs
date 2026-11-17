import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Download, WandSparkles } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import SectionCard from "@/components/admin/SectionCard";
import {
  buildDevelopmentPrompt,
  inferDevelopmentProduct,
  type DevelopmentLeadContext,
  type DevelopmentProduct,
  type DevelopmentTarget,
} from "@/lib/development-prompt";
import { listModels, rankProjectModels, type ProjectModel } from "@/lib/project-models";

interface LeadPromptStudioProps {
  lead: DevelopmentLeadContext;
}

const productLabels: Record<DevelopmentProduct, string> = {
  site: "Site institucional",
  landing_page: "Landing page",
  internal_system: "Sistema interno",
  saas: "Plataforma SaaS",
};

export default function LeadPromptStudio({ lead }: LeadPromptStudioProps) {
  const [target, setTarget] = useState<DevelopmentTarget>("codex");
  const [product, setProduct] = useState<DevelopmentProduct>(() => inferDevelopmentProduct(lead.projectType));
  const [instructions, setInstructions] = useState("");
  const [copied, setCopied] = useState(false);
  const [models, setModels] = useState<ProjectModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("");
  const rankedModels = useMemo(() => rankProjectModels(models, { niche: lead.niche, projectType: lead.projectType, objective: lead.objective }), [models, lead.niche, lead.objective, lead.projectType]);
  const selectedModel = rankedModels.find(({ model }) => model.id === selectedModelId) || rankedModels[0];

  useEffect(() => {
    listModels(true).then((items) => {
      setModels(items);
      const first = rankProjectModels(items, { niche: lead.niche, projectType: lead.projectType, objective: lead.objective })[0];
      setSelectedModelId(first?.model.id || "");
    }).catch(() => setModels([]));
  }, [lead.niche, lead.objective, lead.projectType]);

  const prompt = useMemo(
    () => buildDevelopmentPrompt({ lead, target, product, additionalInstructions: instructions, projectReference: selectedModel ? {
      title: selectedModel.model.title, category: selectedModel.model.category, niche: selectedModel.model.niche,
      valueProposition: selectedModel.model.value_proposition, problemSolved: selectedModel.model.problem_solved,
      commercialDescription: selectedModel.model.commercial_description, investmentRange: selectedModel.model.investment_range,
      baseDeadline: selectedModel.model.base_deadline, reuseReasons: selectedModel.reasons,
    } : undefined }),
    [lead, target, product, instructions, selectedModel],
  );

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success("Prompt personalizado copiado");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Não foi possível copiar o prompt");
    }
  };

  const downloadPrompt = () => {
    const filename = `holynex-prompt-${(lead.company || lead.contactName || lead.id)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}.md`;
    const url = URL.createObjectURL(new Blob([prompt], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Prompt exportado em Markdown");
  };

  return (
    <div id="prompt-studio" className="scroll-mt-24">
      <SectionCard
        title="Prompt Studio do Lead"
        action={<Badge variant="outline" className="gap-1"><WandSparkles className="h-3 w-3" /> HolyNex Build Brief</Badge>}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Ferramenta de destino</Label>
              <Select value={target} onValueChange={(value) => setTarget(value as DevelopmentTarget)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="codex">Codex</SelectItem>
                  
                  <SelectItem value="stitch">Google Stitch</SelectItem>
                  <SelectItem value="generic">IA genérica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Produto a desenvolver</Label>
              <Select value={product} onValueChange={(value) => setProduct(value as DevelopmentProduct)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(productLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Projeto-modelo do estoque HolyNex</Label>
            <Select value={selectedModelId} onValueChange={setSelectedModelId} disabled={!rankedModels.length}>
              <SelectTrigger><SelectValue placeholder="Nenhum modelo ativo cadastrado" /></SelectTrigger>
              <SelectContent>
                {rankedModels.map(({ model, score }) => <SelectItem key={model.id} value={model.id}>{model.title} · aderência {score}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">A recomendação cruza nicho, objetivo e tipo de projeto com os modelos ativos cadastrados.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt-extra-instructions">Instruções adicionais</Label>
            <Textarea
              id="prompt-extra-instructions"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Ex.: priorizar agendamento pelo WhatsApp, usar identidade visual existente e entregar primeiro o painel operacional."
              className="min-h-24"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={copyPrompt} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar prompt"}
            </Button>
            <Button variant="outline" onClick={downloadPrompt} className="gap-2">
              <Download className="h-4 w-4" /> Exportar Markdown
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Prompt gerado</Label>
            <Textarea value={prompt} readOnly className="min-h-[420px] font-mono text-xs leading-relaxed" />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
