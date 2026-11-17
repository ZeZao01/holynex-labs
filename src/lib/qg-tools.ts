import { BrainCircuit, Clapperboard, Database, FileCode2, Palette, Radar, Workflow } from "lucide-react";

export const QG_TOOLS = [
  {
    name: "HolyNex Leads",
    description: "Captação, qualificação, análise, prompt, proposta e conversão em projeto.",
    status: "integrado",
    href: "/admin/orcamentos",
    icon: Radar,
  },
  {
    name: "Brand Studio AI",
    description: "Briefing de marca, estratégia, paleta, tipografia, conceitos e peças.",
    status: "integrado",
    href: "/admin/brand-studio",
    icon: Palette,
  },
  {
    name: "QG Brain",
    description: "Conhecimento local, memória, fontes e apoio às decisões do QG.",
    status: "aplicativo local",
    href: "http://127.0.0.1:5181/",
    localOnly: true,
    icon: BrainCircuit,
  },
  {
    name: "Fluxo Content Operations",
    description: "Biblioteca de mídia, edição em lote, aprovação e calendário editorial.",
    status: "aplicativo local",
    href: "http://127.0.0.1:5191/",
    localOnly: true,
    icon: Clapperboard,
  },
  {
    name: "Prompt Studio",
    description: "Briefs personalizados para Codex, Stitch e outras IAs.",
    status: "integrado por lead",
    href: "/admin/orcamentos",
    icon: FileCode2,
  },
  {
    name: "Supabase Core",
    description: "Autenticação, dados, storage, funções e políticas do sistema principal.",
    status: "infraestrutura",
    href: "/admin/configuracoes",
    icon: Database,
  },
] as const;

export const QG_FLOW = [
  "Captar e revisar o lead",
  "Qualificar e gerar diagnóstico",
  "Criar prompt personalizado",
  "Preparar e aprovar proposta",
  "Converter em projeto",
  "Executar marca, produto e conteúdo",
  "Entregar, manter e registrar aprendizados",
];

export const QG_CAPABILITIES = [
  "Sites, landing pages e sistemas",
  "SaaS, Supabase e automações",
  "Brand Studio e identidade digital",
  "Pesquisa, copy e campanhas",
  "Vídeos, mídia e operação social",
  "Propostas, escopo e documentação",
  "QA visual, testes e handoff",
  "Conhecimento, memória e decisões",
];
