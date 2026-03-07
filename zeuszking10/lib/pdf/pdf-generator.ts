import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { sanitizeFileNamePart } from './helpers';
import {
  drawHeader,
  drawStatusSection,
  drawDivider,
  drawSupplierInfoTable,
  drawStatement,
  drawVerificationDetailsBox,
  drawFooter,
} from './draw';

export interface Supplier {
  urn: string;
  name: string;
  status: string;
  lastChecked: string;
  rawStatus?: string;
  hmrcUrl?: string;
  hmrcSearchDateRaw?: string;
  recordId?: string;
  canonicalSha256?: string;
  evidenceHtmlSha256?: string;
  signatureHmacSha256?: string;
  checkerVersion?: string;
}

export async function generatePDF(supplier: Supplier, companyName: string) {
  const doc = new jsPDF();

  drawHeader(doc, companyName);
  drawStatusSection(doc, supplier);

  drawDivider(doc, 125);

  const tableBottomY = drawSupplierInfoTable(doc, supplier);

  const dividerY = tableBottomY + 6;
  drawDivider(doc, dividerY);

  const statementBottomY = drawStatement(doc, supplier, dividerY + 12);

  drawVerificationDetailsBox(doc, supplier, statementBottomY + 6);

  drawFooter(doc, supplier);

  const fileName = `AWRS-Record-${sanitizeFileNamePart(supplier.name)}-${supplier.urn}.pdf`;
  doc.save(fileName);
}

export async function generateBulkPDF(suppliers: Supplier[], companyName: string) {
  const zip = new JSZip();
  let pdfCount = 0;

  for (let i = 0; i < suppliers.length; i++) {
    const supplier = suppliers[i];

    try {
      const doc = new jsPDF();

      drawHeader(doc, companyName);
      drawStatusSection(doc, supplier);

      drawDivider(doc, 125);

      const tableBottomY = drawSupplierInfoTable(doc, supplier);

      const dividerY = tableBottomY + 6;
      drawDivider(doc, dividerY);

      const statementBottomY = drawStatement(doc, supplier, dividerY + 12);

      drawVerificationDetailsBox(doc, supplier, statementBottomY + 6);

      drawFooter(doc, supplier);

      const pdfBlob = doc.output('blob');

      const sanitizedName = sanitizeFileNamePart(supplier.name);
      const uniqueId = supplier.recordId || `${Date.now()}-${i}`; // filename only
      const fileName = `${i + 1}-${sanitizedName}-${supplier.urn}-${uniqueId}.pdf`;

      zip.file(fileName, pdfBlob);
      pdfCount++;

      await new Promise((resolve) => setTimeout(resolve, 10));
    } catch (error) {
      console.error(`❌ Error generating PDF for ${supplier.name}:`, error);
    }
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `AWRS-Records-${new Date().toISOString().split('T')[0]}-${pdfCount}files.zip`;
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}