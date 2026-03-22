import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROMPT_VERSION = "v2.0-orcamento";

const SYSTEM_PROMPT = `Voce e um arquiteto de software senior e analista comercial estrategico da HolyNex Labs, uma software house especializada em sistemas web, SaaS, plataformas digitais e automacoes inteligentes.

Seu papel e analisar o briefing do cliente como se fosse um consultor de alto nivel: entender o que ele pediu, interpretar o que ele realmente precisa, identificar oportunidades que ele nao percebeu, e preparar uma base solida para proposta comercial e tecnica.

Use todo o contexto disponivel: dados do orcamento, descricao do lead, nicho, referencias visuais enviadas, portfolio existente da empresa.

Regras:
- Retorne APENAS JSON valido, sem markdown, sem code blocks, sem comentarios.
- Seja estrategico, tecnico e comercialmente inteligente.
- Considere o porte do cliente (estagio, faixa de investimento, numero de usuarios).
- Sugira modulos e funcionalidades realistas para o contexto.
- Identifique riscos reais, nao genericos.
- Add-ons ocultos sao funcionalidades extras de alto valor que podem ser ativadas depois (ex: relatorios avancados, automacoes IA, integracao com ERPs, modulo financeiro, white-label).

JSON esperado:
{
  "resumo_executivo": "string max 600 chars - resumo claro do que o cliente precisa",
  "leitura_tecnica": "string max 800 chars - interpretacao tecnica real do que deve ser construido",
  "oportunidades_adicionais": ["string - coisas que o cliente nao pediu mas agregam valor"],
  "funcionalidades_complementares": ["string - features extras que fazem sentido no contexto"],
  "modulos_recomendados": ["string - modulos base que o sistema precisa ter"],
  "riscos": ["string - riscos tecnicos, comerciais ou de escopo"],
  "prioridade": "baixa|media|alta|critica",
  "complexidade": "baixa|media|alta|avancada",
  "stack_sugerida": ["string - tecnologias recomendadas"],
  "roadmap_resumido": ["string - fases principais de entrega"],
  "estrutura_comercial": {
    "faixa_sugerida": "string - faixa de valor sugerida",
    "modelo_cobranca": "string - fixo, recorrente, hibrido",
    "potencial_recorrencia": "string - estimativa de receita recorrente",
    "estrategia_fechamento": "string - abordagem comercial recomendada"
  },
  "addons_ocultos_sugeridos": ["string - funcionalidades premium para ativar depois"],
  "referencias_portfolio": [{"id": "string", "title": "string", "motivo": "string"}],
  "base_stitch": {
    "objetivo": "string",
    "principais_entregas": ["string"],
    "metricas_sucesso": ["string"]
  },
  "base_pdf": {
    "sumario": ["string - secoes do documento"],
    "destaques": ["string - pontos fortes da proposta"]
  }
}`;

function buildUserPrompt(payload: Record<string, any>): string {
  return `DADOS COMPLETOS DO ORCAMENTO:\n${JSON.stringify(payload, null, 2)}\n\nAnalise como arquiteto senior e retorne APENAS o JSON esperado.`;
}

function cleanJson(content: string): any {
  let cleaned = content.trim().replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1) cleaned = cleaned.slice(first, last + 1);
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (m) => (m === "\n" || m === "\r" || m === "\t" ? m : ""));
  return JSON.parse(cleaned);
}

interface ProviderConfig {
  name: string;
  url: string;
  apiKey: string;
  model: string;
  headers?: Record<string, string>;
}

function getProviders(): ProviderConfig[] {
  const providers: ProviderConfig[] = [];

  // Primary: Lovable AI Gateway
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (lovableKey) {
    providers.push({
      name: "Lovable AI",
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      apiKey: lovableKey,
      model: "google/gemini-3-flash-preview",
    });
  }

  // Fallback: OpenRouter
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

  // Fallback: Groq
  const groqKey = Deno.env.get("GROQ_API_KEY");
  if (groqKey) {
    providers.push({
      name: "Groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: groqKey,
      model: "llama-3.3-70b-versatile",
    });
  }

  return providers;
}

