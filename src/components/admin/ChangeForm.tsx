import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ProjectChange, CHANGE_TYPES, CHANGE_STATUSES, PRIORITIES, URGENCIES,
  REQUEST_ORIGINS, BILLING_MODES,
} from "@/lib/project-changes";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  change?: ProjectChange | null;
  onSave: (data: Partial<ProjectChange>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ChangeForm({ change, onSave, onCancel, loading }: Props) {
  const [form, setForm] = useState<Partial<ProjectChange>>({
    title: "",
    change_type: "melhoria",
    short_description: "",
    detailed_description: "",
    status: "aberta",
    priority: "media",
    urgency: "sem_urgencia",
    request_origin: "cliente",
    requested_by_name: "",
    assigned_to_name: "",
    estimated_hours: 0,
    estimated_cost: 0,
    billing_mode: "avulso_nao_orcado",
    is_included_in_contract: false,
    needs_approval: false,
    approval_notes: "",
    internal_notes: "",
    commercial_notes: "",
    opportunity_tag: "",
    project_id: null,
    delivered_system_id: null,
    project_module_id: null,
  });
  const [systems, setSystems] = useState<{ id: string; nome: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; nome: string }[]>([]);
  const [modules, setModules] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    if (change) setForm(change);
    supabase.from("delivered_systems").select("id, nome").order("nome").then(({ data }) => setSystems(data || []));
    supabase.from("projects").select("id, nome").order("nome").then(({ data }) => setProjects(data || []));
    supabase.from("project_modules").select("id, nome").order("nome").then(({ data }) => setModules(data || []));
  }, [change]);

  const set = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="comercial">Comercial</TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4 mt-4">
          <div>
            <Label>Título *</Label>
            <Input value={form.title || ""} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.change_type} onValueChange={(v) => set("change_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CHANGE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CHANGE_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Urgência</Label>
              <Select value={form.urgency} onValueChange={(v) => set("urgency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{URGENCIES.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Origem</Label>
              <Select value={form.request_origin || "cliente"} onValueChange={(v) => set("request_origin", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REQUEST_ORIGINS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Projeto</Label>
              <Select value={form.project_id || "none"} onValueChange={(v) => set("project_id", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sistema Entregue</Label>
              <Select value={form.delivered_system_id || "none"} onValueChange={(v) => set("delivered_system_id", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {systems.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Módulo</Label>
              <Select value={form.project_module_id || "none"} onValueChange={(v) => set("project_module_id", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {modules.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Descrição Curta</Label>
            <Input value={form.short_description || ""} onChange={(e) => set("short_description", e.target.value)} />
          </div>
          <div>
            <Label>Descrição Detalhada</Label>
            <Textarea rows={4} value={form.detailed_description || ""} onChange={(e) => set("detailed_description", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Solicitante</Label>
              <Input value={form.requested_by_name || ""} onChange={(e) => set("requested_by_name", e.target.value)} />
            </div>
            <div>
              <Label>Responsável</Label>
              <Input value={form.assigned_to_name || ""} onChange={(e) => set("assigned_to_name", e.target.value)} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comercial" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Horas Estimadas</Label>
              <Input type="number" value={form.estimated_hours || 0} onChange={(e) => set("estimated_hours", Number(e.target.value))} />
            </div>
            <div>
              <Label>Custo Estimado (R$)</Label>
              <Input type="number" value={form.estimated_cost || 0} onChange={(e) => set("estimated_cost", Number(e.target.value))} />
            </div>
            <div>
              <Label>Forma de Cobrança</Label>
              <Select value={form.billing_mode || "avulso_nao_orcado"} onValueChange={(v) => set("billing_mode", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BILLING_MODES.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tag Oportunidade</Label>
              <Input value={form.opportunity_tag || ""} onChange={(e) => set("opportunity_tag", e.target.value)} placeholder="ex: upsell, expansão" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_included_in_contract || false} onCheckedChange={(v) => set("is_included_in_contract", v)} />
              <Label>Incluso em contrato</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.needs_approval || false} onCheckedChange={(v) => set("needs_approval", v)} />
              <Label>Requer aprovação</Label>
            </div>
          </div>
          {form.needs_approval && (
            <div>
              <Label>Notas de Aprovação</Label>
              <Textarea rows={2} value={form.approval_notes || ""} onChange={(e) => set("approval_notes", e.target.value)} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="notas" className="space-y-4 mt-4">
          <div>
            <Label>Observações Internas</Label>
            <Textarea rows={3} value={form.internal_notes || ""} onChange={(e) => set("internal_notes", e.target.value)} />
          </div>
          <div>
            <Label>Observações Comerciais</Label>
            <Textarea rows={3} value={form.commercial_notes || ""} onChange={(e) => set("commercial_notes", e.target.value)} />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
      </div>
    </form>
  );
}
