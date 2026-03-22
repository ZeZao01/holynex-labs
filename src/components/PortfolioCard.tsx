import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { PortfolioItem, ITEM_TYPES } from "@/lib/portfolio-items";

interface Props {
  item: PortfolioItem;
}

export default function PortfolioCard({ item }: Props) {
  const navigate = useNavigate();
  const typeLabel = ITEM_TYPES.find((t) => t.value === item.item_type)?.label;
  const itemPath = item.slug || item.id;
  const modules = item.tech_stack || item.main_modules || [];
  const gallery = item.gallery_images || item.gallery_urls || [];
  const thumbnail = item.thumbnail_url || item.cover_image_url || gallery[0];

  return (
    <div
      className="group relative rounded-2xl border border-border bg-card overflow-hidden cursor-pointer transition-all duration-500 hover:border-primary/40 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)] hover:-translate-y-1"
      onClick={() => navigate(`/portfolio/${itemPath}`)}
    >
      {/* Thumbnail */}
      <div className="relative h-44 sm:h-52 overflow-hidden bg-muted">
        {thumbnail ? (
          <>
            <img
              src={thumbnail}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {item.hover_image_url && (
              <img
                src={item.hover_image_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="font-display text-5xl font-bold text-primary/20 group-hover:text-primary/40 group-hover:scale-125 transition-all duration-500">
              {item.title.charAt(0)}
            </span>
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Badges on image */}
        {(item.badges || []).length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {(item.badges || []).slice(0, 2).map((b) => (
              <Badge key={b} className="bg-primary/90 text-primary-foreground text-[10px] backdrop-blur-sm border-0">
                <Sparkles className="h-2.5 w-2.5 mr-1" />{b}
              </Badge>
            ))}
          </div>
        )}

        {/* Hover content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
          {modules.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {modules.slice(0, 4).map((m) => (
                <Badge key={m} variant="outline" className="text-[10px] bg-background/60 backdrop-blur-sm border-border/60">{m}</Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" className="text-xs gap-1">
              Ver Projeto <ArrowRight className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" className="text-xs bg-background/60 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); navigate(`/contato?ref=${item.id}`); }}>
              {item.cta_label || "Quero algo parecido"}
            </Button>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          {item.niche && <span className="text-[11px] text-primary font-medium uppercase tracking-widest">{item.niche}</span>}
          {typeLabel && <Badge variant="secondary" className="text-[10px]">{typeLabel}</Badge>}
        </div>
        <h3 className="font-display text-base sm:text-lg font-semibold mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{item.short_description || item.subtitle}</p>

        {/* Mobile CTA (visible on touch) */}
        <div className="mt-3 flex gap-2 sm:hidden">
          <Button size="sm" className="text-xs flex-1 gap-1">
            Ver Projeto <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
