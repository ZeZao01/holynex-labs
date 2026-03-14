/**
 * Niche Intelligence for PDF Generation.
 * Extracts AI-generated niche data from proposta_json first,
 * falling back to minimal defaults only when AI data is missing.
 */

export interface NicheProfile {
  segment: string;
  kpis: { icon: string; label: string; metric: string }[];
  risks: { title: string; impact: string; mitigation: string; severity: "alto" | "medio" | "baixo" }[];
  strategicBenefits: { title: string; desc: string }[];
  maintenanceFeatures: string[];
  timelinePhases: { title: string; subtitle: string; desc: string }[];
  scopeLabels: { landing: string; user: string; admin: string };
  investmentJustification: string;
  expertReference: string;
}

// Minimal fallback — only used when AI didn't generate niche_intelligence
const FALLBACK_PROFILE: NicheProfile = {
  segment: "Tecnologia",
  kpis: [
    { icon: "#", label: "Eficiência Operacional", metric: "+45%" },
    { icon: "#", label: "Tempo de Processos", metric: "-40%" },
    { icon: "#", label: "Automação", metric: "+60%" },
    { icon: "#", label: "Satisfação do Usuário", metric: "90+" },
  ],
  risks: [
    { title: "Atraso no Desenvolvimento", impact: "Prazo comprometido", mitigation: "Sprints semanais + buffer de tempo", severity: "medio" },
    { title: "Mudança de Escopo", impact: "Custos adicionais", mitigation: "Documentação aprovada no kick-off", severity: "medio" },
    { title: "Integração com Terceiros", impact: "Dados inconsistentes", mitigation: "Ambiente de staging isolado para testes", severity: "baixo" },
  ],
  strategicBenefits: [
    { title: "Automação de Processos", desc: "Empresas que automatizam processos economizam 30% em custos (Gartner, 2024)." },
    { title: "Experiência do Usuário", desc: "Interfaces intuitivas aumentam adoção em 45% (Forrester, 2023)." },
    { title: "Dados para Decisão", desc: "Dashboards executivos para tomada de decisão baseada em evidências." },
  ],
  maintenanceFeatures: ["Correções de bugs", "Pequenos ajustes visuais", "Monitoramento de servidor", "Relatórios mensais"],
  timelinePhases: [
    { title: "FASE 01", subtitle: "Planejamento e Setup", desc: "Kickoff e alinhamento de escopo\nConfiguração de ambiente\nDesign da interface (UI/UX)\nEstruturação do banco de dados" },
    { title: "FASE 02", subtitle: "Desenvolvimento e Entrega", desc: "Desenvolvimento das funcionalidades\nImplementação da área administrativa\nIntegrações e automações\nTestes (QA), ajustes e Go-live" },
  ],
  scopeLabels: { landing: "Landing Page", user: "Painel de Usuários", admin: "Painel Administrativo" },
  investmentJustification: "Segundo a Gartner (2024), empresas que investem em sistemas digitais personalizados têm ROI médio de 3x no primeiro ano.",
  expertReference: "Ref: Gartner - Technology Investment Outlook (2024); Forrester - Digital Experience Report (2023)",
};

/**
 * Extract niche profile from AI-generated proposta_json.
 * The AI now generates a `niche_intelligence` object with all needed data.
 * Falls back to minimal defaults only when AI data is absent.
 */
export function getNicheProfile(proposta: {
  segmento?: string | null;
  tipo_projeto?: string;
  descricao_projeto?: string;
  proposta_json?: any;
}): NicheProfile {
  // Try to extract AI-generated niche intelligence from proposta_json
  const pj = proposta.proposta_json;
  const ni = pj?.niche_intelligence;

  if (ni && typeof ni === "object") {
    return {
      segment: ni.segment_detected || proposta.segmento || FALLBACK_PROFILE.segment,
      kpis: Array.isArray(ni.kpis) && ni.kpis.length >= 3
        ? ni.kpis.map((k: any) => ({ icon: "#", label: k.label || "", metric: k.metric || "" }))
        : FALLBACK_PROFILE.kpis,
      risks: Array.isArray(ni.risk_matrix) && ni.risk_matrix.length >= 2
        ? ni.risk_matrix.map((r: any) => ({
            title: r.title || "",
            impact: r.impact || "",
            mitigation: r.mitigation || "",
            severity: (r.severity === "alto" || r.severity === "medio" || r.severity === "baixo") ? r.severity : "medio",
          }))
        : FALLBACK_PROFILE.risks,
      strategicBenefits: Array.isArray(ni.strategic_benefits) && ni.strategic_benefits.length >= 2
        ? ni.strategic_benefits.map((b: any) => ({ title: b.title || "", desc: b.desc || "" }))
        : FALLBACK_PROFILE.strategicBenefits,
      maintenanceFeatures: Array.isArray(ni.maintenance_features) && ni.maintenance_features.length >= 2
        ? ni.maintenance_features
        : FALLBACK_PROFILE.maintenanceFeatures,
      timelinePhases: Array.isArray(ni.timeline_phases) && ni.timeline_phases.length >= 2
        ? ni.timeline_phases.map((p: any) => ({
            title: p.title || "",
            subtitle: p.subtitle || "",
            desc: p.desc || "",
          }))
        : FALLBACK_PROFILE.timelinePhases,
      scopeLabels: ni.scope_labels && typeof ni.scope_labels === "object"
        ? {
            landing: ni.scope_labels.landing || FALLBACK_PROFILE.scopeLabels.landing,
            user: ni.scope_labels.user || FALLBACK_PROFILE.scopeLabels.user,
            admin: ni.scope_labels.admin || FALLBACK_PROFILE.scopeLabels.admin,
          }
        : FALLBACK_PROFILE.scopeLabels,
      investmentJustification: ni.investment_justification || FALLBACK_PROFILE.investmentJustification,
      expertReference: ni.expert_reference || FALLBACK_PROFILE.expertReference,
    };
  }

  // No AI niche data — use fallback with segment from proposta
  return {
    ...FALLBACK_PROFILE,
    segment: proposta.segmento || FALLBACK_PROFILE.segment,
  };
}
