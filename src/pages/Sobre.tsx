import { Target, Lightbulb, Rocket } from "lucide-react";
import RevealBox from "@/components/RevealBox";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Sobre() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-16 relative z-10">
      <div className="container mx-auto px-4">
        <RevealBox className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">{t("nav.about")}</span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mt-3 mb-4">
            {t("about.title")} <span className="text-gradient-animated">HolyNex Labs</span>
          </h1>
        </RevealBox>
        <div className="max-w-3xl mx-auto">
          <RevealBox className="card-animated glass rounded-2xl p-6 sm:p-8 md:p-12 mb-8 sm:mb-12">
            <p className="text-base sm:text-lg text-foreground/80 leading-relaxed mb-4 sm:mb-6">
              <span className="text-primary font-semibold">HolyNex Labs</span> {t("about.p1").replace(/^(A |La )?HolyNex Labs /, "")}
            </p>
            <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">{t("about.p2")}</p>
          </RevealBox>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: Target, title: t("about.mission"), desc: t("about.mission.desc") },
              { icon: Lightbulb, title: t("about.vision"), desc: t("about.vision.desc") },
              { icon: Rocket, title: t("about.values"), desc: t("about.values.desc") },
            ].map((item, i) => (
              <RevealBox key={item.title} delay={i * 0.12} className="card-animated glass rounded-2xl p-5 sm:p-6 text-center group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <item.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold mb-2 text-base sm:text-lg">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{item.desc}</p>
              </RevealBox>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
