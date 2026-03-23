import type { BrandProjectStatus } from "@/types/brand-studio";

export const BRAND_STUDIO_MODULE = "brand_studio";

export const BRAND_STUDIO_ROLES = ["brand_admin", "brand_designer", "brand_reviewer"] as const;

export const BRAND_STUDIO_BUCKETS = [
  "brand-references",
  "brand-generated",
  "brand-final",
  "brand-pdf",
] as const;

export const BRAND_STUDIO_ROUTES = [
  {
    label: "Visao Geral",
    description: "Painel central e saude do dominio",
    path: "/admin/brand-studio",
  },
  {
    label: "Projetos",
    description: "Gestao dos projetos de branding",
    path: "/admin/brand-studio/projetos",
  },
  {
    label: "Briefings",
    description: "Definicoes e requisitos de marca",
    path: "/admin/brand-studio/briefings",
  },
  {
    label: "Prompts",
    description: "Agentes, modelos e execucoes de IA",
    path: "/admin/brand-studio/prompts",
  },
  {
    label: "Apresentacoes",
    description: "Versoes prontas para entrega e PDF",
    path: "/admin/brand-studio/apresentacoes",
  },
  {
    label: "Assets",
    description: "Referencias, gerados e finais",
    path: "/admin/brand-studio/assets",
  },
  {
    label: "Configuracoes",
    description: "Politicas, roles e parametros do dominio",
    path: "/admin/brand-studio/configuracoes",
  },
] as const;

export const BRAND_PROJECT_STATUS_BADGE: Record<BrandProjectStatus, string> = {
  planejamento: "bg-muted text-muted-foreground",
  briefing: "bg-primary/10 text-primary",
  producao: "bg-secondary text-secondary-foreground",
  revisao: "bg-amber-500/15 text-amber-400",
  aprovado: "bg-emerald-500/15 text-emerald-400",
  arquivado: "bg-muted text-muted-foreground",
};
