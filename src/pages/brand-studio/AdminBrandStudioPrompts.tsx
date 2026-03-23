import { useEffect, useMemo, useState } from "react";
import { BrainCircuit } from "lucide-react";
import BrandStudioRouteHeader from "@/components/brand-studio/BrandStudioRouteHeader";
import SectionCard from "@/components/admin/SectionCard";
import BaseTable from "@/components/admin/BaseTable";
import EmptyState from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { listBrandAgentConfigs, listBrandAiRuns } from "@/services/brand-agents";
import type { BrandAgentConfig, BrandAiRun } from "@/types/brand-studio";

const fmtDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function AdminBrandStudioPrompts() {
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<BrandAgentConfig[]>([]);
  const [runs, setRuns] = useState<BrandAiRun[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [configData, runData] = await Promise.all([listBrandAgentConfigs(), listBrandAiRuns(30)]);
        setConfigs(configData);
        setRuns(runData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const configColumns = useMemo(
    () => [
      {
        key: "agent",
        header: "Agente",
        render: (config: BrandAgentConfig) => (
          <div className="space-y-1">
            <div className="font-medium text-sm">{config.agent_key}</div>
            <div className="text-xs text-muted-foreground">{config.provider} · {config.model}</div>
          </div>
        ),
      },
      {
        key: "params",
        header: "Parametros",
        className: "w-[220px]",
        render: (config: BrandAgentConfig) => (
          <span className="text-xs text-muted-foreground">temp: {config.temperature ?? "-"} · max: {config.max_tokens ?? "-"}</span>
        ),
      },
      {
        key: "active",
        header: "Ativo",
        className: "w-[120px]",
        render: (config: BrandAgentConfig) => (
          <Badge variant={config.is_active ? "default" : "secondary"} className="text-[10px]">
            {config.is_active ? "Ativo" : "Inativo"}
          </Badge>
        ),
      },
    ],
    [],
  );

  const runColumns = useMemo(
    () => [
      {
        key: "status",
        header: "Status",
        className: "w-[160px]",
        render: (run: BrandAiRun) => <Badge variant="outline" className="text-[10px]">{run.status}</Badge>,
      },
      {
        key: "provider",
        header: "Motor IA",
        render: (run: BrandAiRun) => (
          <div className="text-xs text-muted-foreground">{run.provider_used || "-"} · {run.model_used || "-"}</div>
        ),
      },
      {
        key: "duration",
        header: "Duracao",
        className: "w-[120px]",
        render: (run: BrandAiRun) => <span className="text-xs">{run.duration_ms ? `${run.duration_ms}ms` : "-"}</span>,
      },
      {
        key: "created",
        header: "Criado",
        className: "w-[170px]",
        render: (run: BrandAiRun) => <span className="text-xs text-muted-foreground">{fmtDate(run.criado_em)}</span>,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <BrandStudioRouteHeader
        title="Prompts e Agentes"
        description="Configuracao operacional da camada de IA do Brand Studio"
        trail={[{ label: "Prompts" }]}
      />

      <SectionCard title="Configuracoes de agentes">
        <BaseTable columns={configColumns} data={configs} keyExtractor={(item) => item.id} loading={loading} loadingRows={4} />
        {!loading && configs.length === 0 && (
          <EmptyState
            compact
            icon={<BrainCircuit className="h-8 w-8 text-muted-foreground" />}
            title="Nenhum agente configurado"
            description="A tabela brand_agent_configs foi provisionada para controle de prompts e modelos."
          />
        )}
      </SectionCard>

      <SectionCard title="Execucoes recentes de IA">
        <BaseTable columns={runColumns} data={runs} keyExtractor={(item) => item.id} loading={loading} loadingRows={6} />
      </SectionCard>
    </div>
  );
}
