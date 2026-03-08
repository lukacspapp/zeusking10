import { Supplier, SupplierHistoryEntry, SupplierStatus, VerifyResponse } from '../types/supplier'

export function nowIso() {
  return new Date().toISOString();
}

export function todayIsoDate() {
  return nowIso().split('T')[0];
}

export function getSupplierStatusVariant(status: string) {
  if (status === 'Approved') return 'approved';
  if (status === 'Temporary error') return 'warning';
  return 'rejected';
}

export function formatLastCheckTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatLastCheckDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB');
}

export function formatLastCheckDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB');
}

export function pickCheckTimestamp(data: VerifyResponse) {
  return data.checked_at || nowIso();
}

export function pickHistoryDate(data: VerifyResponse) {
  if (data.hmrc_search_date_raw) {
    return todayIsoDate();
  }

  return todayIsoDate();
}

export function normalizeAndValidateVerify(data: VerifyResponse):
  | {
    ok: true;
    status: SupplierStatus;
    checkedAtIso: string;
    name: string;
    rawStatus: string;
    hmrcUrl?: string;
    hmrcSearchDateRaw?: string;
    recordId?: string;
    canonicalSha256?: string;
    evidenceHtmlSha256?: string;
    signatureHmacSha256?: string;
  }
  | { ok: false; message: string } {
  const checkedAtIso = data.checked_at || nowIso();
  const name = data.name || 'Unknown';
  const rawStatus = data.raw_status || data.status || 'Unknown';
  const status = String(data.status || '').trim();

  const allowed: SupplierStatus[] = [
    'Approved',
    'Invalid/Revoked',
    'Not Found',
    'Temporary error',
  ];

  if (!allowed.includes(status as SupplierStatus)) {
    return { ok: false, message: `Unexpected status returned: "${status || 'empty'}"` };
  }

  if (status === 'Temporary error') {
    return { ok: false, message: data.error || 'Temporary error contacting HMRC. Please try again.' };
  }

  return {
    ok: true,
    status: status as SupplierStatus,
    checkedAtIso,
    name,
    rawStatus,
    hmrcUrl: data.hmrc_url,
    hmrcSearchDateRaw: data.hmrc_search_date_raw || undefined,
    recordId: data.record_id,
    canonicalSha256: data.canonical_sha256,
    evidenceHtmlSha256: data.evidence_html_sha256,
    signatureHmacSha256: data.signature_hmac_sha256,
  };
}

export function buildSupplierFromVerify(
  data: VerifyResponse,
  fallbackName?: string
): Supplier {
  const checkedAtIso = pickCheckTimestamp(data);

  const historyEntry: SupplierHistoryEntry = {
    checkedAtIso,
    status: data.status as SupplierStatus,
    hmrcSearchDateRaw: data.hmrc_search_date_raw || undefined,
    hmrcUrl: data.hmrc_url || undefined,
    rawStatus: data.raw_status || undefined,

    recordId: data.record_id || undefined,
    canonicalSha256: data.canonical_sha256 || undefined,
    evidenceHtmlSha256: data.evidence_html_sha256 || undefined,
    signatureHmacSha256: data.signature_hmac_sha256 || undefined,
  };

  return {
    urn: data.urn,
    name: data.name || fallbackName || 'Unknown',
    status: data.status,
    lastChecked: checkedAtIso,

    hmrcSearchDateRaw: data.hmrc_search_date_raw || undefined,
    hmrcSearchDateIso: data.hmrc_search_date_iso || undefined,
    hmrcUrl: data.hmrc_url || undefined,
    rawStatus: data.raw_status || undefined,

    recordId: data.record_id || undefined,
    canonicalSha256: data.canonical_sha256 || undefined,
    evidenceHtmlSha256: data.evidence_html_sha256 || undefined,
    signatureHmacSha256: data.signature_hmac_sha256 || undefined,

    history: [historyEntry],
  };
}
export function mergeSuppliersByUrn(existing: Supplier[], incoming: Supplier[]) {
  const incomingUrns = new Set(incoming.map((supplier) => supplier.urn));
  const filteredExisting = existing.filter((supplier) => !incomingUrns.has(supplier.urn));
  return [...incoming, ...filteredExisting];
}

export function buildHistoryEntryFromParsed(parsed: Extract<ReturnType<typeof normalizeAndValidateVerify>, { ok: true }>): SupplierHistoryEntry {
  return {
    checkedAtIso: parsed.checkedAtIso,
    status: parsed.status,
    hmrcSearchDateRaw: parsed.hmrcSearchDateRaw,
    hmrcUrl: parsed.hmrcUrl,
    rawStatus: parsed.rawStatus,
    recordId: parsed.recordId,
    canonicalSha256: parsed.canonicalSha256,
    evidenceHtmlSha256: parsed.evidenceHtmlSha256,
    signatureHmacSha256: parsed.signatureHmacSha256,
  };
}