/**
 * Multi-page LANDSCAPE PDF — Professional dark design.
 * A4 Landscape: 297mm x 210mm
 * Uses only ASCII-safe characters to avoid jsPDF font rendering issues.
 */
import { jsPDF } from "jspdf";
import agencyLogoUrl from "@/assets/logo-transparent.png";
import type { Proposta } from "@/lib/propostas";
import { logProposalEvent } from "@/lib/proposal-events";
import { loadPdfLogos, type PdfLogos } from "@/lib/pdf-logos";
import { listPortfolioItems } from "@/lib/portfolio-items";
import { getPortfolioReferences, type PortfolioReference } from "@/lib/portfolio-similarity";
import {
  resolveNicheConfig,
  resolveSectionsOrder,
  type NichePdfConfig,
} from "@/lib/pdf-niche-config";

// ── Dimensions ──
const PW = 297;
const PH = 210;
const MX = 18;
const MY = 16;
const CW = PW - MX * 2;

type RGB = [number, number, number];

// ── Base Palette ──
const C = {
  bg:        [12, 15, 25] as RGB,
  bgCard:    [18, 23, 38] as RGB,
  bgCard2:   [22, 28, 46] as RGB,
  primary:   [0, 170, 255] as RGB,
  purple:    [139, 92, 246] as RGB,
  green:     [34, 197, 94] as RGB,
  pink:      [236, 72, 153] as RGB,
  orange:    [251, 146, 60] as RGB,
  yellow:    [250, 204, 21] as RGB,
  white:     [255, 255, 255] as RGB,
  lightGray: [185, 195, 215] as RGB,
  midGray:   [110, 125, 150] as RGB,
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
/** Remove accents for safe rendering in jsPDF helvetica */
function safeText(text: string): string {
  return text
    .replace(/[àáâãä]/g, "a").replace(/[ÀÁÂÃÄ]/g, "A")
    .replace(/[èéêë]/g, "e").replace(/[ÈÉÊË]/g, "E")
    .replace(/[ìíîï]/g, "i").replace(/[ÌÍÎÏ]/g, "I")
    .replace(/[òóôõö]/g, "o").replace(/[ÒÓÔÕÖ]/g, "O")
    .replace(/[ùúûü]/g, "u").replace(/[ÙÚÛÜ]/g, "U")
    .replace(/[ç]/g, "c").replace(/[Ç]/g, "C")
    .replace(/[ñ]/g, "n").replace(/[Ñ]/g, "N")
    .replace(/[°]/g, "o")
    .replace(/[–—]/g, "-")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'");
}

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

function addPdfImage(pdf: jsPDF, imageData: string | null, format: "PNG" | "JPEG", x: number, y: number, width: number, height: number): boolean {
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
  // Subtle decorative circles
  h.setOpacity(0.03);
  pdf.setFillColor(...nc.decor[0]);
  pdf.circle(PW - 20, -30, 90, "F");
  pdf.setFillColor(...nc.decor[1]);
  pdf.circle(10, PH + 40, 70, "F");
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

function pageHeader(pdf: jsPDF, badge: string, subtitle: string, title: string, badgeColor: RGB): number {
  const by = MY;
  const badgeText = safeText(badge.toUpperCase());
  const badgeW = pdf.getTextWidth(badgeText) + 12;
  pdf.setFillColor(...badgeColor);
  pdf.roundedRect(MX, by, Math.max(badgeW, 32), 8, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(...C.bg);
  pdf.text(badgeText, MX + 5, by + 5.5);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...C.midGray);
  pdf.text(safeText(subtitle.toUpperCase()), MX + Math.max(badgeW, 32) + 6, by + 5.5);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(...C.white);
  pdf.text(safeText(title), MX, by + 22);

  pdf.setFillColor(...badgeColor);
  pdf.rect(MX, by + 26, 40, 1, "F");
  return by + 34;
}

function card(pdf: jsPDF, x: number, y: number, w: number, h_val: number, borderColor: RGB, hh: H) {
  pdf.setFillColor(...C.bgCard);
  hh.setOpacity(0.9);
  pdf.roundedRect(x, y, w, h_val, 3, 3, "F");
  hh.restoreOpacity();
  pdf.setDrawColor(...C.darkBorder);
  hh.setOpacity(0.5);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(x, y, w, h_val, 3, 3, "S");
  hh.restoreOpacity();
  // Top accent line
  pdf.setFillColor(...borderColor);
  pdf.rect(x + 3, y, w - 6, 1.2, "F");
}

function textBlock(pdf: jsPDF, text: string, x: number, y: number, maxW: number, fontSize = 8.5, maxY?: number): number {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(fontSize);
  pdf.setTextColor(...C.lightGray);
  const lines = pdf.splitTextToSize(safeText(text || "Nao informado"), maxW);
  const lineH = fontSize * 0.42;
  const limit = maxY || PH - 20;
  let cy = y;
  for (const line of lines) { if (cy > limit) break; pdf.text(line, x, cy); cy += lineH; }
  return cy + 2;
}

function bulletList(pdf: jsPDF, items: string[], x: number, y: number, maxW: number, maxY?: number, color?: RGB): number {
  let cy = y;
  const limit = maxY || PH - 20;
  const dotColor = color || C.primary;
  for (const item of items) {
    if (cy > limit) break;
    pdf.setFillColor(...dotColor);
    pdf.circle(x + 1.5, cy - 1, 1, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...C.lightGray);
    const lines = pdf.splitTextToSize(safeText(item), maxW - 7);
    for (const line of lines) { if (cy > limit) break; pdf.text(line, x + 5, cy); cy += 3.8; }
    cy += 1.5;
  }
  return cy;
}

function numberBadge(pdf: jsPDF, num: string, x: number, y: number, color: RGB, h: H) {
  pdf.setFillColor(...color);
  h.setOpacity(0.15);
  pdf.roundedRect(x, y, 14, 8, 2, 2, "F");
  h.restoreOpacity();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...color);
  pdf.text(num, x + 7, y + 5.5, { align: "center" });
}

// ══════════════════════════════════════════════════════════════
//  PAGE BUILDERS
// ══════════════════════════════════════════════════════════════

function pageCover(pdf: jsPDF, p: Proposta, h: H, logos: PdfLogos, nc: NichePdfConfig) {
  drawBg(pdf, h, nc);

  // Large decorative accent
  h.setOpacity(0.05);
  pdf.setFillColor(...nc.accent);
  pdf.circle(PW - 40, 50, 120, "F");
  h.restoreOpacity();

  // Logo - properly sized
  const logoSize = 28;
  const hasLogo = addPdfImage(pdf, logos.agencyLogo, "PNG", MX, MY, logoSize, logoSize);
  
  // Brand text next to logo
  const brandX = hasLogo ? MX + logoSize + 6 : MX;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...C.white);
  pdf.text("HOLYNEX LABS", brandX, MY + 12);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(...nc.accent);
  pdf.text(safeText(`${nc.categoryBadge}  |  PROPOSTA COMERCIAL`), brandX, MY + 18);

  // Client logo top-right
  addPdfImage(pdf, logos.clientLogo, "PNG", PW - MX - 18, MY, 14, 14);

  // Cover title
  const bp = p.pdf_blueprint as any;
  const coverTitle = safeText(bp?.cover_title || "Proposta Comercial");
  const coverSub = safeText(bp?.cover_subtitle || nc.coverSubtitle);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(32);
  pdf.setTextColor(...C.white);
  const titleLines = pdf.splitTextToSize(coverTitle, CW * 0.65);
  let ty = MY + 52;
  for (const tl of titleLines) { pdf.text(tl, MX, ty); ty += 14; }

  pdf.setFillColor(...nc.accent);
  pdf.rect(MX, ty + 2, 50, 1.2, "F");
  ty += 10;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  pdf.setTextColor(...nc.accent);
  pdf.text(coverSub, MX, ty);
  ty += 10;

  // Executive summary excerpt
  const desc = safeText((p.proposta_json as any)?.resumo_executivo || p.descricao_projeto || "");
  if (desc) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.lightGray);
    const dl = pdf.splitTextToSize(desc, CW * 0.55);
    pdf.text(dl.slice(0, 4), MX, ty + 2);
  }

  // Bottom info cards
  const cardGap = 6;
  const cardCount = 4;
  const cardW = (CW - cardGap * (cardCount - 1)) / cardCount;
  const cardH = 32;
  const cardY = PH - MY - cardH - 8;
  const metas = [
    { label: "CLIENTE", value: p.nome_cliente, color: nc.accent },
    { label: "EMPRESA", value: p.empresa_cliente || "-", color: nc.accent2 },
    { label: "INVESTIMENTO", value: fmt(p.valor_ideal), color: C.green },
    { label: "DATA", value: fmtDate(p.criado_em), color: C.orange },
  ];
  metas.forEach((m, i) => {
    const cx = MX + i * (cardW + cardGap);
    card(pdf, cx, cardY, cardW, cardH, m.color, h);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.5);
    pdf.setTextColor(...m.color);
    pdf.text(m.label, cx + 6, cardY + 10);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.lightGray);
    const vl = pdf.splitTextToSize(safeText(m.value), cardW - 14);
    pdf.text(vl.slice(0, 2), cx + 6, cardY + 18);
  });

  // Footer branding
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);
  pdf.setTextColor(...C.midGray);
  pdf.text(safeText(`HOLYNEX LABS  |  ${nc.label.toUpperCase()}  |  V1.0`), PW - MX, PH - 6, { align: "right" });
}

