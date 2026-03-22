/**
 * Multi-page LANDSCAPE PDF — Niche-personalized dark design.
 * Each page adapts colors, emphasis, and section order per niche.
 * A4 Landscape: 297mm × 210mm
 */
import { jsPDF } from "jspdf";
import agencyLogoUrl from "@/assets/logo-transparent.png";
import type { Proposta } from "@/lib/propostas";
import { logProposalEvent } from "@/lib/proposal-events";
import { loadPdfLogos, type PdfLogos } from "@/lib/pdf-logos";
import { listPortfolioItems } from "@/lib/portfolio-items";
import { getPortfolioReferences, type PortfolioReference } from "@/lib/portfolio-similarity";
import {
  drawBarChart,
  drawDonutChart,
  drawComparisonTable,
  drawKpiCard,
} from "@/lib/pdf-charts";
import type { RGB } from "@/lib/pdf-charts";
import {
  resolveNicheConfig,
  resolveSectionsOrder,
  isSectionEmphasized,
  type NichePdfConfig,
} from "@/lib/pdf-niche-config";

// ── Dimensions ──
const PW = 297;
const PH = 210;
const MX = 16;
const MY = 14;
const CW = PW - MX * 2;

// ── Base Palette ──
const C = {
  bg:        [13, 17, 28] as RGB,
  bgCard:    [19, 25, 42] as RGB,
  bgCard2:   [24, 31, 52] as RGB,
  primary:   [0, 180, 255] as RGB,
  purple:    [139, 92, 246] as RGB,
  green:     [34, 197, 94] as RGB,
  pink:      [236, 72, 153] as RGB,
  orange:    [251, 146, 60] as RGB,
  yellow:    [250, 204, 21] as RGB,
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
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

async function resolvePdfLogos(clientSiteUrl?: string): Promise<PdfLogos> {
  const logos = await loadPdfLogos(clientSiteUrl);
  if (logos.agencyLogo) return logos;
  const officialAgencyLogo = await loadAssetAsDataUrl(agencyLogoUrl);
  if (!officialAgencyLogo) return logos;
  return { ...logos, agencyLogo: officialAgencyLogo };
}

function addPdfImage(pdf: jsPDF, imageData: string | null, format: "PNG" | "JPEG", x: number, y: number, width: number, height: number, _ctx: string): boolean {
  if (!imageData) return false;
  try {
    const detectedFormat = imageData.startsWith("data:image/jpeg") || imageData.startsWith("data:image/jpg") ? "JPEG" : format;
    pdf.addImage(imageData, detectedFormat, x, y, width, height);
    return true;
  } catch { return false; }
}

// ── Drawing Primitives ──
function drawBg(pdf: jsPDF, h: H, nc: NichePdfConfig) {
  pdf.setFillColor(...C.bg);
  pdf.rect(0, 0, PW, PH, "F");
  h.setOpacity(0.04);
  pdf.setFillColor(...nc.decor[0]);
  pdf.circle(PW - 30, -20, 80, "F");
  pdf.setFillColor(...nc.decor[1]);
  pdf.circle(20, PH + 30, 60, "F");
  h.restoreOpacity();
}

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

function pageHeader(pdf: jsPDF, badge: string, subtitle: string, title: string, badgeColor: RGB) {
  const by = MY;
  const badgeW = pdf.getTextWidth(badge.toUpperCase()) + 10;
  pdf.setFillColor(...badgeColor);
  pdf.roundedRect(MX, by, Math.max(badgeW, 30), 8, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.5);
  pdf.setTextColor(...C.bg);
  pdf.text(badge.toUpperCase(), MX + 4, by + 5.5);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...C.midGray);
  pdf.text(subtitle.toUpperCase(), MX + Math.max(badgeW, 30) + 6, by + 5.5);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.setTextColor(...C.white);
  pdf.text(title, MX, by + 22);
  pdf.setFillColor(...badgeColor);
  pdf.rect(MX, by + 26, 40, 1.2, "F");
  return by + 34;
}

