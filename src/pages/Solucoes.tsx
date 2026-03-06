import { motion } from "framer-motion";
import { Building2, GraduationCap, Users, Stethoscope } from "lucide-react";
import RevealBox from "@/components/RevealBox";

const solucoes = [
  { icon: Building2, title: "ERP Empresarial", desc: "Sistema completo de gestão para empresas.", items: ["Financeiro", "Clientes", "Relatórios", "Automações"] },
  { icon: GraduationCap, title: "Plataforma de Cursos", desc: "Sistema para criadores venderem cursos online.", items: ["Área de alunos", "Pagamentos", "Acompanhamento"] },
  { icon: Users, title: "Plataforma para Influenciadores", desc: "Aplicativo para influenciadores organizarem conteúdo e comunidade.", items: ["Gestão de conteúdo", "Comunidade", "Monetização"] },
  { icon: Stethoscope, title: "Sistema de Gestão de Clínicas", desc: "Gestão de pacientes, agendas e prontuários.", items: ["Pacientes", "Agendamento", "Prontuários"] },
];

export default function Solucoes() {
  return (
    <div className="min-h-screen pt-28 pb-16 relative z-10">
      <div className="container mx-auto px-4">
        <RevealBox className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">Soluções</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">Exemplos do que podemos construir</h1>
          <p className="text-muted-foreground">Cada solução é personalizada para atender às necessidades específicas do seu negócio.</p>
        </RevealBox>
        <div className="grid md:grid-cols-2 gap-8">
          {solucoes.map((s, i) => (
            <RevealBox key={s.title} delay={i * 0.1} direction={i % 2 === 0 ? "left" : "right"} className="card-animated glass rounded-2xl p-8 group">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <s.icon className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-display text-xl font-semibold mb-2">{s.title}</h2>
              <p className="text-muted-foreground mb-4">{s.desc}</p>
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
