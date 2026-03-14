import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROMPT_VERSION = "v4.0-niche-adaptive";

const SYSTEM_PROMPT = `Voce e o Motor Oficial de Propostas Comerciais da HolyNex Labs.

A HolyNex Labs e uma empresa especializada em desenvolvimento de software sob medida e produtos digitais (SaaS, Micro-SaaS, ERP, CRM, Dashboards, Plataformas com IA, Automacoes, etc).

Sua funcao e analisar os dados do projeto enviado e gerar uma proposta comercial ESTRUTURADA e ADAPTADA AO NICHO do cliente.

REGRAS CRITICAS:
- Responda APENAS com um JSON valido, sem texto adicional, sem markdown, sem code blocks
- NAO use caracteres especiais unicode (sem emojis, sem checkmarks, sem setas unicode)
- Todos os valores monetarios em BRL (R$) como numeros
- Seja profissional, estrategico e orientado a negocios
- Aumente a percepcao de valor do projeto
- Se o orcamento for baixo, foque em MVP com funcionalidades essenciais
- Funcionalidades avancadas devem aparecer como evolucoes futuras
- CADA SECAO deve ser concisa e objetiva, sem repeticao entre secoes
- ADAPTE toda a linguagem, KPIs, riscos e referencias ao nicho/segmento do cliente
- Use referencias de especialistas REAIS e fontes confiáveis (Gartner, McKinsey, Deloitte, Harvard, Forrester, etc)
- Crie conteudo ORIGINAL baseado no contexto real do projeto, NAO use templates genericos

ESTRUTURA OBRIGATORIA DO JSON:
{
  "resumo_executivo": "string (max 800 chars) - resumo profissional e estrategico adaptado ao nicho",
  "tipo_projeto": "string - classificacao (SaaS, ERP, CRM, Dashboard, etc)",
  "diagnostico": "string (max 600 chars) - analise do problema atual do cliente no contexto do segmento",
  "solucao_proposta": "string (max 600 chars) - visao geral da solucao contextualizada",
  "escopo": ["array de strings - modulos do MVP"],
  "funcionalidades": ["array de strings - funcionalidades principais"],
  "funcionalidades_recomendadas": ["array de strings - evolucoes futuras"],
  "complexidade": "baixa|media|alta|avancada",
  "analise_estrategica": "string (max 600 chars) - impacto estrategico no negocio do cliente",
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
  "proposta_comercial": "string - texto resumido da proposta para uso interno/historico",

  "niche_intelligence": {
    "segment_detected": "string - nome do segmento identificado (ex: Saude, Educacao, E-commerce, Financeiro, Imobiliario, Coworking, Restaurante, Logistica, Juridico, Beleza, Fitness, etc)",
    "kpis": [
      {"label": "string - nome do KPI relevante ao nicho", "metric": "string - valor esperado (ex: +35%, -40%, 99.9%)"},
      {"label": "string", "metric": "string"},
      {"label": "string", "metric": "string"},
      {"label": "string", "metric": "string"}
    ],
    "risk_matrix": [
      {"title": "string - nome do risco", "impact": "string - impacto se ocorrer", "mitigation": "string - como mitigar", "severity": "alto|medio|baixo"},
      {"title": "string", "impact": "string", "mitigation": "string", "severity": "alto|medio|baixo"},
      {"title": "string", "impact": "string", "mitigation": "string", "severity": "alto|medio|baixo"}
    ],
    "strategic_benefits": [
      {"title": "string - titulo do beneficio", "desc": "string - descricao com referencia de especialista real (fonte + ano)"},
      {"title": "string", "desc": "string"},
      {"title": "string", "desc": "string"}
    ],
    "timeline_phases": [
      {"title": "string - ex: FASE 01", "subtitle": "string - nome da fase", "desc": "string - atividades separadas por \\n"},
      {"title": "string", "subtitle": "string", "desc": "string"}
    ],
    "scope_labels": {
      "landing": "string - nome contextualizado para a landing page (ex: Portal do Paciente, Loja Online)",
      "user": "string - nome contextualizado para area do usuario",
      "admin": "string - nome contextualizado para area administrativa"
    },
    "investment_justification": "string - justificativa de investimento com fonte real (ex: Segundo a Gartner 2024...)",
    "expert_reference": "string - referencia bibliografica completa (ex: Ref: Harvard Business Review - Digital Transformation 2024)",
    "maintenance_features": ["string - item de manutencao especifico ao nicho", "string", "string", "string"]
  }
}

IMPORTANTE SOBRE niche_intelligence:
- Os KPIs devem ser ESPECIFICOS ao segmento do cliente (ex: para clinica = Retencao de Pacientes, para e-commerce = Taxa de Conversao)
- Os riscos devem refletir desafios REAIS do setor (ex: conformidade LGPD para saude, PCI-DSS para pagamentos)
- Os beneficios devem citar fontes REAIS e anos recentes (2023-2025)
- As fases do cronograma devem ser adaptadas ao tipo de projeto
- NAO copie templates genericos. Crie conteudo ORIGINAL baseado no contexto do projeto

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

  return `Gere a proposta comercial estruturada em JSON com niche_intelligence COMPLETO:

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

INSTRUCOES ESPECIAIS:
1. Analise o SEGMENTO e DESCRICAO para detectar o nicho exato do cliente
2. Gere KPIs, riscos, beneficios e referencias ESPECIFICOS para esse nicho
3. Use fontes e referencias de especialistas REAIS (Gartner, McKinsey, Harvard, Forrester, Deloitte, etc)
4. Adapte a linguagem e terminologia ao contexto do cliente
5. NAO use conteudo generico - cada proposta deve ser UNICA

IMPORTANTE: Retorne APENAS o JSON estruturado. Sem markdown, sem code blocks, sem texto adicional. Use apenas caracteres ASCII seguros.`;
}

function cleanJsonResponse(content: string): any {
  let cleaned = content.trim();
  cleaned = cleaned.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
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
      temperature: 0.4,
      max_tokens: 8000,
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

        return new Response(
          JSON.stringify({
            proposta: proposalJson,
            _meta: {
              provider_used: provider.name,
              model_used: provider.model,
              prompt_version: PROMPT_VERSION,
              duration_ms: durationMs,
              output_size: JSON.stringify(proposalJson).length,
              niche_detected: proposalJson?.niche_intelligence?.segment_detected || "generico",
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        console.error(`[gerar-proposta] Provider ${provider.name} failed:`, err);
        lastError = err instanceof Error ? err : new Error(String(err));

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
        _meta: { prompt_version: PROMPT_VERSION, duration_ms: Date.now() - startTime },
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
