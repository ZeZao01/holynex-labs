/**
 * Multi-page LANDSCAPE PDF generator using jsPDF directly.
 * Each topic gets its own dedicated page with charts and premium dark design.
 * A4 Landscape: 297mm x 210mm
 */
import { jsPDF } from "jspdf";
import type { Proposta } from "@/lib/propostas";
import { logProposalEvent } from "@/lib/proposal-events";
import { loadPdfLogos, type PdfLogos } from "@/lib/pdf-logos";
import {
  drawBarChart,
  drawDonutChart,
  drawComparisonTable,
  drawProgressBar,
  drawKpiCard,
  drawTimeline,
} from "@/lib/pdf-charts";

import type { RGB } from "@/lib/pdf-charts";

// ── A4 Landscape dimensions ──
const PW = 297; // page width mm
const PH = 210; // page height mm
const MX = 14;  // margin x
const MY = 12;  // margin y
const CW = PW - MX * 2; // content width (269)
const CH = PH - MY * 2; // content height (186)

// ── Color palette ──
const C = {
  bg: [9, 9, 15] as RGB,
  bgCard: [18, 18, 32] as RGB,
  primary: [139, 92, 246] as RGB,
  secondary: [34, 197, 94] as RGB,
  accent: [251, 191, 36] as RGB,
  accent2: [56, 189, 248] as RGB,
  white: [255, 255, 255] as RGB,
  lightGray: [200, 200, 210] as RGB,
  midGray: [140, 140, 160] as RGB,
  darkBorder: [40, 40, 60] as RGB,
  red: [239, 68, 68] as RGB,
};

// ── Safe opacity helpers ──
function makeOpacityHelpers(pdf: jsPDF) {
  let GStateCtor: any = null;
  try {
    GStateCtor = (jsPDF as any).API?.GState || (pdf as any).GState;
  } catch { /* ignore */ }

  return {
    setOpacity: (o: number) => {
      if (!GStateCtor) return;
      try {
        (pdf as any).setGState(new GStateCtor({ opacity: o, "stroke-opacity": o }));
      } catch { /* skip */ }
    },
    restoreOpacity: () => {
      if (!GStateCtor) return;
      try {
        (pdf as any).setGState(new GStateCtor({ opacity: 1, "stroke-opacity": 1 }));
      } catch { /* skip */ }
    },
  };
}

type Helpers = ReturnType<typeof makeOpacityHelpers>;

