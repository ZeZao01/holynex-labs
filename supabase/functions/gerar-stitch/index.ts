import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getAiProviderSettings,
  getAiModelSettings,
  getPromptPolicies,
  resolveAiProviders,
  resolvePromptPolicy,
} from "../_shared/system-settings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROMPT_VERSION = "stitch-v1.0";

async function callAI(
  providers: { name: string; url: string; apiKey: string; model: string; headers?: Record<string, string> }[],
  messages: any[],
  temperature: number,
  maxTokens: number,
): Promise<{ content: string; provider: string; model: string }> {
  if (providers.length === 0) throw new Error("Nenhum provedor de IA configurado.");

  for (const provider of providers) {
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
        ...(provider.headers || {}),
      };

      console.log(`[gerar-stitch] Trying ${provider.name} (${provider.model})`);
      const response = await fetch(provider.url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[gerar-stitch] ${provider.name} [${response.status}]: ${errorText}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        console.error(`[gerar-stitch] ${provider.name}: empty response`);
        continue;
      }
      console.log(`[gerar-stitch] ${provider.name} succeeded`);
      return { content, provider: provider.name, model: provider.model };
    } catch (err) {
      console.error(`[gerar-stitch] ${provider.name} failed:`, err);
    }
  }
  throw new Error("Todos os provedores falharam.");
}

const SYSTEM_PROMPT = `Voce e o arquiteto de sistemas da HolyNex Labs. Sua tarefa e gerar um PROMPT STITCH — um briefing tecnico e visual completo para a equipe de desenvolvimento montar o sistema descrito.

O prompt Stitch e usado pela equipe como guia de modelagem, prototipacao e desenvolvimento. Ele deve ser extremamente detalhado, pratico e acionavel.

Com base nos dados fornecidos (lead, nicho, modulos, funcionalidades, diferenciais, referencias visuais, portfolio, add-ons ocultos), gere o prompt Stitch contendo TODAS as secoes abaixo:

FORMATO DO OUTPUT (texto puro, bem estruturado com markdown):

## CONTEXTO DO NEGOCIO
- Nicho, tipo de operacao, dor principal, objetivo do cliente

## TIPO DE SISTEMA
- Classificacao (SaaS, ERP, CRM, Landing Page, etc)
- Publico-alvo do sistema
- Escala esperada

## ESTRUTURA DE PAGINAS
- Listagem de todas as paginas/telas previstas
- Organizacao por area (publica, cliente, admin)
- Hierarquia de navegacao

## MODULOS PRINCIPAIS
- Lista de modulos com breve descricao funcional
- Dependencias entre modulos
- Prioridade de implementacao

## COMPONENTES PRINCIPAIS
- Componentes reutilizaveis previstos
- Patterns de UI recomendados
- Componentes de dados (tabelas, graficos, cards)

## HIERARQUIA VISUAL
- Layout geral recomendado
- Sidebar vs topbar
- Esquema de cores sugerido pelo nicho
- Tipografia recomendada
- Espacamento e densidade de informacao

## SUGESTOES DE DASHBOARD
- Metricas principais
- Graficos recomendados
- KPIs por papel de usuario
- Widgets prioritarios

## SECOES ESTRATEGICAS
- Areas do sistema que diferenciam da concorrencia
- Funcionalidades que agregam valor percebido
- Pontos de conversao/retencao

## ESTADOS IMPORTANTES
- Loading states
- Empty states
- Error states
- Success feedback
- Onboarding flow

## OBSERVACOES DE UX OPERACIONAL
- Fluxos criticos do usuario
- Pontos de friccao a evitar
- Acessibilidade
- Mobile responsiveness
- Performance considerations

## MODULOS ATIVAVEIS NO FUTURO (Add-ons Ocultos)
- Modulos preparados na arquitetura mas nao implementados
- Trigger de ativacao
- Impacto tecnico da ativacao
- Prioridade futura

## STACK RECOMENDADA
- Frontend, backend, banco de dados
- Bibliotecas e ferramentas
- Integracoes externas previstas

## PRIORIDADES DE IMPLEMENTACAO
- Fase 1: MVP
- Fase 2: Expansao
- Fase 3: Escala

Regras:
- Seja extremamente pratico e especifico
- Use terminologia tecnica real
- Inclua nomes de componentes quando possivel
- Referencie padroes de mercado
- Nao seja generico — adapte ao nicho e contexto do lead
- O prompt deve ser utilizavel diretamente pela equipe de dev
- Maximo: 6000 caracteres`;

