import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { Proposta } from "@/lib/propostas";
import { logProposalEvent } from "@/lib/proposal-events";
import { buildPropostaPdfElement } from "@/lib/pdf-template-dom";

export type RGB = [number, number, number];

async function renderDomToPdfBlob(root: HTMLElement): Promise<Blob> {
  if ("fonts" in document) {
    await (document as Document & { fonts: FontFaceSet }).fonts.ready;
  }

  const canvas = await html2canvas(root, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#09090f",
    logging: false,
    windowWidth: root.scrollWidth,
    windowHeight: root.scrollHeight,
  });

  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 8;
  const printableWidth = pageWidth - margin * 2;
  const printableHeight = pageHeight - margin * 2;

  const imageData = canvas.toDataURL("image/png", 1);
  const imageHeight = (canvas.height * printableWidth) / canvas.width;

  let remainingHeight = imageHeight;
  let offsetY = margin;

  pdf.addImage(imageData, "PNG", margin, offsetY, printableWidth, imageHeight, undefined, "FAST");
  remainingHeight -= printableHeight;

  while (remainingHeight > 0) {
    pdf.addPage();
    offsetY = margin - (imageHeight - remainingHeight);
    pdf.addImage(imageData, "PNG", margin, offsetY, printableWidth, imageHeight, undefined, "FAST");
    remainingHeight -= printableHeight;
  }

  return pdf.output("blob");
}

export async function generatePropostaPdf(
  proposta: Proposta,
  _templateId?: string,
  documentCode?: string,
): Promise<Blob> {
  const renderStart = Date.now();

  await logProposalEvent("proposal_pdf_render_started", proposta.id, {
    render_status: "started",
    template_id: "dom-rebuild-v2",
  });

  const mount = buildPropostaPdfElement(proposta, documentCode);

  try {
    document.body.appendChild(mount);

    const blob = await renderDomToPdfBlob(mount);

    await logProposalEvent("proposal_pdf_generated", proposta.id, {
      render_status: "success",
      template_id: "dom-rebuild-v2",
      duration_ms: Date.now() - renderStart,
    });

    return blob;
  } catch (err) {
    await logProposalEvent("proposal_pdf_render_failed", proposta.id, {
      render_status: "failed",
      template_id: "dom-rebuild-v2",
      duration_ms: Date.now() - renderStart,
      render_error: err instanceof Error ? err.message : "Erro desconhecido na renderização",
    });

    throw err;
  } finally {
    mount.remove();
  }
}
