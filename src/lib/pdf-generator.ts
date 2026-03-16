/**
 * Multi-page LANDSCAPE PDF — Genspark Slides-inspired dark design.
 * Each page has: decorative circles, category badge, bold title, card grids.
 * A4 Landscape: 297mm × 210mm
 */
import { jsPDF } from "jspdf";
import agencyLogoUrl from "@/assets/logo-transparent.png";
import type { Proposta } from "@/lib/propostas";
import { logProposalEvent } from "@/lib/proposal-events";
import { loadPdfLogos, type PdfLogos } from "@/lib/pdf-logos";
import {
  drawBarChart,
  drawDonutChart,
  drawComparisonTable,
  drawKpiCard,
} from "@/lib/pdf-charts";
import type { RGB } from "@/lib/pdf-charts";

// ── Dimensions ──
const PW = 297;
const PH = 210;
const MX = 16;
const MY = 14;
const CW = PW - MX * 2;
const CH = PH - MY * 2;

// ── Palette (Genspark dark theme) ──
const C = {
  bg:        [13, 17, 28] as RGB,   // deep navy
  bgCard:    [19, 25, 42] as RGB,   // card dark
  bgCard2:   [24, 31, 52] as RGB,   // slightly lighter card
  primary:   [0, 180, 255] as RGB,  // cyan
  purple:    [139, 92, 246] as RGB, // purple accent
  green:     [34, 197, 94] as RGB,  // green
  pink:      [236, 72, 153] as RGB, // pink
  orange:    [251, 146, 60] as RGB, // orange
  yellow:    [250, 204, 21] as RGB, // yellow
  white:     [255, 255, 255] as RGB,
  lightGray: [180, 190, 210] as RGB,
  midGray:   [100, 116, 145] as RGB,
  darkBorder:[35, 45, 65] as RGB,
  red:       [239, 68, 68] as RGB,
};

const ACCENT_COLORS: RGB[] = [C.primary, C.purple, C.green, C.pink, C.orange, C.yellow];

// ── Opacity Helpers ──
function makeOpacityHelpers(pdf: jsPDF) {
  let GStateCtor: any = null;
  try { GStateCtor = (jsPDF as any).API?.GState || (pdf as any).GState; } catch {}
  return {
    setOpacity: (o: number) => { if (!GStateCtor) return; try { (pdf as any).setGState(new GStateCtor({ opacity: o, "stroke-opacity": o })); } catch {} },
    restoreOpacity: () => { if (!GStateCtor) return; try { (pdf as any).setGState(new GStateCtor({ opacity: 1, "stroke-opacity": 1 })); } catch {} },
  };
}
type H = ReturnType<typeof makeOpacityHelpers>;

// ── Utility ──
function fmt(v: number): string { return `R$ ${Number(v || 0).toLocaleString("pt-BR")}`; }
function fmtDate(iso: string): string { return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }); }

async function loadAssetAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn("[PDF] Falha ao carregar asset para base64", { url, status: response.status });
      return null;
    }

    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("[PDF] Erro ao converter asset em base64", { url, error });
    return null;
  }
}

async function resolvePdfLogos(clientSiteUrl?: string): Promise<PdfLogos> {
  const logos = await loadPdfLogos(clientSiteUrl);

  if (logos.agencyLogo) return logos;

  const officialAgencyLogo = await loadAssetAsDataUrl(agencyLogoUrl);
  if (!officialAgencyLogo) {
    console.error("[PDF] Logo oficial da agência não pôde ser carregada", { agencyLogoUrl });
    return logos;
  }

  return {
    ...logos,
    agencyLogo: officialAgencyLogo,
  };
}

function addPdfImage(
  pdf: jsPDF,
  imageData: string | null,
  format: "PNG" | "JPEG",
  x: number,
  y: number,
  width: number,
  height: number,
  context: string,
): boolean {
  if (!imageData) {
    console.warn(`[PDF] Imagem ausente em ${context}`);
    return false;
  }

  try {
    const detectedFormat = imageData.startsWith("data:image/jpeg") || imageData.startsWith("data:image/jpg") ? "JPEG" : format;
    pdf.addImage(imageData, detectedFormat, x, y, width, height);
    return true;
  } catch (error) {
    console.error(`[PDF] Falha ao inserir imagem em ${context}`, error);
    return false;
  }
}

