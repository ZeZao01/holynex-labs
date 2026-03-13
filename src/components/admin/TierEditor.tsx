import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Crown } from "lucide-react";
import { ProposalTier, TIER_DEFAULTS, SCOPE_MODULE_DEFAULTS, type TierType, type ScopeStatus } from "@/lib/proposal-tiers";
import { cn } from "@/lib/utils";

interface TierEditorProps {
  tier: ProposalTier;
  onChange: (tier: ProposalTier) => void;
  onRemove?: () => void;
  onSetRecommended?: () => void;
}

export default function TierEditor({ tier, onChange, onRemove, onSetRecommended }: TierEditorProps) {
  const def = TIER_DEFAULTS[tier.type];
  const [newIncluded, setNewIncluded] = useState("");
  const [newExcluded, setNewExcluded] = useState("");

  const update = (partial: Partial<ProposalTier>) => onChange({ ...tier, ...partial });

  const updateScopeModule = (moduleId: string, status: ScopeStatus) => {
    update({
      scope_modules: tier.scope_modules.map(m => m.id === moduleId ? { ...m, status } : m),
    });
  };

  const addItem = (field: "included_items" | "excluded_items", value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    update({ [field]: [...tier[field], value.trim()] });
    setter("");
  };

  const removeItem = (field: "included_items" | "excluded_items", index: number) => {
    update({ [field]: tier[field].filter((_, i) => i !== index) });
  };

  return (
    <div className={cn("rounded-xl border p-5 space-y-4", def.bgClass)}>
      <div className="flex items-center justify-between">
        <h3 className={cn("font-display font-bold text-lg", def.color)}>{tier.name}</h3>
        <div className="flex items-center gap-2">
          {onSetRecommended && (
            <Button variant={tier.is_recommended ? "default" : "outline"} size="sm" onClick={onSetRecommended} className="gap-1 text-xs">
              <Crown className="h-3 w-3" /> {tier.is_recommended ? "Recomendada" : "Recomendar"}
            </Button>
          )}
          {onRemove && <Button variant="ghost" size="icon" onClick={onRemove}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Preço (R$)</Label>
          <Input type="number" value={tier.price || ""} onChange={e => update({ price: Number(e.target.value) })} className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Prazo (dias)</Label>
          <Input type="number" value={tier.estimated_days || ""} onChange={e => update({ estimated_days: Number(e.target.value) })} className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Parcelamento</Label>
          <Input value={tier.installments} onChange={e => update({ installments: e.target.value })} placeholder="Ex: 3x sem juros" className="h-9" />
        </div>
      </div>

      <div>
        <Label className="text-xs">Descrição</Label>
        <Textarea value={tier.description} onChange={e => update({ description: e.target.value })} rows={2} className="text-sm" />
      </div>

      <div>
        <Label className="text-xs mb-2 block">Escopo Modular</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {tier.scope_modules.map(m => (
            <div key={m.id} className="flex items-center gap-2">
              <Select value={m.status} onValueChange={(v) => updateScopeModule(m.id, v as ScopeStatus)}>
                <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="included">✓ Incluso</SelectItem>
                  <SelectItem value="optional">~ Opcional</SelectItem>
                  <SelectItem value="not_included">✕ Não incluso</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Itens inclusos</Label>
          <div className="flex gap-1 mt-1">
            <Input value={newIncluded} onChange={e => setNewIncluded(e.target.value)} placeholder="Adicionar..." className="h-8 text-xs" onKeyDown={e => e.key === "Enter" && addItem("included_items", newIncluded, setNewIncluded)} />
            <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => addItem("included_items", newIncluded, setNewIncluded)}><Plus className="h-3 w-3" /></Button>
          </div>
          <div className="mt-1 space-y-0.5">
            {tier.included_items.map((item, i) => (
              <div key={i} className="flex items-center gap-1 text-xs text-emerald-400">
                <span>✓ {item}</span>
                <button onClick={() => removeItem("included_items", i)} className="text-muted-foreground hover:text-destructive ml-auto"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs">Itens não inclusos</Label>
          <div className="flex gap-1 mt-1">
            <Input value={newExcluded} onChange={e => setNewExcluded(e.target.value)} placeholder="Adicionar..." className="h-8 text-xs" onKeyDown={e => e.key === "Enter" && addItem("excluded_items", newExcluded, setNewExcluded)} />
            <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => addItem("excluded_items", newExcluded, setNewExcluded)}><Plus className="h-3 w-3" /></Button>
          </div>
          <div className="mt-1 space-y-0.5">
            {tier.excluded_items.map((item, i) => (
              <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground/50">
                <span>✕ {item}</span>
                <button onClick={() => removeItem("excluded_items", i)} className="text-muted-foreground hover:text-destructive ml-auto"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <Label className="text-xs">Observações da faixa</Label>
        <Textarea value={tier.notes} onChange={e => update({ notes: e.target.value })} rows={2} className="text-sm" />
      </div>
    </div>
  );
}
