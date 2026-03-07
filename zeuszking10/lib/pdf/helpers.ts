import jsPDF from 'jspdf';

export function formatDateGB(dateLike: string) {
  return new Date(dateLike).toLocaleDateString('en-GB');
}

export function formatDateTimeGB(dateTimeLike: string) {
  return new Date(dateTimeLike).toLocaleString('en-GB', { hour12: false });
}

export function isApprovedStatus(status: string) {
  return status.toLowerCase().includes('approved');
}

export function setStatusColor(doc: jsPDF, approved: boolean) {
  if (approved) doc.setTextColor(22, 163, 74);
  else doc.setTextColor(220, 38, 38);
}

export function sanitizeFileNamePart(input: string) {
  return (input || '')
    .replace(/[^a-z0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 80);
}

export function shortenHash(hash?: string, left = 10, right = 10) {
  if (!hash) return 'NOT AVAILABLE';
  if (hash.length <= left + right + 3) return hash;
  return `${hash.slice(0, left)}...${hash.slice(-right)}`;
}

export function safeLine(doc: jsPDF, x: number, y: number, text: string, maxWidth: number) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return lines.length;
}