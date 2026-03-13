import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lead } = await req.json();
    if (!lead) throw new Error("Lead data required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Analise este lead comercial de uma software house e retorne classificação estruturada.

DADOS DO LEAD:
- Nome: ${lead.nome}
- Empresa: ${lead.empresa || "N/A"}
- Descrição: ${lead.descricao}
- Tipo de Projeto: ${lead.tipo_projeto || "N/A"}
- Nicho: ${lead.nicho || "N/A"}
- Objetivo: ${lead.objetivo || "N/A"}
- Faixa de investimento: ${lead.faixa_investimento || "N/A"}
- Prazo: ${lead.prazo_desejado || "N/A"}
- Urgência: ${lead.urgencia || "N/A"}
- Nº Usuários: ${lead.numero_usuarios || "N/A"}
- Precisa login: ${lead.precisa_login ? "Sim" : "Não"}
- Precisa admin: ${lead.precisa_admin ? "Sim" : "Não"}
- Precisa área cliente: ${lead.precisa_area_cliente ? "Sim" : "Não"}
- Precisa integrações: ${lead.precisa_integracoes ? "Sim" : "Não"}
- Precisa app mobile: ${lead.precisa_app_mobile ? "Sim" : "Não"}
- Aceita MVP: ${lead.aceita_mvp ? "Sim" : "Não"}
- Estágio: ${lead.estagio_operacao || "N/A"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Você é um analista comercial de uma software house. Classifique leads usando tool calling.",
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classificar_lead",
              description: "Retorna classificação estruturada do lead",
              parameters: {
                type: "object",
                properties: {
                  score_qualificacao: { type: "number", description: "Score de 0-100" },
                  faixa_ticket: { type: "string", enum: ["Micro", "Starter", "Standard", "Premium", "Enterprise"] },
                  complexidade_estimada: { type: "string", enum: ["baixa", "media", "alta"] },
                  temperatura_lead: { type: "string", enum: ["frio", "morno", "quente"] },
                  estrategia_comercial: { type: "string", enum: ["starter", "mvp_enxuto", "faseado", "ideal", "premium", "discovery"] },
                  dor_principal: { type: "string", description: "Resumo da dor principal do cliente em 1-2 frases" },
                  tags: { type: "array", items: { type: "string" }, description: "3-6 tags descritivas" },
                  oportunidades: { type: "string", description: "Oportunidades identificadas" },
                  riscos: { type: "string", description: "Riscos identificados" },
                },
                required: ["score_qualificacao", "faixa_ticket", "complexidade_estimada", "temperatura_lead", "estrategia_comercial", "dor_principal", "tags"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classificar_lead" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const classification = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(classification), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classificar-lead error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
