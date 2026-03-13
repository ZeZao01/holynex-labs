import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { proposta, input } = await req.json();
    if (!proposta || !input) throw new Error("Proposta and input data required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Baseado nesta proposta comercial de software, gere 4 faixas comerciais (starter, mvp, ideal, premium) com preços, prazos, escopos e add-ons.

DADOS DO PROJETO:
- Cliente: ${input.nome_cliente}
- Tipo: ${input.tipo_projeto}
- Segmento: ${input.segmento || "N/A"}
- Descrição: ${input.descricao_projeto}
- Orçamento: ${input.orcamento_cliente || "N/A"}
- Prazo: ${input.prazo_desejado || "N/A"}
- Urgência: ${input.nivel_urgencia || "medio"}
- Usuários: ${input.numero_usuarios || "N/A"}

VALORES SUGERIDOS PELA IA:
- Mínimo: R$ ${proposta.financeiro?.valor_minimo || 0}
- Ideal: R$ ${proposta.financeiro?.valor_ideal || 0}
- Premium: R$ ${proposta.financeiro?.valor_premium || 0}
- Complexidade: ${proposta.complexidade || "media"}

ESCOPO DA IA:
${(proposta.escopo || []).join(", ")}

FUNCIONALIDADES:
${(proposta.funcionalidades || []).join(", ")}`;

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
            content: `Você é um consultor comercial de software house. Gere faixas comerciais realistas e competitivas usando tool calling. 
Os módulos de escopo disponíveis são: auth, dashboard, crud, reports, pdf, notifications, integrations, client_area, ai, automations, multiuser, permissions, uploads, scheduling, finance.
Cada módulo pode ter status: "included", "optional", ou "not_included".
Starter deve ser básico, MVP enxuto mas funcional, Ideal completo, Premium com tudo + extras.`,
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_tiers",
              description: "Gera faixas comerciais estruturadas para proposta",
              parameters: {
                type: "object",
                properties: {
                  tiers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["starter", "mvp", "ideal", "premium"] },
                        name: { type: "string" },
                        price: { type: "number" },
                        estimated_days: { type: "number" },
                        description: { type: "string" },
                        detailed_scope: { type: "string" },
                        included_items: { type: "array", items: { type: "string" } },
                        excluded_items: { type: "array", items: { type: "string" } },
                        notes: { type: "string" },
                        installments: { type: "string" },
                        scope_modules: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              label: { type: "string" },
                              status: { type: "string", enum: ["included", "optional", "not_included"] },
                            },
                            required: ["id", "label", "status"],
                          },
                        },
                      },
                      required: ["type", "name", "price", "estimated_days", "description", "included_items", "scope_modules"],
                    },
                  },
                  recommended_tier: { type: "string", enum: ["starter", "mvp", "ideal", "premium"] },
                  notes: {
                    type: "object",
                    properties: {
                      general_note: { type: "string" },
                      recommendation_justification: { type: "string" },
                      closing_strategy: { type: "string" },
                      next_steps: { type: "string" },
                    },
                    required: ["general_note", "recommendation_justification", "closing_strategy", "next_steps"],
                  },
                },
                required: ["tiers", "recommended_tier", "notes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_tiers" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const parsed = JSON.parse(toolCall.function.arguments);

    // Add IDs and defaults to tiers
    const tiersWithIds = (parsed.tiers || []).map((t: any) => ({
      ...t,
      id: crypto.randomUUID(),
      is_recommended: t.type === parsed.recommended_tier,
      is_highlighted: t.type === parsed.recommended_tier,
      excluded_items: t.excluded_items || [],
      notes: t.notes || "",
      installments: t.installments || "",
      detailed_scope: t.detailed_scope || "",
    }));

    return new Response(JSON.stringify({
      tiers: tiersWithIds,
      recommended_tier: parsed.recommended_tier,
      notes: parsed.notes,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("gerar-tiers error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
