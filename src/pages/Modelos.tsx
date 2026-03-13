import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RevealBox from "@/components/RevealBox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Search, Sparkles, Clock, CheckCircle, Layers } from "lucide-react";
import { ProjectModel, listModels, MODEL_CATEGORIES, AVAILABILITY_STATUSES, MODEL_BADGES } from "@/lib/project-models";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Modelos() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [models, setModels] = useState<ProjectModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("todos");
  const [filterNiche, setFilterNiche] = useState("todos");

  useEffect(() => {
    listModels(true).then(data => { setModels(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const categories = [...new Set(models.map(m => m.category).filter(Boolean))];
  const niches = [...new Set(models.map(m => m.niche).filter(Boolean))];

  const filtered = models.filter(m => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.niche.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory !== "todos" && m.category !== filterCategory) return false;
    if (filterNiche !== "todos" && m.niche !== filterNiche) return false;
    return true;
  });

  const featured = models.filter(m => m.is_featured);

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-16 relative z-10">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <RevealBox className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">Projetos Modelo</span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mt-3 mb-4">
            Soluções <span className="text-primary">prontas para adaptar</span> ao seu negócio
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Escolha um modelo, personalize para o seu cenário e comece com uma base sólida. Mais rápido, mais acessível, sem começar do zero.
          </p>
        </RevealBox>

        {/* How it works */}
        <RevealBox className="mb-12">
          <div className="grid sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: "1", title: "Escolha o modelo", desc: "Navegue pela biblioteca e encontre a solução ideal" },
              { icon: "2", title: "Personalize", desc: "Adaptamos ao seu cenário, marca e regras de negócio" },
              { icon: "3", title: "Comece enxuto", desc: "Lance a versão inicial e valide com seus clientes" },
              { icon: "4", title: "Escale depois", desc: "Adicione módulos e funcionalidades conforme cresce" },
            ].map((step, i) => (
              <RevealBox key={i} delay={i * 0.1} className="text-center p-4">
                <div className="w-10 h-10 rounded-full bg-primary/15 text-primary font-display font-bold text-lg flex items-center justify-center mx-auto mb-3">{step.icon}</div>
                <h3 className="font-display font-semibold text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </RevealBox>
            ))}
          </div>
        </RevealBox>

        {/* Filters */}
        <RevealBox className="flex flex-wrap gap-3 justify-center mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar modelo..." className="pl-9 w-64 h-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {categories.length > 0 && (
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Categorias</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {niches.length > 0 && (
            <Select value={filterNiche} onValueChange={setFilterNiche}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Nicho" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Nichos</SelectItem>
                {niches.map(n => <SelectItem key={n} value={n!}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </RevealBox>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Carregando modelos...</div>
        ) : filtered.length === 0 ? (
          <RevealBox className="text-center py-20">
            <p className="text-muted-foreground">Nenhum modelo encontrado. Ajuste os filtros ou volte em breve!</p>
          </RevealBox>
        ) : (
          <>
            {/* Featured */}
            {search === "" && filterCategory === "todos" && filterNiche === "todos" && featured.length > 0 && (
              <RevealBox className="mb-12">
                <h2 className="font-display text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Em Destaque
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {featured.map((m, i) => (
                    <RevealBox key={m.id} delay={i * 0.08}>
                      <ModelCard model={m} />
                    </RevealBox>
                  ))}
                </div>
              </RevealBox>
            )}

            {/* All models */}
            <RevealBox>
              {featured.length > 0 && search === "" && <h2 className="font-display text-xl sm:text-2xl font-bold mb-6">Todos os Modelos</h2>}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filtered.map((m, i) => (
                  <RevealBox key={m.id} delay={i * 0.06}>
                    <ModelCard model={m} />
                  </RevealBox>
                ))}
              </div>
            </RevealBox>
          </>
        )}

        {/* CTA */}
        <RevealBox delay={0.3} className="mt-16">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-8 sm:p-12 text-center space-y-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Precisa de algo totalmente personalizado?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Criamos soluções 100% sob medida para o seu negócio. Conte-nos o que precisa.</p>
            <Button size="lg" className="mt-2" onClick={() => navigate("/contato")}>
              Solicitar Orçamento Personalizado
            </Button>
          </div>
        </RevealBox>
      </div>
    </div>
  );
}

// ── Model Card ──
function ModelCard({ model }: { model: ProjectModel }) {
  const navigate = useNavigate();
  const availLabel = AVAILABILITY_STATUSES.find(s => s.value === model.availability_status)?.label;

  return (
    <div
      className="group relative rounded-2xl border border-border bg-card overflow-hidden cursor-pointer transition-all duration-500 hover:border-primary/40 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)] hover:-translate-y-1"
      onClick={() => navigate(`/modelos/${model.slug || model.id}`)}
    >
      {/* Thumbnail */}
      <div className="relative h-44 sm:h-52 overflow-hidden bg-muted">
        {model.thumbnail_url ? (
          <img src={model.thumbnail_url} alt={model.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="font-display text-5xl font-bold text-primary/20 group-hover:text-primary/40 group-hover:scale-125 transition-all duration-500">
              {model.title.charAt(0)}
            </span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Badges */}
        {(model.badges || []).length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {(model.badges || []).slice(0, 2).map(b => (
              <Badge key={b} className="bg-primary/90 text-primary-foreground text-[10px] backdrop-blur-sm border-0">
                <Sparkles className="h-2.5 w-2.5 mr-1" />{b}
              </Badge>
            ))}
          </div>
        )}

        {/* Hover content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
          {model.target_audience && <p className="text-xs text-foreground/80 mb-2 line-clamp-2">Para: {model.target_audience}</p>}
          <div className="flex gap-2">
            <Button size="sm" className="text-xs gap-1">Ver Detalhes <ArrowRight className="h-3 w-3" /></Button>
            <Button size="sm" variant="outline" className="text-xs bg-background/60 backdrop-blur-sm" onClick={e => { e.stopPropagation(); navigate(`/contato?modelo=${model.slug || model.id}`); }}>
              Quero esse
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {model.category && <span className="text-[11px] text-primary font-medium uppercase tracking-widest">{model.category}</span>}
          {model.niche && <Badge variant="secondary" className="text-[10px]">{model.niche}</Badge>}
        </div>
        <h3 className="font-display text-base sm:text-lg font-semibold mb-1 group-hover:text-primary transition-colors">{model.title}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">{model.value_proposition || model.subtitle}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {model.investment_range && <span className="font-medium text-primary">{model.investment_range}</span>}
            {model.base_deadline && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{model.base_deadline}</span>}
          </div>
          {availLabel && <Badge variant="outline" className="text-[10px]">{availLabel}</Badge>}
        </div>

        {/* Mobile CTA */}
        <div className="mt-3 flex gap-2 sm:hidden">
          <Button size="sm" className="text-xs flex-1 gap-1">Ver Detalhes <ArrowRight className="h-3 w-3" /></Button>
        </div>
      </div>
    </div>
  );
}
