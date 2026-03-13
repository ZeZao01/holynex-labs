import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Prompt templates by use case ──────────────────────────────────────

const PROMPT_TEMPLATES: Record<string, { version: string; system: string; buildUser: (ctx: any) => string }> = {
  resumir_lead: {
    version: "v1.0",
    system: `Voce e um analista comercial da HolyNex Labs (software house). Resuma leads de forma objetiva e estrategica. Retorne JSON com: resumo (string max 400 chars), pontos_fortes (array), riscos (array), sugestao_proxima_acao (string). Sem markdown, sem code blocks, apenas JSON.`,
    buildUser: (ctx) => `Resuma este lead:\nNome: ${ctx.nome}\nEmpresa: ${ctx.empresa || "N/A"}\nDescricao: ${ctx.descricao}\nNicho: ${ctx.nicho || "N/A"}\nTipo: ${ctx.tipo_projeto || "N/A"}\nOrcamento: ${ctx.faixa_investimento || "N/A"}\nUrgencia: ${ctx.urgencia || "N/A"}`,
  },
  sugerir_estrategia_comercial: {
    version: "v1.0",
    system: `Voce e um consultor comercial da HolyNex Labs. Sugira estrategia comercial para fechar o projeto. Retorne JSON com: estrategia (string max 500 chars), argumentos_fechamento (array de strings), faixa_ideal (string), abordagem (string), riscos_comerciais (array). Sem markdown, apenas JSON.`,
    buildUser: (ctx) => `Sugira estrategia para:\nCliente: ${ctx.nome_cliente}\nProjeto: ${ctx.descricao_projeto}\nSegmento: ${ctx.segmento || "N/A"}\nOrcamento: ${ctx.orcamento_cliente || "N/A"}\nComplexidade: ${ctx.complexidade || "N/A"}\nValor minimo: ${ctx.valor_minimo || 0}\nValor ideal: ${ctx.valor_ideal || 0}`,
  },
  resumir_proposta: {
    version: "v1.0",
    system: `Voce e um assistente da HolyNex Labs. Resuma propostas comerciais de forma executiva. Retorne JSON com: resumo_executivo (string max 500 chars), destaques (array), valor_total_estimado (string), complexidade (string), recomendacao (string). Sem markdown, apenas JSON.`,
    buildUser: (ctx) => `Resuma esta proposta:\nCliente: ${ctx.nome_cliente}\nTipo: ${ctx.tipo_projeto}\nDescricao: ${ctx.descricao_projeto}\nValor min: R$${ctx.valor_minimo || 0}\nValor ideal: R$${ctx.valor_ideal || 0}\nValor premium: R$${ctx.valor_premium || 0}\nFuncionalidades: ${(ctx.funcionalidades_desejadas || []).join(", ")}`,
  },
  resumir_projeto: {
    version: "v1.0",
    system: `Voce e um gerente de projetos da HolyNex Labs. Resuma o estado do projeto. Retorne JSON com: resumo (string max 400 chars), status_geral (string), riscos (array), proximos_passos (array), blockers (array). Sem markdown, apenas JSON.`,
    buildUser: (ctx) => `Resuma este projeto:\nNome: ${ctx.nome}\nCliente: ${ctx.cliente}\nStatus: ${ctx.status}\nProgresso: ${ctx.progresso || 0}%\nDescricao: ${ctx.descricao || "N/A"}\nStack: ${(ctx.stack || []).join(", ")}\nPrazo: ${ctx.data_previsao || "N/A"}`,
  },
  sugerir_copy_portfolio: {
    version: "v1.0",
    system: `Voce e um copywriter da HolyNex Labs. Crie copy comercial para itens de portfolio. Retorne JSON com: headline (string max 80 chars), subtitulo (string max 120 chars), descricao_curta (string max 200 chars), descricao_comercial (string max 500 chars), badges_sugeridos (array max 5). Sem markdown, apenas JSON.`,
    buildUser: (ctx) => `Crie copy para:\nTitulo: ${ctx.title}\nTipo: ${ctx.item_type || "case_real"}\nNicho: ${ctx.niche || "N/A"}\nCategoria: ${ctx.category || "N/A"}\nModulos: ${(ctx.main_modules || []).join(", ")}\nContexto: ${ctx.short_description || ctx.commercial_description || "N/A"}`,
  },
  sugerir_modelo: {
    version: "v1.0",
    system: `Voce e um estrategista de produto da HolyNex Labs. Sugira proposta de valor e conteudo para um projeto modelo. Retorne JSON com: value_proposition (string max 300 chars), target_audience (string max 200 chars), problem_solved (string max 300 chars), badges_sugeridos (array max 5), tiers_sugeridos (array de {name, description, modules array}). Sem markdown, apenas JSON.`,
    buildUser: (ctx) => `Sugira conteudo para modelo:\nTitulo: ${ctx.title}\nCategoria: ${ctx.category || "N/A"}\nNicho: ${ctx.niche || "N/A"}\nDescricao: ${ctx.commercial_description || ctx.subtitle || "N/A"}`,
  },
  explicar_financeiro: {
    version: "v1.0",
    system: `Voce e um analista financeiro da HolyNex Labs. Explique metricas financeiras e sugira acoes. Retorne JSON com: explicacao (string max 500 chars), oportunidades (array), alertas (array), sugestoes_acao (array). Sem markdown, apenas JSON.`,
    buildUser: (ctx) => `Explique estas metricas:\nReceita Total: R$${ctx.receita_total || 0}\nRecorrencia: R$${ctx.recorrencia || 0}/mes\nMargem Media: ${ctx.margem_media || 0}%\nTicket Medio: R$${ctx.ticket_medio || 0}\nTop nichos: ${(ctx.top_nichos || []).join(", ")}\nAlertas: ${(ctx.alertas || []).join(", ")}`,
  },
  resumir_manutencao: {
    version: "v1.0",
    system: `Voce e um analista operacional da HolyNex Labs. Resuma e classifique demandas de manutencao. Retorne JSON com: resumo (string max 300 chars), classificacao (string: bug|melhoria|feature|urgente), impacto (string: baixo|medio|alto), sugestao_acao (string max 200 chars). Sem markdown, apenas JSON.`,
    buildUser: (ctx) => `Classifique esta demanda:\nTitulo: ${ctx.title}\nDescricao: ${ctx.short_description || ctx.detailed_description || "N/A"}\nTipo: ${ctx.change_type || "N/A"}\nPrioridade: ${ctx.priority || "N/A"}\nSistema: ${ctx.system_name || "N/A"}`,
  },
};