function cardWithBorder(pdf: jsPDF, x: number, y: number, w: number, h_val: number, borderColor: RGB, hh: H, dashed = false) {
  pdf.setFillColor(...C.bgCard);
  hh.setOpacity(0.85);
  pdf.roundedRect(x, y, w, h_val, 4, 4, "F");
  hh.restoreOpacity();
  pdf.setDrawColor(...C.darkBorder);
  hh.setOpacity(0.4);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(x, y, w, h_val, 4, 4, "S");
  hh.restoreOpacity();
  pdf.setFillColor(...borderColor);
  if (dashed) {
    hh.setOpacity(0.6);
    pdf.setDrawColor(...borderColor);
    pdf.setLineWidth(1.2);
    let dx = x + 4;
    while (dx < x + w - 4) { const end = Math.min(dx + 3, x + w - 4); pdf.line(dx, y + 0.6, end, y + 0.6); dx = end + 2; }
    hh.restoreOpacity();
  } else {
    pdf.rect(x + 4, y, w - 8, 1.5, "F");
  }
}

function watermarkNumber(pdf: jsPDF, num: string, x: number, y: number, w: number, h: H) {
  h.setOpacity(0.06);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(48);
  pdf.setTextColor(...C.white);
  pdf.text(num, x + w - 8, y + 28, { align: "right" });
  h.restoreOpacity();
}

function textBlock(pdf: jsPDF, text: string, x: number, y: number, maxW: number, fontSize = 9, maxY?: number): number {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(fontSize);
  pdf.setTextColor(...C.lightGray);
  const lines = pdf.splitTextToSize(text || "Não informado", maxW);
  const lineH = fontSize * 0.45;
  const limit = maxY || PH - 20;
  let cy = y;
  for (const line of lines) { if (cy > limit) break; pdf.text(line, x, cy); cy += lineH; }
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
    for (const line of lines) { if (cy > limit) break; pdf.text(line, x + 5, cy); cy += 4; }
    cy += 2;
  }
  return cy;
}

// ══════════════════════════════════════════════════════════════
//  PAGE BUILDERS (niche-aware)
// ══════════════════════════════════════════════════════════════

function pageCover(pdf: jsPDF, p: Proposta, h: H, logos: PdfLogos, nc: NichePdfConfig) {
  drawBg(pdf, h, nc);
  h.setOpacity(0.06);
  pdf.setFillColor(...nc.accent);
  pdf.circle(PW - 50, 40, 110, "F");
  pdf.setFillColor(...nc.accent2);
  pdf.circle(PW - 120, PH - 20, 70, "F");
  h.restoreOpacity();

  let brandX = MX;
  const hasAgencyLogo = addPdfImage(pdf, logos.agencyLogo, "PNG", MX, MY, 10, 10, "cover");
  if (hasAgencyLogo) { brandX = MX + 14; } else {
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(...nc.accent);
    pdf.text("HOLYNEX", MX, MY + 7); brandX = MX + 18;
  }
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(...C.midGray);
  pdf.text(`${nc.categoryBadge} • PROPOSTA COMERCIAL`, brandX, MY + 7);
  addPdfImage(pdf, logos.clientLogo, "PNG", PW - MX - 14, MY, 10, 10, "cover/client");

  // Cover title from blueprint or default
  const bp = p.pdf_blueprint as any;
  const coverTitle = bp?.cover_title || "Proposta Comercial";
  const coverSub = bp?.cover_subtitle || nc.coverSubtitle;

  pdf.setFont("helvetica", "bold"); pdf.setFontSize(42); pdf.setTextColor(...C.white);
  const titleLines = pdf.splitTextToSize(coverTitle, CW * 0.65);
  let ty = MY + 40;
  for (const tl of titleLines) { pdf.text(tl, MX, ty); ty += 18; }

  pdf.setFont("helvetica", "normal"); pdf.setFontSize(14); pdf.setTextColor(...nc.accent);
  pdf.text(coverSub, MX, ty + 4);
  ty += 14;

  const desc = (p.proposta_json as any)?.resumo_executivo || p.descricao_projeto || "";
  if (desc) {
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.setTextColor(...C.lightGray);
    const dl = pdf.splitTextToSize(desc, CW * 0.55);
    pdf.text(dl.slice(0, 3), MX, ty + 4);
    ty += dl.slice(0, 3).length * 5 + 6;
  }
  pdf.setFillColor(...nc.accent);
  pdf.rect(MX, ty, 40, 1.5, "F");

  // Bottom info cards
  const cardGap = 8; const cardCount = 4;
  const cardW = (CW - cardGap * (cardCount - 1)) / cardCount;
  const cardH = 38; const cardY = PH - MY - cardH - 14;
  const metas = [
    { icon: "◎", label: "CLIENTE", value: p.nome_cliente, color: nc.accent },
    { icon: "◆", label: "EMPRESA", value: p.empresa_cliente || "—", color: nc.accent2 },
    { icon: "◇", label: "INVESTIMENTO", value: fmt(p.valor_ideal), color: C.green },
    { icon: "●", label: "DATA", value: fmtDate(p.criado_em), color: C.orange },
  ];
  metas.forEach((m, i) => {
    const cx = MX + i * (cardW + cardGap);
    cardWithBorder(pdf, cx, cardY, cardW, cardH, m.color, h);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(...m.color);
    pdf.text(m.icon, cx + 6, cardY + 10);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(6); pdf.setTextColor(...m.color);
    pdf.text(m.label, cx + 14, cardY + 10);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(8.5); pdf.setTextColor(...C.lightGray);
    const vl = pdf.splitTextToSize(m.value, cardW - 12);
    pdf.text(vl.slice(0, 2), cx + 6, cardY + 20);
  });

  pdf.setFont("helvetica", "normal"); pdf.setFontSize(6); pdf.setTextColor(...C.midGray);
  pdf.text(`HOLYNEX LABS • ${nc.label.toUpperCase()} • V1.0`, PW - MX, PH - 8, { align: "right" });
}

