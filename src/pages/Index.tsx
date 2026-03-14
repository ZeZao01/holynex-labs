import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { Rocket, Mail, Monitor, Cpu, BarChart3, Zap, CheckCircle2, ArrowRight, Sparkles, Shield, Clock, CreditCard, LayoutDashboard, ChevronDown, Quote, Star } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";
import Typewriter from "@/components/Typewriter";
import RevealBox from "@/components/RevealBox";
import { useLanguage } from "@/i18n/LanguageContext";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

/* ── Marquee for client logos ── */
function ClientMarquee() {
  const clients = [
    "TechCorp", "MedSolutions", "FinanceHub", "EduPlus",
    "RetailMax", "LogiTrack", "BuildPro", "CloudNex",
    "DataFlow", "SmartOps", "GreenEnergy", "HealthNet",
  ];

  return (
    <div className="relative overflow-hidden py-4">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
      <div className="flex animate-marquee gap-12 items-center">
        {[...clients, ...clients].map((name, i) => (
          <div
            key={`${name}-${i}`}
            className="flex-shrink-0 glass rounded-xl px-8 py-4 flex items-center justify-center min-w-[160px] hover:border-primary/30 transition-all duration-300"
          >
            <span className="font-display font-semibold text-sm text-muted-foreground whitespace-nowrap">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── FAQ Accordion Item ── */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left group"
      >
        <span className="font-display font-semibold text-sm sm:text-base pr-4">{question}</span>
        <ChevronDown
          className={`h-5 w-5 text-primary flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="px-5 sm:px-6 pb-5 sm:pb-6 text-sm text-muted-foreground leading-relaxed">{answer}</p>
      </motion.div>
    </div>
  );
}

export default function Index() {
  const { t } = useLanguage();

  const services = [
    { icon: Monitor, title: t("service.saas"), desc: t("service.saas.desc") },
    { icon: Cpu, title: t("service.ai"), desc: t("service.ai.desc") },
    { icon: BarChart3, title: t("service.enterprise"), desc: t("service.enterprise.desc") },
    { icon: Zap, title: t("service.platforms"), desc: t("service.platforms.desc") },
  ];

  const solutions = [
    { title: t("solution.saas"), desc: t("solution.saas.desc") },
    { title: t("solution.enterprise"), desc: t("solution.enterprise.desc") },
    { title: t("solution.ai"), desc: t("solution.ai.desc") },
    { title: t("solution.platforms"), desc: t("solution.platforms.desc") },
  ];

  const differentials = [t("diff.1"), t("diff.2"), t("diff.3"), t("diff.4"), t("diff.5")];

  const steps = [
    { num: "01", title: t("step.1"), desc: t("step.1.desc") },
    { num: "02", title: t("step.2"), desc: t("step.2.desc") },
    { num: "03", title: t("step.3"), desc: t("step.3.desc") },
    { num: "04", title: t("step.4"), desc: t("step.4.desc") },
    { num: "05", title: t("step.5"), desc: t("step.5.desc") },
  ];

  const stats = [
    { value: "50+", label: t("stats.projects"), desc: t("stats.projects.desc") },
    { value: "98%", label: t("stats.satisfaction"), desc: t("stats.satisfaction.desc") },
    { value: "3x", label: t("stats.faster"), desc: t("stats.faster.desc") },
    { value: "24/7", label: t("stats.support"), desc: t("stats.support.desc") },
  ];

  const testimonials = [
    {
      quote: "A HolyNex Labs criou toda a nossa plataforma digital do zero. A qualidade e o cumprimento dos prazos foram impressionantes.",
      name: "Carlos Mendes",
      role: "CEO",
      company: "TechCorp Solutions",
    },
    {
      quote: "O atendimento é excepcional. Nos ajudaram a digitalizar toda a jornada do cliente com agilidade e profissionalismo.",
      name: "Ana Oliveira",
      role: "Diretora de Operações",
      company: "MedSolutions",
    },
    {
      quote: "O sistema que a HolyNex criou transformou nossos processos. Economizamos horas de trabalho manual toda semana.",
      name: "Roberto Silva",
      role: "Diretor Geral",
      company: "FinanceHub",
    },
  ];

  const faqs = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
  ];

  const gatewayCards = [
    { icon: Shield, title: t("section.gateway.protection"), desc: t("section.gateway.protection.desc") },
    { icon: Clock, title: t("section.gateway.instant"), desc: t("section.gateway.instant.desc") },
    { icon: LayoutDashboard, title: t("section.gateway.organized"), desc: t("section.gateway.organized.desc") },
    { icon: CreditCard, title: t("section.gateway.methods"), desc: t("section.gateway.methods.desc") },
  ];

  return (
    <div className="min-h-screen relative z-10">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none -translate-y-[5%] md:-translate-y-[8%]"
          initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
          animate={{ opacity: 0.07, scale: 1, rotate: 0 }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <img src={logo} alt="" className="w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] md:w-[700px] md:h-[700px] object-contain" />
        </motion.div>

        <div className="container mx-auto px-4 relative z-10 pt-20 sm:pt-24 pb-12">
          <motion.div className="max-w-4xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="mb-6 sm:mb-8">
              <span className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full glass text-xs font-medium text-primary tracking-widest uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                {t("hero.badge")}
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 sm:mb-8 leading-[0.95]"
            >
              <span className="text-gradient-animated">HOLYNEX</span>
              <br />
              <span className="text-gradient-animated">LABS</span>
            </motion.h1>
            <motion.div variants={fadeUp} custom={2} className="text-lg sm:text-xl md:text-3xl font-display text-foreground/80 mb-4 sm:mb-6 h-[36px] sm:h-[40px] md:h-[48px]">
              <Typewriter
                words={[t("hero.typewriter.1"), t("hero.typewriter.2"), t("hero.typewriter.3"), t("hero.typewriter.4")]}
                className="text-gradient-animated"
                speed={70}
                pause={2500}
              />
            </motion.div>
            <motion.p variants={fadeUp} custom={3} className="text-muted-foreground max-w-xl mx-auto mb-8 sm:mb-12 leading-relaxed text-sm sm:text-base md:text-lg px-2">
              {t("hero.desc")}
            </motion.p>
            <motion.div variants={fadeUp} custom={4} className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0">
              <Link
                to="/contato"
                className="btn-glow inline-flex items-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-sm sm:text-base font-semibold text-foreground group w-full sm:w-auto justify-center"
              >
                <Rocket className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                {t("hero.cta1")}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/contato"
                className="btn-glow inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-sm sm:text-base font-medium text-foreground group w-full sm:w-auto justify-center"
              >
                <Mail className="h-5 w-5" />
                {t("hero.cta2")}
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats — enhanced with descriptions */}
          <motion.div
            className="max-w-4xl mx-auto mt-12 sm:mt-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {stats.map((s) => (
                <div key={s.label} className="glass rounded-2xl p-4 sm:p-6 text-center group hover:border-primary/30 transition-all duration-300">
                  <div className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-gradient-animated">{s.value}</div>
                  <div className="text-xs sm:text-sm font-semibold mt-2">{s.label}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight">{s.desc}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Client logos marquee — Social Proof */}
      <section className="py-12 sm:py-16 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <RevealBox className="text-center mb-8">
            <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-muted-foreground">
              {t("section.clients")}
            </h2>
          </RevealBox>
          <ClientMarquee />
        </div>
      </section>

      {/* O que fazemos */}
      <section className="py-16 sm:py-28 relative">
        <div className="container mx-auto px-4">
          <RevealBox className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <span className="text-primary text-sm font-medium uppercase tracking-widest">{t("section.whatWeDo")}</span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mt-4 mb-4">
              {t("section.whatWeDo.title")} <span className="text-gradient-animated">{t("section.whatWeDo.highlight")}</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">{t("section.whatWeDo.desc")}</p>
          </RevealBox>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {services.map((s, i) => (
              <RevealBox key={s.title} delay={i * 0.1} className="card-animated glass rounded-2xl p-5 sm:p-7 group cursor-default">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-5 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                  <s.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold mb-2 text-base sm:text-lg">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {t("section.learnMore")} <ArrowRight className="h-3 w-3" />
                </div>
              </RevealBox>
            ))}
          </div>
        </div>
      </section>

      {/* Soluções */}
      <section className="py-16 sm:py-28 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <RevealBox className="text-center mb-10 sm:mb-16">
            <span className="text-primary text-sm font-medium uppercase tracking-widest">{t("section.solutions")}</span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mt-4">{t("section.solutions.title")}</h2>
          </RevealBox>
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            {solutions.map((s, i) => (
              <RevealBox key={s.title} delay={i * 0.1} direction={i % 2 === 0 ? "left" : "right"} className="card-animated glass rounded-2xl p-6 sm:p-8 group cursor-default">
                <h3 className="font-display text-lg sm:text-xl font-semibold mb-3 text-gradient-animated inline-block">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{s.desc}</p>
                <div className="h-[2px] w-0 group-hover:w-full bg-gradient-purple mt-4 transition-all duration-500 rounded-full" />
              </RevealBox>
            ))}
          </div>
        </div>
      </section>

      {/* Gateway / Payment Methods — Bento Grid */}
      <section className="py-16 sm:py-28 relative">
        <div className="container mx-auto px-4">
          <RevealBox className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <span className="text-primary text-sm font-medium uppercase tracking-widest">{t("section.gateway")}</span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mt-4 mb-4">{t("section.gateway.title")}</h2>
            <p className="text-muted-foreground text-base sm:text-lg">{t("section.gateway.desc")}</p>
          </RevealBox>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {gatewayCards.map((card, i) => (
              <RevealBox key={card.title} delay={i * 0.1} className="card-animated glass rounded-2xl p-5 sm:p-7 group cursor-default">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                  <card.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold mb-2 text-sm sm:text-base">{card.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </RevealBox>
            ))}
          </div>
          {/* Payment method icons */}
          <RevealBox className="mt-8 sm:mt-12">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {["Pix", "Visa", "Mastercard", "Amex", "Elo", "Boleto"].map((method) => (
                <div
                  key={method}
                  className="glass rounded-xl px-5 py-3 flex items-center justify-center hover:border-primary/30 transition-all duration-300"
                >
                  <span className="font-display text-xs sm:text-sm font-semibold text-muted-foreground">{method}</span>
                </div>
              ))}
            </div>
          </RevealBox>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-16 sm:py-28">
        <div className="container mx-auto px-4">
          <RevealBox className="text-center mb-10 sm:mb-16">
            <span className="text-primary text-sm font-medium uppercase tracking-widest">{t("section.differentials")}</span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mt-4">{t("section.differentials.title")}</h2>
          </RevealBox>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-3xl mx-auto">
            {differentials.map((d, i) => (
              <RevealBox key={d} delay={i * 0.08}>
                <motion.div
                  className="flex items-center gap-2 sm:gap-3 glass rounded-full px-4 sm:px-6 py-3 hover:border-primary/30 transition-all duration-300 cursor-default"
                  whileHover={{ scale: 1.08, boxShadow: "0 0 25px -5px hsl(262,98%,71%,0.3)" }}
                >
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">{d}</span>
                </motion.div>
              </RevealBox>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-28 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <RevealBox className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <span className="text-primary text-sm font-medium uppercase tracking-widest">{t("section.testimonials")}</span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mt-4 mb-4">{t("section.testimonials.title")}</h2>
            <p className="text-muted-foreground text-base sm:text-lg">{t("section.testimonials.desc")}</p>
          </RevealBox>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((t, i) => (
              <RevealBox key={t.name} delay={i * 0.15} className="card-animated glass rounded-2xl p-6 sm:p-8 group cursor-default flex flex-col">
                <Quote className="h-8 w-8 text-primary/30 mb-4 flex-shrink-0" />
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed mb-6 flex-1 italic">
                  "{t.quote}"
                </p>
                <div className="border-t border-border/50 pt-4">
                  <div className="font-display font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                  <div className="text-xs text-primary font-medium mt-1">{t.company}</div>
                </div>
              </RevealBox>
            ))}
          </div>
        </div>
      </section>

      {/* Como trabalhamos */}
      <section className="py-16 sm:py-28">
        <div className="container mx-auto px-4">
          <RevealBox className="text-center mb-10 sm:mb-16">
            <span className="text-primary text-sm font-medium uppercase tracking-widest">{t("section.process")}</span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mt-4">{t("section.process.title")}</h2>
          </RevealBox>
          <div className="max-w-4xl mx-auto space-y-0">
            {steps.map((s, i) => (
              <RevealBox key={s.num} delay={i * 0.1} direction={i % 2 === 0 ? "left" : "right"}>
                <div className="flex items-center gap-4 sm:gap-6 py-4 sm:py-6 group">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-gradient-purple opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-500 scale-150" />
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-purple flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="font-display font-bold text-sm sm:text-lg text-primary-foreground">{s.num}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-base sm:text-lg">{s.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                  <div className="hidden md:block h-[1px] flex-1 bg-border/30 group-hover:bg-primary/20 transition-colors" />
                </div>
              </RevealBox>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-28 relative">
        <div className="container mx-auto px-4">
          <RevealBox className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <span className="text-primary text-sm font-medium uppercase tracking-widest">{t("section.faq")}</span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mt-4 mb-4">{t("section.faq.title")}</h2>
            <p className="text-muted-foreground text-base sm:text-lg">{t("section.faq.desc")}</p>
          </RevealBox>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <RevealBox key={i} delay={i * 0.08}>
                <FaqItem question={faq.q} answer={faq.a} />
              </RevealBox>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-28 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <RevealBox>
            <h2 className="font-display text-2xl sm:text-3xl md:text-6xl font-bold mb-4 sm:mb-6">
              {t("section.cta.title")} <span className="text-gradient-animated">{t("section.cta.highlight")}</span> {t("section.cta.title2")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8 sm:mb-10 text-base sm:text-lg">
              {t("section.cta.desc")}
            </p>
            <Link
              to="/contato"
              className="btn-glow inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg font-semibold text-foreground group"
            >
              <Rocket className="h-5 w-5 group-hover:rotate-12 transition-transform" />
              {t("section.cta.btn")}
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </RevealBox>
        </div>
      </section>
    </div>
  );
}