// ── Helpers ──
function fmt(v: number): string {
  return `R$ ${Number(v || 0).toLocaleString("pt-BR")}`;
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function drawPageBg(pdf: jsPDF) {
  pdf.setFillColor(...C.bg);
  pdf.rect(0, 0, PW, PH, "F");
}
function drawFooter(pdf: jsPDF, pageNum: number, total: number, docCode?: string) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(...C.midGray);
  pdf.text(docCode ? `Doc: ${docCode}` : "HolyNex Labs", MX, PH - 6);
  pdf.text(`${pageNum}/${total}`, PW - MX, PH - 6, { align: "right" });
  pdf.setDrawColor(...C.primary);
  pdf.setLineWidth(0.3);
  pdf.line(MX, PH - 9, PW - MX, PH - 9);
}
function sectionTitle(pdf: jsPDF, title: string, y: number, icon?: string): number {
  pdf.setFillColor(...C.primary);
  pdf.roundedRect(MX, y, 3, 12, 1.5, 1.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(...C.white);
  pdf.text(`${icon ? icon + "  " : ""}${title}`, MX + 8, y + 9);
  return y + 18;
}
function textBlock(pdf: jsPDF, text: string, x: number, y: number, maxW: number, fontSize = 9, maxY?: number): number {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(fontSize);
  pdf.setTextColor(...C.lightGray);
  const lines = pdf.splitTextToSize(text || "Não informado", maxW);
  const lineH = fontSize * 0.45;
  const limit = maxY || PH - 20;
  // Only render lines that fit within bounds
  const visibleLines: string[] = [];
  let testY = y;
  for (const line of lines) {
    if (testY > limit) break;
    visibleLines.push(line);
    testY += lineH;
  }
  pdf.text(visibleLines, x, y);
  return y + visibleLines.length * lineH + 4;
}
function bulletList(pdf: jsPDF, items: string[], x: number, y: number, maxW: number, maxY?: number): number {
  let cy = y;
  const limit = maxY || PH - 20;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  for (const item of items) {
    if (cy > limit) break;
    pdf.setFillColor(...C.primary);
    pdf.circle(x + 1.5, cy - 1, 1, "F");
    pdf.setTextColor(...C.lightGray);
    const lines = pdf.splitTextToSize(item, maxW - 6);
    // Only draw lines that fit
    for (const line of lines) {
      if (cy > limit) break;
      pdf.text(line, x + 5, cy);
      cy += 4;
    }
    cy += 2;
  }
  return cy;
}
function card(pdf: jsPDF, x: number, y: number, w: number, h: number, helpers: Helpers) {
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

// ══════════════════════════════════════════════════════════════
// PAGE BUILDERS — each topic = 1 landscape page
// ══════════════════════════════════════════════════════════════

function pageCover(pdf: jsPDF, p: Proposta, h: Helpers, logos: PdfLogos) {
  drawPageBg(pdf);

  // Hero box
  pdf.setFillColor(...C.primary);
  h.setOpacity(0.07);
  pdf.roundedRect(MX, MY, CW, CH, 6, 6, "F");
  h.restoreOpacity();
  pdf.setDrawColor(...C.primary);
  h.setOpacity(0.3);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(MX, MY, CW, CH, 6, 6, "S");
  h.restoreOpacity();

  // Brand with logo
  let brandTextX = MX + 12;
  if (logos.agencyLogo) {
    try {
      pdf.addImage(logos.agencyLogo, "PNG", MX + 12, MY + 10, 14, 14);
      brandTextX = MX + 30;
    } catch { /* fallback to text only */ }
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...C.primary);
  pdf.text("HOLYNEX LABS", brandTextX, MY + 18);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...C.midGray);
  pdf.text("Tecnologia & Inovação Digital", brandTextX, MY + 24);

  // Client logo on top-right
  if (logos.clientLogo) {
    try {
      pdf.addImage(logos.clientLogo, "PNG", PW - MX - 26, MY + 8, 18, 18);
    } catch { /* skip */ }
  }

  // Main title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(36);
  pdf.setTextColor(...C.white);
  pdf.text("Proposta Comercial", MX + 12, MY + 50);

  // Badge
  pdf.setFillColor(...C.primary);
  pdf.roundedRect(MX + 12, MY + 56, 55, 7, 3, 3, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...C.white);
  pdf.text("INVESTIMENTO PREMIUM", MX + 16, MY + 61);

  // ── Left side: Meta cards (2x2 grid instead of 4 in a row) ──
  const metas = [
    { label: "CLIENTE", value: p.nome_cliente },
    { label: "EMPRESA", value: p.empresa_cliente || "—" },
    { label: "TIPO", value: p.tipo_projeto },
    { label: "DATA", value: fmtDate(p.criado_em) },
  ];
  const metaCardW = 72;
  const metaCardH = 24;
  const metaGap = 6;
  const metaStartY = MY + 72;
  const metaStartX = MX + 12;
  
  metas.forEach((m, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const mx = metaStartX + col * (metaCardW + metaGap);
    const my = metaStartY + row * (metaCardH + metaGap);
    card(pdf, mx, my, metaCardW, metaCardH, h);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    pdf.setTextColor(...C.midGray);
    pdf.text(m.label, mx + 4, my + 7);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.white);
    const val = pdf.splitTextToSize(m.value, metaCardW - 8);
    pdf.text(val[0] || "", mx + 4, my + 15);
    if (val[1]) { pdf.setFontSize(7); pdf.text(val[1], mx + 4, my + 20); }
  });

  // Recommended tier below meta cards
  const tierBadgeY = metaStartY + 2 * (metaCardH + metaGap) + 4;
  if (p.recommended_tier) {
    pdf.setFillColor(...C.primary);
    h.setOpacity(0.15);
    pdf.roundedRect(metaStartX, tierBadgeY, 150, 10, 3, 3, "F");
    h.restoreOpacity();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.primary);
    pdf.text(`★ Plano Recomendado: ${p.recommended_tier.toUpperCase()}`, metaStartX + 6, tierBadgeY + 7);
  }

  // ── Right side: Investment cards (stacked vertically) ──
  const investments = [
    { label: "Mínimo", value: fmt(p.valor_minimo), color: C.accent },
    { label: "Ideal", value: fmt(p.valor_ideal), color: C.secondary },
    { label: "Premium", value: fmt(p.valor_premium), color: C.primary },
  ];
  const rightCardW = 65;
  const rightCardH = 28;
  const rightCardGap = 6;
  const rightX = PW - MX - rightCardW - 12;
  const rightStartY = MY + 34;

  investments.forEach((inv, i) => {
    const iy = rightStartY + i * (rightCardH + rightCardGap);
    card(pdf, rightX, iy, rightCardW, rightCardH, h);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    pdf.text(inv.label, rightX + 5, iy + 9);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...inv.color);
    pdf.text(inv.value, rightX + 5, iy + 21);
  });

  // Bar chart below investment cards
  const barChartY = rightStartY + 3 * (rightCardH + rightCardGap) + 4;
  const barChartH = Math.min(40, PH - MY - barChartY - 14); // don't exceed page
  if (barChartH > 20) {
    drawBarChart(
      pdf, rightX - 30, barChartY, rightCardW + 30, barChartH,
      investments.map(inv => ({
        label: inv.label,
        value: Number(String(inv.value).replace(/[^\d]/g, "")) || 0,
        color: inv.color,
      })),
      h,
      { white: C.white, midGray: C.midGray, bgCard: C.bgCard, lightGray: C.lightGray }
    );
  }
}

