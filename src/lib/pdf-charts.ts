/**
 * PDF Chart & Table drawing primitives for jsPDF.
 * Renders bar charts, donut charts, comparison tables, and progress indicators.
 */
import { jsPDF } from "jspdf";
import type { RGB } from "@/lib/pdf-templates";

type OpacityHelpers = {
  setOpacity: (o: number) => void;
  restoreOpacity: () => void;
};

// ── Bar Chart ──
export function drawBarChart(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  data: { label: string; value: number; color: RGB }[],
  helpers: OpacityHelpers,
  colors: { white: RGB; midGray: RGB; bgCard: RGB; lightGray: RGB }
) {
  const max = Math.max(...data.map(d => d.value), 1);
  const barGap = 4;
  const barW = (w - barGap * (data.length + 1)) / data.length;
  const chartH = h - 20; // space for labels

  // Axis line
  pdf.setDrawColor(...colors.midGray);
  helpers.setOpacity(0.2);
  pdf.setLineWidth(0.3);
  pdf.line(x, y + chartH, x + w, y + chartH);
  helpers.restoreOpacity();

  // Grid lines (3 horizontal)
  for (let i = 1; i <= 3; i++) {
    const gy = y + chartH - (chartH * i) / 3;
    helpers.setOpacity(0.08);
    pdf.setDrawColor(...colors.midGray);
    pdf.setLineWidth(0.2);
    pdf.line(x, gy, x + w, gy);
    helpers.restoreOpacity();
    // Grid label
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(5.5);
    pdf.setTextColor(...colors.midGray);
    const gridVal = Math.round((max * i) / 3);
    pdf.text(
      gridVal >= 1000 ? `${(gridVal / 1000).toFixed(0)}k` : String(gridVal),
      x - 2,
      gy + 1.5,
      { align: "right" }
    );
  }

  data.forEach((d, i) => {
    const bx = x + barGap + i * (barW + barGap);
    const barH = (d.value / max) * chartH;
    const by = y + chartH - barH;

    // Bar shadow
    helpers.setOpacity(0.08);
    pdf.setFillColor(0, 0, 0);
    pdf.roundedRect(bx + 0.5, by + 0.5, barW, barH, 1.5, 1.5, "F");
    helpers.restoreOpacity();

    // Bar fill with gradient effect (two-tone)
    pdf.setFillColor(...d.color);
    pdf.roundedRect(bx, by, barW, barH, 1.5, 1.5, "F");
    // Lighter top highlight
    helpers.setOpacity(0.2);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(bx, by, barW, Math.min(barH * 0.3, 8), 1.5, 1.5, "F");
    helpers.restoreOpacity();

    // Value on top
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...colors.white);
    const valText = d.value >= 1000
      ? `R$${(d.value / 1000).toFixed(1)}k`
      : `R$${d.value}`;
    pdf.text(valText, bx + barW / 2, by - 2, { align: "center" });

    // Label below
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    pdf.setTextColor(...colors.midGray);
    const labelLines = pdf.splitTextToSize(d.label, barW + 2);
    pdf.text(labelLines[0] || "", bx + barW / 2, y + chartH + 5, { align: "center" });
    if (labelLines[1]) {
      pdf.text(labelLines[1], bx + barW / 2, y + chartH + 9, { align: "center" });
    }
  });
}

