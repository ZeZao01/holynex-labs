import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getAiModelSettings,
  getAiProviderSettings,
  getPromptPolicies,
  resolveAiProviders,
  resolvePromptPolicy,
} from "../_shared/system-settings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROMPT_VERSION = "v7.0-full-structured";

// ═══════════════════════════════════════════════
// AI PROVIDER CALL
// ═══════════════════════════════════════════════

async function callAI(
  providers: { name: string; url: string; apiKey: string; model: string; headers?: Record<string, string> }[],
  messages: any[],
  temperature: number,
  maxTokens: number
): Promise<{ content: string; provider: string; model: string }> {
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
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[gerar-proposta] ${provider.name} [${response.status}]: ${errorText}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        console.error(`[gerar-proposta] ${provider.name}: empty response`);
        continue;
      }
      console.log(`[gerar-proposta] ${provider.name} succeeded`);
      return { content, provider: provider.name, model: provider.model };
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
// FULL STRUCTURED PROMPT v7.0
// ═══════════════════════════════════════════════

const SYSTEM_PROMPT = `Voce e o motor de propostas comerciais da HolyNex Labs, empresa de desenvolvimento de software sob medida.

Analise TODOS os dados do lead (descricao, nicho, objetivo, referencias visuais, analise arquitetural, modulos base, portfolio relacionado) e gere uma proposta COMPLETA e ESTRUTURADA em uma unica resposta JSON.

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
  "proposta": {
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
  },
  "structured_content": {
    "proposta_comercial": "string - narrativa comercial completa max 5000 chars",
    "visao_projeto": "string max 1200 chars - visao geral do projeto",
    "escopo_principal": ["modulos e areas do escopo"],
    "modulos_recomendados": ["modulos tecnicos recomendados"],
    "diferenciais": ["diferenciais competitivos"],
    "roadmap_macro": ["fases do roadmap"],
    "resumo_interno": "string max 1200 chars - resumo para equipe interna"
  },
  "pricing_sheet": {
    "setup_fee": 0,
    "monthly_fee": 0,
    "tier_starter": {"price": 0, "modules": ["string"], "days": 0},
    "tier_mvp": {"price": 0, "modules": ["string"], "days": 0},
    "tier_ideal": {"price": 0, "modules": ["string"], "days": 0},
    "tier_premium": {"price": 0, "modules": ["string"], "days": 0},
    "payment_options": ["formas de pagamento sugeridas"],
    "discount_conditions": "string - condicoes de desconto"
  },
  "stitch_prompt": "string - prompt tecnico para equipe montar o sistema descrito. Inclua: stack sugerida, arquitetura, integrações, prioridades de implementacao. Max 2000 chars.",
  "hidden_addons": [
    {
      "name": "string",
      "description": "string",
      "category": "string",
      "estimated_price": 0,
      "trigger_condition": "string - quando sugerir ao cliente",
      "priority": "alta|media|baixa"
    }
  ],
  "portfolio_refs": [
    {
      "reason": "string - por que este case e relevante",
      "niche_match": "string - nicho similar",
      "modules_shared": ["modulos em comum"]
    }
  ],
  "pdf_blueprint": {
    "cover_title": "string - titulo do documento",
    "cover_subtitle": "string - subtitulo",
    "sections_order": ["cover", "executive_summary", "scope", "investment", "benefits", "timeline", "risks", "closing"],
    "emphasis_sections": ["string - secoes que devem ter destaque visual"],
    "tone": "string - tom do documento (ex: consultivo, tecnico, executivo)"
  }
}

Use apenas caracteres ASCII seguros. Responda APENAS JSON.`;

