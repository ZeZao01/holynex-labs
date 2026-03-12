import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { descricao_rapida } = await req.json();
    if (!descricao_rapida?.trim()) {
      return new Response(
        JSON.stringify({ error: "Descrição rápida é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é um assistente da HolyNex Labs que extrai dados estruturados de descrições curtas de projetos.

Dada uma descrição rápida de um orçamento/projeto, extraia e preencha o máximo de campos possível.

Retorne APENAS um JSON válido com esta estrutura (preencha "" se não conseguir inferir):
{
  "nome_cliente": "",
  "empresa_cliente": "",
  "segmento": "",
  "email_cliente": "",
  "tipo_projeto": "Landing Page|Site institucional|Sistema interno|Sistema administrativo|CRM|ERP|Dashboard|Plataforma SaaS|Micro-SaaS|Marketplace|Automação empresarial|Plataforma com IA|Sistema operacional|Outro",
  "descricao_projeto": "",
  "problema_cliente": "",
  "objetivo_cliente": "",
  "funcionalidades_desejadas": [],
  "integracoes": [],
  "numero_usuarios": "",
  "prazo_desejado": "",
  "orcamento_cliente": "",
  "nivel_urgencia": "baixo|medio|alto|urgente",
  "link_referencia": "",
  "observacoes": ""
}

REGRAS:
- Expanda a descrição curta em uma descrição de projeto detalhada e profissional
- Infira funcionalidades com base no tipo de projeto
- Infira integrações comuns para o segmento
- Se mencionar valores, coloque em orcamento_cliente
- Se mencionar prazo, coloque em prazo_desejado
- Classifique urgência com base em palavras-chave
- tipo_projeto deve ser exatamente um dos valores listados
- Sempre preencha descricao_projeto com uma versão expandida e profissional
- Sem markdown, sem texto extra, apenas JSON`;

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
            { role: "system", content: systemPrompt },
            { role: "user", content: descricao_rapida },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes." }),
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

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Erro ao processar resposta da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ campos: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("preencher-formulario error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
