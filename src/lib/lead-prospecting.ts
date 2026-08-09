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

interface FunctionErrorWithContext {
  context?: Response;
}

interface NominatimPlace {
  place_id?: number;
  osm_id?: number;
  osm_type?: "node" | "way" | "relation";
  display_name?: string;
  category?: string;
  type?: string;
  lat?: string;
  lon?: string;
  namedetails?: Record<string, string>;
  extratags?: Record<string, string>;
  address?: Record<string, string>;
}

function mapNominatimPlace(place: NominatimPlace, fallbackCity: string, fallbackNiche: string): LeadProspect {
  const tags = place.extratags || {};
  const address = place.address || {};
  const osmPrefix = place.osm_type === "node" ? "N" : place.osm_type === "way" ? "W" : "R";
  return {
    id: `${osmPrefix}${place.osm_id || place.place_id}`,
    name: place.namedetails?.name || String(place.display_name || "").split(",")[0] || fallbackNiche,
    segment: place.type || place.category || fallbackNiche,
    address: place.display_name || "",
    city: address.city || address.town || address.municipality || address.village || fallbackCity,
    phone: tags.phone || tags["contact:phone"] || tags.mobile || "",
    website: tags.website || tags["contact:website"] || "",
    instagram: tags["contact:instagram"] || "",
    openingHours: tags.opening_hours || "",
    latitude: String(place.lat || ""),
    longitude: String(place.lon || ""),
    mapUrl: `https://www.openstreetmap.org/${place.osm_type || "node"}/${place.osm_id || ""}`,
  };
}

async function searchDirectly(city: string, niche: string, limit: number) {
  const params = new URLSearchParams({
    format: "jsonv2",
    q: `${niche}, ${city}, Brasil`,
    addressdetails: "1",
    extratags: "1",
    namedetails: "1",
    countrycodes: "br",
    layer: "poi,address",
    limit: String(Math.min(Math.max(limit, 1), 20)),
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { "Accept-Language": "pt-BR,pt;q=0.9", Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Fonte de pesquisa indisponível (${response.status})`);
  const places = await response.json() as NominatimPlace[];
  return {
    prospects: places.map((place) => mapNominatimPlace(place, city, niche)),
    attribution: "Dados de locais: OpenStreetMap contributors (ODbL)",
  };
}

export async function searchLeadProspects(city: string, niche: string, limit = 12) {
  const { data, error } = await supabase.functions.invoke("prospectar-leads", {
    body: { city, niche, limit },
  });
  if (error) {
    const status = (error as FunctionErrorWithContext).context?.status;
    if (status === 404) return searchDirectly(city, niche, limit);
    throw error;
  }
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
