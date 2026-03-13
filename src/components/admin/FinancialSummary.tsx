import { useEffect, useState } from "react";
import { DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  getProfitabilityMetrics, saveProfitabilityMetrics,
  ProfitabilityMetrics, FLAG_LABELS, STRATEGIC_FLAGS, RISK_ALERTS,
} from "@/lib/financial-metrics";

interface Props {
  systemId: string;
}

export default function FinancialSummary({ systemId }: Props) {
  const [metrics, setMetrics] = useState<ProfitabilityMetrics | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<ProfitabilityMetrics>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [systemId]);

  async function load() {
    try {
      const m = await getProfitabilityMetrics(systemId);
      setMetrics(m);
      if (m) setForm(m);
    } catch {} finally { setLoading(false); }
  }

  async function handleSave() {
    setLoading(true);
    try {
      await saveProfitabilityMetrics({ ...form, delivered_system_id: systemId });
      toast({ title: "Métricas financeiras salvas!" });
      setEditing(false);
      load();
    } catch {
      toast({ title: "Erro ao salvar métricas", variant: "destructive" });
    } finally { setLoading(false); }
  }

  function toggleFlag(flag: string) {
    const current = form.flags || [];
    setForm({ ...form, flags: current.includes(flag) ? current.filter(f => f !== flag) : [...current, flag] });
  }

  const fmt = (v: number) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
  const risks = metrics ? RISK_ALERTS.filter(r => r.check(metrics)) : [];

  if (loading) return <div className="text-sm text-muted-foreground p-4">Carregando métricas...</div>;

  if (!metrics && !editing) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4" /> Financeiro</h3>
          <Button size="sm" variant="outline" onClick={() => { setEditing(true); setForm({ delivered_system_id: systemId }); }}>Configurar</Button>
        </div>
        <p className="text-sm text-muted-foreground">Métricas financeiras não configuradas para este sistema.</p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4" /> Métricas Financeiras</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); if (metrics) setForm(metrics); }}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={loading}>Salvar</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Receita Setup" value={form.receita_setup} onChange={v => setForm({ ...form, receita_setup: v })} />
          <NumField label="Receita Recorrente (mês)" value={form.receita_recorrente} onChange={v => setForm({ ...form, receita_recorrente: v })} />
          <NumField label="Receita Manutenção" value={form.receita_manutencao} onChange={v => setForm({ ...form, receita_manutencao: v })} />
          <NumField label="Custo Entrega" value={form.custo_entrega} onChange={v => setForm({ ...form, custo_entrega: v })} />
          <NumField label="Custo Suporte" value={form.custo_suporte} onChange={v => setForm({ ...form, custo_suporte: v })} />
          <NumField label="Score Demanda (0-100)" value={form.demand_score} onChange={v => setForm({ ...form, demand_score: v })} />
          <NumField label="Score Reuso (0-100)" value={form.reuse_score} onChange={v => setForm({ ...form, reuse_score: v })} />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.override_manual || false} onCheckedChange={v => setForm({ ...form, override_manual: v })} />
          <Label className="text-xs">Override manual de scores</Label>
        </div>
        <div>
          <Label className="text-xs mb-2 block">Flags estratégicas</Label>
          <div className="flex flex-wrap gap-2">
            {STRATEGIC_FLAGS.map(f => {
              const fl = FLAG_LABELS[f];
              const active = (form.flags || []).includes(f);
              return (
                <Badge key={f} variant={active ? "default" : "outline"} className={`cursor-pointer text-[10px] ${active ? fl.color : ""}`} onClick={() => toggleFlag(f)}>
                  {fl.label}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Display mode
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4" /> Financeiro</h3>
        <Button size="sm" variant="outline" onClick={() => { setEditing(true); setForm(metrics!); }}>Editar</Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <Stat label="Receita Total" value={fmt(metrics!.receita_total)} />
        <Stat label="Setup" value={fmt(metrics!.receita_setup)} />
        <Stat label="Recorrência" value={`${fmt(metrics!.receita_recorrente)}/mês`} />
        <Stat label="Manutenção" value={fmt(metrics!.receita_manutencao)} />
        <Stat label="Margem" value={`${metrics!.margem_estimada.toFixed(1)}%`} color={metrics!.margem_estimada < 20 ? "text-red-400" : metrics!.margem_estimada > 50 ? "text-emerald-400" : undefined} />
      </div>
      <div className="grid grid-cols-5 gap-2">
        <ScoreBlock label="Profit." value={metrics!.profitability_score} />
        <ScoreBlock label="Demanda" value={metrics!.demand_score} />
        <ScoreBlock label="Recorr." value={metrics!.recurrence_score} />
        <ScoreBlock label="Reuso" value={metrics!.reuse_score} />
        <ScoreBlock label="Oportun." value={metrics!.opportunity_score} />
      </div>
      {(metrics!.flags || []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {metrics!.flags.map(f => {
            const fl = FLAG_LABELS[f];
            return fl ? <Badge key={f} variant="outline" className={`text-[10px] ${fl.color}`}>{fl.label}</Badge> : null;
          })}
        </div>
      )}
      {risks.length > 0 && (
        <div className="space-y-1">
          {risks.map(r => (
            <div key={r.key} className="text-xs text-amber-400 flex items-center gap-1">⚠️ {r.label}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className={`font-semibold ${color || ""}`}>{value}</p>
    </div>
  );
}

function ScoreBlock({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "text-emerald-400" : value >= 40 ? "text-amber-400" : "text-red-400";
  return (
    <div className="text-center">
      <Progress value={value} className="h-1.5 mb-1" />
      <span className={`text-sm font-bold ${color}`}>{value}</span>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value?: number; onChange: (v: number) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type="number" value={value || ""} onChange={e => onChange(Number(e.target.value))} className="h-8 text-sm" />
    </div>
  );
}
