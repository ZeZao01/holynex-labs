import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/admin/PageHeader";
import SectionCard from "@/components/admin/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAccessControl } from "@/hooks/useAccessControl";
import { Settings, Globe, Bell, Palette, Shield, Save, Layers } from "lucide-react";
import { logSecurityEvent } from "@/lib/security";
import {
  DEFAULT_SYSTEM_SETTINGS,
  getActiveSettings,
  normalizeAiProviders,
  setVersionedSetting,
  type AiProvidersSettings,
  type SystemSettingKey,
} from "@/lib/system-settings";

export default function AdminConfiguracoes() {
  const navigate = useNavigate();
  const { canEdit, guardAction, hasPermission, canActivateAddon } = useAccessControl();
  const [agencyName, setAgencyName] = useState(DEFAULT_SYSTEM_SETTINGS.feature_flags.system_profile.agency_name);
  const [agencyEmail, setAgencyEmail] = useState(DEFAULT_SYSTEM_SETTINGS.feature_flags.system_profile.agency_email);
  const [agencyPhone, setAgencyPhone] = useState(DEFAULT_SYSTEM_SETTINGS.feature_flags.system_profile.agency_phone);
  const [aiProviders, setAiProviders] = useState<AiProvidersSettings>(DEFAULT_SYSTEM_SETTINGS.ai_providers);
  const [aiModelsJson, setAiModelsJson] = useState(JSON.stringify(DEFAULT_SYSTEM_SETTINGS.ai_models, null, 2));
  const [promptPoliciesJson, setPromptPoliciesJson] = useState(JSON.stringify(DEFAULT_SYSTEM_SETTINGS.prompt_policies, null, 2));
  const [proposalRulesJson, setProposalRulesJson] = useState(JSON.stringify(DEFAULT_SYSTEM_SETTINGS.proposal_rules, null, 2));
  const [pdfRulesJson, setPdfRulesJson] = useState(JSON.stringify(DEFAULT_SYSTEM_SETTINGS.pdf_rules, null, 2));
  const [addonRulesJson, setAddonRulesJson] = useState(JSON.stringify(DEFAULT_SYSTEM_SETTINGS.addon_rules, null, 2));
  const [portfolioRulesJson, setPortfolioRulesJson] = useState(JSON.stringify(DEFAULT_SYSTEM_SETTINGS.portfolio_rules, null, 2));
  const [featureFlags, setFeatureFlags] = useState(DEFAULT_SYSTEM_SETTINGS.feature_flags);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [darkMode] = useState(true);

  const canManageProviders = hasPermission("configuracoes", "gerenciar_provedores_ia");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const keys: SystemSettingKey[] = [
          "ai_providers",
          "ai_models",
          "prompt_policies",
          "proposal_rules",
          "pdf_rules",
          "addon_rules",
          "portfolio_rules",
          "feature_flags",
        ];
        const map = await getActiveSettings(keys);

        const aiProvidersSetting = map.get("ai_providers")?.value ?? DEFAULT_SYSTEM_SETTINGS.ai_providers;
        const normalizedProviders = normalizeAiProviders(aiProvidersSetting);
        setAiProviders(normalizedProviders);

        setAiModelsJson(JSON.stringify(map.get("ai_models")?.value ?? DEFAULT_SYSTEM_SETTINGS.ai_models, null, 2));
        setPromptPoliciesJson(JSON.stringify(map.get("prompt_policies")?.value ?? DEFAULT_SYSTEM_SETTINGS.prompt_policies, null, 2));
        setProposalRulesJson(JSON.stringify(map.get("proposal_rules")?.value ?? DEFAULT_SYSTEM_SETTINGS.proposal_rules, null, 2));
        setPdfRulesJson(JSON.stringify(map.get("pdf_rules")?.value ?? DEFAULT_SYSTEM_SETTINGS.pdf_rules, null, 2));
        setAddonRulesJson(JSON.stringify(map.get("addon_rules")?.value ?? DEFAULT_SYSTEM_SETTINGS.addon_rules, null, 2));
        setPortfolioRulesJson(JSON.stringify(map.get("portfolio_rules")?.value ?? DEFAULT_SYSTEM_SETTINGS.portfolio_rules, null, 2));

        const featureFlagsValue = map.get("feature_flags")?.value ?? DEFAULT_SYSTEM_SETTINGS.feature_flags;
        setFeatureFlags(featureFlagsValue);
        setAgencyName(featureFlagsValue?.system_profile?.agency_name ?? "");
        setAgencyEmail(featureFlagsValue?.system_profile?.agency_email ?? "");
        setAgencyPhone(featureFlagsValue?.system_profile?.agency_phone ?? "");
      } catch (error) {
        console.error("Erro ao carregar configuracoes:", error);
        toast({ title: "Configurações padrão carregadas", description: "Os ajustes salvos serão sincronizados quando o banco responder." });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    const allowed = await guardAction("configuracoes", "gerenciar_configuracoes", {
      description: "Tentativa de alteração de configurações",
      severity: "high",
    });
    if (!allowed) {
      toast({ title: "Sem permissão para salvar configurações", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const parsedPromptPolicies = JSON.parse(promptPoliciesJson);
      const parsedProposalRules = JSON.parse(proposalRulesJson);
      const parsedPdfRules = JSON.parse(pdfRulesJson);
      const parsedAddonRules = JSON.parse(addonRulesJson);
      const parsedPortfolioRules = JSON.parse(portfolioRulesJson);

      const nextFeatureFlags = {
        ...featureFlags,
        system_profile: {
          agency_name: agencyName,
          agency_email: agencyEmail,
          agency_phone: agencyPhone,
        },
      };

      const saveActions: Promise<void>[] = [];

      saveActions.push(setVersionedSetting("prompt_policies", "prompt_policies", parsedPromptPolicies));
      saveActions.push(setVersionedSetting("proposal_rules", "proposal_rules", parsedProposalRules));
      saveActions.push(setVersionedSetting("pdf_rules", "pdf_rules", parsedPdfRules));
      saveActions.push(setVersionedSetting("addon_rules", "addon_rules", parsedAddonRules));
      saveActions.push(setVersionedSetting("portfolio_rules", "portfolio_rules", parsedPortfolioRules));
      saveActions.push(setVersionedSetting("feature_flags", "feature_flags", nextFeatureFlags));

      if (canManageProviders) {
        const parsedAiModels = JSON.parse(aiModelsJson);
        saveActions.push(setVersionedSetting("ai_providers", "ai_providers", aiProviders, true));
        saveActions.push(setVersionedSetting("ai_models", "ai_models", parsedAiModels, true));
      }

      await Promise.all(saveActions);

      await logSecurityEvent(
        "alteracao_configuracao",
        "high",
        "Configurações do sistema alteradas",
        { source: "configuracoes", entityType: "system_settings" }
      );

      toast({ title: "Configurações salvas", description: "As preferências foram atualizadas com sucesso." });
    } catch (error) {
      console.error("Erro ao salvar configuracoes:", error);
      toast({ title: "Erro ao salvar configurações", variant: "destructive" });
    } finally {
      setSaving(false);
    }
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
    setFeatureFlags((prev: any) => ({
      ...prev,
      hidden_addons: enabled,
    }));
    await logSecurityEvent(
      "ativacao_funcionalidade_critica",
      "high",
      enabled ? "Add-on oculto ativado" : "Add-on oculto desativado",
      { source: "configuracoes", entityType: "addon", metadata: { enabled } }
    );
  };

  const updateProvider = (name: string, updates: Partial<AiProvidersSettings["providers"][number]>) => {
    setAiProviders((prev) => ({
      ...prev,
      providers: prev.providers.map((provider) =>
        provider.name === name ? { ...provider, ...updates } : provider
      ),
    }));
  };

  const fallbackOrderValue = useMemo(
    () => (aiProviders.fallback_order || []).join(", "),
    [aiProviders.fallback_order]
  );

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
            disabled={
              loading ||
              saving ||
              (!canEdit("configuracoes") && !hasPermission("configuracoes", "gerenciar_configuracoes"))
            }
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
              <Switch
                checked={!!featureFlags?.notifications?.leads}
                onCheckedChange={(checked) =>
                  setFeatureFlags((prev: any) => ({
                    ...prev,
                    notifications: { ...(prev.notifications || {}), leads: checked },
                  }))
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Propostas geradas</p><p className="text-xs text-muted-foreground">Notificar quando uma proposta é finalizada</p></div>
              <Switch
                checked={!!featureFlags?.notifications?.proposals}
                onCheckedChange={(checked) =>
                  setFeatureFlags((prev: any) => ({
                    ...prev,
                    notifications: { ...(prev.notifications || {}), proposals: checked },
                  }))
                }
              />
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
              <div><p className="text-sm font-medium">Autenticação</p><p className="text-xs text-muted-foreground">Login por e-mail e senha (Supabase Auth)</p></div>
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
              <Switch
                checked={!!featureFlags?.hidden_addons}
                onCheckedChange={handleAddonToggle}
                disabled={!canActivateAddon()}
              />
            </div>
            <p className="text-xs text-muted-foreground">Disponível apenas para perfis com permissão estrutural ampliada.</p>
          </div>
        </SectionCard>

        <SectionCard title="Provedores de IA" action={<Settings className="h-4 w-4 text-muted-foreground" />}>
          <div className="space-y-4">
            {!canManageProviders && (
              <p className="text-xs text-muted-foreground">
                Apenas perfis dev_admin/super_admin podem editar provedores e modelos.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Provider padrão</Label>
                <Input
                  value={aiProviders.default_provider}
                  onChange={(e) => setAiProviders((prev) => ({ ...prev, default_provider: e.target.value }))}
                  disabled={!canManageProviders}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Fallback ativo</p>
                  <p className="text-xs text-muted-foreground">Permitir alternar para provedores de reserva</p>
                </div>
                <Switch
                  checked={aiProviders.fallback_enabled}
                  onCheckedChange={(checked) =>
                    setAiProviders((prev) => ({ ...prev, fallback_enabled: checked }))
                  }
                  disabled={!canManageProviders}
                />
              </div>
              <div>
                <Label>Fallback order (separado por vírgula)</Label>
                <Input
                  value={fallbackOrderValue}
                  onChange={(e) =>
                    setAiProviders((prev) => ({
                      ...prev,
                      fallback_order: e.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    }))
                  }
                  disabled={!canManageProviders}
                />
              </div>
              <div>
                <Label>Temperatura global</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={aiProviders.temperature}
                  onChange={(e) =>
                    setAiProviders((prev) => ({ ...prev, temperature: Number(e.target.value) || 0 }))
                  }
                  disabled={!canManageProviders}
                />
              </div>
              <div>
                <Label>Max tokens global</Label>
                <Input
                  type="number"
                  value={aiProviders.max_tokens}
                  onChange={(e) =>
                    setAiProviders((prev) => ({ ...prev, max_tokens: Number(e.target.value) || 0 }))
                  }
                  disabled={!canManageProviders}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              {aiProviders.providers
                .filter((provider) => ["OpenRouter", "Groq"].includes(provider.name))
                .map((provider) => (
                  <div key={provider.name} className="rounded-md border border-border/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{provider.name}</p>
                        <p className="text-xs text-muted-foreground">Configura URL, modelo e disponibilidade.</p>
                      </div>
                      <Switch
                        checked={provider.enabled}
                        onCheckedChange={(checked) => updateProvider(provider.name, { enabled: checked })}
                        disabled={!canManageProviders}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Endpoint</Label>
                        <Input
                          value={provider.url}
                          onChange={(e) => updateProvider(provider.name, { url: e.target.value })}
                          disabled={!canManageProviders}
                        />
                      </div>
                      <div>
                        <Label>Modelo</Label>
                        <Input
                          value={provider.model}
                          onChange={(e) => updateProvider(provider.name, { model: e.target.value })}
                          disabled={!canManageProviders}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Modelos de IA" action={<Settings className="h-4 w-4 text-muted-foreground" />}>
          <div className="space-y-3">
            <Label>JSON de modelos e overrides</Label>
            <Textarea
              value={aiModelsJson}
              onChange={(e) => setAiModelsJson(e.target.value)}
              className="min-h-[180px] font-mono text-xs"
              disabled={!canManageProviders}
            />
          </div>
        </SectionCard>

        <SectionCard title="Políticas de Prompt" action={<Settings className="h-4 w-4 text-muted-foreground" />}>
          <div className="space-y-3">
            <Label>JSON de políticas globais e por uso</Label>
            <Textarea
              value={promptPoliciesJson}
              onChange={(e) => setPromptPoliciesJson(e.target.value)}
              className="min-h-[180px] font-mono text-xs"
            />
          </div>
        </SectionCard>

        <SectionCard title="Regras de Proposta" action={<Settings className="h-4 w-4 text-muted-foreground" />}>
          <div className="space-y-3">
            <Label>JSON de regras comerciais</Label>
            <Textarea
              value={proposalRulesJson}
              onChange={(e) => setProposalRulesJson(e.target.value)}
              className="min-h-[180px] font-mono text-xs"
            />
          </div>
        </SectionCard>

        <SectionCard title="Regras de PDF" action={<Settings className="h-4 w-4 text-muted-foreground" />}>
          <div className="space-y-3">
            <Label>JSON de regras documentais</Label>
            <Textarea
              value={pdfRulesJson}
              onChange={(e) => setPdfRulesJson(e.target.value)}
              className="min-h-[180px] font-mono text-xs"
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Regras de Add-ons"
          action={
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/addons")} className="gap-1.5">
              <Layers className="h-4 w-4" /> Gerenciar
            </Button>
          }
        >
          <div className="space-y-3">
            <Label>JSON de regras estruturais</Label>
            <Textarea
              value={addonRulesJson}
              onChange={(e) => setAddonRulesJson(e.target.value)}
              className="min-h-[180px] font-mono text-xs"
            />
          </div>
        </SectionCard>

        <SectionCard title="Regras de Portfólio" action={<Settings className="h-4 w-4 text-muted-foreground" />}>
          <div className="space-y-3">
            <Label>JSON de regras do domínio</Label>
            <Textarea
              value={portfolioRulesJson}
              onChange={(e) => setPortfolioRulesJson(e.target.value)}
              className="min-h-[180px] font-mono text-xs"
            />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
