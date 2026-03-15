/**
 * Multi-page PDF generator using jsPDF directly.
 * Each section gets its own page with charts and premium dark design.
 */
import { jsPDF } from "jspdf";
import type { Proposta } from "@/lib/propostas";
import { logProposalEvent } from "@/lib/proposal-events";
import {
  drawBarChart,
  drawDonutChart,
  drawComparisonTable,
  drawProgressBar,
  drawKpiCard,
  drawTimeline,
} from "@/lib/pdf-charts";

import type { RGB } from "@/lib/pdf-charts";

// ── Color palette ──
const C = {
  bg: [9, 9, 15] as RGB,
  bgCard: [18, 18, 32] as RGB,
  primary: [139, 92, 246] as RGB,       // purple
  secondary: [34, 197, 94] as RGB,      // green
  accent: [251, 191, 36] as RGB,        // amber
  accent2: [56, 189, 248] as RGB,       // sky
  white: [255, 255, 255] as RGB,
  lightGray: [200, 200, 210] as RGB,
  midGray: [140, 140, 160] as RGB,
  darkBorder: [40, 40, 60] as RGB,
};

// ── Opacity helpers ──
function makeOpacityHelpers(pdf: jsPDF) {
  // jsPDF GState for opacity - use the static GState class from jsPDF
  const GState = (jsPDF as any).API?.GState || (pdf as any).GState || function(opts: any) { Object.assign(this, opts); };
  return {
    setOpacity: (o: number) => {
      try {
        (pdf as any).setGState(new GState({ opacity: o, "stroke-opacity": o }));
      } catch {
        // Fallback: skip opacity if GState not supported
      }
    },
    restoreOpacity: () => {
      try {
        (pdf as any).setGState(new GState({ opacity: 1, "stroke-opacity": 1 }));
      } catch {
        // Fallback: skip opacity if GState not supported
      }
    },
  };
}

