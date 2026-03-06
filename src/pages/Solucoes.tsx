import { motion, type Variants } from "framer-motion";
import { Building2, GraduationCap, Users, Stethoscope } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

const solucoes = [
  { icon: Building2, title: "ERP Empresarial", desc: "Sistema completo de gestão para empresas.", items: ["Financeiro", "Clientes", "Relatórios", "Automações"] },
  { icon: GraduationCap, title: "Plataforma de Cursos", desc: "Sistema para criadores venderem cursos online.", items: ["Área de alunos", "Pagamentos", "Acompanhamento"] },
  { icon: Users, title: "Plataforma para Influenciadores", desc: "Aplicativo para influenciadores organizarem conteúdo e comunidade.", items: ["Gestão de conteúdo", "Comunidade", "Monetização"] },
  { icon: Stethoscope, title: "Sistema de Gestão de Clínicas", desc: "Gestão de pacientes, agendas e prontuários.", items: ["Pacientes", "Agendamento", "Prontuários"] },
];

export default function Solucoes() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div className="text-center max-w-2xl mx-auto mb-16" initial="hidden" animate="visible">
          <motion.span variants={fadeUp} custom={0} className="text-primary text-sm font-medium uppercase tracking-wider">Soluções</motion.span>
          <motion.h1 variants={fadeUp} custom={1} className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">Exemplos do que podemos construir</motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground">Cada solução é personalizada para atender às necessidades específicas do seu negócio.</motion.p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-8">
          {solucoes.map((s, i) => (
            <motion.div key={s.title} className="glass rounded-xl p-8 hover:card-glow transition-all" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-display text-xl font-semibold mb-2">{s.title}</h2>
              <p className="text-muted-foreground mb-4">{s.desc}</p>
              <div className="flex flex-wrap gap-2">
                {s.items.map((item) => (
                  <span key={item} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{item}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
