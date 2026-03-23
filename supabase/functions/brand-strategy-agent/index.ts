import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getAiModelSettings,
  getAiProviderSettings,
  getPromptPolicies,
  resolveAiProviders,
  resolvePromptPolicy,
} from "../_shared/system-settings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type JsonObject = Record<string, unknown>;

type CreativeDirection = {
  titulo: string;
  descricao: string;
  justificativa_estrategica: string;
  tom_visual: string;
  atributos_chave: string[];
  palavras_chave: string[];
  aplicacoes: string[];
  evitar: string[];
};

type StrategyOutput = {
  posicionamento: string;
  arquetipo: string;
  atributos: string[];
  tom_visual: string;
  direcoes_criativas: CreativeDirection[];
  evitar: string[];
  recomendacao_principal: string;
};

type ReferenceInput = {
  reference_type?: string;
  signed_url?: string | null;
  public_url?: string | null;
  source_url?: string | null;
  storage_path?: string | null;
  note?: string | null;
};

type BriefInput = {
  nome_marca?: string | null;
  slogan?: string | null;
  nicho?: string | null;
  publico_alvo_detalhado?: string | null;
  publico_alvo?: string | null;
  proposta_valor?: string | null;
  concorrentes?: string[] | null;
  estilos_desejados?: string[] | null;
  estilos_evitar?: string[] | null;
  objetivos_identidade?: string[] | null;
  referencia_visual_contexto?: string | null;
  contexto?: string | null;
  observacoes_adicionais?: string | null;
  normalized_context?: JsonObject | null;
};

type RequestPayload = {
  project?: JsonObject;
  brief?: BriefInput;
  references?: ReferenceInput[];
  normalized_context?: JsonObject | null;
  fallback?: StrategyOutput;
  prompt_version?: string;
};

const asList = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))]
    : [];

const toText = (value: unknown) => String(value || "").trim();

function buildFallback(brief: BriefInput, references: ReferenceInput[]): StrategyOutput {
  const brand = brief.nome_marca || "Marca";
  const niche = brief.nicho || "nicho principal";
  const value = brief.proposta_valor || "proposta de valor";
  const audience = brief.publico_alvo_detalhado || brief.publico_alvo || "publico-alvo";
  const desired = asList(brief.estilos_desejados);
  const avoid = asList(brief.estilos_evitar);
  const goals = asList(brief.objetivos_identidade);
  const refCount = references.length;

  const baseKeywords = [niche, value, audience].map((item) => toText(item)).filter(Boolean);

  const directions: CreativeDirection[] = [
    {
      titulo: "Essencia Estrategica",
      descricao: `Direcao que reforca autoridade e clareza no setor de ${niche}.`,
      justificativa_estrategica: `Conecta a proposta de valor com sinais de confianca para ${audience}.`,
      tom_visual: desired[0] || "sofisticado e direto",
      atributos_chave: ["confianca", "clareza", "consistencia"],
      palavras_chave: baseKeywords,
      aplicacoes: ["logo", "paleta", "tipografia", "materiais institucionais"],
      evitar: avoid.length ? avoid : ["visual generico", "excesso de ornamentos"],
    },
    {
      titulo: "Proposta Memoravel",
      descricao: "Direcao que destaca diferencial competitivo e cria reconhecimento rapido.",
      justificativa_estrategica: `Amplifica a percepcao de ${value} em todos os pontos de contato.`,
      tom_visual: desired[1] || "marcante e contemporaneo",
      atributos_chave: ["diferenciacao", "energia", "memorabilidade"],
      palavras_chave: baseKeywords,
      aplicacoes: ["campanhas", "landing pages", "apresentacoes"],
      evitar: avoid.length ? avoid : ["mensagens vagas", "visual datado"],
    },
    {
      titulo: "Conexao Humana",
      descricao: "Direcao focada em proximidade e empatia, sem perder sofisticacao.",
      justificativa_estrategica: `Cria ponte emocional com ${audience} e facilita conversao.`,
      tom_visual: desired[2] || "acolhedor e elegante",
      atributos_chave: ["empatia", "acessibilidade", "autenticidade"],
      palavras_chave: baseKeywords,
      aplicacoes: ["redes sociais", "conteudo educativo", "experiencia digital"],
      evitar: avoid.length ? avoid : ["tom frio", "excesso de formalidade"],
    },
  ];

  const combinedAvoid = [...new Set([...avoid, "inconsistencia visual", "promessas exageradas"])].filter(Boolean);

  return {
    posicionamento: `Marca posicionada em ${niche}, com foco em ${value} para ${audience}.`,
    arquetipo: "Sábio",
    atributos: ["confiavel", "estrategico", "moderno", ...goals].filter(Boolean),
    tom_visual: desired[0] || "sofisticado, claro e atual",
    direcoes_criativas: directions,
    evitar: combinedAvoid,
    recomendacao_principal: directions[0].titulo,
  };
}

function parseResponseContent(content: string): unknown {
  const stripped = content
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  const candidate = first >= 0 && last > first ? stripped.slice(first, last + 1) : stripped;
  return JSON.parse(candidate);
}

