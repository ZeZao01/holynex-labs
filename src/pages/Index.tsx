import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { Rocket, Mail, Monitor, Cpu, BarChart3, Zap, CheckCircle2, ArrowRight } from "lucide-react";

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
  { num: "01", title: "Análise do projeto" },
  { num: "02", title: "Planejamento da solução" },
  { num: "03", title: "Desenvolvimento do sistema" },
  { num: "04", title: "Testes e validação" },
  { num: "05", title: "Implantação e suporte" },
];

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-animated">
        <div className="absolute inset-0 bg-glow" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/10 blur-[100px]" style={{ animation: "bg-float 15s ease-in-out infinite reverse" }} />

        <div className="container mx-auto px-4 relative z-10 pt-20">
          <motion.div className="max-w-4xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="mb-6">
              <span className="inline-block px-5 py-2 rounded-full glass text-xs font-medium text-primary tracking-widest uppercase">
                ✦ Software House
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight mb-6 leading-[0.95]"
            >
              <span className="text-gradient-animated">HOLYNEX</span>
              <br />
              <span className="text-foreground">LABS</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-xl md:text-2xl font-display text-foreground/70 mb-4">
              Tecnologia com propósito.
            </motion.p>
            <motion.p variants={fadeUp} custom={3} className="text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              Desenvolvemos sistemas inteligentes, SaaS e automações com inteligência artificial
              para empresas e empreendedores que desejam escalar seus negócios.
            </motion.p>
            <motion.div variants={fadeUp} custom={4} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/contato"
                className="btn-glow-filled inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-primary-foreground"
              >
                <Rocket className="h-5 w-5" />
                Iniciar Projeto
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contato"
                className="btn-glow inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-medium text-foreground"
              >
                <Mail className="h-5 w-5" />
                Falar com Especialista
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* O que fazemos */}
      <section className="py-28 relative">
        <div className="container mx-auto px-4">
          <motion.div className="text-center max-w-2xl mx-auto mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.span variants={fadeUp} custom={0} className="text-primary text-sm font-medium uppercase tracking-widest">O que fazemos</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="font-display text-3xl md:text-5xl font-bold mt-4 mb-4">
              Criamos tecnologia que resolve <span className="text-gradient-animated">problemas reais</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg">
              Nossas soluções ajudam empresas a automatizar processos, organizar operações e escalar resultados.
            </motion.p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                className="card-animated glass rounded-2xl p-7 group cursor-default"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                  <s.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold mb-2 text-lg">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Soluções */}
      <section className="py-28 bg-card/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/3 blur-[150px]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.span variants={fadeUp} custom={0} className="text-primary text-sm font-medium uppercase tracking-widest">Soluções</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="font-display text-3xl md:text-5xl font-bold mt-4">
              Soluções sob medida
            </motion.h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-8">
            {solutions.map((s, i) => (
              <motion.div
                key={s.title}
                className="card-animated glass rounded-2xl p-8 group cursor-default"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <h3 className="font-display text-xl font-semibold mb-3 text-gradient-animated inline-block">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-28">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.span variants={fadeUp} custom={0} className="text-primary text-sm font-medium uppercase tracking-widest">Diferenciais</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="font-display text-3xl md:text-5xl font-bold mt-4">Por que a HolyNex Labs?</motion.h2>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
            {differentials.map((d, i) => (
              <motion.div
                key={d}
                className="flex items-center gap-3 glass rounded-full px-6 py-3.5 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_20px_-5px_hsl(262,98%,71%,0.2)]"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                whileHover={{ scale: 1.05 }}
              >
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium">{d}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Como trabalhamos */}
      <section className="py-28 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.span variants={fadeUp} custom={0} className="text-primary text-sm font-medium uppercase tracking-widest">Processo</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="font-display text-3xl md:text-5xl font-bold mt-4">Como trabalhamos</motion.h2>
          </motion.div>
          <div className="grid md:grid-cols-5 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                className="text-center group"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className="relative mx-auto w-20 h-20 mb-5">
                  <div className="absolute inset-0 rounded-full bg-gradient-purple opacity-20 group-hover:opacity-40 blur-md transition-opacity duration-500" />
                  <div className="relative w-full h-full rounded-full bg-gradient-purple flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="font-display font-bold text-lg text-primary-foreground">{s.num}</span>
                  </div>
                </div>
                <p className="font-display font-medium text-sm">{s.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 relative overflow-hidden bg-animated">
        <div className="absolute inset-0 bg-glow" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-3xl md:text-6xl font-bold mb-6">
              Tem uma <span className="text-gradient-animated">ideia</span> de sistema?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground max-w-lg mx-auto mb-10 text-lg">
              Transformamos sua ideia em uma plataforma digital escalável.
            </motion.p>
            <motion.div variants={fadeUp} custom={2}>
              <Link
                to="/contato"
                className="btn-glow-filled inline-flex items-center gap-3 px-10 py-4 rounded-full text-lg font-semibold text-primary-foreground"
              >
                <Rocket className="h-5 w-5" />
                Iniciar projeto
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