// ── Background with decorative circles ──
function drawBg(pdf: jsPDF, h: H) {
  pdf.setFillColor(...C.bg);
  pdf.rect(0, 0, PW, PH, "F");
  // Decorative circle top-right
  h.setOpacity(0.04);
  pdf.setFillColor(...C.primary);
  pdf.circle(PW - 30, -20, 80, "F");
  // Decorative circle bottom-left
  pdf.setFillColor(...C.purple);
  pdf.circle(20, PH + 30, 60, "F");
  h.restoreOpacity();
}

// ── Footer bar ──
function drawFooter(pdf: jsPDF, pageNum: number, total: number, docCode?: string) {
  const fy = PH - 10;
  pdf.setDrawColor(...C.darkBorder);
  pdf.setLineWidth(0.3);
  pdf.line(MX, fy, PW - MX, fy);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  pdf.setTextColor(...C.midGray);
  pdf.text(docCode ? `Doc: ${docCode}` : "HOLYNEX LABS", MX, fy + 5);
  pdf.text(`${pageNum} / ${total}`, PW - MX, fy + 5, { align: "right" });
}

// ── Category Badge + Section Title (like Genspark) ──
function pageHeader(pdf: jsPDF, badge: string, subtitle: string, title: string, badgeColor: RGB = C.primary) {
  const by = MY;
  // Badge pill
  const badgeW = pdf.getTextWidth(badge.toUpperCase()) + 10;
  pdf.setFillColor(...badgeColor);
  pdf.roundedRect(MX, by, Math.max(badgeW, 30), 8, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.5);
  pdf.setTextColor(...C.bg);
  pdf.text(badge.toUpperCase(), MX + 4, by + 5.5);

  // Subtitle next to badge
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...C.midGray);
  pdf.text(subtitle.toUpperCase(), MX + Math.max(badgeW, 30) + 6, by + 5.5);

  // Big title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.setTextColor(...C.white);
  pdf.text(title, MX, by + 22);

  // Accent line below title
  pdf.setFillColor(...badgeColor);
  pdf.rect(MX, by + 26, 40, 1.2, "F");

  return by + 34;
}

// ── Card with colored top border ──
function cardWithBorder(pdf: jsPDF, x: number, y: number, w: number, h_val: number, borderColor: RGB, hh: H, dashed = false) {
  // Card background
  pdf.setFillColor(...C.bgCard);
  hh.setOpacity(0.85);
  pdf.roundedRect(x, y, w, h_val, 4, 4, "F");
  hh.restoreOpacity();

  // Side/top colored border
  pdf.setDrawColor(...C.darkBorder);
  hh.setOpacity(0.4);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(x, y, w, h_val, 4, 4, "S");
  hh.restoreOpacity();

  // Top accent stripe
  pdf.setFillColor(...borderColor);
  if (dashed) {
    hh.setOpacity(0.6);
    pdf.setDrawColor(...borderColor);
    pdf.setLineWidth(1.2);
    // Dashed top line
    const dashLen = 3;
    const gapLen = 2;
    let dx = x + 4;
    while (dx < x + w - 4) {
      const end = Math.min(dx + dashLen, x + w - 4);
      pdf.line(dx, y + 0.6, end, y + 0.6);
      dx = end + gapLen;
    }
    hh.restoreOpacity();
  } else {
    pdf.rect(x + 4, y, w - 8, 1.5, "F");
  }
}

// ── Watermark number (big faded number inside card) ──
function watermarkNumber(pdf: jsPDF, num: string, x: number, y: number, w: number, h: H) {
  h.setOpacity(0.06);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(48);
  pdf.setTextColor(...C.white);
  pdf.text(num, x + w - 8, y + 28, { align: "right" });
  h.restoreOpacity();
}

// ── Text helpers ──
function textBlock(pdf: jsPDF, text: string, x: number, y: number, maxW: number, fontSize = 9, maxY?: number): number {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(fontSize);
  pdf.setTextColor(...C.lightGray);
  const lines = pdf.splitTextToSize(text || "Não informado", maxW);
  const lineH = fontSize * 0.45;
  const limit = maxY || PH - 20;
  let cy = y;
  for (const line of lines) {
    if (cy > limit) break;
    pdf.text(line, x, cy);
    cy += lineH;
  }
  return cy + 3;
}