// ── Donut/Ring Chart ──
export function drawDonutChart(
  pdf: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  segments: { label: string; pct: number; color: RGB }[],
  helpers: OpacityHelpers,
  colors: { white: RGB; midGray: RGB; bg: RGB }
) {
  const total = segments.reduce((s, seg) => s + seg.pct, 0) || 1;
  let startAngle = -90; // Start from top

  // Background ring
  pdf.setDrawColor(...colors.midGray);
  helpers.setOpacity(0.1);
  pdf.setLineWidth(6);
  pdf.circle(cx, cy, radius, "S");
  helpers.restoreOpacity();

  // Draw segments as arcs (approximated with small arc lines)
  segments.forEach((seg) => {
    const sweepAngle = (seg.pct / total) * 360;
    const steps = Math.max(Math.ceil(sweepAngle / 5), 1);
    const stepAngle = sweepAngle / steps;

    pdf.setDrawColor(...seg.color);
    pdf.setLineWidth(6);
    for (let i = 0; i < steps; i++) {
      const a1 = ((startAngle + i * stepAngle) * Math.PI) / 180;
      const a2 = ((startAngle + (i + 1) * stepAngle) * Math.PI) / 180;
      const x1 = cx + radius * Math.cos(a1);
      const y1 = cy + radius * Math.sin(a1);
      const x2 = cx + radius * Math.cos(a2);
      const y2 = cy + radius * Math.sin(a2);
      pdf.line(x1, y1, x2, y2);
    }
    startAngle += sweepAngle;
  });

  // Inner circle (to create donut effect)
  pdf.setFillColor(...colors.bg);
  pdf.circle(cx, cy, radius - 4, "F");

  // Center text
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.white);
  pdf.text(`${Math.round(total)}%`, cx, cy + 2, { align: "center" });

  // Legend below
  let ly = cy + radius + 6;
  segments.forEach((seg) => {
    pdf.setFillColor(...seg.color);
    pdf.rect(cx - 18, ly - 2, 3, 3, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    pdf.setTextColor(...colors.midGray);
    pdf.text(`${seg.label} (${seg.pct}%)`, cx - 13, ly);
    ly += 5;
  });
}

// ── Comparison Table ──
export function drawComparisonTable(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  headers: string[],
  rows: { label: string; values: (string | boolean)[] }[],
  helpers: OpacityHelpers,
  colors: { primary: RGB; secondary: RGB; white: RGB; midGray: RGB; bgCard: RGB; lightGray: RGB; bg: RGB }
) {
  const colW = (w - 70) / headers.length; // 70 for label column
  const rowH = 7;
  let cy = y;

  // Header row
  pdf.setFillColor(...colors.primary);
  helpers.setOpacity(0.15);
  pdf.roundedRect(x, cy, w, rowH + 2, 1.5, 1.5, "F");
  helpers.restoreOpacity();

  // Label column header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.5);
  pdf.setTextColor(...colors.midGray);
  pdf.text("FUNCIONALIDADE", x + 4, cy + 5);

  // Tier headers
  headers.forEach((h, i) => {
    const hx = x + 70 + i * colW + colW / 2;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...colors.white);
    pdf.text(h, hx, cy + 5, { align: "center" });
  });

  cy += rowH + 4;

  // Data rows
  rows.forEach((row, ri) => {
    // Alternating row bg
    if (ri % 2 === 0) {
      pdf.setFillColor(...colors.bgCard);
      helpers.setOpacity(0.4);
      pdf.rect(x, cy - 1, w, rowH, "F");
      helpers.restoreOpacity();
    }

    // Label
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(...colors.lightGray);
    pdf.text(row.label.substring(0, 35), x + 4, cy + 4);

    // Values
    row.values.forEach((val, vi) => {
      const vx = x + 70 + vi * colW + colW / 2;
      if (typeof val === "boolean") {
        if (val) {
          pdf.setFillColor(...colors.secondary);
          pdf.circle(vx, cy + 3, 2, "F");
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(5);
          pdf.setTextColor(...colors.bg);
          pdf.text("✓", vx, cy + 4.2, { align: "center" });
        } else {
          pdf.setDrawColor(...colors.midGray);
          helpers.setOpacity(0.3);
          pdf.circle(vx, cy + 3, 2, "S");
          helpers.restoreOpacity();
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(5);
          pdf.setTextColor(...colors.midGray);
          pdf.text("—", vx, cy + 4, { align: "center" });
        }
      } else {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.5);
        pdf.setTextColor(...colors.lightGray);
        pdf.text(String(val).substring(0, 15), vx, cy + 4, { align: "center" });
      }
    });

    cy += rowH;
  });

  return cy;
}

