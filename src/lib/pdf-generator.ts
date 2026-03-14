import { jsPDF } from "jspdf";
import type { Proposta } from "@/lib/propostas";
import { type PdfTemplate, type RGB, getTemplateById } from "@/lib/pdf-templates";
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
  const MX = 18; // standard margin
  let pageNum = 0;

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

  const addPageDecor = () => {
    // Top border line (gradient-like: primary to secondary)
    pdf.setFillColor(...C.primary);
    pdf.rect(0, 0, W * 0.6, 1.5, "F");
    pdf.setFillColor(...C.secondary);
    pdf.rect(W * 0.6, 0, W * 0.4, 1.5, "F");
    // Bottom border line
    pdf.setFillColor(...C.accent);
    setOpacity(0.4);
    pdf.rect(0, H - 1.5, W, 1.5, "F");
    restoreOpacity();
    // Corner glows
    addGlow(W - 30, 30, 60, C.accent, 0.08);
    addGlow(30, H - 30, 50, C.secondary, 0.06);
  };

  const addPageNumber = () => {
    pageNum++;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.darkGray);
    pdf.text(`${String(pageNum).padStart(2, "0")}`, W - MX, H - 6, { align: "right" });
  };

  const addFooterBrand = () => {
    pdf.addImage(logoBase64, "PNG", MX, H - 12, 6, 6);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    pdf.setTextColor(...C.darkGray);
    pdf.text("HOLYNEX LABS", MX + 8, H - 7);
  };

  const newPage = () => {
    pdf.addPage();
    fillBg();
    addWatermark();
    addPageDecor();
    addPageNumber();
    addFooterBrand();
  };

  const drawSectionHeader = (subtitle: string, title: string, y: number) => {
    // Subtitle (small caps)
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.primary);
    pdf.text(subtitle.toUpperCase(), MX, y);
    // Title (large)
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(...C.white);
    pdf.text(title.toUpperCase(), MX, y + 12);
    // Company badge top-right
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    const companyName = proposta.empresa_cliente || proposta.nome_cliente;
    pdf.text(companyName.toUpperCase(), W - MX, y + 6, { align: "right" });
  };

  const drawCard = (x: number, y: number, w: number, h: number, borderColor: RGB = C.primary) => {
    // Card fill
    pdf.setFillColor(...C.bgCard);
    setOpacity(0.7);
    pdf.roundedRect(x, y, w, h, 3, 3, "F");
    restoreOpacity();
    // Border
    pdf.setDrawColor(...borderColor);
    setOpacity(0.35);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(x, y, w, h, 3, 3, "S");
    restoreOpacity();
  };

  const drawCardTitle = (icon: string, title: string, x: number, y: number, color: RGB) => {
    // Icon circle
    pdf.setFillColor(...color);
    setOpacity(0.15);
    pdf.circle(x + 6, y, 5, "F");
    restoreOpacity();
    pdf.setDrawColor(...color);
    setOpacity(0.4);
    pdf.circle(x + 6, y, 5, "S");
    restoreOpacity();
    // Icon text
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...color);
    pdf.text(icon, x + 6, y + 2.5, { align: "center" });
    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...C.white);
    pdf.text(title, x + 14, y + 3);
  };

  const drawBullet = (text: string, x: number, y: number, maxW: number, color: RGB = C.secondary): number => {
    // Triangle bullet
    pdf.setFillColor(...color);
    pdf.triangle(x, y - 2.5, x + 2.5, y - 1, x, y + 0.5, "F");
    // Text (bold label + normal desc if contains ":")
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

  // Top border accent
  pdf.setFillColor(...C.primary);
  pdf.rect(0, 0, W * 0.5, 1.5, "F");
  pdf.setFillColor(...C.secondary);
  pdf.rect(W * 0.5, 0, W * 0.5, 1.5, "F");

  // Corner glows
  addGlow(W * 0.3, H * 0.3, 90, C.accent, 0.08);
  addGlow(W * 0.8, H * 0.7, 70, C.secondary, 0.06);

  // Top-left info
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(...C.darkGray);
  pdf.text("SOLUÇÕES DE MAIS", MX, 12);
  // Top-right date
  const dateStr = new Date(proposta.criado_em).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  pdf.text(dateStr.charAt(0).toUpperCase() + dateStr.slice(1), W - MX, 12, { align: "right" });

  // Logo centered
  const logoSize = 40;
  addGlow(W / 2, 60, 35, C.primary, 0.1);
  // Logo background card
  pdf.setFillColor(...C.bgCard);
  setOpacity(0.8);
  pdf.roundedRect(W / 2 - logoSize / 2 - 5, 40, logoSize + 10, logoSize + 10, 4, 4, "F");
  restoreOpacity();
  pdf.setDrawColor(...C.accent);
  setOpacity(0.3);
  pdf.roundedRect(W / 2 - logoSize / 2 - 5, 40, logoSize + 10, logoSize + 10, 4, 4, "S");
  restoreOpacity();
  pdf.addImage(logoBase64, "PNG", W / 2 - logoSize / 2, 45, logoSize, logoSize);

  // Company name
  const companyName = proposta.empresa_cliente || "";
  if (companyName) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...C.midGray);
    pdf.text(companyName.toUpperCase(), W / 2, 103, { align: "center" });
  }

  // Project title
  const projectTitle = pj?.titulo_projeto || proposta.tipo_projeto || "SISTEMA PERSONALIZADO";
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  pdf.setTextColor(...C.white);
  const titleLines = pdf.splitTextToSize(projectTitle.toUpperCase(), W * 0.7);
  let titleY = 118;
  for (const line of titleLines.slice(0, 2)) {
    pdf.text(line, W / 2, titleY, { align: "center" });
    titleY += 14;
  }

  // Subtitle
  const subtitle = pj?.subtitulo || pj?.resumo_executivo?.substring(0, 80) || "Plataforma integrada para agendamentos inteligentes e controle operacional";
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...C.midGray);
  const subLines = pdf.splitTextToSize(subtitle, W * 0.6);
  let subY = titleY + 4;
  for (const line of subLines.slice(0, 2)) {
    pdf.text(line, W / 2, subY, { align: "center" });
    subY += 5;
  }

  // Bottom info badges (3 columns)
  const badgeY = H - 32;
  const badgeW = (W - MX * 2 - 20) / 3;
  const badgeInfos = [
    { icon: "▶", label: "FAIXA OPERACIONAL", value: proposta.complexidade || "Média" },
    { icon: "◆", label: "EXPERIÊNCIA NO SETOR", value: proposta.segmento || "Tecnologia" },
    { icon: "✉", label: "CONTATO", value: proposta.email_cliente || "comercial@holynex.com" },
  ];

  badgeInfos.forEach((badge, i) => {
    const bx = MX + i * (badgeW + 10);
    // Badge background
    pdf.setFillColor(...C.bgCard);
    setOpacity(0.6);
    pdf.roundedRect(bx, badgeY, badgeW, 16, 3, 3, "F");
    restoreOpacity();
    pdf.setDrawColor(...C.accent);
    setOpacity(0.2);
    pdf.roundedRect(bx, badgeY, badgeW, 16, 3, 3, "S");
    restoreOpacity();
    // Icon
    pdf.setFillColor(...C.primary);
    pdf.circle(bx + 8, badgeY + 8, 3.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    pdf.setTextColor(...C.bg);
    pdf.text(badge.icon, bx + 8, badgeY + 9.5, { align: "center" });
    // Label
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    pdf.setTextColor(...C.darkGray);
    pdf.text(badge.label, bx + 16, badgeY + 6);
    // Value
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.white);
    pdf.text(badge.value.substring(0, 28), bx + 16, badgeY + 12);
  });

  // Confidential + doc code
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);
  pdf.setTextColor(...C.darkGray);
  pdf.text("Documento confidencial — destinado exclusivamente ao destinatário", W / 2, H - 6, { align: "center" });
  if (docCode) {
    pdf.text(`Código: ${docCode}`, W / 2, H - 2, { align: "center" });
  }

  // Bottom accent line
  pdf.setFillColor(...C.primary);
  pdf.rect(0, H - 1, W * 0.5, 1, "F");
  pdf.setFillColor(...C.secondary);
  pdf.rect(W * 0.5, H - 1, W * 0.5, 1, "F");

  pageNum = 0;

  // ══════════════════════════════════════════════
  // SLIDE 2 — CONTEXTO DO PROJETO
  // ══════════════════════════════════════════════
  {
    newPage();
    const headerY = 12;
    drawSectionHeader("Análise Inicial", "Contexto do Projeto", headerY);

    // Two cards side by side
    const cardGap = 10;
    const cardW = (W - MX * 2 - cardGap) / 2;
    const cardY = headerY + 24;
    const cardH = H - cardY - 20;

    // Card 1: Resumo Executivo
    drawCard(MX, cardY, cardW, cardH, C.secondary);
    drawCardTitle("⚡", "Resumo Executivo", MX + 8, cardY + 14, C.secondary);

    let ly = cardY + 26;
    const resumoItems = [];

    // Build resume items from proposal data
    if (pj?.resumo_executivo) {
      resumoItems.push(`Desenvolvimento Full-Stack: ${typeof pj.resumo_executivo === "string" ? pj.resumo_executivo.substring(0, 120) : "Criação de sistema robusto."}`);
    }
    if (pj?.escopo?.length) {
      resumoItems.push(`Entregas Principais: ${pj.escopo.slice(0, 3).join(", ")}.`);
    }
    if (pj?.analise_estrategica) {
      resumoItems.push(`Objetivo Estratégico: ${pj.analise_estrategica.substring(0, 120)}`);
    }
    if (resumoItems.length === 0) {
      resumoItems.push(
        "Desenvolvimento Full-Stack: Criação de sistema robusto focado na disponibilidade em tempo real e facilidade de uso.",
        "Entregas Principais: Landing Page institucional, Painel Administrativo completo e Área do Usuário intuitiva.",
        "Objetivo Estratégico: Maximizar a eficiência operacional, automatizar processos manuais e elevar a experiência do cliente final."
      );
    }
    for (const item of resumoItems) {
      ly = drawBullet(item, MX + 8, ly, cardW - 18, C.secondary);
    }

    // Card 2: Diagnóstico Atual
    const card2X = MX + cardW + cardGap;
    drawCard(card2X, cardY, cardW, cardH, C.primary);
    drawCardTitle("⚙", "Diagnóstico Atual", card2X + 8, cardY + 14, C.primary);

    let ry = cardY + 26;
    const diagItems = [];
    if (pj?.diagnostico) {
      const diagParts = pj.diagnostico.split(/[.!]\s+/).filter((s: string) => s.trim().length > 10);
      for (const part of diagParts.slice(0, 3)) {
        diagItems.push(part.trim() + ".");
      }
    }
    if (diagItems.length === 0) {
      diagItems.push(
        "Gestão Descentralizada: Falta de uma ferramenta integrada que centralize reservas, bloqueios de manutenção e agenda.",
        "Visibilidade Limitada: Necessidade crítica de uma visão clara e imediata de datas, horários disponíveis e conflitos de agenda.",
        "Controle de Acesso: Carência de um sistema para gestão granular de perfis, permissões e políticas de uso para equipe e clientes."
      );
    }
    for (const item of diagItems) {
      ry = drawBullet(item, card2X + 8, ry, cardW - 18, C.primary);
    }
  }

  // ══════════════════════════════════════════════
  // SLIDE 3 — SOLUÇÃO PROPOSTA
  // ══════════════════════════════════════════════
  {
    newPage();
    const headerY = 12;
    drawSectionHeader("Arquitetura do Sistema", "Solução Proposta", headerY);

    // Scope section subtitle
    let sy = headerY + 22;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.secondary);
    pdf.text("⚙ Escopo do Projeto", MX, sy);
    sy += 6;

    // 3 scope cards
    const scopeGap = 8;
    const scopeW = (W - MX * 2 - scopeGap * 2) / 3;
    const scopeH = 55;

    const scopeCards = [
      { icon: "🌐", title: "Landing Page", desc: pj?.escopo?.[0] || "Interface pública para apresentação, vitrine detalhada, FAQs e CTA direto para reservas." },
      { icon: "👤", title: "Painel de Usuários", desc: pj?.escopo?.[1] || "Área restrita para cadastro, login seguro, visualização de calendário, criação de reservas e histórico de uso." },
      { icon: "⚙", title: "Painel Administrativo", desc: pj?.escopo?.[2] || "Centro de controle para gestão de recursos, regras, aprovação de cadastros e relatórios." },
    ];

    scopeCards.forEach((sc, i) => {
      const sx = MX + i * (scopeW + scopeGap);
      drawCard(sx, sy, scopeW, scopeH, i === 0 ? C.secondary : i === 1 ? C.primary : C.accent);
      // Icon
      const iconColor: RGB = i === 0 ? C.secondary : i === 1 ? C.primary : C.accent;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(...iconColor);
      pdf.text(sc.icon, sx + scopeW / 2, sy + 14, { align: "center" });
      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...C.white);
      pdf.text(sc.title, sx + scopeW / 2, sy + 24, { align: "center" });
      // Description
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...C.lightGray);
      const descLines = pdf.splitTextToSize(sc.desc.substring(0, 120), scopeW - 14);
      let dy = sy + 30;
      for (const l of descLines.slice(0, 4)) {
        pdf.text(l, sx + 7, dy);
        dy += 4;
      }
    });

    // Key features section
    const featY = sy + scopeH + 10;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.secondary);
    pdf.text("⚙ Funcionalidades Chave", MX, featY);

    const featStartY = featY + 6;
    const featColW = (W - MX * 2 - 10) / 2;
    const feats = pj?.funcionalidades || [];
    const featItems = [
      { title: feats[0] || "Agendamento Inteligente", desc: feats[1] || "Sistema de verificação automática de conflitos, bloqueios administrativos e suporte a reservas recorrentes.", color: C.primary },
      { title: feats[2] || "Gestão de Usuários", desc: feats[3] || "Controle granular de perfis com diferentes níveis de permissão e acesso.", color: C.secondary },
      { title: feats[4] || "Gestão de Horários", desc: feats[5] || "Configuração flexível de janelas de funcionamento, dias indisponíveis e regras de cancelamento.", color: C.primary },
      { title: feats[6] || "Notificações & Métricas", desc: feats[7] || "Alertas automáticos por e-mail para confirmações e dashboard com métricas essenciais de ocupação.", color: C.accent2 },
    ];

    featItems.forEach((feat, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const fx = MX + col * (featColW + 10);
      const fy = featStartY + row * 28;

      // Small icon
      pdf.setFillColor(...feat.color);
      setOpacity(0.15);
      pdf.circle(fx + 5, fy + 4, 4, "F");
      restoreOpacity();
      pdf.setDrawColor(...feat.color);
      setOpacity(0.3);
      pdf.circle(fx + 5, fy + 4, 4, "S");
      restoreOpacity();

      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...C.white);
      pdf.text(feat.title.substring(0, 35), fx + 13, fy + 5);

      // Description
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...C.lightGray);
      const dl = pdf.splitTextToSize(feat.desc.substring(0, 100), featColW - 16);
      let dly = fy + 11;
      for (const l of dl.slice(0, 2)) {
        pdf.text(l, fx + 13, dly);
        dly += 4;
      }
    });
  }

  // ══════════════════════════════════════════════
  // SLIDE 4 — INVESTIMENTO & ANÁLISE
  // ══════════════════════════════════════════════
  {
    newPage();
    const headerY = 12;
    drawSectionHeader("Proposta Comercial", "Investimento & Análise", headerY);

    // Right badge
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    pdf.text("⚡ PLANOS E BENEFÍCIOS", W - MX, headerY + 12, { align: "right" });

    // 3 pricing tiers
    const tierY = headerY + 24;
    const tierGap = 8;
    const tierW = (W - MX * 2 - tierGap * 2) / 3;
    const tierH = 100;

    const plans = [
      {
        name: "MÍNIMO",
        price: proposta.valor_minimo || 0,
        features: pj?.escopo?.slice(0, 4) || ["Agendamento de salas essencial", "Gestão básica de usuários", "Controle simples de horários", "Suporte por e-mail"],
        recommended: false,
      },
      {
        name: "IDEAL",
        price: proposta.valor_ideal || 0,
        features: pj?.funcionalidades?.slice(0, 5) || ["Todas as features do Mínimo", "Landing Page completa", "Painel de relatórios gerenciais", "Notificações automáticas", "Histórico de reservas"],
        recommended: true,
      },
      {
        name: "PREMIUM",
        price: proposta.valor_premium || 0,
        features: [...(pj?.funcionalidades_recomendadas?.slice(0, 3) || ["Todas as features do Ideal", "Customizações visuais avançadas", "Integrações externas (API)"]), ...(pj?.integ?.slice(0, 2) || ["Suporte prioritário (WhatsApp)", "Treinamento da equipe"])].slice(0, 5),
        recommended: false,
      },
    ];

    // Use tiers from proposal_tiers if available
    if (tiers.length >= 3) {
      plans[0].name = tiers[0].name.toUpperCase();
      plans[0].price = tiers[0].price;
      plans[0].features = tiers[0].scope_modules.filter((m: any) => m.status === "included").map((m: any) => m.label).slice(0, 4);
      plans[0].recommended = tiers[0].is_recommended;

      plans[1].name = tiers[1].name.toUpperCase();
      plans[1].price = tiers[1].price;
      plans[1].features = tiers[1].scope_modules.filter((m: any) => m.status === "included").map((m: any) => m.label).slice(0, 5);
      plans[1].recommended = tiers[1].is_recommended;

      plans[2].name = tiers[2].name.toUpperCase();
      plans[2].price = tiers[2].price;
      plans[2].features = tiers[2].scope_modules.filter((m: any) => m.status === "included").map((m: any) => m.label).slice(0, 5);
      plans[2].recommended = tiers[2].is_recommended;
    } else if (tiers.length > 0) {
      // Use whatever tiers exist
      tiers.forEach((tier, i) => {
        if (i < 3) {
          plans[i].name = tier.name.toUpperCase();
          plans[i].price = tier.price;
          plans[i].features = tier.scope_modules.filter((m: any) => m.status === "included").map((m: any) => m.label).slice(0, 5);
          plans[i].recommended = tier.is_recommended;
        }
      });
    }

    plans.forEach((plan, i) => {
      const px = MX + i * (tierW + tierGap);
      const isRec = plan.recommended;
      const py = isRec ? tierY - 4 : tierY;
      const ph = isRec ? tierH + 8 : tierH;

      // Card bg
      drawCard(px, py, tierW, ph, isRec ? C.primary : C.midGray);

      // Top accent
      if (isRec) {
        pdf.setFillColor(...C.primary);
        pdf.rect(px, py, tierW, 2, "F");
      }

      // Recommended badge
      if (isRec) {
        const bw = 28;
        pdf.setFillColor(...C.secondary);
        pdf.roundedRect(px + (tierW - bw) / 2, py - 4, bw, 8, 3, 3, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(6);
        pdf.setTextColor(...C.bg);
        pdf.text("RECOMENDADO", px + tierW / 2, py, { align: "center" });
      }

      // Plan name
      let fy = py + 16;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(isRec ? C.white : C.midGray);
      pdf.text(plan.name, px + tierW / 2, fy, { align: "center" });
      fy += 10;

      // Price
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.midGray);
      pdf.text("R$", px + tierW / 2 - 14, fy - 2);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(...C.white);
      pdf.text(plan.price > 0 ? plan.price.toLocaleString("pt-BR") : "—", px + tierW / 2 - 6, fy);
      fy += 8;

      // Separator
      pdf.setDrawColor(...C.midGray);
      setOpacity(0.15);
      pdf.line(px + 8, fy, px + tierW - 8, fy);
      restoreOpacity();
      fy += 6;

      // Features
      for (const feat of plan.features) {
        if (fy > py + ph - 8) break;
        // Checkmark
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(isRec ? C.secondary : C.secondary);
        pdf.text("✓", px + 8, fy);
        // Text
        pdf.setFont("helvetica", isRec ? "bold" : "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(isRec ? C.white : C.lightGray);
        pdf.text(feat.substring(0, 30), px + 14, fy);
        fy += 6;
      }
    });

    // Bottom row: Complexity + Strategic Analysis
    const bottomY = tierY + tierH + 14;
    const bottomCardW = (W - MX * 2 - 10) / 2;

    // Complexity card
    drawCard(MX, bottomY, bottomCardW, 24, C.secondary);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.secondary);
    pdf.text("⚙ NÍVEL DE COMPLEXIDADE", MX + 8, bottomY + 8);
    // Complexity bar
    const compLevel = proposta.complexidade || "Média";
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...C.white);
    pdf.text(compLevel, MX + 8, bottomY + 18);
    // Bar visualization
    const barX = MX + 50, barW = bottomCardW - 62, barH2 = 4;
    pdf.setFillColor(...C.bgCard);
    pdf.roundedRect(barX, bottomY + 14, barW, barH2, 2, 2, "F");
    const fillPct = compLevel === "Baixa" ? 0.3 : compLevel === "Alta" ? 0.9 : 0.6;
    pdf.setFillColor(...C.primary);
    pdf.roundedRect(barX, bottomY + 14, barW * fillPct, barH2, 2, 2, "F");
    // Estimate
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    pdf.text(pj?.cronograma || "Estimada em 4 semanas", barX, bottomY + 8);

    // Strategic Analysis card
    const saX = MX + bottomCardW + 10;
    drawCard(saX, bottomY, bottomCardW, 24, C.accent);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.accent);
    pdf.text("⚡ ANÁLISE ESTRATÉGICA", saX + 8, bottomY + 8);

    const stratItems = ["Eficiência", "Satisfação", "Dados"];
    const stratDescs = ["Automatização de processos", "Melhoria na experiência do usuário", "Base sólida para decisões futuras"];
    const stratW2 = (bottomCardW - 16) / 3;

    stratItems.forEach((s, i) => {
      const sx = saX + 8 + i * stratW2;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.white);
      pdf.text(s, sx, bottomY + 15);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6);
      pdf.setTextColor(...C.midGray);
      const sl = pdf.splitTextToSize(stratDescs[i], stratW2 - 5);
      pdf.text(sl[0] || "", sx, bottomY + 20);
    });
  }

  // ══════════════════════════════════════════════
  // SLIDE 5 — CRONOGRAMA & PRÓXIMOS PASSOS
  // ══════════════════════════════════════════════
  {
    newPage();
    const headerY = 12;
    drawSectionHeader("Planejamento e Execução", "Cronograma & Próximos Passos", headerY);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    pdf.text("⚡ PLANO DE AÇÃO", W - MX, headerY + 12, { align: "right" });

    // Timeline: 4 numbered steps
    const tlY = headerY + 24;
    const tlSteps = [
      { num: "01", title: "SEMANA 1", subtitle: "Descoberta & Design", desc: "Definição de UX/UI, arquitetura do sistema e aprovação de protótipos." },
      { num: "02", title: "SEMANA 2", subtitle: "Backend Core", desc: "Desenvolvimento da lógica de agendamentos, gestão de usuários e regras de horários." },
      { num: "03", title: "SEMANA 3", subtitle: "Frontend & Integração", desc: "Construção da Landing Page, painéis administrativos e conexão com API." },
      { num: "04", title: "SEMANA 4", subtitle: "Go-Live", desc: "Testes finais, homologação, treinamento e lançamento oficial." },
    ];

    const stepW = (W - MX * 2 - 30) / 4;

    // Connecting line
    pdf.setDrawColor(...C.midGray);
    setOpacity(0.2);
    pdf.setLineWidth(0.5);
    pdf.line(MX + 15, tlY + 8, W - MX - 15, tlY + 8);
    restoreOpacity();

    tlSteps.forEach((step, i) => {
      const sx = MX + i * (stepW + 10);
      const stepColor: RGB = i === 0 ? C.primary : i === 1 ? C.secondary : i === 2 ? C.accent : C.accent2;

      // Circle with number
      pdf.setDrawColor(...stepColor);
      pdf.setLineWidth(0.8);
      pdf.circle(sx + stepW / 2, tlY + 8, 7, "S");
      pdf.setFillColor(...C.bg);
      pdf.circle(sx + stepW / 2, tlY + 8, 6, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...stepColor);
      pdf.text(step.num, sx + stepW / 2, tlY + 11, { align: "center" });

      // Title & subtitle
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.white);
      pdf.text(step.title, sx + stepW / 2, tlY + 22, { align: "center" });
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(...stepColor);
      pdf.text(step.subtitle, sx + stepW / 2, tlY + 28, { align: "center" });

      // Description
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...C.lightGray);
      const dl = pdf.splitTextToSize(step.desc, stepW - 4);
      let dly = tlY + 34;
      for (const l of dl.slice(0, 3)) {
        pdf.text(l, sx + 2, dly);
        dly += 4;
      }
    });

    // Bottom row: 3 cards
    const bottomY = tlY + 58;
    const bottomGap = 8;
    const bottomCardW = (W - MX * 2 - bottomGap * 2) / 3;
    const bottomCardH = H - bottomY - 18;

    // Card 1: Plano de Manutenção
    drawCard(MX, bottomY, bottomCardW, bottomCardH, C.highlight);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.highlight);
    pdf.text("⚡ PLANO DE MANUTENÇÃO", MX + 8, bottomY + 10);

    pdf.setFillColor(...C.highlight);
    setOpacity(0.1);
    pdf.circle(MX + 12, bottomY + 22, 4, "F");
    restoreOpacity();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.white);
    pdf.text("Suporte Mensal", MX + 20, bottomY + 22);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    pdf.text("Monitoramento Contínuo", MX + 20, bottomY + 28);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(...C.white);
    const maintPrice = pj?.manutencao || "R$ 40,00";
    pdf.text(maintPrice.substring(0, 20), MX + 8, bottomY + 42);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.midGray);
    pdf.text("/mês", MX + 8 + pdf.getTextWidth(maintPrice.substring(0, 20)) + 2, bottomY + 42);

    // Maintenance features
    const maintFeats = ["Correções de bugs", "Pequenos ajustes visuais", "Monitoramento de servidor"];
    let mfy = bottomY + 50;
    for (const feat of maintFeats) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(...C.secondary);
      pdf.text("✓", MX + 8, mfy);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...C.lightGray);
      pdf.text(feat, MX + 14, mfy);
      mfy += 5;
    }

    // Card 2: Matriz de Riscos
    const riskX = MX + bottomCardW + bottomGap;
    drawCard(riskX, bottomY, bottomCardW, bottomCardH, C.highlight);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.highlight);
    pdf.text("⚠ MATRIZ DE RISCOS", riskX + 8, bottomY + 10);

    const risks = pj?.riscos || [
      { title: "Atraso no Desenvolvimento", mitigation: "Sprints semanais e buffer de tempo." },
      { title: "Dificuldade na Integração", mitigation: "Ambiente de staging para testes isolados." },
      { title: "Mudança de Escopo", mitigation: "Documentação aprovada no kick-off." },
    ];

    let rky = bottomY + 18;
    const riskItems = Array.isArray(risks) ? risks : [];
    for (const risk of riskItems.slice(0, 3)) {
      const rTitle = typeof risk === "string" ? risk : risk.title || risk;
      const rMitigation = typeof risk === "object" && risk.mitigation ? risk.mitigation : "";

      pdf.setFillColor(...C.primary);
      pdf.circle(riskX + 10, rky + 1, 1.5, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.white);
      pdf.text(String(rTitle).substring(0, 35), riskX + 15, rky + 2);
      rky += 6;
      if (rMitigation) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(...C.midGray);
        pdf.text(`→ Mitigação: ${String(rMitigation).substring(0, 45)}`, riskX + 15, rky);
        rky += 5;
      }
      rky += 3;
    }

    // Card 3: Próximos Passos + CTA
    const ctaX = riskX + bottomCardW + bottomGap;
    drawCard(ctaX, bottomY, bottomCardW, bottomCardH, C.secondary);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.secondary);
    pdf.text("📋 PRÓXIMOS PASSOS", ctaX + 8, bottomY + 10);

    const nextSteps = pj?.proximos_passos || [
      "Reunião de Kick-off",
      "Assinatura de Contrato",
      "Início do Projeto",
    ];

    let nsy = bottomY + 20;
    for (const step of (Array.isArray(nextSteps) ? nextSteps : []).slice(0, 4)) {
      const stepText = typeof step === "string" ? step : String(step);
      // Checkmark
      pdf.setFillColor(...C.secondary);
      setOpacity(0.15);
      pdf.roundedRect(ctaX + 8, nsy - 3, 5, 5, 1, 1, "F");
      restoreOpacity();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(...C.secondary);
      pdf.text("✓", ctaX + 10.5, nsy + 0.5, { align: "center" });
      // Text
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.white);
      pdf.text(stepText.substring(0, 30), ctaX + 16, nsy);
      nsy += 8;
    }

    // CTA Button
    const btnY = bottomY + bottomCardH - 16;
    pdf.setFillColor(...C.primary);
    pdf.roundedRect(ctaX + 8, btnY, bottomCardW - 16, 10, 3, 3, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.white);
    pdf.text("APROVAR PROPOSTA  ▶", ctaX + bottomCardW / 2, btnY + 7, { align: "center" });
  }

  // ══════════════════════════════════════════════
  // SLIDE 6 — CONDIÇÕES COMERCIAIS (if notes exist)
  // ══════════════════════════════════════════════
  {
    const notes = proposta.commercial_notes;
    const validity = proposta.proposal_validity || "30 dias";
    const isPhased = proposta.is_phased;

    if (notes || validity) {
      newPage();
      const headerY = 12;
      drawSectionHeader("Termos e Condições", "Condições Comerciais", headerY);

      let cy = headerY + 24;

      // Validity & modality badges
      const badgeItems = [
        { label: "VALIDADE", value: validity, color: C.secondary },
        { label: "MODALIDADE", value: isPhased ? "Projeto faseado" : "Entrega única", color: C.primary },
      ];
      if (proposta.closing_strategy) {
        badgeItems.push({ label: "ESTRATÉGIA", value: proposta.closing_strategy.substring(0, 30), color: C.accent });
      }

      const bw = (W - MX * 2 - (badgeItems.length - 1) * 8) / badgeItems.length;
      badgeItems.forEach((item, i) => {
        const bx = MX + i * (bw + 8);
        drawCard(bx, cy, bw, 22, item.color);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6);
        pdf.setTextColor(...C.midGray);
        pdf.text(item.label, bx + 8, cy + 8);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(...C.white);
        pdf.text(item.value.substring(0, 20), bx + 8, cy + 16);
      });

      cy += 32;

      // Commercial notes sections
      if (notes) {
        const notesSections = [
          { title: "Observação Geral", text: (notes as any).general_note, color: C.secondary },
          { title: "Justificativa da Recomendação", text: (notes as any).recommendation_justification, color: C.primary },
          { title: "Estratégia de Fechamento", text: (notes as any).closing_strategy, color: C.accent },
          { title: "Próximos Passos", text: (notes as any).next_steps, color: C.accent2 },
        ].filter(s => s.text);

        for (const section of notesSections) {
          if (cy > H - 30) { newPage(); cy = 24; }
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9);
          pdf.setTextColor(...section.color);
          pdf.text(section.title.toUpperCase(), MX, cy);
          cy += 6;
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8.5);
          pdf.setTextColor(...C.lightGray);
          const lines = pdf.splitTextToSize(section.text, W - MX * 2);
          for (const l of lines) {
            if (cy > H - 18) { newPage(); cy = 24; }
            pdf.text(l, MX, cy);
            cy += 4.5;
          }
          cy += 4;
        }
      }

      // Disclaimer
      if (cy > H - 20) { newPage(); cy = 24; }
      pdf.setDrawColor(...C.midGray);
      setOpacity(0.2);
      pdf.line(MX, cy, W - MX, cy);
      restoreOpacity();
      cy += 5;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...C.darkGray);
      const disclaimer = pdf.splitTextToSize(
        "Os valores apresentados são válidos pelo período indicado. Alterações de escopo podem impactar prazos e investimentos. Esta proposta é confidencial e destinada exclusivamente ao destinatário.",
        W - MX * 2
      );
      for (const l of disclaimer) { pdf.text(l, MX, cy); cy += 4; }
    }
  }

  // ══════════════════════════════════════════════
  // SLIDE 7 — ENCERRAMENTO / CTA FINAL
  // ══════════════════════════════════════════════
  {
    newPage();
    fillBg(); // Double fill for clean bg

    // Full-page centered CTA
    addGlow(W / 2, H / 2, 80, C.primary, 0.08);
    addGlow(W * 0.3, H * 0.7, 60, C.secondary, 0.06);

    // Logo
    const logoS = 25;
    pdf.addImage(logoBase64, "PNG", W / 2 - logoS / 2, 40, logoS, logoS);

    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(28);
    pdf.setTextColor(...C.white);
    pdf.text("VAMOS COMEÇAR?", W / 2, 85, { align: "center" });

    // Subtitle
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...C.lightGray);
    pdf.text("Aprove o projeto hoje e garanta prioridade no nosso cronograma.", W / 2, 95, { align: "center" });

    // CTA Button
    const btnW = 70, btnH2 = 14;
    pdf.setFillColor(...C.primary);
    pdf.roundedRect(W / 2 - btnW / 2, 110, btnW, btnH2, 4, 4, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...C.white);
    pdf.text("APROVAR PROPOSTA  ▶", W / 2, 119, { align: "center" });

    // Contact info
    const contactY2 = 140;
    pdf.setDrawColor(...C.midGray);
    setOpacity(0.15);
    pdf.line(W / 2 - 50, contactY2, W / 2 + 50, contactY2);
    restoreOpacity();

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...C.white);
    pdf.text("HOLYNEX LABS", W / 2, contactY2 + 12, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.midGray);
    pdf.text("comercial@aexstudio.com", W / 2, contactY2 + 20, { align: "center" });

    // Website badge
    pdf.setFillColor(...C.primary);
    setOpacity(0.15);
    const webW2 = 42;
    pdf.roundedRect(W / 2 - webW2 / 2, contactY2 + 25, webW2, 8, 3, 3, "F");
    restoreOpacity();
    pdf.setDrawColor(...C.primary);
    setOpacity(0.3);
    pdf.roundedRect(W / 2 - webW2 / 2, contactY2 + 25, webW2, 8, 3, 3, "S");
    restoreOpacity();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.primary);
    pdf.text("holynexlabs.com.br", W / 2, contactY2 + 30.5, { align: "center" });

    // Footer
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    pdf.setTextColor(...C.darkGray);
    pdf.text("Este documento é confidencial e destinado exclusivamente ao destinatário.", W / 2, H - 8, { align: "center" });
    if (docCode) {
      pdf.text(`Código: ${docCode}`, W / 2, H - 4, { align: "center" });
    }
  }

  // Log successful render
  const renderDuration = Date.now() - renderStart;
  logProposalEvent("proposal_pdf_generated", proposta.id, {
    render_status: "success",
    duration_ms: renderDuration,
    schema_valid: normResult.schema_valid,
    output_size: normResult.output_size,
    template_id: templateId || "cyber-magenta",
    pdf_version: pdf.getNumberOfPages(),
  });

  return pdf.output("blob");
}
