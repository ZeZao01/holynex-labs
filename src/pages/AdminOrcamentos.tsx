import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getOrcamentos, atualizarStatus, removerOrcamento, type Orcamento, type OrcamentoStatus } from "@/lib/orcamentos";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, CheckCircle2, XCircle, Trash2, ArrowUpCircle, ArrowDownCircle, MinusCircle, Mail, Building2, FileText, Sparkles, LogOut, Loader2, FileBarChart } from "lucide-react";
import RevealBox from "@/components/RevealBox";

const statusConfig: Record<OrcamentoStatus, { label: string; icon: typeof Clock; color: string; badgeClass: string }> = {
  pendente: { label: "Pendente", icon: Clock, color: "text-yellow-400", badgeClass: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  recebido: { label: "Recebido", icon: CheckCircle2, color: "text-emerald-400", badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  rejeitado: { label: "Rejeitado", icon: XCircle, color: "text-red-400", badgeClass: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const prioridadeConfig = {
  alta: { label: "Alta", icon: ArrowUpCircle, color: "text-red-400" },
  media: { label: "Média", icon: MinusCircle, color: "text-yellow-400" },
  baixa: { label: "Baixa", icon: ArrowDownCircle, color: "text-emerald-400" },
};

export default function AdminOrcamentos() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [tab, setTab] = useState("todos");
  const [loadingData, setLoadingData] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getOrcamentos();
      setOrcamentos(data);
    } catch {
      // silently fail
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/admin/login");
      return;
    }
    if (user) {
      refresh();
      const interval = setInterval(refresh, 5000);
      return () => clearInterval(interval);
    }
  }, [user, authLoading, navigate, refresh]);

  const filtered = useMemo(() => {
    if (tab === "todos") return orcamentos;
    return orcamentos.filter((o) => o.status === tab);
  }, [orcamentos, tab]);

  const counts = useMemo(() => ({
    todos: orcamentos.length,
    pendente: orcamentos.filter((o) => o.status === "pendente").length,
    recebido: orcamentos.filter((o) => o.status === "recebido").length,
    rejeitado: orcamentos.filter((o) => o.status === "rejeitado").length,
  }), [orcamentos]);

  const handleStatus = async (id: string, status: OrcamentoStatus) => {
    await atualizarStatus(id, status);
    refresh();
  };

  const handleRemove = async (id: string) => {
    await removerOrcamento(id);
    refresh();
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-16 relative z-10">
      <div className="container mx-auto px-4">
        <RevealBox className="text-center max-w-2xl mx-auto mb-6">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">Painel Interno</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">
            Gestão de <span className="text-gradient-animated">Orçamentos</span>
          </h1>
          <p className="text-muted-foreground">Acompanhe e gerencie todos os pedidos de orçamento.</p>
        </RevealBox>

        <div className="flex justify-center mb-8">
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>

        {/* Stats */}
        <RevealBox delay={0.1} className="max-w-4xl mx-auto mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([
              { key: "todos", label: "Total", color: "text-primary" },
              { key: "pendente", label: "Pendentes", color: "text-yellow-400" },
              { key: "recebido", label: "Recebidos", color: "text-emerald-400" },
              { key: "rejeitado", label: "Rejeitados", color: "text-red-400" },
            ] as const).map((s) => (
              <div key={s.key} className="glass rounded-xl p-4 text-center">
                <div className={`font-display text-3xl font-bold ${s.color}`}>{counts[s.key]}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </RevealBox>

        {/* Tabs */}
        <RevealBox delay={0.2} className="max-w-4xl mx-auto">
          {loadingData ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full bg-muted/50 rounded-xl mb-6">
                <TabsTrigger value="todos" className="flex-1 rounded-lg">Todos ({counts.todos})</TabsTrigger>
                <TabsTrigger value="pendente" className="flex-1 rounded-lg">Pendentes ({counts.pendente})</TabsTrigger>
                <TabsTrigger value="recebido" className="flex-1 rounded-lg">Recebidos ({counts.recebido})</TabsTrigger>
                <TabsTrigger value="rejeitado" className="flex-1 rounded-lg">Rejeitados ({counts.rejeitado})</TabsTrigger>
              </TabsList>

              {["todos", "pendente", "recebido", "rejeitado"].map((t) => (
                <TabsContent key={t} value={t}>
                  <AnimatePresence mode="popLayout">
                    {filtered.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass rounded-2xl p-12 text-center"
                      >
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">Nenhum orçamento encontrado.</p>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        {filtered.map((orc) => (
                          <OrcamentoCard
                            key={orc.id}
                            orcamento={orc}
                            onStatusChange={handleStatus}
                            onRemove={handleRemove}
                          />
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </RevealBox>
      </div>
    </div>
  );
}

function OrcamentoCard({
  orcamento: orc,
  onStatusChange,
  onRemove,
}: {
  orcamento: Orcamento;
  onStatusChange: (id: string, status: OrcamentoStatus) => void;
  onRemove: (id: string) => void;
}) {
  const sc = statusConfig[orc.status];
  const StatusIcon = sc.icon;
  const pc = orc.prioridade ? prioridadeConfig[orc.prioridade] : null;
  const PrioIcon = pc?.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card-animated glass rounded-2xl p-6"
    >
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h3 className="font-display font-semibold text-lg truncate">{orc.nome}</h3>
            <Badge className={`${sc.badgeClass} border text-xs`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {sc.label}
            </Badge>
            {pc && PrioIcon && (
              <span className={`inline-flex items-center gap-1 text-xs ${pc.color}`}>
                <PrioIcon className="h-3.5 w-3.5" />
                {pc.label}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {orc.email}
            </span>
            {orc.empresa && (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> {orc.empresa}
              </span>
            )}
            <span className="text-xs">
              {new Date(orc.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          {orc.resumoIA && (
            <div className="flex items-start gap-2 bg-primary/5 border border-primary/10 rounded-lg p-3 mb-3">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground/80">{orc.resumoIA}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground leading-relaxed">{orc.descricao}</p>
        </div>
        <div className="flex md:flex-col gap-2 flex-shrink-0">
          {orc.status !== "recebido" && (
            <button onClick={() => onStatusChange(orc.id, "recebido")} className="btn-glow inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" /> Aceitar
            </button>
          )}
          {orc.status !== "rejeitado" && (
            <button onClick={() => onStatusChange(orc.id, "rejeitado")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
              <XCircle className="h-3.5 w-3.5" /> Rejeitar
            </button>
          )}
          {orc.status !== "pendente" && (
            <button onClick={() => onStatusChange(orc.id, "pendente")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition-colors">
              <Clock className="h-3.5 w-3.5" /> Pendente
            </button>
          )}
          <button onClick={() => onRemove(orc.id)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Remover
          </button>
        </div>
      </div>
    </motion.div>
  );
}
