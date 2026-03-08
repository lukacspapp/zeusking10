export type NormalizedSupplierStatus = 'Approved' | 'Invalid/Revoked' | 'Not Found';

export interface ParsedHmrcResult {
  businessName: string;
  statusText: string;
  hmrcSearchDateRaw: string | null;
}

export interface SignedRecordPayload {
  urn: string;
  business_name: string;
  status: NormalizedSupplierStatus;
  raw_status: string;
  hmrc_url: string;
  hmrc_search_date_raw: string | null;
  checked_at: string;
  evidence_html_sha256: string;
  checker_version: string;
}