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
  phone?: string; email?: string; address?: string; city?: string; googleMapsUrl?: string;
  googleRating?: number; googleReviewCount?: number; prospectScore?: number;
  prospectReasons?: string[]; suggestedProject?: string; prospectMessage?: string;
}

export interface DevelopmentProjectReference {
  title: string; category: string; niche: string; valueProposition: string; problemSolved: string;
  commercialDescription: string; investmentRange: string; baseDeadline: string; reuseReasons: string[];
}

export interface DevelopmentPromptInput {
  lead: DevelopmentLeadContext;
  target: DevelopmentTarget;
  product: DevelopmentProduct;
  additionalInstructions?: string;
  projectReference?: DevelopmentProjectReference;
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
    return `- Trabalhe no projeto existente conectado ao Git e altere somente os arquivos necessários; não recrie o projeto do zero.
- Antes de editar, responda com um plano curto contendo rotas, componentes, dados e critérios de aceite.
- Crie diretamente o produto utilizável, não uma página de marketing genérica.
- Reuse Supabase, componentes e tokens existentes quando disponíveis.
- Não invente integrações ou dados reais; use estados honestos e marque dependências externas.
- Preserve o menu lateral e o shell da aplicação entre rotas; atualize somente a área de conteúdo.
- Entregue rotas, formulários, persistência, responsividade, SEO local e feedback de ações completos.
- Ao terminar, liste arquivos alterados, migrações, secrets necessários e testes executados.`;
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

  const reference = input.projectReference;
  return `# Execução Lovable — projeto comercial personalizado HolyNex

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
- Telefone/WhatsApp real: ${value(lead.phone)}
- E-mail real: ${value(lead.email)}
- Endereço: ${value(lead.address)}
- Cidade: ${value(lead.city)}
- Google Maps: ${value(lead.googleMapsUrl)}
- Reputação Google: ${lead.googleRating ? `${lead.googleRating.toFixed(1)}/5 em ${lead.googleReviewCount || 0} avaliações` : "Sem avaliação disponível"}
- Score de prospecção HolyNex: ${lead.prospectScore == null ? "A definir" : `${lead.prospectScore}%`}

Evidências do score:
${list(lead.prospectReasons)}

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

## Projeto-modelo escolhido do estoque particular HolyNex

- Nome: ${value(reference?.title || lead.suggestedProject)}
- Categoria: ${value(reference?.category)}
- Nicho original: ${value(reference?.niche)}
- Proposta de valor: ${value(reference?.valueProposition)}
- Problema resolvido: ${value(reference?.problemSolved)}
- Descrição comercial: ${value(reference?.commercialDescription)}
- Faixa de investimento: ${value(reference?.investmentRange)}
- Prazo-base: ${value(reference?.baseDeadline)}

Razões para reutilização:
${list(reference?.reuseReasons)}

Use esse modelo como base estrutural e de componentes. Adapte conteúdo, identidade, navegação e oferta ao estabelecimento; não copie marca ou textos de terceiros e não descarte módulos já funcionais sem justificativa.

## Referências estratégicas de players consolidados

- Vendasta Snapshot Report: transformar dados reais do negócio em diagnóstico personalizado e argumento comercial verificável.
- Duda: reutilizar templates, seções e conteúdo estruturado para entregar sites de nicho com velocidade e consistência.
- HighLevel: conectar captura, WhatsApp, CRM, agendamento e follow-up em um fluxo operacional único quando fizer sentido.

São referências de estratégia, não layouts para copiar. A solução deve permanecer autoral e baseada nos dados reais acima.

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

## Critérios de aceite específicos

- Nenhuma informação ausente é inventada; telefone e e-mail só aparecem quando forem legítimos.
- Endereço abre o Google Maps e nome, especialidade, cidade, avaliação e quantidade de avaliações alimentam copy e SEO local.
- O projeto-modelo escolhido é reaproveitado explicitamente, com lista do que foi reutilizado e adaptado.
- CTA principal é mensurável; formulários têm validação, loading, sucesso e erro.
- Mobile, acessibilidade, metadados, desempenho e ausência de recarregamento total entre menus são verificados.
- Não declarar integração concluída sem persistência real e teste executado.

## Mensagem de prospecção aprovada para contexto

${value(lead.prospectMessage)}

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
