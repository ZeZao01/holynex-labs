import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
        "X-Title": "HolyNex Labs",
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
  console.log(`Trying provider: ${provider.name}`);
  const response = await fetch(provider.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
      ...(provider.headers || {}),
    },
    body: JSON.stringify({ model: provider.model, messages, temperature: 0.3 }),
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
  return JSON.parse(cleaned);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: descricao_rapida },
    ];

    const providers = getProviders();
    if (providers.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum provedor de IA configurado." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let lastError: Error | null = null;
    for (const provider of providers) {
      try {
        const content = await callProvider(provider, messages);
        const parsed = cleanJson(content);
        console.log(`Success with: ${provider.name}`);
        return new Response(
          JSON.stringify({ campos: parsed }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        console.error(`${provider.name} failed:`, err);
        lastError = err instanceof Error ? err : new Error(String(err));
        if (err instanceof Error && (err.message.includes("429") || err.message.includes("402"))) {
          return new Response(
            JSON.stringify({ error: `${provider.name}: Limite excedido. Tente novamente.` }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ error: `Todos os provedores falharam: ${lastError?.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("preencher-formulario error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
