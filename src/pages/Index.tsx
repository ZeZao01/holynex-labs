// Home da HolyNex Labs. Refinamento Impeccable (17/11/2026): mesma identidade escura e violeta,
// sem prova social inventada (logos, depoimentos e números saíram), um único chamado principal,
// projetos reais vindos do portfólio (some quando não há nenhum) e seções duplicadas unidas.
import { useState } from "react";
import ProjectPreview from "@/components/ProjectPreview";
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, Check, ChevronDown } from "lucide-react";
import logo from "@/assets/logo.png";
import RevealBox from "@/components/RevealBox";
import { useLanguage } from "@/i18n/LanguageContext";
import { listPortfolioItems, type PortfolioItem } from "@/lib/portfolio-items";

const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] } }),
};

function FaqItem({ id, question, answer }: { id: string; question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/60">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={`${id}-resposta`}
        className="flex w-full items-center justify-between gap-6 py-5 text-left font-display text-base font-semibold sm:text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      >
        {question}
        <ChevronDown aria-hidden className={`h-5 w-5 shrink-0 text-primary transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <motion.div
        id={`${id}-resposta`}
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <p className="max-w-[68ch] pb-6 leading-relaxed text-muted-foreground">{answer}</p>
      </motion.div>
    </div>
  );
}

function ProjectCard({ item, cta }: { item: PortfolioItem; cta: string }) {
  const image = item.cover_image_url || item.thumbnail_url;
  const summary = item.short_description || item.subtitle || item.commercial_description;
  return (
    <Link
      to={`/portfolio/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ProjectPreview poster={image} video={item.video_url || undefined} alt={`Prévia do site ${item.title}`} className="aspect-[16/10]" />
      <div className="flex flex-1 flex-col gap-2 p-6">
        {item.niche && <span className="text-sm text-muted-foreground">{item.niche}</span>}
        <h3 className="font-display text-xl font-semibold">{item.title}</h3>
        {summary && <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{summary}</p>}
        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium text-primary">
          {cta} <ArrowUpRight aria-hidden className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export default function Index() {
  const { t } = useLanguage();
  const { data: portfolio = [] } = useQuery({
    queryKey: ["home-portfolio"],
    queryFn: () => listPortfolioItems(true),
    staleTime: 5 * 60 * 1000,
  });
  const projects = [...portfolio].sort((a, b) => Number(!!b.is_featured) - Number(!!a.is_featured)).slice(0, 3);

  const offer = [
    { title: t("solution.saas"), desc: t("solution.saas.desc") },
    { title: t("solution.enterprise"), desc: t("solution.enterprise.desc") },
    { title: t("solution.ai"), desc: t("solution.ai.desc") },
    { title: t("solution.platforms"), desc: t("solution.platforms.desc") },
    { title: t("home.offer.payments"), desc: t("home.offer.payments.desc") },
  ];
  const commitments = [t("home.commit.1"), t("home.commit.2"), t("home.commit.3")];
  const steps = [1, 2, 3, 4, 5].map((n) => ({ num: String(n).padStart(2, "0"), title: t(`step.${n}`), desc: t(`step.${n}.desc`) }));
  const faqs = [1, 2, 3, 4, 5].map((n) => ({ q: t(`faq.q${n}`), a: t(`faq.a${n}`) }));

  return (
    <div className="relative z-10 min-h-screen">
      {/* Hero: a proposta de valor é o título; o nome da marca já está no logo e no menu. */}
      <section className="relative flex min-h-[92svh] items-center overflow-hidden">
        <motion.img
          src={logo}
          alt=""
          aria-hidden
          className="pointer-events-none absolute right-[-12%] top-1/2 w-[620px] max-w-none -translate-y-1/2 select-none opacity-[0.07] sm:w-[760px] lg:right-[-6%]"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 0.07, scale: 1 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="container relative z-10 mx-auto px-4 pb-16 pt-28 sm:pt-32">
          <motion.div className="max-w-6xl" initial="hidden" animate="visible">
            <motion.h1 variants={rise} custom={0} className="max-w-[24ch] font-display text-[clamp(2.4rem,5.4vw,5.25rem)] font-bold leading-[1.02] tracking-[-0.03em] [text-wrap:balance]">
              {t("home.headline.lead")} <span className="text-gradient-animated">{t("home.headline.accent")}</span> {t("home.headline.tail")}
            </motion.h1>
            <motion.p variants={rise} custom={1} className="mt-6 max-w-[58ch] text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t("home.sub")}
            </motion.p>
            <motion.div variants={rise} custom={2} className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8">
              <Link
                to="/contato"
                className="btn-glow-filled group inline-flex min-h-[48px] items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {t("hero.cta1")}
                <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/portfolio" className="inline-flex min-h-[44px] items-center gap-1.5 text-base font-medium text-foreground underline decoration-primary/60 underline-offset-[6px] transition-colors hover:decoration-primary">
                {t("home.cta.portfolio")}
              </Link>
            </motion.div>
            <motion.ul variants={rise} custom={3} className="mt-14 flex flex-col gap-3 text-sm text-foreground/80 sm:flex-row sm:flex-wrap sm:gap-x-8">
              {commitments.map((c) => (
                <li key={c} className="flex items-center gap-2">
                  <Check aria-hidden className="h-4 w-4 text-primary" /> {c}
                </li>
              ))}
            </motion.ul>
          </motion.div>
        </div>
      </section>

      {/* Projetos reais do portfólio. Sem itens publicados, a seção não aparece. */}
      {projects.length > 0 && (
        <section className="py-20 sm:py-28">
          <div className="container mx-auto px-4">
            <RevealBox className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">{t("home.projects.title")}</h2>
                <p className="mt-3 text-muted-foreground">{t("home.projects.desc")}</p>
              </div>
              <Link to="/portfolio" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline underline-offset-4">
                {t("home.projects.all")} <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </RevealBox>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => <ProjectCard key={p.id} item={p} cta={t("home.projects.open")} />)}
            </div>
          </div>
        </section>
      )}

      {/* O que construímos: uma lista só (antes eram duas seções repetindo os mesmos 4 itens). */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <RevealBox className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="font-display text-3xl font-bold tracking-tight [text-wrap:balance] sm:text-5xl">
              {t("section.whatWeDo.title")} {t("section.whatWeDo.highlight")}
            </h2>
            <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-muted-foreground">{t("section.whatWeDo.desc")}</p>
          </RevealBox>
          <ul className="divide-y divide-border/60 border-y border-border/60">
            {offer.map((o) => (
              <li key={o.title} className="grid gap-2 py-7 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-8">
                <h3 className="font-display text-xl font-semibold">{o.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{o.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Processo: a numeração fica porque a ordem é a informação. */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4">
          <RevealBox>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">{t("home.process.title")}</h2>
          </RevealBox>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((s) => (
              <li key={s.num} className="flex flex-col gap-3 bg-background p-6">
                <span className="font-display text-sm font-semibold tabular-nums text-primary">{s.num}</span>
                <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <RevealBox>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">{t("home.faq.title")}</h2>
            <p className="mt-4 max-w-[44ch] text-muted-foreground">{t("section.faq.desc")}</p>
          </RevealBox>
          <div className="border-t border-border/60">
            {faqs.map((f, i) => <FaqItem key={f.q} id={`faq-${i + 1}`} question={f.q} answer={f.a} />)}
          </div>
        </div>
      </section>

      {/* Chamado final */}
      <section className="py-24 sm:py-32">
        <div className="container mx-auto px-4">
          <RevealBox className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-4xl font-bold tracking-tight [text-wrap:balance] sm:text-6xl">
              {t("section.cta.title")} {t("section.cta.highlight")} {t("section.cta.title2")}
            </h2>
            <p className="mx-auto mt-5 max-w-[48ch] text-lg text-muted-foreground">{t("section.cta.desc")}</p>
            <Link
              to="/contato"
              className="btn-glow-filled group mt-10 inline-flex min-h-[52px] items-center gap-2 rounded-full px-9 py-4 text-lg font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {t("section.cta.btn")}
              <ArrowRight aria-hidden className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </RevealBox>
        </div>
      </section>
    </div>
  );
}
