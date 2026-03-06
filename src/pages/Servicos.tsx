import { motion } from "framer-motion";
import { Code2, Cpu, Building2, Globe } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }),
};

const servicos = [
  {
    icon: Code2,
    title: "Desenvolvimento de Software",
    desc: "Criamos sistemas personalizados para empresas e startups.",
    items: ["SaaS", "Micro SaaS", "ERPs personalizados", "CRMs", "Dashboards"],
  },
  {
    icon: Cpu,
    title: "Automação com IA",
    desc: "Automatize processos e aumente a produtividade da sua empresa.",
    items: ["Geração automática de relatórios", "Assistentes virtuais", "Automação de conteúdo", "Análise de dados"],
  },
  {
    icon: Building2,
    title: "Sistemas Empresariais",
    desc: "Ferramentas inteligentes para gestão de empresas.",
    items: ["Gestão de clientes", "Gestão financeira", "Gestão de operações"],
  },
  {
    icon: Globe,
    title: "Plataformas Digitais",
    desc: "Criamos plataformas para comunidades, influenciadores e empresas.",
    items: ["Plataformas de cursos", "Plataformas de assinatura", "Aplicativos de comunidade"],
  },
];

export default function Servicos() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div className="text-center max-w-2xl mx-auto mb-16" initial="hidden" animate="visible">
          <motion.span variants={fadeUp} custom={0} className="text-primary text-sm font-medium uppercase tracking-wider">
            Serviços
          </motion.span>
          <motion.h1 variants={fadeUp} custom={1} className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">
            O que podemos fazer por você
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground">
            Soluções completas de tecnologia para acelerar o crescimento do seu negócio.
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {servicos.map((s, i) => (
            <motion.div
              key={s.title}
              className="glass rounded-xl p-8 hover:card-glow transition-all"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-display text-xl font-semibold mb-2">{s.title}</h2>
              <p className="text-muted-foreground mb-4">{s.desc}</p>
              <ul className="space-y-2">
                {s.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