function pageExecutiveSummary(pdf: jsPDF, p: Proposta, h: Helpers) {
  drawPageBg(pdf);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;

  let y = MY;
  y = sectionTitle(pdf, "Resumo Executivo", y);

  // Two-column layout
  const leftW = CW * 0.55;
  const rightW = CW * 0.40;
  const rightX = MX + leftW + CW * 0.05;
  const cardBottom = MY + CH - 10;
  const cardH = cardBottom - y;

  // Left: text sections
  card(pdf, MX, y, leftW, cardH, h);
  let ly = y + 8;
  const textMaxY = cardBottom - 6; // don't overflow card

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...C.accent);
  pdf.text("Visão Geral", MX + 6, ly);
  ly += 6;
  ly = textBlock(pdf, pj.resumo_executivo || p.descricao_projeto || "", MX + 6, ly, leftW - 12, 9, textMaxY);

  if (ly < textMaxY - 20) {
    ly += 2;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...C.accent2);
    pdf.text("Diagnóstico", MX + 6, ly);
    ly += 6;
    ly = textBlock(pdf, pj.diagnostico || "", MX + 6, ly, leftW - 12, 9, textMaxY);
  }

  if (ly < textMaxY - 20) {
    ly += 2;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...C.secondary);
    pdf.text("Solução Proposta", MX + 6, ly);
    ly += 6;
    textBlock(pdf, pj.solucao_proposta || "", MX + 6, ly, leftW - 12, 9, textMaxY);
  }

  // Right: KPIs
  const ni = pj.niche_intelligence as Record<string, any> | undefined;
  const kpis = ni?.kpis as any[] | undefined;
  if (kpis && kpis.length > 0) {
    let ry = y;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...C.white);
    pdf.text("KPIs Projetados", rightX, ry + 5);
    ry += 12;
    const kpiColors: RGB[] = [C.primary, C.secondary, C.accent, C.accent2];
    const kpiCardH = 30;
    const kpiGap = 4;
    const maxKpis = Math.min(kpis.length, Math.floor((cardBottom - ry) / (kpiCardH + kpiGap)) * 2);
    kpis.slice(0, maxKpis).forEach((kpi: any, i: number) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const kx = rightX + col * (rightW / 2 + 2);
      const ky = ry + row * (kpiCardH + kpiGap);
      if (ky + kpiCardH > cardBottom) return;
      drawKpiCard(pdf, kx, ky, rightW / 2 - 2, kpiCardH, "◆", kpi.metric || "", kpi.label || "", h,
        { primary: kpiColors[i % kpiColors.length], bgCard: C.bgCard, white: C.white, midGray: C.midGray },
        kpiColors[i % kpiColors.length]);
    });
  }
}