// ── Provider orchestration ────────────────────────────────────────────

interface AIProvider {
  name: string;
  url: string;
  apiKey: string;
  model: string;
  headers?: Record<string, string>;
}

function getProviders(): AIProvider[] {
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
      model: "google/gemini-2.5-flash",
      headers: { "HTTP-Referer": "https://holynexlabs.com.br", "X-Title": "HolyNex Labs" },
    });
  }

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (lovableKey) {
    providers.push({
      name: "Lovable AI",
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      apiKey: lovableKey,
      model: "google/gemini-3-flash-preview",
    });
  }

  return providers;
}

async function callProvider(provider: AIProvider, messages: any[]): Promise<string> {
  console.log(`[copiloto-ia] Trying: ${provider.name} (${provider.model})`);
  const response = await fetch(provider.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
      ...(provider.headers || {}),
    },
    body: JSON.stringify({ model: provider.model, messages, temperature: 0.3, max_tokens: 4000 }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`${provider.name} [${response.status}]: ${t}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${provider.name}: empty response`);
  return content;
}

function cleanJson(content: string): any {
  let cleaned = content.trim().replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1) cleaned = cleaned.slice(first, last + 1);
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (m) => (m === "\n" || m === "\r" || m === "\t" ? m : ""));
  return JSON.parse(cleaned);
}

// ── Main handler ──────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();

  try {
    const { use_case, context, entity_type, entity_id } = await req.json();

    const template = PROMPT_TEMPLATES[use_case];
    if (!template) {
      return new Response(
        JSON.stringify({ error: `Use case desconhecido: ${use_case}. Disponiveis: ${Object.keys(PROMPT_TEMPLATES).join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const providers = getProviders();
    if (providers.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum provedor de IA configurado." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messages = [
      { role: "system", content: template.system },
      { role: "user", content: template.buildUser(context || {}) },
    ];

    let lastError: Error | null = null;
    let fallbackTriggered = false;
    let providerUsed = "";
    let modelUsed = "";

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      if (i > 0) fallbackTriggered = true;

      try {
        const content = await callProvider(provider, messages);
        const outputData = cleanJson(content);
        const durationMs = Date.now() - startTime;
        providerUsed = provider.name;
        modelUsed = provider.model;

        console.log(`[copiloto-ia] Success: ${provider.name} in ${durationMs}ms for ${use_case}`);

        // Log execution to database
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL");
          const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
          if (supabaseUrl && supabaseKey) {
            const sb = createClient(supabaseUrl, supabaseKey);
            await sb.from("ai_executions").insert({
              use_case,
              entity_type: entity_type || "",
              entity_id: entity_id || null,
              provider_used: providerUsed,
              model_used: modelUsed,
              prompt_version: template.version,
              fallback_triggered: fallbackTriggered,
              output_valid: true,
              status: "concluido",
              output_data: outputData,
              duration_ms: durationMs,
              input_summary: template.buildUser(context || {}).substring(0, 500),
            });
          }
        } catch (logErr) {
          console.error("[copiloto-ia] Log error:", logErr);
        }

        return new Response(
          JSON.stringify({
            output: outputData,
            _meta: {
              provider_used: providerUsed,
              model_used: modelUsed,
              prompt_version: template.version,
              fallback_triggered: fallbackTriggered,
              duration_ms: durationMs,
              use_case,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        console.error(`[copiloto-ia] ${provider.name} failed:`, err);
        lastError = err instanceof Error ? err : new Error(String(err));

        if (err instanceof Error && (err.message.includes("429") || err.message.includes("402"))) {
          return new Response(
            JSON.stringify({ error: `${provider.name}: Limite excedido. Tente novamente.` }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // All providers failed - log failure
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseKey) {
        const sb = createClient(supabaseUrl, supabaseKey);
        await sb.from("ai_executions").insert({
          use_case,
          entity_type: entity_type || "",
          entity_id: entity_id || null,
          provider_used: "none",
          model_used: "none",
          prompt_version: template.version,
          fallback_triggered: true,
          output_valid: false,
          status: "falhou",
          error_reason: lastError?.message || "Todos provedores falharam",
          duration_ms: Date.now() - startTime,
          input_summary: template.buildUser(context || {}).substring(0, 500),
        });
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: `Todos os provedores falharam: ${lastError?.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[copiloto-ia] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