function bulletList(pdf: jsPDF, items: string[], x: number, y: number, maxW: number, maxY?: number, color?: RGB): number {
  let cy = y;
  const limit = maxY || PH - 20;
  const dotColor = color || C.primary;
  for (const item of items) {
    if (cy > limit) break;
    pdf.setFillColor(...dotColor);
    pdf.circle(x + 1.5, cy - 1, 1.2, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.lightGray);
    const lines = pdf.splitTextToSize(item, maxW - 8);
    for (const line of lines) {
      if (cy > limit) break;
      pdf.text(line, x + 5, cy);
      cy += 4;
    }
    cy += 2;
  }
  return cy;
}

// ══════════════════════════════════════════════════════════════
//  PAGE BUILDERS
// ══════════════════════════════════════════════════════════════

function pageCover(pdf: jsPDF, p: Proposta, h: H, logos: PdfLogos) {
  drawBg(pdf, h);

  // Larger decorative circles for cover
  h.setOpacity(0.06);
  pdf.setFillColor(...C.primary);
  pdf.circle(PW - 50, 40, 110, "F");
  pdf.setFillColor(...C.purple);
  pdf.circle(PW - 120, PH - 20, 70, "F");
  h.restoreOpacity();

  // Top bar: category + logos
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...C.midGray);
  let brandX = MX;

  if (logos.agencyLogo) {
    try {
      pdf.addImage(logos.agencyLogo, "PNG", MX, MY, 10, 10);
      brandX = MX + 14;
    } catch {}
  }
  pdf.text("PROPOSTA COMERCIAL & TECNOLOGIA", brandX, MY + 7);

  // Client logo top-right
  if (logos.clientLogo) {
    try { pdf.addImage(logos.clientLogo, "PNG", PW - MX - 14, MY, 10, 10); } catch {}
  }

  // Main title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(42);
  pdf.setTextColor(...C.white);
  const titleLines = pdf.splitTextToSize("Proposta Comercial", CW * 0.65);
  let ty = MY + 40;
  for (const tl of titleLines) {
    pdf.text(tl, MX, ty);
    ty += 18;
  }

  // Subtitle - project type
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(14);
  pdf.setTextColor(...C.primary);
  pdf.text(p.tipo_projeto || "Desenvolvimento Sob Medida", MX, ty + 4);
  ty += 14;

  // Description snippet
  const desc = (p.proposta_json as any)?.resumo_executivo || p.descricao_projeto || "";
  if (desc) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...C.lightGray);
    const dl = pdf.splitTextToSize(desc, CW * 0.55);
    pdf.text(dl.slice(0, 3), MX, ty + 4);
    ty += dl.slice(0, 3).length * 5 + 6;
  }

  // Accent line
  pdf.setFillColor(...C.primary);
  pdf.rect(MX, ty, 40, 1.5, "F");

  // Bottom info cards (4 cards like Genspark cover slide)
  const cardCount = 4;
  const cardGap = 8;
  const cardW = (CW - cardGap * (cardCount - 1)) / cardCount;
  const cardH = 38;
  const cardY = PH - MY - cardH - 14;

  const metas = [
    { icon: "◎", label: "CLIENTE", value: p.nome_cliente, color: C.primary },
    { icon: "◆", label: "EMPRESA", value: p.empresa_cliente || "—", color: C.purple },
    { icon: "◇", label: "INVESTIMENTO", value: fmt(p.valor_ideal), color: C.green },
    { icon: "●", label: "DATA", value: fmtDate(p.criado_em), color: C.orange },
  ];

  metas.forEach((m, i) => {
    const cx = MX + i * (cardW + cardGap);
    cardWithBorder(pdf, cx, cardY, cardW, cardH, m.color, h);

    // Icon
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...m.color);
    pdf.text(m.icon, cx + 6, cardY + 10);

    // Label
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    pdf.setTextColor(...m.color);
    pdf.text(m.label, cx + 14, cardY + 10);

    // Value
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...C.lightGray);
    const vl = pdf.splitTextToSize(m.value, cardW - 12);
    pdf.text(vl.slice(0, 2), cx + 6, cardY + 20);
  });

  // Version tag bottom-right
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);
  pdf.setTextColor(...C.midGray);
  pdf.text("HOLYNEX LABS • PROPOSTA V1.0", PW - MX, PH - 8, { align: "right" });
}

