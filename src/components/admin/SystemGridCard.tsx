import { DeliveredSystem, SUPPORT_STATUS_MAP, REUSE_MAP } from "@/lib/delivered-systems";
import StatusBadge from "./StatusBadge";
import { Star, Recycle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  system: DeliveredSystem;
  onClick: () => void;
}

export default function SystemGridCard({ system, onClick }: Props) {
  const support = SUPPORT_STATUS_MAP[system.status_suporte as keyof typeof SUPPORT_STATUS_MAP];
  const reuse = REUSE_MAP[system.potencial_reuso as keyof typeof REUSE_MAP];

  return (
    <div className="group rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-all cursor-pointer" onClick={onClick}>
      {system.thumbnail_url ? (
        <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-muted">
          <img src={system.thumbnail_url} alt={system.nome} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video rounded-lg mb-3 bg-muted/30 flex items-center justify-center">
          <span className="text-2xl font-bold text-muted-foreground/30">{system.nome.charAt(0)}</span>
        </div>
      )}
      <h3 className="font-semibold text-sm truncate mb-1">{system.nome}</h3>
      <p className="text-xs text-muted-foreground truncate mb-2">{system.nicho || system.categoria || "Sem categoria"}</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {support && <StatusBadge status={support.color} label={support.label} className="text-[10px] px-1.5 py-0" />}
        {system.reutilizavel && <StatusBadge status="maintenance" label="Reutilizável" className="text-[10px] px-1.5 py-0" />}
        {system.destaque_interno && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400"><Star className="h-3 w-3" /> Destaque</span>
        )}
      </div>
      <Button size="sm" variant="ghost" className="w-full text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Eye className="h-3 w-3" /> Ver detalhes
      </Button>
    </div>
  );
}
