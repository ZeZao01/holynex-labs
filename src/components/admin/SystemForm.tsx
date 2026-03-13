import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeliveredSystem, DEFAULT_TAGS, SUPPORT_STATUS_MAP, OPERATIONAL_STATUS_MAP, REUSE_MAP } from "@/lib/delivered-systems";
import { NICHES } from "@/lib/admin-types";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface SystemFormProps {
  system: Partial<DeliveredSystem>;
  tags: string[];
  onSave: (system: Partial<DeliveredSystem>, tags: string[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function SystemForm({ system, tags: initialTags, onSave, onCancel, loading }: SystemFormProps) {
  const [form, setForm] = useState<Partial<DeliveredSystem>>({
    nome: "", cliente: "", empresa_cliente: "", categoria: "", tipo_projeto: "",
    nicho: "", resumo_curto: "", descricao_interna: "", thumbnail_url: "",
    status_suporte: "sem_suporte", status_operacional: "em_uso",
    ativo: true, reutilizavel: false, destaque_interno: false, potencial_reuso: "baixo",
    faixa_ticket: "", valor_fechado: 0, recorrencia_mensal: 0,
    live_url: "", admin_url: "", staging_url: "", repo_url: "", docs_url: "",
    design_url: "", analytics_url: "", stack_principal: [], banco_dados: "",
    integracoes: [], versao_atual: "1.0", observacoes_tecnicas: "", observacoes_comerciais: "",
    faixa_contratada: "",
    ...system,
  });
  const [tags, setTags] = useState<string[]>(initialTags);
  const [newTag, setNewTag] = useState("");

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) setTags([...tags, tag]);
    setNewTag("");
  };
  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  return (
    <div className="space-y-6">
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="tecnico">Técnico</TabsTrigger>
          <TabsTrigger value="comercial">Comercial</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Sistema *</Label>
              <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Input value={form.cliente} onChange={(e) => set("cliente", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input value={form.empresa_cliente} onChange={(e) => set("empresa_cliente", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nicho</Label>
              <Select value={form.nicho} onValueChange={(v) => set("nicho", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Projeto</Label>
              <Input value={form.tipo_projeto} onChange={(e) => set("tipo_projeto", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input value={form.categoria} onChange={(e) => set("categoria", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Resumo Curto</Label>
            <Input value={form.resumo_curto} onChange={(e) => set("resumo_curto", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Descrição Interna</Label>
            <Textarea value={form.descricao_interna} onChange={(e) => set("descricao_interna", e.target.value)} rows={4} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Status de Suporte</Label>
              <Select value={form.status_suporte} onValueChange={(v) => set("status_suporte", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SUPPORT_STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status Operacional</Label>
              <Select value={form.status_operacional} onValueChange={(v) => set("status_operacional", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(OPERATIONAL_STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Potencial de Reuso</Label>
              <Select value={form.potencial_reuso} onValueChange={(v) => set("potencial_reuso", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REUSE_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.ativo} onCheckedChange={(v) => set("ativo", v)} />
              <Label>Ativo</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.reutilizavel} onCheckedChange={(v) => set("reutilizavel", v)} />
              <Label>Reutilizável</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.destaque_interno} onCheckedChange={(v) => set("destaque_interno", v)} />
              <Label>Destaque Interno</Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tecnico" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Live URL</Label><Input value={form.live_url} onChange={(e) => set("live_url", e.target.value)} /></div>
            <div className="space-y-2"><Label>Admin URL</Label><Input value={form.admin_url} onChange={(e) => set("admin_url", e.target.value)} /></div>
            <div className="space-y-2"><Label>Staging URL</Label><Input value={form.staging_url} onChange={(e) => set("staging_url", e.target.value)} /></div>
            <div className="space-y-2"><Label>Repositório</Label><Input value={form.repo_url} onChange={(e) => set("repo_url", e.target.value)} /></div>
            <div className="space-y-2"><Label>Documentação</Label><Input value={form.docs_url} onChange={(e) => set("docs_url", e.target.value)} /></div>
            <div className="space-y-2"><Label>Design</Label><Input value={form.design_url} onChange={(e) => set("design_url", e.target.value)} /></div>
            <div className="space-y-2"><Label>Analytics</Label><Input value={form.analytics_url} onChange={(e) => set("analytics_url", e.target.value)} /></div>
            <div className="space-y-2"><Label>Banco de Dados</Label><Input value={form.banco_dados} onChange={(e) => set("banco_dados", e.target.value)} /></div>
          </div>
          <div className="space-y-2">
            <Label>Stack Principal (separado por vírgula)</Label>
            <Input value={(form.stack_principal || []).join(", ")} onChange={(e) => set("stack_principal", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} />
          </div>
          <div className="space-y-2">
            <Label>Integrações (separado por vírgula)</Label>
            <Input value={(form.integracoes || []).join(", ")} onChange={(e) => set("integracoes", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Versão Atual</Label><Input value={form.versao_atual} onChange={(e) => set("versao_atual", e.target.value)} /></div>
            <div className="space-y-2"><Label>Thumbnail URL</Label><Input value={form.thumbnail_url} onChange={(e) => set("thumbnail_url", e.target.value)} /></div>
          </div>
          <div className="space-y-2">
            <Label>Observações Técnicas</Label>
            <Textarea value={form.observacoes_tecnicas} onChange={(e) => set("observacoes_tecnicas", e.target.value)} rows={3} />
          </div>
        </TabsContent>

        <TabsContent value="comercial" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Valor Fechado (R$)</Label><Input type="number" value={form.valor_fechado} onChange={(e) => set("valor_fechado", Number(e.target.value))} /></div>
            <div className="space-y-2"><Label>Recorrência Mensal (R$)</Label><Input type="number" value={form.recorrencia_mensal} onChange={(e) => set("recorrencia_mensal", Number(e.target.value))} /></div>
            <div className="space-y-2"><Label>Faixa de Ticket</Label><Input value={form.faixa_ticket} onChange={(e) => set("faixa_ticket", e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Faixa Contratada</Label><Input value={form.faixa_contratada} onChange={(e) => set("faixa_contratada", e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Observações Comerciais</Label>
            <Textarea value={form.observacoes_comerciais} onChange={(e) => set("observacoes_comerciais", e.target.value)} rows={3} />
          </div>
        </TabsContent>

        <TabsContent value="tags" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeTag(tag)}>
                {tag} <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Nova tag..." value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(newTag))} />
            <Button type="button" size="sm" variant="outline" onClick={() => addTag(newTag)}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {DEFAULT_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
              <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-accent" onClick={() => addTag(tag)}>{tag}</Badge>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 pt-4 border-t border-border">
        <Button onClick={() => onSave(form, tags)} disabled={loading || !form.nome}>
          {loading ? "Salvando..." : system.id ? "Atualizar" : "Cadastrar"}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}
