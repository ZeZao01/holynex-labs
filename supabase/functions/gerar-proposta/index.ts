import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROMPT_VERSION = "v5.0-genspark-pipeline";

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

function getProviders(quality: "fast" | "quality" = "fast"): AIProvider[] {
  const providers: AIProvider[] = [];

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
      model: quality === "quality" ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash",
      headers: {
        "HTTP-Referer": "https://holynexlabs.com.br",
        "X-Title": "HolyNex Labs Proposals",
      },
    });
  }

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (lovableKey) {
    providers.push({
      name: "Lovable AI",
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      apiKey: lovableKey,
      model: quality === "quality" ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash-lite",
    });
  }

  return providers;
}

async function callAI(messages: any[], quality: "fast" | "quality" = "fast", temp = 0.3): Promise<string> {
  const providers = getProviders(quality);
  if (providers.length === 0) throw new Error("Nenhum provedor de IA configurado.");

  for (const provider of providers) {
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
        ...(provider.headers || {}),
      };

      console.log(`[pipeline] Trying ${provider.name} (${provider.model})`);
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
        throw new Error(`${provider.name} [${response.status}]: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error(`${provider.name}: empty response`);
      return content;
    } catch (err) {
      console.error(`[pipeline] ${provider.name} failed:`, err);
      if (err instanceof Error && (err.message.includes("429") || err.message.includes("402"))) throw err;
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
// AGENT A: NORMALIZER — Brief Canon
// ═══════════════════════════════════════════════

const SYSTEM_NORMALIZER = `Voce e um Normalizador de Briefs de Orcamentos da HolyNex Labs.
Produza APENAS JSON valido no formato "BriefCanon". Nao invente dados: se faltar, use null e liste perguntas em "missing_fields". Seja extremamente consistente.

OUTPUT (BriefCanon):
{
  "client": {"name": null, "company": null, "segment": null, "email": null},
  "project": {"goal": null, "context": null, "type": null, "deliverables": [], "constraints": [], "desired_features": [], "integrations": [], "num_users": null, "deadline": null, "budget": null, "urgency": null, "reference_link": null, "notes": null},
  "scope": {"inclusions": [], "exclusions": [], "assumptions": []},
  "commercial": {"deadline": null, "validity_days": 30, "payment_preference": null},
  "brand_kit": {"company_name": "HolyNex Labs", "logo_url": "", "primary_color": "#a855f7", "secondary_color": "#0a0015", "font_family": "Space Grotesk"},
  "missing_fields": []
}

Use apenas caracteres ASCII seguros. Responda APENAS JSON.`;

function buildNormalizerPrompt(body: Record<string, any>): string {
  return `Normalize este pedido em BriefCanon JSON:
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

Retorne APENAS o JSON BriefCanon.`;
}

// ═══════════════════════════════════════════════
// AGENT B: PRICER — Pricing Sheet
// ═══════════════════════════════════════════════

const SYSTEM_PRICER = `Voce e o motor de precificacao da HolyNex Labs.
Analise o BriefCanon e gere uma planilha de precos com 3 pacotes (Essencial, Profissional, Premium).

Regras de precificacao:
- Considere complexidade, numero de modulos, integracoes, prazos
- Valor minimo de projeto: R$ 3.000
- Modulos base: R$ 800-2.500 cada
- Integracoes: R$ 500-1.500 cada
- Area administrativa: R$ 1.500-4.000
- Login/autenticacao: R$ 800-2.000
- Dashboard/relatorios: R$ 1.200-3.500
- IA/automacao: R$ 2.000-8.000
- App mobile: +40% sobre valor base
- Desconto MVP: 15-25%
- Manutencao mensal: 8-15% do valor total

Gere 3 cenarios realistas. Nao altere o escopo. Se algo faltar, use null e sinalize em "pricing_warnings".

OUTPUT (PricingSheet JSON):
{
  "line_items": [
    {"sku": "", "name": "", "desc": "", "qty": 1, "unit_price": 0, "discount": 0, "subtotal": 0}
  ],
  "totals": {"subtotal": 0, "discount": 0, "tax": 0, "total": 0},
  "packages": [
    {"name": "Essencial", "items": [], "total": 0, "rationale": "", "delivery_days": 0, "maintenance_monthly": 0},
    {"name": "Profissional", "items": [], "total": 0, "rationale": "", "delivery_days": 0, "maintenance_monthly": 0},
    {"name": "Premium", "items": [], "total": 0, "rationale": "", "delivery_days": 0, "maintenance_monthly": 0}
  ],
  "pricing_warnings": []
}

Use apenas caracteres ASCII seguros. Responda APENAS JSON.`;

// ═══════════════════════════════════════════════
// AGENT C: WRITER — Proposal Content
// ═══════════════════════════════════════════════

const SYSTEM_WRITER = `Voce e um redator de propostas comerciais premium da HolyNex Labs, empresa especializada em desenvolvimento de software sob medida.

Estilo: consultivo, profissional, sem exageros. Use fontes REAIS (Gartner, McKinsey, Harvard, Forrester, Deloitte - anos 2023-2025).

Gere o conteudo completo adaptado ao NICHO do cliente. Cada proposta deve ser UNICA.

OUTPUT JSON:
{
  "resumo_executivo": "string max 800 chars - narrativa contexto->dor->solucao",
  "tipo_projeto": "string - classificacao (SaaS, ERP, CRM, etc)",
  "diagnostico": "string max 600 chars - analise do problema no contexto do segmento",
  "solucao_proposta": "string max 600 chars - visao da solucao contextualizada",
  "escopo": ["modulos do MVP"],
  "funcionalidades": ["funcionalidades principais"],
  "funcionalidades_recomendadas": ["evolucoes futuras"],
  "complexidade": "baixa|media|alta|avancada",
  "analise_estrategica": "string max 600 chars - impacto estrategico",
  "estimativa_esforco": "string max 200 chars - horas/equipe",
  "cronograma": "string max 300 chars",
  "manutencao": "string max 300 chars",
  "riscos": ["riscos identificados"],
  "proximos_passos": ["etapas para iniciar"],
  "proposta_comercial": "string - texto resumido interno",
  "niche_intelligence": {
    "segment_detected": "string",
    "kpis": [{"label": "string", "metric": "string"}],
    "risk_matrix": [{"title": "string", "impact": "string", "mitigation": "string", "severity": "alto|medio|baixo"}],
    "strategic_benefits": [{"title": "string", "desc": "string com referencia real"}],
    "timeline_phases": [{"title": "FASE 01", "subtitle": "string", "desc": "atividades\\n"}],
    "scope_labels": {"landing": "string", "user": "string", "admin": "string"},
    "investment_justification": "string com fonte real",
    "expert_reference": "string referencia bibliografica",
    "maintenance_features": ["items"]
  }
}

Use apenas caracteres ASCII seguros. Responda APENAS JSON.`;

// ═══════════════════════════════════════════════
// AGENT D: ASSEMBLER — DocumentSpec
// ═══════════════════════════════════════════════

const SYSTEM_ASSEMBLER = `Voce e o montador de documentos executivos da HolyNex Labs.
Transforme BriefCanon + PricingSheet + ProposalContent em um DocumentSpec JSON padronizado.

Garanta:
- Totais batem (soma subtotais = subtotal, descontos, total correto)
- Secoes minimas: cover, summary, scope, pricing, timeline, terms, next_steps
- Campos criticos preenchidos
- Linguagem pt-BR, moeda BRL
- Termos: validade, prazo, pagamento, exclusoes

OUTPUT (DocumentSpec JSON):
{
  "meta": {"doc_type": "orcamento", "language": "pt-BR", "currency": "BRL", "version": "1.0"},
  "brand": {"company_name": "HolyNex Labs", "logo_url": "", "primary_color": "#a855f7", "secondary_color": "#0a0015", "font_family": "Space Grotesk", "footer_note": "HolyNex Labs - Inovacao em Desenvolvimento de Software | holynexlabs.com.br"},
  "client": {"name": "", "company": "", "email": "", "phone": "", "address": ""},
  "quote": {"quote_number": "", "issue_date": "", "valid_until": "", "status": "draft", "payment_terms": "", "delivery_terms": ""},
  "sections": [
    {"type": "cover", "title": "Proposta Comercial", "subtitle": "", "highlights": ["", "", ""]},
    {"type": "summary", "title": "Resumo Executivo", "content_md": ""},
    {"type": "scope", "title": "Escopo do Projeto", "items": [{"title": "", "bullets": [""]}]},
    {"type": "pricing", "title": "Investimento", "tables": [{"name": "Tabela", "columns": ["Item", "Descricao", "Qtd", "Preco", "Subtotal"], "rows": []}], "totals": {"subtotal": 0, "discount": 0, "tax": 0, "total": 0}, "options": [{"name": "Essencial", "total": 0, "includes": [""]}]},
    {"type": "timeline", "title": "Cronograma", "milestones": [{"name": "", "duration": "", "notes": ""}]},
    {"type": "terms", "title": "Termos e Condicoes", "content_md": ""},
    {"type": "next_steps", "title": "Proximos Passos", "steps": [""]}
  ],
  "compliance": {"assumptions": [""], "exclusions": [""], "risks": [""]},
  "validation": {"totals_match": true, "required_sections_present": true, "critical_fields_filled": true, "issues": []}
}

Use apenas caracteres ASCII seguros. Responda APENAS JSON.`;

// ═══════════════════════════════════════════════
// PIPELINE
// ═══════════════════════════════════════════════

async function runPipeline(body: Record<string, any>): Promise<{
  proposta: any;
  document_spec: any;
  pricing_sheet: any;
  _meta: any;
}> {
  const startTime = Date.now();
  let providerUsed = "pipeline";
  let modelUsed = "multi-agent";

  // ── STEP A: Normalize ──
  console.log("[pipeline] Step A: Normalizing brief...");
  const briefRaw = await callAI([
    { role: "system", content: SYSTEM_NORMALIZER },
    { role: "user", content: buildNormalizerPrompt(body) },
  ], "fast", 0.2);
  const brief = cleanJson(briefRaw);
  console.log("[pipeline] Step A complete. Missing fields:", brief.missing_fields?.length || 0);

  // ── STEP B: Price ──
  console.log("[pipeline] Step B: Calculating pricing...");
  const pricingRaw = await callAI([
    { role: "system", content: SYSTEM_PRICER },
    { role: "user", content: `Gere a precificacao para este brief:\n${JSON.stringify(brief, null, 2)}` },
  ], "fast", 0.25);
  const pricing = cleanJson(pricingRaw);
  console.log("[pipeline] Step B complete. Packages:", pricing.packages?.length || 0);

  // ── STEP C: Write ──
  console.log("[pipeline] Step C: Writing proposal content...");
  const writerRaw = await callAI([
    { role: "system", content: SYSTEM_WRITER },
    { role: "user", content: `Crie o conteudo da proposta comercial para:\n\nBRIEF:\n${JSON.stringify(brief, null, 2)}\n\nPRECIFICACAO:\n${JSON.stringify(pricing, null, 2)}\n\nINSTRUCOES:\n1. Adapte ao nicho: ${brief.client?.segment || body.segmento || "tecnologia"}\n2. Use fontes reais\n3. Conteudo ORIGINAL e UNICO\n4. Integre os valores da precificacao nos campos financeiros` },
  ], "quality", 0.4);
  const proposal = cleanJson(writerRaw);
  console.log("[pipeline] Step C complete. Niche:", proposal.niche_intelligence?.segment_detected || "N/A");

  // Merge pricing into proposal financeiro
  if (pricing.packages?.length >= 3) {
    proposal.financeiro = {
      valor_minimo: pricing.packages[0]?.total || proposal.financeiro?.valor_minimo || 0,
      valor_ideal: pricing.packages[1]?.total || proposal.financeiro?.valor_ideal || 0,
      valor_premium: pricing.packages[2]?.total || proposal.financeiro?.valor_premium || 0,
      classificacao_margem: proposal.financeiro?.classificacao_margem || "margem_saudavel",
    };
  }

  // ── STEP D: Assemble DocumentSpec ──
  console.log("[pipeline] Step D: Assembling document...");
  const assemblerRaw = await callAI([
    { role: "system", content: SYSTEM_ASSEMBLER },
    { role: "user", content: `Monte o DocumentSpec final:\n\nBRIEF:\n${JSON.stringify(brief, null, 2)}\n\nPRECIFICACAO:\n${JSON.stringify(pricing, null, 2)}\n\nCONTEUDO:\n${JSON.stringify(proposal, null, 2)}\n\nDATA EMISSAO: ${new Date().toISOString().split("T")[0]}\nVALIDADE: 30 dias\nNUMERO: HNL-${Date.now().toString(36).toUpperCase()}` },
  ], "quality", 0.2);
  const docSpec = cleanJson(assemblerRaw);
  console.log("[pipeline] Step D complete. Validation:", docSpec.validation?.issues?.length || 0, "issues");

  const durationMs = Date.now() - startTime;
  console.log(`[pipeline] Full pipeline completed in ${durationMs}ms`);

  return {
    proposta: proposal,
    document_spec: docSpec,
    pricing_sheet: pricing,
    _meta: {
      provider_used: providerUsed,
      model_used: modelUsed,
      prompt_version: PROMPT_VERSION,
      duration_ms: durationMs,
      output_size: JSON.stringify(proposal).length,
      niche_detected: proposal?.niche_intelligence?.segment_detected || "generico",
      pipeline_steps: ["normalize", "price", "write", "assemble"],
      packages_count: pricing.packages?.length || 0,
      doc_spec_sections: docSpec.sections?.length || 0,
      validation_issues: docSpec.validation?.issues || [],
    },
  };
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

    const providers = getProviders();
    if (providers.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum provedor de IA configurado. Configure GROQ_API_KEY, OPENROUTER_API_KEY ou LOVABLE_API_KEY." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const result = await runPipeline(body);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("[gerar-proposta] Pipeline error:", err);

      if (err instanceof Error && (err.message.includes("429") || err.message.includes("402"))) {
        return new Response(
          JSON.stringify({
            error: "Limite de requisicoes ou creditos excedidos. Tente novamente em alguns segundos.",
            _meta: { prompt_version: PROMPT_VERSION, duration_ms: Date.now() - startTime },
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          error: `Erro no pipeline: ${err instanceof Error ? err.message : "desconhecido"}`,
          _meta: { prompt_version: PROMPT_VERSION, duration_ms: Date.now() - startTime },
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("[gerar-proposta] Parse error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Erro desconhecido",
        _meta: { prompt_version: PROMPT_VERSION, duration_ms: Date.now() - startTime },
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
