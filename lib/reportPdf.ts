import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { CheckStatus, GrowthReport } from "@/lib/report";

const A4 = { w: 595.28, h: 841.89 };
const M = 48; // page margin
const GREEN = rgb(0.035, 0.267, 0.075);
const INK = rgb(0.12, 0.13, 0.15);
const MUTED = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.89, 0.91, 0.93);

function scoreRgb(score: number) {
  if (score >= 70) return rgb(0.086, 0.639, 0.29);
  if (score >= 40) return rgb(0.851, 0.467, 0.024);
  return rgb(0.863, 0.149, 0.149);
}

const STATUS: Record<CheckStatus, { text: string; color: ReturnType<typeof rgb> }> = {
  pass: { text: "PASS", color: rgb(0.086, 0.639, 0.29) },
  partial: { text: "PARTIAL", color: rgb(0.851, 0.467, 0.024) },
  fail: { text: "FIX", color: rgb(0.863, 0.149, 0.149) },
  unknown: { text: "N/A", color: MUTED },
};

/** Standard PDF fonts only cover Latin-1; swap the few symbols the report uses. */
function clean(text: string): string {
  return text
    .replace(/✓/g, "yes")
    .replace(/✗/g, "no")
    .replace(/→/g, "->")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E\xA0-\xFF–—•]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = clean(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderGrowthReportPdf(report: GrowthReport): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Growth Report — ${report.clinic.name}`);
  doc.setAuthor("Clinic Growth");
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = doc.addPage([A4.w, A4.h]);
  let y = A4.h - M;

  const newPage = () => {
    page = doc.addPage([A4.w, A4.h]);
    y = A4.h - M;
  };
  const ensure = (h: number) => {
    if (y - h < M + 24) newPage();
  };
  const text = (t: string, opts: { x?: number; size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; width?: number; gap?: number } = {}) => {
    const size = opts.size ?? 10;
    const font = opts.font ?? regular;
    const lines = wrap(t, font, size, opts.width ?? A4.w - 2 * M - ((opts.x ?? M) - M));
    for (const line of lines) {
      ensure(size + 4);
      page.drawText(line, { x: opts.x ?? M, y: y - size, size, font, color: opts.color ?? INK });
      y -= size + (opts.gap ?? 4);
    }
  };
  const bar = (x: number, w: number, value: number) => {
    page.drawRectangle({ x, y: y - 6, width: w, height: 6, color: LINE });
    page.drawRectangle({ x, y: y - 6, width: (w * Math.max(0, Math.min(100, value))) / 100, height: 6, color: scoreRgb(value) });
    y -= 14;
  };

  // Header band
  page.drawRectangle({ x: 0, y: A4.h - 120, width: A4.w, height: 120, color: GREEN });
  page.drawText("CLINIC GROWTH", { x: M, y: A4.h - 44, size: 10, font: bold, color: rgb(1, 1, 1) });
  page.drawText(clean("Growth Report"), { x: M, y: A4.h - 74, size: 24, font: bold, color: rgb(1, 1, 1) });
  page.drawText(clean(`Prepared ${report.computedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`), {
    x: M,
    y: A4.h - 96,
    size: 10,
    font: regular,
    color: rgb(0.85, 0.92, 0.86),
  });
  y = A4.h - 150;

  // Clinic + score
  text(report.clinic.name, { size: 18, font: bold, width: 330 });
  if (report.clinic.category) text(report.clinic.category, { size: 10, color: MUTED, width: 330 });
  if (report.clinic.address) text(report.clinic.address, { size: 10, color: MUTED, width: 330 });
  if (report.websiteUrl) text(`Website: ${report.websiteUrl}`, { size: 10, color: MUTED, width: 330 });

  const cx = A4.w - M - 60;
  const cy = A4.h - 200;
  page.drawCircle({ x: cx, y: cy, size: 52, borderColor: scoreRgb(report.overall), borderWidth: 8 });
  const s = String(report.overall);
  page.drawText(s, { x: cx - bold.widthOfTextAtSize(s, 30) / 2, y: cy - 6, size: 30, font: bold, color: INK });
  page.drawText("out of 100", { x: cx - regular.widthOfTextAtSize("out of 100", 8) / 2, y: cy - 20, size: 8, font: regular, color: MUTED });
  y = Math.min(y, cy - 70);
  text(`${report.band.label}: ${report.band.description}`, { size: 11, font: bold, color: scoreRgb(report.overall) });
  y -= 8;

  // Score summary table
  text("Score breakdown", { size: 13, font: bold });
  y -= 2;
  for (const f of report.factors) {
    ensure(30);
    page.drawText(clean(f.label), { x: M, y: y - 10, size: 10, font: bold, color: INK });
    const right = `${f.score}/100  ·  weight ${Math.round(f.weight * 100)}%  ·  adds ${f.contribution} pts`;
    page.drawText(clean(right), { x: A4.w - M - regular.widthOfTextAtSize(clean(right), 9), y: y - 10, size: 9, font: regular, color: MUTED });
    y -= 16;
    bar(M, A4.w - 2 * M, f.score);
  }
  y -= 6;

  // Top actions
  if (report.topActions.length) {
    ensure(40);
    text("Top actions (most points first)", { size: 13, font: bold });
    report.topActions.forEach((a, i) => text(`${i + 1}. ${a}`, { size: 10, x: M + 6 }));
    y -= 8;
  }

  // Factor details
  for (const f of report.factors) {
    ensure(80);
    page.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 1, color: LINE });
    y -= 14;
    text(`${f.label} — ${f.score}/100`, { size: 13, font: bold, color: scoreRgb(f.score) });
    text(f.summary, { size: 9, color: MUTED });
    y -= 4;
    for (const c of f.checks) {
      ensure(30);
      const st = STATUS[c.status];
      page.drawRectangle({ x: M, y: y - 11, width: 46, height: 13, color: st.color, opacity: 0.12 });
      page.drawText(st.text, { x: M + 23 - bold.widthOfTextAtSize(st.text, 7) / 2, y: y - 8, size: 7, font: bold, color: st.color });
      page.drawText(clean(c.label), { x: M + 56, y: y - 9, size: 10, font: bold, color: INK });
      y -= 15;
      text(c.detail, { x: M + 56, size: 9, color: MUTED });
      y -= 2;
    }
    if (f.recommendations.length) {
      text("What to do", { size: 10, font: bold, x: M + 56 });
      for (const r of f.recommendations) text(`• ${r}`, { size: 9, x: M + 62 });
    }
    y -= 8;
  }

  // Methodology
  ensure(80);
  page.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 1, color: LINE });
  y -= 14;
  text("How this score is calculated", { size: 12, font: bold });
  for (const m of report.methodology) text(`• ${m}`, { size: 8.5, color: MUTED, x: M + 4 });

  // Footer on every page
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    const footer = clean(`${report.clinic.name} · Growth Report · Page ${i + 1} of ${pages.length}`);
    p.drawText(footer, { x: M, y: 24, size: 8, font: regular, color: MUTED });
  });

  return doc.save();
}
