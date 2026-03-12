import { useState } from "react";
import { pdfTemplates, templateCategories, type PdfTemplate } from "@/lib/pdf-templates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Download } from "lucide-react";

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: PdfTemplate) => void;
  selectedId?: string;
}

function MiniSlidePreview({ template, selected }: { template: PdfTemplate; selected: boolean }) {
  const c = template.colors;
  const rgbStr = (rgb: [number, number, number]) => `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;

  return (
    <div
      className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border-2 ${
        selected ? "border-primary ring-2 ring-primary/30 scale-[1.03]" : "border-border/30 hover:border-border hover:scale-[1.02]"
      }`}
      style={{ aspectRatio: "297/210" }}
    >
      {/* Slide background */}
      <div className="absolute inset-0" style={{ backgroundColor: rgbStr(c.bg) }}>
        {/* Corner accents */}
        <div className="absolute top-1 left-1 w-2 h-[1px]" style={{ backgroundColor: rgbStr(c.secondary) }} />
        <div className="absolute top-1 left-1 w-[1px] h-2" style={{ backgroundColor: rgbStr(c.secondary) }} />
        <div className="absolute top-1 right-1 w-2 h-[1px]" style={{ backgroundColor: rgbStr(c.secondary) }} />
        <div className="absolute top-1 right-1 w-[1px] h-2" style={{ backgroundColor: rgbStr(c.secondary) }} />

        {/* Glow */}
        <div
          className="absolute rounded-full blur-lg opacity-20"
          style={{
            backgroundColor: rgbStr(c.primary),
            width: "40%", height: "40%", top: "10%", right: "5%",
          }}
        />

        {/* Logo placeholder */}
        <div
          className="absolute rounded-full"
          style={{
            backgroundColor: rgbStr(c.primary),
            width: "12%", height: "17%", top: "15%", left: "50%", transform: "translateX(-50%)", opacity: 0.6,
          }}
        />

        {/* Title bar */}
        <div
          className="absolute h-[6%] rounded-sm"
          style={{
            backgroundColor: rgbStr(c.white),
            width: "50%", top: "38%", left: "25%", opacity: 0.9,
          }}
        />

        {/* Subtitle */}
        <div
          className="absolute h-[3%] rounded-sm"
          style={{
            backgroundColor: rgbStr(c.secondary),
            width: "40%", top: "48%", left: "30%", opacity: 0.7,
          }}
        />

        {/* Accent line */}
        <div
          className="absolute h-[2px]"
          style={{
            backgroundColor: rgbStr(c.primary),
            width: "10%", top: "55%", left: "45%",
          }}
        />

        {/* Client box */}
        <div
          className="absolute rounded"
          style={{
            border: `1px solid ${rgbStr(c.primary)}`,
            opacity: 0.4,
            width: "40%", height: "12%", top: "62%", left: "30%",
          }}
        >
          <div
            className="absolute left-0 top-[10%] bottom-[10%] w-[2px]"
            style={{ backgroundColor: rgbStr(c.secondary) }}
          />
        </div>

        {/* Bottom line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ backgroundColor: rgbStr(c.primary), opacity: 0.3 }}
        />
      </div>

      {/* Selected check */}
      {selected && (
        <div className="absolute top-1.5 right-1.5 bg-primary rounded-full p-0.5">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}

export default function TemplateSelector({ open, onOpenChange, onSelect, selectedId }: TemplateSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [currentSelected, setCurrentSelected] = useState(selectedId || "cyber-magenta");

  const filtered = activeCategory
    ? pdfTemplates.filter((t) => t.category === activeCategory)
    : pdfTemplates;

  const handleConfirm = () => {
    const template = pdfTemplates.find((t) => t.id === currentSelected);
    if (template) onSelect(template);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Download className="h-5 w-5 text-primary" />
            Escolha o Modelo do PDF
          </DialogTitle>
        </DialogHeader>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              !activeCategory ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Todos ({pdfTemplates.length})
          </button>
          {templateCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                activeCategory === cat ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {cat} ({pdfTemplates.filter((t) => t.category === cat).length})
            </button>
          ))}
        </div>

        {/* Grid */}
        <ScrollArea className="h-[55vh] pr-3">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pb-2">
            {filtered.map((template) => (
              <div
                key={template.id}
                onClick={() => setCurrentSelected(template.id)}
                onMouseEnter={() => setHoveredId(template.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="space-y-1.5"
              >
                <MiniSlidePreview template={template} selected={currentSelected === template.id} />
                <p className={`text-[10px] text-center font-medium truncate transition-colors ${
                  currentSelected === template.id ? "text-primary" : "text-muted-foreground"
                }`}>
                  {template.name}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Preview detail of hovered/selected */}
        {(hoveredId || currentSelected) && (
          <div className="flex items-center gap-3 px-2 py-1 rounded-lg bg-muted/30 text-xs text-muted-foreground">
            {(() => {
              const t = pdfTemplates.find((t) => t.id === (hoveredId || currentSelected))!;
              const rgbStr = (rgb: [number, number, number]) => `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
              return (
                <>
                  <span className="font-medium text-foreground">{t.name}</span>
                  <span>•</span>
                  <span>{t.category}</span>
                  <span>•</span>
                  <div className="flex gap-1">
                    {[t.colors.bg, t.colors.primary, t.colors.secondary, t.colors.accent, t.colors.accent2].map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: rgbStr(c) }} />
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar com este modelo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
