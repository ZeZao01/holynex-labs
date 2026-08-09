import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Proposta } from "@/lib/propostas";

const { logProposalEvent } = vi.hoisted(() => ({
  logProposalEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/proposal-events", () => ({ logProposalEvent }));
vi.mock("@/lib/pdf-logos", () => ({
  loadPdfLogos: vi.fn().mockResolvedValue({ agencyLogo: null, clientLogo: null, agencyAspect: 1, clientAspect: 1 }),
}));
vi.mock("@/lib/portfolio-items", () => ({ listPortfolioItems: vi.fn().mockResolvedValue([]) }));

import { generatePropostaPdf } from "@/lib/pdf-generator";

const proposal: Proposta = {
  id: "proposal-pdf-test",
  criado_em: "2026-08-09T12:00:00.000Z",
  nome_cliente: "Ana Souza",
  empresa_cliente: "Clínica Horizonte",
  segmento: "Saúde",
  email_cliente: "ana@example.com",
  tipo_projeto: "Sistema interno",
  descricao_projeto: "Gestão de pacientes, agenda e indicadores.",
  proposta_json: {
    resumo_executivo: "Centralizar a operação da clínica.",
    tipo_projeto: "Sistema interno",
    diagnostico: "Processos dispersos.",
    solucao_proposta: "Plataforma responsiva e segura.",
    escopo: ["Agenda", "Pacientes", "Relatórios"],
    funcionalidades: ["Login", "Dashboard"],
    funcionalidades_recomendadas: ["Notificações"],
    complexidade: "Média",
    analise_estrategica: "Priorizar operação diária.",
    estimativa_esforco: "8 semanas",
    financeiro: { valor_minimo: 12000, valor_ideal: 18000, valor_premium: 25000, classificacao_margem: "saudável" },
    cronograma: "Descoberta, implementação, QA e implantação.",
    manutencao: "Plano mensal opcional.",
    riscos: ["Migração de dados"],
    proximos_passos: ["Aprovar escopo", "Iniciar discovery"],
    proposta_comercial: "Proposta válida por 15 dias.",
  },
  proposta_texto: "Proposta comercial HolyNex.",
  valor_minimo: 12000,
  valor_ideal: 18000,
  valor_premium: 25000,
  classificacao_margem: "saudável",
  complexidade: "Média",
  status: "rascunho",
  orcamento_id: null,
  proposal_tiers: [],
  proposal_addons: [],
  recommended_tier: "",
  commercial_notes: null,
  proposal_validity: "15 dias",
  is_phased: false,
  closing_strategy: "consultiva",
  document_spec: null,
  pricing_sheet: null,
  structured_content: null,
  stitch_prompt: null,
  hidden_addons: null,
  portfolio_refs: null,
  pdf_blueprint: null,
  ai_metadata: null,
  is_public: false,
  public_token: null,
  link_referencia: "",
};

describe("proposal PDF generation", () => {
  beforeEach(() => logProposalEvent.mockClear());

  it("generates a non-empty PDF document and records success", async () => {
    const blob = await generatePropostaPdf(proposal, undefined, "HN-TEST-001");

    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(10_000);
    expect(logProposalEvent).toHaveBeenCalledWith(
      "proposal_pdf_generated",
      proposal.id,
      expect.objectContaining({ render_status: "success", pages: expect.any(Number) }),
    );
  });
});
