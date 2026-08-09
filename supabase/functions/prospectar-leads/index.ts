import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
const fieldMask = [
  "places.id", "places.displayName", "places.formattedAddress", "places.nationalPhoneNumber",
  "places.websiteUri", "places.googleMapsUri", "places.location", "places.primaryTypeDisplayName",
  "places.regularOpeningHours", "places.rating", "places.userRatingCount", "places.businessStatus",
  "nextPageToken",
].join(",");

interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  location?: { latitude?: number; longitude?: number };
  primaryTypeDisplayName?: { text?: string };
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
}

const clean = (value: unknown, max: number) => String(value || "").trim().replace(/\s+/g, " ").slice(0, max);

function scorePlace(place: GooglePlace) {
  const rating = Number(place.rating || 0);
  const reviews = Number(place.userRatingCount || 0);
  let score = 30;
  const reasons = ["não possui site cadastrado no Google"];
  if (rating >= 4.5) { score += 24; reasons.push("avaliação excelente"); }
  else if (rating >= 4) { score += 18; reasons.push("avaliação positiva"); }
  else if (rating >= 3.5) { score += 10; reasons.push("reputação com espaço para melhoria"); }
  else if (rating > 0) { score += 4; reasons.push("avaliação abaixo da média"); }
  if (reviews >= 250) { score += 24; reasons.push("alto volume de avaliações"); }
  else if (reviews >= 100) { score += 19; reasons.push("volume relevante de avaliações"); }
  else if (reviews >= 30) { score += 13; reasons.push("demanda local comprovada"); }
  else if (reviews >= 10) { score += 7; reasons.push("presença local em crescimento"); }
  if (place.nationalPhoneNumber) { score += 8; reasons.push("telefone disponível para contato"); }
  if (place.businessStatus === "OPERATIONAL") score += 4;
  score = Math.min(96, score);
  return { score, reasons, label: score >= 75 ? "Alta" : score >= 55 ? "Média" : "Baixa" } as const;
}

function offerFor(place: GooglePlace, niche: string) {
  const name = clean(place.displayName?.text, 140);
  const reviews = Number(place.userRatingCount || 0);
  const rating = Number(place.rating || 0);
  const operational = /cl[ií]nica|consult[oó]rio|academia|est[eé]tica|oficina|restaurante|pet|veterin|escola/i.test(niche);
  const suggestedOffer = reviews >= 120 && operational ? "automation" : "site";
  const suggestedProject = suggestedOffer === "automation" ? "Site de conversão + atendimento automatizado" : "Site institucional de alta conversão";
  const projectSummary = suggestedOffer === "automation"
    ? `${suggestedProject} para ${name}, com apresentação de serviços, prova social das ${reviews} avaliações, captação de contatos e fluxo de atendimento/agendamento pelo WhatsApp.`
    : `${suggestedProject} para ${name}, com serviços, localização, prova social (${rating.toFixed(1)} no Google), botão de WhatsApp e estrutura preparada para SEO local.`;
  const readyMessage = `Olá! Encontrei a ${name} no Google e vi que vocês têm ${reviews} avaliações${rating ? `, com nota ${rating.toFixed(1)}` : ""} — uma reputação que merece uma presença digital própria. Preparei uma ideia de ${suggestedProject.toLowerCase()} para transformar essas buscas em contatos pelo WhatsApp. Posso te enviar uma prévia sem compromisso?`;
  return { suggestedOffer, suggestedProject, projectSummary, readyMessage };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Método não permitido" }), { status: 405, headers: jsonHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const googleKey = Deno.env.get("GOOGLE_MAPS_API_KEY") || "";
    const authHeader = req.headers.get("Authorization") || "";
    if (!googleKey) return new Response(JSON.stringify({ error: "Google Places não configurado: defina GOOGLE_MAPS_API_KEY." }), { status: 503, headers: jsonHeaders });
    if (!supabaseUrl || !anonKey || !authHeader) return new Response(JSON.stringify({ error: "Usuário não autenticado" }), { status: 401, headers: jsonHeaders });
    const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await client.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Usuário não autenticado" }), { status: 401, headers: jsonHeaders });
    const { data: isAdmin } = await client.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Acesso restrito ao administrador HolyNex" }), { status: 403, headers: jsonHeaders });

    const body = await req.json();
    const city = clean(body.city, 100);
    const niche = clean(body.niche, 100);
    const limit = Math.min(Math.max(Number(body.limit) || 60, 1), 60);
    if (city.length < 2 || niche.length < 2) return new Response(JSON.stringify({ error: "Informe cidade e segmento" }), { status: 400, headers: jsonHeaders });

    const found: GooglePlace[] = [];
    let pageToken = "";
    do {
      const payload: Record<string, unknown> = { textQuery: `${niche} em ${city}, Brasil`, pageSize: 20, languageCode: "pt-BR", regionCode: "BR" };
      if (pageToken) payload.pageToken = pageToken;
      const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Goog-Api-Key": googleKey, "X-Goog-FieldMask": fieldMask },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || `Google Places indisponível (${response.status})`);
      found.push(...(Array.isArray(result.places) ? result.places : []));
      pageToken = clean(result.nextPageToken, 500);
    } while (pageToken && found.length < limit);

    const prospects = found.filter((place) => !place.websiteUri && place.businessStatus !== "CLOSED_PERMANENTLY").slice(0, limit).map((place) => {
      const scoring = scorePlace(place);
      const offer = offerFor(place, niche);
      return {
        id: place.id || crypto.randomUUID(), name: place.displayName?.text || niche,
        segment: place.primaryTypeDisplayName?.text || niche, address: place.formattedAddress || "", city,
        phone: place.nationalPhoneNumber || "", website: "", openingHours: (place.regularOpeningHours?.weekdayDescriptions || []).join(" | "),
        latitude: String(place.location?.latitude || ""), longitude: String(place.location?.longitude || ""),
        mapUrl: place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName?.text || niche)}`,
        rating: Number(place.rating || 0), reviewCount: Number(place.userRatingCount || 0), businessStatus: place.businessStatus || "",
        successScore: scoring.score, successLabel: scoring.label, scoreReasons: scoring.reasons, ...offer,
      };
    }).sort((a, b) => b.successScore - a.successScore || b.reviewCount - a.reviewCount);

    return new Response(JSON.stringify({ prospects, totalFetched: found.length, resultLimit: 60, attribution: "Dados de estabelecimentos: Google Maps Platform. Resultados limitados pela API a até 60 por consulta." }), { headers: jsonHeaders });
  } catch (error) {
    console.error("prospectar-leads error", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro ao pesquisar potenciais clientes" }), { status: 500, headers: jsonHeaders });
  }
});
