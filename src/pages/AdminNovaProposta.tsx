import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, ArrowLeft, Zap } from "lucide-react";
import RevealBox from "@/components/RevealBox";
import { gerarPropostaIA, salvarProposta, type PropostaInput, type PropostaJSON } from "@/lib/propostas";
import { getOrcamentos } from "@/lib/orcamentos";
import { supabase } from "@/integrations/supabase/client";

const tiposProjeto = [
  "Landing Page", "Site institucional", "Sistema interno", "Sistema administrativo",
  "CRM", "ERP", "Dashboard", "Plataforma SaaS", "Micro-SaaS", "Marketplace",
  "Automação empresarial", "Plataforma com IA", "Sistema operacional", "Outro",
];

export default function AdminNovaProposta() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orcamentoId = searchParams.get("orcamento");

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filling, setFilling] = useState(false);
  const [quickDesc, setQuickDesc] = useState("");
  const [result, setResult] = useState<PropostaJSON | null>(null);
  const [formData, setFormData] = useState<PropostaInput>({
    nome_cliente: "", empresa_cliente: "", segmento: "", email_cliente: "",
    tipo_projeto: "Sistema interno", descricao_projeto: "", problema_cliente: "",
    objetivo_cliente: "", funcionalidades_desejadas: [], integracoes: [],
    numero_usuarios: "", prazo_desejado: "", orcamento_cliente: "",
    nivel_urgencia: "medio", link_referencia: "", observacoes: "",
    orcamento_id: orcamentoId || undefined,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/admin/login");
      return;
    }
    if (orcamentoId && user) {
      loadOrcamento(orcamentoId);
    }
  }, [user, authLoading, orcamentoId]);

  const loadOrcamento = async (id: string) => {
    try {
      const orcamentos = await getOrcamentos();
      const orc = orcamentos.find((o) => o.id === id);
      if (orc) {
        setFormData((prev) => ({
          ...prev,
          nome_cliente: orc.nome,
          email_cliente: orc.email,
          empresa_cliente: orc.empresa,
          descricao_projeto: orc.descricao,
          orcamento_id: orc.id,
        }));
      }
    } catch {}
  };

  const handleQuickFill = async () => {
    if (!quickDesc.trim()) {
      toast.error("Digite uma descrição rápida do projeto.");
      return;
    }
    setFilling(true);
    try {
      const { data, error } = await supabase.functions.invoke("preencher-formulario", {
        body: { descricao_rapida: quickDesc },
      });
      if (error) throw new Error(error.message || "Erro ao preencher");
      if (data?.error) throw new Error(data.error);
      const campos = data.campos;
      setFormData((prev) => ({
        ...prev,
        nome_cliente: campos.nome_cliente || prev.nome_cliente,
        empresa_cliente: campos.empresa_cliente || prev.empresa_cliente,
        segmento: campos.segmento || prev.segmento,
        email_cliente: campos.email_cliente || prev.email_cliente,
        tipo_projeto: campos.tipo_projeto || prev.tipo_projeto,
        descricao_projeto: campos.descricao_projeto || prev.descricao_projeto,
        problema_cliente: campos.problema_cliente || prev.problema_cliente,
        objetivo_cliente: campos.objetivo_cliente || prev.objetivo_cliente,
        funcionalidades_desejadas: campos.funcionalidades_desejadas?.length ? campos.funcionalidades_desejadas : prev.funcionalidades_desejadas,
        integracoes: campos.integracoes?.length ? campos.integracoes : prev.integracoes,
        numero_usuarios: campos.numero_usuarios || prev.numero_usuarios,
        prazo_desejado: campos.prazo_desejado || prev.prazo_desejado,
        orcamento_cliente: campos.orcamento_cliente || prev.orcamento_cliente,
        nivel_urgencia: campos.nivel_urgencia || prev.nivel_urgencia,
        link_referencia: campos.link_referencia || prev.link_referencia,
        observacoes: campos.observacoes || prev.observacoes,
      }));
      toast.success("Campos preenchidos pela IA!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao preencher campos");
    } finally {
      setFilling(false);
    }
  };

  const handleChange = (field: keyof PropostaInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.nome_cliente || !formData.descricao_projeto) {
      toast.error("Preencha pelo menos o nome do cliente e a descrição do projeto.");
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const proposta = await gerarPropostaIA(formData);
      setResult(proposta);
      toast.success("Proposta gerada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar proposta");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setLoading(true);
    try {
      const id = await salvarProposta(formData, result);
      toast.success("Proposta salva!");
      navigate(`/admin/propostas/${id}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar proposta");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-16 relative z-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <button onClick={() => navigate("/admin/propostas")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar ao dashboard
        </button>

        <RevealBox className="text-center mb-10">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">Motor IA</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-3 mb-2">
            Nova <span className="text-gradient-animated">Proposta</span>
          </h1>
          <p className="text-muted-foreground text-sm">Preencha os dados e a IA gerará a proposta comercial completa.</p>
        </RevealBox>

        {/* Form */}
        <RevealBox delay={0.1} className="glass rounded-2xl p-6 sm:p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nome do Cliente *</label>
              <Input value={formData.nome_cliente} onChange={(e) => handleChange("nome_cliente", e.target.value)} placeholder="Nome completo" className="bg-muted/50 border-border/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input value={formData.email_cliente} onChange={(e) => handleChange("email_cliente", e.target.value)} placeholder="email@empresa.com" className="bg-muted/50 border-border/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Empresa</label>
              <Input value={formData.empresa_cliente} onChange={(e) => handleChange("empresa_cliente", e.target.value)} placeholder="Nome da empresa" className="bg-muted/50 border-border/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Segmento</label>
              <Input value={formData.segmento} onChange={(e) => handleChange("segmento", e.target.value)} placeholder="Ex: Saúde, Educação, Varejo" className="bg-muted/50 border-border/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tipo de Projeto</label>
              <select
                value={formData.tipo_projeto}
                onChange={(e) => handleChange("tipo_projeto", e.target.value)}
                className="w-full rounded-md border border-border/50 bg-muted/50 px-3 py-2 text-sm"
              >
                {tiposProjeto.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nível de Urgência</label>
              <select
                value={formData.nivel_urgencia}
                onChange={(e) => handleChange("nivel_urgencia", e.target.value)}
                className="w-full rounded-md border border-border/50 bg-muted/50 px-3 py-2 text-sm"
              >
                <option value="baixo">Baixo</option>
                <option value="medio">Médio</option>
                <option value="alto">Alto</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nº de Usuários</label>
              <Input value={formData.numero_usuarios} onChange={(e) => handleChange("numero_usuarios", e.target.value)} placeholder="Ex: 50, 100-500" className="bg-muted/50 border-border/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Prazo Desejado</label>
              <Input value={formData.prazo_desejado} onChange={(e) => handleChange("prazo_desejado", e.target.value)} placeholder="Ex: 3 meses" className="bg-muted/50 border-border/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Orçamento do Cliente</label>
              <Input value={formData.orcamento_cliente} onChange={(e) => handleChange("orcamento_cliente", e.target.value)} placeholder="Ex: R$ 50.000" className="bg-muted/50 border-border/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Link de Referência</label>
              <Input value={formData.link_referencia} onChange={(e) => handleChange("link_referencia", e.target.value)} placeholder="URL de projeto similar" className="bg-muted/50 border-border/50" />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium mb-1.5 block">Descrição do Projeto *</label>
            <Textarea value={formData.descricao_projeto} onChange={(e) => handleChange("descricao_projeto", e.target.value)} placeholder="Descreva o projeto em detalhes..." rows={4} className="bg-muted/50 border-border/50" />
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium mb-1.5 block">Problema do Cliente</label>
            <Textarea value={formData.problema_cliente} onChange={(e) => handleChange("problema_cliente", e.target.value)} placeholder="Qual problema o cliente enfrenta?" rows={3} className="bg-muted/50 border-border/50" />
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium mb-1.5 block">Objetivo do Cliente</label>
            <Textarea value={formData.objetivo_cliente} onChange={(e) => handleChange("objetivo_cliente", e.target.value)} placeholder="O que o cliente espera alcançar?" rows={3} className="bg-muted/50 border-border/50" />
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium mb-1.5 block">Observações</label>
            <Textarea value={formData.observacoes} onChange={(e) => handleChange("observacoes", e.target.value)} placeholder="Informações adicionais..." rows={2} className="bg-muted/50 border-border/50" />
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-glow inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold text-foreground disabled:opacity-50"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Gerando proposta com IA..." : "Gerar Proposta com IA"}
            </button>
          </div>
        </RevealBox>

        {/* Result Preview */}
        {result && (
          <RevealBox delay={0.2} className="glass rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Proposta Gerada</h2>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <div className="text-xs text-muted-foreground mb-1">Mínimo</div>
                <div className="font-display text-lg font-bold text-yellow-400">
                  R$ {result.financeiro.valor_minimo.toLocaleString("pt-BR")}
                </div>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                <div className="text-xs text-muted-foreground mb-1">Ideal</div>
                <div className="font-display text-lg font-bold text-primary">
                  R$ {result.financeiro.valor_ideal.toLocaleString("pt-BR")}
                </div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <div className="text-xs text-muted-foreground mb-1">Premium</div>
                <div className="font-display text-lg font-bold text-emerald-400">
                  R$ {result.financeiro.valor_premium.toLocaleString("pt-BR")}
                </div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <div className="text-xs text-muted-foreground mb-1">Complexidade</div>
                <div className="font-display text-lg font-bold capitalize">{result.complexidade}</div>
              </div>
            </div>

            {/* Sections */}
            <PropostaSection title="Resumo Executivo" content={result.resumo_executivo} />
            <PropostaSection title="Diagnóstico" content={result.diagnostico} />
            <PropostaSection title="Solução Proposta" content={result.solucao_proposta} />
            <PropostaListSection title="Escopo" items={result.escopo} />
            <PropostaListSection title="Funcionalidades" items={result.funcionalidades} />
            <PropostaListSection title="Funcionalidades Recomendadas" items={result.funcionalidades_recomendadas} />
            <PropostaSection title="Análise Estratégica" content={result.analise_estrategica} />
            <PropostaSection title="Estimativa de Esforço" content={result.estimativa_esforco} />
            <PropostaSection title="Cronograma" content={result.cronograma} />
            <PropostaSection title="Manutenção" content={result.manutencao} />
            <PropostaListSection title="Riscos" items={result.riscos} />
            <PropostaListSection title="Próximos Passos" items={result.proximos_passos} />

            <div className="flex gap-3 justify-center pt-4">
              <button onClick={handleSave} disabled={loading} className="btn-glow inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold text-foreground disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Salvar Proposta
              </button>
              <button onClick={handleGenerate} disabled={generating} className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium border border-border/50 text-muted-foreground hover:text-foreground transition-colors">
                <Sparkles className="h-4 w-4" /> Regenerar
              </button>
            </div>
          </RevealBox>
        )}
      </div>
    </div>
  );
}

function PropostaSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h3 className="font-display font-semibold text-sm text-primary mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{content}</p>
    </div>
  );
}

function PropostaListSection({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="font-display font-semibold text-sm text-primary mb-2">{title}</h3>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="text-primary mt-1.5 flex-shrink-0 w-1 h-1 rounded-full bg-primary" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
