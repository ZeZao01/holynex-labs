import RevealBox from "@/components/RevealBox";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Portfolio() {
  const { t } = useLanguage();

  const projects = [
    { title: t("portfolio.p1.title"), category: t("portfolio.p1.cat"), desc: t("portfolio.p1.desc") },
    { title: t("portfolio.p2.title"), category: t("portfolio.p2.cat"), desc: t("portfolio.p2.desc") },
    { title: t("portfolio.p3.title"), category: t("portfolio.p3.cat"), desc: t("portfolio.p3.desc") },
    { title: t("portfolio.p4.title"), category: t("portfolio.p4.cat"), desc: t("portfolio.p4.desc") },
    { title: t("portfolio.p5.title"), category: t("portfolio.p5.cat"), desc: t("portfolio.p5.desc") },
    { title: t("portfolio.p6.title"), category: t("portfolio.p6.cat"), desc: t("portfolio.p6.desc") },
  ];

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-16 relative z-10">
      <div className="container mx-auto px-4">
        <RevealBox className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">{t("nav.portfolio")}</span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mt-3 mb-4">{t("portfolio.title")}</h1>
        </RevealBox>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {projects.map((p, i) => (
            <RevealBox key={p.title} delay={i * 0.08} className="card-animated glass rounded-2xl overflow-hidden group">
              <div className="h-36 sm:h-44 bg-gradient-purple/10 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-purple/5 group-hover:bg-gradient-purple/15 transition-all duration-500" />
                <span className="font-display text-4xl sm:text-5xl font-bold text-primary/20 group-hover:text-primary/40 group-hover:scale-125 transition-all duration-500">{p.title.charAt(0)}</span>
              </div>
              <div className="p-4 sm:p-6">
                <span className="text-xs text-primary font-medium uppercase tracking-widest">{p.category}</span>
                <h3 className="font-display text-base sm:text-lg font-semibold mt-1 mb-2">{p.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{p.desc}</p>
              </div>
            </RevealBox>
          ))}
        </div>
      </div>
    </div>
  );
}
