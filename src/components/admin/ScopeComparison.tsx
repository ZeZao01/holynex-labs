import { Check, X, Minus } from "lucide-react";
import { ProposalTier, TIER_DEFAULTS, SCOPE_MODULE_DEFAULTS, type ScopeStatus } from "@/lib/proposal-tiers";
import { cn } from "@/lib/utils";

interface ScopeComparisonProps {
  tiers: ProposalTier[];
}

const icon: Record<ScopeStatus, React.ReactNode> = {
  included: <Check className="h-4 w-4 text-emerald-400" />,
  optional: <Minus className="h-4 w-4 text-amber-400" />,
  not_included: <X className="h-4 w-4 text-muted-foreground/30" />,
};

export default function ScopeComparison({ tiers }: ScopeComparisonProps) {
  if (tiers.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40">
            <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Módulo</th>
            {tiers.map(t => {
              const def = TIER_DEFAULTS[t.type];
              return (
                <th key={t.id} className={cn("text-center py-2 px-3 text-xs font-semibold", def.color)}>
                  {t.name}
                  {t.is_recommended && <span className="block text-[9px] text-primary">★ Recomendada</span>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {SCOPE_MODULE_DEFAULTS.map(mod => (
            <tr key={mod.id} className="border-b border-border/20">
              <td className="py-2 px-3 text-muted-foreground">{mod.label}</td>
              {tiers.map(t => {
                const sm = t.scope_modules.find(m => m.id === mod.id);
                const status: ScopeStatus = sm?.status || "not_included";
                return (
                  <td key={t.id} className="text-center py-2 px-3">
                    {icon[status]}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="border-t border-border/40 font-semibold">
            <td className="py-2 px-3">Investimento</td>
            {tiers.map(t => {
              const def = TIER_DEFAULTS[t.type];
              return (
                <td key={t.id} className={cn("text-center py-2 px-3", def.color)}>
                  {t.price > 0 ? `R$ ${t.price.toLocaleString("pt-BR")}` : "—"}
                </td>
              );
            })}
          </tr>
          <tr>
            <td className="py-2 px-3 text-muted-foreground">Prazo</td>
            {tiers.map(t => (
              <td key={t.id} className="text-center py-2 px-3 text-muted-foreground">
                {t.estimated_days > 0 ? `${t.estimated_days} dias` : "—"}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