function pageExecutiveSummary(pdf: jsPDF, p: Proposta, h: H) {
  drawBg(pdf, h);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;

  let y = pageHeader(pdf, "VISÃO GERAL", "Análise do Projeto", "Resumo Executivo", C.primary);

  const leftW = CW * 0.48;
  const rightX = MX + CW * 0.52;
  const rightW = CW * 0.48;
  const cardBottom = PH - MY - 14;

  // Left: main text card
  const leftH = cardBottom - y;
  cardWithBorder(pdf, MX, y, leftW, leftH, C.primary, h);

  // Icon in card
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(...C.primary);
  pdf.text("◎", MX + 8, y + 14);

  // "O que é?"
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(...C.white);
  pdf.text("O que é?", MX + 8, y + 26);

  let ly = y + 34;
  ly = textBlock(pdf, pj.resumo_executivo || p.descricao_projeto || "", MX + 8, ly, leftW - 16, 9, cardBottom - 40);

  // Scope tags at bottom of left card
  const escopo = Array.isArray(pj.escopo) ? pj.escopo.slice(0, 5) : [];
  if (escopo.length > 0 && ly < cardBottom - 24) {
    ly += 4;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    pdf.text("ESCOPO DO PROJETO", MX + 8, ly);
    ly += 6;
    let tagX = MX + 8;
    escopo.forEach((tag: string) => {
      const tw = pdf.getTextWidth(tag) + 8;
      if (tagX + tw > MX + leftW - 8) { tagX = MX + 8; ly += 8; }
      if (ly > cardBottom - 10) return;
      // Tag pill
      pdf.setDrawColor(...C.primary);
      h.setOpacity(0.3);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(tagX, ly - 4, tw, 7, 2, 2, "S");
      h.restoreOpacity();
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.setTextColor(...C.primary);
      pdf.text(tag, tagX + 4, ly + 0.5);
      tagX += tw + 4;
    });
  }

  // Right top: 2x2 grid cards (Diagnóstico, Solução, etc.)
  const smallCardW = (rightW - 6) / 2;
  const smallCardH = (leftH - 8) / 2 - 2;

  const sections = [
    { title: "Diagnóstico", text: pj.diagnostico || "Não informado", color: C.purple },
    { title: "Solução Proposta", text: pj.solucao_proposta || "Não informado", color: C.green },
    { title: "Análise Estratégica", text: pj.analise_estrategica || "Não informado", color: C.pink },
    { title: "Complexidade", text: `${pj.complexidade || "média"}\n\n${pj.estimativa_esforco || ""}`, color: C.orange },
  ];

  sections.forEach((sec, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = rightX + col * (smallCardW + 6);
    const sy = y + row * (smallCardH + 6);
    cardWithBorder(pdf, sx, sy, smallCardW, smallCardH, sec.color, h);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.white);
    pdf.text(sec.title, sx + 6, sy + 12);

    textBlock(pdf, sec.text, sx + 6, sy + 18, smallCardW - 12, 8, sy + smallCardH - 6);
  });
}

function pageScopeFeatures(pdf: jsPDF, p: Proposta, h: H) {
  drawBg(pdf, h);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const escopo = Array.isArray(pj.escopo) ? pj.escopo : [];
  const funcionalidades = Array.isArray(pj.funcionalidades) ? pj.funcionalidades : [];
  const recomendadas = Array.isArray(pj.funcionalidades_recomendadas) ? pj.funcionalidades_recomendadas : [];

  let y = pageHeader(pdf, "ARQUITETURA", "Núcleo do Sistema", "Componentes Principais", C.purple);

  // Three numbered cards
  const colGap = 8;
  const colW = (CW - colGap * 2) / 3;
  const cardH = PH - MY - y - 14;

  const cols = [
    { num: "01", title: "Escopo", items: escopo, color: C.primary, icon: "◎" },
    { num: "02", title: "Funcionalidades", items: funcionalidades, color: C.purple, icon: "◆" },
    { num: "03", title: "Evoluções Premium", items: recomendadas, color: C.green, icon: "★" },
  ];

  cols.forEach((col, i) => {
    const cx = MX + i * (colW + colGap);
    cardWithBorder(pdf, cx, y, colW, cardH, col.color, h, i === 1);

    // Watermark number
    watermarkNumber(pdf, col.num, cx, y, colW, h);

    // Icon
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...col.color);
    pdf.text(col.icon, cx + 8, y + 16);

    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...C.white);
    pdf.text(col.title, cx + 8, y + 30);

    // Description
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.lightGray);
    const descText = col.items.length > 0
      ? `${col.items.length} itens identificados para o projeto.`
      : "A definir com o cliente.";
    pdf.text(descText, cx + 8, y + 38);

    // Bullet items
    bulletList(pdf, col.items, cx + 8, y + 48, colW - 16, y + cardH - 8, col.color);
  });
}