function pageExecutiveSummary(pdf: jsPDF, p: Proposta, h: H, nc: NichePdfConfig) {
  drawBg(pdf, h, nc);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;

  let y = pageHeader(pdf, nc.categoryBadge, "Analise do Projeto", "Resumo Executivo", nc.accent);

  const leftW = CW * 0.48;
  const rightX = MX + CW * 0.52;
  const rightW = CW * 0.48;
  const cardBottom = PH - MY - 14;
  const leftH = cardBottom - y;

  // Left card - main summary
  card(pdf, MX, y, leftW, leftH, nc.accent, h);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...C.white);
  pdf.text("Visao Geral", MX + 8, y + 14);

  let ly = y + 22;
  ly = textBlock(pdf, pj.resumo_executivo || p.descricao_projeto || "", MX + 8, ly, leftW - 16, 8.5, cardBottom - 40);

  // Scope tags
  const escopo = Array.isArray(pj.escopo) ? pj.escopo.slice(0, 6) : [];
  if (escopo.length > 0 && ly < cardBottom - 20) {
    ly += 6;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    pdf.text("ESCOPO DO PROJETO", MX + 8, ly);
    ly += 6;
    let tagX = MX + 8;
    escopo.forEach((tag: string) => {
      const tagText = safeText(tag);
      const tw = pdf.getTextWidth(tagText) + 8;
      if (tagX + tw > MX + leftW - 8) { tagX = MX + 8; ly += 8; }
      if (ly > cardBottom - 8) return;
      pdf.setDrawColor(...nc.accent);
      h.setOpacity(0.3);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(tagX, ly - 4, tw, 7, 2, 2, "S");
      h.restoreOpacity();
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.setTextColor(...nc.accent);
      pdf.text(tagText, tagX + 4, ly + 0.5);
      tagX += tw + 4;
    });
  }

  // Right: 2x2 grid
  const smallCardW = (rightW - 6) / 2;
  const smallCardH = (leftH - 8) / 2 - 2;
  const sections = [
    { title: "Diagnostico", text: pj.diagnostico || "Nao informado", color: nc.accent2 },
    { title: "Solucao Proposta", text: pj.solucao_proposta || "Nao informado", color: C.green },
    { title: "Analise Estrategica", text: pj.analise_estrategica || "Nao informado", color: C.pink },
    { title: "Complexidade", text: `${pj.complexidade || "media"}\n\n${pj.estimativa_esforco || ""}`, color: C.orange },
  ];
  sections.forEach((sec, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = rightX + col * (smallCardW + 6);
    const sy = y + row * (smallCardH + 6);
    card(pdf, sx, sy, smallCardW, smallCardH, sec.color, h);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.white);
    pdf.text(safeText(sec.title), sx + 6, sy + 12);
    textBlock(pdf, sec.text, sx + 6, sy + 19, smallCardW - 12, 7.5, sy + smallCardH - 6);
  });
}

