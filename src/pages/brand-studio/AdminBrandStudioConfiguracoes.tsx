import { useEffect, useState } from "react";
import { Cog, ShieldCheck } from "lucide-react";
import BrandStudioRouteHeader from "@/components/brand-studio/BrandStudioRouteHeader";
import SectionCard from "@/components/admin/SectionCard";
import EmptyState from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import AccessDenied from "@/components/admin/AccessDenied";
import { useAccessControl } from "@/hooks/useAccessControl";
import { BRAND_STUDIO_BUCKETS, BRAND_STUDIO_ROLES } from "@/lib/brand-studio";
import { listBrandAgentConfigs } from "@/services/brand-agents";

export default function AdminBrandStudioConfiguracoes() {
  const { loading: accessLoading, canManageBrandAgents } = useAccessControl();
  const [loading, setLoading] = useState(true);
  const [agentCount, setAgentCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!canManageBrandAgents()) return;
      setLoading(true);
      try {
        const configs = await listBrandAgentConfigs();
        setAgentCount(configs.length);
      } finally {
        setLoading(false);
      }
    };
    if (accessLoading) return;
    load();
  }, [accessLoading, canManageBrandAgents]);

  if (!accessLoading && !canManageBrandAgents()) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <BrandStudioRouteHeader
        title="Configuracoes"
        description="Governanca de escopos, buckets e parametros operacionais do dominio"
        trail={[{ label: "Configuracoes" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Escopos de permissao">
          <div className="space-y-2">
            {BRAND_STUDIO_ROLES.map((role) => (
              <div key={role} className="rounded-lg border border-border/50 p-3 flex items-center justify-between">
                <span className="text-sm font-medium">{role}</span>
                <Badge variant="outline" className="text-[10px]">preparado</Badge>
              </div>
            ))}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Escopo dev_admin recebe permissao total no modulo brand_studio via migration.
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Buckets provisionados">
          <div className="space-y-2">
            {BRAND_STUDIO_BUCKETS.map((bucket) => (
              <div key={bucket} className="rounded-lg border border-border/50 p-3 flex items-center justify-between">
                <span className="text-sm font-medium">{bucket}</span>
                <Badge variant="outline" className="text-[10px]">ativo</Badge>
              </div>
            ))}
            <div className="rounded-lg border border-border/50 p-3 text-xs text-muted-foreground">
              Politicas de leitura e escrita atreladas aos papeis do dominio de branding.
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Camada de agentes">
        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando configuracoes de agentes...</div>
        ) : agentCount > 0 ? (
          <div className="rounded-lg border border-border/50 p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Agentes configurados</p>
              <p className="text-xs text-muted-foreground">Tabela brand_agent_configs em operacao</p>
            </div>
            <Badge className="text-[10px]">{agentCount} registro(s)</Badge>
          </div>
        ) : (
          <EmptyState
            compact
            icon={<Cog className="h-8 w-8 text-muted-foreground" />}
            title="Nenhum agente cadastrado"
            description="A base de configuracao ja esta ativa para receber o setup inicial."
          />
        )}
      </SectionCard>
    </div>
  );
}