function pageInvestment(pdf: jsPDF, p: Proposta, h: H) {
  drawBg(pdf, h);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;

  let y = pageHeader(pdf, "INVESTIMENTO", "Valores & Retorno", "Plano de Investimento", C.green);

  const halfW = (CW - 10) / 2;
  const cardBottom = PH - MY - 14;

  // Left: 3 investment cards stacked
  const investments = [
    { label: "Investimento Mínimo", value: fmt(p.valor_minimo), desc: "Escopo essencial / MVP", color: C.orange, num: "01" },
    { label: "Investimento Ideal", value: fmt(p.valor_ideal), desc: "Escopo completo recomendado", color: C.green, num: "02" },
    { label: "Investimento Premium", value: fmt(p.valor_premium), desc: "Escopo expandido + extras", color: C.purple, num: "03" },
  ];

  const invCardH = 32;
  const invGap = 6;

  investments.forEach((inv, i) => {
    const iy = y + i * (invCardH + invGap);
    cardWithBorder(pdf, MX, iy, halfW, invCardH, inv.color, h);
    watermarkNumber(pdf, inv.num, MX, iy, halfW, h);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.white);
    pdf.text(inv.label, MX + 8, iy + 10);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor(...inv.color);
    pdf.text(inv.value, MX + 8, iy + 23);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    pdf.text(inv.desc, MX + 70, iy + 23);
  });

  // Bar chart below investments
  const barY = y + 3 * (invCardH + invGap) + 4;
  const barH = cardBottom - barY;
  if (barH > 25) {
    drawBarChart(
      pdf, MX, barY, halfW, barH,
      investments.map(inv => ({
        label: inv.label.replace("Investimento ", ""),
        value: Number(String(inv.value).replace(/[^\d]/g, "")) || 0,
        color: inv.color,
      })),
      h,
      { white: C.white, midGray: C.midGray, bgCard: C.bgCard, lightGray: C.lightGray }
    );
  }

  // Right: KPIs + strategic info
  const rightX = MX + halfW + 10;
  const ni = pj.niche_intelligence as Record<string, any> | undefined;
  const kpis = ni?.kpis as any[] | undefined;

  if (kpis && kpis.length > 0) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.midGray);
    pdf.text("KPIS PROJETADOS", rightX, y + 5);

    const kpiCardW = (halfW - 6) / 2;
    const kpiCardH = 28;
    const kpiGap = 6;
    const maxKpis = Math.min(kpis.length, 6);
    kpis.slice(0, maxKpis).forEach((kpi: any, i: number) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const kx = rightX + col * (kpiCardW + 6);
      const ky = y + 12 + row * (kpiCardH + kpiGap);
      if (ky + kpiCardH > cardBottom) return;
      drawKpiCard(pdf, kx, ky, kpiCardW, kpiCardH, "◆", kpi.metric || "", kpi.label || "", h,
        { primary: ACCENT_COLORS[i % ACCENT_COLORS.length], bgCard: C.bgCard, white: C.white, midGray: C.midGray },
        ACCENT_COLORS[i % ACCENT_COLORS.length]);
    });
  }

  // Justification box at bottom right
  if (ni?.investment_justification) {
    const justY = Math.max(y + 110, cardBottom - 50);
    if (justY + 30 < cardBottom) {
      cardWithBorder(pdf, rightX, justY, halfW, cardBottom - justY, C.yellow, h);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.yellow);
      pdf.text("JUSTIFICATIVA DE INVESTIMENTO", rightX + 6, justY + 10);
      textBlock(pdf, ni.investment_justification, rightX + 6, justY + 16, halfW - 12, 7.5, cardBottom - 4);
    }
  }
}

