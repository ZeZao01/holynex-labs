export type DevelopmentTarget = "codex" | "lovable" | "stitch" | "generic";
export type DevelopmentProduct = "site" | "landing_page" | "internal_system" | "saas";

export interface DevelopmentLeadContext {
  id: string;
  contactName: string;
  company: string;
  niche: string;
  projectType: string;
  objective: string;
  mainPain: string;
  briefing: string;
  detailedBriefing?: string;
  operationStage?: string;
  desiredDeadline?: string;
  investmentRange?: string;
  users?: string;
  needsLogin?: boolean;
  needsAdmin?: boolean;
  needsCustomerArea?: boolean;
  needsIntegrations?: boolean;
  needsMobileApp?: boolean;
  recommendedModules?: string[];
  suggestedStack?: string[];
  risks?: string[];
  opportunities?: string[];
  roadmap?: string[];
  portfolioReferences?: string[];
}

export interface DevelopmentPromptInput {
  lead: DevelopmentLeadContext;
  target: DevelopmentTarget;
  product: DevelopmentProduct;
  additionalInstructions?: string;
}

const TARGET_LABELS: Record<DevelopmentTarget, string> = {
  codex: "Codex",
  lovable: "Lovable",
  stitch: "Google Stitch",
  generic: "uma IA de desenvolvimento",
};

const PRODUCT_LABELS: Record<DevelopmentProduct, string> = {
  site: "site institucional",
  landing_page: "landing page de conversão",
  internal_system: "sistema interno",
  saas: "plataforma SaaS",
};

const list = (values?: string[]) => values?.filter(Boolean).map((value) => `- ${value}`).join("\n") || "- A definir após discovery";
const value = (input?: string) => input?.trim() || "A definir";

function targetInstructions(target: DevelopmentTarget): string {
  if (target === "codex") {
    return `- Leia primeiro o repositório, as instruções locais e o design system existente.
- Implemente a experiência real, com código funcional, dados tipados e estados de loading, vazio, erro e sucesso.
- Preserve arquivos e mudanças existentes; mantenha o escopo próximo aos módulos responsáveis.
- Execute build, testes e QA visual em desktop e mobile antes de concluir.`;
  }
  if (target === "lovable") {
    return `- Crie diretamente o produto utilizável, não uma página de marketing genérica.
- Reuse Supabase, componentes e tokens existentes quando disponíveis.
- Não invente integrações ou dados reais; use estados honestos e marque dependências externas.
- Entregue rotas, formulários, persistência, responsividade e feedback de ações completos.`;
  }
  if (target === "stitch") {
    return `- Gere telas coerentes como um único sistema visual, prontas para implementação em React.
- Inclua estados desktop e mobile, navegação, componentes, tokens, formulários e estados operacionais.
- Priorize hierarquia, leitura rápida, acessibilidade e consistência entre telas.
- Evite telas conceituais sem fluxo, texto ilegível e componentes decorativos sem função.`;
  }
  return `- Produza uma solução implementável, modular e responsiva.
- Diferencie fatos do briefing, hipóteses e itens que exigem validação.
- Inclua arquitetura, fluxos, dados, segurança, critérios de aceite e plano de QA.`;
}

export function buildDevelopmentPrompt(input: DevelopmentPromptInput): string {
  const { lead, target, product } = input;
  const capabilities = [
    lead.needsLogin && "Autenticação e recuperação de acesso",
    lead.needsAdmin && "Painel administrativo",
    lead.needsCustomerArea && "Área do cliente",
    lead.needsIntegrations && "Integrações externas",
    lead.needsMobileApp && "Experiência ou aplicativo mobile",
  ].filter(Boolean) as string[];

  return `# Projeto personalizado HolyNex

Você é responsável por projetar e desenvolver um ${PRODUCT_LABELS[product]} para o lead abaixo usando ${TARGET_LABELS[target]}.

## Regra de contexto

Use somente os fatos fornecidos. Não invente resultados, depoimentos, números, integrações ou atributos da empresa. Quando faltar informação, registre a hipótese e crie uma pergunta objetiva de discovery.

## Lead

- ID: ${lead.id}
- Contato: ${value(lead.contactName)}
- Empresa: ${value(lead.company)}
- Nicho: ${value(lead.niche)}
- Tipo solicitado: ${value(lead.projectType)}
- Estágio da operação: ${value(lead.operationStage)}
- Prazo desejado: ${value(lead.desiredDeadline)}
- Faixa de investimento: ${value(lead.investmentRange)}
- Usuários previstos: ${value(lead.users)}

## Problema e objetivo

Problema principal:
${value(lead.mainPain)}

Objetivo do projeto:
${value(lead.objective)}

Briefing original:
${value(lead.briefing)}

Detalhamento complementar:
${value(lead.detailedBriefing)}

## Capacidades esperadas

${list(capabilities)}

## Módulos recomendados

${list(lead.recommendedModules)}

## Oportunidades identificadas

${list(lead.opportunities)}

## Riscos e restrições

${list(lead.risks)}

## Stack sugerida

${list(lead.suggestedStack)}

## Roadmap inicial

${list(lead.roadmap)}

## Referências internas HolyNex

${list(lead.portfolioReferences)}

## Instruções específicas para ${TARGET_LABELS[target]}

${targetInstructions(target)}

## Direção de produto e experiência

- A primeira tela deve ser a experiência principal do produto, não uma landing page, exceto quando o produto escolhido for uma landing page.
- Crie arquitetura de informação, mapa de rotas e fluxo principal do usuário antes dos detalhes visuais.
- Use a identidade real do lead quando houver ativos; na ausência deles, proponha tokens temporários claramente identificados.
- Garanta responsividade, acessibilidade, formulários completos, mensagens de erro úteis e proteção de dados pessoais.
- Para sistemas operacionais, priorize interfaces densas, organizadas e eficientes para uso recorrente.
- Não automatize contato, publicação ou ações irreversíveis sem aprovação humana explícita.

## Entregáveis obrigatórios

1. Resumo do entendimento e perguntas pendentes.
2. Arquitetura de páginas, módulos e permissões.
3. Fluxos principais e estados de cada tela.
4. Modelo de dados e integrações necessárias.
5. Sistema visual e componentes reutilizáveis.
6. Implementação funcional do escopo aprovado.
7. Critérios de aceite, testes e QA visual desktop/mobile.
8. Pendências externas e próximos passos.

## Instruções adicionais da HolyNex

${value(input.additionalInstructions)}`;
}

export function inferDevelopmentProduct(projectType?: string): DevelopmentProduct {
  const normalized = (projectType || "").toLowerCase();
  if (normalized.includes("landing")) return "landing_page";
  if (normalized.includes("saas") || normalized.includes("plataforma")) return "saas";
  if (normalized.includes("site") || normalized.includes("institucional")) return "site";
  return "internal_system";
}
