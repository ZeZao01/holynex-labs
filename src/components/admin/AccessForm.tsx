import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectAccess, ACCESS_TYPES, ENVIRONMENTS, ACCESS_STATUS } from "@/lib/project-accesses";
import { DeliveredSystem } from "@/lib/delivered-systems";

interface AccessFormProps {
  access: Partial<ProjectAccess>;
  systems: DeliveredSystem[];
  onSave: (data: Partial<ProjectAccess>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function AccessForm({ access, systems, onSave, onCancel, loading }: AccessFormProps) {
  const [form, setForm] = useState<Partial<ProjectAccess>>({
    friendly_name: "", access_type: "admin_principal", environment: "producao",
    provider_name: "", access_url: "", username: "", secret_masked: "",
    secret_reference: "", status: "ativo", notes: "", owner_name: "",
    delivered_system_id: null,
    ...access,
  });

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome Amigável *</Label>
          <Input value={form.friendly_name} onChange={(e) => set("friendly_name", e.target.value)} placeholder="Ex: Admin do sistema X" />
        </div>
        <div className="space-y-2">
          <Label>Tipo de Acesso</Label>
          <Select value={form.access_type} onValueChange={(v) => set("access_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ACCESS_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Ambiente</Label>
          <Select value={form.environment} onValueChange={(v) => set("environment", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ENVIRONMENTS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ACCESS_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Sistema Entregue Vinculado</Label>
          <Select value={form.delivered_system_id || "none"} onValueChange={(v) => set("delivered_system_id", v === "none" ? null : v)}>
            <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {systems.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Provedor</Label>
          <Input value={form.provider_name} onChange={(e) => set("provider_name", e.target.value)} placeholder="Ex: Vercel, AWS, Supabase" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>URL de Acesso</Label>
        <Input value={form.access_url} onChange={(e) => set("access_url", e.target.value)} placeholder="https://..." />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Usuário / E-mail</Label>
          <Input value={form.username} onChange={(e) => set("username", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Segredo / Senha</Label>
          <Input type="password" value={form.secret_masked} onChange={(e) => set("secret_masked", e.target.value)} placeholder="Será armazenado de forma mascarada" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Referência do Segredo</Label>
          <Input value={form.secret_reference} onChange={(e) => set("secret_reference", e.target.value)} placeholder="Ex: vault/key-name ou cofre-externo" />
        </div>
        <div className="space-y-2">
          <Label>Responsável</Label>
          <Input value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
      </div>
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button onClick={() => onSave(form)} disabled={loading || !form.friendly_name}>
          {loading ? "Salvando..." : access.id ? "Atualizar" : "Registrar"}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}