function pageScopeFeatures(pdf: jsPDF, p: Proposta, h: H, nc: NichePdfConfig) {
  drawBg(pdf, h, nc);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const escopo = Array.isArray(pj.escopo) ? pj.escopo : [];
  const funcionalidades = Array.isArray(pj.funcionalidades) ? pj.funcionalidades : [];
  const recomendadas = Array.isArray(pj.funcionalidades_recomendadas) ? pj.funcionalidades_recomendadas : [];

  let y = pageHeader(pdf, nc.categoryBadge, "Nucleo do Sistema", "Escopo e Funcionalidades", nc.accent2);

  const colGap = 8;
  const colW = (CW - colGap * 2) / 3;
  const cardH = PH - MY - y - 14;

  const cols = [
    { num: "01", title: "Escopo", items: escopo, color: nc.accent },
    { num: "02", title: "Funcionalidades", items: funcionalidades, color: nc.accent2 },
    { num: "03", title: "Evolucoes Premium", items: recomendadas, color: C.green },
  ];

  cols.forEach((col, i) => {
    const cx = MX + i * (colW + colGap);
    card(pdf, cx, y, colW, cardH, col.color, h);

    // Number badge
    numberBadge(pdf, col.num, cx + 6, y + 8, col.color, h);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...C.white);
    pdf.text(safeText(col.title), cx + 24, y + 14);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...C.midGray);
    const descText = col.items.length > 0 ? `${col.items.length} itens identificados` : "A definir";
    pdf.text(descText, cx + 8, y + 26);

    bulletList(pdf, col.items, cx + 8, y + 34, colW - 16, y + cardH - 6, col.color);
  });
}