function pageExecutiveSummary(pdf: jsPDF, p: Proposta, h: H, nc: NichePdfConfig) {
  drawBg(pdf, h, nc);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const emphasized = isSectionEmphasized(nc, "executive_summary");

  let y = pageHeader(pdf, nc.categoryBadge, "Análise do Projeto", "Resumo Executivo", nc.accent);

  const leftW = CW * 0.48; const rightX = MX + CW * 0.52; const rightW = CW * 0.48;
  const cardBottom = PH - MY - 14;
  const leftH = cardBottom - y;
  cardWithBorder(pdf, MX, y, leftW, leftH, nc.accent, h);

  pdf.setFont("helvetica", "bold"); pdf.setFontSize(16); pdf.setTextColor(...nc.accent);
  pdf.text("◎", MX + 8, y + 14);
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(emphasized ? 16 : 14); pdf.setTextColor(...C.white);
  pdf.text("O que é?", MX + 8, y + 26);

  let ly = y + 34;
  ly = textBlock(pdf, pj.resumo_executivo || p.descricao_projeto || "", MX + 8, ly, leftW - 16, 9, cardBottom - 40);

  // Scope tags
  const escopo = Array.isArray(pj.escopo) ? pj.escopo.slice(0, 5) : [];
  if (escopo.length > 0 && ly < cardBottom - 24) {
    ly += 4;
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(7); pdf.setTextColor(...C.midGray);
    pdf.text("ESCOPO DO PROJETO", MX + 8, ly);
    ly += 6;
    let tagX = MX + 8;
    escopo.forEach((tag: string) => {
      const tw = pdf.getTextWidth(tag) + 8;
      if (tagX + tw > MX + leftW - 8) { tagX = MX + 8; ly += 8; }
      if (ly > cardBottom - 10) return;
      pdf.setDrawColor(...nc.accent); h.setOpacity(0.3); pdf.setLineWidth(0.4);
      pdf.roundedRect(tagX, ly - 4, tw, 7, 2, 2, "S"); h.restoreOpacity();
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(6.5); pdf.setTextColor(...nc.accent);
      pdf.text(tag, tagX + 4, ly + 0.5);
      tagX += tw + 4;
    });
  }

  // Right: 2x2 grid
  const smallCardW = (rightW - 6) / 2;
  const smallCardH = (leftH - 8) / 2 - 2;
  const sections = [
    { title: "Diagnóstico", text: pj.diagnostico || "Não informado", color: nc.accent2 },
    { title: "Solução Proposta", text: pj.solucao_proposta || "Não informado", color: C.green },
    { title: "Análise Estratégica", text: pj.analise_estrategica || "Não informado", color: C.pink },
    { title: "Complexidade", text: `${pj.complexidade || "média"}\n\n${pj.estimativa_esforco || ""}`, color: C.orange },
  ];
  sections.forEach((sec, i) => {
    const col = i % 2; const row = Math.floor(i / 2);
    const sx = rightX + col * (smallCardW + 6); const sy = y + row * (smallCardH + 6);
    cardWithBorder(pdf, sx, sy, smallCardW, smallCardH, sec.color, h);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(...C.white);
    pdf.text(sec.title, sx + 6, sy + 12);
    textBlock(pdf, sec.text, sx + 6, sy + 18, smallCardW - 12, 8, sy + smallCardH - 6);
  });
}

