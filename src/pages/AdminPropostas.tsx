import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { getPropostas, removerProposta, type Proposta } from "@/lib/propostas";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Eye, FileText, TrendingUp, DollarSign, BarChart3, LogOut, ArrowLeft } from "lucide-react";
import RevealBox from "@/components/RevealBox";

const complexidadeColors: Record<string, string> = {
  baixa: "text-emerald-400",
  media: "text-yellow-400",
  alta: "text-orange-400",
  avancada: "text-red-400",
};

const statusBadge: Record<string, string> = {
  rascunho: "bg-muted/50 text-muted-foreground border-border/50",
  gerada: "bg-primary/20 text-primary border-primary/30",
  enviada: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  aceita: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  recusada: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function AdminPropostas() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/admin/login");
      return;
    }
    if (user) refresh();
  }, [user, authLoading]);

  const refresh = async () => {
    try {
      const data = await getPropostas();
      setPropostas(data);
    } catch {} finally {
      setLoadingData(false);
    }
  };

  const handleRemove = async (id: string) => {
    await removerProposta(id);
    refresh();
  };

  const stats = useMemo(() => {
    const total = propostas.length;
    const totalValor = propostas.reduce((s, p) => s + p.valor_ideal, 0);
    const aceitas = propostas.filter((p) => p.status === "aceita").length;
    const pipeline = propostas.filter((p) => ["gerada", "enviada"].includes(p.status)).reduce((s, p) => s + p.valor_ideal, 0);
    return { total, totalValor, aceitas, pipeline };
  }, [propostas]);

  if (authLoading || !user) {
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
            Propostas <span className="text-gradient-animated">Comerciais</span>
          </h1>
          <p className="text-muted-foreground">Dashboard de propostas geradas pelo Motor IA.</p>
        </RevealBox>

        <div className="flex justify-center gap-3 mb-8">
          <button onClick={() => navigate("/admin/propostas/nova")} className="btn-glow inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-foreground">
            <Plus className="h-3.5 w-3.5" /> Nova Proposta
          </button>
          <button onClick={() => navigate("/admin/orcamentos")} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border border-border/50 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Orçamentos
          </button>
          <button onClick={signOut} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border border-border/50 text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="h-3.5 w-3.5" /> Sair
          </button>
        </div>

        {/* Stats */}
        <RevealBox delay={0.1} className="max-w-4xl mx-auto mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={FileText} label="Total Propostas" value={stats.total.toString()} color="text-primary" />
            <StatCard icon={DollarSign} label="Valor Total" value={`R$ ${stats.totalValor.toLocaleString("pt-BR")}`} color="text-emerald-400" />
            <StatCard icon={TrendingUp} label="Aceitas" value={stats.aceitas.toString()} color="text-blue-400" />
            <StatCard icon={BarChart3} label="Pipeline" value={`R$ ${stats.pipeline.toLocaleString("pt-BR")}`} color="text-yellow-400" />
          </div>
        </RevealBox>

        {/* List */}
        <RevealBox delay={0.2} className="max-w-4xl mx-auto">
          {loadingData ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : propostas.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-4">Nenhuma proposta gerada ainda.</p>
              <button onClick={() => navigate("/admin/propostas/nova")} className="btn-glow inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-foreground">
                <Plus className="h-4 w-4" /> Criar Primeira Proposta
              </button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {propostas.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass rounded-2xl p-6 card-animated"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-display font-semibold text-lg truncate">{p.nome_cliente}</h3>
                          <Badge className={`${statusBadge[p.status] || statusBadge.rascunho} border text-xs capitalize`}>
                            {p.status}
                          </Badge>
                          <span className={`text-xs font-medium capitalize ${complexidadeColors[p.complexidade] || "text-muted-foreground"}`}>
                            {p.complexidade}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                          {p.empresa_cliente && <span>{p.empresa_cliente}</span>}
                          <span>{p.tipo_projeto}</span>
                          <span>{new Date(p.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="text-yellow-400">Min: R$ {p.valor_minimo.toLocaleString("pt-BR")}</span>
                          <span className="text-primary font-medium">Ideal: R$ {p.valor_ideal.toLocaleString("pt-BR")}</span>
                          <span className="text-emerald-400">Premium: R$ {p.valor_premium.toLocaleString("pt-BR")}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => navigate(`/admin/propostas/${p.id}`)} className="btn-glow inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-foreground">
                          <Eye className="h-3.5 w-3.5" /> Ver
                        </button>
                        <button onClick={() => handleRemove(p.id)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" /> Remover
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </RevealBox>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="glass rounded-xl p-4 text-center">
      <Icon className={`h-5 w-5 mx-auto mb-2 ${color}`} />
      <div className={`font-display text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
