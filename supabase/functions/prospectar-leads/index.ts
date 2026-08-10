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

type OfferMode = "marketing" | "ti" | "software";

class PublicError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

const clean = (value: unknown, max: number) => String(value || "").trim().replace(/\s+/g, " ").slice(0, max);

function scorePlace(place: GooglePlace, offerMode: OfferMode) {
  const rating = Number(place.rating || 0);
  const reviews = Number(place.userRatingCount || 0);
  let score = offerMode === "software" ? 24 : offerMode === "ti" ? 38 : 34;
  const reasons = ["não possui site cadastrado no Google"];
  if (rating >= 4.5) { score += offerMode === "ti" ? 8 : 16; reasons.push("avaliação excelente"); }
  else if (rating >= 4) { score += offerMode === "ti" ? 5 : 12; reasons.push("avaliação positiva"); }
  else if (rating >= 3.5) { score += 7; reasons.push("reputação com espaço para melhoria"); }
  else if (rating > 0) { score += 3; reasons.push("avaliação abaixo da média"); }
  if (reviews >= 250) { score += offerMode === "software" ? 36 : 22; reasons.push("alto volume de avaliações"); }
  else if (reviews >= 100) { score += offerMode === "software" ? 29 : 18; reasons.push("volume relevante de avaliações"); }
  else if (reviews >= 30) { score += offerMode === "software" ? 20 : 12; reasons.push("demanda local comprovada"); }
  else if (reviews >= 10) { score += offerMode === "software" ? 10 : 6; reasons.push("presença local em crescimento"); }
  if (place.nationalPhoneNumber) { score += 8; reasons.push("telefone disponível para contato"); }
  if (place.businessStatus === "OPERATIONAL") score += 4;
  if (offerMode === "ti") reasons.push("oportunidade de domínio, e-mail, segurança e suporte");
  if (offerMode === "software" && reviews >= 100) reasons.push("volume indica potencial de automação operacional");
  score = Math.min(96, score);
  return { score, reasons, label: score >= 75 ? "Alta" : score >= 55 ? "Média" : "Baixa" } as const;
}

