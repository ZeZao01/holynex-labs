// "O que fazemos": junta as antigas páginas Serviços e Soluções (17/11/2026). O site é vitrine e captação,
// então a página termina num chamado para conversar, não em preço. /solucoes redireciona para #exemplos.
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import RevealBox from "@/components/RevealBox";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Servicos() {
  const { t } = useLanguage();
  const { hash } = useLocation();
  // Link antigo /solucoes chega com #exemplos; a página é lazy, então rola depois de montar.
  useEffect(() => {
    if (!hash) return;
    const id = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 80);
    return () => window.clearTimeout(id);
  }, [hash]);
  const split = (key: string) => t(key).split(",").map((s) => s.trim()).filter(Boolean);

  const servicos = ["dev", "ai", "ent", "plat"].map((k) => ({
    title: t(`services.${k}.title`), desc: t(`services.${k}.desc`), items: split(`services.${k}.items`),
  }));
  const exemplos = ["erp", "courses", "influencer", "clinic"].map((k) => ({
    title: t(`solucoes.${k}.title`), desc: t(`solucoes.${k}.desc`), items: split(`solucoes.${k}.items`),
  }));

  return (
    <div className="relative z-10 min-h-screen pb-24 pt-28 sm:pt-32">
      <div className="container mx-auto px-4">
        <RevealBox className="max-w-3xl">
          <h1 className="font-display text-4xl font-bold tracking-tight [text-wrap:balance] sm:text-6xl">{t("services.title")}</h1>
          <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-muted-foreground">{t("services.desc")}</p>
        </RevealBox>

        <ul className="mt-16 divide-y divide-border/60 border-y border-border/60">
          {servicos.map((s) => (
            <li key={s.title} className="grid gap-4 py-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,5fr)_minmax(0,4fr)] lg:gap-10">
              <h2 className="font-display text-2xl font-semibold">{s.title}</h2>
              <p className="max-w-[52ch] leading-relaxed text-muted-foreground">{s.desc}</p>
              <ul className="flex flex-wrap gap-2 lg:justify-end">
                {s.items.map((item) => (
                  <li key={item} className="rounded-full border border-border/70 px-3 py-1.5 text-sm text-foreground/85">{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <section id="exemplos" className="scroll-mt-28 pt-24">
          <RevealBox className="max-w-3xl">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">{t("solucoes.title")}</h2>
            <p className="mt-4 max-w-[60ch] text-lg text-muted-foreground">{t("solucoes.desc")}</p>
          </RevealBox>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 md:grid-cols-2">
            {exemplos.map((e) => (
              <article key={e.title} className="flex flex-col gap-3 bg-background p-8">
                <h3 className="font-display text-xl font-semibold">{e.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{e.desc}</p>
                <p className="mt-auto pt-2 text-sm text-foreground/80">{e.items.join(" · ")}</p>
              </article>
            ))}
          </div>
        </section>

        <RevealBox className="mt-24 flex flex-col items-start justify-between gap-6 rounded-2xl border border-border/60 p-8 sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{t("section.cta.title")} {t("section.cta.highlight")} {t("section.cta.title2")}</h2>
            <p className="mt-2 text-muted-foreground">{t("section.cta.desc")}</p>
          </div>
          <Link
            to="/contato"
            className="btn-glow-filled group inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t("section.cta.btn")} <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </RevealBox>
      </div>
    </div>
  );
}
