import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }),
};

const projects = [
  { title: "ERP Empresarial", category: "Sistema de Gestão", desc: "Sistema completo para gestão empresarial com módulos financeiros, comerciais e operacionais." },
  { title: "SaaS de Gestão", category: "SaaS", desc: "Plataforma SaaS para gestão de equipes e projetos com automação de tarefas." },
  { title: "Plataforma Educacional", category: "EdTech", desc: "Sistema de cursos online com área de alunos, pagamentos e acompanhamento de progresso." },
  { title: "Dashboard Empresarial", category: "BI / Analytics", desc: "Painel de controle com métricas em tempo real e relatórios automatizados com IA." },
  { title: "Sistema Administrativo", category: "Gestão", desc: "Sistema interno para controle de processos, documentos e fluxos de trabalho." },
  { title: "App de Comunidade", category: "Plataforma Digital", desc: "Aplicativo para criadores de conteúdo gerenciarem sua comunidade e monetizarem." },
];

export default function Portfolio() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div className="text-center max-w-2xl mx-auto mb-16" initial="hidden" animate="visible">
          <motion.span variants={fadeUp} custom={0} className="text-primary text-sm font-medium uppercase tracking-wider">
            Portfólio
          </motion.span>
          <motion.h1 variants={fadeUp} custom={1} className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">
            Projetos que entregam resultado
          </motion.h1>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p, i) => (
            <motion.div
              key={p.title}
              className="glass rounded-xl overflow-hidden group hover:card-glow transition-all"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <div className="h-40 bg-gradient-purple/20 flex items-center justify-center">
                <span className="font-display text-2xl font-bold text-primary/40">{p.title.charAt(0)}</span>
              </div>
              <div className="p-6">
                <span className="text-xs text-primary font-medium uppercase tracking-wider">{p.category}</span>
                <h3 className="font-display text-lg font-semibold mt-1 mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