// ── Progress Indicator (horizontal) ──
export function drawProgressBar(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  pct: number,
  label: string,
  helpers: OpacityHelpers,
  colors: { primary: RGB; bgCard: RGB; white: RGB; midGray: RGB }
) {
  const barH = 4;
  // Label
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  pdf.setTextColor(...colors.midGray);
  pdf.text(label, x, y - 1);
  // Percentage
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(...colors.white);
  pdf.text(`${Math.round(pct)}%`, x + w, y - 1, { align: "right" });
  // Background
  pdf.setFillColor(...colors.bgCard);
  pdf.roundedRect(x, y + 1, w, barH, 2, 2, "F");
  // Fill
  pdf.setFillColor(...colors.primary);
  pdf.roundedRect(x, y + 1, w * Math.min(pct / 100, 1), barH, 2, 2, "F");
}

// ── KPI Card ──
export function drawKpiCard(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  icon: string,
  value: string,
  label: string,
  helpers: OpacityHelpers,
  colors: { primary: RGB; bgCard: RGB; white: RGB; midGray: RGB },
  borderColor?: RGB
) {
  const bc = borderColor || colors.primary;
  // Card bg
  pdf.setFillColor(...colors.bgCard);
  helpers.setOpacity(0.7);
  pdf.roundedRect(x, y, w, h, 3, 3, "F");
  helpers.restoreOpacity();
  // Border
  pdf.setDrawColor(...bc);
  helpers.setOpacity(0.35);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(x, y, w, h, 3, 3, "S");
  helpers.restoreOpacity();
  // Top accent
  pdf.setFillColor(...bc);
  helpers.setOpacity(0.5);
  pdf.rect(x + 2, y, w - 4, 1.2, "F");
  helpers.restoreOpacity();
  // Icon
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...bc);
  pdf.text(icon, x + w / 2, y + h * 0.3, { align: "center" });
  // Value
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(...colors.white);
  pdf.text(value, x + w / 2, y + h * 0.55, { align: "center" });
  // Label
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);
  pdf.setTextColor(...colors.midGray);
  const lines = pdf.splitTextToSize(label, w - 6);
  pdf.text(lines[0] || "", x + w / 2, y + h * 0.75, { align: "center" });
}

// ── Horizontal Timeline ──
export function drawTimeline(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  steps: { title: string; subtitle: string; desc: string }[],
  helpers: OpacityHelpers,
  colors: { primary: RGB; secondary: RGB; accent: RGB; accent2: RGB; white: RGB; midGray: RGB; lightGray: RGB; bg: RGB }
) {
  const stepW = (w - 10 * (steps.length - 1)) / steps.length;
  const lineY = y + 8;

  // Connecting line
  pdf.setDrawColor(...colors.midGray);
  helpers.setOpacity(0.2);
  pdf.setLineWidth(0.5);
  pdf.line(x + 15, lineY, x + w - 15, lineY);
  helpers.restoreOpacity();

  const stepColors: RGB[] = [colors.primary, colors.secondary, colors.accent, colors.accent2];

  steps.forEach((step, i) => {
    const sx = x + i * (stepW + 10);
    const sc = stepColors[i % stepColors.length];

    // Circle
    pdf.setDrawColor(...sc);
    pdf.setLineWidth(0.8);
    pdf.circle(sx + stepW / 2, lineY, 7, "S");
    pdf.setFillColor(...colors.bg);
    pdf.circle(sx + stepW / 2, lineY, 6, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...sc);
    pdf.text(String(i + 1).padStart(2, "0"), sx + stepW / 2, lineY + 3, { align: "center" });

    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.white);
    pdf.text(step.title, sx + stepW / 2, lineY + 14, { align: "center" });

    // Subtitle
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...sc);
    pdf.text(step.subtitle, sx + stepW / 2, lineY + 20, { align: "center" });

    // Description
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...colors.lightGray);
    const dl = pdf.splitTextToSize(step.desc, stepW - 4);
    let dly = lineY + 26;
    for (const l of dl.slice(0, 3)) {
      pdf.text(l, sx + 2, dly);
      dly += 4;
    }
  });
}
