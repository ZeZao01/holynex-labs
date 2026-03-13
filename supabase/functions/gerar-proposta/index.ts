import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROMPT_VERSION = "v3.0-structured";

const SYSTEM_PROMPT = `Voce e o Motor Oficial de Propostas Comerciais da HolyNex Labs.

A HolyNex Labs e uma empresa especializada em desenvolvimento de software sob medida e produtos digitais (SaaS, Micro-SaaS, ERP, CRM, Dashboards, Plataformas com IA, Automacoes, etc).

Sua funcao e analisar os dados do projeto enviado e gerar uma proposta comercial ESTRUTURADA.

REGRAS CRITICAS:
- Responda APENAS com um JSON valido, sem texto adicional, sem markdown, sem code blocks
- NAO use caracteres especiais unicode (sem emojis, sem checkmarks, sem setas unicode)
- Todos os valores monetarios em BRL (R$) como numeros
- Seja profissional, estrategico e orientado a negocios
- Aumente a percepcao de valor do projeto
- Se o orcamento for baixo, foque em MVP com funcionalidades essenciais
- Funcionalidades avancadas devem aparecer como evolucoes futuras
- CADA SECAO deve ser concisa e objetiva, sem repeticao entre secoes

ESTRUTURA OBRIGATORIA DO JSON:
{
  "resumo_executivo": "string (max 800 chars) - resumo profissional e estrategico",
  "tipo_projeto": "string - classificacao (SaaS, ERP, CRM, Dashboard, etc)",
  "diagnostico": "string (max 600 chars) - analise do problema atual do cliente",
  "solucao_proposta": "string (max 600 chars) - visao geral da solucao",
  "escopo": ["array de strings - modulos do MVP"],
  "funcionalidades": ["array de strings - funcionalidades principais"],
  "funcionalidades_recomendadas": ["array de strings - evolucoes futuras"],
  "complexidade": "baixa|media|alta|avancada",
  "analise_estrategica": "string (max 600 chars) - impacto estrategico no negocio",
  "estimativa_esforco": "string (max 200 chars) - estimativa de horas/equipe",
  "financeiro": {
    "valor_minimo": 0,
    "valor_ideal": 0,
    "valor_premium": 0,
    "classificacao_margem": "margem_aceitavel|margem_saudavel|alta_rentabilidade|abaixo_da_margem|margem_critica"
  },
  "cronograma": "string (max 300 chars) - cronograma estimado",
  "manutencao": "string (max 300 chars) - sugestao de manutencao mensal",
  "riscos": ["array de strings - riscos identificados"],
  "proximos_passos": ["array de strings - etapas para iniciar"],
  "proposta_comercial": "string - texto resumido da proposta para uso interno/historico"
}

DIFERENCIAIS DA HOLYNEX LABS:
- Solucoes sob medida
- Arquitetura escalavel
- Automacao de processos
- Foco em eficiencia operacional
- Visao estrategica de crescimento`;

function buildUserPrompt(body: Record<string, any>): string {
  const {
    nome_cliente, empresa_cliente, segmento, tipo_projeto,
    descricao_projeto, problema_cliente, objetivo_cliente,
    funcionalidades_desejadas, integracoes, numero_usuarios,
    prazo_desejado, orcamento_cliente, nivel_urgencia,
    link_referencia, observacoes,
  } = body;

  return `Gere a proposta comercial estruturada em JSON:

CLIENTE: ${nome_cliente || "Nao informado"}
EMPRESA: ${empresa_cliente || "Nao informado"}
SEGMENTO: ${segmento || "Nao informado"}
TIPO DE PROJETO: ${tipo_projeto || "Nao especificado"}

DESCRICAO: ${descricao_projeto || "Nao informado"}
PROBLEMA: ${problema_cliente || "Nao informado"}
OBJETIVO: ${objetivo_cliente || "Nao informado"}

FUNCIONALIDADES DESEJADAS: ${Array.isArray(funcionalidades_desejadas) ? funcionalidades_desejadas.join(", ") : funcionalidades_desejadas || "Nao especificado"}
INTEGRACOES: ${Array.isArray(integracoes) ? integracoes.join(", ") : integracoes || "Nenhuma"}
NUMERO DE USUARIOS: ${numero_usuarios || "Nao informado"}
PRAZO DESEJADO: ${prazo_desejado || "Nao informado"}
ORCAMENTO DO CLIENTE: ${orcamento_cliente || "Nao informado"}
NIVEL DE URGENCIA: ${nivel_urgencia || "medio"}
LINK DE REFERENCIA: ${link_referencia || "Nenhum"}
OBSERVACOES: ${observacoes || "Nenhuma"}

IMPORTANTE: Retorne APENAS o JSON estruturado. Sem markdown, sem code blocks, sem texto adicional. Use apenas caracteres ASCII seguros.`;
}

