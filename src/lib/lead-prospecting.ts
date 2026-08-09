import { supabase } from "@/integrations/supabase/client";
import type { LeadImportRow } from "@/lib/lead-import";

export interface LeadProspect {
  id: string;
  name: string;
  segment: string;
  address: string;
  city: string;
  phone: string;
  website: string;
  instagram: string;
  openingHours: string;
  latitude: string;
  longitude: string;
  mapUrl: string;
}

export const PROSPECT_NICHES = [
  "Academias",
  "Advocacia",
  "Clínicas e consultórios",
  "Construção civil",
  "Contabilidade",
  "Escolas e cursos",
  "Estética e beleza",
  "Imobiliárias",
  "Lojas e comércio",
  "Oficinas automotivas",
  "Pet shops e veterinárias",
  "Restaurantes e alimentação",
] as const;

export async function searchLeadProspects(city: string, niche: string, limit = 12) {
  const { data, error } = await supabase.functions.invoke("prospectar-leads", {
    body: { city, niche, limit },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return {
    prospects: (data?.prospects || []) as LeadProspect[],
    attribution: String(data?.attribution || ""),
  };
}

export function prospectToLeadImport(prospect: LeadProspect, niche: string): LeadImportRow {
  const safeId = prospect.id.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase() || crypto.randomUUID();
  const hasWebsite = Boolean(prospect.website);
  return {
    name: prospect.name,
    company: prospect.name,
    email: `prospect-${safeId}@sem-email.local`,
    phone: prospect.phone,
    city: prospect.city,
    niche,
    projectType: hasWebsite ? "Sistema interno" : "Landing page / Site institucional",
    objective: hasWebsite
      ? `Avaliar melhorias digitais e automações para ${prospect.name}.`
      : `${prospect.name} não possui site informado na fonte pesquisada; validar oportunidade de presença digital.`,
    address: prospect.address,
    website: prospect.website,
    instagram: prospect.instagram,
    source: "openstreetmap",
  };
}