function pageInvestment(pdf: jsPDF, p: Proposta, h: H, nc: NichePdfConfig) {
  drawBg(pdf, h, nc);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;

  let y = pageHeader(pdf, nc.categoryBadge, "Valores e Retorno", "Plano de Investimento", C.green);

  const halfW = (CW - 10) / 2;
  const cardBottom = PH - MY - 14;

  // Investment cards - left column
  const investments = [
    { label: "Investimento Minimo", value: fmt(p.valor_minimo), desc: "Escopo essencial / MVP", color: C.orange, num: "01" },
    { label: "Investimento Ideal", value: fmt(p.valor_ideal), desc: "Escopo completo recomendado", color: C.green, num: "02" },
    { label: "Investimento Premium", value: fmt(p.valor_premium), desc: "Escopo expandido + extras", color: nc.accent2, num: "03" },
  ];
  const invCardH = 36;
  const invGap = 8;
  investments.forEach((inv, i) => {
    const iy = y + i * (invCardH + invGap);
    card(pdf, MX, iy, halfW, invCardH, inv.color, h);
    numberBadge(pdf, inv.num, MX + 6, iy + 6, inv.color, h);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.white);
    pdf.text(safeText(inv.label), MX + 24, iy + 12);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(...inv.color);
    pdf.text(inv.value, MX + 8, iy + 26);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    pdf.text(inv.desc, MX + 60, iy + 26);
  });

  // Visual comparison bar
  const barY = y + 3 * (invCardH + invGap) + 4;
  if (barY + 30 < cardBottom) {
    card(pdf, MX, barY, halfW, cardBottom - barY, C.primary, h);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.white);
    pdf.text("Comparativo de Investimento", MX + 8, barY + 12);
    
    const maxVal = Math.max(p.valor_minimo, p.valor_ideal, p.valor_premium, 1);
    const bars = [
      { label: "Minimo", value: p.valor_minimo, color: C.orange },
      { label: "Ideal", value: p.valor_ideal, color: C.green },
      { label: "Premium", value: p.valor_premium, color: nc.accent2 },
    ];
    const barAreaW = halfW - 20;
    bars.forEach((b, i) => {
      const by = barY + 20 + i * 12;
      if (by > cardBottom - 8) return;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.setTextColor(...C.midGray);
      pdf.text(b.label, MX + 8, by + 3);
      // Bar bg
      pdf.setFillColor(...C.bgCard2);
      pdf.roundedRect(MX + 30, by, barAreaW - 30, 5, 1.5, 1.5, "F");
      // Bar fill
      const fillW = Math.max(((b.value / maxVal) * (barAreaW - 30)), 2);
      pdf.setFillColor(...b.color);
      pdf.roundedRect(MX + 30, by, fillW, 5, 1.5, 1.5, "F");
      // Value
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6);
      pdf.setTextColor(...C.white);
      pdf.text(fmt(b.value), MX + 32 + fillW, by + 4);
    });
  }

  // Right column: KPIs or justification
  const rightX = MX + halfW + 10;
  const ni = pj.niche_intelligence as Record<string, any> | undefined;
  const kpis = ni?.kpis as any[] | undefined;

  if (kpis && kpis.length > 0) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.midGray);
    pdf.text("KPIs PROJETADOS", rightX, y + 5);

    const kpiCardW = (halfW - 6) / 2;
    const kpiCardH = 26;
    const kpiGap = 6;
    kpis.slice(0, 6).forEach((kpi: any, i: number) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const kx = rightX + col * (kpiCardW + 6);
      const ky = y + 12 + row * (kpiCardH + kpiGap);
      if (ky + kpiCardH > cardBottom) return;
      const kColor = ACCENT_COLORS[i % ACCENT_COLORS.length];
      card(pdf, kx, ky, kpiCardW, kpiCardH, kColor, h);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(...C.white);
      pdf.text(safeText(kpi.metric || ""), kx + kpiCardW / 2, ky + 12, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6);
      pdf.setTextColor(...C.midGray);
      const labelLines = pdf.splitTextToSize(safeText(kpi.label || ""), kpiCardW - 8);
      pdf.text(labelLines[0] || "", kx + kpiCardW / 2, ky + 20, { align: "center" });
    });
  } else {
    // Fallback: show financial summary
    card(pdf, rightX, y, halfW, cardBottom - y, nc.accent, h);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...C.white);
    pdf.text("Resumo Financeiro", rightX + 8, y + 14);
    
    let fy = y + 26;
    const financialItems = [
      { label: "Classificacao", value: safeText(pj.financeiro?.classificacao_margem || pj.complexidade || "Padrao") },
      { label: "Cronograma", value: safeText(pj.cronograma || "A definir") },
      { label: "Manutencao", value: safeText(pj.manutencao || "Sob consulta") },
      { label: "Tipo de Projeto", value: safeText(pj.tipo_projeto || p.tipo_projeto || "-") },
    ];
    financialItems.forEach((item) => {
      if (fy > cardBottom - 10) return;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(...C.midGray);
      pdf.text(item.label.toUpperCase(), rightX + 8, fy);
      fy += 5;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...C.lightGray);
      const lines = pdf.splitTextToSize(item.value, halfW - 16);
      lines.slice(0, 2).forEach((l: string) => { pdf.text(l, rightX + 8, fy); fy += 4; });
      fy += 6;
    });
  }

  if (ni?.investment_justification) {
    const justY = Math.max(y + 110, cardBottom - 40);
    if (justY + 24 < cardBottom) {
      card(pdf, rightX, justY, halfW, cardBottom - justY, C.yellow, h);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...C.yellow);
      pdf.text("JUSTIFICATIVA DE INVESTIMENTO", rightX + 6, justY + 10);
      textBlock(pdf, ni.investment_justification, rightX + 6, justY + 16, halfW - 12, 7, cardBottom - 4);
    }
  }
}