function pageScopeFeatures(pdf: jsPDF, p: Proposta, h: H, nc: NichePdfConfig) {
  drawBg(pdf, h, nc);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const escopo = Array.isArray(pj.escopo) ? pj.escopo : [];
  const funcionalidades = Array.isArray(pj.funcionalidades) ? pj.funcionalidades : [];
  const recomendadas = Array.isArray(pj.funcionalidades_recomendadas) ? pj.funcionalidades_recomendadas : [];

  let y = pageHeader(pdf, nc.categoryBadge, "Núcleo do Sistema", "Componentes Principais", nc.accent2);

  const colGap = 8; const colW = (CW - colGap * 2) / 3;
  const cardH = PH - MY - y - 14;

  const cols = [
    { num: "01", title: "Escopo", items: escopo, color: nc.accent, icon: "◎" },
    { num: "02", title: "Funcionalidades", items: funcionalidades, color: nc.accent2, icon: "◆" },
    { num: "03", title: "Evoluções Premium", items: recomendadas, color: C.green, icon: "★" },
  ];

  cols.forEach((col, i) => {
    const cx = MX + i * (colW + colGap);
    cardWithBorder(pdf, cx, y, colW, cardH, col.color, h, i === 1);
    watermarkNumber(pdf, col.num, cx, y, colW, h);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(14); pdf.setTextColor(...col.color);
    pdf.text(col.icon, cx + 8, y + 16);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(12); pdf.setTextColor(...C.white);
    pdf.text(col.title, cx + 8, y + 30);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(...C.lightGray);
    const descText = col.items.length > 0 ? `${col.items.length} itens identificados.` : "A definir.";
    pdf.text(descText, cx + 8, y + 38);
    bulletList(pdf, col.items, cx + 8, y + 48, colW - 16, y + cardH - 8, col.color);
  });
}

function pageInvestment(pdf: jsPDF, p: Proposta, h: H, nc: NichePdfConfig) {
  drawBg(pdf, h, nc);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;

  let y = pageHeader(pdf, nc.categoryBadge, "Valores & Retorno", "Plano de Investimento", C.green);

  const halfW = (CW - 10) / 2;
  const cardBottom = PH - MY - 14;

  const investments = [
    { label: "Investimento Mínimo", value: fmt(p.valor_minimo), desc: "Escopo essencial / MVP", color: C.orange, num: "01" },
    { label: "Investimento Ideal", value: fmt(p.valor_ideal), desc: "Escopo completo recomendado", color: C.green, num: "02" },
    { label: "Investimento Premium", value: fmt(p.valor_premium), desc: "Escopo expandido + extras", color: nc.accent2, num: "03" },
  ];
  const invCardH = 32; const invGap = 6;
  investments.forEach((inv, i) => {
    const iy = y + i * (invCardH + invGap);
    cardWithBorder(pdf, MX, iy, halfW, invCardH, inv.color, h);
    watermarkNumber(pdf, inv.num, MX, iy, halfW, h);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(...C.white);
    pdf.text(inv.label, MX + 8, iy + 10);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(18); pdf.setTextColor(...inv.color);
    pdf.text(inv.value, MX + 8, iy + 23);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(7); pdf.setTextColor(...C.midGray);
    pdf.text(inv.desc, MX + 70, iy + 23);
  });

  // Bar chart
  const barY = y + 3 * (invCardH + invGap) + 4;
  const barH = cardBottom - barY;
  if (barH > 25) {
    drawBarChart(pdf, MX, barY, halfW, barH,
      investments.map(inv => ({ label: inv.label.replace("Investimento ", ""), value: Number(String(inv.value).replace(/[^\d]/g, "")) || 0, color: inv.color })),
      h, { white: C.white, midGray: C.midGray, bgCard: C.bgCard, lightGray: C.lightGray }
    );
  }

  // Right: KPIs
  const rightX = MX + halfW + 10;
  const ni = pj.niche_intelligence as Record<string, any> | undefined;
  const kpis = ni?.kpis as any[] | undefined;
  if (kpis && kpis.length > 0) {
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(...C.midGray);
    pdf.text("KPIS PROJETADOS", rightX, y + 5);
    const kpiCardW = (halfW - 6) / 2; const kpiCardH = 28; const kpiGap = 6;
    kpis.slice(0, 6).forEach((kpi: any, i: number) => {
      const col = i % 2; const row = Math.floor(i / 2);
      const kx = rightX + col * (kpiCardW + 6);
      const ky = y + 12 + row * (kpiCardH + kpiGap);
      if (ky + kpiCardH > cardBottom) return;
      drawKpiCard(pdf, kx, ky, kpiCardW, kpiCardH, "◆", kpi.metric || "", kpi.label || "", h,
        { primary: ACCENT_COLORS[i % ACCENT_COLORS.length], bgCard: C.bgCard, white: C.white, midGray: C.midGray },
        ACCENT_COLORS[i % ACCENT_COLORS.length]);
    });
  }

  if (ni?.investment_justification) {
    const justY = Math.max(y + 110, cardBottom - 50);
    if (justY + 30 < cardBottom) {
      cardWithBorder(pdf, rightX, justY, halfW, cardBottom - justY, C.yellow, h);
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(...C.yellow);
      pdf.text("JUSTIFICATIVA DE INVESTIMENTO", rightX + 6, justY + 10);
      textBlock(pdf, ni.investment_justification, rightX + 6, justY + 16, halfW - 12, 7.5, cardBottom - 4);
    }
  }
}