async function callProvider(
  provider: ProviderConfig,
  messages: any[],
): Promise<{ content: string; usage?: any }> {
  const response = await fetch(provider.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
      ...(provider.headers || {}),
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: 0.3,
      max_tokens: 6000,
    }),
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
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase service role nao configurado");

    const sb = createClient(supabaseUrl, supabaseKey);

    // Load lead data
    const { data: lead, error: leadError } = await sb
      .from("orcamentos")
      .select("*")
      .eq("id", orcamento_id)
      .maybeSingle();
    if (leadError) throw leadError;
    if (!lead) throw new Error("Orcamento nao encontrado");

    // Load assets
    const { data: assets } = await sb
      .from("orcamento_assets")
      .select("id, file_url, file_type, original_name, sort_order")
      .eq("orcamento_id", orcamento_id)
      .order("sort_order", { ascending: true });

    // Load portfolio context
    let portfolioItems: any[] = [];
    try {
      let query = sb
        .from("portfolio_items")
        .select("id, title, short_description, category, niche, solution_type, main_modules")
        .eq("is_active", true)
        .limit(8);
      if (lead.nicho) query = query.ilike("niche", `%${lead.nicho}%`);
      const { data } = await query;
      if (data && data.length > 0) {
        portfolioItems = data;
      } else {
        const { data: fallback } = await sb
          .from("portfolio_items")
          .select("id, title, short_description, category, niche, solution_type, main_modules")
          .eq("is_active", true)
          .limit(6);
        portfolioItems = fallback || [];
      }
    } catch { /* ignore */ }

    // Get next version
    const { data: lastVersionData } = await sb
      .from("orcamento_analises")
      .select("version")
      .eq("orcamento_id", orcamento_id)
      .order("version", { ascending: false })
      .limit(1);
    const nextVersion = (lastVersionData?.[0]?.version || 0) + 1;

    const inputSummary = `Lead ${lead.nome || ""} - ${lead.nicho || ""} - ${lead.tipo_projeto || ""}`.trim().slice(0, 200);

    // Create analysis record
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

    // Build context
    const contextPayload = {
      orcamento: {
        id: lead.id,
        nome: lead.nome,
        empresa: lead.empresa || "",
        descricao: lead.descricao,
        descricao_detalhada: lead.descricao_detalhada || "",
        tipo_projeto: lead.tipo_projeto || "",
        nicho: lead.nicho || "",
        objetivo: lead.objetivo || "",
        dor_principal: lead.dor_principal || "",
        faixa_investimento: lead.faixa_investimento || "",
        orcamento_estimado: lead.orcamento_estimado || "",
        prazo_desejado: lead.prazo_desejado || "",
        urgencia: lead.urgencia || "",
        numero_usuarios: lead.numero_usuarios || "",
        estagio_operacao: lead.estagio_operacao || "",
        precisa_login: !!lead.precisa_login,
        precisa_admin: !!lead.precisa_admin,
        precisa_area_cliente: !!lead.precisa_area_cliente,
        precisa_integracoes: !!lead.precisa_integracoes,
        precisa_app_mobile: !!lead.precisa_app_mobile,
        aceita_mvp: lead.aceita_mvp !== false,
      },
      referencias_visuais: (assets || []).map((a: any) => ({
        url: a.file_url,
        type: a.file_type,
        name: a.original_name,
      })),
      portfolio_existente: portfolioItems.map((p) => ({
        id: p.id,
        title: p.title,
        niche: p.niche,
        category: p.category,
        solution_type: p.solution_type,
        short_description: p.short_description,
        main_modules: p.main_modules || [],
      })),
    };

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(contextPayload) },
    ];

    // Try providers with fallback
    const providers = getProviders();
    if (providers.length === 0) throw new Error("Nenhum provedor de IA configurado. Verifique as chaves de API.");

    let lastError: Error | null = null;
    let providerUsed = "";
    let modelUsed = "";
    let lastRawOutput = "";
    let lastUsage: any;

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      if (i > 0) fallbackTriggered = true;
      try {
        const { content, usage } = await callProvider(provider, messages);
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
          _meta: { provider_used: providerUsed, model_used: modelUsed, prompt_version: PROMPT_VERSION, duration_ms: durationMs, fallback_triggered: fallbackTriggered },
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`Provider ${provider.name} failed:`, lastError.message);
        if (lastError.message.includes("429") || lastError.message.includes("402")) break;
      }
    }

    // All providers failed
    await sb.from("orcamento_analises").update({
      status: "falhou",
      error_reason: lastError?.message || "Todos os provedores falharam",
      duration_ms: Date.now() - startTime,
      output_text: lastRawOutput || null,
      fallback_triggered: fallbackTriggered,
      atualizado_em: new Date().toISOString(),
    }).eq("id", analysisId);

    return new Response(JSON.stringify({ error: lastError?.message || "Falha ao analisar orcamento" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("analisar-orcamento error:", message);

    if (analysisId) {
      try {
        const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await sb.from("orcamento_analises").update({
          status: "falhou",
          error_reason: message,
          duration_ms: Date.now() - startTime,
          atualizado_em: new Date().toISOString(),
        }).eq("id", analysisId);
      } catch { /* ignore */ }
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