function pageStrategicBenefits(pdf: jsPDF, p: Proposta, h: H, nc: NichePdfConfig) {
  drawBg(pdf, h, nc);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const ni = pj.niche_intelligence as Record<string, any> | undefined;
  const benefits = ni?.strategic_benefits as any[] | undefined;
  const sc = p.structured_content as Record<string, any> | undefined;
  const diferenciais = sc?.diferenciais as string[] | undefined;

  let y = pageHeader(pdf, nc.categoryBadge, "Beneficios e ROI", "Beneficios Estrategicos", nc.accent2);
  const cardBottom = PH - MY - 14;

  if (benefits && benefits.length > 0) {
    const cols = 3;
    const colGap = 8;
    const colW = (CW - colGap * (cols - 1)) / cols;
    const cardH = 38;
    benefits.slice(0, 9).forEach((b: any, i: number) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = MX + col * (colW + colGap);
      const cy = y + row * (cardH + 6);
      if (cy + cardH > cardBottom) return;
      const bc = ACCENT_COLORS[i % ACCENT_COLORS.length];
      card(pdf, cx, cy, colW, cardH, bc, h);
      numberBadge(pdf, String(i + 1).padStart(2, "0"), cx + 6, cy + 6, bc, h);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...C.white);
      pdf.text(safeText(b.title || ""), cx + 24, cy + 12);
      textBlock(pdf, b.desc || "", cx + 8, cy + 20, colW - 16, 7, cy + cardH - 4);
    });
  } else if (diferenciais && diferenciais.length > 0) {
    // Fallback: use diferenciais from structured_content
    const cols = 2;
    const colGap = 10;
    const colW = (CW - colGap) / cols;
    const cardH = 28;
    diferenciais.slice(0, 8).forEach((d: string, i: number) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = MX + col * (colW + colGap);
      const cy = y + row * (cardH + 6);
      if (cy + cardH > cardBottom) return;
      const bc = ACCENT_COLORS[i % ACCENT_COLORS.length];
      card(pdf, cx, cy, colW, cardH, bc, h);
      numberBadge(pdf, String(i + 1).padStart(2, "0"), cx + 6, cy + 6, bc, h);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.lightGray);
      const dl = pdf.splitTextToSize(safeText(d), colW - 16);
      pdf.text(dl.slice(0, 3), cx + 8, cy + 20);
    });
  } else {
    // Fallback: show proposta comercial text
    const propostaText = pj.proposta_comercial || sc?.proposta_comercial || pj.solucao_proposta || "";
    if (propostaText) {
      card(pdf, MX, y, CW, cardBottom - y, nc.accent2, h);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...C.white);
      pdf.text("Proposta Comercial", MX + 8, y + 14);
      textBlock(pdf, propostaText, MX + 8, y + 24, CW - 16, 8.5, cardBottom - 6);
    } else {
      // Really minimal fallback
      card(pdf, MX, y, CW, 40, nc.accent2, h);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...C.lightGray);
      pdf.text("Beneficios estrategicos serao detalhados na fase de planejamento.", MX + 8, y + 22);
    }
  }

  if (ni?.expert_reference) {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(6);
    pdf.setTextColor(...C.midGray);
    const rl = pdf.splitTextToSize(safeText(`Fontes: ${ni.expert_reference}`), CW);
    pdf.text(rl.slice(0, 2), MX, cardBottom + 2);
  }
}

