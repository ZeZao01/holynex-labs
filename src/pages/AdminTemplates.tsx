import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { pdfTemplates, templateCategories, type PdfTemplate, type RGB } from "@/lib/pdf-templates";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, X, Eye, Download, Palette, Grid3X3, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

const rgbStr = (rgb: RGB) => `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
const rgbaStr = (rgb: RGB, a: number) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;

// ── Rich multi-slide preview ──
function SlidePreview({ template, size = "sm" }: { template: PdfTemplate; size?: "sm" | "lg" }) {
  const c = template.colors;
  const isLg = size === "lg";

  return (
    <div className="relative w-full h-full" style={{ backgroundColor: rgbStr(c.bg) }}>
      {/* Corner accents */}
      <div className="absolute top-[4%] left-[4%] w-[6%] h-[1px]" style={{ backgroundColor: rgbStr(c.secondary) }} />
      <div className="absolute top-[4%] left-[4%] w-[1px] h-[6%]" style={{ backgroundColor: rgbStr(c.secondary) }} />
      <div className="absolute top-[4%] right-[4%] w-[6%] h-[1px]" style={{ backgroundColor: rgbStr(c.secondary) }} />
      <div className="absolute top-[4%] right-[4%] w-[1px] h-[6%]" style={{ backgroundColor: rgbStr(c.secondary) }} />
      <div className="absolute bottom-[4%] left-[4%] w-[6%] h-[1px]" style={{ backgroundColor: rgbStr(c.secondary) }} />
      <div className="absolute bottom-[4%] left-[4%] w-[1px] h-[6%]" style={{ backgroundColor: rgbStr(c.secondary) }} />
      <div className="absolute bottom-[4%] right-[4%] w-[6%] h-[1px]" style={{ backgroundColor: rgbStr(c.secondary) }} />
      <div className="absolute bottom-[4%] right-[4%] w-[1px] h-[6%]" style={{ backgroundColor: rgbStr(c.secondary) }} />

      {/* Glow effects */}
      <div className="absolute rounded-full blur-xl" style={{ backgroundColor: rgbaStr(c.primary, 0.15), width: "50%", height: "50%", top: "5%", right: "0%" }} />
      <div className="absolute rounded-full blur-xl" style={{ backgroundColor: rgbaStr(c.accent, 0.08), width: "40%", height: "40%", bottom: "5%", left: "5%" }} />

      {/* Logo circle */}
      <div className="absolute rounded-full" style={{ backgroundColor: rgbaStr(c.primary, 0.5), width: "10%", height: "14%", top: "14%", left: "50%", transform: "translateX(-50%)" }} />

      {/* Title */}
      <div className="absolute rounded-sm" style={{ backgroundColor: rgbaStr(c.white, 0.9), height: "5%", width: "45%", top: "35%", left: "27.5%" }} />

      {/* Subtitle */}
      <div className="absolute rounded-sm" style={{ backgroundColor: rgbaStr(c.secondary, 0.7), height: "3%", width: "38%", top: "43%", left: "31%" }} />

      {/* Accent line */}
      <div className="absolute" style={{ backgroundColor: rgbStr(c.primary), height: "2px", width: "8%", top: "50%", left: "46%" }} />

      {/* Client info box */}
      <div className="absolute rounded" style={{ border: `1px solid ${rgbaStr(c.primary, 0.4)}`, width: "36%", height: "10%", top: "56%", left: "32%" }}>
        <div className="absolute left-0 top-[10%] bottom-[10%] w-[2px] rounded-full" style={{ backgroundColor: rgbStr(c.secondary) }} />
        <div className="absolute rounded-sm" style={{ backgroundColor: rgbaStr(c.white, 0.5), height: "30%", width: "60%", top: "35%", left: "12%" }} />
      </div>

      {/* Date badge */}
      <div className="absolute rounded-full" style={{ backgroundColor: rgbaStr(c.white, 0.08), border: `1px solid ${rgbaStr(c.white, 0.15)}`, width: "20%", height: "4%", top: "72%", left: "40%" }} />

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[1.5%]" style={{ backgroundColor: rgbaStr(c.primary, 0.4) }} />

      {isLg && (
        <>
          {/* Extra slide elements for large preview */}
          {/* Mini pricing cards */}
          <div className="absolute flex gap-[2%]" style={{ bottom: "18%", left: "15%", width: "70%", height: "8%" }}>
            {[c.highlight, c.primary, c.accent2].map((color, i) => (
              <div key={i} className="flex-1 rounded" style={{ backgroundColor: rgbaStr(color, 0.12), border: `1px solid ${rgbaStr(color, 0.25)}` }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Expanded multi-page preview ──
function ExpandedPreview({ template }: { template: PdfTemplate }) {
  const c = template.colors;

  const slides = [
    { label: "Capa", content: <SlidePreview template={template} size="lg" /> },
    { label: "Resumo Executivo", content: <SlideResume template={template} /> },
    { label: "Diagnóstico", content: <SlideDiagnostico template={template} /> },
    { label: "Escopo", content: <SlideEscopo template={template} /> },
    { label: "Investimento", content: <SlideInvestimento template={template} /> },
    { label: "Cronograma", content: <SlideCronograma template={template} /> },
    { label: "Estratégia", content: <SlideEstrategia template={template} /> },
    { label: "Próximos Passos", content: <SlidePassos template={template} /> },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {slides.map((slide, i) => (
        <div key={i} className="space-y-1">
          <div className="rounded-lg overflow-hidden border border-border/30" style={{ aspectRatio: "297/210" }}>
            {slide.content}
          </div>
          <p className="text-[10px] text-muted-foreground text-center">{i + 1}. {slide.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Slide variations ──
function SlideResume({ template }: { template: PdfTemplate }) {
  const c = template.colors;
  return (
    <div className="relative w-full h-full" style={{ backgroundColor: rgbStr(c.bg) }}>
      <div className="absolute rounded-full blur-xl" style={{ backgroundColor: rgbaStr(c.accent, 0.1), width: "40%", height: "40%", top: "0%", right: "0%" }} />
      {/* Badge */}
      <div className="absolute rounded-full" style={{ backgroundColor: rgbaStr(c.primary, 0.15), border: `1px solid ${rgbaStr(c.primary, 0.3)}`, width: "25%", height: "5%", top: "8%", left: "6%" }} />
      {/* Title */}
      <div className="absolute rounded-sm" style={{ backgroundColor: rgbaStr(c.white, 0.9), height: "4%", width: "35%", top: "16%", left: "6%" }} />
      {/* Quote box */}
      <div className="absolute rounded" style={{ backgroundColor: rgbaStr(c.secondary, 0.05), width: "88%", height: "12%", top: "24%", left: "6%" }}>
        <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: rgbStr(c.secondary) }} />
      </div>
      {/* Two columns */}
      <div className="absolute flex gap-[3%]" style={{ top: "42%", left: "6%", width: "88%", height: "50%" }}>
        <div className="flex-1 space-y-[6%]">
          {[0.9, 0.7, 0.5, 0.6, 0.8].map((w, i) => (
            <div key={i} className="h-[4%] rounded-sm" style={{ backgroundColor: rgbaStr(c.lightGray, 0.3), width: `${w * 100}%` }} />
          ))}
        </div>
        <div className="flex-1">
          <div className="rounded h-[60%]" style={{ backgroundColor: rgbaStr(c.primary, 0.04), border: `1px solid ${rgbaStr(c.primary, 0.2)}` }}>
            <div className="w-[2px] h-full" style={{ backgroundColor: rgbStr(c.primary) }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideDiagnostico({ template }: { template: PdfTemplate }) {
  const c = template.colors;
  const colors = [c.primary, c.accent, c.secondary, c.accent2];
  return (
    <div className="relative w-full h-full" style={{ backgroundColor: rgbStr(c.bg) }}>
      <div className="absolute rounded-sm" style={{ backgroundColor: rgbaStr(c.white, 0.9), height: "4%", width: "35%", top: "10%", left: "6%" }} />
      {/* 4 flow cards */}
      <div className="absolute flex gap-[2%]" style={{ top: "25%", left: "6%", width: "88%", height: "60%" }}>
        {colors.map((color, i) => (
          <div key={i} className="flex-1 rounded relative" style={{ backgroundColor: rgbaStr(color, 0.04), border: `1px solid ${rgbaStr(color, 0.2)}` }}>
            <div className="absolute top-0 left-0 right-0 h-[3%]" style={{ backgroundColor: rgbStr(color) }} />
            <div className="absolute rounded-full" style={{ backgroundColor: rgbaStr(c.bg, 0.8), border: `1px solid ${rgbStr(color)}`, width: "30%", height: "10%", top: "-5%", left: "35%" }} />
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[1.5%]" style={{ backgroundColor: rgbStr(c.secondary) }} />
    </div>
  );
}

function SlideEscopo({ template }: { template: PdfTemplate }) {
  const c = template.colors;
  return (
    <div className="relative w-full h-full" style={{ backgroundColor: rgbStr(c.bg) }}>
      <div className="absolute top-0 left-0 right-0 h-[2.5%]" style={{ backgroundColor: rgbStr(c.primary) }} />
      <div className="absolute rounded-sm" style={{ backgroundColor: rgbaStr(c.white, 0.9), height: "4%", width: "30%", top: "12%", left: "6%" }} />
      {/* Table rows */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="absolute rounded" style={{
          backgroundColor: rgbaStr(c.white, 0.04), width: "88%", height: "15%", top: `${25 + i * 20}%`, left: "6%",
        }}>
          <div className="absolute left-0 top-[10%] bottom-[10%] w-[2px]" style={{ backgroundColor: rgbStr([c.secondary, c.primary, c.accent][i]) }} />
        </div>
      ))}
      {/* Bottom bar */}
      <div className="absolute rounded" style={{ backgroundColor: rgbaStr(c.bgCard, 0.8), border: `1px solid ${rgbaStr(c.secondary, 0.3)}`, width: "88%", height: "10%", bottom: "6%", left: "6%" }} />
    </div>
  );
}

function SlideInvestimento({ template }: { template: PdfTemplate }) {
  const c = template.colors;
  return (
    <div className="relative w-full h-full" style={{ backgroundColor: rgbStr(c.bg) }}>
      <div className="absolute rounded-sm" style={{ backgroundColor: rgbaStr(c.white, 0.9), height: "4%", width: "35%", top: "8%", left: "8%" }} />
      {/* Chart area */}
      <div className="absolute rounded" style={{ backgroundColor: rgbaStr(c.white, 0.03), border: `1px solid ${rgbaStr(c.primary, 0.2)}`, width: "28%", height: "55%", top: "18%", left: "6%" }}>
        {/* Bars */}
        <div className="absolute flex items-end gap-[8%] px-[10%]" style={{ bottom: "15%", left: "0%", width: "100%", height: "60%" }}>
          {[0.5, 0.8, 0.65].map((h, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${h * 100}%`, backgroundColor: rgbaStr([c.white, c.primary, c.secondary][i], i === 1 ? 0.8 : 0.5) }} />
          ))}
        </div>
      </div>
      {/* 3 pricing cards */}
      <div className="absolute flex gap-[2%]" style={{ top: "14%", left: "38%", width: "56%", height: "76%" }}>
        {[false, true, false].map((featured, i) => (
          <div key={i} className="flex-1 rounded relative" style={{
            backgroundColor: rgbaStr(featured ? c.primary : c.white, featured ? 0.08 : 0.03),
            border: `1px solid ${rgbaStr(featured ? c.primary : c.white, featured ? 0.5 : 0.1)}`,
            marginTop: featured ? "0%" : "4%",
            marginBottom: featured ? "0%" : "4%",
          }}>
            {featured && <div className="absolute rounded-full" style={{ backgroundColor: rgbStr(c.primary), width: "50%", height: "5%", top: "-2.5%", left: "25%" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideCronograma({ template }: { template: PdfTemplate }) {
  const c = template.colors;
  return (
    <div className="relative w-full h-full" style={{ backgroundColor: rgbStr(c.bg) }}>
      <div className="absolute rounded-sm" style={{ backgroundColor: rgbaStr(c.white, 0.9), height: "4%", width: "35%", top: "10%", left: "6%" }} />
      {/* Timeline card */}
      <div className="absolute rounded" style={{ backgroundColor: rgbaStr(c.white, 0.03), border: `1px solid ${rgbaStr(c.secondary, 0.2)}`, width: "88%", height: "45%", top: "20%", left: "6%" }}>
        {/* Two phase cards */}
        <div className="absolute flex gap-[3%]" style={{ top: "15%", left: "3%", width: "94%", height: "70%" }}>
          {[c.primary, c.secondary].map((color, i) => (
            <div key={i} className="flex-1 rounded" style={{ backgroundColor: rgbaStr(c.bgCard, 0.8) }}>
              <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: rgbStr(color) }} />
            </div>
          ))}
        </div>
      </div>
      {/* Bottom metrics */}
      <div className="absolute flex gap-[3%]" style={{ bottom: "8%", left: "6%", width: "88%", height: "14%" }}>
        {[c.primary, c.secondary].map((color, i) => (
          <div key={i} className="flex-1 rounded" style={{ backgroundColor: rgbaStr(c.white, 0.03), border: `1px solid ${rgbaStr(color, 0.2)}` }} />
        ))}
      </div>
    </div>
  );
}

function SlideEstrategia({ template }: { template: PdfTemplate }) {
  const c = template.colors;
  const colors = [c.primary, c.secondary, c.accent];
  return (
    <div className="relative w-full h-full" style={{ backgroundColor: rgbStr(c.bg) }}>
      <div className="absolute rounded-sm" style={{ backgroundColor: rgbaStr(c.white, 0.9), height: "4%", width: "30%", top: "10%", left: "6%" }} />
      {/* 3 benefit cards */}
      <div className="absolute flex gap-[3%]" style={{ top: "22%", left: "6%", width: "88%", height: "55%" }}>
        {colors.map((color, i) => (
          <div key={i} className="flex-1 rounded relative" style={{ backgroundColor: rgbaStr(color, 0.04), border: `1px solid ${rgbaStr(color, 0.15)}`, marginTop: i === 1 ? "0%" : "3%" }}>
            <div className="absolute top-0 left-0 right-0 h-[2%]" style={{ backgroundColor: rgbStr(color) }} />
            <div className="absolute rounded-full" style={{ backgroundColor: rgbaStr(color, 0.1), border: `1px solid ${rgbaStr(color, 0.3)}`, width: "30%", height: "18%", top: "15%", left: "35%" }} />
          </div>
        ))}
      </div>
      {/* Stats bar */}
      <div className="absolute rounded" style={{ backgroundColor: rgbaStr(c.white, 0.05), border: `1px solid ${rgbaStr(c.white, 0.1)}`, width: "88%", height: "10%", bottom: "6%", left: "6%" }} />
    </div>
  );
}

function SlidePassos({ template }: { template: PdfTemplate }) {
  const c = template.colors;
  return (
    <div className="relative w-full h-full" style={{ backgroundColor: rgbStr(c.bg) }}>
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[1%]" style={{ backgroundColor: rgbStr(c.primary) }} />
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(${rgbStr(c.primary)} 1px, transparent 1px), linear-gradient(90deg, ${rgbStr(c.primary)} 1px, transparent 1px)`,
        backgroundSize: "8% 8%",
      }} />
      {/* Left: steps */}
      <div className="absolute" style={{ top: "8%", left: "5%", width: "50%", height: "84%" }}>
        <div className="absolute rounded-sm" style={{ backgroundColor: rgbaStr(c.white, 0.9), height: "5%", width: "60%", top: "0%" }} />
        {/* Vertical line */}
        <div className="absolute" style={{ backgroundColor: rgbaStr(c.primary, 0.3), width: "2px", height: "70%", top: "15%", left: "6%" }} />
        {[c.primary, c.accent, c.secondary].map((color, i) => (
          <div key={i} className="absolute rounded" style={{
            backgroundColor: rgbaStr(color, 0.12), border: `1px solid ${rgbaStr(color, 0.3)}`,
            width: "30%", height: "15%", top: `${18 + i * 22}%`, left: "2%",
          }} />
        ))}
      </div>
      {/* Right: CTA card */}
      <div className="absolute rounded-lg" style={{ backgroundColor: rgbaStr(c.white, 0.03), border: `1px solid ${rgbaStr(c.secondary, 0.2)}`, width: "38%", height: "80%", top: "10%", right: "5%" }}>
        <div className="absolute rounded-full" style={{ backgroundColor: rgbaStr(c.secondary, 0.1), border: `1px solid ${rgbaStr(c.secondary, 0.3)}`, width: "35%", height: "12%", top: "18%", left: "32.5%" }} />
        <div className="absolute rounded" style={{ border: `1px solid ${rgbStr(c.secondary)}`, width: "70%", height: "7%", bottom: "25%", left: "15%" }} />
      </div>
    </div>
  );
}

// ── Main Page ──
export default function AdminTemplates() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<PdfTemplate | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (!authLoading && !user) navigate("/admin/login");
  }, [user, authLoading]);

  const filtered = pdfTemplates.filter((t) => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || t.category === activeCategory;
    return matchSearch && matchCat;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 pb-16 relative z-10">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Palette className="h-7 w-7 text-primary" />
            <h1 className="font-display text-2xl font-bold text-foreground">Biblioteca de Modelos</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Explore {pdfTemplates.length} modelos de PDF. Clique para expandir e visualizar todos os slides.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                !activeCategory ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              Todos
            </button>
            {templateCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeCategory === cat ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex gap-1 border border-border/50 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground mb-4">{filtered.length} modelo{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</p>

        {/* Grid */}
        <motion.div
          layout
          className={viewMode === "grid"
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
          }
        >
          <AnimatePresence>
            {filtered.map((template) => (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={() => setExpandedTemplate(template)}
                className="group cursor-pointer"
              >
                <div className="rounded-xl overflow-hidden border border-border/30 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.03]">
                  {/* Slide thumbnail */}
                  <div style={{ aspectRatio: "297/210" }} className="relative">
                    <SlidePreview template={template} />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Eye className="h-6 w-6 text-white drop-shadow-lg" />
                      </div>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-2.5 bg-card/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-foreground truncate">{template.name}</p>
                        <p className="text-[10px] text-muted-foreground">{template.category}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {[template.colors.primary, template.colors.secondary, template.colors.accent].map((color, i) => (
                          <div key={i} className="w-2.5 h-2.5 rounded-full border border-border/30" style={{ backgroundColor: rgbStr(color) }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Nenhum modelo encontrado.</p>
          </div>
        )}
      </div>

      {/* Expanded Preview Dialog */}
      <Dialog open={!!expandedTemplate} onOpenChange={(open) => !open && setExpandedTemplate(null)}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden">
          {expandedTemplate && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[expandedTemplate.colors.bg, expandedTemplate.colors.primary, expandedTemplate.colors.secondary, expandedTemplate.colors.accent, expandedTemplate.colors.accent2].map((color, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border border-border/30" style={{ backgroundColor: rgbStr(color) }} />
                    ))}
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-foreground">{expandedTemplate.name}</h2>
                    <p className="text-xs text-muted-foreground">{expandedTemplate.category} • 8 slides</p>
                  </div>
                </div>
              </div>

              {/* Full slide preview */}
              <ScrollArea className="h-[65vh]">
                <ExpandedPreview template={expandedTemplate} />
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
