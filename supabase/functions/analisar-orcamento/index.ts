import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

const PROMPT_VERSION = "v1.0-orcamento";

interface ProviderUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}
async function callProvider(
  provider: { name: string; url: string; apiKey: string; model: string; headers?: Record<string, string> },
  messages: any[],
  temperature: number,
  maxTokens: number
): Promise<{ content: string; usage?: ProviderUsage }> {
  const response = await fetch(provider.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
      ...(provider.headers || {}),
    },
    body: JSON.stringify({ model: provider.model, messages, temperature, max_tokens: maxTokens }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`${provider.name} [${response.status}]: ${t}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${provider.name}: empty response`);
  return { content, usage: data.usage };
}

function cleanJson(content: string): any {
  let cleaned = content.trim().replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1) cleaned = cleaned.slice(first, last + 1);
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (m) => (m === "\n" || m === "\r" || m === "\t" ? m : ""));
  return JSON.parse(cleaned);
}

const SYSTEM_PROMPT = `Voce e um arquiteto de software e analista comercial da HolyNex Labs.
Transforme o briefing em uma analise estruturada, objetiva e acionavel.

Regras:
- Retorne APENAS JSON valido, sem markdown, sem code blocks.
- Use somente os campos definidos abaixo.
- Seja direto, com linguagem tecnica/comercial equilibrada.

JSON esperado:
{
  "resumo_executivo": "string max 600 chars",
  "leitura_tecnica": "string max 700 chars",
  "modulos_recomendados": ["string"],
  "oportunidades_adicionais": ["string"],
  "riscos": ["string"],
  "prioridade": "baixa|media|alta|critica",
  "complexidade": "baixa|media|alta|avancada",
  "stack_sugerida": ["string"],
  "roadmap_resumido": ["string"],
  "addons_ocultos_sugeridos": ["string"],
  "referencias_portfolio": [{"id": "string", "title": "string", "motivo": "string"}],
  "base_stitch": {
    "objetivo": "string",
    "principais_entregas": ["string"],
    "metricas_sucesso": ["string"]
  },
  "base_pdf": {
    "sumario": ["string"],
    "destaques": ["string"]
  }
}`;

