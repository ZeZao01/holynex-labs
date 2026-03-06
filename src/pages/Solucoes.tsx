import { motion } from "framer-motion";
import { Building2, GraduationCap, Users, Stethoscope } from "lucide-react";
import RevealBox from "@/components/RevealBox";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Solucoes() {
  const { t } = useLanguage();

  const solucoes = [
    { icon: Building2, title: t("solucoes.erp.title"), desc: t("solucoes.erp.desc"), items: t("solucoes.erp.items").split(",") },
    { icon: GraduationCap, title: t("solucoes.courses.title"), desc: t("solucoes.courses.desc"), items: t("solucoes.courses.items").split(",") },
    { icon: Users, title: t("solucoes.influencer.title"), desc: t("solucoes.influencer.desc"), items: t("solucoes.influencer.items").split(",") },
    { icon: Stethoscope, title: t("solucoes.clinic.title"), desc: t("solucoes.clinic.desc"), items: t("solucoes.clinic.items").split(",") },
  ];

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-16 relative z-10">
      <div className="container mx-auto px-4">
        <RevealBox className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">{t("nav.solutions")}</span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mt-3 mb-4">{t("solucoes.title")}</h1>
          <p className="text-muted-foreground">{t("solucoes.desc")}</p>
        </RevealBox>
        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
          {solucoes.map((s, i) => (
            <RevealBox key={s.title} delay={i * 0.1} direction={i % 2 === 0 ? "left" : "right"} className="card-animated glass rounded-2xl p-6 sm:p-8 group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <s.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <h2 className="font-display text-lg sm:text-xl font-semibold mb-2">{s.title}</h2>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">{s.desc}</p>
              <div className="flex flex-wrap gap-2">
                {s.items.map((item) => (
                  <motion.span
                    key={item}
                    className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-default"
                    whileHover={{ scale: 1.1, backgroundColor: "hsl(262, 98%, 71%, 0.2)" }}
                  >
                    {item}
                  </motion.span>
                ))}
              </div>
            </RevealBox>
          ))}
        </div>
      </div>
    </div>
  );
}
