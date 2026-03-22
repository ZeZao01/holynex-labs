import { useState, useEffect } from "react";
import RevealBox from "@/components/RevealBox";
import PortfolioCard from "@/components/PortfolioCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageContext";
import { PortfolioItem, listPortfolioItems, HIGHLIGHT_SECTIONS } from "@/lib/portfolio-items";

export default function Portfolio() {
  const { t } = useLanguage();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [nicheFilter, setNicheFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    listPortfolioItems(true)
      .then((data) => { setItems(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))].sort();
  const niches = [...new Set(items.map((i) => i.niche).filter(Boolean))].sort();

  const searchValue = search.trim().toLowerCase();
  const filteredItems = items.filter((i) => {
    const matchCategory = categoryFilter === "todos" || i.category === categoryFilter;
    const matchNiche = nicheFilter === "todos" || i.niche === nicheFilter;
    const haystack = [
      i.title,
      i.short_description,
      i.full_description,
      i.category,
      i.niche,
      ...(i.features || []),
      ...(i.tech_stack || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchSearch = !searchValue || haystack.includes(searchValue);
    return matchCategory && matchNiche && matchSearch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    const featuredDelta = Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured));
    if (featuredDelta !== 0) return featuredDelta;
    const aOrder = a.sort_order ?? 9999;
    const bOrder = b.sort_order ?? 9999;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.title.localeCompare(b.title);
  });

  // Highlight sections
  const highlightedSections = HIGHLIGHT_SECTIONS.filter((s) => items.some((i) => i.highlight_section === s.value && i.is_highlighted));

  const featuredItems = items.filter((i) => i.is_featured).sort((a, b) => {
    const aOrder = a.sort_order ?? 9999;
    const bOrder = b.sort_order ?? 9999;
    return aOrder - bOrder;
  });

  const showCurated = categoryFilter === "todos" && nicheFilter === "todos" && searchValue === "";

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-16 relative z-10">
      <div className="container mx-auto px-4">
        {/* Header */}
        <RevealBox className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">{t("nav.portfolio")}</span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mt-3 mb-4">
            Soluções que <span className="text-primary">transformam negócios</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Conheça nossos projetos, cases de sucesso e modelos prontos para acelerar o seu negócio.
          </p>
        </RevealBox>

        {loading ? (
          <div className="text-center text-muted-foreground py-20">Carregando portfólio...</div>
        ) : error ? (
          <RevealBox className="text-center py-20">
            <p className="text-muted-foreground">Não foi possível carregar o portfólio agora.</p>
          </RevealBox>
        ) : items.length === 0 ? (
          <RevealBox className="text-center py-20">
            <p className="text-muted-foreground">O portfólio está sendo atualizado. Volte em breve!</p>
          </RevealBox>
        ) : (
          <>
            {/* Filters */}
            <RevealBox className="mb-10">
              <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr]">
                <Input
                  placeholder="Buscar por nome, categoria ou stack"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={nicheFilter} onValueChange={setNicheFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os nichos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os nichos</SelectItem>
                    {niches.map((niche) => (
                      <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </RevealBox>

            {/* Featured Section */}
            {showCurated && featuredItems.length > 0 && (
              <RevealBox className="mb-12">
                <h2 className="font-display text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-primary">⭐</span> Em Destaque
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {featuredItems.map((item, i) => (
                    <RevealBox key={item.id} delay={i * 0.08}>
                      <PortfolioCard item={item} />
                    </RevealBox>
                  ))}
                </div>
              </RevealBox>
            )}

            {/* Highlight Sections */}
            {showCurated && highlightedSections.map((section) => {
              const sectionItems = items
                .filter((i) => i.highlight_section === section.value && i.is_highlighted)
                .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));
              if (sectionItems.length === 0) return null;
              return (
                <RevealBox key={section.value} className="mb-12">
                  <h2 className="font-display text-xl sm:text-2xl font-bold mb-6">{section.label}</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {sectionItems.map((item, i) => (
                      <RevealBox key={item.id} delay={i * 0.08}>
                        <PortfolioCard item={item} />
                      </RevealBox>
                    ))}
                  </div>
                </RevealBox>
              );
            })}

            {/* All items */}
            <RevealBox>
              {(showCurated && featuredItems.length > 0) || (showCurated && highlightedSections.length > 0) ? (
                <h2 className="font-display text-xl sm:text-2xl font-bold mb-6">Todos os Projetos</h2>
              ) : null}
              {sortedItems.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  Nenhum projeto encontrado com os filtros selecionados.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {sortedItems.map((item, i) => (
                    <RevealBox key={item.id} delay={i * 0.06}>
                      <PortfolioCard item={item} />
                    </RevealBox>
                  ))}
                </div>
              )}
            </RevealBox>

            {/* CTA Section */}
            <RevealBox delay={0.3} className="mt-16">
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-8 sm:p-12 text-center space-y-4">
                <h2 className="font-display text-2xl sm:text-3xl font-bold">Não encontrou o que procura?</h2>
                <p className="text-muted-foreground max-w-lg mx-auto">Criamos soluções 100% personalizadas. Conte-nos o que precisa e receba uma proposta sob medida.</p>
                <Button size="lg" className="mt-2" onClick={() => window.location.href = "/contato"}>
                  Solicitar Orçamento Personalizado
                </Button>
              </div>
            </RevealBox>
          </>
        )}
      </div>
    </div>
  );
}
