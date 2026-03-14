import { jsPDF } from "jspdf";
import type { Proposta } from "@/lib/propostas";
import { type PdfTemplate, type RGB, getTemplateById } from "@/lib/pdf-templates";
import { normalizePropostaJSON, extractDocumentoPublico } from "@/lib/proposal-normalizer";
import { logProposalEvent } from "@/lib/proposal-events";
import { getNicheProfile } from "@/lib/pdf-niche-intelligence";
import { drawBarChart, drawComparisonTable, drawKpiCard, drawProgressBar, drawTimeline } from "@/lib/pdf-charts";
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

function buildColors(t: PdfTemplate) {
  return {
    bg: t.colors.bg as RGB,
    bgCard: t.colors.bgCard as RGB,
    primary: t.colors.primary as RGB,
    secondary: t.colors.secondary as RGB,
    accent: t.colors.accent as RGB,
    accent2: t.colors.accent2 as RGB,
    white: t.colors.white as RGB,
    lightGray: t.colors.lightGray as RGB,
    midGray: t.colors.midGray as RGB,
    darkGray: t.colors.darkGray as RGB,
    highlight: t.colors.highlight as RGB,
  };
}

export async function generatePropostaPdf(proposta: Proposta, templateId?: string, documentCode?: string): Promise<Blob> {
  const template = getTemplateById(templateId || "cyber-magenta");
  const C = buildColors(template);
  const niche = getNicheProfile(proposta);
  let logoBase64: string;
  try {
    logoBase64 = await loadImageAsBase64(logoUrl);
  } catch {
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

  const renderStart = Date.now();
  const normResult = normalizePropostaJSON(proposta.proposta_json);
  const pjPublic = extractDocumentoPublico(normResult.data);
  const pj = pjPublic as any;

  logProposalEvent("proposal_pdf_render_started", proposta.id, {
    schema_valid: normResult.schema_valid,
    output_size: normResult.output_size,
    warnings: normResult.warnings,
    template_id: templateId || "cyber-magenta",
  });

  const tiers = proposta.proposal_tiers || [];
  const docCode = documentCode || "";
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297, H = 210;
  const MX = 18;
  let pageNum = 0;

  // ── Reset draw state to prevent leaks ──
  const resetDrawState = () => {
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.setFillColor(...C.bg);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
  };

  // ── Shared helpers ──
  const fillBg = () => {
    pdf.setFillColor(...C.bg);
    pdf.rect(0, 0, W, H, "F");
  };

  const setOpacity = (opacity: number) => {
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity }));
  };

  const restoreOpacity = () => {
    pdf.restoreGraphicsState();
  };

  const helpers = { setOpacity, restoreOpacity };

  const addGlow = (x: number, y: number, r: number, color: RGB, opacity = 0.12) => {
    setOpacity(opacity);
    pdf.setFillColor(...color);
    pdf.circle(x, y, r, "F");
    restoreOpacity();
  };

  const addWatermark = () => {
    const s = 50;
    setOpacity(0.03);
    pdf.addImage(logoBase64, "PNG", (W - s) / 2, (H - s) / 2, s, s);
    restoreOpacity();
  };

  const drawCornerMarks = () => {
    const len = 15;
    const off = 10;
    pdf.setDrawColor(...C.accent);
    pdf.setLineWidth(0.5);
    setOpacity(0.4);
    // Top-left
    pdf.line(off, off, off + len, off);
    pdf.line(off, off, off, off + len);
    // Top-right
    pdf.line(W - off, off, W - off - len, off);
    pdf.line(W - off, off, W - off, off + len);
    // Bottom-left
    pdf.line(off, H - off, off + len, H - off);
    pdf.line(off, H - off, off, H - off - len);
    // Bottom-right
    pdf.line(W - off, H - off, W - off - len, H - off);
    pdf.line(W - off, H - off, W - off, H - off - len);
    restoreOpacity();
    resetDrawState();
  };

  const addPageDecor = () => {
    pdf.setFillColor(...C.primary);
    pdf.rect(0, 0, W * 0.6, 1.5, "F");
    pdf.setFillColor(...C.secondary);
    pdf.rect(W * 0.6, 0, W * 0.4, 1.5, "F");
    setOpacity(0.4);
    pdf.setFillColor(...C.accent);
    pdf.rect(0, H - 1.5, W, 1.5, "F");
    restoreOpacity();
    addGlow(W - 30, 30, 60, C.accent, 0.08);
    addGlow(30, H - 30, 50, C.secondary, 0.06);
    drawCornerMarks();
    resetDrawState();
  };

  const addPageNumber = () => {
    pageNum++;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.darkGray);
    pdf.text(`${pageNum}`, W / 2, H - 6, { align: "center" });
  };

  const addFooterBrand = () => {
    pdf.addImage(logoBase64, "PNG", W - MX - 6, H - 12, 6, 6);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    pdf.setTextColor(...C.darkGray);
    pdf.text("HolyNex Labs", W - MX - 8, H - 7, { align: "right" });
    resetDrawState();
  };

  const newPage = () => {
    pdf.addPage();
    fillBg();
    addWatermark();
    addPageDecor();
    addPageNumber();
    addFooterBrand();
    resetDrawState();
  };

  const drawSectionBadge = (label: string, x: number, y: number) => {
    pdf.setFillColor(...C.primary);
    setOpacity(0.15);
    const bw = pdf.getTextWidth(label.toUpperCase()) + 10;
    pdf.roundedRect(x, y - 5, bw + 4, 8, 3, 3, "F");
    restoreOpacity();
    pdf.setDrawColor(...C.accent);
    setOpacity(0.4);
    pdf.roundedRect(x, y - 5, bw + 4, 8, 3, 3, "S");
    restoreOpacity();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.primary);
    pdf.text(label.toUpperCase(), x + (bw + 4) / 2, y, { align: "center" });
    resetDrawState();
  };

  const drawSectionHeader = (subtitle: string, title: string, y: number) => {
    drawSectionBadge(subtitle, MX, y);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(...C.white);
    pdf.text(title, MX, y + 14);
    resetDrawState();
  };

  const drawCard = (x: number, y: number, w: number, h: number, borderColor: RGB = C.primary) => {
    pdf.setFillColor(...C.bgCard);
    setOpacity(0.7);
    pdf.roundedRect(x, y, w, h, 3, 3, "F");
    restoreOpacity();
    pdf.setDrawColor(...borderColor);
    setOpacity(0.35);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(x, y, w, h, 3, 3, "S");
    restoreOpacity();
    resetDrawState();
  };

  const drawBullet = (text: string, x: number, y: number, maxW: number, color: RGB = C.secondary): number => {
    pdf.setFillColor(...color);
    pdf.circle(x + 1.5, y - 1, 1.5, "F");
    const colonIdx = text.indexOf(":");
    if (colonIdx > 0 && colonIdx < 40) {
      const label = text.substring(0, colonIdx + 1);
      const desc = text.substring(colonIdx + 1).trim();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...C.white);
      pdf.text(label, x + 5, y);
      const labelW = pdf.getTextWidth(label) + 1;
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...C.lightGray);
      const descLines = pdf.splitTextToSize(desc, maxW - 5 - labelW);
      if (descLines.length <= 1) {
        pdf.text(desc, x + 5 + labelW, y);
        return y + 6;
      } else {
        pdf.text(descLines[0], x + 5 + labelW, y);
        let ny = y + 5;
        for (let i = 1; i < descLines.length; i++) {
          pdf.text(descLines[i], x + 5, ny);
          ny += 4.5;
        }
        return ny + 2;
      }
    } else {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...C.lightGray);
      const lines = pdf.splitTextToSize(text, maxW - 5);
      for (let i = 0; i < lines.length; i++) {
        pdf.text(lines[i], x + 5, y + i * 4.5);
      }
      return y + lines.length * 4.5 + 2;
    }
  };

  // ══════════════════════════════════════════════
  // SLIDE 1 — CAPA
  // ══════════════════════════════════════════════
  fillBg();
  drawCornerMarks();

  addGlow(W * 0.3, H * 0.3, 90, C.accent, 0.08);
  addGlow(W * 0.8, H * 0.7, 70, C.secondary, 0.06);

  // Logo centered with glow
  const logoSize = 40;
  addGlow(W / 2, 60, 35, C.primary, 0.1);
  setOpacity(0.8);
  pdf.setFillColor(...C.bgCard);
  pdf.roundedRect(W / 2 - logoSize / 2 - 5, 40, logoSize + 10, logoSize + 10, 4, 4, "F");
  restoreOpacity();
  pdf.addImage(logoBase64, "PNG", W / 2 - logoSize / 2, 45, logoSize, logoSize);

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(30);
  pdf.setTextColor(...C.white);
  pdf.text("PROPOSTA COMERCIAL", W / 2, 108, { align: "center" });

  // Subtitle
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...C.primary);
  pdf.text("INOVAÇÃO EM DESENVOLVIMENTO DE SOFTWARE", W / 2, 118, { align: "center" });

  // Accent line
  pdf.setFillColor(...C.primary);
  pdf.rect(W / 2 - 25, 122, 50, 1, "F");

  // Client box
  const clientBoxW = W * 0.45;
  drawCard(W / 2 - clientBoxW / 2, 134, clientBoxW, 25, C.accent);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(...C.midGray);
  pdf.text("PREPARADO PARA:", W / 2, 142, { align: "center" });
  const clientName = proposta.empresa_cliente
    ? `${proposta.nome_cliente} — ${proposta.empresa_cliente}`
    : proposta.nome_cliente;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(...C.white);
  pdf.text(clientName, W / 2, 152, { align: "center" });

  // Date badge
  const dateStr = new Date(proposta.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const dateW = pdf.getTextWidth(dateStr) + 16;
  setOpacity(0.5);
  pdf.setFillColor(...C.bgCard);
  pdf.roundedRect(W / 2 - dateW / 2, 167, dateW, 9, 4, 4, "F");
  restoreOpacity();
  pdf.setDrawColor(...C.midGray);
  setOpacity(0.3);
  pdf.roundedRect(W / 2 - dateW / 2, 167, dateW, 9, 4, 4, "S");
  restoreOpacity();
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...C.lightGray);
  pdf.text(dateStr, W / 2, 173, { align: "center" });

  // Footer
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);
  pdf.setTextColor(...C.darkGray);
  pdf.text("Documento confidencial — destinado exclusivamente ao destinatário", W / 2, H - 8, { align: "center" });

  resetDrawState();
  pageNum = 0;

  // ══════════════════════════════════════════════
  // SLIDE 2 — VISÃO GERAL DO PROJETO
  // ══════════════════════════════════════════════
  {
    newPage();
    drawSectionHeader("Visão Geral do Projeto", "Resumo Executivo", 16);

    // Resumo text box
    const resumo = pj?.resumo_executivo || proposta.descricao_projeto || "Sistema personalizado para gestão operacional.";
    drawCard(MX, 36, W - MX * 2, 18, C.primary);
    pdf.setFillColor(...C.primary);
    pdf.rect(MX, 36, 2, 18, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...C.lightGray);
    const resumoLines = pdf.splitTextToSize(resumo, W - MX * 2 - 16);
    let ry = 46;
    for (const l of resumoLines.slice(0, 2)) { pdf.text(l, MX + 10, ry); ry += 5; }

    // Objectives
    const problema = pj?.diagnostico || proposta.descricao_projeto || "";
    if (problema) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...C.primary);
      pdf.text("OBJETIVOS ESTRATÉGICOS", MX, 68);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...C.lightGray);
      const probLines = pdf.splitTextToSize(problema, (W - MX * 2) * 0.45);
      let py = 76;
      for (const l of probLines.slice(0, 3)) { pdf.text(l, MX, py); py += 5; }
    }

    // Solução card (right side)
    const solCardX = W * 0.48;
    const solCardW = W - solCardX - MX;
    drawCard(solCardX, 60, solCardW, 40, C.accent);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...C.white);
    pdf.text("Solução Proposta", solCardX + 10, 74);
    const solucao = pj?.solucao_proposta || "Sistema personalizado com funcionalidades sob medida.";
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.lightGray);
    const solLines = pdf.splitTextToSize(solucao, solCardW - 16);
    let sy = 82;
    for (const l of solLines.slice(0, 3)) { pdf.text(l, solCardX + 10, sy); sy += 4.5; }

    // Módulos & Integrações cards (bottom row)
    const escopo = pj?.escopo || [];
    const funcionalidades = pj?.funcionalidades || [];
    const integracoes = pj?.integracoes || (proposta as any).integracoes || [];

    const modCardY = 108;
    const modCardW = (W - solCardX - MX - 8) / 2;

    drawCard(solCardX, modCardY, modCardW, 55, C.accent);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...C.white);
    pdf.text("Módulos", solCardX + 10, modCardY + 14);
    let my = modCardY + 24;
    for (const item of escopo.slice(0, 5)) {
      pdf.setFillColor(...C.accent);
      pdf.circle(solCardX + 14, my - 1, 1.5, "F");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.lightGray);
      pdf.text(String(item).substring(0, 30), solCardX + 20, my);
      my += 7;
    }

    const intCardX = solCardX + modCardW + 8;
    drawCard(intCardX, modCardY, modCardW, 55, C.accent);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...C.white);
    pdf.text("Integrações", intCardX + 10, modCardY + 14);
    let iy = modCardY + 24;
    const intList = Array.isArray(integracoes) && integracoes.length > 0
      ? integracoes
      : funcionalidades.slice(0, 3);
    for (const item of intList.slice(0, 5)) {
      pdf.setFillColor(...C.secondary);
      pdf.circle(intCardX + 14, iy - 1, 1.5, "F");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.lightGray);
      pdf.text(String(item).substring(0, 30), intCardX + 20, iy);
      iy += 7;
    }

    resetDrawState();
  }

  // ══════════════════════════════════════════════
  // SLIDE 3 — ANÁLISE DE CENÁRIO
  // ══════════════════════════════════════════════
  {
    newPage();
    drawSectionHeader("Análise de Cenário", "Diagnóstico e Solução", 16);

    // Small logo top-right
    pdf.addImage(logoBase64, "PNG", W - MX - 12, 10, 12, 12);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.midGray);
    pdf.text("Entendendo os desafios atuais e como nossa tecnologia transformará a operação.", MX, 36);

    // 4 cards: Problema → Causa → Solução → Resultados
    const cardLabels = ["O Problema", "A Causa", "A Solução", "Resultados"];
    const cardColors: RGB[] = [C.accent, [255, 80, 50], C.primary, C.secondary];
    const topBorderColors: RGB[] = [C.accent, [255, 80, 50], C.primary, [160, 100, 255]];
    const bottomTags = [
      ["Manual", "Limitado"],
      ["Sem Sistema", "Descentralizado"],
      ["Personalizado", "Integrado"],
      ["Eficiência", "Crescimento"],
    ];

    const diagData = [
      pj?.diagnostico || "Necessidade de um sistema centralizado para gestão eficiente.",
      "Falta de um sistema centralizado e especializado para gestão eficiente.",
      pj?.solucao_proposta || "Desenvolvimento de sistema personalizado com funcionalidades sob medida.",
      "Melhoria na eficiência operacional e aumento da satisfação dos usuários.",
    ];

    const cGap = 8;
    const cW = (W - MX * 2 - cGap * 3) / 4;
    const cY = 48;
    const cH = 115;

    cardLabels.forEach((label, i) => {
      const cx = MX + i * (cW + cGap);

      // Top color bar
      pdf.setFillColor(...topBorderColors[i]);
      pdf.rect(cx, cY, cW, 2, "F");

      // Card
      drawCard(cx, cY + 2, cW, cH, cardColors[i]);

      // Numbered circle
      pdf.setDrawColor(...cardColors[i]);
      pdf.setLineWidth(0.8);
      pdf.circle(cx + cW / 2, cY - 4, 7, "S");
      pdf.setFillColor(...C.bg);
      pdf.circle(cx + cW / 2, cY - 4, 6, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...cardColors[i]);
      pdf.text(String(i + 1), cx + cW / 2, cY - 1, { align: "center" });

      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...C.white);
      pdf.text(label, cx + 8, cY + 18);

      // Description
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...C.lightGray);
      const descLines = pdf.splitTextToSize(diagData[i], cW - 16);
      let dy = cY + 28;
      for (const l of descLines.slice(0, 6)) { pdf.text(l, cx + 8, dy); dy += 4.5; }

      // Bottom tags
      const tagY = cY + cH - 8;
      bottomTags[i].forEach((tag, ti) => {
        const tagW = pdf.getTextWidth(tag) + 8;
        const tagX = cx + 8 + ti * (tagW + 4);
        pdf.setFillColor(...C.bgCard);
        setOpacity(0.6);
        pdf.roundedRect(tagX, tagY, tagW, 7, 2, 2, "F");
        restoreOpacity();
        pdf.setDrawColor(...cardColors[i]);
        setOpacity(0.3);
        pdf.roundedRect(tagX, tagY, tagW, 7, 2, 2, "S");
        restoreOpacity();
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6);
        pdf.setTextColor(...cardColors[i]);
        pdf.text(tag, tagX + tagW / 2, tagY + 5, { align: "center" });
      });
    });

    resetDrawState();
  }

  // ══════════════════════════════════════════════
  // SLIDE 4 — ESTRUTURA E FUNCIONALIDADES
  // ══════════════════════════════════════════════
  {
    newPage();

    // Small logo
    pdf.addImage(logoBase64, "PNG", MX, 10, 10, 10);

    drawSectionHeader("Estrutura e Funcionalidades", "Escopo do Projeto", 16);

    // Table header
    const tableX = MX;
    const tableW = W - MX * 2;
    let ty = 40;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.accent);
    pdf.text("MÓDULO", tableX + 4, ty);
    pdf.text("DETALHAMENTO", tableX + 100, ty);
    pdf.text("STATUS", tableX + tableW - 30, ty);

    pdf.setDrawColor(...C.accent);
    setOpacity(0.3);
    pdf.setLineWidth(0.5);
    pdf.line(tableX, ty + 3, tableX + tableW, ty + 3);
    restoreOpacity();
    resetDrawState();
    ty += 12;

    // Build scope groups
    const scopeGroups = [
      {
        name: "Escopo MVP",
        items: pj?.escopo || ["Landing Page", "Painel de usuários", "Painel administrativo"],
        status: "INCLUÍDO",
        color: C.accent,
      },
      {
        name: "Funcionalidades",
        items: pj?.funcionalidades || ["Agendamento", "Gestão de usuários", "Gestão de horários"],
        status: "INCLUÍDO",
        color: C.accent,
      },
    ];

    // Add expansion items if they exist
    const expansion = pj?.funcionalidades_recomendadas || [];
    if (expansion.length > 0) {
      scopeGroups.push({
        name: "Expansão",
        items: expansion,
        status: "OPCIONAL",
        color: [255, 80, 50] as RGB,
      });
    }

    for (const group of scopeGroups) {
      // Group card bg
      drawCard(tableX, ty - 4, tableW, 36, group.color);
      pdf.setFillColor(...group.color);
      pdf.rect(tableX, ty - 4, 2.5, 36, "F");

      // Group name
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...C.white);
      pdf.text(group.name, tableX + 10, ty + 10);

      // Items as tags
      let tagX = tableX + 100;
      for (const item of group.items.slice(0, 4)) {
        const itemText = String(item).substring(0, 25);
        const tw = pdf.getTextWidth(itemText) + 12;
        pdf.setFillColor(...C.bgCard);
        setOpacity(0.6);
        pdf.roundedRect(tagX, ty + 2, tw, 9, 3, 3, "F");
        restoreOpacity();
        pdf.setDrawColor(...C.midGray);
        setOpacity(0.2);
        pdf.roundedRect(tagX, ty + 2, tw, 9, 3, 3, "S");
        restoreOpacity();
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(...C.lightGray);
        pdf.text(itemText, tagX + 6, ty + 8.5);
        tagX += tw + 6;
      }

      // Status badge
      const statusW = 36;
      const statusX = tableX + tableW - statusW - 8;
      pdf.setFillColor(...C.bgCard);
      setOpacity(0.6);
      pdf.roundedRect(statusX, ty + 2, statusW, 9, 4, 4, "F");
      restoreOpacity();
      pdf.setDrawColor(...group.color);
      setOpacity(0.5);
      pdf.roundedRect(statusX, ty + 2, statusW, 9, 4, 4, "S");
      restoreOpacity();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.5);
      pdf.setTextColor(...group.color);
      pdf.text(group.status, statusX + statusW / 2, ty + 8.5, { align: "center" });

      ty += 44;
    }

    // Footer info
    const footerBoxY = H - 34;
    drawCard(tableX, footerBoxY, tableW, 18, C.accent);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...C.lightGray);
    pdf.text("Escopo inclui personalização completa conforme identidade visual do cliente.", tableX + 10, footerBoxY + 10);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.primary);
    const prazo = pj?.cronograma || "4 semanas";
    pdf.text(`Prazo:`, tableX + tableW - 60, footerBoxY + 10);
    pdf.setTextColor(...C.white);
    pdf.text(prazo, tableX + tableW - 44, footerBoxY + 10);

    resetDrawState();
  }

  // ══════════════════════════════════════════════
  // SLIDE 5 — ANÁLISE FINANCEIRA
  // ══════════════════════════════════════════════
  {
    newPage();

    pdf.addImage(logoBase64, "PNG", MX, 10, 10, 10);
    drawSectionHeader("Análise Financeira", "Planos de Investimento", 16);

    // Payment type badge (top right)
    const payBadgeW = 50;
    drawCard(W - MX - payBadgeW, 10, payBadgeW, 10, C.accent);
    pdf.setFillColor(...C.accent);
    pdf.circle(W - MX - payBadgeW + 6, 15, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.5);
    pdf.setTextColor(...C.accent);
    pdf.text("PAGAMENTO ÚNICO", W - MX - payBadgeW + 12, 16.5);

    // Bar chart card (left)
    const chartX = MX;
    const chartY = 36;
    const chartW = (W - MX * 2) * 0.3;
    const chartH = 88;

    drawCard(chartX, chartY, chartW + 8, chartH, C.accent);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.white);
    pdf.text("Comparativo", chartX + 10, chartY + 14);

    const barData = [
      { label: "Mínimo", value: proposta.valor_minimo || 0, color: C.midGray },
      { label: "Ideal", value: proposta.valor_ideal || 0, color: C.accent },
      { label: "Premium", value: proposta.valor_premium || 0, color: C.secondary },
    ];

    if (tiers.length >= 3) {
      barData[0] = { label: tiers[0].name, value: tiers[0].price, color: C.midGray };
      barData[1] = { label: tiers[1].name, value: tiers[1].price, color: C.accent };
      barData[2] = { label: tiers[2].name, value: tiers[2].price, color: C.secondary };
    }

    drawBarChart(pdf, chartX + 12, chartY + 22, chartW - 14, chartH - 30, barData, helpers, C);
    resetDrawState();

    // Tier cards (right side)
    const tierStartX = chartX + chartW + 16;
    const tierAvailW = W - tierStartX - MX;
    const tierGap = 6;
    const tierW = (tierAvailW - tierGap * 2) / 3;
    const tierH = chartH;
    const tierY = chartY;

    const plans = [
      {
        name: "MÍNIMO", price: proposta.valor_minimo || 0,
        features: pj?.escopo?.slice(0, 4) || ["Funcionalidades essenciais"],
        recommended: false, label: "ENTRADA",
      },
      {
        name: "IDEAL", price: proposta.valor_ideal || 0,
        features: pj?.funcionalidades?.slice(0, 5) || ["Funcionalidades completas"],
        recommended: true, label: "MELHOR CUSTO-BENEFÍCIO",
      },
      {
        name: "PREMIUM", price: proposta.valor_premium || 0,
        features: [...(pj?.funcionalidades || []), ...(pj?.funcionalidades_recomendadas || [])].slice(0, 5) || ["Tudo incluído"],
        recommended: false, label: "COMPLETO",
      },
    ];

    if (tiers.length >= 3) {
      tiers.forEach((tier: any, i: number) => {
        if (i < 3) {
          plans[i].name = tier.name.toUpperCase();
          plans[i].price = tier.price;
          plans[i].features = tier.scope_modules?.filter((m: any) => m.status === "included").map((m: any) => m.label).slice(0, 6) || [];
          plans[i].recommended = tier.is_recommended;
        }
      });
    }

    plans.forEach((plan, i) => {
      const px = tierStartX + i * (tierW + tierGap);
      const isRec = plan.recommended;
      const py = isRec ? tierY - 3 : tierY;
      const ph = isRec ? tierH + 6 : tierH;

      drawCard(px, py, tierW, ph, isRec ? C.primary : C.midGray);

      // Top accent bar
      if (isRec) {
        pdf.setFillColor(...C.primary);
        pdf.rect(px, py, tierW, 2, "F");
      }

      // Recommended badge
      if (isRec) {
        const bw = 32;
        pdf.setFillColor(...C.secondary);
        pdf.roundedRect(px + (tierW - bw) / 2, py - 4, bw, 8, 3, 3, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(5.5);
        pdf.setTextColor(...C.bg);
        pdf.text("RECOMENDADO", px + tierW / 2, py, { align: "center" });
      }

      let fy = py + 14;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      const tc: RGB = isRec ? C.primary : C.midGray;
      pdf.setTextColor(...tc);
      pdf.text(plan.name, px + tierW / 2, fy, { align: "center" });
      fy += 10;

      // Price
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6);
      pdf.setTextColor(...C.midGray);
      pdf.text("R$", px + 8, fy);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(...C.white);
      pdf.text(plan.price > 0 ? plan.price.toLocaleString("pt-BR") : "—", px + 18, fy + 1);
      fy += 8;

      // Divider
      pdf.setDrawColor(...C.midGray);
      setOpacity(0.15);
      pdf.setLineWidth(0.3);
      pdf.line(px + 5, fy, px + tierW - 5, fy);
      restoreOpacity();
      resetDrawState();
      fy += 6;

      // Features
      for (const feat of plan.features) {
        if (fy > py + ph - 18) break;
        pdf.setFillColor(...C.secondary);
        pdf.circle(px + 8, fy - 1, 1.5, "F");
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.5);
        pdf.setTextColor(...C.lightGray);
        pdf.text(String(feat).substring(0, 28), px + 13, fy);
        fy += 5.5;
      }

      // Bottom label
      const lblW = tierW - 10;
      const lblY = py + ph - 12;
      pdf.setFillColor(...C.bgCard);
      setOpacity(isRec ? 0.8 : 0.5);
      pdf.roundedRect(px + 5, lblY, lblW, 8, 3, 3, "F");
      restoreOpacity();
      pdf.setDrawColor(isRec ? C.primary[0] : C.midGray[0], isRec ? C.primary[1] : C.midGray[1], isRec ? C.primary[2] : C.midGray[2]);
      setOpacity(0.4);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(px + 5, lblY, lblW, 8, 3, 3, "S");
      restoreOpacity();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(5.5);
      pdf.setTextColor(isRec ? C.primary[0] : C.midGray[0], isRec ? C.primary[1] : C.midGray[1], isRec ? C.primary[2] : C.midGray[2]);
      pdf.text(plan.label, px + tierW / 2, lblY + 5.5, { align: "center" });
    });

    // Maintenance badge (bottom left)
    const maintY = chartY + chartH + 6;
    drawCard(chartX, maintY, chartW + 8, 20, C.accent);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.5);
    pdf.setTextColor(...C.accent);
    pdf.text("MANUTENÇÃO MENSAL", chartX + 10, maintY + 8);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...C.white);
    const maintPrice = pj?.manutencao || "Sob consulta";
    pdf.text(maintPrice, chartX + 10, maintY + 16);

    resetDrawState();
  }

  // ══════════════════════════════════════════════
  // SLIDE 6 — PLANEJAMENTO
  // ══════════════════════════════════════════════
  {
    newPage();
    drawSectionHeader("Planejamento", "Cronograma e Detalhes", 16);

    pdf.addImage(logoBase64, "PNG", W - MX - 12, 10, 12, 12);

    // Duration badge
    const durText = `Duração: ${pj?.cronograma || "4 semanas"}`;
    const durW = pdf.getTextWidth(durText) + 12;
    pdf.setFillColor(...C.secondary);
    pdf.roundedRect(W - MX - durW, 28, durW, 8, 3, 3, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.5);
    pdf.setTextColor(...C.bg);
    pdf.text(durText, W - MX - durW / 2, 33.5, { align: "center" });

    // Timeline phases card
    const tlCardY = 46;
    const tlCardH = 72;
    drawCard(MX, tlCardY, W - MX * 2, tlCardH, C.accent);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.accent);
    pdf.text("LINHA DO TEMPO DE EXECUÇÃO", MX + 10, tlCardY + 10);

    // Timeline phases (2 columns)
    const phases = niche.timelinePhases || [
      { title: "FASE 01", subtitle: "Planejamento e Setup", desc: "Kickoff e alinhamento de escopo\nConfiguração de ambiente\nDesign da interface (UI/UX)\nEstruturação do banco de dados" },
      { title: "FASE 02", subtitle: "Desenvolvimento e Entrega", desc: "Desenvolvimento das funcionalidades\nImplementação da área administrativa\nIntegrações e automações\nTestes (QA), ajustes e Go-live" },
    ];

    const phaseW = (W - MX * 2 - 20) / 2;
    phases.slice(0, 2).forEach((phase, i) => {
      const phX = MX + 10 + i * (phaseW + 10);
      const phY = tlCardY + 18;

      // Phase badge
      const phBadgeW = 28;
      pdf.setFillColor(i === 0 ? C.primary[0] : C.secondary[0], i === 0 ? C.primary[1] : C.secondary[1], i === 0 ? C.primary[2] : C.secondary[2]);
      pdf.roundedRect(phX, phY, phBadgeW, 7, 3, 3, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6);
      pdf.setTextColor(...C.bg);
      pdf.text(phase.title, phX + phBadgeW / 2, phY + 5, { align: "center" });

      // Vertical accent line
      pdf.setFillColor(i === 0 ? C.primary[0] : C.secondary[0], i === 0 ? C.primary[1] : C.secondary[1], i === 0 ? C.primary[2] : C.secondary[2]);
      pdf.rect(phX, phY + 10, 2, 42, "F");

      // Subtitle
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...C.white);
      pdf.text(phase.subtitle, phX + 8, phY + 18);

      // Description items
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...C.lightGray);
      const descItems = phase.desc.split("\n").filter((s: string) => s.trim());
      let diy = phY + 26;
      for (const item of descItems.slice(0, 4)) {
        pdf.setFillColor(i === 0 ? C.primary[0] : C.secondary[0], i === 0 ? C.primary[1] : C.secondary[1], i === 0 ? C.primary[2] : C.secondary[2]);
        pdf.circle(phX + 8, diy - 1, 1.5, "F");
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(...C.lightGray);
        pdf.text(item.trim(), phX + 14, diy);
        diy += 7;
      }
    });

    // Connecting line between phases
    pdf.setDrawColor(...C.midGray);
    setOpacity(0.3);
    pdf.setLineWidth(0.5);
    pdf.line(MX + 10 + phaseW, tlCardY + 40, MX + 10 + phaseW + 10, tlCardY + 40);
    restoreOpacity();
    resetDrawState();

    // Bottom cards: effort + maintenance
    const botCardY = tlCardY + tlCardH + 10;
    const botCardW = (W - MX * 2 - 10) / 2;
    const botCardH = H - botCardY - 18;

    drawCard(MX, botCardY, botCardW, botCardH, C.accent);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(...C.white);
    pdf.text("80 horas", MX + 10, botCardY + 16);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    pdf.text("ESFORÇO DE DESENVOLVIMENTO", MX + 10, botCardY + 22);

    drawCard(MX + botCardW + 10, botCardY, botCardW, botCardH, C.accent);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(...C.white);
    const maintDisplay = pj?.manutencao || "R$ 40,00 mensais";
    pdf.text(maintDisplay, MX + botCardW + 20, botCardY + 16);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    pdf.text("MANUTENÇÃO MENSAL", MX + botCardW + 20, botCardY + 22);

    resetDrawState();
  }

  // ══════════════════════════════════════════════
  // SLIDE 7 — BENEFÍCIOS & IMPACTO
  // ══════════════════════════════════════════════
  {
    newPage();
    drawSectionHeader("Benefícios & Impacto", "Análise Estratégica", 16);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.midGray);
    pdf.text("Potencialize o crescimento com tecnologia sob medida.", MX, 36);

    // 3 benefit cards
    const cardGap = 10;
    const cardW = (W - MX * 2 - cardGap * 2) / 3;
    const cardY = 46;
    const cardH = 68;
    const benefitColors: RGB[] = [C.accent, C.primary, [255, 80, 50]];
    const topColors: RGB[] = [C.accent, C.primary, [255, 80, 50]];
    const categoryLabels = [
      niche.kpis[0]?.label || "OTIMIZAÇÃO DE PROCESSOS",
      niche.kpis[1]?.label || "FIDELIZAÇÃO & SATISFAÇÃO",
      niche.kpis[2]?.label || "PRESENÇA DIGITAL",
    ];

    niche.strategicBenefits.forEach((benefit, i) => {
      const cx = MX + i * (cardW + cardGap);
      const bc = benefitColors[i % 3];

      // Top color bar
      pdf.setFillColor(...topColors[i % 3]);
      pdf.rect(cx, cardY, cardW, 2, "F");

      drawCard(cx, cardY + 2, cardW, cardH, bc);

      // Number
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(32);
      setOpacity(0.1);
      pdf.setTextColor(...bc);
      pdf.text(String(i + 1).padStart(2, "0"), cx + cardW - 10, cardY + 24, { align: "right" });
      restoreOpacity();

      // Circle decoration
      pdf.setDrawColor(...bc);
      setOpacity(0.3);
      pdf.setLineWidth(0.8);
      pdf.circle(cx + 30, cardY + 22, 10, "S");
      restoreOpacity();
      pdf.setFillColor(...bc);
      setOpacity(0.1);
      pdf.circle(cx + 30, cardY + 22, 10, "F");
      restoreOpacity();

      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...C.white);
      pdf.text(benefit.title.substring(0, 25), cx + 8, cardY + 40);

      // Description
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...C.lightGray);
      const descL = pdf.splitTextToSize(benefit.desc, cardW - 16);
      let dy = cardY + 48;
      for (const l of descL.slice(0, 3)) { pdf.text(l, cx + 8, dy); dy += 4.5; }

      // Category badge
      const catW = cardW - 16;
      const catY = cardY + cardH - 8;
      pdf.setFillColor(...bc);
      setOpacity(0.15);
      pdf.roundedRect(cx + 8, catY, catW, 8, 3, 3, "F");
      restoreOpacity();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6);
      pdf.setTextColor(...bc);
      pdf.text(categoryLabels[i].toUpperCase(), cx + cardW / 2, catY + 5.5, { align: "center" });

      resetDrawState();
    });

    // Bottom metrics row
    const metricY = cardY + cardH + 14;
    const metricW = (W - MX * 2 - 16) / 3;
    const metricLabels = [
      { title: "Padronização", desc: "Processos organizados" },
      { title: "Comunicação", desc: "Consistência nos canais" },
      { title: "Conversão", desc: "Visitantes em clientes" },
    ];

    drawCard(MX, metricY, W - MX * 2, 18, C.midGray);
    metricLabels.forEach((m, i) => {
      const mx = MX + 8 + i * (metricW + 8);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...C.white);
      pdf.text(m.title, mx, metricY + 8);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...C.midGray);
      pdf.text(m.desc, mx, metricY + 14);
    });

    resetDrawState();
  }

  // ══════════════════════════════════════════════
  // SLIDE 8 — PRÓXIMOS PASSOS & CTA
  // ══════════════════════════════════════════════
  {
    newPage();
    fillBg();
    drawCornerMarks();
    addGlow(W * 0.7, H * 0.2, 60, C.accent, 0.06);
    addGlow(W * 0.3, H * 0.8, 50, C.secondary, 0.06);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.setTextColor(...C.white);
    pdf.text("Próximos Passos", MX, 36);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.midGray);
    pdf.text("Estamos prontos para começar. Confira o roteiro para darmos início ao projeto.", MX, 46);

    // Steps (left side)
    const nextSteps = pj?.proximos_passos || [
      "Reunião para discutir os detalhes do projeto.",
      "Formalização do acordo comercial e escolha do plano.",
      "Início do desenvolvimento.",
      "Alinhamento de expectativas e coleta de materiais.",
    ];

    let nsy = 62;
    const stepsX = MX;
    const stepColors: RGB[] = [C.accent, [255, 80, 50], C.primary, C.secondary];

    for (let si = 0; si < Math.min(nextSteps.length, 4); si++) {
      const step = typeof nextSteps[si] === "string" ? nextSteps[si] : String(nextSteps[si]);
      const sc = stepColors[si % 4];

      // Step number circle
      pdf.setDrawColor(...sc);
      pdf.setLineWidth(0.8);
      pdf.roundedRect(stepsX, nsy - 4, 16, 16, 3, 3, "S");
      pdf.setFillColor(...sc);
      setOpacity(0.15);
      pdf.roundedRect(stepsX, nsy - 4, 16, 16, 3, 3, "F");
      restoreOpacity();

      // Vertical accent
      pdf.setFillColor(...sc);
      pdf.rect(stepsX + 2, nsy - 2, 2, 12, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...sc);
      pdf.text(String(si + 1).padStart(2, "0"), stepsX + 9, nsy + 6, { align: "center" });

      // Step text (with full text, not truncated)
      const stepParts = step.split(".");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...C.white);
      pdf.text(stepParts[0]?.substring(0, 45) || "", stepsX + 22, nsy + 1);

      if (stepParts[1]?.trim()) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(...C.midGray);
        pdf.text(stepParts[1].trim().substring(0, 50), stepsX + 22, nsy + 8);
      }

      nsy += 28;
    }

    // CTA section (right side)
    const ctaX = W * 0.52;
    const ctaY = 54;

    // CTA card
    drawCard(ctaX, ctaY, W - ctaX - MX, 100, C.accent);

    // Decorative circle
    addGlow(ctaX + (W - ctaX - MX) / 2, ctaY + 22, 18, C.accent, 0.12);
    pdf.setDrawColor(...C.accent);
    setOpacity(0.25);
    pdf.setLineWidth(0.8);
    pdf.circle(ctaX + (W - ctaX - MX) / 2, ctaY + 22, 14, "S");
    restoreOpacity();
    resetDrawState();

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor(...C.white);
    pdf.text("Vamos Começar?", ctaX + (W - ctaX - MX) / 2, ctaY + 48, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.midGray);
    const ctaDesc = pdf.splitTextToSize("Aprove o projeto hoje e garanta a prioridade no nosso cronograma de desenvolvimento.", (W - ctaX - MX) - 20);
    let cdy = ctaY + 56;
    for (const l of ctaDesc) {
      pdf.text(l, ctaX + (W - ctaX - MX) / 2, cdy, { align: "center" });
      cdy += 4.5;
    }

    // CTA button
    const btnW = (W - ctaX - MX) - 30;
    const btnY = ctaY + 72;
    pdf.setFillColor(...C.bgCard);
    setOpacity(0.5);
    pdf.roundedRect(ctaX + 15, btnY, btnW, 12, 4, 4, "F");
    restoreOpacity();
    pdf.setDrawColor(...C.accent);
    setOpacity(0.5);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(ctaX + 15, btnY, btnW, 12, 4, 4, "S");
    restoreOpacity();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.white);
    pdf.text("A P R O V A R   P R O J E T O", ctaX + 15 + btnW / 2, btnY + 8, { align: "center" });

    resetDrawState();

    // Footer section
    const footY = H - 44;
    pdf.setDrawColor(...C.midGray);
    setOpacity(0.15);
    pdf.setLineWidth(0.3);
    pdf.line(ctaX + 15, footY, ctaX + 15 + btnW, footY);
    restoreOpacity();
    resetDrawState();

    // Brand footer
    pdf.addImage(logoBase64, "PNG", ctaX + (W - ctaX - MX) / 2 - 6, footY + 6, 12, 12);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...C.white);
    pdf.text("HOLYNEX LABS", ctaX + (W - ctaX - MX) / 2, footY + 24, { align: "center" });

    const webW = 42;
    pdf.setFillColor(...C.primary);
    setOpacity(0.15);
    pdf.roundedRect(ctaX + (W - ctaX - MX) / 2 - webW / 2, footY + 28, webW, 8, 3, 3, "F");
    restoreOpacity();
    pdf.setDrawColor(...C.primary);
    setOpacity(0.3);
    pdf.roundedRect(ctaX + (W - ctaX - MX) / 2 - webW / 2, footY + 28, webW, 8, 3, 3, "S");
    restoreOpacity();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.primary);
    pdf.text("holynexlabs.com.br", ctaX + (W - ctaX - MX) / 2, footY + 33.5, { align: "center" });

    // Confidentiality footer
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(5.5);
    pdf.setTextColor(...C.darkGray);
    pdf.text("Este documento é confidencial e destinado exclusivamente ao destinatário.", MX, H - 6);

    resetDrawState();
  }

  // ══════════════════════════════════════════════
  // SLIDE 9 — DETALHAMENTO (Riscos + Texto Completo)
  // Only if there is meaningful content
  // ══════════════════════════════════════════════
  {
    const riscos = pj?.riscos || [];
    const propostaTexto = proposta.proposta_texto || "";
    const hasRiscos = riscos.length > 0;
    const hasTexto = propostaTexto.length > 50;

    if (hasRiscos || hasTexto) {
      newPage();
      drawSectionHeader("Detalhamento", "Riscos e Premissas", 16);

      let cy = 38;

      // Risks
      if (hasRiscos) {
        for (const risco of riscos.slice(0, 6)) {
          const riscoText = typeof risco === "string" ? risco : String(risco);
          pdf.setFillColor(...C.secondary);
          pdf.circle(MX + 4, cy - 1, 2, "F");
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8.5);
          pdf.setTextColor(...C.lightGray);
          const rLines = pdf.splitTextToSize(riscoText, W - MX * 2 - 14);
          for (const l of rLines.slice(0, 2)) { pdf.text(l, MX + 10, cy); cy += 5; }
          cy += 3;
        }
      }

      // Full proposal text (if exists, render in condensed form)
      if (hasTexto) {
        cy += 8;
        drawCard(MX, cy, W - MX * 2, H - cy - 18, C.secondary);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(...C.white);
        pdf.text("Proposta Comercial Completa", MX + 10, cy + 14);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(...C.lightGray);
        const textoLines = pdf.splitTextToSize(propostaTexto, W - MX * 2 - 20);
        let tly = cy + 24;
        for (const l of textoLines) {
          if (tly > H - 20) break;
          pdf.text(l, MX + 10, tly);
          tly += 4;
        }
      }

      resetDrawState();
    }
  }

  const renderDuration = Date.now() - renderStart;
  logProposalEvent("proposal_pdf_generated", proposta.id, {
    render_status: "success",
    duration_ms: renderDuration,
    schema_valid: normResult.schema_valid,
    output_size: normResult.output_size,
    template_id: templateId || "cyber-magenta",
    pdf_version: pdf.getNumberOfPages(),
    niche_detected: niche.segment,
  });

  return pdf.output("blob");
}
