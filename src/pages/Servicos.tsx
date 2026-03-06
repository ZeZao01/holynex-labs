import { Code2, Cpu, Building2, Globe } from "lucide-react";
import RevealBox from "@/components/RevealBox";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Servicos() {
  const { t } = useLanguage();

  const servicos = [
    { icon: Code2, title: t("services.dev.title"), desc: t("services.dev.desc"), items: t("services.dev.items").split(",") },
    { icon: Cpu, title: t("services.ai.title"), desc: t("services.ai.desc"), items: t("services.ai.items").split(",") },
    { icon: Building2, title: t("services.ent.title"), desc: t("services.ent.desc"), items: t("services.ent.items").split(",") },
    { icon: Globe, title: t("services.plat.title"), desc: t("services.plat.desc"), items: t("services.plat.items").split(",") },
  ];

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-16 relative z-10">
      <div className="container mx-auto px-4">
        <RevealBox className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">{t("nav.services")}</span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mt-3 mb-4">{t("services.title")}</h1>
          <p className="text-muted-foreground">{t("services.desc")}</p>
        </RevealBox>
        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
          {servicos.map((s, i) => (
            <RevealBox key={s.title} delay={i * 0.1} direction={i % 2 === 0 ? "left" : "right"} className="card-animated glass rounded-2xl p-6 sm:p-8 group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <s.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <h2 className="font-display text-lg sm:text-xl font-semibold mb-2">{s.title}</h2>
              <p className="text-muted-foreground mb-4 sm:mb-5 text-sm sm:text-base">{s.desc}</p>
              <ul className="space-y-2">
                {s.items.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-foreground/80">
                    <span className="w-2 h-2 rounded-full bg-gradient-purple flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="h-[2px] w-0 group-hover:w-full bg-gradient-purple mt-6 transition-all duration-500 rounded-full" />
            </RevealBox>
          ))}
        </div>
      </div>
    </div>
  );
}