function pageTimeline(pdf: jsPDF, p: Proposta, h: H) {
  drawBg(pdf, h);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const ni = pj.niche_intelligence as Record<string, any> | undefined;
  const phases = ni?.timeline_phases as any[] | undefined;

  let y = pageHeader(pdf, "WORKFLOW", "End-to-End", "Pipeline de Execução", C.pink);

  // Schedule badge
  if (pj.cronograma) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.lightGray);
    pdf.text(`⏱ ${pj.cronograma}`, MX, y + 4);
    y += 10;
  }

  // Phase cards in grid (3 columns)
  if (phases && phases.length > 0) {
    const cols = 3;
    const colGap = 8;
    const rowGap = 6;
    const colW = (CW - colGap * (cols - 1)) / cols;
    const cardH = 38;
    const phaseColors: RGB[] = [C.primary, C.purple, C.green, C.pink, C.orange, C.yellow];

    phases.forEach((ph: any, i: number) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = MX + col * (colW + colGap);
      const cy = y + row * (cardH + rowGap);
      if (cy + cardH > PH - MY - 14) return;

      const pc = phaseColors[i % phaseColors.length];
      cardWithBorder(pdf, cx, cy, colW, cardH, pc, h);
      watermarkNumber(pdf, String(i + 1).padStart(2, "0"), cx, cy, colW, h);

      // Icon
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...pc);
      pdf.text("◆", cx + 6, cy + 12);

      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...C.white);
      pdf.text(ph.title || `Fase ${i + 1}`, cx + 6, cy + 22);

      // Desc
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...C.lightGray);
      const dl = pdf.splitTextToSize(ph.desc || ph.subtitle || "", colW - 14);
      pdf.text(dl.slice(0, 2), cx + 6, cy + 28);
    });
  }

  // Bottom cards: effort + maintenance
  const bottomY = PH - MY - 36;
  const halfW = (CW - 8) / 2;

  cardWithBorder(pdf, MX, bottomY, halfW, 22, C.primary, h);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...C.primary);
  pdf.text("ESTIMATIVA DE ESFORÇO", MX + 6, bottomY + 8);
  textBlock(pdf, pj.estimativa_esforco || "A definir", MX + 6, bottomY + 14, halfW - 12, 7.5, bottomY + 20);

  const rx = MX + halfW + 8;
  cardWithBorder(pdf, rx, bottomY, halfW, 22, C.green, h);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...C.green);
  pdf.text("MANUTENÇÃO & SUPORTE", rx + 6, bottomY + 8);
  textBlock(pdf, pj.manutencao || "Sob consulta", rx + 6, bottomY + 14, halfW - 12, 7.5, bottomY + 20);
}

function pageRisks(pdf: jsPDF, p: Proposta, h: H) {
  drawBg(pdf, h);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const ni = pj.niche_intelligence as Record<string, any> | undefined;
  const riscos = Array.isArray(pj.riscos) ? pj.riscos : [];
  const proximos = Array.isArray(pj.proximos_passos) ? pj.proximos_passos : [];
  const riskMatrix = ni?.risk_matrix as any[] | undefined;

  let y = pageHeader(pdf, "BEST PRACTICES", "Qualidade & Segurança", "Riscos & Próximos Passos", C.orange);

  const halfW = (CW - 10) / 2;
  const rightX = MX + halfW + 10;
  const cardBottom = PH - MY - 14;

  // Left column header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...C.red);
  pdf.text("◆ Matriz de Riscos", MX, y + 4);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  pdf.setTextColor(...C.midGray);
  pdf.text("ANÁLISE", MX + 50, y + 4);

  // Right column header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...C.primary);
  pdf.text("◆ Próximos Passos", rightX, y + 4);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  pdf.setTextColor(...C.midGray);
  pdf.text("AÇÃO", rightX + 50, y + 4);

  y += 12;

  // Left: risk items as rows with icon
  const risks = riskMatrix && riskMatrix.length > 0 ? riskMatrix : riscos.map((r: string) => ({ title: r, impact: "", mitigation: "", severity: "medio" }));
  risks.forEach((risk: any, i: number) => {
    if (y > cardBottom - 10) return;
    const sevColor: RGB = risk.severity === "alto" ? C.red : risk.severity === "medio" ? C.orange : C.green;
    const rowH = 22;
    cardWithBorder(pdf, MX, y, halfW, rowH, sevColor, h);

    // Icon
    pdf.setFillColor(...sevColor);
    pdf.roundedRect(MX + 6, y + 5, 8, 8, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.bg);
    pdf.text("!", MX + 10, y + 11, { align: "center" });

    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.white);
    pdf.text(risk.title || `Risco ${i + 1}`, MX + 20, y + 10);

    // Impact + mitigation
    if (risk.impact || risk.mitigation) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.setTextColor(...C.lightGray);
      const detail = [risk.impact, risk.mitigation].filter(Boolean).join(" • ");
      const dl = pdf.splitTextToSize(detail, halfW - 26);
      pdf.text(dl[0] || "", MX + 20, y + 17);
    }

    y += rowH + 4;
  });

  // Right: next steps as numbered cards
  let ry = y - (risks.length * 26); // Reset to match left start
  ry = pageHeader(pdf, "", "", "", C.primary) - 34 + 12; // recalc
  ry = MY + 46; // fixed position

  proximos.forEach((step: string, i: number) => {
    if (ry > cardBottom - 10) return;
    const stepH = 18;
    cardWithBorder(pdf, rightX, ry, halfW, stepH, ACCENT_COLORS[i % ACCENT_COLORS.length], h);
    watermarkNumber(pdf, String(i + 1).padStart(2, "0"), rightX, ry - 4, halfW, h);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.white);
    const sl = pdf.splitTextToSize(step, halfW - 16);
    pdf.text(sl[0] || "", rightX + 8, ry + 11);

    ry += stepH + 4;
  });
}