function buildUserPrompt(payload: Record<string, any>): string {
  return `DADOS DO ORCAMENTO (resumo JSON):\n${JSON.stringify(payload, null, 2)}\n\nRetorne APENAS o JSON esperado.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();

  let analysisId: string | null = null;
  let fallbackTriggered = false;

  try {
    const { orcamento_id } = await req.json();
    if (!orcamento_id) {
      return new Response(JSON.stringify({ error: "orcamento_id obrigatorio" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase service role nao configurado");
    }

    const sb = createClient(supabaseUrl, supabaseKey);

    const { data: lead, error: leadError } = await sb
      .from("orcamentos")
      .select("*")
      .eq("id", orcamento_id)
      .maybeSingle();
    if (leadError) throw leadError;
    if (!lead) throw new Error("Orcamento nao encontrado");

    const { data: assets } = await sb
      .from("orcamento_assets")
      .select("id, file_url, file_type, original_name, sort_order")
      .eq("orcamento_id", orcamento_id)
      .order("sort_order", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true });

    let portfolioItems: any[] = [];
    try {
      let portfolioQuery = sb
        .from("portfolio_items")
        .select("id, title, short_description, category, niche, solution_type, thumbnail_url, public_url, main_modules")
        .eq("is_active", true)
        .limit(6);
      if (lead.nicho) portfolioQuery = portfolioQuery.ilike("niche", `%${lead.nicho}%`);
      const { data: portfolioData } = await portfolioQuery;
      if (portfolioData && portfolioData.length > 0) {
        portfolioItems = portfolioData;
      } else {
        const { data: fallbackPortfolio } = await sb
          .from("portfolio_items")
          .select("id, title, short_description, category, niche, solution_type, thumbnail_url, public_url, main_modules")
          .eq("is_active", true)
          .limit(6);
        portfolioItems = fallbackPortfolio || [];
      }
    } catch {
      portfolioItems = [];
    }

    const { data: lastVersionData } = await sb
      .from("orcamento_analises")
      .select("version")
      .eq("orcamento_id", orcamento_id)
      .order("version", { ascending: false })
      .limit(1);

    const nextVersion = (lastVersionData?.[0]?.version || 0) + 1;

    const inputSummary = `Lead ${lead.nome || ""} - ${lead.nicho || ""} - ${lead.tipo_projeto || ""}`.trim().slice(0, 200);

    const { data: createdAnalysis, error: createError } = await sb
      .from("orcamento_analises")
      .insert({
        orcamento_id,
        version: nextVersion,
        status: "em_processamento",
        prompt_version: PROMPT_VERSION,
        input_summary: inputSummary,
      })
      .select("id")
      .single();
    if (createError) throw createError;
    analysisId = createdAnalysis.id;

    const [providerSettings, modelSettings, promptPolicies] = await Promise.all([
      getAiProviderSettings(),
      getAiModelSettings(),
      getPromptPolicies(),
    ]);
    const providers = resolveAiProviders(providerSettings, modelSettings, "analisar-orcamento");
    if (providers.length === 0) throw new Error("Nenhum provedor de IA configurado");

    const policy = resolvePromptPolicy(promptPolicies, "analisar-orcamento", {
      temperature: 0.3,
      max_tokens: 5000,
    });

    const contextPayload = {
      orcamento: {
        id: lead.id,
        nome: lead.nome,
        empresa: lead.empresa || "",
        email: lead.email,
        descricao: lead.descricao,
        descricao_detalhada: lead.descricao_detalhada || "",
        tipo_projeto: lead.tipo_projeto || "",
        nicho: lead.nicho || "",
        objetivo: lead.objetivo || "",
        faixa_investimento: lead.faixa_investimento || "",
        orcamento_estimado: lead.orcamento_estimado || "",
        prazo_desejado: lead.prazo_desejado || "",
        urgencia: lead.urgencia || "",
        numero_usuarios: lead.numero_usuarios || "",
        precisa_login: !!lead.precisa_login,
        precisa_admin: !!lead.precisa_admin,
        precisa_area_cliente: !!lead.precisa_area_cliente,
        precisa_integracoes: !!lead.precisa_integracoes,
        precisa_app_mobile: !!lead.precisa_app_mobile,
        aceita_mvp: lead.aceita_mvp !== false,
        estagio_operacao: lead.estagio_operacao || "",
      },
      referencias_visuais: (assets || []).map((a: any) => ({
        id: a.id,
        url: a.file_url,
        type: a.file_type,
        name: a.original_name,
      })),
      portfolio_contexto: (portfolioItems || []).map((p) => ({
        id: p.id,
        title: p.title,
        niche: p.niche,
        category: p.category,
        solution_type: p.solution_type,
        short_description: p.short_description,
        main_modules: p.main_modules || [],
        public_url: p.public_url,
      })),
    };

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(contextPayload) },
    ];

    let lastError: Error | null = null;
    let providerUsed = "";
    let modelUsed = "";
    let lastRawOutput = "";
    let lastUsage: ProviderUsage | undefined;

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      if (i > 0) fallbackTriggered = true;
      try {
        const { content, usage } = await callProvider(provider, messages, policy.temperature, policy.max_tokens);
        lastRawOutput = content;
        lastUsage = usage;
        const outputData = cleanJson(content);
        const durationMs = Date.now() - startTime;
        providerUsed = provider.name;
        modelUsed = provider.model;

        await sb.from("orcamento_analises").update({
          status: "concluido",
          provider_used: providerUsed,
          model_used: modelUsed,
          output_json: outputData,
          output_text: content,
          duration_ms: durationMs,
          tokens_input: usage?.prompt_tokens ?? null,
          tokens_output: usage?.completion_tokens ?? null,
          fallback_triggered: fallbackTriggered,
          atualizado_em: new Date().toISOString(),
        }).eq("id", analysisId);

        return new Response(JSON.stringify({
          status: "concluido",
          analysis: outputData,
          _meta: {
            provider_used: providerUsed,
            model_used: modelUsed,
            prompt_version: PROMPT_VERSION,
            duration_ms: durationMs,
            fallback_triggered: fallbackTriggered,
            tokens_input: usage?.prompt_tokens ?? null,
            tokens_output: usage?.completion_tokens ?? null,
          },
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (err instanceof Error && err.message.includes("empty response")) {
          lastRawOutput = "";
        }
        if (err instanceof Error && (err.message.includes("429") || err.message.includes("402"))) {
          break;
        }
      }
    }

    await sb.from("orcamento_analises").update({
      status: "falhou",
      error_reason: lastError?.message || "Todos os provedores falharam",
      duration_ms: Date.now() - startTime,
      output_text: lastRawOutput || null,
      tokens_input: lastUsage?.prompt_tokens ?? null,
      tokens_output: lastUsage?.completion_tokens ?? null,
      fallback_triggered: fallbackTriggered,
      atualizado_em: new Date().toISOString(),
    }).eq("id", analysisId);

    return new Response(JSON.stringify({
      error: lastError?.message || "Falha ao analisar orcamento",
      _meta: { prompt_version: PROMPT_VERSION, duration_ms: Date.now() - startTime },
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    if (analysisId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (supabaseUrl && supabaseKey) {
          const sb = createClient(supabaseUrl, supabaseKey);
          await sb.from("orcamento_analises").update({
            status: "falhou",
            error_reason: message,
            duration_ms: Date.now() - startTime,
            atualizado_em: new Date().toISOString(),
          }).eq("id", analysisId);
        }
      } catch {}
    }

    return new Response(JSON.stringify({ error: message, _meta: { prompt_version: PROMPT_VERSION } }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