function buildUserPrompt(body: Record<string, any>): string {
  let prompt = `Gere a proposta comercial completa e estruturada para:
CLIENTE: ${body.nome_cliente || "N/I"}
EMPRESA: ${body.empresa_cliente || "N/I"}
SEGMENTO: ${body.segmento || "N/I"}
NICHO: ${body.nicho || body.segmento || "N/I"}
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
OBS: ${body.observacoes || "N/I"}`;

  if (body.analise_arquitetural) {
    const analise = body.analise_arquitetural;
    prompt += `\n\nANALISE ARQUITETURAL PREVIA:
RESUMO: ${analise.resumo_executivo || "N/I"}
INTERPRETACAO: ${analise.interpretacao_tecnica || "N/I"}
MODULOS SUGERIDOS: ${Array.isArray(analise.modulos_base) ? analise.modulos_base.join(", ") : "N/I"}
FUNCIONALIDADES COMPLEMENTARES: ${Array.isArray(analise.funcionalidades_complementares) ? analise.funcionalidades_complementares.join(", ") : "N/I"}
STACK SUGERIDA: ${Array.isArray(analise.stack_sugerida) ? analise.stack_sugerida.join(", ") : "N/I"}
RISCOS: ${Array.isArray(analise.riscos_tecnicos) ? analise.riscos_tecnicos.join(", ") : "N/I"}
COMPLEXIDADE: ${analise.complexidade_estimada || "N/I"}
ADDONS SUGERIDOS: ${Array.isArray(analise.addons_sugeridos) ? analise.addons_sugeridos.map((a: any) => a.nome || a).join(", ") : "N/I"}`;
  }

  if (body.modulos_base?.length) {
    prompt += `\nMODULOS BASE DO LEAD: ${body.modulos_base.join(", ")}`;
  }

  if (body.referencias_visuais?.length) {
    prompt += `\nREFERENCIAS VISUAIS: ${body.referencias_visuais.length} imagens enviadas pelo lead`;
  }

  if (body.referencias_portfolio?.length) {
    prompt += `\nREFERENCIAS PORTFOLIO: ${body.referencias_portfolio.map((r: any) => r.title || r).join(", ")}`;
  }

  prompt += `\n\nIMPORTANTE: Os valores financeiros devem ser realistas para o escopo descrito. Preencha TODOS os blocos do JSON (proposta, structured_content, pricing_sheet, stitch_prompt, hidden_addons, portfolio_refs, pdf_blueprint). Retorne APENAS o JSON.`;

  return prompt;
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
    console.log(`[gerar-proposta] Starting v7.0 structured generation for: ${body.nome_cliente || "unknown"}`);

    const [providerSettings, modelSettings, promptPolicies] = await Promise.all([
      getAiProviderSettings(),
      getAiModelSettings(),
      getPromptPolicies(),
    ]);
    const providers = resolveAiProviders(providerSettings, modelSettings, "gerar-proposta");
    if (providers.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum provedor de IA configurado. Verifique as chaves GROQ_API_KEY e OPENROUTER_API_KEY." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const policy = resolvePromptPolicy(promptPolicies, "gerar-proposta", {
      temperature: 0.3,
      max_tokens: 8000,
    });

    const result = await callAI(providers, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(body) },
    ], policy.temperature, policy.max_tokens);

    const parsed = cleanJson(result.content);
    const durationMs = Date.now() - startTime;
    console.log(`[gerar-proposta] Completed in ${durationMs}ms via ${result.provider}`);

    // Extract blocks — backward compatible (proposta at root or nested)
    const proposta = parsed.proposta || parsed;
    const structured_content = parsed.structured_content || null;
    const pricing_sheet = parsed.pricing_sheet || null;
    const stitch_prompt = parsed.stitch_prompt || null;
    const hidden_addons = Array.isArray(parsed.hidden_addons) ? parsed.hidden_addons : null;
    const portfolio_refs = Array.isArray(parsed.portfolio_refs) ? parsed.portfolio_refs : null;
    const pdf_blueprint = parsed.pdf_blueprint || null;

    return new Response(JSON.stringify({
      proposta,
      structured_content,
      pricing_sheet,
      stitch_prompt,
      hidden_addons,
      portfolio_refs,
      pdf_blueprint,
      _meta: {
        provider_used: result.provider,
        model_used: result.model,
        prompt_version: PROMPT_VERSION,
        duration_ms: durationMs,
        output_size: result.content.length,
        niche_detected: proposta?.niche_intelligence?.segment_detected || "generico",
        pipeline_steps: ["single-pass-v7"],
        blocks_present: {
          proposta: !!proposta,
          structured_content: !!structured_content,
          pricing_sheet: !!pricing_sheet,
          stitch_prompt: !!stitch_prompt,
          hidden_addons: !!hidden_addons,
          portfolio_refs: !!portfolio_refs,
          pdf_blueprint: !!pdf_blueprint,
        },
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