function offerFor(place: GooglePlace, niche: string, offerMode: OfferMode) {
  const name = clean(place.displayName?.text, 140);
  const reviews = Number(place.userRatingCount || 0);
  const rating = Number(place.rating || 0);
  const suggestedOffer = offerMode === "software" ? "system" : offerMode === "ti" ? "automation" : "site";
  const suggestedProject = offerMode === "software"
    ? "Sistema de atendimento e operação sob medida"
    : offerMode === "ti"
      ? "Infraestrutura digital + suporte gerenciado"
      : "Site institucional de alta conversão";
  const projectSummary = offerMode === "software"
    ? `${suggestedProject} para ${name}, com captação organizada, agenda ou pedidos, histórico de clientes, automações de WhatsApp e painel de indicadores adequado a ${niche.toLowerCase()}.`
    : offerMode === "ti"
      ? `${suggestedProject} para ${name}, reunindo domínio e e-mails profissionais, presença web, backup, segurança, organização de acessos e suporte recorrente.`
      : `${suggestedProject} para ${name}, posicionado especificamente para ${niche.toLowerCase()}, com serviços, localização, prova social (${rating.toFixed(1)} no Google), botão de WhatsApp e SEO local.`;
  const readyMessages = offerMode === "software"
    ? [
      `Olá! Vi que a ${name} já tem ${reviews} avaliações no Google — isso indica um volume importante de clientes. Desenvolvemos sistemas sob medida para organizar atendimento, agenda e acompanhamento sem depender de planilhas. Posso te mostrar uma ideia aplicada a ${niche.toLowerCase()}?`,
      `Olá! Ao analisar a ${name}, identifiquei potencial para automatizar atendimento e rotina operacional. Preparei um escopo inicial de sistema para ${niche.toLowerCase()}, com WhatsApp, agenda e indicadores. Posso enviar sem compromisso?`,
    ]
    : offerMode === "ti"
      ? [
        `Olá! Encontrei a ${name} no Google e notei que ainda não há site próprio cadastrado. Ajudamos negócios de ${niche.toLowerCase()} com domínio, e-mail profissional, segurança, backup e suporte. Posso fazer um diagnóstico inicial sem custo?`,
        `Olá! A ${name} tem ${reviews} avaliações no Google${rating ? ` e nota ${rating.toFixed(1)}` : ""}. Preparei uma sugestão de infraestrutura digital para transformar essa reputação em mais credibilidade e reduzir riscos de TI. Posso enviar?`,
      ]
      : [
        `Olá! Encontrei a ${name} ao pesquisar por ${niche.toLowerCase()} no Google e vi que vocês têm ${reviews} avaliações${rating ? `, com nota ${rating.toFixed(1)}` : ""} — uma reputação que merece uma presença digital própria. Preparei uma ideia de ${suggestedProject.toLowerCase()} para transformar essas buscas em contatos pelo WhatsApp. Posso enviar uma prévia sem compromisso?`,
        `Olá! Vi a ${name} no Google e percebi que ainda não há um site próprio cadastrado. Montei uma ideia rápida para apresentar os serviços, avaliações e contato pelo WhatsApp de forma profissional. Posso te mostrar?`,
      ];
  return { suggestedOffer, suggestedProject, projectSummary, readyMessage: readyMessages[0], readyMessages };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Método não permitido" }), { status: 405, headers: jsonHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    let googleKey = "";
    try {
      googleKey = Deno.env.get("GOOGLE_MAPS_API_KEY") || "";
    } catch (secretError) {
      console.error("GOOGLE_MAPS_API_KEY could not be read", secretError instanceof Error ? secretError.name : "unknown");
      throw new PublicError(503, "GOOGLE_MAPS_SECRET_UNREADABLE", "A credencial do Google Maps não pôde ser lida. Regrave GOOGLE_MAPS_API_KEY e reimplante a função.");
    }
    const authHeader = req.headers.get("Authorization") || "";
    if (!googleKey) throw new PublicError(503, "GOOGLE_MAPS_NOT_CONFIGURED", "Google Places não configurado: defina GOOGLE_MAPS_API_KEY.");
    if (!supabaseUrl || !anonKey || !authHeader) return new Response(JSON.stringify({ error: "Usuário não autenticado" }), { status: 401, headers: jsonHeaders });
    const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await client.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Usuário não autenticado" }), { status: 401, headers: jsonHeaders });
    const { data: isAdmin } = await client.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Acesso restrito ao administrador HolyNex" }), { status: 403, headers: jsonHeaders });

    const body = await req.json();
    const city = clean(body.city, 100);
    const niche = clean(body.niche, 100);
    const offerMode: OfferMode = body.offerMode === "ti" || body.offerMode === "software" ? body.offerMode : "marketing";
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
      if (!response.ok) {
        const googleCode = clean(result?.error?.status, 80) || "GOOGLE_PLACES_ERROR";
        const status = response.status === 429 ? 429 : response.status === 400 ? 400 : 502;
        throw new PublicError(status, googleCode, clean(result?.error?.message, 500) || `Google Places indisponível (${response.status})`);
      }
      found.push(...(Array.isArray(result.places) ? result.places : []));
      pageToken = clean(result.nextPageToken, 500);
    } while (pageToken && found.length < limit);

    const prospects = found.filter((place) => !place.websiteUri && place.businessStatus !== "CLOSED_PERMANENTLY").slice(0, limit).map((place) => {
      const scoring = scorePlace(place, offerMode);
      const offer = offerFor(place, niche, offerMode);
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

    return new Response(JSON.stringify({ prospects, totalFetched: found.length, resultLimit: 60, offerMode, attribution: "Dados de estabelecimentos: Google Maps Platform. Resultados limitados pela API a até 60 por consulta." }), { headers: jsonHeaders });
  } catch (error) {
    console.error("prospectar-leads error", error);
    if (error instanceof PublicError) return new Response(JSON.stringify({ error: error.message, code: error.code }), { status: error.status, headers: jsonHeaders });
    return new Response(JSON.stringify({ error: "Erro interno ao pesquisar potenciais clientes", code: "PROSPECTING_INTERNAL_ERROR" }), { status: 500, headers: jsonHeaders });
  }
});
