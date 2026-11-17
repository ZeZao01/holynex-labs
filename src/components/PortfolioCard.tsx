import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { PortfolioItem, ITEM_TYPES } from "@/lib/portfolio-items";
import ProjectPreview from "@/components/ProjectPreview";

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
      className="group relative rounded-2xl border border-border bg-card overflow-hidden cursor-pointer transition-all duration-500 hover:border-primary/40 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)]"
      onClick={() => navigate(`/portfolio/${itemPath}`)}
    >
      {/* Prévia: capa parada, vídeo do site rolando no hover */}
      <div className="relative">
        {thumbnail ? (
          <ProjectPreview poster={thumbnail} video={item.video_url || undefined} alt={`Prévia do site ${item.title}`} className="aspect-[16/10]" />
        ) : (
          <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="font-display text-5xl font-bold text-primary/20">{item.title.charAt(0)}</span>
          </div>
        )}
        {(item.badges || []).length > 0 && (
          <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-1.5">
            {(item.badges || []).slice(0, 2).map((b) => (
              <Badge key={b} className="bg-primary/90 text-primary-foreground text-[10px] border-0">
                <Sparkles className="h-2.5 w-2.5 mr-1" />{b}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          {item.niche && <span className="text-[11px] text-primary font-medium uppercase tracking-widest">{item.niche}</span>}
          {typeLabel && <Badge variant="secondary" className="text-[10px]">{typeLabel}</Badge>}
        </div>
        <h3 className="font-display text-base sm:text-lg font-semibold mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{item.short_description || item.subtitle}</p>

        {modules.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">{modules.slice(0, 4).join(" · ")}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" className="min-h-[40px] gap-1 text-xs">
            Ver projeto <ArrowRight className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" className="min-h-[40px] text-xs" onClick={(e) => { e.stopPropagation(); navigate(`/contato?ref=${item.id}`); }}>
            {item.cta_label || "Quero algo parecido"}
          </Button>
        </div>
      </div>
    </div>
  );
}
