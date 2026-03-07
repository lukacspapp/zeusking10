import jsPDF from 'jspdf';
import type { Supplier } from './pdf-generator';
import {
  formatDateGB,
  isApprovedStatus,
  setStatusColor,
  shortenHash,
  safeLine,
} from './helpers';

// -------------------- Badge Drawing --------------------

export function drawCheckmarkBadge(doc: jsPDF, x: number, y: number, size: number) {
  doc.setFillColor(22, 163, 74);
  doc.circle(x, y, size, 'F');

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2.5);
  doc.circle(x, y, size - 2, 'S');

  const verticalOffset = size * 0.0;
  const horizontalOffset = size * -0.02;
  const lineWidth = 3.5;

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(lineWidth);
  doc.setLineCap('round');
  doc.setLineJoin('round');

  const checkWidth = size * 0.7;

  const leftX = x - checkWidth * 0.3 + horizontalOffset;
  const leftY = y + verticalOffset;
  const midX = x - checkWidth * 0.05 + horizontalOffset;
  const midY = y + checkWidth * 0.35 + verticalOffset;
  const rightX = x + checkWidth * 0.4 + horizontalOffset;
  const rightY = y - checkWidth * 0.3 + verticalOffset;

  doc.line(leftX, leftY, midX, midY);
  doc.line(midX, midY, rightX, rightY);
}

export function drawInvalidBadge(doc: jsPDF, x: number, y: number, size: number) {
  doc.setFillColor(220, 38, 38);
  doc.circle(x, y, size, 'F');

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2.5);
  doc.circle(x, y, size - 2, 'S');

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(3.5);
  doc.setLineCap('round');

  const r = size * 0.45;
  doc.line(x - r, y - r, x + r, y + r);
  doc.line(x - r, y + r, x + r, y - r);
}

// -------------------- Layout --------------------

export function drawHeader(doc: jsPDF, companyName: string) {
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 210, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 105, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('AWRS Verification Record', 105, 32, { align: 'center' });

  doc.setTextColor(0, 0, 0);
}

export function drawDivider(doc: jsPDF, y: number) {
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(30, y, 180, y);
}

export function drawStatusSection(doc: jsPDF, supplier: Supplier) {
  const approved = isApprovedStatus(supplier.status);

  if (approved) drawCheckmarkBadge(doc, 105, 75, 18);
  else drawInvalidBadge(doc, 105, 75, 18);

  setStatusColor(doc, approved);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(`AWRS STATUS: ${supplier.status.toUpperCase()}`, 105, 110, { align: 'center' });

  doc.setTextColor(0, 0, 0);
}

export function drawSupplierInfoTable(doc: jsPDF, supplier: Supplier) {
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Supplier Information:', 30, 150);

  const labelX = 30;
  const valueX = 85;
  let y = 170;
  const rowGap = 14;

  const checkDate = supplier.hmrcSearchDateRaw
    ? supplier.hmrcSearchDateRaw
    : formatDateGB(supplier.lastChecked);

  const rows: Array<{ label: string; value: string; valueColor?: 'green' | 'red' }> = [
    { label: 'Business Name:', value: supplier.name },
    { label: 'AWRS URN:', value: supplier.urn },
    {
      label: 'Status:',
      value: supplier.status,
      valueColor: isApprovedStatus(supplier.status) ? 'green' : 'red',
    },
    { label: 'Check Date:', value: checkDate },
  ];

  doc.setFontSize(11);

  for (const row of rows) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(row.label, labelX, y);

    doc.setFont('helvetica', 'normal');
    if (row.valueColor === 'green') doc.setTextColor(22, 163, 74);
    else if (row.valueColor === 'red') doc.setTextColor(220, 38, 38);
    else doc.setTextColor(0, 0, 0);

    const linesUsed = safeLine(doc, valueX, y, row.value, 95);
    y += rowGap + (linesUsed - 1) * 5;
  }

  doc.setTextColor(0, 0, 0);
  return y; // bottom of table
}

export function drawStatement(doc: jsPDF, supplier: Supplier, y: number) {
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');

  const when = supplier.hmrcSearchDateRaw || formatDateGB(supplier.lastChecked);
  const raw = supplier.rawStatus || supplier.status;

  const statement =
    `This record confirms that on ${when}, the AWRS URN above was checked using the HMRC ` +
    `online AWRS check service, and the status returned at the time of the check was "${raw}".`;

  const lines = doc.splitTextToSize(statement, 150);
  doc.text(lines, 30, y);

  return y + lines.length * 5 + 6;
}

export function drawVerificationDetailsBox(doc: jsPDF, supplier: Supplier, y: number) {
  const footerTop = 274;
  const boxHeight = 36;
  const boxY = Math.min(y, footerTop - boxHeight - 4);

  doc.setDrawColor(235, 235, 235);
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(30, boxY, 150, boxHeight, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'bold');
  doc.text('Verification Details:', 34, boxY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  const hmrcUrl = supplier.hmrcUrl || 'NOT AVAILABLE';

  const recordId = supplier.recordId || 'NOT AVAILABLE';
  const evidenceShort = shortenHash(supplier.evidenceHtmlSha256);
  const canonicalShort = shortenHash(supplier.canonicalSha256);
  const sigShort = shortenHash(supplier.signatureHmacSha256);

  const lines: string[] = [
    supplier.hmrcSearchDateRaw ? `HMRC search date: ${supplier.hmrcSearchDateRaw}` : undefined,
    `HMRC URL: ${hmrcUrl}`,
    `Record ID: ${recordId}`,
    `HMRC HTML SHA-256: ${evidenceShort}`,
    `Canonical SHA-256: ${canonicalShort}`,
    `Signature: ${sigShort}`,
  ].filter(Boolean) as string[];

  const wrapped = doc.splitTextToSize(lines.join('\n'), 146);
  doc.text(wrapped, 34, boxY + 16);

  doc.setTextColor(0, 0, 0);

  return boxY + boxHeight + 6;
}

export function drawFooter(doc: jsPDF, supplier: Supplier) {
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');

  const recordId = supplier.recordId || 'NOT AVAILABLE';
  const generatedAt = new Date().toLocaleString('en-GB', { hour12: false });

  doc.text('Record generated by AWRS Compliance Portal', 105, 282, { align: 'center' });
  doc.text(`Record ID: ${recordId}`, 105, 288, { align: 'center' });
  doc.text(`Generated: ${generatedAt}`, 105, 294, { align: 'center' });

  doc.setTextColor(0, 0, 0);
}