function pagePortfolioReferences(pdf: jsPDF, refs: PortfolioReference[], h: H, nc: NichePdfConfig) {
  drawBg(pdf, h, nc);
  let y = pageHeader(pdf, nc.categoryBadge, "Cases Reais", "Projetos Semelhantes", C.orange);
  const cols = 2;
  const colGap = 10;
  const colW = (CW - colGap) / cols;
  const cardH = 44;
  refs.slice(0, 4).forEach((ref, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = MX + col * (colW + colGap);
    const cy = y + row * (cardH + 8);
    card(pdf, cx, cy, colW, cardH, nc.accent, h);
    numberBadge(pdf, String(i + 1).padStart(2, "0"), cx + 6, cy + 6, nc.accent, h);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.white);
    pdf.text(safeText(ref.title || "Projeto"), cx + 24, cy + 12);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...C.lightGray);
    const reasonLines = pdf.splitTextToSize(safeText(ref.reason || "Similaridade com o contexto do cliente"), colW - 16);
    pdf.text(reasonLines.slice(0, 3), cx + 8, cy + 22);
    const tags = [ref.item.category, ref.item.niche, ref.item.solution_type].filter(Boolean).slice(0, 2) as string[];
    if (tags.length > 0) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.5);
      pdf.setTextColor(...nc.accent);
      pdf.text(safeText(tags.join("  |  ")), cx + 8, cy + cardH - 6);
    }
  });
}

function pageTiers(pdf: jsPDF, p: Proposta, h: H, nc: NichePdfConfig): boolean {
  if (!p.proposal_tiers || p.proposal_tiers.length === 0) return false;
  drawBg(pdf, h, nc);
  let y = pageHeader(pdf, nc.categoryBadge, "Planos e Modulos", "Comparacao de Planos", C.green);
  const tiers = p.proposal_tiers;
  const cardBottom = PH - MY - 14;

  // Tier cards side by side
  const tierGap = 8;
  const tierW = (CW - tierGap * (tiers.length - 1)) / tiers.length;
  const tierH = cardBottom - y;

  tiers.forEach((tier, i) => {
    const tx = MX + i * (tierW + tierGap);
    const isRecommended = tier.is_recommended || tier.type === p.recommended_tier;
    const tierColor = isRecommended ? C.green : ACCENT_COLORS[i % ACCENT_COLORS.length];
    card(pdf, tx, y, tierW, tierH, tierColor, h);

    if (isRecommended) {
      pdf.setFillColor(...C.green);
      h.setOpacity(0.15);
      pdf.roundedRect(tx + 4, y + 6, 40, 7, 2, 2, "F");
      h.restoreOpacity();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6);
      pdf.setTextColor(...C.green);
      pdf.text("RECOMENDADO", tx + 8, y + 11);
    }

    const nameY = isRecommended ? y + 22 : y + 14;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...C.white);
    pdf.text(safeText(tier.name), tx + 8, nameY);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(...tierColor);
    pdf.text(fmt(tier.price), tx + 8, nameY + 14);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    pdf.text(safeText(`${tier.estimated_days} dias  |  ${tier.installments || "a combinar"}`), tx + 8, nameY + 22);

    if (tier.description) {
      textBlock(pdf, tier.description, tx + 8, nameY + 30, tierW - 16, 7.5, nameY + 44);
    }

    // Included items
    const items = Array.isArray(tier.included_items) ? tier.included_items : [];
    if (items.length > 0) {
      const itemsY = nameY + 48;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(...C.midGray);
      pdf.text("INCLUSO:", tx + 8, itemsY);
      bulletList(pdf, items, tx + 8, itemsY + 6, tierW - 16, y + tierH - 6, tierColor);
    }
  });

  return true;
}