function pageStrategicBenefits(pdf: jsPDF, p: Proposta, h: H, nc: NichePdfConfig) {
  drawBg(pdf, h, nc);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const ni = pj.niche_intelligence as Record<string, any> | undefined;
  const benefits = ni?.strategic_benefits as any[] | undefined;

  let y = pageHeader(pdf, nc.categoryBadge, "Benefícios & ROI", "Benefícios Estratégicos", nc.accent2);
  const cardBottom = PH - MY - 14;

  if (benefits && benefits.length > 0) {
    const cols = 3; const colGap = 8;
    const colW = (CW - colGap * (cols - 1)) / cols; const cardH = 40;
    benefits.forEach((b: any, i: number) => {
      const col = i % cols; const row = Math.floor(i / cols);
      const cx = MX + col * (colW + colGap); const cy = y + row * (cardH + 6);
      if (cy + cardH > cardBottom) return;
      const bc = ACCENT_COLORS[i % ACCENT_COLORS.length];
      cardWithBorder(pdf, cx, cy, colW, cardH, bc, h);
      watermarkNumber(pdf, String(i + 1).padStart(2, "0"), cx, cy, colW, h);
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(...C.white);
      pdf.text(b.title || "", cx + 8, cy + 14);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(7.5); pdf.setTextColor(...C.lightGray);
      const dl = pdf.splitTextToSize(b.desc || "", colW - 16);
      pdf.text(dl.slice(0, 4), cx + 8, cy + 22);
    });
  } else {
    const donutX = MX + CW / 2; const donutY = y + 50;
    drawDonutChart(pdf, donutX, donutY, 20,
      [{ label: "Core", pct: 45, color: nc.accent }, { label: "Gestão", pct: 30, color: C.green }, { label: "Design", pct: 15, color: nc.accent2 }, { label: "QA", pct: 10, color: C.orange }],
      h, { white: C.white, midGray: C.midGray, bg: C.bg }
    );
  }

  if (ni?.expert_reference) {
    pdf.setFont("helvetica", "italic"); pdf.setFontSize(6.5); pdf.setTextColor(...C.midGray);
    const rl = pdf.splitTextToSize(`Fontes: ${ni.expert_reference}`, CW);
    pdf.text(rl.slice(0, 2), MX, cardBottom + 2);
  }
}

function pagePortfolioReferences(pdf: jsPDF, refs: PortfolioReference[], h: H, nc: NichePdfConfig) {
  drawBg(pdf, h, nc);
  let y = pageHeader(pdf, nc.categoryBadge, "Provas Reais", "Projetos Semelhantes", C.orange);
  const cols = 2; const colGap = 10;
  const colW = (CW - colGap) / cols; const cardH = 48;
  refs.slice(0, 4).forEach((ref, i) => {
    const col = i % cols; const row = Math.floor(i / cols);
    const cx = MX + col * (colW + colGap); const cy = y + row * (cardH + 8);
    cardWithBorder(pdf, cx, cy, colW, cardH, nc.accent, h, true);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(...C.white);
    pdf.text(ref.title || "Projeto", cx + 8, cy + 12);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(7); pdf.setTextColor(...C.lightGray);
    const reasonLines = pdf.splitTextToSize(ref.reason || "Similaridade com o contexto do cliente", colW - 16);
    pdf.text(reasonLines.slice(0, 3), cx + 8, cy + 20);
    const tags = [ref.item.category, ref.item.niche, ref.item.solution_type].filter(Boolean).slice(0, 2) as string[];
    if (tags.length > 0) {
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(6.5); pdf.setTextColor(...nc.accent);
      pdf.text(tags.join(" • "), cx + 8, cy + cardH - 8);
    }
  });
}