function pageScopeFeatures(pdf: jsPDF, p: Proposta, h: Helpers) {
  drawPageBg(pdf);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const escopo = Array.isArray(pj.escopo) ? pj.escopo : [];
  const funcionalidades = Array.isArray(pj.funcionalidades) ? pj.funcionalidades : [];
  const recomendadas = Array.isArray(pj.funcionalidades_recomendadas) ? pj.funcionalidades_recomendadas : [];

  let y = MY;
  y = sectionTitle(pdf, "Escopo & Funcionalidades", y);

  // Three columns
  const colGap = 6;
  const colW = (CW - colGap * 2) / 3;
  const cardH = MY + CH - y - 10;
  const cardBottom = y + cardH;

  // Col 1: Escopo
  card(pdf, MX, y, colW, cardH, h);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...C.primary);
  pdf.text("Escopo do Projeto", MX + 5, y + 8);
  bulletList(pdf, escopo, MX + 5, y + 16, colW - 10, cardBottom - 6);

  // Col 2: Funcionalidades
  const col2X = MX + colW + colGap;
  card(pdf, col2X, y, colW, cardH, h);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...C.secondary);
  pdf.text("Funcionalidades", col2X + 5, y + 8);
  bulletList(pdf, funcionalidades, col2X + 5, y + 16, colW - 10, cardBottom - 6);

  // Col 3: Recomendadas + Donut chart
  const col3X = MX + (colW + colGap) * 2;
  card(pdf, col3X, y, colW, cardH, h);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...C.accent);
  pdf.text("★ Premium", col3X + 5, y + 8);

  let recEndY = y + 16;
  if (recomendadas.length > 0) {
    const maxRecY = y + cardH * 0.55; // reserve bottom half for donut
    recomendadas.forEach((item) => {
      if (recEndY > maxRecY) return;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.accent);
      pdf.text("★", col3X + 5, recEndY);
      pdf.setTextColor(...C.lightGray);
      const lines = pdf.splitTextToSize(item, colW - 16);
      pdf.text(lines[0] || "", col3X + 11, recEndY);
      recEndY += 6;
    });
  }

  // Donut chart in col3 bottom — positioned after recomendadas with safe spacing
  const donutCenterY = Math.max(recEndY + 22, y + cardH * 0.65);
  if (donutCenterY + 30 < cardBottom) {
    const segments = [
      { label: "Core", pct: 45, color: C.primary },
      { label: "Gestão", pct: 30, color: C.secondary },
      { label: "Design", pct: 15, color: C.accent },
      { label: "QA", pct: 10, color: C.accent2 },
    ];
    drawDonutChart(pdf, col3X + colW / 2, donutCenterY, 14, segments, h, { white: C.white, midGray: C.midGray, bg: C.bg });
  }
}