function cleanJsonResponse(content: string): any {
  let cleaned = content.trim();
  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  // Remove leading/trailing non-JSON chars
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  // Remove control characters that break JSON
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (match) => {
    if (match === "\n" || match === "\r" || match === "\t") return match;
    return "";
  });
  return JSON.parse(cleaned);
}

interface AIProvider {
  name: string;
  url: string;
  apiKey: string;
  model: string;
  headers?: Record<string, string>;
}

// Provider policy: Groq (primary) > OpenRouter (fallback) > Lovable AI (last resort)
function getProviders(): AIProvider[] {
  const providers: AIProvider[] = [];

  // 1. Groq (primary - fastest, best for structured JSON)
  const groqKey = Deno.env.get("GROQ_API_KEY");
  if (groqKey) {
    providers.push({
      name: "Groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: groqKey,
      model: "llama-3.3-70b-versatile",
    });
  }

  // 2. OpenRouter (fallback)
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

  // 3. Lovable AI (last resort)
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (lovableKey) {
    providers.push({
      name: "Lovable AI",
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      apiKey: lovableKey,
      model: "google/gemini-2.5-flash",
    });
  }

  return providers;
}

async function callProvider(provider: AIProvider, messages: any[]): Promise<string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${provider.apiKey}`,
    "Content-Type": "application/json",
    ...(provider.headers || {}),
  };

  console.log(`[gerar-proposta] Trying provider: ${provider.name} (${provider.model})`);

  const response = await fetch(provider.url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: 0.3,
      max_tokens: 6000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${provider.name} error [${response.status}]: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${provider.name}: empty response`);
  return content;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const userPrompt = buildUserPrompt(body);
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ];

    const providers = getProviders();
    if (providers.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum provedor de IA configurado. Configure GROQ_API_KEY, OPENROUTER_API_KEY ou LOVABLE_API_KEY." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        const content = await callProvider(provider, messages);
        const proposalJson = cleanJsonResponse(content);
        
        const durationMs = Date.now() - startTime;
        console.log(`[gerar-proposta] Success with: ${provider.name} in ${durationMs}ms`);

        // Return proposal with observability metadata
        return new Response(
          JSON.stringify({
            proposta: proposalJson,
            _meta: {
              provider_used: provider.name,
              model_used: provider.model,
              prompt_version: PROMPT_VERSION,
              duration_ms: durationMs,
              output_size: JSON.stringify(proposalJson).length,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        console.error(`[gerar-proposta] Provider ${provider.name} failed:`, err);
        lastError = err instanceof Error ? err : new Error(String(err));

        // Don't fallback on rate limit / payment - return immediately
        if (err instanceof Error && (err.message.includes("429") || err.message.includes("402"))) {
          return new Response(
            JSON.stringify({
              error: `${provider.name}: Limite de requisicoes ou creditos excedidos. Tente novamente em alguns segundos.`,
              _meta: {
                provider_used: provider.name,
                model_used: provider.model,
                prompt_version: PROMPT_VERSION,
                duration_ms: Date.now() - startTime,
              },
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        error: `Todos os provedores falharam. Ultimo erro: ${lastError?.message || "desconhecido"}`,
        _meta: {
          prompt_version: PROMPT_VERSION,
          duration_ms: Date.now() - startTime,
        },
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[gerar-proposta] error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Erro desconhecido",
        _meta: { prompt_version: PROMPT_VERSION, duration_ms: Date.now() - startTime },
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
