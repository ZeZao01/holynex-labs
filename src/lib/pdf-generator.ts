import { jsPDF } from "jspdf";
import type { Proposta } from "@/lib/propostas";
import { type PdfTemplate, type RGB, getTemplateById } from "@/lib/pdf-templates";
import { TIER_DEFAULTS, SCOPE_MODULE_DEFAULTS, type ProposalTier, type ScopeStatus } from "@/lib/proposal-tiers";
import { normalizePropostaJSON, extractDocumentoPublico } from "@/lib/proposal-normalizer";
import { logProposalEvent } from "@/lib/proposal-events";
import logoUrl from "@/assets/logo.png";

// ── Image loader ──
function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      c.getContext("2d")!.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── Build color palette from template ──
function buildColors(t: PdfTemplate) {
  return {
    bg: t.colors.bg as RGB,
    bgCard: t.colors.bgCard as RGB,
    magenta: t.colors.primary as RGB,
    cyan: t.colors.secondary as RGB,
    purple: t.colors.accent as RGB,
    purpleDark: [Math.floor(t.colors.accent[0] * 0.5), Math.floor(t.colors.accent[1] * 0.5), Math.floor(t.colors.accent[2] * 0.5)] as RGB,
    green: t.colors.accent2 as RGB,
    white: t.colors.white as RGB,
    lightGray: t.colors.lightGray as RGB,
    midGray: t.colors.midGray as RGB,
    darkGray: t.colors.darkGray as RGB,
    yellow: t.colors.highlight as RGB,
  };
}

