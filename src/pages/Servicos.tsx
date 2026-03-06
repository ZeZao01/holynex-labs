import { motion, type Variants } from "framer-motion";
import { Code2, Cpu, Building2, Globe, ArrowRight } from "lucide-react";
import RevealBox from "@/components/RevealBox";

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
    <div className="min-h-screen pt-28 pb-16 relative z-10">
      <div className="container mx-auto px-4">
        <RevealBox className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">Serviços</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">O que podemos fazer por você</h1>
          <p className="text-muted-foreground">Soluções completas de tecnologia para acelerar o crescimento do seu negócio.</p>
        </RevealBox>
        <div className="grid md:grid-cols-2 gap-8">
          {servicos.map((s, i) => (
            <RevealBox key={s.title} delay={i * 0.1} direction={i % 2 === 0 ? "left" : "right"} className="card-animated glass rounded-2xl p-8 group">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <s.icon className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-display text-xl font-semibold mb-2">{s.title}</h2>
              <p className="text-muted-foreground mb-5">{s.desc}</p>
              <ul className="space-y-2.5">
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
