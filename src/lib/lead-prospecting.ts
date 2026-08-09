import { supabase } from "@/integrations/supabase/client";
import type { LeadImportRow } from "@/lib/lead-import";

export type ProspectOffer = "site" | "automation" | "system";

export interface LeadProspect {
  id: string;
  name: string;
  segment: string;
  address: string;
  city: string;
  phone: string;
  website: string;
  openingHours: string;
  latitude: string;
  longitude: string;
  mapUrl: string;
  rating: number;
  reviewCount: number;
  businessStatus: string;
  successScore: number;
  successLabel: "Alta" | "Média" | "Baixa";
  scoreReasons: string[];
  suggestedOffer: ProspectOffer;
  suggestedProject: string;
  projectSummary: string;
  readyMessage: string;
}
export const PROSPECT_NICHES = [
  "Academias", "Advocacia", "Clínicas e consultórios", "Construção civil",
  "Contabilidade", "Escolas e cursos", "Estética e beleza", "Imobiliárias",
  "Lojas e comércio", "Oficinas automotivas", "Pet shops e veterinárias",
  "Restaurantes e alimentação",
] as const;

interface FunctionErrorWithContext { context?: Response }

export async function searchLeadProspects(city: string, niche: string, limit = 60) {
  const { data, error } = await supabase.functions.invoke("prospectar-leads", {
    body: { city, niche, limit, withoutWebsite: true },
  });
  if (error) {
    const status = (error as FunctionErrorWithContext).context?.status;
    if (status === 503) throw new Error("A busca Google Maps ainda não foi configurada. Cadastre GOOGLE_MAPS_API_KEY nos secrets do Supabase.");
    throw new Error(status === 401 || status === 403 ? "Sua sessão não tem permissão para prospectar leads." : "A busca Google Maps está indisponível no momento.");
  }
  if (data?.error) throw new Error(data.error);
  return {
    prospects: (data?.prospects || []) as LeadProspect[],
    attribution: String(data?.attribution || "Google Maps Platform"),
    totalFetched: Number(data?.totalFetched || 0),
    resultLimit: Number(data?.resultLimit || 60),
  };
}

export function prospectToLeadImport(prospect: LeadProspect, niche: string): LeadImportRow {
  const safeId = prospect.id.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase() || crypto.randomUUID();
  return {
    name: prospect.name,
    company: prospect.name,
    email: `prospect-${safeId}@sem-email.local`,
    phone: prospect.phone,
    city: prospect.city,
    niche,
    projectType: prospect.suggestedOffer === "site" ? "Landing page / Site institucional" : prospect.suggestedOffer === "automation" ? "Automação / IA" : "Sistema personalizado",
    objective: `${prospect.projectSummary}\n\nProbabilidade comercial estimada: ${prospect.successScore}% (${prospect.successLabel}).\nMotivos: ${prospect.scoreReasons.join("; ")}\n\nMensagem sugerida:\n${prospect.readyMessage}`,
    address: prospect.address,
    website: prospect.website,
    instagram: "",
    source: "google_places",
  };
}
