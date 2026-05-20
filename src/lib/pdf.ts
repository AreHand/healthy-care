import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CalcInput, CalcResult } from "./health";
import { ACTIVITY_LABELS, recommendationFor } from "./health";

interface PDFOptions {
  input: CalcInput;
  result: CalcResult;
  displayName?: string;
  unitPreference: "metric" | "imperial";
}

const MINT = [34, 167, 130] as const;
const EMBER = [231, 126, 60] as const;
const DARK = [22, 38, 45] as const;
const MUTED = [110, 124, 130] as const;
const SKY = [223, 238, 248] as const;
const BG = [248, 252, 250] as const;

function setFill(doc: jsPDF, c: readonly number[]) {
  doc.setFillColor(c[0], c[1], c[2]);
}
function setText(doc: jsPDF, c: readonly number[]) {
  doc.setTextColor(c[0], c[1], c[2]);
}

export function buildPDF({ input, result, displayName, unitPreference }: PDFOptions) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background
  setFill(doc, BG);
  doc.rect(0, 0, W, H, "F");

  // Header band
  setFill(doc, MINT);
  doc.rect(0, 0, W, 38, "F");
  setFill(doc, EMBER);
  doc.circle(W - 18, 19, 22, "F");
  setFill(doc, MINT);
  doc.circle(W - 18, 19, 18, "F");

  setText(doc, [255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("FitLife Health Report", 14, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 26);
  if (displayName) doc.text(`For: ${displayName}`, 14, 32);

  // Summary cards row
  let y = 48;
  const cardW = (W - 14 * 2 - 8) / 2;

  const drawCard = (x: number, yy: number, label: string, value: string, accent: readonly number[]) => {
    setFill(doc, [255, 255, 255]);
    doc.roundedRect(x, yy, cardW, 32, 3, 3, "F");
    setFill(doc, accent);
    doc.roundedRect(x, yy, 4, 32, 2, 2, "F");
    setText(doc, MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(label, x + 10, yy + 10);
    setText(doc, DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(value, x + 10, yy + 24);
  };

  drawCard(14, y, "BMI", result.bmi.toFixed(1), MINT);
  drawCard(14 + cardW + 8, y, "Kategori", result.category, EMBER);
  y += 38;
  drawCard(14, y, "Berat Ideal", `${result.idealWeightKg.toFixed(1)} kg`, MINT);
  drawCard(14 + cardW + 8, y, "Kalori / hari", `${result.dailyCalories} kkal`, EMBER);
  y += 44;

  // Input table
  setText(doc, DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Data Input", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Field", "Nilai"]],
    body: [
      ["Jenis kelamin", input.gender === "male" ? "Pria" : "Wanita"],
      ["Usia", `${input.age} tahun`],
      ["Berat badan", `${input.weightKg.toFixed(1)} kg`],
      ["Tinggi badan", `${input.heightCm.toFixed(1)} cm`],
      ["Tingkat aktivitas", ACTIVITY_LABELS[input.activity]],
      ["Preferensi satuan", unitPreference],
      ["BMR", `${result.bmr} kkal`],
    ],
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [MINT[0], MINT[1], MINT[2]], textColor: 255 },
    alternateRowStyles: { fillColor: [SKY[0], SKY[1], SKY[2]] },
    margin: { left: 14, right: 14 },
  });

  // @ts-expect-error lastAutoTable provided by plugin
  y = (doc.lastAutoTable?.finalY ?? y) + 10;

  // BMI scale bar
  setText(doc, DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Skala BMI", 14, y);
  y += 4;

  const barX = 14;
  const barW = W - 28;
  const barH = 6;
  const segments: { upTo: number; color: readonly number[]; label: string }[] = [
    { upTo: 18.5, color: [110, 168, 254], label: "Under" },
    { upTo: 25, color: MINT, label: "Normal" },
    { upTo: 30, color: [240, 180, 41], label: "Over" },
    { upTo: 40, color: [220, 80, 80], label: "Obese" },
  ];
  const minB = 10, maxB = 40;
  let prevX = barX;
  for (const seg of segments) {
    const segEnd = barX + ((seg.upTo - minB) / (maxB - minB)) * barW;
    setFill(doc, seg.color);
    doc.rect(prevX, y, segEnd - prevX, barH, "F");
    prevX = segEnd;
  }
  // marker
  const markerX = barX + ((Math.min(maxB, Math.max(minB, result.bmi)) - minB) / (maxB - minB)) * barW;
  setFill(doc, DARK);
  doc.triangle(markerX - 2, y - 1, markerX + 2, y - 1, markerX, y + 2, "F");
  setText(doc, MUTED);
  doc.setFontSize(8);
  doc.text("10", barX, y + barH + 4);
  doc.text("18.5", barX + ((18.5 - minB) / (maxB - minB)) * barW - 3, y + barH + 4);
  doc.text("25", barX + ((25 - minB) / (maxB - minB)) * barW - 2, y + barH + 4);
  doc.text("30", barX + ((30 - minB) / (maxB - minB)) * barW - 2, y + barH + 4);
  doc.text("40", barX + barW - 4, y + barH + 4);
  y += barH + 12;

  // Recommendations
  const rec = recommendationFor(result.category);
  setText(doc, DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Rekomendasi: " + rec.title, 14, y);
  y += 6;
  setText(doc, [55, 65, 70]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  rec.tips.forEach((t) => {
    const lines = doc.splitTextToSize("• " + t, W - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 2;
  });

  // Disclaimer + footer
  y = H - 22;
  setFill(doc, SKY);
  doc.roundedRect(14, y, W - 28, 14, 2, 2, "F");
  setText(doc, [60, 80, 90]);
  doc.setFontSize(8);
  doc.text(
    "Disclaimer: Laporan ini bersifat edukatif dan bukan pengganti saran medis profesional. Konsultasikan kondisi kesehatan Anda dengan tenaga medis terkualifikasi.",
    18,
    y + 5,
    { maxWidth: W - 36 }
  );

  // Page footer
  setText(doc, MUTED);
  doc.setFontSize(8);
  doc.text("FitLife • fitlife.app", 14, H - 5);
  doc.text("Halaman 1 / 1", W - 14, H - 5, { align: "right" });

  return doc;
}

export function downloadPDF(opts: PDFOptions, filename = "fitlife-report.pdf") {
  buildPDF(opts).save(filename);
}
