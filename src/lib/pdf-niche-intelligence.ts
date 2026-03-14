/**
 * Niche Intelligence — Pure extraction layer.
 * Extracts AI-generated niche data from proposta_json.
 * NO hardcoded profiles or fallback content.
 * All content must come from the AI generation.
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

/**
 * Extract niche profile directly from AI-generated proposta_json.
 * Returns empty arrays/strings when AI data is absent — never injects pre-built content.
 */
export function getNicheProfile(proposta: {
  segmento?: string | null;
  tipo_projeto?: string;
  descricao_projeto?: string;
  proposta_json?: any;
}): NicheProfile {
  const pj = proposta.proposta_json;
  const ni = pj?.niche_intelligence;

  const segment = ni?.segment_detected || proposta.segmento || pj?.tipo_projeto || "Tecnologia";

  return {
    segment,
    kpis: Array.isArray(ni?.kpis)
      ? ni.kpis.map((k: any) => ({ icon: "#", label: k.label || "", metric: k.metric || "" }))
      : [],
    risks: Array.isArray(ni?.risk_matrix)
      ? ni.risk_matrix.map((r: any) => ({
          title: r.title || "",
          impact: r.impact || "",
          mitigation: r.mitigation || "",
          severity: (r.severity === "alto" || r.severity === "medio" || r.severity === "baixo") ? r.severity : "medio",
        }))
      : [],
    strategicBenefits: Array.isArray(ni?.strategic_benefits)
      ? ni.strategic_benefits.map((b: any) => ({ title: b.title || "", desc: b.desc || "" }))
      : [],
    maintenanceFeatures: Array.isArray(ni?.maintenance_features)
      ? ni.maintenance_features
      : [],
    timelinePhases: Array.isArray(ni?.timeline_phases)
      ? ni.timeline_phases.map((p: any) => ({
          title: p.title || "",
          subtitle: p.subtitle || "",
          desc: p.desc || "",
        }))
      : [],
    scopeLabels: ni?.scope_labels && typeof ni.scope_labels === "object"
      ? {
          landing: ni.scope_labels.landing || "Landing Page",
          user: ni.scope_labels.user || "Painel do Usuário",
          admin: ni.scope_labels.admin || "Painel Administrativo",
        }
      : { landing: "Landing Page", user: "Painel do Usuário", admin: "Painel Administrativo" },
    investmentJustification: ni?.investment_justification || "",
    expertReference: ni?.expert_reference || "",
  };
}