function pageTiers(pdf: jsPDF, p: Proposta, h: H, nc: NichePdfConfig): boolean {
  if (!p.proposal_tiers || p.proposal_tiers.length === 0) return false;
  drawBg(pdf, h, nc);
  let y = pageHeader(pdf, nc.categoryBadge, "Planos & Módulos", "Comparação de Planos", C.green);
  const tiers = p.proposal_tiers;
  const headers = tiers.map((t) => t.name);
  const allItems = new Set<string>();
  tiers.forEach((t) => { (Array.isArray(t.included_items) ? t.included_items : []).forEach((item: string) => allItems.add(item)); });
  const rows = Array.from(allItems).map((item) => ({
    label: item,
    values: tiers.map((t) => (Array.isArray(t.included_items) ? t.included_items : []).includes(item)),
  }));
  if (rows.length > 0) {
    drawComparisonTable(pdf, MX, y, CW, headers, rows, h, {
      primary: nc.accent, secondary: C.green, white: C.white, midGray: C.midGray, bgCard: C.bgCard, lightGray: C.lightGray, bg: C.bg,
    });
  }
  return true;
}

function pageTimeline(pdf: jsPDF, p: Proposta, h: H, nc: NichePdfConfig) {
  drawBg(pdf, h, nc);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const ni = pj.niche_intelligence as Record<string, any> | undefined;
  const phases = ni?.timeline_phases as any[] | undefined;

  let y = pageHeader(pdf, nc.categoryBadge, "End-to-End", "Pipeline de Execução", C.pink);

  if (pj.cronograma) {
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(...C.lightGray);
    pdf.text(`Prazo: ${pj.cronograma}`, MX, y + 4); y += 10;
  }

  if (phases && phases.length > 0) {
    const cols = 3; const colGap = 8; const rowGap = 6;
    const colW = (CW - colGap * (cols - 1)) / cols; const cardH = 38;
    const phaseColors: RGB[] = [nc.accent, nc.accent2, C.green, C.pink, C.orange, C.yellow];
    phases.forEach((ph: any, i: number) => {
      const col = i % cols; const row = Math.floor(i / cols);
      const cx = MX + col * (colW + colGap); const cy = y + row * (cardH + rowGap);
      if (cy + cardH > PH - MY - 14) return;
      const pc = phaseColors[i % phaseColors.length];
      cardWithBorder(pdf, cx, cy, colW, cardH, pc, h);
      watermarkNumber(pdf, String(i + 1).padStart(2, "0"), cx, cy, colW, h);
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(10); pdf.setTextColor(...pc);
      pdf.text("◆", cx + 6, cy + 12);
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(...C.white);
      pdf.text(ph.title || `Fase ${i + 1}`, cx + 6, cy + 22);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(7); pdf.setTextColor(...C.lightGray);
      const dl = pdf.splitTextToSize(ph.desc || ph.subtitle || "", colW - 14);
      pdf.text(dl.slice(0, 2), cx + 6, cy + 28);
    });
  }

  // Bottom: effort + maintenance
  const bottomY = PH - MY - 36; const halfW = (CW - 8) / 2;
  cardWithBorder(pdf, MX, bottomY, halfW, 22, nc.accent, h);
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(...nc.accent);
  pdf.text("ESTIMATIVA DE ESFORÇO", MX + 6, bottomY + 8);
  textBlock(pdf, pj.estimativa_esforco || "A definir", MX + 6, bottomY + 14, halfW - 12, 7.5, bottomY + 20);
  const rx = MX + halfW + 8;
  cardWithBorder(pdf, rx, bottomY, halfW, 22, C.green, h);
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(...C.green);
  pdf.text("MANUTENÇÃO & SUPORTE", rx + 6, bottomY + 8);
  textBlock(pdf, pj.manutencao || "Sob consulta", rx + 6, bottomY + 14, halfW - 12, 7.5, bottomY + 20);
}

