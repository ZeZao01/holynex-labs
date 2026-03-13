import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X } from "lucide-react";
import {
  PortfolioItem, ITEM_TYPES, BADGE_OPTIONS, HIGHLIGHT_SECTIONS, INVESTMENT_RANGES,
  uploadPortfolioImage,
} from "@/lib/portfolio-items";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  item?: PortfolioItem | null;
  onSave: (data: Partial<PortfolioItem>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function PortfolioForm({ item, onSave, onCancel, loading }: Props) {
  const [form, setForm] = useState<Partial<PortfolioItem>>({
    title: "", subtitle: "", short_description: "", commercial_description: "",
    problem_solved: "", target_audience: "", differentials: [], main_modules: [],
    thumbnail_url: "", cover_image_url: "", hover_image_url: "", gallery_urls: [],
    video_url: "", badges: [], category: "", niche: "", solution_type: "",
    investment_range: "", objective: "", item_type: "case_real",
    cta_label: "Quero algo parecido", cta_url: "", public_url: "",
    display_order: 0, is_active: true, is_featured: false, is_highlighted: false,
    highlight_section: "", client_context: "", customization_notes: "",
    delivered_system_id: null,
  });
  const [systems, setSystems] = useState<{ id: string; nome: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [moduleInput, setModuleInput] = useState("");
  const [diffInput, setDiffInput] = useState("");

  useEffect(() => {
    if (item) setForm(item);
    supabase.from("delivered_systems").select("id, nome").order("nome").then(({ data }) => setSystems(data || []));
  }, [item]);

  const set = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, field: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPortfolioImage(file, field === "gallery_urls" ? "gallery" : "thumbnails");
      if (field === "gallery_urls") {
        set(field, [...(form.gallery_urls || []), url]);
      } else {
        set(field, url);
      }
    } catch { /* ignore */ }
    setUploading(false);
  }

  function toggleBadge(badge: string) {
    const current = form.badges || [];
    set("badges", current.includes(badge) ? current.filter((b) => b !== badge) : [...current, badge]);
  }

  function addModule() {
    if (!moduleInput.trim()) return;
    set("main_modules", [...(form.main_modules || []), moduleInput.trim()]);
    setModuleInput("");
  }

  function addDifferential() {
    if (!diffInput.trim()) return;
    set("differentials", [...(form.differentials || []), diffInput.trim()]);
    setDiffInput("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
          <TabsTrigger value="midia">Mídia</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4 mt-4">
          <div>
            <Label>Título Público *</Label>
            <Input value={form.title || ""} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Input value={form.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.item_type || "case_real"} onValueChange={(v) => set("item_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ITEM_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sistema Entregue</Label>
              <Select value={form.delivered_system_id || "none"} onValueChange={(v) => set("delivered_system_id", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {systems.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Input value={form.category || ""} onChange={(e) => set("category", e.target.value)} />
            </div>
            <div>
              <Label>Nicho</Label>
              <Input value={form.niche || ""} onChange={(e) => set("niche", e.target.value)} />
            </div>
            <div>
              <Label>Tipo de Solução</Label>
              <Input value={form.solution_type || ""} onChange={(e) => set("solution_type", e.target.value)} />
            </div>
            <div>
              <Label>Faixa de Investimento</Label>
              <Select value={form.investment_range || "none"} onValueChange={(v) => set("investment_range", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não definido</SelectItem>
                  {INVESTMENT_RANGES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Descrição Curta</Label>
            <Textarea rows={2} value={form.short_description || ""} onChange={(e) => set("short_description", e.target.value)} />
          </div>
        </TabsContent>

        <TabsContent value="conteudo" className="space-y-4 mt-4">
          <div>
            <Label>Descrição Comercial</Label>
            <Textarea rows={4} value={form.commercial_description || ""} onChange={(e) => set("commercial_description", e.target.value)} />
          </div>
          <div>
            <Label>Problema que Resolve</Label>
            <Textarea rows={2} value={form.problem_solved || ""} onChange={(e) => set("problem_solved", e.target.value)} />
          </div>
          <div>
            <Label>Para Quem Serve</Label>
            <Textarea rows={2} value={form.target_audience || ""} onChange={(e) => set("target_audience", e.target.value)} />
          </div>
          <div>
            <Label>Módulos Principais</Label>
            <div className="flex gap-2 mb-2">
              <Input value={moduleInput} onChange={(e) => setModuleInput(e.target.value)} placeholder="Adicionar módulo" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addModule())} />
              <Button type="button" size="sm" onClick={addModule}>+</Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {(form.main_modules || []).map((m, i) => (
                <Badge key={i} variant="secondary" className="gap-1">{m} <X className="h-3 w-3 cursor-pointer" onClick={() => set("main_modules", (form.main_modules || []).filter((_, j) => j !== i))} /></Badge>
              ))}
            </div>
          </div>
          <div>
            <Label>Diferenciais</Label>
            <div className="flex gap-2 mb-2">
              <Input value={diffInput} onChange={(e) => setDiffInput(e.target.value)} placeholder="Adicionar diferencial" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDifferential())} />
              <Button type="button" size="sm" onClick={addDifferential}>+</Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {(form.differentials || []).map((d, i) => (
                <Badge key={i} variant="secondary" className="gap-1">{d} <X className="h-3 w-3 cursor-pointer" onClick={() => set("differentials", (form.differentials || []).filter((_, j) => j !== i))} /></Badge>
              ))}
            </div>
          </div>
          <div>
            <Label>Badges</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {BADGE_OPTIONS.map((b) => (
                <Badge key={b} variant={(form.badges || []).includes(b) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleBadge(b)}>{b}</Badge>
              ))}
            </div>
          </div>
          {form.item_type === "case_real" && (
            <div>
              <Label>Contexto do Cliente</Label>
              <Textarea rows={2} value={form.client_context || ""} onChange={(e) => set("client_context", e.target.value)} />
            </div>
          )}
          {(form.item_type === "solucao_adaptavel" || form.item_type === "projeto_modelo") && (
            <div>
              <Label>Notas de Personalização</Label>
              <Textarea rows={2} value={form.customization_notes || ""} onChange={(e) => set("customization_notes", e.target.value)} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="midia" className="space-y-4 mt-4">
          {["thumbnail_url", "cover_image_url", "hover_image_url"].map((field) => (
            <div key={field}>
              <Label>{field === "thumbnail_url" ? "Thumbnail" : field === "cover_image_url" ? "Capa" : "Imagem Hover"}</Label>
              <div className="flex gap-2 items-center">
                <Input value={(form as any)[field] || ""} onChange={(e) => set(field, e.target.value)} placeholder="URL ou faça upload" className="flex-1" />
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, field)} />
                  <Button type="button" size="icon" variant="outline" asChild><span><Upload className="h-4 w-4" /></span></Button>
                </label>
              </div>
              {(form as any)[field] && <img src={(form as any)[field]} alt="" className="h-20 rounded mt-2 object-cover" />}
            </div>
          ))}
          <div>
            <Label>Galeria</Label>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "gallery_urls")} />
              <Button type="button" size="sm" variant="outline" asChild><span><Upload className="h-4 w-4 mr-1" /> Adicionar Imagem</span></Button>
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(form.gallery_urls || []).map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} alt="" className="h-16 w-24 rounded object-cover" />
                  <button type="button" className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition" onClick={() => set("gallery_urls", (form.gallery_urls || []).filter((_, j) => j !== i))}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>Vídeo/Demo URL</Label>
            <Input value={form.video_url || ""} onChange={(e) => set("video_url", e.target.value)} />
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>CTA Label</Label>
              <Input value={form.cta_label || ""} onChange={(e) => set("cta_label", e.target.value)} />
            </div>
            <div>
              <Label>CTA URL</Label>
              <Input value={form.cta_url || ""} onChange={(e) => set("cta_url", e.target.value)} />
            </div>
            <div>
              <Label>Ordem de Exibição</Label>
              <Input type="number" value={form.display_order || 0} onChange={(e) => set("display_order", Number(e.target.value))} />
            </div>
            <div>
              <Label>Seção de Destaque</Label>
              <Select value={form.highlight_section || "none"} onValueChange={(v) => set("highlight_section", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {HIGHLIGHT_SECTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Objetivo</Label>
              <Input value={form.objective || ""} onChange={(e) => set("objective", e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active ?? true} onCheckedChange={(v) => set("is_active", v)} />
              <Label>Ativo</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_featured ?? false} onCheckedChange={(v) => set("is_featured", v)} />
              <Label>Destaque</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_highlighted ?? false} onCheckedChange={(v) => set("is_highlighted", v)} />
              <Label>Highlight</Label>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading || uploading}>{loading ? "Salvando..." : "Salvar"}</Button>
      </div>
    </form>
  );
}