function pageStrategicAnalysis(pdf: jsPDF, p: Proposta, h: Helpers) {
  drawPageBg(pdf);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const ni = pj.niche_intelligence as Record<string, any> | undefined;
  const benefits = ni?.strategic_benefits as any[] | undefined;

  let y = MY;
  y = sectionTitle(pdf, "Análise Estratégica", y);

  const cardBottom = MY + CH - 10;

  // Left: text
  const leftW = CW * 0.45;
  card(pdf, MX, y, leftW, cardBottom - y, h);
  let ly = y + 8;
  ly = textBlock(pdf, pj.analise_estrategica || "", MX + 6, ly, leftW - 12, 9, cardBottom - 50);

  // Investment justification
  if (ni?.investment_justification && ly < cardBottom - 30) {
    ly += 4;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.accent);
    pdf.text("Justificativa de Investimento", MX + 6, ly);
    ly += 6;
    // Dynamic height based on remaining space
    const justBoxH = Math.min(cardBottom - ly - 6, 50);
    pdf.setFillColor(...C.primary);
    h.setOpacity(0.08);
    pdf.roundedRect(MX + 4, ly - 3, leftW - 8, justBoxH, 2, 2, "F");
    h.restoreOpacity();
    textBlock(pdf, ni.investment_justification, MX + 8, ly, leftW - 16, 8.5, ly + justBoxH - 4);
  }

  // Expert ref at bottom of card
  if (ni?.expert_reference) {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(6.5);
    pdf.setTextColor(...C.midGray);
    const rl = pdf.splitTextToSize(`Fontes: ${ni.expert_reference}`, leftW - 12);
    pdf.text(rl.slice(0, 2), MX + 6, cardBottom - 6);
  }

  // Right: benefit cards
  const rightX = MX + leftW + 10;
  const rightW = CW - leftW - 10;
  if (benefits && benefits.length > 0) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...C.white);
    pdf.text("Benefícios Estratégicos", rightX, y + 5);
    const colors: RGB[] = [C.primary, C.secondary, C.accent, C.accent2];
    const benefitCardH = 28;
    const benefitGap = 4;
    benefits.forEach((b: any, i: number) => {
      const by = y + 12 + i * (benefitCardH + benefitGap);
      if (by + benefitCardH > cardBottom) return;
      card(pdf, rightX, by, rightW, benefitCardH, h);
      pdf.setFillColor(...colors[i % colors.length]);
      pdf.roundedRect(rightX, by, 3, benefitCardH, 1.5, 1.5, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...colors[i % colors.length]);
      pdf.text(b.title || "", rightX + 8, by + 9);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.lightGray);
      const dl = pdf.splitTextToSize(b.desc || "", rightW - 14);
      pdf.text(dl.slice(0, 3), rightX + 8, by + 16);
    });
  }
}

function pageTimeline(pdf: jsPDF, p: Proposta, h: Helpers) {
  drawPageBg(pdf);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const ni = pj.niche_intelligence as Record<string, any> | undefined;
  const phases = ni?.timeline_phases as any[] | undefined;

  let y = MY;
  y = sectionTitle(pdf, "Cronograma de Execução", y);

  // Schedule badge
  if (pj.cronograma) {
    card(pdf, MX, y, CW, 14, h);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...C.accent);
    pdf.text(`⏱ ${pj.cronograma}`, MX + 8, y + 9);
    y += 20;
  }

  // Visual timeline — full width landscape
  if (phases && phases.length > 0) {
    const steps = phases.map((ph: any) => ({
      title: ph.title || "",
      subtitle: ph.subtitle || "",
      desc: ph.desc || "",
    }));
    drawTimeline(pdf, MX, y, CW, steps, h, {
      primary: C.primary, secondary: C.secondary, accent: C.accent, accent2: C.accent2,
      white: C.white, midGray: C.midGray, lightGray: C.lightGray, bg: C.bg,
    });
    y += 65;
  }

  // Bottom row: effort + maintenance
  const bottomH = PH - y - 16; // available space
  if (bottomH < 20) return; // not enough space
  const halfW = (CW - 8) / 2;

  // Left: effort
  card(pdf, MX, y, halfW, bottomH, h);
  let ly = y + 8;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...C.accent2);
  pdf.text("Estimativa de Esforço", MX + 6, ly);
  ly += 6;
  textBlock(pdf, pj.estimativa_esforco || "", MX + 6, ly, halfW - 12, 9, y + bottomH - 6);

  // Right: maintenance
  const rx = MX + halfW + 8;
  card(pdf, rx, y, halfW, bottomH, h);
  ly = y + 8;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...C.secondary);
  pdf.text("Manutenção & Suporte", rx + 6, ly);
  ly += 6;
  ly = textBlock(pdf, pj.manutencao || "", rx + 6, ly, halfW - 12, 9, y + bottomH - 20);

  const maintFeatures = ni?.maintenance_features as string[] | undefined;
  if (maintFeatures && maintFeatures.length > 0) {
    bulletList(pdf, maintFeatures, rx + 6, ly, halfW - 12, y + bottomH - 6);
  }
}

