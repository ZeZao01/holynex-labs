import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROMPT_VERSION = "v6.0-single-pass";

// ═══════════════════════════════════════════════
// AI PROVIDER CONFIG
// ═══════════════════════════════════════════════

interface AIProvider {
  name: string;
  url: string;
  apiKey: string;
  model: string;
  headers?: Record<string, string>;
}

function getProviders(): AIProvider[] {
  const providers: AIProvider[] = [];

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (lovableKey) {
    providers.push({
      name: "Lovable AI",
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      apiKey: lovableKey,
      model: "google/gemini-2.5-flash",
    });
  }

  const gensparkKey = Deno.env.get("GENSPARK_API_KEY");
  if (gensparkKey) {
    providers.push({
      name: "Genspark",
      url: "https://api.genspark.ai/v1/chat/completions",
      apiKey: gensparkKey,
      model: "genspark-lite",
    });
  }

  const groqKey = Deno.env.get("GROQ_API_KEY");
  if (groqKey) {
    providers.push({
      name: "Groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: groqKey,
      model: "llama-3.3-70b-versatile",
    });
  }

  const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
  if (openrouterKey) {
    providers.push({
      name: "OpenRouter",
      url: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: openrouterKey,
      model: "google/gemini-2.5-flash",
      headers: {
        "HTTP-Referer": "https://holynexlabs.com.br",
        "X-Title": "HolyNex Labs Proposals",
      },
    });
  }

  return providers;
}

