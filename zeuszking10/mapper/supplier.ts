import { Supplier, SupplierHistoryEntry } from "../types/supplier";

export function buildPdfSupplierFromLatest(supplier: Supplier) {
  return {
    urn: supplier.urn,
    name: supplier.name,
    status: supplier.status,
    lastChecked: supplier.lastChecked,
    rawStatus: supplier.rawStatus,
    hmrcUrl: supplier.hmrcUrl,
    hmrcSearchDateRaw: supplier.hmrcSearchDateRaw,
    recordId: supplier.recordId,
    canonicalSha256: supplier.canonicalSha256,
    evidenceHtmlSha256: supplier.evidenceHtmlSha256,
    signatureHmacSha256: supplier.signatureHmacSha256,
    checkerVersion: 'unknown',
  };
}

export function buildPdfSupplierFromHistory(base: Supplier, entry: SupplierHistoryEntry) {
  return {
    urn: base.urn,
    name: base.name,
    status: entry.status,
    lastChecked: entry.checkedAtIso,
    rawStatus: entry.rawStatus,
    hmrcUrl: entry.hmrcUrl,
    hmrcSearchDateRaw: entry.hmrcSearchDateRaw,
    recordId: entry.recordId,
    canonicalSha256: entry.canonicalSha256,
    evidenceHtmlSha256: entry.evidenceHtmlSha256,
    signatureHmacSha256: entry.signatureHmacSha256,
    checkerVersion: 'unknown',
  };
}