function pageTimeline(pdf: jsPDF, p: Proposta, h: H, nc: NichePdfConfig) {
  drawBg(pdf, h, nc);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const ni = pj.niche_intelligence as Record<string, any> | undefined;
  const phases = ni?.timeline_phases as any[] | undefined;
  const sc = p.structured_content as Record<string, any> | undefined;
  const roadmap = sc?.roadmap_macro as string[] | undefined;

  let y = pageHeader(pdf, nc.categoryBadge, "Planejamento", "Cronograma de Execucao", C.pink);

  if (pj.cronograma) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.lightGray);
    pdf.text(safeText(`Prazo estimado: ${pj.cronograma}`), MX, y + 4);
    y += 12;
  }

  const cardBottom = PH - MY - 40;

  if (phases && phases.length > 0) {
    const cols = Math.min(phases.length, 4);
    const colGap = 8;
    const colW = (CW - colGap * (cols - 1)) / cols;
    const cardH = 50;
    phases.slice(0, 8).forEach((ph: any, i: number) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = MX + col * (colW + colGap);
      const cy = y + row * (cardH + 8);
      if (cy + cardH > cardBottom) return;
      const pc = ACCENT_COLORS[i % ACCENT_COLORS.length];
      card(pdf, cx, cy, colW, cardH, pc, h);
      numberBadge(pdf, String(i + 1).padStart(2, "0"), cx + 6, cy + 6, pc, h);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...C.white);
      pdf.text(safeText(ph.title || `Fase ${i + 1}`), cx + 24, cy + 12);
      if (ph.subtitle) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(...pc);
        pdf.text(safeText(ph.subtitle), cx + 8, cy + 22);
      }
      textBlock(pdf, ph.desc || "", cx + 8, cy + (ph.subtitle ? 28 : 22), colW - 16, 7, cy + cardH - 4);
    });
  } else if (roadmap && roadmap.length > 0) {
    // Fallback: use roadmap_macro
    const colW = (CW - 8) / 2;
    const cardH = 24;
    roadmap.slice(0, 8).forEach((step: string, i: number) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = MX + col * (colW + 8);
      const cy = y + row * (cardH + 6);
      if (cy + cardH > cardBottom) return;
      const pc = ACCENT_COLORS[i % ACCENT_COLORS.length];
      card(pdf, cx, cy, colW, cardH, pc, h);
      numberBadge(pdf, String(i + 1).padStart(2, "0"), cx + 6, cy + 5, pc, h);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.lightGray);
      const dl = pdf.splitTextToSize(safeText(step), colW - 30);
      pdf.text(dl.slice(0, 2), cx + 24, cy + 12);
    });
  } else {
    // Minimal fallback
    card(pdf, MX, y, CW, 30, C.pink, h);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.lightGray);
    pdf.text("O cronograma detalhado sera definido apos validacao do escopo.", MX + 8, y + 16);
  }

  // Bottom: effort + maintenance
  const bottomY = PH - MY - 34;
  const halfW = (CW - 8) / 2;
  card(pdf, MX, bottomY, halfW, 20, nc.accent, h);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...nc.accent);
  pdf.text("ESTIMATIVA DE ESFORCO", MX + 6, bottomY + 8);
  textBlock(pdf, pj.estimativa_esforco || "A definir", MX + 6, bottomY + 13, halfW - 12, 7, bottomY + 18);

  const rx = MX + halfW + 8;
  card(pdf, rx, bottomY, halfW, 20, C.green, h);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...C.green);
  pdf.text("MANUTENCAO E SUPORTE", rx + 6, bottomY + 8);
  textBlock(pdf, pj.manutencao || "Sob consulta", rx + 6, bottomY + 13, halfW - 12, 7, bottomY + 18);
}

