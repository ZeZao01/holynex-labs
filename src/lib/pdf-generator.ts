import { jsPDF } from "jspdf";
import type { Proposta } from "@/lib/propostas";
import logoUrl from "@/assets/logo.png";

// Pre-load image as base64
function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Color palette
const COLORS = {
  darkBg: [15, 15, 30] as [number, number, number],
  primary: [100, 80, 200] as [number, number, number],
  primaryLight: [140, 120, 230] as [number, number, number],
  accent: [0, 200, 180] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightGray: [200, 200, 210] as [number, number, number],
  midGray: [140, 140, 160] as [number, number, number],
  darkGray: [60, 60, 80] as [number, number, number],
  yellow: [255, 200, 50] as [number, number, number],
  emerald: [50, 200, 150] as [number, number, number],
};

export async function generatePropostaPdf(proposta: Proposta): Promise<Blob> {
  const logoBase64 = await loadImageAsBase64(logoUrl);
  const pj = proposta.proposta_json as any;

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297;
  const H = 210;
  const M = 18; // margin
  const CW = W - M * 2; // content width
  const CH = H - M * 2; // content height
  let y = M;
  let pageNum = 0;

  // ── Helpers ──

  const addWatermark = () => {
    // Centered watermark logo with low opacity
    const wSize = 80;
    const wx = (W - wSize) / 2;
    const wy = (H - wSize) / 2;
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.04 }));
    pdf.addImage(logoBase64, "PNG", wx, wy, wSize, wSize);
    pdf.restoreGraphicsState();
  };

  const addPageDecor = () => {
    // Top accent line
    pdf.setDrawColor(...COLORS.primary);
    pdf.setLineWidth(0.8);
    pdf.line(M, M - 4, W - M, M - 4);

    // Bottom accent line
    pdf.setDrawColor(...COLORS.primaryLight);
    pdf.setLineWidth(0.4);
    pdf.line(M, H - M + 6, W - M, H - M + 6);

    // Corner decorative dots
    pdf.setFillColor(...COLORS.primary);
    pdf.circle(M - 2, M - 4, 1.2, "F");
    pdf.circle(W - M + 2, M - 4, 1.2, "F");

    // Page number
    pageNum++;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...COLORS.midGray);
    pdf.text(`${pageNum}`, W / 2, H - M + 10, { align: "center" });

    // Small logo in footer
    pdf.addImage(logoBase64, "PNG", M, H - M + 2, 8, 8);
    pdf.setFontSize(6);
    pdf.setTextColor(...COLORS.midGray);
    pdf.text("HolyNex Labs", M + 10, H - M + 7);
  };

  const newPage = () => {
    pdf.addPage();
    y = M;
    addWatermark();
    addPageDecor();
  };

  const checkPage = (needed: number) => {
    if (y + needed > H - M - 8) {
      newPage();
    }
  };

  const drawSectionTitle = (text: string) => {
    checkPage(14);
    // Accent bar
    pdf.setFillColor(...COLORS.primary);
    pdf.roundedRect(M, y - 1, 3, 8, 1.5, 1.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(...COLORS.white);
    pdf.text(text, M + 7, y + 5);
    y += 14;
  };

  const drawText = (text: string, indent = 0) => {
    if (!text) return;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...COLORS.lightGray);
    const lines = pdf.splitTextToSize(text, CW - indent);
    for (const line of lines) {
      checkPage(5);
      pdf.text(line, M + indent, y);
      y += 4.8;
    }
    y += 3;
  };

  const drawList = (items: string[], dotColor = COLORS.accent) => {
    if (!items?.length) return;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...COLORS.lightGray);
    for (const item of items) {
      const lines = pdf.splitTextToSize(item, CW - 10);
      checkPage(lines.length * 5 + 2);
      // Bullet dot
      pdf.setFillColor(...dotColor);
      pdf.circle(M + 3, y - 1.2, 1, "F");
      for (let i = 0; i < lines.length; i++) {
        pdf.text(lines[i], M + 7, y);
        y += 4.8;
      }
      y += 1;
    }
    y += 2;
  };

  // ══════════════════════════════════════════════
  // PAGE 1 — COVER
  // ══════════════════════════════════════════════
  pdf.setFillColor(...COLORS.darkBg);
  pdf.rect(0, 0, W, H, "F");

  // Decorative geometric shapes
  pdf.setFillColor(100, 80, 200);
  pdf.saveGraphicsState();
  (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.08 }));
  pdf.circle(40, 40, 60, "F");
  pdf.circle(W - 50, H - 30, 45, "F");
  pdf.restoreGraphicsState();

  // Gradient-like accent lines
  for (let i = 0; i < 5; i++) {
    pdf.setDrawColor(100, 80, 200);
    pdf.saveGraphicsState();
    (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.1 + i * 0.03 }));
    pdf.setLineWidth(0.3);
    pdf.line(M + i * 15, H - 50, W - M - i * 15, H - 50 - i * 3);
    pdf.restoreGraphicsState();
  }

  // Logo
  const logoSize = 40;
  pdf.addImage(logoBase64, "PNG", (W - logoSize) / 2, 30, logoSize, logoSize);

  // Company name
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(32);
  pdf.setTextColor(...COLORS.primary);
  pdf.text("HolyNex Labs", W / 2, 85, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(...COLORS.midGray);
  pdf.text("Inovação em Desenvolvimento de Software", W / 2, 94, { align: "center" });

  // Separator line
  pdf.setDrawColor(...COLORS.primary);
  pdf.setLineWidth(0.6);
  pdf.line(W / 2 - 40, 102, W / 2 + 40, 102);

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(...COLORS.white);
  pdf.text("Proposta Comercial", W / 2, 118, { align: "center" });

  // Client info
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(14);
  pdf.setTextColor(...COLORS.lightGray);
  pdf.text(`Para: ${proposta.nome_cliente}`, W / 2, 135, { align: "center" });

  if (proposta.empresa_cliente) {
    pdf.setFontSize(12);
    pdf.setTextColor(...COLORS.midGray);
    pdf.text(proposta.empresa_cliente, W / 2, 144, { align: "center" });
  }

  // Date
  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.midGray);
  const dateStr = new Date(proposta.criado_em).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  pdf.text(dateStr, W / 2, 165, { align: "center" });

  // Confidential
  pdf.setFontSize(7);
  pdf.setTextColor(100, 100, 120);
  pdf.text("Documento confidencial — destinado exclusivamente ao destinatário", W / 2, H - 15, { align: "center" });

  pageNum = 0; // cover is page 0

  // ══════════════════════════════════════════════
  // PAGE 2 — INVESTMENT SUMMARY
  // ══════════════════════════════════════════════
  newPage();

  drawSectionTitle("Resumo do Investimento");
  y += 2;

  const cardW = (CW - 12) / 3;
  const cardH = 35;
  const cardY = y;
  const cards = [
    { label: "Investimento Mínimo", value: proposta.valor_minimo, color: COLORS.yellow },
    { label: "Investimento Ideal", value: proposta.valor_ideal, color: COLORS.primary },
    { label: "Investimento Premium", value: proposta.valor_premium, color: COLORS.emerald },
  ];

  cards.forEach((card, i) => {
    const cx = M + i * (cardW + 6);
    // Card background
    pdf.setFillColor(25, 25, 50);
    pdf.roundedRect(cx, cardY, cardW, cardH, 3, 3, "F");
    // Border
    pdf.setDrawColor(...card.color);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(cx, cardY, cardW, cardH, 3, 3, "S");
    // Label
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.midGray);
    pdf.text(card.label, cx + cardW / 2, cardY + 12, { align: "center" });
    // Value
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(...card.color);
    const val = `R$ ${(card.value || 0).toLocaleString("pt-BR")}`;
    pdf.text(val, cx + cardW / 2, cardY + 25, { align: "center" });
  });

  y = cardY + cardH + 12;

  // ══════════════════════════════════════════════
  // CONTENT SECTIONS
  // ══════════════════════════════════════════════
  const textSections = [
    { title: "Resumo Executivo", content: pj?.resumo_executivo },
    { title: "Diagnóstico", content: pj?.diagnostico },
    { title: "Solução Proposta", content: pj?.solucao_proposta },
    { title: "Análise Estratégica", content: pj?.analise_estrategica },
    { title: "Estimativa de Esforço", content: pj?.estimativa_esforco },
    { title: "Cronograma Estimado", content: pj?.cronograma },
    { title: "Manutenção Mensal", content: pj?.manutencao },
  ];

  const listSections = [
    { title: "Escopo do Projeto", items: pj?.escopo },
    { title: "Funcionalidades Principais", items: pj?.funcionalidades },
    { title: "Funcionalidades Recomendadas", items: pj?.funcionalidades_recomendadas },
    { title: "Riscos e Premissas", items: pj?.riscos },
    { title: "Próximos Passos", items: pj?.proximos_passos },
  ];

  // Interleave in logical order
  const allSections: Array<{ title: string; type: "text" | "list"; data: any }> = [
    { title: "Resumo Executivo", type: "text", data: pj?.resumo_executivo },
    { title: "Diagnóstico", type: "text", data: pj?.diagnostico },
    { title: "Solução Proposta", type: "text", data: pj?.solucao_proposta },
    { title: "Escopo do Projeto", type: "list", data: pj?.escopo },
    { title: "Funcionalidades Principais", type: "list", data: pj?.funcionalidades },
    { title: "Funcionalidades Recomendadas", type: "list", data: pj?.funcionalidades_recomendadas },
    { title: "Análise Estratégica", type: "text", data: pj?.analise_estrategica },
    { title: "Estimativa de Esforço", type: "text", data: pj?.estimativa_esforco },
    { title: "Cronograma Estimado", type: "text", data: pj?.cronograma },
    { title: "Manutenção Mensal", type: "text", data: pj?.manutencao },
    { title: "Riscos e Premissas", type: "list", data: pj?.riscos },
    { title: "Próximos Passos", type: "list", data: pj?.proximos_passos },
  ];

  for (const section of allSections) {
    if (!section.data || (Array.isArray(section.data) && section.data.length === 0)) continue;
    drawSectionTitle(section.title);
    if (section.type === "text") {
      drawText(section.data);
    } else {
      drawList(section.data);
    }
  }

  // Full commercial proposal text
  if (pj?.proposta_comercial) {
    drawSectionTitle("Proposta Comercial Completa");
    drawText(pj.proposta_comercial);
  }

  // ══════════════════════════════════════════════
  // LAST PAGE — FOOTER / CTA
  // ══════════════════════════════════════════════
  checkPage(40);
  y += 10;
  pdf.setDrawColor(...COLORS.primary);
  pdf.setLineWidth(0.3);
  pdf.line(M, y, W - M, y);
  y += 12;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...COLORS.primary);
  pdf.text("HolyNex Labs", W / 2, y, { align: "center" });
  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.midGray);
  pdf.text("Inovação em Desenvolvimento de Software — holynexlabs.com.br", W / 2, y, { align: "center" });
  y += 5;
  pdf.text("Este documento é confidencial e destinado exclusivamente ao destinatário.", W / 2, y, { align: "center" });

  return pdf.output("blob");
}
