import RevealBox from "@/components/RevealBox";

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
    <div className="min-h-screen pt-28 pb-16 relative z-10">
      <div className="container mx-auto px-4">
        <RevealBox className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">Portfólio</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">Projetos que entregam resultado</h1>
        </RevealBox>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p, i) => (
            <RevealBox key={p.title} delay={i * 0.08} className="card-animated glass rounded-2xl overflow-hidden group">
              <div className="h-44 bg-gradient-purple/10 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-purple/5 group-hover:bg-gradient-purple/15 transition-all duration-500" />
                <span className="font-display text-5xl font-bold text-primary/20 group-hover:text-primary/40 group-hover:scale-125 transition-all duration-500">{p.title.charAt(0)}</span>
              </div>
              <div className="p-6">
                <span className="text-xs text-primary font-medium uppercase tracking-widest">{p.category}</span>
                <h3 className="font-display text-lg font-semibold mt-1 mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>
            </RevealBox>
          ))}
        </div>
      </div>
    </div>
  );
}
