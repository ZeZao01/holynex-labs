export type OrcamentoStatus = "pendente" | "recebido" | "rejeitado";

export interface Orcamento {
  id: string;
  nome: string;
  email: string;
  empresa: string;
  descricao: string;
  status: OrcamentoStatus;
  criadoEm: string;
  prioridade?: "alta" | "media" | "baixa";
  resumoIA?: string;
}

const STORAGE_KEY = "holynex_orcamentos";

export function getOrcamentos(): Orcamento[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function salvarOrcamento(data: Omit<Orcamento, "id" | "status" | "criadoEm" | "prioridade" | "resumoIA">): Orcamento {
  const orcamentos = getOrcamentos();

  // Simple AI-like classification
  const descLower = data.descricao.toLowerCase();
  let prioridade: Orcamento["prioridade"] = "media";
  if (descLower.includes("urgente") || descLower.includes("rápido") || descLower.includes("imediato") || descLower.includes("prazo curto")) {
    prioridade = "alta";
  } else if (descLower.includes("futuro") || descLower.includes("sem pressa") || descLower.includes("avaliar")) {
    prioridade = "baixa";
  }

  // Generate AI summary
  const palavras = data.descricao.split(" ");
  const resumoIA = palavras.length > 15
    ? palavras.slice(0, 15).join(" ") + "..."
    : data.descricao;

  const novo: Orcamento = {
    id: crypto.randomUUID(),
    ...data,
    status: "pendente",
    criadoEm: new Date().toISOString(),
    prioridade,
    resumoIA,
  };

  orcamentos.unshift(novo);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orcamentos));
  return novo;
}

export function atualizarStatus(id: string, status: OrcamentoStatus): void {
  const orcamentos = getOrcamentos();
  const idx = orcamentos.findIndex((o) => o.id === id);
  if (idx !== -1) {
    orcamentos[idx].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orcamentos));
  }
}

export function removerOrcamento(id: string): void {
  const orcamentos = getOrcamentos().filter((o) => o.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orcamentos));
}
