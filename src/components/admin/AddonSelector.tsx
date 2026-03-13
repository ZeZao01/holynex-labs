import { ProposalAddon } from "@/lib/proposal-tiers";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AddonSelectorProps {
  addons: ProposalAddon[];
  onToggle?: (id: string) => void;
  readOnly?: boolean;
}

export default function AddonSelector({ addons, onToggle, readOnly }: AddonSelectorProps) {
  const active = addons.filter(a => a.is_active);
  if (active.length === 0) return null;

  const total = active.filter(a => a.is_selected).reduce((s, a) => s + a.price, 0);

  return (
    <div className="space-y-2">
      {active.map(addon => (
        <div
          key={addon.id}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border transition-colors",
            addon.is_selected ? "border-primary/30 bg-primary/5" : "border-border/30 bg-muted/20"
          )}
        >
          {!readOnly && (
            <Checkbox
              checked={addon.is_selected}
              onCheckedChange={() => onToggle?.(addon.id)}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{addon.name}</span>
              <Badge variant="outline" className="text-[10px]">{addon.category}</Badge>
              {!addon.is_optional && <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">Obrigatório</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">{addon.description}</p>
          </div>
          <span className="text-sm font-semibold text-primary shrink-0">
            R$ {addon.price.toLocaleString("pt-BR")}
          </span>
        </div>
      ))}
      {total > 0 && (
        <div className="text-right text-sm font-semibold text-primary pt-2 border-t border-border/30">
          Total add-ons: R$ {total.toLocaleString("pt-BR")}
        </div>
      )}
    </div>
  );
}