function pageRisks(pdf: jsPDF, p: Proposta, h: Helpers) {
  drawPageBg(pdf);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const ni = pj.niche_intelligence as Record<string, any> | undefined;
  const riscos = Array.isArray(pj.riscos) ? pj.riscos : [];
  const proximos = Array.isArray(pj.proximos_passos) ? pj.proximos_passos : [];
  const riskMatrix = ni?.risk_matrix as any[] | undefined;

  let y = MY;
  y = sectionTitle(pdf, "Riscos & Próximos Passos", y);

  const halfW = (CW - 8) / 2;
  const cardBottom = MY + CH - 10;
  const cardH = cardBottom - y;

  // Left: risks
  card(pdf, MX, y, halfW, cardH, h);
  let ly = y + 8;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...C.red);
  pdf.text("Matriz de Riscos", MX + 6, ly);
  ly += 8;

  if (riskMatrix && riskMatrix.length > 0) {
    riskMatrix.forEach((risk: any, i: number) => {
      if (ly > cardBottom - 12) return;
      const sevColor: RGB = risk.severity === "alto" ? C.red : risk.severity === "medio" ? C.accent : C.secondary;
      pdf.setFillColor(...sevColor);
      pdf.circle(MX + 10, ly, 2.5, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...C.white);
      pdf.text(risk.title || `Risco ${i + 1}`, MX + 16, ly + 1);
      ly += 6;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...C.midGray);
      pdf.text(`Impacto: ${risk.impact || "—"}`, MX + 16, ly);
      ly += 5;
      pdf.setTextColor(...C.secondary);
      pdf.text(`Mitigação: ${risk.mitigation || "—"}`, MX + 16, ly);
      ly += 8;
    });
  } else if (riscos.length > 0) {
    bulletList(pdf, riscos, MX + 6, ly, halfW - 12, cardBottom - 6);
  }

  // Right: next steps
  const rx = MX + halfW + 8;
  card(pdf, rx, y, halfW, cardH, h);
  let ry = y + 8;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...C.accent2);
  pdf.text("Próximos Passos", rx + 6, ry);
  ry += 10;

  const stepCardH = 14;
  const stepGap = 4;
  proximos.forEach((step, i) => {
    if (ry + stepCardH > cardBottom - 4) return;
    card(pdf, rx + 4, ry, halfW - 8, stepCardH, h);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...C.primary);
    pdf.text(String(i + 1).padStart(2, "0"), rx + 10, ry + 9);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...C.lightGray);
    const sl = pdf.splitTextToSize(step, halfW - 40);
    pdf.text(sl[0] || "", rx + 24, ry + 9);
    ry += stepCardH + stepGap;
  });
}

function pageTiers(pdf: jsPDF, p: Proposta, h: Helpers): boolean {
  if (!p.proposal_tiers || p.proposal_tiers.length === 0) return false;

  drawPageBg(pdf);
  let y = MY;
  y = sectionTitle(pdf, "Planos de Investimento", y);

  const tiers = p.proposal_tiers;
  const headers = tiers.map((t) => t.name);
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
    drawComparisonTable(pdf, MX, y, CW, headers, rows, h, {
      primary: C.primary, secondary: C.secondary, white: C.white,
      midGray: C.midGray, bgCard: C.bgCard, lightGray: C.lightGray, bg: C.bg,
    });
  }
  return true;
}

