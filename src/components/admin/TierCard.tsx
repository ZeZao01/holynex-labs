import { Check, X, Minus, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProposalTier, TIER_DEFAULTS, type ScopeStatus } from "@/lib/proposal-tiers";

interface TierCardProps {
  tier: ProposalTier;
  compact?: boolean;
  onSelect?: () => void;
}

const scopeIcon: Record<ScopeStatus, React.ReactNode> = {
  included: <Check className="h-3.5 w-3.5 text-emerald-400" />,
  optional: <Minus className="h-3.5 w-3.5 text-amber-400" />,
  not_included: <X className="h-3.5 w-3.5 text-muted-foreground/40" />,
};

export default function TierCard({ tier, compact, onSelect }: TierCardProps) {
  const def = TIER_DEFAULTS[tier.type];
  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative rounded-xl border p-5 transition-all",
        def.bgClass,
        tier.is_recommended && "ring-2 ring-primary/50",
        onSelect && "cursor-pointer hover:border-primary/40"
      )}
    >
      {tier.is_recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
          <Crown className="h-3 w-3" /> Recomendada
        </div>
      )}
      <h3 className={cn("font-display font-bold text-lg mb-1", def.color)}>{tier.name}</h3>
      <div className={cn("font-display text-2xl font-bold mb-1", def.color)}>
        {tier.price > 0 ? `R$ ${tier.price.toLocaleString("pt-BR")}` : "A definir"}
      </div>
      {tier.estimated_days > 0 && (
        <p className="text-xs text-muted-foreground mb-3">{tier.estimated_days} dias estimados</p>
      )}
      {tier.description && <p className="text-sm text-muted-foreground mb-3">{tier.description}</p>}
      {tier.installments && <p className="text-xs text-muted-foreground/70 mb-3">Parcelamento: {tier.installments}</p>}

      {!compact && (
        <>
          {tier.scope_modules.length > 0 && (
            <div className="space-y-1.5 mt-3 border-t border-border/30 pt-3">
              {tier.scope_modules.map(m => (
                <div key={m.id} className="flex items-center gap-2 text-xs">
                  {scopeIcon[m.status]}
                  <span className={cn(m.status === "not_included" && "text-muted-foreground/40 line-through")}>{m.label}</span>
                </div>
              ))}
            </div>
          )}
          {tier.included_items.length > 0 && (
            <div className="mt-3 border-t border-border/30 pt-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Incluso</p>
              {tier.included_items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs"><Check className="h-3 w-3 text-emerald-400" />{item}</div>
              ))}
            </div>
          )}
          {tier.excluded_items.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Não incluso</p>
              {tier.excluded_items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground/50"><X className="h-3 w-3" />{item}</div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