// ── Helpers ──
function fmt(v: number): string {
  return `R$ ${Number(v || 0).toLocaleString("pt-BR")}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function drawPageBg(pdf: jsPDF) {
  pdf.setFillColor(...C.bg);
  pdf.rect(0, 0, 210, 297, "F");
}

function drawFooter(pdf: jsPDF, pageNum: number, total: number, docCode?: string) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(...C.midGray);
  const left = docCode ? `Doc: ${docCode}` : "HolyNex Labs";
  pdf.text(left, 12, 290);
  pdf.text(`${pageNum}/${total}`, 198, 290, { align: "right" });
  // accent line
  pdf.setDrawColor(...C.primary);
  pdf.setLineWidth(0.3);
  pdf.line(12, 287, 198, 287);
}

function drawSectionTitle(pdf: jsPDF, title: string, y: number, icon?: string): number {
  // accent bar
  pdf.setFillColor(...C.primary);
  pdf.roundedRect(12, y, 3, 12, 1.5, 1.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(...C.white);
  pdf.text(`${icon ? icon + "  " : ""}${title}`, 20, y + 9);
  return y + 18;
}

function drawTextBlock(pdf: jsPDF, text: string, x: number, y: number, maxW: number, fontSize = 9): number {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(fontSize);
  pdf.setTextColor(...C.lightGray);
  const lines = pdf.splitTextToSize(text || "Não informado", maxW);
  pdf.text(lines, x, y);
  return y + lines.length * (fontSize * 0.45) + 4;
}

function drawBulletList(pdf: jsPDF, items: string[], x: number, y: number, maxW: number): number {
  let cy = y;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  for (const item of items) {
    if (cy > 270) break;
    pdf.setFillColor(...C.primary);
    pdf.circle(x + 1.5, cy - 1, 1, "F");
    pdf.setTextColor(...C.lightGray);
    const lines = pdf.splitTextToSize(item, maxW - 6);
    pdf.text(lines, x + 5, cy);
    cy += lines.length * 4 + 2;
  }
  return cy;
}

function drawCard(pdf: jsPDF, x: number, y: number, w: number, h: number, helpers: ReturnType<typeof makeOpacityHelpers>) {
  pdf.setFillColor(...C.bgCard);
  helpers.setOpacity(0.8);
  pdf.roundedRect(x, y, w, h, 3, 3, "F");
  helpers.restoreOpacity();
  pdf.setDrawColor(...C.darkBorder);
  helpers.setOpacity(0.5);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(x, y, w, h, 3, 3, "S");
  helpers.restoreOpacity();
}

// ── Page builders ──

function pageCover(pdf: jsPDF, p: Proposta, helpers: ReturnType<typeof makeOpacityHelpers>) {
  drawPageBg(pdf);

  // Large gradient-like hero area
  pdf.setFillColor(...C.primary);
  helpers.setOpacity(0.08);
  pdf.roundedRect(10, 10, 190, 130, 6, 6, "F");
  helpers.restoreOpacity();
  pdf.setDrawColor(...C.primary);
  helpers.setOpacity(0.3);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(10, 10, 190, 130, 6, 6, "S");
  helpers.restoreOpacity();

  // Brand
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...C.primary);
  pdf.text("HOLYNEX LABS", 20, 30);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...C.midGray);
  pdf.text("Tecnologia & Inovação Digital", 20, 36);

  // Main title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(36);
  pdf.setTextColor(...C.white);
  pdf.text("Proposta", 20, 65);
  pdf.text("Comercial", 20, 80);

  // Subtitle - Premium focus
  pdf.setFillColor(...C.primary);
  pdf.roundedRect(20, 88, 50, 7, 3, 3, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...C.white);
  pdf.text("INVESTIMENTO PREMIUM", 24, 93);

  // Meta cards
  const metas = [
    { label: "CLIENTE", value: p.nome_cliente },
    { label: "EMPRESA", value: p.empresa_cliente || "—" },
    { label: "TIPO", value: p.tipo_projeto },
    { label: "DATA", value: fmtDate(p.criado_em) },
  ];
  metas.forEach((m, i) => {
    const mx = 14 + i * 46;
    drawCard(pdf, mx, 105, 42, 28, helpers);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    pdf.setTextColor(...C.midGray);
    pdf.text(m.label, mx + 4, 112);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.white);
    const val = pdf.splitTextToSize(m.value, 34);
    pdf.text(val[0] || "", mx + 4, 119);
    if (val[1]) {
      pdf.setFontSize(7);
      pdf.text(val[1], mx + 4, 124);
    }
  });

  // Investment summary section
  let iy = 155;
  iy = drawSectionTitle(pdf, "Resumo de Investimento", iy);

  const investments = [
    { label: "Mínimo", value: fmt(p.valor_minimo), color: C.accent },
    { label: "Ideal", value: fmt(p.valor_ideal), color: C.secondary },
    { label: "Premium", value: fmt(p.valor_premium), color: C.primary },
  ];
  investments.forEach((inv, i) => {
    const ix = 14 + i * 62;
    drawCard(pdf, ix, iy, 58, 24, helpers);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    pdf.text(inv.label, ix + 4, iy + 8);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...(inv.color));
    pdf.text(inv.value, ix + 4, iy + 18);
  });

  // Recommended tier badge
  if (p.recommended_tier) {
    const ry = iy + 30;
    pdf.setFillColor(...C.primary);
    helpers.setOpacity(0.15);
    pdf.roundedRect(14, ry, 180, 10, 3, 3, "F");
    helpers.restoreOpacity();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.primary);
    pdf.text(`★ Plano Recomendado: ${p.recommended_tier.toUpperCase()}`, 20, ry + 7);
  }

  // Bar chart - investment comparison
  const chartY = 220;
  drawSectionTitle(pdf, "Comparativo de Investimento", chartY - 5);
  drawBarChart(
    pdf, 20, chartY, 170, 55,
    investments.map((inv) => ({ label: inv.label, value: Number(String(inv.value).replace(/[^\d]/g, "")) || 0, color: inv.color })),
    helpers,
    { white: C.white, midGray: C.midGray, bgCard: C.bgCard, lightGray: C.lightGray }
  );
}

function pageExecutiveSummary(pdf: jsPDF, p: Proposta, helpers: ReturnType<typeof makeOpacityHelpers>) {
  drawPageBg(pdf);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;

  let y = 18;
  y = drawSectionTitle(pdf, "Resumo Executivo", y);
  y = drawTextBlock(pdf, pj.resumo_executivo || p.descricao_projeto || "", 14, y, 182, 10);

  y += 6;
  y = drawSectionTitle(pdf, "Diagnóstico", y);
  y = drawTextBlock(pdf, pj.diagnostico || "", 14, y, 182, 9);

  y += 6;
  y = drawSectionTitle(pdf, "Solução Proposta", y);
  y = drawTextBlock(pdf, pj.solucao_proposta || "", 14, y, 182, 9);

  // KPIs from niche intelligence
  const ni = pj.niche_intelligence as Record<string, any> | undefined;
  if (ni?.kpis && Array.isArray(ni.kpis) && ni.kpis.length > 0) {
    y += 6;
    y = drawSectionTitle(pdf, "KPIs Projetados", y);
    const kpis = ni.kpis.slice(0, 4);
    const kpiColors: RGB[] = [C.primary, C.secondary, C.accent, C.accent2];
    kpis.forEach((kpi: any, i: number) => {
      const kx = 14 + i * 46;
      drawKpiCard(
        pdf, kx, y, 42, 30,
        "◆",
        kpi.metric || "",
        kpi.label || "",
        helpers,
        { primary: kpiColors[i % kpiColors.length], bgCard: C.bgCard, white: C.white, midGray: C.midGray },
        kpiColors[i % kpiColors.length]
      );
    });
  }
}

function pageScopeFeatures(pdf: jsPDF, p: Proposta, helpers: ReturnType<typeof makeOpacityHelpers>) {
  drawPageBg(pdf);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const escopo = Array.isArray(pj.escopo) ? pj.escopo : [];
  const funcionalidades = Array.isArray(pj.funcionalidades) ? pj.funcionalidades : [];
  const recomendadas = Array.isArray(pj.funcionalidades_recomendadas) ? pj.funcionalidades_recomendadas : [];

  let y = 18;

  // Scope - left column
  y = drawSectionTitle(pdf, "Escopo do Projeto", y);
  drawCard(pdf, 12, y, 88, Math.max(escopo.length * 7 + 10, 40), helpers);
  let ly = drawBulletList(pdf, escopo, 16, y + 6, 80);

  // Features - right column
  drawCard(pdf, 108, y, 88, Math.max(funcionalidades.length * 7 + 10, 40), helpers);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...C.white);
  pdf.text("Funcionalidades", 112, y + 5);
  drawBulletList(pdf, funcionalidades, 112, y + 12, 80);

  y = Math.max(ly, y + Math.max(escopo.length, funcionalidades.length) * 7 + 16);

  // Recommended features
  if (recomendadas.length > 0) {
    y += 4;
    y = drawSectionTitle(pdf, "Funcionalidades Recomendadas (Premium)", y);
    drawCard(pdf, 12, y, 186, recomendadas.length * 7 + 10, helpers);
    // Star icon for premium features
    recomendadas.forEach((item, i) => {
      const fy = y + 6 + i * 7;
      if (fy > 270) return;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.accent);
      pdf.text("★", 16, fy);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...C.lightGray);
      pdf.text(item, 22, fy);
    });
    y += recomendadas.length * 7 + 14;
  }

  // Donut chart - scope distribution
  if (y < 200) {
    y += 4;
    y = drawSectionTitle(pdf, "Distribuição do Escopo", y);
    const segments = [
      { label: "Core", pct: 45, color: C.primary },
      { label: "Gestão", pct: 30, color: C.secondary },
      { label: "Design", pct: 15, color: C.accent },
      { label: "QA/Deploy", pct: 10, color: C.accent2 },
    ];
    drawDonutChart(pdf, 55, y + 20, 15, segments, helpers, { white: C.white, midGray: C.midGray, bg: C.bg });

    // Legend on right side
    let legendY = y + 6;
    segments.forEach((seg) => {
      drawProgressBar(pdf, 90, legendY, 100, seg.pct, seg.label, helpers, {
        primary: seg.color, bgCard: C.bgCard, white: C.white, midGray: C.midGray,
      });
      legendY += 14;
    });
  }
}

function pageStrategicAnalysis(pdf: jsPDF, p: Proposta, helpers: ReturnType<typeof makeOpacityHelpers>) {
  drawPageBg(pdf);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const ni = pj.niche_intelligence as Record<string, any> | undefined;

  let y = 18;
  y = drawSectionTitle(pdf, "Análise Estratégica", y);
  y = drawTextBlock(pdf, pj.analise_estrategica || "", 14, y, 182, 9);

  // Strategic benefits
  const benefits = ni?.strategic_benefits as any[] | undefined;
  if (benefits && benefits.length > 0) {
    y += 4;
    y = drawSectionTitle(pdf, "Benefícios Estratégicos", y);
    benefits.forEach((b: any, i: number) => {
      if (y > 260) return;
      const colors: RGB[] = [C.primary, C.secondary, C.accent, C.accent2];
      drawCard(pdf, 12, y, 186, 20, helpers);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...colors[i % colors.length]);
      pdf.text(b.title || "", 16, y + 7);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.lightGray);
      const descLines = pdf.splitTextToSize(b.desc || "", 170);
      pdf.text(descLines.slice(0, 2), 16, y + 13);
      y += 24;
    });
  }

  // Investment justification
  if (ni?.investment_justification && y < 240) {
    y += 4;
    y = drawSectionTitle(pdf, "Justificativa de Investimento", y);
    drawCard(pdf, 12, y, 186, 30, helpers);
    pdf.setFillColor(...C.primary);
    helpers.setOpacity(0.1);
    pdf.roundedRect(12, y, 186, 30, 3, 3, "F");
    helpers.restoreOpacity();
    y = drawTextBlock(pdf, ni.investment_justification, 16, y + 6, 178, 9);
  }

  // Expert references
  if (ni?.expert_reference && y < 250) {
    y += 4;
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    const refLines = pdf.splitTextToSize(`Fontes: ${ni.expert_reference}`, 180);
    pdf.text(refLines, 14, y);
  }
}

function pageTimeline(pdf: jsPDF, p: Proposta, helpers: ReturnType<typeof makeOpacityHelpers>) {
  drawPageBg(pdf);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const ni = pj.niche_intelligence as Record<string, any> | undefined;
  const phases = ni?.timeline_phases as any[] | undefined;

  let y = 18;
  y = drawSectionTitle(pdf, "Cronograma de Execução", y);

  // Timeline info
  if (pj.cronograma) {
    drawCard(pdf, 12, y, 186, 14, helpers);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.accent);
    pdf.text(`⏱ ${pj.cronograma}`, 16, y + 9);
    y += 20;
  }

  // Visual timeline
  if (phases && phases.length > 0) {
    const steps = phases.map((ph: any) => ({
      title: ph.title || "",
      subtitle: ph.subtitle || "",
      desc: ph.desc || "",
    }));
    drawTimeline(pdf, 14, y, 180, steps, helpers, {
      primary: C.primary, secondary: C.secondary, accent: C.accent, accent2: C.accent2,
      white: C.white, midGray: C.midGray, lightGray: C.lightGray, bg: C.bg,
    });
    y += 60;
  }

  // Effort estimation
  y += 8;
  y = drawSectionTitle(pdf, "Estimativa de Esforço", y);
  y = drawTextBlock(pdf, pj.estimativa_esforco || "", 14, y, 182, 9);

  // Maintenance section
  y += 8;
  y = drawSectionTitle(pdf, "Manutenção & Suporte", y);
  drawCard(pdf, 12, y, 186, 20, helpers);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...C.lightGray);
  const maintLines = pdf.splitTextToSize(pj.manutencao || "", 178);
  pdf.text(maintLines.slice(0, 3), 16, y + 7);
  y += 26;

  // Maintenance features
  const maintFeatures = ni?.maintenance_features as string[] | undefined;
  if (maintFeatures && maintFeatures.length > 0 && y < 240) {
    y = drawBulletList(pdf, maintFeatures, 16, y, 170);
  }
}

function pageRisksNextSteps(pdf: jsPDF, p: Proposta, helpers: ReturnType<typeof makeOpacityHelpers>) {
  drawPageBg(pdf);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const ni = pj.niche_intelligence as Record<string, any> | undefined;
  const riscos = Array.isArray(pj.riscos) ? pj.riscos : [];
  const proximos = Array.isArray(pj.proximos_passos) ? pj.proximos_passos : [];
  const riskMatrix = ni?.risk_matrix as any[] | undefined;

  let y = 18;

  // Risk matrix (if available)
  if (riskMatrix && riskMatrix.length > 0) {
    y = drawSectionTitle(pdf, "Matriz de Riscos", y);
    riskMatrix.forEach((risk: any, i: number) => {
      if (y > 180) return;
      const sevColor: RGB = risk.severity === "alto" ? [239, 68, 68] : risk.severity === "medio" ? C.accent : C.secondary;
      drawCard(pdf, 12, y, 186, 24, helpers);
      // Severity indicator
      pdf.setFillColor(...sevColor);
      pdf.circle(18, y + 8, 3, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...C.white);
      pdf.text(risk.title || `Risco ${i + 1}`, 24, y + 9);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...C.midGray);
      pdf.text(`Impacto: ${risk.impact || "—"}`, 24, y + 15);
      pdf.setTextColor(...C.secondary);
      pdf.text(`Mitigação: ${risk.mitigation || "—"}`, 24, y + 20);
      y += 28;
    });
  } else if (riscos.length > 0) {
    y = drawSectionTitle(pdf, "Riscos e Mitigação", y);
    y = drawBulletList(pdf, riscos, 16, y, 170);
  }

  y += 8;
  y = drawSectionTitle(pdf, "Próximos Passos", y);

  // Numbered steps
  proximos.forEach((step, i) => {
    if (y > 268) return;
    drawCard(pdf, 12, y, 186, 12, helpers);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...C.primary);
    pdf.text(String(i + 1).padStart(2, "0"), 16, y + 8);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...C.lightGray);
    pdf.text(step, 28, y + 8);
    y += 15;
  });
}

function pageTiers(pdf: jsPDF, p: Proposta, helpers: ReturnType<typeof makeOpacityHelpers>) {
  if (!p.proposal_tiers || p.proposal_tiers.length === 0) return false;

  drawPageBg(pdf);
  let y = 18;
  y = drawSectionTitle(pdf, "Planos de Investimento", y);

  // Build comparison table
  const tiers = p.proposal_tiers;
  const headers = tiers.map((t) => t.name);

  // Gather all unique items
  const allItems = new Set<string>();
  tiers.forEach((t) => {
    const items = Array.isArray(t.included_items) ? t.included_items : [];
    items.forEach((item: string) => allItems.add(item));
  });

  const rows = Array.from(allItems).map((item) => ({
    label: item,
    values: tiers.map((t) => {
      const items = Array.isArray(t.included_items) ? t.included_items : [];
      return items.includes(item);
    }),
  }));

  if (rows.length > 0) {
    drawComparisonTable(pdf, 12, y, 186, headers, rows, helpers, {
      primary: C.primary, secondary: C.secondary, white: C.white,
      midGray: C.midGray, bgCard: C.bgCard, lightGray: C.lightGray, bg: C.bg,
    });
  }

  return true;
}

function pageClosing(pdf: jsPDF, p: Proposta, helpers: ReturnType<typeof makeOpacityHelpers>, docCode?: string) {
  drawPageBg(pdf);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;

  let y = 60;

  // Large closing card
  pdf.setFillColor(...C.primary);
  helpers.setOpacity(0.08);
  pdf.roundedRect(20, y, 170, 100, 6, 6, "F");
  helpers.restoreOpacity();
  pdf.setDrawColor(...C.primary);
  helpers.setOpacity(0.4);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(20, y, 170, 100, 6, 6, "S");
  helpers.restoreOpacity();

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(...C.white);
  pdf.text("Pronto para transformar", 105, y + 25, { align: "center" });
  pdf.text("sua ideia em realidade?", 105, y + 35, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...C.lightGray);
  pdf.text("Entre em contato para iniciar o desenvolvimento.", 105, y + 50, { align: "center" });

  // Validity
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...C.accent);
  pdf.text(`Validade: ${p.proposal_validity || "30 dias"}`, 105, y + 65, { align: "center" });

  // Closing strategy
  if (p.closing_strategy) {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.midGray);
    const csLines = pdf.splitTextToSize(p.closing_strategy, 150);
    pdf.text(csLines.slice(0, 2), 105, y + 75, { align: "center" });
  }

  // Document code
  if (docCode) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    pdf.text(`Código do documento: ${docCode}`, 105, y + 90, { align: "center" });
  }

  // Brand footer
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...C.primary);
  pdf.text("HOLYNEX LABS", 105, 240, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...C.midGray);
  pdf.text("holynex.com • Tecnologia & Inovação Digital", 105, 247, { align: "center" });
}

// ── Main generator ──

export async function generatePropostaPdf(
  proposta: Proposta,
  _templateId?: string,
  documentCode?: string,
): Promise<Blob> {
  const renderStart = Date.now();

  await logProposalEvent("proposal_pdf_render_started", proposta.id, {
    render_status: "started",
    template_id: "jspdf-multipage-v1",
  });

  try {
    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const helpers = makeOpacityHelpers(pdf);

    // Determine which pages to build
    const hasTiers = proposta.proposal_tiers && proposta.proposal_tiers.length > 0;
    const totalPages = hasTiers ? 7 : 6;
    let pageNum = 0;

    // Page 1: Cover
    pageNum++;
    pageCover(pdf, proposta, helpers);
    drawFooter(pdf, pageNum, totalPages, documentCode);

    // Page 2: Executive Summary + Diagnosis
    pdf.addPage();
    pageNum++;
    pageExecutiveSummary(pdf, proposta, helpers);
    drawFooter(pdf, pageNum, totalPages, documentCode);

    // Page 3: Scope & Features
    pdf.addPage();
    pageNum++;
    pageScopeFeatures(pdf, proposta, helpers);
    drawFooter(pdf, pageNum, totalPages, documentCode);

    // Page 4: Strategic Analysis
    pdf.addPage();
    pageNum++;
    pageStrategicAnalysis(pdf, proposta, helpers);
    drawFooter(pdf, pageNum, totalPages, documentCode);

    // Page 5: Tiers (conditional)
    if (hasTiers) {
      pdf.addPage();
      pageNum++;
      pageTiers(pdf, proposta, helpers);
      drawFooter(pdf, pageNum, totalPages, documentCode);
    }

    // Page 6: Timeline & Maintenance
    pdf.addPage();
    pageNum++;
    pageTimeline(pdf, proposta, helpers);
    drawFooter(pdf, pageNum, totalPages, documentCode);

    // Page 7: Risks + Next Steps + Closing
    pdf.addPage();
    pageNum++;
    pageRisksNextSteps(pdf, proposta, helpers);
    // Add closing at bottom if space, otherwise new page
    const lastY = 200; // approximate
    if (lastY < 180) {
      // closing fits
    }

    // Final page: Closing
    pdf.addPage();
    pageNum++;
    pageClosing(pdf, proposta, helpers, documentCode);
    drawFooter(pdf, pageNum, pageNum, documentCode);

    const blob = pdf.output("blob");

    await logProposalEvent("proposal_pdf_generated", proposta.id, {
      render_status: "success",
      template_id: "jspdf-multipage-v1",
      duration_ms: Date.now() - renderStart,
      pages: pageNum,
    });

    return blob;
  } catch (err) {
    await logProposalEvent("proposal_pdf_render_failed", proposta.id, {
      render_status: "failed",
      template_id: "jspdf-multipage-v1",
      duration_ms: Date.now() - renderStart,
      render_error: err instanceof Error ? err.message : "Erro desconhecido",
    });
    throw err;
  }
}
