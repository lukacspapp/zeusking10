export type SupplierStatus =
  | 'Approved'
  | 'Invalid/Revoked'
  | 'Not Found'
  | 'Temporary error';

export interface SupplierHistoryEntry {
  checkedAtIso: string;
  status: SupplierStatus;
  hmrcSearchDateRaw?: string;
  hmrcUrl?: string;
  rawStatus?: string;
  recordId?: string;
  canonicalSha256?: string;
  evidenceHtmlSha256?: string;
  signatureHmacSha256?: string;
}

export interface Supplier {
  urn: string;
  name: string;
  status: SupplierStatus | string;
  lastChecked: string;
  frequency?: string;
  history?: SupplierHistoryEntry[];

  hmrcSearchDateRaw?: string;
  hmrcSearchDateIso?: string;
  hmrcUrl?: string;
  rawStatus?: string;

  recordId?: string;
  canonicalSha256?: string;
  evidenceHtmlSha256?: string;
  signatureHmacSha256?: string;
}

export interface VerifyResponse {
  urn: string;
  name?: string;
  status: string;
  raw_status?: string;
  checked_at?: string;
  hmrc_url?: string;
  hmrc_search_date_raw?: string;
  hmrc_search_date_iso?: string;
  record_id?: string;
  canonical_sha256?: string;
  evidence_html_sha256?: string;
  signature_hmac_sha256?: string;
  error?: string;
}

export interface CustomerTheme {
  name: string;
  color: string;
}