function pageRisks(pdf: jsPDF, p: Proposta, h: H, nc: NichePdfConfig) {
  drawBg(pdf, h, nc);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const ni = pj.niche_intelligence as Record<string, any> | undefined;
  const riscos = Array.isArray(pj.riscos) ? pj.riscos : [];
  const proximos = Array.isArray(pj.proximos_passos) ? pj.proximos_passos : [];
  const riskMatrix = ni?.risk_matrix as any[] | undefined;

  let y = pageHeader(pdf, nc.categoryBadge, "Qualidade & Segurança", "Riscos & Próximos Passos", C.orange);

  const halfW = (CW - 10) / 2; const rightX = MX + halfW + 10;
  const cardBottom = PH - MY - 14;

  pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(...C.red);
  pdf.text("◆ Matriz de Riscos", MX, y + 4);
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(...nc.accent);
  pdf.text("◆ Próximos Passos", rightX, y + 4);
  y += 12;

  const risks = riskMatrix && riskMatrix.length > 0 ? riskMatrix : riscos.map((r: string) => ({ title: r, impact: "", mitigation: "", severity: "medio" }));
  let ry = y;
  risks.forEach((risk: any, i: number) => {
    if (y > cardBottom - 10) return;
    const sevColor: RGB = risk.severity === "alto" ? C.red : risk.severity === "medio" ? C.orange : C.green;
    const rowH = 22;
    cardWithBorder(pdf, MX, y, halfW, rowH, sevColor, h);
    pdf.setFillColor(...sevColor); pdf.roundedRect(MX + 6, y + 5, 8, 8, 2, 2, "F");
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(7); pdf.setTextColor(...C.bg);
    pdf.text("!", MX + 10, y + 11, { align: "center" });
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(...C.white);
    pdf.text(risk.title || `Risco ${i + 1}`, MX + 20, y + 10);
    if (risk.impact || risk.mitigation) {
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(6.5); pdf.setTextColor(...C.lightGray);
      const detail = [risk.impact, risk.mitigation].filter(Boolean).join(" • ");
      const dl = pdf.splitTextToSize(detail, halfW - 26);
      pdf.text(dl[0] || "", MX + 20, y + 17);
    }
    y += rowH + 4;
  });

  proximos.forEach((step: string, i: number) => {
    if (ry > cardBottom - 10) return;
    const stepH = 18;
    cardWithBorder(pdf, rightX, ry, halfW, stepH, ACCENT_COLORS[i % ACCENT_COLORS.length], h);
    watermarkNumber(pdf, String(i + 1).padStart(2, "0"), rightX, ry - 4, halfW, h);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(...C.white);
    const sl = pdf.splitTextToSize(step, halfW - 16);
    pdf.text(sl[0] || "", rightX + 8, ry + 11);
    ry += stepH + 4;
  });
}

function pageClosing(pdf: jsPDF, p: Proposta, h: H, logos: PdfLogos, nc: NichePdfConfig, docCode?: string) {
  drawBg(pdf, h, nc);
  h.setOpacity(0.05);
  pdf.setFillColor(...nc.accent); pdf.circle(PW / 2, PH / 2, 120, "F");
  pdf.setFillColor(...nc.accent2); pdf.circle(PW / 2 + 60, PH / 2 - 30, 80, "F");
  h.restoreOpacity();

  const cx = PW / 2;
  if (!addPdfImage(pdf, logos.agencyLogo, "PNG", cx - 12, MY + 20, 24, 24, "closing")) {
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(12); pdf.setTextColor(...nc.accent);
    pdf.text("HOLYNEX LABS", cx, MY + 34, { align: "center" });
  }

  const cy = PH / 2;
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(28); pdf.setTextColor(...C.white);
  pdf.text("Pronto para transformar", cx, cy - 14, { align: "center" });
  pdf.text("sua ideia em realidade?", cx, cy + 4, { align: "center" });
  pdf.setFillColor(...nc.accent); pdf.rect(cx - 20, cy + 12, 40, 1.5, "F");
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.setTextColor(...C.lightGray);
  pdf.text("Entre em contato para iniciar o desenvolvimento.", cx, cy + 24, { align: "center" });
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(...nc.accent);
  pdf.text(`Validade: ${p.proposal_validity || "30 dias"}`, cx, cy + 36, { align: "center" });

  if (p.closing_strategy) {
    pdf.setFont("helvetica", "italic"); pdf.setFontSize(8); pdf.setTextColor(...C.midGray);
    const cs = pdf.splitTextToSize(p.closing_strategy, 180);
    pdf.text(cs.slice(0, 2), cx, cy + 46, { align: "center" });
  }
  if (docCode) {
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(6.5); pdf.setTextColor(...C.midGray);
    pdf.text(`Código: ${docCode}`, cx, cy + 58, { align: "center" });
  }
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(11); pdf.setTextColor(...nc.accent);
  pdf.text("HOLYNEX LABS", cx, PH - 24, { align: "center" });
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(...C.midGray);
  pdf.text(`holynex.com • ${nc.label}`, cx, PH - 18, { align: "center" });
}