function coerceDirection(raw: Record<string, unknown>, fallback: CreativeDirection): CreativeDirection {
  const list = (value: unknown) => (Array.isArray(value) ? value.map((item) => String(item || "").trim()).filter(Boolean) : []);
  return {
    titulo: toText(raw.titulo || fallback.titulo),
    descricao: toText(raw.descricao || fallback.descricao),
    justificativa_estrategica: toText(raw.justificativa_estrategica || fallback.justificativa_estrategica),
    tom_visual: toText(raw.tom_visual || fallback.tom_visual),
    atributos_chave: list(raw.atributos_chave).length ? list(raw.atributos_chave) : fallback.atributos_chave,
    palavras_chave: list(raw.palavras_chave).length ? list(raw.palavras_chave) : fallback.palavras_chave,
    aplicacoes: list(raw.aplicacoes).length ? list(raw.aplicacoes) : fallback.aplicacoes,
    evitar: list(raw.evitar).length ? list(raw.evitar) : fallback.evitar,
  };
}

function coerceOutput(candidate: unknown, fallback: StrategyOutput): StrategyOutput | null {
  if (!candidate || typeof candidate !== "object") return null;
  const root = candidate as Record<string, unknown>;
  const raw =
    root.output && typeof root.output === "object"
      ? (root.output as Record<string, unknown>)
      : root;

  if (!raw.direcoes_criativas || !Array.isArray(raw.direcoes_criativas)) return null;

  const directions = (raw.direcoes_criativas as Array<Record<string, unknown>>).map((item, index) =>
    coerceDirection(item, fallback.direcoes_criativas[index] || fallback.direcoes_criativas[0])
  );

  return {
    posicionamento: toText(raw.posicionamento || fallback.posicionamento),
    arquetipo: toText(raw.arquetipo || fallback.arquetipo),
    atributos: asList(raw.atributos).length ? asList(raw.atributos) : fallback.atributos,
    tom_visual: toText(raw.tom_visual || fallback.tom_visual),
    direcoes_criativas: directions.length ? directions : fallback.direcoes_criativas,
    evitar: asList(raw.evitar).length ? asList(raw.evitar) : fallback.evitar,
    recomendacao_principal: toText(raw.recomendacao_principal || fallback.recomendacao_principal),
  };
}

async function callProvider(
  provider: { name: string; url: string; apiKey: string; model: string; headers?: Record<string, string> },
  messages: Array<{ role: string; content: string }>,
  policy: { temperature: number; max_tokens: number }
) {
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
      temperature: policy.temperature,
      max_tokens: policy.max_tokens,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${provider.name} [${response.status}] ${text}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`${provider.name}: resposta vazia`);
  }

  return content as string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as RequestPayload;
    const brief = payload?.brief || {};
    const references = Array.isArray(payload?.references) ? payload.references : [];
    const fallback = payload?.fallback || buildFallback(brief, references);

    let output = fallback;
    let usedFallback = true;
    let providerUsed = "local-strategy";
    let modelUsed = "brand-strategy-heuristic-v1";

    try {
      const [providerSettings, modelSettings, promptPolicies] = await Promise.all([
        getAiProviderSettings(),
        getAiModelSettings(),
        getPromptPolicies(),
      ]);

      const providers = resolveAiProviders(providerSettings, modelSettings, "brand_strategy_agent");
      if (providers.length > 0) {
        const policy = resolvePromptPolicy(promptPolicies, "brand_strategy_agent", {
          temperature: 0.25,
          max_tokens: 3200,
        });

        const systemPrompt = [
          "Voce e o brand_strategy_agent da HolyNex.",
          "Transforme um briefing normalizado em direcao estrategica e criativa.",
          "Responda APENAS com JSON valido.",
          "Estrutura obrigatoria do JSON:",
          "{\"posicionamento\":\"\",\"arquetipo\":\"\",\"atributos\":[],\"tom_visual\":\"\",\"direcoes_criativas\":[{\"titulo\":\"\",\"descricao\":\"\",\"justificativa_estrategica\":\"\",\"tom_visual\":\"\",\"atributos_chave\":[],\"palavras_chave\":[],\"aplicacoes\":[],\"evitar\":[]}],\"evitar\":[],\"recomendacao_principal\":\"\"}",
          "Regras:",
          "- Traga 3 direcoes criativas objetivas.",
          "- recomendacao_principal deve ser o titulo da direcao recomendada.",
          "- Evite respostas vagas; detalhe justificativa estrategica.",
        ].join("\n");

        const userPrompt = JSON.stringify(
          {
            project: payload.project || {},
            brief,
            normalized_context: payload.normalized_context || brief.normalized_context || {},
            references,
            fallback,
            prompt_version: payload.prompt_version || "brand_strategy_v1",
          },
          null,
          2
        );

        for (const provider of providers) {
          try {
            const content = await callProvider(
              provider,
              [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Contexto:\n${userPrompt}` },
              ],
              policy
            );

            const parsed = parseResponseContent(content);
            const coerced = coerceOutput(parsed, fallback);
            if (coerced) {
              output = coerced;
              usedFallback = false;
              providerUsed = provider.name;
              modelUsed = provider.model;
              break;
            }
          } catch (_err) {
            continue;
          }
        }
      }
    } catch (_err) {
      usedFallback = true;
    }

    return new Response(
      JSON.stringify({
        output,
        used_fallback: usedFallback,
        provider_used: providerUsed,
        model_used: modelUsed,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro ao executar brand_strategy_agent" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