async function callAI(messages: any[], temp = 0.3): Promise<string> {
  const providers = getProviders();
  if (providers.length === 0) throw new Error("Nenhum provedor de IA configurado.");

  for (const provider of providers) {
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
        ...(provider.headers || {}),
      };

      console.log(`[gerar-proposta] Trying ${provider.name} (${provider.model})`);
      const response = await fetch(provider.url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature: temp,
          max_tokens: 8000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[gerar-proposta] ${provider.name} [${response.status}]: ${errorText}`);
        continue; // Try next provider
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        console.error(`[gerar-proposta] ${provider.name}: empty response`);
        continue;
      }
      console.log(`[gerar-proposta] ${provider.name} succeeded`);
      return content;
    } catch (err) {
      console.error(`[gerar-proposta] ${provider.name} failed:`, err);
    }
  }
  throw new Error("Todos os provedores falharam.");
}

function cleanJson(content: string): any {
  let cleaned = content.trim();
  cleaned = cleaned.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (m) => (m === "\n" || m === "\r" || m === "\t" ? m : ""));
  return JSON.parse(cleaned);
}

// ═══════════════════════════════════════════════
// SINGLE-PASS PROMPT (replaces 4-agent pipeline)
// ═══════════════════════════════════════════════

const SYSTEM_PROMPT = `Voce e o motor de propostas comerciais da HolyNex Labs, empresa de desenvolvimento de software sob medida.

Analise o pedido do cliente e gere uma proposta COMPLETA em uma unica resposta JSON.

Regras de precificacao:
- Valor minimo de projeto: R$ 3.000
- Modulos base: R$ 800-2.500 cada
- Integracoes: R$ 500-1.500 cada
- Area administrativa: R$ 1.500-4.000
- Login/autenticacao: R$ 800-2.000
- Dashboard/relatorios: R$ 1.200-3.500
- IA/automacao: R$ 2.000-8.000
- App mobile: +40% sobre valor base
- Manutencao mensal: 8-15% do valor total

Estilo: consultivo, profissional, sem exageros. Use fontes REAIS (Gartner, McKinsey, Harvard, Forrester - 2023-2025).

OUTPUT JSON (responda APENAS este JSON, nada mais):
{
  "resumo_executivo": "string max 800 chars - narrativa contexto->dor->solucao",
  "tipo_projeto": "string - classificacao (SaaS, ERP, CRM, Landing Page, etc)",
  "diagnostico": "string max 600 chars - analise do problema no segmento",
  "solucao_proposta": "string max 600 chars - visao da solucao",
  "escopo": ["modulos do projeto"],
  "funcionalidades": ["funcionalidades principais"],
  "funcionalidades_recomendadas": ["evolucoes futuras"],
  "complexidade": "baixa|media|alta|avancada",
  "analise_estrategica": "string max 600 chars - impacto estrategico",
  "estimativa_esforco": "string max 200 chars",
  "financeiro": {
    "valor_minimo": 0,
    "valor_ideal": 0,
    "valor_premium": 0,
    "classificacao_margem": "margem_saudavel|margem_apertada|margem_premium"
  },
  "cronograma": "string max 300 chars",
  "manutencao": "string max 300 chars",
  "riscos": ["riscos identificados"],
  "proximos_passos": ["etapas para iniciar"],
  "proposta_comercial": "string - texto resumido da proposta",
  "niche_intelligence": {
    "segment_detected": "string",
    "kpis": [{"label": "string", "metric": "string"}],
    "risk_matrix": [{"title": "string", "impact": "string", "mitigation": "string", "severity": "alto|medio|baixo"}],
    "strategic_benefits": [{"title": "string", "desc": "string com referencia real"}],
    "timeline_phases": [{"title": "FASE 01", "subtitle": "string", "desc": "atividades"}],
    "scope_labels": {"landing": "string", "user": "string", "admin": "string"},
    "investment_justification": "string com fonte real",
    "expert_reference": "string referencia bibliografica",
    "maintenance_features": ["items"]
  }
}

Use apenas caracteres ASCII seguros. Responda APENAS JSON.`;

function buildUserPrompt(body: Record<string, any>): string {
  return `Gere a proposta comercial completa para:
CLIENTE: ${body.nome_cliente || "N/I"}
EMPRESA: ${body.empresa_cliente || "N/I"}
SEGMENTO: ${body.segmento || "N/I"}
EMAIL: ${body.email_cliente || "N/I"}
TIPO: ${body.tipo_projeto || "N/I"}
DESCRICAO: ${body.descricao_projeto || "N/I"}
PROBLEMA: ${body.problema_cliente || "N/I"}
OBJETIVO: ${body.objetivo_cliente || "N/I"}
FUNCIONALIDADES: ${Array.isArray(body.funcionalidades_desejadas) ? body.funcionalidades_desejadas.join(", ") : body.funcionalidades_desejadas || "N/I"}
INTEGRACOES: ${Array.isArray(body.integracoes) ? body.integracoes.join(", ") : body.integracoes || "N/I"}
USUARIOS: ${body.numero_usuarios || "N/I"}
PRAZO: ${body.prazo_desejado || "N/I"}
ORCAMENTO: ${body.orcamento_cliente || "N/I"}
URGENCIA: ${body.nivel_urgencia || "medio"}
LINK: ${body.link_referencia || "N/I"}
OBS: ${body.observacoes || "N/I"}

IMPORTANTE: Os valores financeiros devem ser realistas para o escopo descrito. Retorne APENAS o JSON.`;
}

// ═══════════════════════════════════════════════
// SERVE
// ═══════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    console.log(`[gerar-proposta] Starting single-pass generation for: ${body.nome_cliente || "unknown"}`);

    const providers = getProviders();
    if (providers.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum provedor de IA configurado." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const raw = await callAI([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(body) },
    ], 0.3);

    const proposta = cleanJson(raw);
    const durationMs = Date.now() - startTime;
    console.log(`[gerar-proposta] Completed in ${durationMs}ms`);

    return new Response(JSON.stringify({
      proposta,
      document_spec: null,
      pricing_sheet: null,
      _meta: {
        provider_used: "single-pass",
        model_used: "auto",
        prompt_version: PROMPT_VERSION,
        duration_ms: durationMs,
        output_size: JSON.stringify(proposta).length,
        niche_detected: proposta?.niche_intelligence?.segment_detected || "generico",
        pipeline_steps: ["single-pass"],
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[gerar-proposta] Error:", e);
    const durationMs = Date.now() - startTime;

    if (e instanceof Error && (e.message.includes("429") || e.message.includes("402"))) {
      return new Response(
        JSON.stringify({ error: "Limite de requisicoes excedido. Tente novamente em alguns segundos.", _meta: { prompt_version: PROMPT_VERSION, duration_ms: durationMs } }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido", _meta: { prompt_version: PROMPT_VERSION, duration_ms: durationMs } }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
