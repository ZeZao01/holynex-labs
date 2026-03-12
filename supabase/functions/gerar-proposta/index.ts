import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Motor Oficial de Propostas Comerciais da HolyNex Labs.

A HolyNex Labs é uma empresa especializada em desenvolvimento de software sob medida e produtos digitais (SaaS, Micro-SaaS, ERP, CRM, Dashboards, Plataformas com IA, Automações, etc).

Sua função é analisar os dados do projeto enviado e gerar uma proposta comercial completa e profissional, estruturada para geração automática de PDF com identidade visual premium.

IDENTIDADE VISUAL DO PDF:
• Estilo: moderno, corporativo, minimalista, tecnológico, premium
• Cores: Azul escuro, Azul tecnológico, Branco, Cinza claro
• Tipografia: títulos fortes, texto limpo, boa hierarquia visual
• Rodapé: "HolyNex Labs — Inovação em Desenvolvimento de Software — holynexlabs.com.br"

REGRAS:
- Responda APENAS com um JSON válido, sem texto adicional, sem markdown, sem code blocks
- Todos os valores monetários em BRL (R$)
- Seja profissional, estratégico e orientado a negócios
- Aumente a percepção de valor do projeto
- Pense como arquiteto de software + consultor comercial
- Se o orçamento for baixo, foque em MVP com funcionalidades essenciais
- Funcionalidades avançadas devem aparecer como evoluções futuras

O JSON deve seguir EXATAMENTE esta estrutura:
{
  "resumo_executivo": "string - resumo de 2-3 parágrafos profissionais, estratégico e convincente",
  "tipo_projeto": "string - classificação (SaaS, ERP, CRM, Dashboard, Sistema interno, etc)",
  "diagnostico": "string - análise detalhada do problema atual do cliente e oportunidade de melhoria com tecnologia",
  "solucao_proposta": "string - visão geral da solução proposta, como resolve o problema",
  "escopo": ["array de strings - módulos do sistema incluídos no MVP"],
  "funcionalidades": ["array de strings - funcionalidades principais práticas que o cliente utilizará"],
  "funcionalidades_recomendadas": ["array de strings - evoluções futuras não incluídas no orçamento atual"],
  "complexidade": "baixa|media|alta|avancada",
  "analise_estrategica": "string - impacto estratégico do projeto no negócio do cliente, benefícios como organização operacional, automação, centralização, redução de retrabalho, crescimento escalável",
  "estimativa_esforco": "string - estimativa de horas/equipe detalhada",
  "financeiro": {
    "valor_minimo": "number - valor mínimo em reais",
    "valor_ideal": "number - valor ideal em reais",
    "valor_premium": "number - valor premium em reais",
    "classificacao_margem": "margem_aceitavel|margem_saudavel|alta_rentabilidade|abaixo_da_margem|margem_critica"
  },
  "cronograma": "string - cronograma estimado em semanas/meses com fases",
  "manutencao": "string - sugestão detalhada de manutenção mensal e suporte contínuo",
  "riscos": ["array de strings - riscos identificados"],
  "proximos_passos": ["array de strings - etapas para iniciar: aprovação, kickoff, início do desenvolvimento"],
  "proposta_comercial": "string - texto COMPLETO da proposta comercial para o cliente, profissional e premium, seguindo a estrutura: 1-CAPA com apresentação da HolyNex Labs, 2-RESUMO EXECUTIVO, 3-DIAGNÓSTICO, 4-SOLUÇÃO PROPOSTA, 5-ESCOPO DO PROJETO (MVP), 6-FUNCIONALIDADES PRINCIPAIS, 7-FUNCIONALIDADES FUTURAS, 8-BENEFÍCIOS PARA O CLIENTE, 9-CRONOGRAMA, 10-INVESTIMENTO com faixas, 11-MANUTENÇÃO MENSAL, 12-PRÓXIMOS PASSOS. Use formatação clara com títulos, subtítulos e listas."
}

DIFERENCIAIS DA HOLYNEX LABS para incluir na proposta:
• Soluções sob medida
• Arquitetura escalável
• Automação de processos
• Foco em eficiência operacional
• Visão estratégica de crescimento
• Experiência em sistemas empresariais

GATILHOS COMERCIAIS para usar naturalmente:
• Ganho de eficiência
• Centralização de processos
• Automação operacional
• Escalabilidade
• Profissionalização da operação
• Crescimento sustentável`;

function buildUserPrompt(body: Record<string, any>): string {
  const {
    nome_cliente, empresa_cliente, segmento, tipo_projeto,
    descricao_projeto, problema_cliente, objetivo_cliente,
    funcionalidades_desejadas, integracoes, numero_usuarios,
    prazo_desejado, orcamento_cliente, nivel_urgencia,
    link_referencia, observacoes,
  } = body;

  return `Gere uma proposta comercial completa e profissional para geração de PDF com identidade visual premium:

CLIENTE: ${nome_cliente || "Não informado"}
EMPRESA: ${empresa_cliente || "Não informado"}
SEGMENTO: ${segmento || "Não informado"}
TIPO DE PROJETO: ${tipo_projeto || "Não especificado"}

DESCRIÇÃO DO PROJETO:
${descricao_projeto || "Não informado"}

PROBLEMA DO CLIENTE:
${problema_cliente || "Não informado"}

OBJETIVO DO CLIENTE:
${objetivo_cliente || "Não informado"}

FUNCIONALIDADES DESEJADAS:
${Array.isArray(funcionalidades_desejadas) ? funcionalidades_desejadas.join(", ") : funcionalidades_desejadas || "Não especificado"}

INTEGRAÇÕES:
${Array.isArray(integracoes) ? integracoes.join(", ") : integracoes || "Nenhuma especificada"}

NÚMERO DE USUÁRIOS: ${numero_usuarios || "Não informado"}
PRAZO DESEJADO: ${prazo_desejado || "Não informado"}
ORÇAMENTO DO CLIENTE: ${orcamento_cliente || "Não informado"}
NÍVEL DE URGÊNCIA: ${nivel_urgencia || "medio"}

LINK DE REFERÊNCIA: ${link_referencia || "Nenhum"}

OBSERVAÇÕES:
${observacoes || "Nenhuma"}

IMPORTANTE: Retorne APENAS o JSON estruturado conforme o formato especificado. Sem markdown, sem code blocks, sem texto adicional.`;
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

  // 2. OpenRouter (fallback - access to many models)
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

  console.log(`Trying provider: ${provider.name} (${provider.model})`);

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
        
        console.log(`Success with provider: ${provider.name}`);
        return new Response(
          JSON.stringify({ proposta: proposalJson, provider: provider.name }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        console.error(`Provider ${provider.name} failed:`, err);
        lastError = err instanceof Error ? err : new Error(String(err));

        // Don't fallback on rate limit - return immediately
        if (err instanceof Error && (err.message.includes("429") || err.message.includes("402"))) {
          return new Response(
            JSON.stringify({ error: `${provider.name}: Limite de requisições ou créditos excedidos. Tente novamente em alguns segundos.` }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ error: `Todos os provedores falharam. Último erro: ${lastError?.message || "desconhecido"}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("gerar-proposta error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