function pageClosing(pdf: jsPDF, p: Proposta, h: Helpers, logos: PdfLogos, docCode?: string) {
  drawPageBg(pdf);

  const centerX = PW / 2;
  const centerY = PH / 2;

  // Agency logo centered at top
  if (logos.agencyLogo) {
    try {
      pdf.addImage(logos.agencyLogo, "PNG", centerX - 10, MY + 10, 20, 20);
    } catch { /* skip */ }
  }

  // Large centered card
  const cardW = 200;
  const cardH = 100;
  const cardY = centerY - cardH / 2 + 8; // shift down a bit to avoid logo overlap
  pdf.setFillColor(...C.primary);
  h.setOpacity(0.07);
  pdf.roundedRect(centerX - cardW / 2, cardY, cardW, cardH, 6, 6, "F");
  h.restoreOpacity();
  pdf.setDrawColor(...C.primary);
  h.setOpacity(0.4);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(centerX - cardW / 2, cardY, cardW, cardH, 6, 6, "S");
  h.restoreOpacity();

  const textCY = cardY + cardH / 2;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(...C.white);
  pdf.text("Pronto para transformar", centerX, textCY - 20, { align: "center" });
  pdf.text("sua ideia em realidade?", centerX, textCY - 8, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...C.lightGray);
  pdf.text("Entre em contato para iniciar o desenvolvimento.", centerX, textCY + 8, { align: "center" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...C.accent);
  pdf.text(`Validade: ${p.proposal_validity || "30 dias"}`, centerX, textCY + 20, { align: "center" });

  if (p.closing_strategy) {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.midGray);
    const cs = pdf.splitTextToSize(p.closing_strategy, 170);
    pdf.text(cs.slice(0, 2), centerX, textCY + 30, { align: "center" });
  }

  if (docCode) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    pdf.text(`Código do documento: ${docCode}`, centerX, textCY + 42, { align: "center" });
  }

  // Brand
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...C.primary);
  pdf.text("HOLYNEX LABS", centerX, PH - 24, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...C.midGray);
  pdf.text("holynex.com • Tecnologia & Inovação Digital", centerX, PH - 18, { align: "center" });
}

// ══════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ══════════════════════════════════════════════════════════════

export async function generatePropostaPdf(
  proposta: Proposta,
  _templateId?: string,
  documentCode?: string,
): Promise<Blob> {
  const renderStart = Date.now();

  await logProposalEvent("proposal_pdf_render_started", proposta.id, {
    render_status: "started",
    template_id: "jspdf-landscape-v3",
  });

  try {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const helpers = makeOpacityHelpers(pdf);

    // Load logos (agency + client from link_referencia)
    const logos = await loadPdfLogos(proposta.link_referencia || undefined);

    const hasTiers = proposta.proposal_tiers && proposta.proposal_tiers.length > 0;
    const totalPages = hasTiers ? 8 : 7;
    let pageNum = 0;

    // Page 1: Cover
    pageNum++;
    pageCover(pdf, proposta, helpers, logos);
    drawFooter(pdf, pageNum, totalPages, documentCode);

    // Page 2: Executive Summary
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

    // Page 6: Timeline
    pdf.addPage();
    pageNum++;
    pageTimeline(pdf, proposta, helpers);
    drawFooter(pdf, pageNum, totalPages, documentCode);

    // Page 7: Risks & Next Steps
    pdf.addPage();
    pageNum++;
    pageRisks(pdf, proposta, helpers);
    drawFooter(pdf, pageNum, totalPages, documentCode);

    // Page 8 (or 7): Closing
    pdf.addPage();
    pageNum++;
    pageClosing(pdf, proposta, helpers, logos, documentCode);
    drawFooter(pdf, pageNum, totalPages, documentCode);

    const blob = pdf.output("blob");

    await logProposalEvent("proposal_pdf_generated", proposta.id, {
      render_status: "success",
      template_id: "jspdf-landscape-v3",
      duration_ms: Date.now() - renderStart,
      pages: pageNum,
    });

    return blob;
  } catch (err) {
    await logProposalEvent("proposal_pdf_render_failed", proposta.id, {
      render_status: "failed",
      template_id: "jspdf-landscape-v3",
      duration_ms: Date.now() - renderStart,
      render_error: err instanceof Error ? err.message : "Erro desconhecido",
    });
    throw err;
  }
}
