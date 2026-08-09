import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

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

function clean(value: unknown, maxLength: number) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo nao permitido" }), { status: 405, headers: jsonHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const authHeader = req.headers.get("Authorization") || "";
    if (!supabaseUrl || !anonKey || !authHeader) {
      return new Response(JSON.stringify({ error: "Usuario nao autenticado" }), { status: 401, headers: jsonHeaders });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuario nao autenticado" }), { status: 401, headers: jsonHeaders });
    }

    const { data: isAdmin, error: adminError } = await userClient.rpc("is_admin", { _user_id: user.id });
    if (adminError || !isAdmin) {
      return new Response(JSON.stringify({ error: "Acesso restrito ao administrador HolyNex" }), { status: 403, headers: jsonHeaders });
    }

    const body = await req.json();
    const city = clean(body.city, 100);
    const niche = clean(body.niche, 100);
    const limit = Math.min(Math.max(Number(body.limit) || 12, 1), 20);
    if (city.length < 2 || niche.length < 2) {
      return new Response(JSON.stringify({ error: "Informe cidade e segmento" }), { status: 400, headers: jsonHeaders });
    }

    const params = new URLSearchParams({
      format: "jsonv2",
      q: `${niche}, ${city}, Brasil`,
      addressdetails: "1",
      extratags: "1",
      namedetails: "1",
      countrycodes: "br",
      layer: "poi,address",
      limit: String(limit),
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        "User-Agent": "HolyNexLabsLeadResearch/1.0 (https://www.holynexlabs.com.br)",
        "Accept-Language": "pt-BR,pt;q=0.9",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Fonte de pesquisa indisponivel (${response.status})`);
    }

    const places = await response.json();
    const prospects = (Array.isArray(places) ? places as NominatimPlace[] : []).map((place) => {
      const tags = place.extratags || {};
      const address = place.address || {};
      const osmPrefix = place.osm_type === "node" ? "N" : place.osm_type === "way" ? "W" : "R";
      const id = `${osmPrefix}${place.osm_id || place.place_id}`;
      return {
        id,
        name: place.namedetails?.name || String(place.display_name || "").split(",")[0] || niche,
        segment: place.type || place.category || niche,
        address: place.display_name || "",
        city: address.city || address.town || address.municipality || address.village || city,
        phone: tags.phone || tags["contact:phone"] || tags.mobile || "",
        website: tags.website || tags["contact:website"] || "",
        instagram: tags["contact:instagram"] || "",
        openingHours: tags.opening_hours || "",
        latitude: String(place.lat || ""),
        longitude: String(place.lon || ""),
        mapUrl: `https://www.openstreetmap.org/${place.osm_type || "node"}/${place.osm_id || ""}`,
      };
    });

    return new Response(JSON.stringify({
      prospects,
      attribution: "Dados de locais: OpenStreetMap contributors (ODbL)",
      query: { city, niche },
    }), { headers: jsonHeaders });
  } catch (error) {
    console.error("prospectar-leads error", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Erro ao pesquisar potenciais clientes",
    }), { status: 500, headers: jsonHeaders });
  }
});