function buildUserPrompt(body: Record<string, any>): string {
  const parts: string[] = [];

  parts.push(`CLIENTE: ${body.nome_cliente || "N/I"}`);
  parts.push(`EMPRESA: ${body.empresa_cliente || "N/I"}`);
  parts.push(`NICHO/SEGMENTO: ${body.segmento || body.nicho || "N/I"}`);
  parts.push(`TIPO PROJETO: ${body.tipo_projeto || "N/I"}`);
  parts.push(`DESCRICAO: ${body.descricao_projeto || "N/I"}`);

  if (body.problema_cliente) parts.push(`PROBLEMA: ${body.problema_cliente}`);
  if (body.objetivo_cliente) parts.push(`OBJETIVO: ${body.objetivo_cliente}`);

  if (body.funcionalidades?.length) {
    parts.push(`FUNCIONALIDADES PRINCIPAIS: ${body.funcionalidades.join(", ")}`);
  }
  if (body.funcionalidades_recomendadas?.length) {
    parts.push(`FUNCIONALIDADES RECOMENDADAS: ${body.funcionalidades_recomendadas.join(", ")}`);
  }
  if (body.escopo?.length) {
    parts.push(`ESCOPO: ${body.escopo.join(", ")}`);
  }
  if (body.modulos?.length) {
    parts.push(`MODULOS SUGERIDOS: ${body.modulos.join(", ")}`);
  }
  if (body.diferenciais?.length) {
    parts.push(`DIFERENCIAIS: ${body.diferenciais.join(", ")}`);
  }

  if (body.referencias_visuais?.length) {
    parts.push(`REFERENCIAS VISUAIS: ${body.referencias_visuais.length} imagens enviadas pelo lead`);
  }

  if (body.portfolio_refs?.length) {
    const refs = body.portfolio_refs.map((r: any) =>
      typeof r === "string" ? r : `${r.title || r.reason || "Ref"} (${r.niche_match || r.category || ""})`
    );
    parts.push(`REFERENCIAS PORTFOLIO: ${refs.join("; ")}`);
  }

  if (body.hidden_addons?.length) {
    const addons = body.hidden_addons.map((a: any) =>
      typeof a === "string" ? a : `${a.name || "Add-on"} (${a.category || ""}, trigger: ${a.trigger_condition || "N/I"})`
    );
    parts.push(`ADD-ONS OCULTOS PREVISTOS: ${addons.join("; ")}`);
  }

  if (body.estilo_visual) {
    parts.push(`ESTILO VISUAL: ${body.estilo_visual}`);
  }

  if (body.structured_content) {
    const sc = body.structured_content;
    if (sc.visao_projeto) parts.push(`VISAO DO PROJETO: ${sc.visao_projeto}`);
    if (sc.resumo_interno) parts.push(`RESUMO INTERNO: ${sc.resumo_interno}`);
    if (sc.roadmap_macro?.length) parts.push(`ROADMAP: ${sc.roadmap_macro.join(", ")}`);
  }

  if (body.pricing_sheet) {
    const ps = body.pricing_sheet;
    if (ps.tier_mvp?.modules?.length) parts.push(`MODULOS MVP: ${ps.tier_mvp.modules.join(", ")}`);
    if (ps.tier_ideal?.modules?.length) parts.push(`MODULOS IDEAL: ${ps.tier_ideal.modules.join(", ")}`);
  }

  if (body.analise_arquitetural) {
    const a = body.analise_arquitetural;
    if (a.interpretacao_tecnica) parts.push(`INTERPRETACAO TECNICA: ${a.interpretacao_tecnica}`);
    if (a.stack_sugerida?.length) parts.push(`STACK SUGERIDA: ${a.stack_sugerida.join(", ")}`);
  }

  if (body.observacoes) parts.push(`OBSERVACOES ADICIONAIS: ${body.observacoes}`);

  parts.push("\nGere o prompt Stitch completo e detalhado para este projeto.");

  return parts.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    console.log(`[gerar-stitch] Starting for: ${body.nome_cliente || "unknown"}`);

    const [providerSettings, modelSettings, promptPolicies] = await Promise.all([
      getAiProviderSettings(),
      getAiModelSettings(),
      getPromptPolicies(),
    ]);
    const providers = resolveAiProviders(providerSettings, modelSettings, "gerar-stitch");
    if (providers.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum provedor de IA configurado." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const policy = resolvePromptPolicy(promptPolicies, "gerar-stitch", {
      temperature: 0.4,
      max_tokens: 6000,
    });

    const result = await callAI(
      providers,
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(body) },
      ],
      policy.temperature,
      policy.max_tokens,
    );

    const durationMs = Date.now() - startTime;
    console.log(`[gerar-stitch] Completed in ${durationMs}ms via ${result.provider}`);

    return new Response(
      JSON.stringify({
        stitch_prompt: result.content.trim(),
        _meta: {
          provider_used: result.provider,
          model_used: result.model,
          prompt_version: PROMPT_VERSION,
          duration_ms: durationMs,
          output_size: result.content.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[gerar-stitch] Error:", e);
    const durationMs = Date.now() - startTime;

    if (e instanceof Error && (e.message.includes("429") || e.message.includes("402"))) {
      return new Response(
        JSON.stringify({ error: "Limite de requisicoes excedido. Tente novamente em alguns segundos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
