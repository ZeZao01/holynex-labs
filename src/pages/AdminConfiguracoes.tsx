import { useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import SectionCard from "@/components/admin/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useAccessControl } from "@/hooks/useAccessControl";
import { Settings, Globe, Bell, Palette, Shield, Save } from "lucide-react";
import { logSecurityEvent } from "@/lib/security";

export default function AdminConfiguracoes() {
  const { canEdit, guardAction, hasPermission, canActivateAddon } = useAccessControl();
  const [agencyName, setAgencyName] = useState("HolyNex");
  const [agencyEmail, setAgencyEmail] = useState("");
  const [agencyPhone, setAgencyPhone] = useState("");
  const [notifyLeads, setNotifyLeads] = useState(true);
  const [notifyProposals, setNotifyProposals] = useState(true);
  const [darkMode] = useState(true);
  const [hiddenAddons, setHiddenAddons] = useState(false);

  const handleSave = async () => {
    const allowed = await guardAction("configuracoes", "gerenciar_configuracoes", {
      description: "Tentativa de alteração de configurações",
      severity: "high",
    });
    if (!allowed) {
      toast({ title: "Sem permissão para salvar configurações", variant: "destructive" });
      return;
    }
    await logSecurityEvent(
      "alteracao_configuracao",
      "high",
      "Configurações do sistema alteradas",
      { source: "configuracoes", entityType: "system_settings" }
    );
    toast({ title: "Configurações salvas", description: "As preferências foram atualizadas com sucesso." });
  };

  const handleAddonToggle = async (enabled: boolean) => {
    const allowed = await guardAction("configuracoes", "ativar_addon", {
      description: "Tentativa de ativar add-on oculto",
      severity: "high",
      metadata: { enabled },
    });
    if (!allowed) {
      toast({ title: "Sem permissão para ativar add-ons", variant: "destructive" });
      return;
    }
    setHiddenAddons(enabled);
    await logSecurityEvent(
      "ativacao_funcionalidade_critica",
      "high",
      enabled ? "Add-on oculto ativado" : "Add-on oculto desativado",
      { source: "configuracoes", entityType: "addon", metadata: { enabled } }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Ajustes gerais do sistema e preferências"
        breadcrumbs={[{ label: "Configurações" }]}
        actions={
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!canEdit("configuracoes") && !hasPermission("configuracoes", "gerenciar_configuracoes")}
          >
            <Save className="h-4 w-4 mr-1" /> Salvar
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Dados da Agência" action={<Globe className="h-4 w-4 text-muted-foreground" />}>
          <div className="space-y-4">
            <div><Label>Nome da Agência</Label><Input value={agencyName} onChange={e => setAgencyName(e.target.value)} /></div>
            <div><Label>Email de Contato</Label><Input type="email" placeholder="contato@holynex.com" value={agencyEmail} onChange={e => setAgencyEmail(e.target.value)} /></div>
            <div><Label>Telefone / WhatsApp</Label><Input placeholder="+55 11 99999-9999" value={agencyPhone} onChange={e => setAgencyPhone(e.target.value)} /></div>
          </div>
        </SectionCard>

        <SectionCard title="Notificações" action={<Bell className="h-4 w-4 text-muted-foreground" />}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Novos leads</p><p className="text-xs text-muted-foreground">Notificar quando um novo orçamento é recebido</p></div>
              <Switch checked={notifyLeads} onCheckedChange={setNotifyLeads} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Propostas geradas</p><p className="text-xs text-muted-foreground">Notificar quando uma proposta é finalizada</p></div>
              <Switch checked={notifyProposals} onCheckedChange={setNotifyProposals} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Aparência" action={<Palette className="h-4 w-4 text-muted-foreground" />}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Modo escuro</p><p className="text-xs text-muted-foreground">Tema padrão do painel administrativo</p></div>
              <Switch checked={darkMode} disabled />
            </div>
            <p className="text-xs text-muted-foreground">O tema escuro é o padrão da identidade HolyNex e não pode ser alterado.</p>
          </div>
        </SectionCard>

        <SectionCard title="Segurança" action={<Shield className="h-4 w-4 text-muted-foreground" />}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Autenticação</p><p className="text-xs text-muted-foreground">Login por email e senha via Lovable Cloud</p></div>
              <span className="text-xs text-primary font-medium">Ativo</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Logs de auditoria</p><p className="text-xs text-muted-foreground">Rastreamento de ações no painel</p></div>
              <span className="text-xs text-primary font-medium">Ativo</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Avançado" action={<Settings className="h-4 w-4 text-muted-foreground" />}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Add-ons ocultos</p>
                <p className="text-xs text-muted-foreground">Ativa funcionalidades estruturais avançadas</p>
              </div>
              <Switch checked={hiddenAddons} onCheckedChange={handleAddonToggle} disabled={!canActivateAddon()} />
            </div>
            <p className="text-xs text-muted-foreground">Disponível apenas para perfis com permissão estrutural ampliada.</p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