export async function generatePropostaPdf(proposta: Proposta, templateId?: string, documentCode?: string): Promise<Blob> {
  const template = getTemplateById(templateId || "cyber-magenta");
  const C = buildColors(template);
  let logoBase64: string;
  try {
    logoBase64 = await loadImageAsBase64(logoUrl);
  } catch {
    // Fallback: generate a simple placeholder if logo fails
    const c = document.createElement("canvas");
    c.width = 100; c.height = 100;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#a855f7";
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("HN", 50, 50);
    logoBase64 = c.toDataURL("image/png");
  }
  const pj = proposta.proposta_json as any;
  const tiers = proposta.proposal_tiers || [];
  const addons = (proposta.proposal_addons || []).filter(a => a.is_active && a.is_selected);
  const docCode = documentCode || "";
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297, H = 210;
  let pageNum = 0;

  // ── Shared helpers ──
  const fillBg = () => {
    pdf.setFillColor(...C.bg);
    pdf.rect(0, 0, W, H, "F");
  };

  const addGlow = (x: number, y: number, r: number, color: RGB, opacity = 0.12) => {
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity }));
    pdf.setFillColor(...color);
    pdf.circle(x, y, r, "F");
    pdf.restoreGraphicsState();
  };

  const addWatermark = () => {
    const s = 60;
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.04 }));
    pdf.addImage(logoBase64, "PNG", (W - s) / 2, (H - s) / 2, s, s);
    pdf.restoreGraphicsState();
  };

  const addCorners = () => {
    const m = 12, sz = 8;
    pdf.setDrawColor(...C.cyan);
    pdf.setLineWidth(0.5);
    // TL
    pdf.line(m, m, m + sz, m); pdf.line(m, m, m, m + sz);
    // TR
    pdf.line(W - m, m, W - m - sz, m); pdf.line(W - m, m, W - m, m + sz);
    // BL
    pdf.line(m, H - m, m + sz, H - m); pdf.line(m, H - m, m, H - m - sz);
    // BR
    pdf.line(W - m, H - m, W - m - sz, H - m); pdf.line(W - m, H - m, W - m, H - m - sz);
  };

  const addPageNumber = () => {
    pageNum++;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.darkGray);
    pdf.text(`${pageNum}`, W / 2, H - 6, { align: "center" });
  };

  const addFooterLogo = () => {
    pdf.addImage(logoBase64, "PNG", W - 22, H - 14, 8, 8);
    pdf.setFontSize(7);
    pdf.setTextColor(...C.darkGray);
    pdf.text("HolyNex Labs", W - 24, H - 8, { align: "right" });
  };

  const newPage = () => {
    pdf.addPage();
    fillBg();
    addWatermark();
    addCorners();
    addPageNumber();
    addFooterLogo();
    // Glows
    addGlow(W - 20, 20, 80, C.purpleDark, 0.10);
    addGlow(40, H - 20, 60, [0, 51, 51], 0.08);
  };

  const drawSectionBadge = (text: string, x: number, y: number) => {
    pdf.setFillColor(255, 0, 255);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.15 }));
    pdf.roundedRect(x, y, pdf.getTextWidth(text) + 12, 7, 3, 3, "F");
    pdf.restoreGraphicsState();
    pdf.setDrawColor(...C.magenta);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, y, pdf.getTextWidth(text) + 12, 7, 3, 3, "S");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.magenta);
    pdf.text(text.toUpperCase(), x + 6, y + 5);
  };

  const drawCard = (x: number, y: number, w: number, h: number, borderColor: RGB = C.magenta) => {
    // Card bg
    pdf.setFillColor(255, 255, 255);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.03 }));
    pdf.roundedRect(x, y, w, h, 4, 4, "F");
    pdf.restoreGraphicsState();
    // Border
    pdf.setDrawColor(...borderColor);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.3 }));
    pdf.setLineWidth(0.4);
    pdf.roundedRect(x, y, w, h, 4, 4, "S");
    pdf.restoreGraphicsState();
    // Left accent
    pdf.setFillColor(...borderColor);
    pdf.rect(x, y + 3, 1.2, h - 6, "F");
  };

  const drawTitle = (text: string, x: number, y: number, size = 18) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(size);
    pdf.setTextColor(...C.white);
    pdf.text(text, x, y);
  };

  const drawSubtitle = (text: string, x: number, y: number, color: RGB = C.cyan) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...color);
    pdf.text(text.toUpperCase(), x, y);
  };

  const drawParagraph = (text: string, x: number, y: number, maxW: number): number => {
    if (!text) return y;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...C.lightGray);
    const lines = pdf.splitTextToSize(text, maxW);
    for (const line of lines) {
      if (y > H - 18) { newPage(); y = 24; }
      pdf.text(line, x, y);
      y += 5;
    }
    return y;
  };

  const drawBulletList = (items: string[], x: number, y: number, maxW: number, dotColor: RGB = C.cyan): number => {
    if (!items?.length) return y;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...C.lightGray);
    for (const item of items) {
      const lines = pdf.splitTextToSize(item, maxW - 6);
      if (y + lines.length * 5 > H - 18) { newPage(); y = 24; }
      pdf.setFillColor(...dotColor);
      pdf.circle(x + 1.5, y - 1.2, 1, "F");
      for (let i = 0; i < lines.length; i++) {
        pdf.text(lines[i], x + 5, y);
        y += 5;
      }
      y += 1.5;
    }
    return y;
  };

  // ══════════════════════════════════════════════
  // SLIDE 1 — COVER PAGE
  // ══════════════════════════════════════════════
  fillBg();
  addCorners();

  // Glows
  addGlow(40, 40, 80, C.purpleDark, 0.15);
  addGlow(W - 50, H - 30, 60, [0, 51, 51], 0.10);

  // Tech lines
  pdf.setDrawColor(...C.cyan);
  pdf.saveGraphicsState();
  (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.15 }));
  pdf.setLineWidth(0.3);
  pdf.line(0, H * 0.15, W * 0.3, H * 0.15);
  pdf.line(W * 0.6, H * 0.85, W, H * 0.85);
  pdf.line(W * 0.85, 0, W * 0.85, H * 0.2);
  pdf.line(W * 0.15, H * 0.7, W * 0.15, H);
  pdf.restoreGraphicsState();

  // Logo with glow
  const logoSize = 35;
  addGlow(W / 2, 55, 30, C.magenta, 0.08);
  pdf.addImage(logoBase64, "PNG", (W - logoSize) / 2, 35, logoSize, logoSize);

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  pdf.setTextColor(...C.white);
  pdf.text("PROPOSTA COMERCIAL", W / 2, 90, { align: "center" });

  // Subtitle with accent line
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...C.cyan);
  pdf.text("INOVAÇÃO EM DESENVOLVIMENTO DE SOFTWARE", W / 2, 100, { align: "center" });
  // Magenta accent line under subtitle
  pdf.setDrawColor(...C.magenta);
  pdf.setLineWidth(0.8);
  pdf.line(W / 2 - 15, 104, W / 2 + 15, 104);

  // Client info box
  const boxW = 140, boxH = 28;
  const boxX = (W - boxW) / 2, boxY = 115;
  pdf.setFillColor(255, 255, 255);
  pdf.saveGraphicsState();
  (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.05 }));
  pdf.roundedRect(boxX, boxY, boxW, boxH, 4, 4, "F");
  pdf.restoreGraphicsState();
  pdf.setDrawColor(...C.magenta);
  pdf.saveGraphicsState();
  (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.3 }));
  pdf.setLineWidth(0.4);
  pdf.roundedRect(boxX, boxY, boxW, boxH, 4, 4, "S");
  pdf.restoreGraphicsState();
  // Cyan left accent on box
  pdf.setFillColor(...C.cyan);
  pdf.rect(boxX, boxY + 2, 1.2, boxH - 4, "F");

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...C.midGray);
  pdf.text("PREPARADO PARA:", W / 2, boxY + 10, { align: "center" });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(...C.white);
  const clientText = proposta.empresa_cliente
    ? `${proposta.nome_cliente} — ${proposta.empresa_cliente}`
    : proposta.nome_cliente;
  pdf.text(clientText, W / 2, boxY + 20, { align: "center" });

  // Date badge
  const dateStr = new Date(proposta.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const dateBoxW = pdf.getTextWidth(dateStr) * 1.3 + 10;
  const dateBoxX = (W - dateBoxW) / 2;
  pdf.setFillColor(0, 0, 0);
  pdf.saveGraphicsState();
  (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.3 }));
  pdf.roundedRect(dateBoxX, 155, dateBoxW, 8, 4, 4, "F");
  pdf.restoreGraphicsState();
  pdf.setDrawColor(255, 255, 255);
  pdf.saveGraphicsState();
  (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.2 }));
  pdf.setLineWidth(0.3);
  pdf.roundedRect(dateBoxX, 155, dateBoxW, 8, 4, 4, "S");
  pdf.restoreGraphicsState();
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.saveGraphicsState();
  (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.6 }));
  pdf.text(dateStr, W / 2, 160.5, { align: "center" });
  pdf.restoreGraphicsState();

  // Confidential + Document code
    pdf.setFontSize(7);
    pdf.setTextColor(...C.darkGray);
    pdf.text("Documento confidencial — destinado exclusivamente ao destinatário", W / 2, H - 14, { align: "center" });
    if (docCode) {
      pdf.text(`Código: ${docCode}`, W / 2, H - 8, { align: "center" });
    }

  pageNum = 0;

  // ══════════════════════════════════════════════
  // SLIDE 2 — RESUMO EXECUTIVO
  // ══════════════════════════════════════════════
  if (pj?.resumo_executivo) {
    newPage();
    const mx = 20, my = 20;

    drawSectionBadge("Visão Geral do Projeto", mx, my);
    drawTitle("Resumo Executivo", mx, my + 16, 22);

    // Quote-style box
    if (pj.resumo_executivo) {
      const qx = mx, qy = my + 22;
      pdf.setFillColor(...C.cyan);
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.05 }));
      pdf.roundedRect(qx, qy, W - mx * 2, 18, 2, 2, "F");
      pdf.restoreGraphicsState();
      pdf.setFillColor(...C.cyan);
      pdf.rect(qx, qy, 1.2, 18, "F");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...C.lightGray);
      const summaryLines = pdf.splitTextToSize(
        typeof pj.resumo_executivo === "string" ? pj.resumo_executivo.substring(0, 300) : "",
        W - mx * 2 - 8
      );
      let sy = qy + 6;
      for (const line of summaryLines.slice(0, 4)) {
        pdf.text(line, qx + 5, sy);
        sy += 4.5;
      }
    }

    // Content - split into two columns
    let leftY = my + 48;
    const colW = (W - mx * 2 - 10) / 2;

    // Left: Objectives from diagnostico
    if (pj.diagnostico) {
      drawSubtitle("Objetivos Estratégicos", mx, leftY, C.cyan);
      leftY += 8;
      leftY = drawParagraph(pj.diagnostico, mx, leftY, colW);
    }

    // Right: Pillar cards
    let rightY = my + 48;
    const rx = mx + colW + 10;

    if (pj.solucao_proposta) {
      drawCard(rx, rightY, colW, 40, C.magenta);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...C.white);
      pdf.text("Solução Proposta", rx + 5, rightY + 10);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.midGray);
      const solLines = pdf.splitTextToSize(pj.solucao_proposta.substring(0, 200), colW - 10);
      let slY = rightY + 16;
      for (const line of solLines.slice(0, 5)) {
        pdf.text(line, rx + 5, slY);
        slY += 4;
      }
      rightY += 46;
    }

    // Escopo mini cards
    if (pj.escopo?.length) {
      const half = Math.ceil(pj.escopo.length / 2);
      const escopoCards = [pj.escopo.slice(0, half), pj.escopo.slice(half)];
      escopoCards.forEach((group, gi) => {
        const cx = rx + gi * (colW / 2 + 2);
        const cw = colW / 2 - 2;
        drawCard(cx, rightY, cw, 50, gi === 0 ? C.cyan : C.magenta);
        let cy = rightY + 8;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(...C.white);
        pdf.text(gi === 0 ? "Módulos" : "Integrações", cx + 5, cy);
        cy += 6;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(...C.lightGray);
        for (const item of group.slice(0, 5)) {
          pdf.setFillColor(...(gi === 0 ? C.cyan : C.magenta));
          pdf.circle(cx + 4, cy - 0.8, 0.6, "F");
          pdf.text(item.substring(0, 40), cx + 7, cy);
          cy += 4;
        }
      });
    }
  }

  // ══════════════════════════════════════════════
  // SLIDE 3 — DIAGNÓSTICO E SOLUÇÃO (Flow cards)
  // ══════════════════════════════════════════════
  if (pj?.diagnostico || pj?.solucao_proposta) {
    newPage();
    const mx = 20, my = 18;

    drawSectionBadge("Análise de Cenário", mx, my);
    drawTitle("Diagnóstico e Solução", mx, my + 16, 22);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.midGray);
    const descLines = pdf.splitTextToSize(
      "Entendendo os desafios atuais e como nossa tecnologia transformará a operação.",
      200
    );
    let dy = my + 22;
    for (const l of descLines) { pdf.text(l, mx, dy); dy += 4.5; }

    // Logo top-right
    pdf.addImage(logoBase64, "PNG", W - 32, my, 12, 12);

    // 4 flow cards
    const flowCards = [
      { step: "1", title: "O Problema", text: pj.diagnostico?.substring(0, 150) || "Processos manuais e limitações tecnológicas.", color: C.magenta, tags: ["Manual", "Limitado"] },
      { step: "2", title: "A Causa", text: "Falta de um sistema centralizado e especializado para gestão eficiente.", color: C.purple, tags: ["Sem Sistema", "Descentralizado"] },
      { step: "3", title: "A Solução", text: pj.solucao_proposta?.substring(0, 150) || "Plataforma personalizada com tecnologia de ponta.", color: C.cyan, tags: ["Personalizado", "Integrado"] },
      { step: "4", title: "Resultados", text: pj.analise_estrategica?.substring(0, 150) || "Eficiência operacional, melhor experiência e crescimento.", color: C.green, tags: ["Eficiência", "Crescimento"] },
    ];

    const cardW = 60, cardH = 100, gap = 6;
    const startX = (W - (cardW * 4 + gap * 3)) / 2;
    const cardY = my + 40;

    // Connecting dashed line
    pdf.setDrawColor(...C.midGray);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.3 }));
    pdf.setLineWidth(0.5);
    // Dashed effect: draw multiple short segments
    for (let i = 0; i < 3; i++) {
      const x1 = startX + cardW + i * (cardW + gap);
      const x2 = x1 + gap;
      const y = cardY + cardH / 2;
      pdf.line(x1, y, x2, y);
    }
    pdf.restoreGraphicsState();

    flowCards.forEach((card, i) => {
      const cx = startX + i * (cardW + gap);
      const isHighlighted = i === 2; // Solution card

      // Card background
      { const fc: RGB = isHighlighted ? [0, 255, 255] : [255, 255, 255]; pdf.setFillColor(...fc); }
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: isHighlighted ? 0.05 : 0.03 }));
      pdf.roundedRect(cx, cardY, cardW, cardH, 4, 4, "F");
      pdf.restoreGraphicsState();

      // Top border
      pdf.setFillColor(...card.color);
      pdf.rect(cx, cardY, cardW, 1.5, "F");

      // Card border
      pdf.setDrawColor(...card.color);
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: isHighlighted ? 0.5 : 0.2 }));
      pdf.setLineWidth(0.4);
      pdf.roundedRect(cx, cardY, cardW, cardH, 4, 4, "S");
      pdf.restoreGraphicsState();

      // Step badge
      pdf.setFillColor(...C.bg);
      pdf.setDrawColor(...card.color);
      pdf.setLineWidth(0.5);
      pdf.circle(cx + cardW / 2, cardY - 3, 5, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...card.color);
      pdf.text(card.step, cx + cardW / 2, cardY - 1, { align: "center" });

      // Title
      let ty = cardY + 14;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      { const tc = isHighlighted ? C.cyan : C.white; pdf.setTextColor(...tc); }
      pdf.text(card.title, cx + 5, ty);
      ty += 8;

      // Text
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.lightGray);
      const lines = pdf.splitTextToSize(card.text, cardW - 10);
      for (const l of lines.slice(0, 8)) {
        pdf.text(l, cx + 5, ty);
        ty += 4;
      }

      // Tags
      let tagX = cx + 5;
      const tagY = cardY + cardH - 10;
      pdf.setFontSize(7);
      for (const tag of card.tags) {
        pdf.setFillColor(...card.color);
        pdf.saveGraphicsState();
        (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.15 }));
        const tw = pdf.getTextWidth(tag) + 6;
        pdf.roundedRect(tagX, tagY, tw, 5, 2, 2, "F");
        pdf.restoreGraphicsState();
        pdf.setTextColor(...card.color);
        pdf.text(tag, tagX + 3, tagY + 3.5);
        tagX += tw + 3;
      }
    });

    // Cyan footer line
    pdf.setFillColor(...C.cyan);
    pdf.rect(0, H - 2, W, 2, "F");
  }

  // ══════════════════════════════════════════════
  // SLIDE 4 — ESCOPO DO PROJETO (Table)
  // ══════════════════════════════════════════════
  if (pj?.escopo?.length || pj?.funcionalidades?.length) {
    newPage();
    const mx = 20, my = 18;

    // Magenta header bar
    pdf.setFillColor(...C.magenta);
    pdf.rect(0, 0, W, 4, "F");

    pdf.addImage(logoBase64, "PNG", mx, my, 12, 12);
    drawSubtitle("Estrutura e Funcionalidades", mx, my + 18, C.cyan);
    drawTitle("Escopo do Projeto", mx, my + 26, 22);

    // Table headers
    let ty = my + 38;
    const cols = [mx, mx + 65, W - mx - 35];
    const colWidths = [65, W - mx * 2 - 100, 35];

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.cyan);
    pdf.text("MÓDULO", cols[0], ty);
    pdf.text("DETALHAMENTO", cols[1], ty);
    pdf.text("STATUS", cols[2], ty);
    ty += 3;
    pdf.setDrawColor(...C.cyan);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.3 }));
    pdf.setLineWidth(0.3);
    pdf.line(mx, ty, W - mx, ty);
    pdf.restoreGraphicsState();
    ty += 6;

    // Build rows from data
    const rows: Array<{module: string; items: string[]; status: string; color: RGB}> = [];

    if (pj.escopo?.length) {
      rows.push({ module: "Escopo MVP", items: pj.escopo.slice(0, 6), status: "Incluído", color: C.cyan });
    }
    if (pj.funcionalidades?.length) {
      rows.push({ module: "Funcionalidades", items: pj.funcionalidades.slice(0, 6), status: "Incluído", color: C.magenta });
    }
    if (pj.funcionalidades_recomendadas?.length) {
      rows.push({ module: "Expansão", items: pj.funcionalidades_recomendadas.slice(0, 4), status: "Opcional", color: C.purple });
    }

    for (const row of rows) {
      // Row background
      pdf.setFillColor(255, 255, 255);
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.04 }));
      pdf.roundedRect(mx, ty - 4, W - mx * 2, 22, 3, 3, "F");
      pdf.restoreGraphicsState();

      // Left accent
      pdf.setFillColor(...row.color);
      pdf.rect(mx, ty - 2, 1.2, 18, "F");

      // Module name
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...C.white);
      pdf.text(row.module, cols[0] + 4, ty + 5);

      // Items as tags
      let tagX = cols[1];
      let tagRow = ty + 2;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      for (const item of row.items) {
        const tw = Math.min(pdf.getTextWidth(item) + 8, 55);
        if (tagX + tw > cols[2] - 5) {
          tagX = cols[1];
          tagRow += 7;
        }
        pdf.setFillColor(255, 255, 255);
        pdf.saveGraphicsState();
        (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.08 }));
        pdf.roundedRect(tagX, tagRow - 3, tw, 6, 2, 2, "F");
        pdf.restoreGraphicsState();
        pdf.setTextColor(...C.lightGray);
        pdf.text(item.substring(0, 25), tagX + 4, tagRow + 1);
        tagX += tw + 3;
      }

      // Status badge
      const isOptional = row.status === "Opcional";
      const badgeColor = isOptional ? C.magenta : C.cyan;
      pdf.setFillColor(...badgeColor);
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.15 }));
      pdf.roundedRect(cols[2], ty, 30, 7, 3, 3, "F");
      pdf.restoreGraphicsState();
      pdf.setDrawColor(...badgeColor);
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.3 }));
      pdf.roundedRect(cols[2], ty, 30, 7, 3, 3, "S");
      pdf.restoreGraphicsState();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(...badgeColor);
      pdf.text(row.status.toUpperCase(), cols[2] + 15, ty + 5, { align: "center" });

      ty += 28;
    }

    // Bottom summary bar
    const barY = H - 30;
    pdf.setFillColor(...C.bgCard);
    pdf.setDrawColor(...C.cyan);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.3 }));
    pdf.roundedRect(mx, barY, W - mx * 2, 16, 3, 3, "S");
    pdf.restoreGraphicsState();
    pdf.setFillColor(...C.bgCard);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.8 }));
    pdf.roundedRect(mx, barY, W - mx * 2, 16, 3, 3, "F");
    pdf.restoreGraphicsState();

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.lightGray);
    pdf.text("Escopo inclui personalização completa conforme identidade visual do cliente.", mx + 10, barY + 10);

    if (pj.cronograma) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.magenta);
      pdf.text("Prazo:", W - mx - 60, barY + 7);
      pdf.setTextColor(...C.white);
      pdf.text(pj.cronograma.substring(0, 30), W - mx - 45, barY + 7);
    }
  }

  // ══════════════════════════════════════════════
  // SLIDE 5 — PLANOS DE INVESTIMENTO
  // ══════════════════════════════════════════════
  {
    newPage();
    const mx = 20, my = 18;

    // Header
    pdf.addImage(logoBase64, "PNG", mx, my, 12, 12);
    drawSubtitle("Análise Financeira", mx + 16, my + 4, C.cyan);
    drawTitle("Planos de Investimento", mx + 16, my + 12, 20);

    // Payment badge
    pdf.setFillColor(255, 255, 255);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.05 }));
    pdf.roundedRect(W - mx - 45, my, 45, 8, 4, 4, "F");
    pdf.restoreGraphicsState();
    pdf.setDrawColor(...C.cyan);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.3 }));
    pdf.roundedRect(W - mx - 45, my, 45, 8, 4, 4, "S");
    pdf.restoreGraphicsState();
    pdf.setFillColor(...C.cyan);
    pdf.circle(W - mx - 41, my + 4, 1, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.white);
    pdf.text("PAGAMENTO ÚNICO", W - mx - 37, my + 5.5);

    // Left: Comparativo chart (simulated with bars)
    const chartX = mx, chartY = my + 26;
    const chartW = 75, chartH = 100;
    drawCard(chartX, chartY, chartW, chartH, C.magenta);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...C.white);
    pdf.text("Comparativo", chartX + 8, chartY + 12);

    // Bar chart
    const vals = [proposta.valor_minimo || 0, proposta.valor_ideal || 0, proposta.valor_premium || 0];
    const maxVal = Math.max(...vals, 1);
    const barLabels = ["Mínimo", "Ideal", "Premium"];
    const barColors: RGB[] = [[255, 255, 255], C.magenta, C.cyan];
    const barX = chartX + 12, barMaxH = 45;

    vals.forEach((v, i) => {
      const bx = barX + i * 20;
      const bh = (v / maxVal) * barMaxH;
      const by = chartY + 65 - bh;

      pdf.setFillColor(...barColors[i]);
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: i === 1 ? 0.8 : 0.5 }));
      pdf.roundedRect(bx, by, 14, bh, 2, 2, "F");
      pdf.restoreGraphicsState();

      // Label
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(...C.lightGray);
      pdf.text(barLabels[i], bx + 7, chartY + 72, { align: "center" });
    });

    // Maintenance card
    const maintY = chartY + chartH + 6;
    drawCard(chartX, maintY, chartW, 25, C.cyan);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.cyan);
    pdf.text("MANUTENÇÃO MENSAL", chartX + 5, maintY + 8);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...C.white);
    pdf.text(pj?.manutencao ? "Sob consulta" : "Sob consulta", chartX + 5, maintY + 18);

    // Right: 3 Pricing cards
    const pricingStartX = mx + chartW + 10;
    const pricingW = (W - pricingStartX - mx - 10) / 3;

    const plans = [
      { name: "Mínimo", price: proposta.valor_minimo || 0, features: pj?.escopo?.slice(0, 4) || [], featured: false, btn: "Entrada" },
      { name: "Ideal", price: proposta.valor_ideal || 0, features: pj?.funcionalidades?.slice(0, 5) || [], featured: true, btn: "Melhor Custo-Benefício" },
      { name: "Premium", price: proposta.valor_premium || 0, features: [...(pj?.funcionalidades?.slice(0, 3) || []), ...(pj?.funcionalidades_recomendadas?.slice(0, 2) || [])], featured: false, btn: "Completo" },
    ];

    plans.forEach((plan, i) => {
      const px = pricingStartX + i * (pricingW + 5);
      const py = plan.featured ? my + 20 : my + 26;
      const ph = plan.featured ? H - my - 30 : H - my - 40;

      // Card
      const borderColor = plan.featured ? C.magenta : [255, 255, 255] as RGB;
      pdf.setFillColor(plan.featured ? 20 : 255, plan.featured ? 5 : 255, plan.featured ? 40 : 255);
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: plan.featured ? 0.6 : 0.03 }));
      pdf.roundedRect(px, py, pricingW, ph, 4, 4, "F");
      pdf.restoreGraphicsState();
      pdf.setDrawColor(...borderColor);
      pdf.setLineWidth(plan.featured ? 0.6 : 0.3);
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: plan.featured ? 0.8 : 0.2 }));
      pdf.roundedRect(px, py, pricingW, ph, 4, 4, "S");
      pdf.restoreGraphicsState();

      // Recommended badge
      if (plan.featured) {
        const badgeW = 30;
        pdf.setFillColor(...C.magenta);
        pdf.roundedRect(px + (pricingW - badgeW) / 2, py - 4, badgeW, 8, 4, 4, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(...C.white);
      pdf.text("RECOMENDADO", px + pricingW / 2, py, { align: "center" });
      }

      // Plan name
      let fy = py + 14;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      { const tc = plan.featured ? C.magenta : C.midGray; pdf.setTextColor(...tc); }
      pdf.text(plan.name.toUpperCase(), px + pricingW / 2, fy, { align: "center" });
      fy += 10;

      // Price
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.cyan);
      pdf.text("R$", px + pricingW / 2 - 14, fy);
      pdf.setFontSize(18);
      pdf.setTextColor(...C.white);
      pdf.text(plan.price.toLocaleString("pt-BR"), px + pricingW / 2 - 8, fy);
      fy += 8;

      // Separator
      pdf.setDrawColor(255, 255, 255);
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.1 }));
      pdf.line(px + 5, fy, px + pricingW - 5, fy);
      pdf.restoreGraphicsState();
      fy += 6;

      // Features
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      for (const feat of plan.features) {
        { const fc = plan.featured ? C.magenta : C.cyan; pdf.setFillColor(...fc); }
        pdf.circle(px + 7, fy - 0.8, 0.8, "F");
        pdf.setTextColor(...C.lightGray);
        pdf.text(feat.substring(0, 30), px + 11, fy);
        fy += 5;
      }

      // Button
      const btnY = py + ph - 14;
      { const fc = plan.featured ? C.magenta : [255, 255, 255] as RGB; pdf.setFillColor(...fc); }
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: plan.featured ? 0.2 : 0.05 }));
      pdf.roundedRect(px + 5, btnY, pricingW - 10, 8, 3, 3, "F");
      pdf.restoreGraphicsState();
      { const dc = plan.featured ? C.magenta : [255, 255, 255] as RGB; pdf.setDrawColor(...dc); }
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: plan.featured ? 0.8 : 0.2 }));
      pdf.roundedRect(px + 5, btnY, pricingW - 10, 8, 3, 3, "S");
      pdf.restoreGraphicsState();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      { const tc = plan.featured ? C.white : C.lightGray; pdf.setTextColor(...tc); }
      pdf.text(plan.btn.toUpperCase(), px + pricingW / 2, btnY + 5.5, { align: "center" });
    });
  }

  // ══════════════════════════════════════════════
  // SLIDE 5B — FAIXAS COMERCIAIS (TIERS)
  // ══════════════════════════════════════════════
  if (tiers.length > 0) {
    newPage();
    const mx = 20, my = 18;
    drawSectionBadge("Faixas Comerciais", mx, my);
    drawTitle("Planos Disponíveis", mx, my + 16, 22);
    const tierW = Math.min((W - mx * 2 - (tiers.length - 1) * 6) / tiers.length, 65);
    const tierStartX = (W - (tierW * tiers.length + (tiers.length - 1) * 6)) / 2;
    const tierY = my + 30;
    const tierH = H - tierY - 20;
    tiers.forEach((tier, i) => {
      const tx = tierStartX + i * (tierW + 6);
      const isRec = tier.is_recommended;
      pdf.setFillColor(255, 255, 255);
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: isRec ? 0.06 : 0.03 }));
      pdf.roundedRect(tx, tierY, tierW, tierH, 4, 4, "F");
      pdf.restoreGraphicsState();
      const borderCol: RGB = isRec ? C.magenta : C.midGray;
      pdf.setDrawColor(...borderCol);
      pdf.setLineWidth(isRec ? 0.8 : 0.3);
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: isRec ? 0.8 : 0.2 }));
      pdf.roundedRect(tx, tierY, tierW, tierH, 4, 4, "S");
      pdf.restoreGraphicsState();
      if (isRec) {
        const bw = 28;
        pdf.setFillColor(...C.magenta);
        pdf.roundedRect(tx + (tierW - bw) / 2, tierY - 4, bw, 8, 4, 4, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(...C.white);
      pdf.text("RECOMENDADO", tx + tierW / 2, tierY, { align: "center" });
      }
      let ty = tierY + 12;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      { const nc: RGB = isRec ? C.magenta : C.white; pdf.setTextColor(...nc); }
      pdf.text(tier.name.toUpperCase(), tx + tierW / 2, ty, { align: "center" });
      ty += 10;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(...C.cyan);
      pdf.text("R$", tx + tierW / 2 - 10, ty);
      pdf.setFontSize(16);
      pdf.setTextColor(...C.white);
      pdf.text(tier.price > 0 ? tier.price.toLocaleString("pt-BR") : "—", tx + tierW / 2 - 4, ty);
      ty += 6;
      if (tier.estimated_days > 0) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(...C.midGray);
        pdf.text(`${tier.estimated_days} dias`, tx + tierW / 2, ty, { align: "center" });
      }
      ty += 8;
      pdf.setDrawColor(255, 255, 255);
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.1 }));
      pdf.line(tx + 5, ty, tx + tierW - 5, ty);
      pdf.restoreGraphicsState();
      ty += 5;
    pdf.setFontSize(7);
    for (const mod of tier.scope_modules.slice(0, 12)) {
        if (ty > tierY + tierH - 8) break;
        const statusSymbol = mod.status === "included" ? "+" : mod.status === "optional" ? "~" : "-";
        const statusColor: RGB = mod.status === "included" ? C.green : mod.status === "optional" ? C.yellow : C.darkGray;
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...statusColor);
        pdf.text(statusSymbol, tx + 5, ty);
        pdf.setFont("helvetica", "normal");
        { const tc: RGB = mod.status === "not_included" ? C.darkGray : C.lightGray; pdf.setTextColor(...tc); }
        pdf.text(mod.label.substring(0, 18), tx + 10, ty);
        ty += 4.2;
      }
    });
  }

  // ══════════════════════════════════════════════
  // SLIDE 5C — ADD-ONS
  // ══════════════════════════════════════════════
  if (addons.length > 0) {
    newPage();
    const mx = 20, my = 18;
    drawSectionBadge("Serviços Adicionais", mx, my);
    drawTitle("Add-ons Selecionados", mx, my + 16, 22);
    let addonStartY = my + 32;
    const addonW = (W - mx * 2 - 10) / 2;
    addons.forEach((addon, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const ax = mx + col * (addonW + 10);
      const aRowY = addonStartY + row * 28;
      if (aRowY > H - 30) return;
      drawCard(ax, aRowY, addonW, 22, C.cyan);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...C.white);
      pdf.text(addon.name, ax + 5, aRowY + 8);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...C.lightGray);
      pdf.text(addon.description.substring(0, 50), ax + 5, aRowY + 14);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...C.cyan);
      pdf.text("R$ " + addon.price.toLocaleString("pt-BR"), ax + addonW - 5, aRowY + 8, { align: "right" });
      pdf.setFontSize(7);
      pdf.setTextColor(...C.midGray);
      pdf.text(addon.category, ax + addonW - 5, aRowY + 14, { align: "right" });
    });
    const totalAddons = addons.reduce((s, a) => s + a.price, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...C.white);
    pdf.text("Total Add-ons:", mx, H - 25);
    pdf.setTextColor(...C.cyan);
    pdf.text("R$ " + totalAddons.toLocaleString("pt-BR"), mx + 50, H - 25);
  }


  // ══════════════════════════════════════════════
  if (pj?.cronograma || pj?.estimativa_esforco) {
    newPage();
    const mx = 20, my = 18;

    // Header bar
    pdf.setFillColor(...C.bg);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.8 }));
    pdf.rect(0, 0, W, 32, "F");
    pdf.restoreGraphicsState();
    pdf.setDrawColor(...C.magenta);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.2 }));
    pdf.line(0, 32, W, 32);
    pdf.restoreGraphicsState();

    drawSectionBadge("Planejamento", mx, my);
    drawTitle("Cronograma e Detalhes", mx, my + 14, 20);
    pdf.addImage(logoBase64, "PNG", W - mx - 12, my, 10, 10);

    // Duration badge
    pdf.setFontSize(8);
    pdf.setTextColor(...C.cyan);
    pdf.text("Duração: " + (pj.cronograma?.substring(0, 25) || "A definir"), W - mx - 12, my + 16, { align: "right" });

    // Timeline section
    const tlY = my + 40;
    drawCard(mx, tlY, W - mx * 2, 70, C.cyan);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.cyan);
    pdf.text("LINHA DO TEMPO DE EXECUÇÃO", mx + 8, tlY + 8);

    // Timeline steps - split cronograma text
    const halfW = (W - mx * 2 - 20) / 2;

    // Step 1
    const s1x = mx + 8, s1y = tlY + 16;
    pdf.setFillColor(...C.bgCard);
    pdf.roundedRect(s1x, s1y, halfW, 45, 3, 3, "F");
    pdf.setFillColor(...C.magenta);
    pdf.rect(s1x, s1y, 1.2, 45, "F");
    // Badge
    pdf.setFillColor(...C.magenta);
    pdf.roundedRect(s1x + 5, s1y - 4, 25, 7, 3, 3, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.white);
    pdf.text("FASE 01", s1x + 17.5, s1y, { align: "center" });
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...C.white);
    pdf.text("Planejamento e Setup", s1x + 6, s1y + 12);
    // Content
    const phase1Items = ["Kickoff e alinhamento de escopo", "Configuração de ambiente", "Design da interface (UI/UX)", "Estruturação do banco de dados"];
    let p1y = s1y + 18;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    for (const item of phase1Items) {
      pdf.setFillColor(...C.magenta);
      pdf.circle(s1x + 7, p1y - 0.5, 0.6, "F");
      pdf.setTextColor(...C.lightGray);
      pdf.text(item, s1x + 10, p1y);
      p1y += 5;
    }

    // Step 2
    const s2x = mx + halfW + 14;
    pdf.setFillColor(...C.bgCard);
    pdf.roundedRect(s2x, s1y, halfW, 45, 3, 3, "F");
    pdf.setFillColor(...C.cyan);
    pdf.rect(s2x, s1y, 1.2, 45, "F");
    pdf.setFillColor(...C.cyan);
    pdf.roundedRect(s2x + 5, s1y - 4, 25, 7, 3, 3, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.bg);
    pdf.text("FASE 02", s2x + 17.5, s1y, { align: "center" });
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...C.white);
    pdf.text("Desenvolvimento e Entrega", s2x + 6, s1y + 12);
    const phase2Items = ["Desenvolvimento das funcionalidades", "Implementação da área administrativa", "Integrações e automações", "Testes (QA), ajustes e Go-live"];
    let p2y = s1y + 18;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    for (const item of phase2Items) {
      pdf.setFillColor(...C.cyan);
      pdf.circle(s2x + 7, p2y - 0.5, 0.6, "F");
      pdf.setTextColor(...C.lightGray);
      pdf.text(item, s2x + 10, p2y);
      p2y += 5;
    }

    // Timeline connecting line
    pdf.setDrawColor(...C.midGray);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.3 }));
    pdf.setLineWidth(0.5);
    pdf.line(s1x + halfW, s1y + 22, s2x, s1y + 22);
    pdf.restoreGraphicsState();

    // Bottom metrics
    const metY = tlY + 78;
    const metW = (W - mx * 2 - 10) / 2;

    // Effort metric
    drawCard(mx, metY, metW, 22, C.magenta);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...C.white);
    pdf.text(pj.estimativa_esforco?.substring(0, 20) || "A definir", mx + 20, metY + 14);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    pdf.text("ESFORÇO DE DESENVOLVIMENTO", mx + 20, metY + 19);

    // Maintenance metric
    drawCard(mx + metW + 10, metY, metW, 22, C.cyan);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...C.white);
    pdf.text(pj.manutencao?.substring(0, 20) || "Sob consulta", mx + metW + 30, metY + 14);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    pdf.text("MANUTENÇÃO MENSAL", mx + metW + 30, metY + 19);
  }

  // ══════════════════════════════════════════════
  // SLIDE 7 — ANÁLISE ESTRATÉGICA
  // ══════════════════════════════════════════════
  if (pj?.analise_estrategica) {
    newPage();
    const mx = 20, my = 18;

    drawSectionBadge("Benefícios & Impacto", mx, my);
    drawTitle("Análise Estratégica", mx, my + 16, 22);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.midGray);
    pdf.text("Potencialize o crescimento com tecnologia sob medida.", mx, my + 24);

    // 3 benefit cards
    const benefits = [
      { title: "Eficiência Operacional", text: "Centralize o controle, elimine conflitos e otimize o tempo com automação inteligente.", color: C.magenta, badge: "Otimização de Processos" },
      { title: "Experiência do Cliente", text: "Ofereça autonomia e clareza. Jornada de uso moderna, digital e sem atritos.", color: C.cyan, badge: "Fidelização & Satisfação" },
      { title: "Maior Visibilidade", text: "Vitrine digital 24/7 com integração social. Maior alcance e presença no mercado.", color: C.purple, badge: "Presença Digital" },
    ];

    const bCardW = (W - mx * 2 - 20) / 3;
    const bCardH = 90;

    benefits.forEach((b, i) => {
      const bx = mx + i * (bCardW + 10);
      const by = my + 35 + (i === 1 ? -5 : 0); // Middle card elevated

      // Card
      pdf.setFillColor(i === 1 ? 0 : 255, i === 1 ? 255 : 255, i === 1 ? 255 : 255);
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: i === 1 ? 0.05 : 0.03 }));
      pdf.roundedRect(bx, by, bCardW, bCardH, 4, 4, "F");
      pdf.restoreGraphicsState();

      // Top border
      pdf.setFillColor(...b.color);
      pdf.rect(bx, by, bCardW, 1.5, "F");

      pdf.setDrawColor(...(i === 1 ? C.cyan : [255, 255, 255] as RGB));
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: i === 1 ? 0.3 : 0.1 }));
      pdf.roundedRect(bx, by, bCardW, bCardH, 4, 4, "S");
      pdf.restoreGraphicsState();

      // Background number
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(30);
      pdf.setTextColor(...b.color);
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.06 }));
      pdf.text(`0${i + 1}`, bx + bCardW - 10, by + 18, { align: "right" });
      pdf.restoreGraphicsState();

      // Icon circle
      pdf.setFillColor(...b.color);
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.1 }));
      pdf.circle(bx + bCardW / 2, by + 20, 10, "F");
      pdf.restoreGraphicsState();
      pdf.setDrawColor(...b.color);
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.3 }));
      pdf.circle(bx + bCardW / 2, by + 20, 10, "S");
      pdf.restoreGraphicsState();

      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...C.white);
      pdf.text(b.title, bx + bCardW / 2, by + 38, { align: "center" });

      // Text
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.lightGray);
      const lines = pdf.splitTextToSize(b.text, bCardW - 12);
      let ly = by + 44;
      for (const l of lines) {
        pdf.text(l, bx + 6, ly);
        ly += 4;
      }

      // Badge
      pdf.setFillColor(...b.color);
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.1 }));
      pdf.roundedRect(bx + 5, by + bCardH - 12, bCardW - 10, 7, 2, 2, "F");
      pdf.restoreGraphicsState();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(...b.color);
      pdf.text(b.badge.toUpperCase(), bx + bCardW / 2, by + bCardH - 7, { align: "center" });
    });

    // Stats bar
    const barY = my + bCardH + 45;
    pdf.setFillColor(255, 255, 255);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.05 }));
    pdf.roundedRect(mx, barY, W - mx * 2, 18, 3, 3, "F");
    pdf.restoreGraphicsState();
    pdf.setDrawColor(255, 255, 255);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.1 }));
    pdf.roundedRect(mx, barY, W - mx * 2, 18, 3, 3, "S");
    pdf.restoreGraphicsState();

    const stats = ["Padronização", "Comunicação", "Conversão"];
    const statDescs = ["Processos organizados", "Consistência nos canais", "Visitantes em clientes"];
    stats.forEach((s, i) => {
      const sx = mx + 15 + i * 85;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...C.white);
      pdf.text(s, sx, barY + 8);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...C.midGray);
      pdf.text(statDescs[i], sx, barY + 13);
      // Divider
      if (i < 2) {
        pdf.setDrawColor(255, 255, 255);
        pdf.saveGraphicsState();
        (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.1 }));
        pdf.line(sx + 70, barY + 3, sx + 70, barY + 15);
        pdf.restoreGraphicsState();
      }
    });
  }

  // ══════════════════════════════════════════════
  // SLIDE 8 — PRÓXIMOS PASSOS & CTA
  // ══════════════════════════════════════════════
  {
    newPage();
    const mx = 20, my = 18;

    // Left magenta accent bar
    pdf.setFillColor(...C.magenta);
    pdf.rect(0, 0, 2, H, "F");

    // Grid pattern
    pdf.setDrawColor(...C.magenta);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.03 }));
    for (let gx = 0; gx < W; gx += 15) {
      pdf.line(gx, 0, gx, H);
    }
    for (let gy = 0; gy < H; gy += 15) {
      pdf.line(0, gy, W, gy);
    }
    pdf.restoreGraphicsState();

    // Left column
    const leftW = (W - mx * 2) * 0.55;

    drawTitle("Próximos Passos", mx + 5, my + 10, 24);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.lightGray);
    const introLines = pdf.splitTextToSize(
      "Estamos prontos para começar. Confira o roteiro para darmos início ao projeto.",
      leftW - 10
    );
    let iy = my + 18;
    for (const l of introLines) { pdf.text(l, mx + 5, iy); iy += 4.5; }

    // Separator
    pdf.setDrawColor(...C.magenta);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.2 }));
    pdf.line(mx + 5, iy + 2, mx + leftW - 5, iy + 2);
    pdf.restoreGraphicsState();

    // Roadmap
    const steps = pj?.proximos_passos || [
      "Aprovação da Proposta",
      "Reunião de Kickoff",
      "Início do Desenvolvimento",
    ];
    const stepColors: RGB[] = [C.magenta, C.purple, C.cyan];
    const stepDescs = [
      "Formalização do acordo comercial e escolha do plano.",
      "Alinhamento de expectativas e coleta de materiais.",
      "Início imediato do sprint para entrega da primeira versão.",
    ];

    let ry = iy + 14;
    // Roadmap vertical line
    pdf.setDrawColor(...C.magenta);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.3 }));
    pdf.setLineWidth(0.5);
    pdf.line(mx + 18, ry - 2, mx + 18, ry + steps.length * 28);
    pdf.restoreGraphicsState();

    steps.forEach((step: string, i: number) => {
      const color = stepColors[i % stepColors.length];

      // Icon circle
      pdf.setFillColor(...color);
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.15 }));
      pdf.roundedRect(mx + 8, ry - 4, 20, 20, 4, 4, "F");
      pdf.restoreGraphicsState();
      pdf.setDrawColor(...color);
      pdf.saveGraphicsState();
      (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.4 }));
      pdf.roundedRect(mx + 8, ry - 4, 20, 20, 4, 4, "S");
      pdf.restoreGraphicsState();

      // Step number
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...color);
      pdf.text(`0${i + 1}`, mx + 18, ry + 7, { align: "center" });

      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...C.white);
      const stepTitle = typeof step === "string" ? step.substring(0, 40) : `Etapa ${i + 1}`;
      pdf.text(stepTitle, mx + 33, ry + 3);

      // Description
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.midGray);
      pdf.text(stepDescs[i] || "", mx + 33, ry + 10);

      ry += 28;
    });

    // Right column: CTA card
    const ctaX = mx + leftW + 10;
    const ctaW = W - ctaX - mx;
    const ctaY = my + 10;
    const ctaH = H - my * 2 - 15;

    // CTA card background
    pdf.setFillColor(255, 255, 255);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.03 }));
    pdf.roundedRect(ctaX, ctaY, ctaW, ctaH, 6, 6, "F");
    pdf.restoreGraphicsState();
    pdf.setDrawColor(...C.cyan);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.2 }));
    pdf.roundedRect(ctaX, ctaY, ctaW, ctaH, 6, 6, "S");
    pdf.restoreGraphicsState();

    // Glow in card
    addGlow(ctaX + ctaW - 10, ctaY + 10, 25, C.cyan, 0.06);

    // Rocket icon circle
    const iconCY = ctaY + 35;
    pdf.setFillColor(...C.cyan);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.1 }));
    pdf.circle(ctaX + ctaW / 2, iconCY, 12, "F");
    pdf.restoreGraphicsState();
    pdf.setDrawColor(...C.cyan);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.3 }));
    pdf.circle(ctaX + ctaW / 2, iconCY, 12, "S");
    pdf.restoreGraphicsState();

    // CTA Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...C.white);
    pdf.text("Vamos Começar?", ctaX + ctaW / 2, iconCY + 22, { align: "center" });

    // CTA text
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.lightGray);
    const ctaLines = pdf.splitTextToSize(
      "Aprove o projeto hoje e garanta a prioridade no nosso cronograma de desenvolvimento.",
      ctaW - 20
    );
    let ctaTextY = iconCY + 30;
    for (const l of ctaLines) {
      pdf.text(l, ctaX + ctaW / 2, ctaTextY, { align: "center" });
      ctaTextY += 4.5;
    }

    // Button
    const btnY = ctaTextY + 8;
    pdf.setDrawColor(...C.cyan);
    pdf.setLineWidth(0.6);
    pdf.roundedRect(ctaX + 15, btnY, ctaW - 30, 10, 3, 3, "S");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.cyan);
    pdf.text("APROVAR PROJETO ✓", ctaX + ctaW / 2, btnY + 7, { align: "center" });

    // Contact info
    const contactY = btnY + 25;
    pdf.setDrawColor(255, 255, 255);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.1 }));
    pdf.line(ctaX + 15, contactY, ctaX + ctaW - 15, contactY);
    pdf.restoreGraphicsState();

    // Logo
    pdf.addImage(logoBase64, "PNG", ctaX + (ctaW - 10) / 2, contactY + 5, 10, 10);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...C.white);
    pdf.text("HOLYNEX LABS", ctaX + ctaW / 2, contactY + 22, { align: "center" });

    // Website badge
    pdf.setFillColor(...C.magenta);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.1 }));
    const webW = 40;
    pdf.roundedRect(ctaX + (ctaW - webW) / 2, contactY + 26, webW, 7, 3, 3, "F");
    pdf.restoreGraphicsState();
    pdf.setDrawColor(...C.magenta);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.3 }));
    pdf.roundedRect(ctaX + (ctaW - webW) / 2, contactY + 26, webW, 7, 3, 3, "S");
    pdf.restoreGraphicsState();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.magenta);
    pdf.text("holynexlabs.com.br", ctaX + ctaW / 2, contactY + 31, { align: "center" });

    // Confidential footer
    pdf.setFontSize(7);
    pdf.setTextColor(...C.darkGray);
    pdf.text("Este documento é confidencial e destinado exclusivamente ao destinatário.", mx + 5, H - 8);
  }

  // ══════════════════════════════════════════════
  // EXTRA PAGES — Full text sections that didn't fit
  // ══════════════════════════════════════════════
  const extraSections: Array<{ title: string; type: "text" | "list"; data: any }> = [];

  if (pj?.riscos?.length) extraSections.push({ title: "Riscos e Premissas", type: "list", data: pj.riscos });
  if (pj?.proposta_comercial) extraSections.push({ title: "Proposta Comercial Completa", type: "text", data: pj.proposta_comercial });

  for (const section of extraSections) {
    newPage();
    const mx = 20;
    let y = 22;

    drawSectionBadge("Detalhamento", mx, y);
    y += 12;
    drawTitle(section.title, mx, y, 20);
    y += 10;

    if (section.type === "text") {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...C.lightGray);
      const lines = pdf.splitTextToSize(section.data, W - mx * 2);
      for (const line of lines) {
        if (y > H - 20) {
          newPage();
          y = 22;
        }
        pdf.text(line, mx, y);
        y += 4.5;
      }
    } else {
      y = drawBulletList(section.data, mx, y, W - mx * 2, C.cyan);
    }
  }

  return pdf.output("blob");
}
