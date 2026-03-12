import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Motor Inteligente de Propostas Comerciais da HolyNex Labs.

A HolyNex Labs é uma empresa especializada em desenvolvimento de software sob medida e produtos digitais (SaaS, Micro-SaaS, ERP, CRM, Dashboards, Plataformas com IA, Automações, etc).

Sua função é analisar os dados do projeto enviado e gerar uma proposta comercial completa.

REGRAS:
- Responda APENAS com um JSON válido, sem texto adicional, sem markdown
- Todos os valores monetários em BRL (R$)
- Seja profissional, estratégico e orientado a negócios
- Aumente a percepção de valor do projeto
- Pense como arquiteto de software + consultor comercial

O JSON deve seguir EXATAMENTE esta estrutura:
{
  "resumo_executivo": "string - resumo de 2-3 parágrafos",
  "tipo_projeto": "string - classificação (SaaS, ERP, CRM, Dashboard, Sistema interno, etc)",
  "diagnostico": "string - análise do problema e oportunidade",
  "solucao_proposta": "string - visão geral da solução",
  "escopo": ["array de strings - módulos do sistema"],
  "funcionalidades": ["array de strings - funcionalidades principais"],
  "funcionalidades_recomendadas": ["array de strings - sugestões extras de valor"],
  "complexidade": "baixa|media|alta|avancada",
  "analise_estrategica": "string - impacto do projeto no negócio do cliente",
  "estimativa_esforco": "string - estimativa de horas/equipe",
  "financeiro": {
    "valor_minimo": "number",
    "valor_ideal": "number",
    "valor_premium": "number",
    "classificacao_margem": "margem_aceitavel|margem_saudavel|alta_rentabilidade|abaixo_da_margem|margem_critica"
  },
  "cronograma": "string - cronograma estimado em semanas/meses",
  "manutencao": "string - sugestão de manutenção mensal",
  "riscos": ["array de strings"],
  "proximos_passos": ["array de strings"],
  "proposta_comercial": "string - texto completo da proposta para o cliente, profissional e premium, com introdução, escopo, diferenciais da HolyNex Labs, investimento, condições e encerramento"
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();
    const {
      nome_cliente,
      empresa_cliente,
      segmento,
      tipo_projeto,
      descricao_projeto,
      problema_cliente,
      objetivo_cliente,
      funcionalidades_desejadas,
      integracoes,
      numero_usuarios,
      prazo_desejado,
      orcamento_cliente,
      nivel_urgencia,
      link_referencia,
      observacoes,
    } = body;

    const userPrompt = `Gere uma proposta comercial completa para:

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

Retorne APENAS o JSON estruturado conforme o formato especificado.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro no gateway de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
    let proposalJson;
    try {
      // Remove markdown code blocks if present
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      proposalJson = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response as JSON:", content);
      return new Response(
        JSON.stringify({ error: "Erro ao processar resposta da IA", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ proposta: proposalJson }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("gerar-proposta error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
