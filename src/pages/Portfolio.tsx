import { useState, useEffect } from "react";
import RevealBox from "@/components/RevealBox";
import PortfolioCard from "@/components/PortfolioCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { PortfolioItem, listPortfolioItems, HIGHLIGHT_SECTIONS } from "@/lib/portfolio-items";

export default function Portfolio() {
  const { t } = useLanguage();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [filter, setFilter] = useState("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPortfolioItems(true).then((data) => { setItems(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];
  const niches = [...new Set(items.map((i) => i.niche).filter(Boolean))];
  const filterOptions = ["todos", ...categories, ...niches];

  const filteredItems = filter === "todos" ? items : items.filter((i) => i.category === filter || i.niche === filter);

  // Highlight sections
  const highlightedSections = HIGHLIGHT_SECTIONS.filter((s) => items.some((i) => i.highlight_section === s.value && i.is_highlighted));

  const featuredItems = items.filter((i) => i.is_featured);

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
        ) : items.length === 0 ? (
          <RevealBox className="text-center py-20">
            <p className="text-muted-foreground">O portfólio está sendo atualizado. Volte em breve!</p>
          </RevealBox>
        ) : (
          <>
            {/* Filters */}
            {filterOptions.length > 1 && (
              <RevealBox className="flex flex-wrap justify-center gap-2 mb-10">
                {filterOptions.map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={filter === f ? "default" : "outline"}
                    onClick={() => setFilter(f)}
                    className="text-xs"
                  >
                    {f === "todos" ? "Todos" : f}
                  </Button>
                ))}
              </RevealBox>
            )}

            {/* Featured Section */}
            {filter === "todos" && featuredItems.length > 0 && (
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
            {filter === "todos" && highlightedSections.map((section) => {
              const sectionItems = items.filter((i) => i.highlight_section === section.value && i.is_highlighted);
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
              {(filter !== "todos" || (featuredItems.length === 0 && highlightedSections.length === 0)) ? null : (
                <h2 className="font-display text-xl sm:text-2xl font-bold mb-6">Todos os Projetos</h2>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredItems.map((item, i) => (
                  <RevealBox key={item.id} delay={i * 0.06}>
                    <PortfolioCard item={item} />
                  </RevealBox>
                ))}
              </div>
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