function pageTiers(pdf: jsPDF, p: Proposta, h: H): boolean {
  if (!p.proposal_tiers || p.proposal_tiers.length === 0) return false;

  drawBg(pdf, h);
  let y = pageHeader(pdf, "ENGENHARIA", "Planos & Módulos", "Comparação de Planos", C.green);

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
      primary: C.primary, secondary: C.green, white: C.white,
      midGray: C.midGray, bgCard: C.bgCard, lightGray: C.lightGray, bg: C.bg,
    });
  }
  return true;
}

function pageStrategicBenefits(pdf: jsPDF, p: Proposta, h: H) {
  drawBg(pdf, h);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const ni = pj.niche_intelligence as Record<string, any> | undefined;
  const benefits = ni?.strategic_benefits as any[] | undefined;

  let y = pageHeader(pdf, "ROADMAP", "Benefícios & ROI", "Benefícios Estratégicos", C.purple);

  const cardBottom = PH - MY - 14;

  if (benefits && benefits.length > 0) {
    const cols = 3;
    const colGap = 8;
    const colW = (CW - colGap * (cols - 1)) / cols;
    const cardH = 40;

    benefits.forEach((b: any, i: number) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = MX + col * (colW + colGap);
      const cy = y + row * (cardH + 6);
      if (cy + cardH > cardBottom) return;

      const bc = ACCENT_COLORS[i % ACCENT_COLORS.length];
      cardWithBorder(pdf, cx, cy, colW, cardH, bc, h);
      watermarkNumber(pdf, String(i + 1).padStart(2, "0"), cx, cy, colW, h);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...C.white);
      pdf.text(b.title || "", cx + 8, cy + 14);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...C.lightGray);
      const dl = pdf.splitTextToSize(b.desc || "", colW - 16);
      pdf.text(dl.slice(0, 4), cx + 8, cy + 22);
    });
  } else {
    // Fallback: scope donut + classification
    const donutX = MX + CW / 2;
    const donutY = y + 50;
    drawDonutChart(pdf, donutX, donutY, 20,
      [
        { label: "Core", pct: 45, color: C.primary },
        { label: "Gestão", pct: 30, color: C.green },
        { label: "Design", pct: 15, color: C.purple },
        { label: "QA", pct: 10, color: C.orange },
      ], h, { white: C.white, midGray: C.midGray, bg: C.bg }
    );
  }

  // Expert reference at bottom
  if (ni?.expert_reference) {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(6.5);
    pdf.setTextColor(...C.midGray);
    const rl = pdf.splitTextToSize(`Fontes: ${ni.expert_reference}`, CW);
    pdf.text(rl.slice(0, 2), MX, cardBottom + 2);
  }
}

