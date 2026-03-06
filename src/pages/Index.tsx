import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Rocket, Mail, Monitor, Cpu, BarChart3, Zap, CheckCircle2, ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-glow" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="container mx-auto px-4 relative z-10 pt-20">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} custom={0} className="mb-4">
              <span className="inline-block px-4 py-1.5 rounded-full glass text-xs font-medium text-primary tracking-wider uppercase">
                Software House
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-4"
            >
              <span className="text-gradient">HOLYNEX</span> LABS
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-xl md:text-2xl font-display text-foreground/80 mb-4"
            >
              Tecnologia com propósito.
            </motion.p>
            <motion.p
              variants={fadeUp}
              custom={3}
              className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed"
            >
              Desenvolvemos sistemas inteligentes, SaaS e automações com inteligência artificial
              para empresas e empreendedores que desejam escalar seus negócios.
            </motion.p>
            <motion.div variants={fadeUp} custom={4} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-purple border-0 text-base font-semibold hover:opacity-90">
                <Link to="/contato">
                  <Rocket className="mr-2 h-5 w-5" /> Iniciar Projeto
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base border-border/50 hover:bg-muted">
                <Link to="/contato">
                  <Mail className="mr-2 h-5 w-5" /> Falar com Especialista
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* O que fazemos */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.span variants={fadeUp} custom={0} className="text-primary text-sm font-medium uppercase tracking-wider">
              O que fazemos
            </motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="font-display text-3xl md:text-4xl font-bold mt-3 mb-4">
              Criamos tecnologia que resolve problemas reais
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground">
              Nossas soluções ajudam empresas a automatizar processos, organizar operações e escalar resultados através de sistemas inteligentes.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                className="glass rounded-xl p-6 hover:card-glow transition-all duration-300 group"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Soluções */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.span variants={fadeUp} custom={0} className="text-primary text-sm font-medium uppercase tracking-wider">Soluções</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="font-display text-3xl md:text-4xl font-bold mt-3">
              Soluções sob medida para seu negócio
            </motion.h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-8">
            {solutions.map((s, i) => (
              <motion.div
                key={s.title}
                className="glass rounded-xl p-8 hover:card-glow transition-all"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <h3 className="font-display text-xl font-semibold mb-3 text-gradient inline-block">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.span variants={fadeUp} custom={0} className="text-primary text-sm font-medium uppercase tracking-wider">Diferenciais</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="font-display text-3xl md:text-4xl font-bold mt-3">
              Por que a HolyNex Labs?
            </motion.h2>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
            {differentials.map((d, i) => (
              <motion.div
                key={d}
                className="flex items-center gap-2 glass rounded-full px-6 py-3"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{d}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Como trabalhamos */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.span variants={fadeUp} custom={0} className="text-primary text-sm font-medium uppercase tracking-wider">Processo</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="font-display text-3xl md:text-4xl font-bold mt-3">
              Como trabalhamos
            </motion.h2>
          </motion.div>
          <div className="grid md:grid-cols-5 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                className="text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-purple mx-auto flex items-center justify-center mb-4">
                  <span className="font-display font-bold text-lg text-primary-foreground">{s.num}</span>
                </div>
                <p className="font-display font-medium text-sm">{s.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-glow" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-3xl md:text-5xl font-bold mb-4">
              Tem uma ideia de sistema?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground max-w-lg mx-auto mb-8 text-lg">
              Transformamos sua ideia em uma plataforma digital escalável.
            </motion.p>
            <motion.div variants={fadeUp} custom={2}>
              <Button asChild size="lg" className="bg-gradient-purple border-0 text-base font-semibold hover:opacity-90">
                <Link to="/contato">
                  <Rocket className="mr-2 h-5 w-5" /> Iniciar projeto
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
