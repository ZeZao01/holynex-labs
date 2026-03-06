import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { Rocket, Mail, Monitor, Cpu, BarChart3, Zap, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";
import Typewriter from "@/components/Typewriter";
import RevealBox from "@/components/RevealBox";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const services = [
  { icon: Monitor, title: "Desenvolvimento de SaaS", desc: "Plataformas escaláveis para startups e empresas" },
  { icon: Cpu, title: "Automação com IA", desc: "Inteligência artificial para automatizar processos" },
  { icon: BarChart3, title: "Sistemas Empresariais", desc: "ERPs, CRMs e sistemas de gestão personalizados" },
  { icon: Zap, title: "Plataformas Digitais", desc: "Aplicativos e plataformas para comunidades" },
];

const solutions = [
  { title: "Desenvolvimento de SaaS", desc: "Criamos plataformas escaláveis para startups e empresas que desejam transformar ideias em produtos digitais." },
  { title: "Sistemas Empresariais", desc: "Desenvolvemos ERPs, CRMs e sistemas de gestão personalizados para automatizar operações." },
  { title: "Automação com IA", desc: "Implementamos inteligência artificial para automatizar tarefas, gerar relatórios e melhorar processos." },
  { title: "Plataformas Digitais", desc: "Criamos aplicativos e plataformas digitais para comunidades, criadores de conteúdo e empresas." },
];

const differentials = [
  "Desenvolvimento rápido",
  "Tecnologia moderna",
  "Integração com IA",
  "Sistemas escaláveis",
  "Soluções personalizadas",
];

const steps = [
  { num: "01", title: "Análise do projeto", desc: "Entendemos seus objetivos" },
  { num: "02", title: "Planejamento", desc: "Desenhamos a solução ideal" },
  { num: "03", title: "Desenvolvimento", desc: "Construímos com tecnologia moderna" },
  { num: "04", title: "Testes", desc: "Validamos cada funcionalidade" },
  { num: "05", title: "Implantação", desc: "Suporte contínuo garantido" },
];

const stats = [
  { value: "50+", label: "Projetos entregues" },
  { value: "98%", label: "Satisfação" },
  { value: "3x", label: "Mais rápido" },
  { value: "24/7", label: "Suporte" },
];

export default function Index() {
  return (
    <div className="min-h-screen relative z-10">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Large logo behind hero */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
          animate={{ opacity: 0.07, scale: 1, rotate: 0 }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <img src={logo} alt="" className="w-[500px] h-[500px] md:w-[700px] md:h-[700px] object-contain" />
        </motion.div>

        <div className="container mx-auto px-4 relative z-10 pt-24 pb-12">
          <motion.div className="max-w-4xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="mb-8">
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass text-xs font-medium text-primary tracking-widest uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                Software House
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[0.95]"
            >
              <span className="text-gradient-animated">HOLYNEX</span>
              <br />
              <span className="text-gradient-animated">LABS</span>
            </motion.h1>
            <motion.div variants={fadeUp} custom={2} className="text-xl md:text-3xl font-display text-foreground/80 mb-6 h-[40px] md:h-[48px]">
              <Typewriter
                words={["Tecnologia com propósito.", "Inovação que escala.", "Soluções inteligentes.", "Automação com IA."]}
                className="text-gradient-animated"
                speed={70}
                pause={2500}
              />
            </motion.div>
            <motion.p variants={fadeUp} custom={3} className="text-muted-foreground max-w-xl mx-auto mb-12 leading-relaxed text-base md:text-lg">
              Desenvolvemos sistemas inteligentes, SaaS e automações com inteligência artificial
              para empresas e empreendedores que desejam escalar seus negócios.
            </motion.p>
            <motion.div variants={fadeUp} custom={4} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/contato"
                className="btn-glow inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-semibold text-foreground group"
              >
                <Rocket className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                Iniciar Projeto
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/contato"
                className="btn-glow inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-medium text-foreground group"
              >
                <Mail className="h-5 w-5" />
                Falar com Especialista
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            className="max-w-3xl mx-auto mt-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7 }}
          >
            <div className="glass rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="font-display text-2xl md:text-3xl font-bold text-gradient-animated">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* O que fazemos */}
      <section className="py-28 relative">
        <div className="container mx-auto px-4">
          <RevealBox className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-primary text-sm font-medium uppercase tracking-widest">O que fazemos</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mt-4 mb-4">
              Criamos tecnologia que resolve <span className="text-gradient-animated">problemas reais</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Nossas soluções ajudam empresas a automatizar processos, organizar operações e escalar resultados.
            </p>
          </RevealBox>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, i) => (
              <RevealBox key={s.title} delay={i * 0.1} className="card-animated glass rounded-2xl p-7 group cursor-default">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                  <s.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold mb-2 text-lg">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Saiba mais <ArrowRight className="h-3 w-3" />
                </div>
              </RevealBox>
            ))}
          </div>
        </div>
      </section>

      {/* Soluções */}
      <section className="py-28 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <RevealBox className="text-center mb-16">
            <span className="text-primary text-sm font-medium uppercase tracking-widest">Soluções</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mt-4">
              Soluções sob medida
            </h2>
          </RevealBox>
          <div className="grid md:grid-cols-2 gap-8">
            {solutions.map((s, i) => (
              <RevealBox
                key={s.title}
                delay={i * 0.1}
                direction={i % 2 === 0 ? "left" : "right"}
                className="card-animated glass rounded-2xl p-8 group cursor-default"
              >
                <h3 className="font-display text-xl font-semibold mb-3 text-gradient-animated inline-block">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                <div className="h-[2px] w-0 group-hover:w-full bg-gradient-purple mt-4 transition-all duration-500 rounded-full" />
              </RevealBox>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-28">
        <div className="container mx-auto px-4">
          <RevealBox className="text-center mb-16">
            <span className="text-primary text-sm font-medium uppercase tracking-widest">Diferenciais</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mt-4">Por que a HolyNex Labs?</h2>
          </RevealBox>
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
            {differentials.map((d, i) => (
              <RevealBox key={d} delay={i * 0.08}>
                <motion.div
                  className="flex items-center gap-3 glass rounded-full px-6 py-3.5 hover:border-primary/30 transition-all duration-300 cursor-default"
                  whileHover={{ scale: 1.08, boxShadow: "0 0 25px -5px hsl(262,98%,71%,0.3)" }}
                >
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium">{d}</span>
                </motion.div>
              </RevealBox>
            ))}
          </div>
        </div>
      </section>

      {/* Como trabalhamos */}
      <section className="py-28">
        <div className="container mx-auto px-4">
          <RevealBox className="text-center mb-16">
            <span className="text-primary text-sm font-medium uppercase tracking-widest">Processo</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mt-4">Como trabalhamos</h2>
          </RevealBox>
          <div className="max-w-4xl mx-auto space-y-0">
            {steps.map((s, i) => (
              <RevealBox key={s.num} delay={i * 0.1} direction={i % 2 === 0 ? "left" : "right"}>
                <div className="flex items-center gap-6 py-6 group">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-gradient-purple opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-500 scale-150" />
                    <div className="relative w-16 h-16 rounded-full bg-gradient-purple flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="font-display font-bold text-lg text-primary-foreground">{s.num}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-lg">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                  <div className="hidden md:block h-[1px] flex-1 bg-border/30 group-hover:bg-primary/20 transition-colors" />
                </div>
              </RevealBox>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <RevealBox>
            <h2 className="font-display text-3xl md:text-6xl font-bold mb-6">
              Tem uma <span className="text-gradient-animated">ideia</span> de sistema?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-10 text-lg">
              Transformamos sua ideia em uma plataforma digital escalável.
            </p>
            <Link
              to="/contato"
              className="btn-glow inline-flex items-center gap-3 px-10 py-5 rounded-full text-lg font-semibold text-foreground group"
            >
              <Rocket className="h-5 w-5 group-hover:rotate-12 transition-transform" />
              Iniciar projeto
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </RevealBox>
        </div>
      </section>
    </div>
  );
}