function pageClosing(pdf: jsPDF, p: Proposta, h: H, logos: PdfLogos, docCode?: string) {
  drawBg(pdf, h);

  // Large decorative circles
  h.setOpacity(0.05);
  pdf.setFillColor(...C.primary);
  pdf.circle(PW / 2, PH / 2, 120, "F");
  pdf.setFillColor(...C.purple);
  pdf.circle(PW / 2 + 60, PH / 2 - 30, 80, "F");
  h.restoreOpacity();

  const cx = PW / 2;
  const cy = PH / 2;

  // Agency logo
  if (logos.agencyLogo) {
    try { pdf.addImage(logos.agencyLogo, "PNG", cx - 12, MY + 20, 24, 24); } catch {}
  }

  // Main CTA
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  pdf.setTextColor(...C.white);
  pdf.text("Pronto para transformar", cx, cy - 14, { align: "center" });
  pdf.text("sua ideia em realidade?", cx, cy + 4, { align: "center" });

  // Accent line
  pdf.setFillColor(...C.primary);
  pdf.rect(cx - 20, cy + 12, 40, 1.5, "F");

  // Subtitle
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...C.lightGray);
  pdf.text("Entre em contato para iniciar o desenvolvimento.", cx, cy + 24, { align: "center" });

  // Validity
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...C.primary);
  pdf.text(`Validade: ${p.proposal_validity || "30 dias"}`, cx, cy + 36, { align: "center" });

  // Closing strategy
  if (p.closing_strategy) {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.midGray);
    const cs = pdf.splitTextToSize(p.closing_strategy, 180);
    pdf.text(cs.slice(0, 2), cx, cy + 46, { align: "center" });
  }

  // Doc code
  if (docCode) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(...C.midGray);
    pdf.text(`Código do documento: ${docCode}`, cx, cy + 58, { align: "center" });
  }

  // Brand footer
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...C.primary);
  pdf.text("HOLYNEX LABS", cx, PH - 24, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...C.midGray);
  pdf.text("holynex.com • Tecnologia & Inovação Digital", cx, PH - 18, { align: "center" });
}

// ══════════════════════════════════════════════════════════════
//  MAIN GENERATOR
// ══════════════════════════════════════════════════════════════

export async function generatePropostaPdf(
  proposta: Proposta,
  _templateId?: string,
  documentCode?: string,
): Promise<Blob> {
  const renderStart = Date.now();

  await logProposalEvent("proposal_pdf_render_started", proposta.id, {
    render_status: "started",
    template_id: "jspdf-genspark-v4",
  });

  try {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const helpers = makeOpacityHelpers(pdf);
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

    // Page 4: Investment
    pdf.addPage();
    pageNum++;
    pageInvestment(pdf, proposta, helpers);
    drawFooter(pdf, pageNum, totalPages, documentCode);

    // Page 5: Strategic Benefits
    pdf.addPage();
    pageNum++;
    pageStrategicBenefits(pdf, proposta, helpers);
    drawFooter(pdf, pageNum, totalPages, documentCode);

    // Page 6: Tiers (conditional)
    if (hasTiers) {
      pdf.addPage();
      pageNum++;
      pageTiers(pdf, proposta, helpers);
      drawFooter(pdf, pageNum, totalPages, documentCode);
    }

    // Page 7: Timeline
    pdf.addPage();
    pageNum++;
    pageTimeline(pdf, proposta, helpers);
    drawFooter(pdf, pageNum, totalPages, documentCode);

    // Page 8: Risks & Next Steps + Closing
    pdf.addPage();
    pageNum++;
    pageRisks(pdf, proposta, helpers);
    drawFooter(pdf, pageNum, totalPages, documentCode);

    // Final: Closing
    pdf.addPage();
    pageNum++;
    pageClosing(pdf, proposta, helpers, logos, documentCode);
    // No footer on closing — clean exit

    const blob = pdf.output("blob");

    await logProposalEvent("proposal_pdf_generated", proposta.id, {
      render_status: "success",
      template_id: "jspdf-genspark-v4",
      duration_ms: Date.now() - renderStart,
      pages: pageNum,
    });

    return blob;
  } catch (err) {
    await logProposalEvent("proposal_pdf_render_failed", proposta.id, {
      render_status: "failed",
      template_id: "jspdf-genspark-v4",
      duration_ms: Date.now() - renderStart,
      render_error: err instanceof Error ? err.message : "Erro desconhecido",
    });
    throw err;
  }
}
