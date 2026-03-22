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
  PortfolioItem,
  ITEM_TYPES,
  BADGE_OPTIONS,
  HIGHLIGHT_SECTIONS,
  INVESTMENT_RANGES,
  PORTFOLIO_STATUSES,
  PREVIEW_MODES,
  OPEN_MODES,
  uploadPortfolioImage,
} from "@/lib/portfolio-items";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  item?: PortfolioItem | null;
  onSave: (data: Partial<PortfolioItem>) => void;
  onCancel: () => void;
  loading?: boolean;
}

const URL_FIELDS = [
  { key: "system_url", label: "URL do sistema" },
  { key: "thumbnail_url", label: "Thumbnail" },
  { key: "cover_image_url", label: "Imagem de capa" },
  { key: "hover_image_url", label: "Imagem hover" },
  { key: "cta_url", label: "CTA URL" },
  { key: "public_url", label: "URL pública" },
  { key: "video_url", label: "URL de vídeo" },
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export default function PortfolioForm({ item, onSave, onCancel, loading }: Props) {
  const [form, setForm] = useState<Partial<PortfolioItem>>({
    title: "",
    slug: "",
    subtitle: "",
    short_description: "",
    full_description: "",
    commercial_description: "",
    problem_solved: "",
    target_audience: "",
    features: [],
    differentials: [],
    tech_stack: [],
    main_modules: [],
    thumbnail_url: "",
    cover_image_url: "",
    hover_image_url: "",
    gallery_images: [],
    gallery_urls: [],
    video_url: "",
    system_url: "",
    preview_mode: "none",
    open_mode: "new_tab",
    badges: [],
    category: "",
    niche: "",
    solution_type: "",
    investment_range: "",
    objective: "",
    item_type: "case_real",
    cta_label: "Quero algo parecido",
    cta_url: "",
    public_url: "",
    allow_public_preview: false,
    status: "draft",
    sort_order: 0,
    display_order: 0,
    is_active: false,
    is_featured: false,
    is_highlighted: false,
    highlight_section: "",
    client_context: "",
    customization_notes: "",
    delivered_system_id: null,
  });
  const [systems, setSystems] = useState<{ id: string; nome: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [moduleInput, setModuleInput] = useState("");
  const [diffInput, setDiffInput] = useState("");
  const [techInput, setTechInput] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      const gallery = item.gallery_images || item.gallery_urls || [];
      const techStack = item.tech_stack || item.main_modules || [];
      const features = item.features || item.differentials || [];
      const status = item.status || (item.is_active ? "published" : "draft");
      const sortOrder = item.sort_order ?? item.display_order ?? 0;
      const fullDescription = item.full_description || item.commercial_description || "";
      const systemUrl = item.system_url || item.public_url || "";

      setForm({
        ...item,
        slug: item.slug || "",
        gallery_images: gallery,
        gallery_urls: item.gallery_urls || gallery,
        tech_stack: techStack,
        main_modules: item.main_modules || techStack,
        features,
        differentials: item.differentials || features,
        status,
        sort_order: sortOrder,
        display_order: item.display_order ?? sortOrder,
        allow_public_preview: item.allow_public_preview ?? false,
        preview_mode: item.preview_mode || "none",
        open_mode: item.open_mode || "new_tab",
        full_description: fullDescription,
        commercial_description: item.commercial_description || fullDescription,
        system_url: systemUrl,
        public_url: item.public_url || systemUrl,
      });
    }
    supabase.from("delivered_systems").select("id, nome").order("nome").then(({ data }) => setSystems(data || []));
  }, [item]);

  const set = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, field: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPortfolioImage(file, field === "gallery_images" ? "gallery" : "thumbnails");
      if (field === "gallery_images") {
        const nextGallery = [...(form.gallery_images || []), url];
        set("gallery_images", nextGallery);
        set("gallery_urls", nextGallery);
      } else {
        set(field, url);
      }
    } catch {
      /* ignore */
    }
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

  function addTech() {
    if (!techInput.trim()) return;
    set("tech_stack", [...(form.tech_stack || []), techInput.trim()]);
    setTechInput("");
  }

  function addFeature() {
    if (!featureInput.trim()) return;
    set("features", [...(form.features || []), featureInput.trim()]);
    setFeatureInput("");
  }

  function validateUrls() {
    const nextErrors: Record<string, string> = {};
    URL_FIELDS.forEach(({ key, label }) => {
      const value = String((form as any)[key] || "").trim();
      if (value && !isValidUrl(value)) nextErrors[key] = `${label} inválida`;
    });

    const gallery = form.gallery_images || form.gallery_urls || [];
    const invalidGallery = gallery.some((url) => url && !isValidUrl(url));
    if (invalidGallery) nextErrors.gallery_images = "Há URLs inválidas na galeria";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handlePreviewTest() {
    const systemUrl = String(form.system_url || form.public_url || "").trim();
    if (!systemUrl) {
      setErrors((prev) => ({ ...prev, system_url: "Informe a URL do sistema para testar o preview" }));
      return;
    }
    window.open(systemUrl, "_blank", "noopener,noreferrer");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateUrls()) return;

    const gallery = form.gallery_images || form.gallery_urls || [];
    const techStack = form.tech_stack || form.main_modules || [];
    const features = form.features || form.differentials || [];
    const status = form.status || (form.is_active ? "published" : "draft");
    const sortOrder = form.sort_order ?? form.display_order ?? 0;
    const fullDescription = form.full_description || form.commercial_description || "";
    const systemUrl = form.system_url || form.public_url || "";
    const resolvedThumbnail = form.thumbnail_url || gallery[0] || form.cover_image_url || "";

    onSave({
      ...form,
      slug: form.slug || slugify(form.title || ""),
      gallery_images: gallery,
      gallery_urls: form.gallery_urls || gallery,
      tech_stack: techStack,
      main_modules: (form.main_modules || []).length ? form.main_modules : techStack,
      features,
      differentials: (form.differentials || []).length ? form.differentials : features,
      full_description: fullDescription,
      commercial_description: form.commercial_description || fullDescription,
      status,
      sort_order: sortOrder,
      display_order: form.display_order ?? sortOrder,
      allow_public_preview: form.allow_public_preview ?? false,
      is_active: status === "published",
      system_url: systemUrl,
      public_url: form.public_url || systemUrl,
      thumbnail_url: resolvedThumbnail || form.thumbnail_url,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="geral">Dados gerais</TabsTrigger>
          <TabsTrigger value="midia">Mídia</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
          <TabsTrigger value="publicacao">Publicação</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4 mt-4">
          <div>
            <Label>Título Público *</Label>
            <Input
              value={form.title || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  title: e.target.value,
                  slug: prev.slug ? prev.slug : slugify(e.target.value),
                }))
              }
              required
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={form.slug || ""} onChange={(e) => set("slug", slugify(e.target.value))} placeholder="ex: crm-varejo" />
          </div>
          <div>
            <Label>Subtítulo (legado)</Label>
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

        <TabsContent value="midia" className="space-y-4 mt-4">
          {(["thumbnail_url", "cover_image_url", "hover_image_url"] as const).map((field) => (
            <div key={field}>
              <Label>{field === "thumbnail_url" ? "Thumbnail" : field === "cover_image_url" ? "Capa" : "Imagem Hover"}</Label>
              <div className="flex gap-2 items-center">
                <Input type="url" value={(form as any)[field] || ""} onChange={(e) => set(field, e.target.value)} placeholder="URL ou faça upload" className="flex-1" />
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, field)} />
                  <Button type="button" size="icon" variant="outline" asChild><span><Upload className="h-4 w-4" /></span></Button>
                </label>
              </div>
              {errors[field] && <p className="text-xs text-destructive mt-1">{errors[field]}</p>}
              {(form as any)[field] && <img src={(form as any)[field]} alt="" className="h-20 rounded mt-2 object-cover" />}
            </div>
          ))}
          <div>
            <Label>Galeria</Label>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "gallery_images")} />
              <Button type="button" size="sm" variant="outline" asChild><span><Upload className="h-4 w-4 mr-1" /> Adicionar Imagem</span></Button>
            </label>
            {errors.gallery_images && <p className="text-xs text-destructive mt-1">{errors.gallery_images}</p>}
            <div className="flex flex-wrap gap-2 mt-2">
              {(form.gallery_images || []).map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} alt="" className="h-16 w-24 rounded object-cover" />
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                    onClick={() => {
                      const nextGallery = (form.gallery_images || []).filter((_, j) => j !== i);
                      set("gallery_images", nextGallery);
                      set("gallery_urls", nextGallery);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>Vídeo/Demo URL</Label>
            <Input type="url" value={form.video_url || ""} onChange={(e) => set("video_url", e.target.value)} />
            {errors.video_url && <p className="text-xs text-destructive mt-1">{errors.video_url}</p>}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4 mt-4">
          <div>
            <Label>URL do Sistema</Label>
            <Input type="url" value={form.system_url || ""} onChange={(e) => set("system_url", e.target.value)} />
            {errors.system_url && <p className="text-xs text-destructive mt-1">{errors.system_url}</p>}
            <div className="mt-2">
              <Button type="button" size="sm" variant="outline" onClick={handlePreviewTest}>
                Testar preview
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Preview Mode</Label>
              <Select value={form.preview_mode || "none"} onValueChange={(v) => set("preview_mode", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {PREVIEW_MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Open Mode</Label>
              <Select value={form.open_mode || "new_tab"} onValueChange={(v) => set("open_mode", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {OPEN_MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.allow_public_preview ?? false} onCheckedChange={(v) => set("allow_public_preview", v)} />
              <Label>Permitir preview público</Label>
            </div>
          </div>
          <div>
            <Label>URL Pública (legado)</Label>
            <Input type="url" value={form.public_url || ""} onChange={(e) => set("public_url", e.target.value)} />
            {errors.public_url && <p className="text-xs text-destructive mt-1">{errors.public_url}</p>}
          </div>
        </TabsContent>

        <TabsContent value="conteudo" className="space-y-4 mt-4">
          <div>
            <Label>Descrição Completa</Label>
            <Textarea rows={4} value={form.full_description || ""} onChange={(e) => set("full_description", e.target.value)} />
          </div>
          <div>
            <Label>Funcionalidades</Label>
            <div className="flex gap-2 mb-2">
              <Input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} placeholder="Adicionar funcionalidade" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())} />
              <Button type="button" size="sm" onClick={addFeature}>+</Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {(form.features || []).map((f, i) => (
                <Badge key={i} variant="secondary" className="gap-1">{f} <X className="h-3 w-3 cursor-pointer" onClick={() => set("features", (form.features || []).filter((_, j) => j !== i))} /></Badge>
              ))}
            </div>
          </div>
          <div>
            <Label>Stack Técnica</Label>
            <div className="flex gap-2 mb-2">
              <Input value={techInput} onChange={(e) => setTechInput(e.target.value)} placeholder="Adicionar tecnologia" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTech())} />
              <Button type="button" size="sm" onClick={addTech}>+</Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {(form.tech_stack || []).map((t, i) => (
                <Badge key={i} variant="secondary" className="gap-1">{t} <X className="h-3 w-3 cursor-pointer" onClick={() => set("tech_stack", (form.tech_stack || []).filter((_, j) => j !== i))} /></Badge>
              ))}
            </div>
          </div>
          <div>
            <Label>Descrição Comercial (legado)</Label>
            <Textarea rows={3} value={form.commercial_description || ""} onChange={(e) => set("commercial_description", e.target.value)} />
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
            <Label>Módulos Principais (legado)</Label>
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
            <Label>Diferenciais (legado)</Label>
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

        <TabsContent value="publicacao" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={form.status || "draft"} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {PORTFOLIO_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ordem de Exibição</Label>
              <Input type="number" value={form.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} />
            </div>
            <div>
              <Label>CTA Label</Label>
              <Input value={form.cta_label || ""} onChange={(e) => set("cta_label", e.target.value)} />
            </div>
            <div>
              <Label>CTA URL</Label>
              <Input type="url" value={form.cta_url || ""} onChange={(e) => set("cta_url", e.target.value)} />
              {errors.cta_url && <p className="text-xs text-destructive mt-1">{errors.cta_url}</p>}
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
