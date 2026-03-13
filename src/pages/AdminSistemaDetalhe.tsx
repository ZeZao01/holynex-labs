import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  getDeliveredSystem, saveDeliveredSystem, deleteDeliveredSystem,
  getSystemTags, getSystemEvents, addSystemEvent, setSystemTags,
  DeliveredSystem, SystemTag, SystemEvent,
  SUPPORT_STATUS_MAP, OPERATIONAL_STATUS_MAP, REUSE_MAP,
} from "@/lib/delivered-systems";
import SystemForm from "@/components/admin/SystemForm";
import {
  ArrowLeft, Edit, Copy, Recycle, Star, Archive, ExternalLink,
  Globe, Server, Github, FileText, Palette, BarChart3, Clock,
} from "lucide-react";
import FinancialSummary from "@/components/admin/FinancialSummary";
import { format } from "date-fns";

export default function AdminSistemaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [system, setSystem] = useState<DeliveredSystem | null>(null);
  const [tags, setTags] = useState<SystemTag[]>([]);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function load() {
    try {
      const s = await getDeliveredSystem(id!);
      if (!s) {
        toast({ title: "Sistema não encontrado", variant: "destructive" });
        navigate("/admin/sistemas");
        return;
      }
      const [t, e] = await Promise.all([
        getSystemTags(id!),
        getSystemEvents(id!),
      ]);
      setSystem(s);
      setTags(t);
      setEvents(e);
    } catch {
      toast({ title: "Erro ao carregar sistema", variant: "destructive" });
    }
  }

  async function handleSave(data: Partial<DeliveredSystem>, tagList: string[]) {
    setLoading(true);
    try {
      await saveDeliveredSystem({ ...data, id });
      await setSystemTags(id!, tagList.map((tag) => ({ tag, tipo: "tecnica" })));
      await addSystemEvent(id!, "sistema_atualizado", "Dados do sistema atualizados");
      toast({ title: "Sistema atualizado!" });
      setEditing(false);
      load();
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickAction(action: string) {
    if (!system) return;
    try {
      switch (action) {
        case "reutilizavel":
          await saveDeliveredSystem({ id, reutilizavel: !system.reutilizavel });
          await addSystemEvent(id!, system.reutilizavel ? "desmarcado_reutilizavel" : "marcado_reutilizavel");
          break;
        case "destaque":
          await saveDeliveredSystem({ id, destaque_interno: !system.destaque_interno });
          await addSystemEvent(id!, system.destaque_interno ? "desmarcado_destaque" : "marcado_destaque");
          break;
        case "arquivar":
          await saveDeliveredSystem({ id, ativo: false, status_operacional: "arquivado" });
          await addSystemEvent(id!, "arquivado");
          break;
        case "duplicar":
          const { id: _, criado_em, atualizado_em, ...rest } = system;
          const dup = await saveDeliveredSystem({ ...rest, nome: `${system.nome} (Cópia)` });
          await addSystemEvent(dup.id, "criado_manualmente", "Duplicado de " + system.nome);
          toast({ title: "Sistema duplicado!" });
          navigate(`/admin/sistemas/${dup.id}`);
          return;
      }
      toast({ title: "Ação realizada!" });
      load();
    } catch {
      toast({ title: "Erro na ação", variant: "destructive" });
    }
  }

  if (!system) return <div className="p-8 text-muted-foreground">Carregando...</div>;

  const support = SUPPORT_STATUS_MAP[system.status_suporte as keyof typeof SUPPORT_STATUS_MAP];
  const operation = OPERATIONAL_STATUS_MAP[system.status_operacional as keyof typeof OPERATIONAL_STATUS_MAP];
  const reuse = REUSE_MAP[system.potencial_reuso as keyof typeof REUSE_MAP];

  const links = [
    { label: "Live", url: system.live_url, icon: Globe },
    { label: "Admin", url: system.admin_url, icon: Server },
    { label: "Staging", url: system.staging_url, icon: Server },
    { label: "Repo", url: system.repo_url, icon: Github },
    { label: "Docs", url: system.docs_url, icon: FileText },
    { label: "Design", url: system.design_url, icon: Palette },
    { label: "Analytics", url: system.analytics_url, icon: BarChart3 },
  ].filter((l) => l.url);

  if (editing) {
    return (
      <div className="space-y-6">
        <PageHeader title="Editar Sistema" breadcrumbs={[{ label: "Sistemas Entregues", href: "/admin/sistemas" }, { label: "Editar" }]} />
        <div className="rounded-xl border border-border bg-card p-6">
          <SystemForm system={system} tags={tags.map((t) => t.tag)} onSave={handleSave} onCancel={() => setEditing(false)} loading={loading} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={system.nome}
        description={system.resumo_curto || "Sistema entregue"}
        breadcrumbs={[{ label: "Sistemas Entregues", href: "/admin/sistemas" }, { label: system.nome }]}
      />

      {/* Status badges */}
      <div className="flex flex-wrap gap-2">
        {support && <StatusBadge status={support.color} label={support.label} />}
        {operation && <StatusBadge status={operation.color} label={operation.label} />}
        {reuse && <StatusBadge status={reuse.color} label={`Reuso: ${reuse.label}`} />}
        {system.reutilizavel && <StatusBadge status="maintenance" label="Reutilizável" />}
        {system.destaque_interno && <StatusBadge status="hot" label="⭐ Destaque" />}
        {!system.ativo && <StatusBadge status="cancelled" label="Inativo" />}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Edit className="h-4 w-4 mr-1" /> Editar</Button>
        <Button size="sm" variant="outline" onClick={() => handleQuickAction("duplicar")}><Copy className="h-4 w-4 mr-1" /> Duplicar</Button>
        <Button size="sm" variant="outline" onClick={() => handleQuickAction("reutilizavel")}><Recycle className="h-4 w-4 mr-1" /> {system.reutilizavel ? "Desmarcar" : "Marcar"} Reutilizável</Button>
        <Button size="sm" variant="outline" onClick={() => handleQuickAction("destaque")}><Star className="h-4 w-4 mr-1" /> {system.destaque_interno ? "Remover" : "Marcar"} Destaque</Button>
        <Button size="sm" variant="outline" onClick={() => handleQuickAction("arquivar")}><Archive className="h-4 w-4 mr-1" /> Arquivar</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold">Informações Gerais</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Cliente:</span> {system.cliente}</div>
              <div><span className="text-muted-foreground">Empresa:</span> {system.empresa_cliente || "—"}</div>
              <div><span className="text-muted-foreground">Nicho:</span> {system.nicho || "—"}</div>
              <div><span className="text-muted-foreground">Tipo:</span> {system.tipo_projeto || "—"}</div>
              <div><span className="text-muted-foreground">Categoria:</span> {system.categoria || "—"}</div>
              <div><span className="text-muted-foreground">Faixa Contratada:</span> {system.faixa_contratada || "—"}</div>
              <div><span className="text-muted-foreground">Valor:</span> R$ {system.valor_fechado?.toLocaleString("pt-BR")}</div>
              <div><span className="text-muted-foreground">Recorrência:</span> R$ {system.recorrencia_mensal?.toLocaleString("pt-BR")}/mês</div>
              <div><span className="text-muted-foreground">Entrega:</span> {system.data_entrega ? format(new Date(system.data_entrega), "dd/MM/yyyy") : "—"}</div>
              <div><span className="text-muted-foreground">Versão:</span> {system.versao_atual}</div>
            </div>
            {system.descricao_interna && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-1">Descrição Interna</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{system.descricao_interna}</p>
                </div>
              </>
            )}
          </div>

          {/* Technical */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold">Detalhes Técnicos</h3>
            {links.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {links.map((l) => (
                  <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1 text-xs">
                      <l.icon className="h-3 w-3" /> {l.label} <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Stack:</span> {(system.stack_principal || []).join(", ") || "—"}</div>
              <div><span className="text-muted-foreground">Banco:</span> {system.banco_dados || "—"}</div>
              <div className="col-span-2"><span className="text-muted-foreground">Integrações:</span> {(system.integracoes || []).join(", ") || "—"}</div>
            </div>
            {system.observacoes_tecnicas && (
              <div>
                <h4 className="text-sm font-medium mb-1">Observações Técnicas</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{system.observacoes_tecnicas}</p>
              </div>
            )}
            {system.observacoes_comerciais && (
              <div>
                <h4 className="text-sm font-medium mb-1">Observações Comerciais</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{system.observacoes_comerciais}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => <Badge key={t.id} variant="secondary">{t.tag}</Badge>)}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: History */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-3">Histórico</h3>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 20).map((e) => (
                  <div key={e.id} className="flex gap-2 text-xs">
                    <Clock className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <span className="font-medium">{e.evento.replace(/_/g, " ")}</span>
                      {e.descricao && <span className="text-muted-foreground"> — {e.descricao}</span>}
                      <div className="text-muted-foreground">{format(new Date(e.criado_em), "dd/MM/yyyy HH:mm")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