// ══════════════════════════════════════════════════════════════
//  MAIN GENERATOR — Niche-aware, dynamic section ordering
// ══════════════════════════════════════════════════════════════

export async function generatePropostaPdf(
  proposta: Proposta,
  _templateId?: string,
  documentCode?: string,
): Promise<Blob> {
  const renderStart = Date.now();
  const nicheConfig = resolveNicheConfig(
    proposta.segmento,
    proposta.tipo_projeto,
    proposta.pdf_blueprint as any,
  );
  const templateId = `niche-${nicheConfig.label.toLowerCase().replace(/\s+/g, "-")}-v5`;

  await logProposalEvent("proposal_pdf_render_started", proposta.id, {
    render_status: "started",
    template_id: templateId,
    niche_detected: nicheConfig.label,
  });

  try {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const helpers = makeOpacityHelpers(pdf);
    const logos = await resolvePdfLogos(proposta.link_referencia || undefined);

    const hasTiers = proposta.proposal_tiers && proposta.proposal_tiers.length > 0;
    let portfolioRefs: PortfolioReference[] = [];
    try {
      const items = await listPortfolioItems(true);
      const features = [
        ...(proposta.proposta_json?.funcionalidades || []),
        ...(proposta.proposta_json?.funcionalidades_recomendadas || []),
        ...(proposta.proposta_json?.escopo || []),
      ];
      portfolioRefs = getPortfolioReferences(items, {
        niche: proposta.segmento,
        category: proposta.tipo_projeto,
        solutionType: proposta.tipo_projeto,
        features,
      }, { limit: 4, minScore: 3 });
    } catch { portfolioRefs = []; }

    const hasPortfolioRefs = portfolioRefs.length > 0;
    const sectionsOrder = resolveSectionsOrder(nicheConfig, hasTiers, hasPortfolioRefs);
    const totalPages = sectionsOrder.length;
    let pageNum = 0;

    // Section renderers map
    const renderers: Record<string, () => void> = {
      cover: () => pageCover(pdf, proposta, helpers, logos, nicheConfig),
      executive_summary: () => pageExecutiveSummary(pdf, proposta, helpers, nicheConfig),
      scope: () => pageScopeFeatures(pdf, proposta, helpers, nicheConfig),
      investment: () => pageInvestment(pdf, proposta, helpers, nicheConfig),
      benefits: () => pageStrategicBenefits(pdf, proposta, helpers, nicheConfig),
      portfolio_refs: () => pagePortfolioReferences(pdf, portfolioRefs, helpers, nicheConfig),
      tiers: () => { pageTiers(pdf, proposta, helpers, nicheConfig); },
      timeline: () => pageTimeline(pdf, proposta, helpers, nicheConfig),
      risks: () => pageRisks(pdf, proposta, helpers, nicheConfig),
      closing: () => pageClosing(pdf, proposta, helpers, logos, nicheConfig, documentCode),
    };

    for (const section of sectionsOrder) {
      const renderer = renderers[section];
      if (!renderer) continue;

      if (pageNum > 0) pdf.addPage();
      pageNum++;
      renderer();
      if (section !== "closing") drawFooter(pdf, pageNum, totalPages, documentCode);
    }

    const blob = pdf.output("blob");

    await logProposalEvent("proposal_pdf_generated", proposta.id, {
      render_status: "success",
      template_id: templateId,
      duration_ms: Date.now() - renderStart,
      pages: pageNum,
      niche_detected: nicheConfig.label,
    });

    return blob;
  } catch (err) {
    console.error("[PDF] Falha na geração", { propostaId: proposta.id, error: err });
    await logProposalEvent("proposal_pdf_render_failed", proposta.id, {
      render_status: "failed",
      template_id: templateId,
      duration_ms: Date.now() - renderStart,
      render_error: err instanceof Error ? err.message : "Erro desconhecido",
    });
    throw err;
  }
}