function pageRisks(pdf: jsPDF, p: Proposta, h: H, nc: NichePdfConfig) {
  drawBg(pdf, h, nc);
  const pj = (p.proposta_json ?? {}) as Record<string, any>;
  const ni = pj.niche_intelligence as Record<string, any> | undefined;
  const riscos = Array.isArray(pj.riscos) ? pj.riscos : [];
  const proximos = Array.isArray(pj.proximos_passos) ? pj.proximos_passos : [];
  const riskMatrix = ni?.risk_matrix as any[] | undefined;

  let y = pageHeader(pdf, nc.categoryBadge, "Mitigacao e Proximos Passos", "Riscos e Planejamento", C.orange);

  const halfW = (CW - 10) / 2;
  const rightX = MX + halfW + 10;
  const cardBottom = PH - MY - 14;

  // Left: Risks
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...C.red);
  pdf.text("Matriz de Riscos", MX, y + 4);
  
  // Right: Next steps
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...nc.accent);
  pdf.text("Proximos Passos", rightX, y + 4);
  y += 12;

  const risks = riskMatrix && riskMatrix.length > 0
    ? riskMatrix
    : riscos.map((r: string) => ({ title: r, impact: "", mitigation: "", severity: "medio" }));

  let ry = y;
  risks.forEach((risk: any, i: number) => {
    if (ry > cardBottom - 8) return;
    const sevColor: RGB = risk.severity === "alto" ? C.red : risk.severity === "medio" ? C.orange : C.green;
    const rowH = 20;
    card(pdf, MX, ry, halfW, rowH, sevColor, h);
    
    // Severity badge
    pdf.setFillColor(...sevColor);
    pdf.roundedRect(MX + 6, ry + 5, 6, 6, 1, 1, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    pdf.setTextColor(...C.bg);
    pdf.text("!", MX + 9, ry + 9.5, { align: "center" });

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...C.white);
    pdf.text(safeText(risk.title || `Risco ${i + 1}`), MX + 16, ry + 10);

    if (risk.impact || risk.mitigation) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.setTextColor(...C.lightGray);
      const detail = safeText([risk.impact, risk.mitigation].filter(Boolean).join(" - "));
      const dl = pdf.splitTextToSize(detail, halfW - 22);
      pdf.text(dl[0] || "", MX + 16, ry + 16);
    }
    ry += rowH + 4;
  });

  // Right column: Next steps
  let sy = y;
  proximos.forEach((step: string, i: number) => {
    if (sy > cardBottom - 8) return;
    const stepH = 16;
    card(pdf, rightX, sy, halfW, stepH, ACCENT_COLORS[i % ACCENT_COLORS.length], h);
    numberBadge(pdf, String(i + 1).padStart(2, "0"), rightX + 6, sy + 3, ACCENT_COLORS[i % ACCENT_COLORS.length], h);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...C.white);
    const sl = pdf.splitTextToSize(safeText(step), halfW - 28);
    pdf.text(sl[0] || "", rightX + 24, sy + 10);
    sy += stepH + 4;
  });

  // If no risks or next steps, show fallback
  if (risks.length === 0 && proximos.length === 0) {
    card(pdf, MX, y, CW, 30, C.orange, h);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.lightGray);
    pdf.text("Riscos e proximos passos serao detalhados apos validacao do escopo.", MX + 8, y + 16);
  }
}

function pageClosing(pdf: jsPDF, p: Proposta, h: H, logos: PdfLogos, nc: NichePdfConfig, docCode?: string) {
  drawBg(pdf, h, nc);

  // Large decorative bg
  h.setOpacity(0.04);
  pdf.setFillColor(...nc.accent);
  pdf.circle(PW / 2, PH / 2, 130, "F");
  h.restoreOpacity();

  const cx = PW / 2;

  // Logo centered - properly sized
  const logoSize = 36;
  if (!addPdfImage(pdf, logos.agencyLogo, "PNG", cx - logoSize / 2, MY + 16, logoSize, logoSize)) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...nc.accent);
    pdf.text("HOLYNEX LABS", cx, MY + 36, { align: "center" });
  }

  const cy = PH / 2;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(...C.white);
  pdf.text("Pronto para transformar", cx, cy - 10, { align: "center" });
  pdf.text("sua ideia em realidade?", cx, cy + 6, { align: "center" });

  pdf.setFillColor(...nc.accent);
  pdf.rect(cx - 25, cy + 14, 50, 1.2, "F");

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...C.lightGray);
  pdf.text("Entre em contato para iniciar o desenvolvimento.", cx, cy + 24, { align: "center" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...nc.accent);
  pdf.text(safeText(`Validade: ${p.proposal_validity || "30 dias"}`), cx, cy + 36, { align: "center" });

  if (p.closing_strategy) {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...C.midGray);
    const cs = pdf.splitTextToSize(safeText(p.closing_strategy), 180);
    pdf.text(cs.slice(0, 2), cx, cy + 46, { align: "center" });
  }

  if (docCode) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(...C.midGray);
    pdf.text(`Codigo: ${docCode}`, cx, cy + 56, { align: "center" });
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...nc.accent);
  pdf.text("HOLYNEX LABS", cx, PH - 22, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(...C.midGray);
  pdf.text(safeText(`holynex.com  |  ${nc.label}`), cx, PH - 16, { align: "center" });
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
  const nicheConfig = resolveNicheConfig(
    proposta.segmento,
    proposta.tipo_projeto,
    proposta.pdf_blueprint as any,
  );
  const templateId = `niche-${nicheConfig.label.toLowerCase().replace(/\s+/g, "-")}-v6`;

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
    console.error("[PDF] Falha na geracao", { propostaId: proposta.id, error: err });
    await logProposalEvent("proposal_pdf_render_failed", proposta.id, {
      render_status: "failed",
      template_id: templateId,
      duration_ms: Date.now() - renderStart,
      render_error: err instanceof Error ? err.message : "Erro desconhecido",
    });
    throw err;
  }
}
