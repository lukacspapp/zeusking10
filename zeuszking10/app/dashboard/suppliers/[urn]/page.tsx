'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  CheckCircle,
  Calendar,
  Download,
  RefreshCw,
  ArrowLeft,
  Clock,
  Loader2,
  TrendingUp,
  X,
  AlertTriangle
} from 'lucide-react';
import Toast from '../../../../components/Toast';
import { trackEvent } from '../../../../lib/analytics';
import { generateBulkPDF, generatePDF } from '../../../../lib/pdf/pdf-generator';

type SupplierStatus = 'Approved' | 'Invalid/Revoked' | 'Not Found' | 'Temporary error';

interface HistoryEntry {
  checkedAtIso: string;
  status: SupplierStatus;
  hmrcSearchDateRaw?: string;
  hmrcUrl?: string;
  rawStatus?: string;

  // ✅ tamper-evident bundle (server generated)
  recordId?: string;
  canonicalSha256?: string;
  evidenceHtmlSha256?: string;
  signatureHmacSha256?: string;
}

interface Supplier {
  urn: string;
  name: string;
  status: SupplierStatus;
  lastChecked: string; // ISO

  frequency?: string;
  history?: HistoryEntry[];

  // Latest check metadata (optional but useful)
  hmrcSearchDateRaw?: string;
  hmrcUrl?: string;
  rawStatus?: string;

  recordId?: string;
  canonicalSha256?: string;
  evidenceHtmlSha256?: string;
  signatureHmacSha256?: string;
}

type VerifyResponse = {
  urn: string;
  name?: string;
  status: SupplierStatus | string; // server might return other strings
  raw_status?: string;
  checked_at?: string;

  hmrc_url?: string;
  hmrc_search_date_raw?: string;

  record_id?: string;
  canonical_sha256?: string;
  evidence_html_sha256?: string;
  signature_hmac_sha256?: string;

  error?: string;
};

function isoNow() {
  return new Date().toISOString();
}

function normalizeAndValidateVerify(data: VerifyResponse): {
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
} | { ok: false; message: string } {
  const checkedAtIso = data.checked_at || isoNow();
  const name = data.name || 'Unknown';
  const rawStatus = data.raw_status || data.status || 'Unknown';

  const status = String(data.status || '').trim();

  const allowed: SupplierStatus[] = ['Approved', 'Invalid/Revoked', 'Not Found', 'Temporary error'];

  // If server returns something unexpected -> fail hard
  if (!allowed.includes(status as SupplierStatus)) {
    return { ok: false, message: `Unexpected status returned: "${status || 'empty'}"` };
  }

  // If it is Temporary error -> fail (as you requested)
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

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const urn = params?.urn as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [frequency, setFrequency] = useState('on-demand');
  const [checking, setChecking] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const [selectedHistory, setSelectedHistory] = useState<number[]>([]);
  const [downloadingHistory, setDownloadingHistory] = useState(false);

  const MAX_SELECTION = 10;

  useEffect(() => {
    trackEvent('page_viewed', { page: 'supplier_detail' });

    const savedSuppliers = localStorage.getItem('awrs_suppliers');
    if (savedSuppliers) {
      const suppliers: Supplier[] = JSON.parse(savedSuppliers);
      const found = suppliers.find((s) => s.urn === urn);
      if (found) {
        setSupplier(found);
        setFrequency(found.frequency || 'on-demand');
      }
    }

    const stored = localStorage.getItem('awrs_customer');
    if (stored) {
      setCustomer(JSON.parse(stored));
    }
  }, [urn]);

  const persistSupplier = (updatedSupplier: Supplier) => {
    const savedSuppliers = localStorage.getItem('awrs_suppliers');
    if (savedSuppliers) {
      const suppliers: Supplier[] = JSON.parse(savedSuppliers);
      const updated = suppliers.map((s) => (s.urn === updatedSupplier.urn ? updatedSupplier : s));
      localStorage.setItem('awrs_suppliers', JSON.stringify(updated));
    } else {
      localStorage.setItem('awrs_suppliers', JSON.stringify([updatedSupplier]));
    }
    setSupplier(updatedSupplier);
  };

  const handleManualCheck = async () => {
    if (!supplier) return;

    setChecking(true);
    try {
      const res = await fetch(`/api/verify?urn=${encodeURIComponent(supplier.urn)}`);
      const data: VerifyResponse = await res.json();

      // Fail hard if route returns non-2xx
      if (!res.ok) {
        throw new Error(data.error || `Verify failed (HTTP ${res.status})`);
      }

      const parsed = normalizeAndValidateVerify(data);
      if (!parsed.ok) {
        // ✅ Your requirement: if unknown / temporary error -> fail it
        throw new Error(parsed.message);
      }

      trackEvent('supplier_rechecked', {
        status: parsed.status,
        previous_status: supplier.status
      });

      const historyEntry: HistoryEntry = {
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

      const updatedSupplier: Supplier = {
        ...supplier,

        // latest values
        name: parsed.name || supplier.name,
        status: parsed.status,
        lastChecked: parsed.checkedAtIso,

        hmrcSearchDateRaw: parsed.hmrcSearchDateRaw,
        hmrcUrl: parsed.hmrcUrl,
        rawStatus: parsed.rawStatus,

        recordId: parsed.recordId,
        canonicalSha256: parsed.canonicalSha256,
        evidenceHtmlSha256: parsed.evidenceHtmlSha256,
        signatureHmacSha256: parsed.signatureHmacSha256,

        history: [historyEntry, ...(supplier.history || [])],
      };

      persistSupplier(updatedSupplier);

      setToastMessage('Verification completed successfully');
      setToastType('success');
      setShowToast(true);
    } catch (error: any) {
      console.error('Check failed:', error);

      trackEvent('verification_failed', {
        urn: supplier.urn,
        error: error?.message || 'unknown_error'
      });

      setToastMessage(error?.message || 'Verification failed. Please try again.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setChecking(false);
    }
  };

  const handleSaveFrequency = () => {
    if (!supplier) return;

    trackEvent('frequency_updated', {
      frequency: frequency,
      previous_frequency: supplier.frequency || 'on-demand'
    });

    const updatedSupplier: Supplier = { ...supplier, frequency };
    persistSupplier(updatedSupplier);

    const frequencyLabel = frequency.replace('-', ' ');
    setToastMessage(
      `Frequency confirmed: ${frequencyLabel.charAt(0).toUpperCase() + frequencyLabel.slice(1)}`
    );
    setToastType('success');
    setShowToast(true);
  };

  const handleSelectHistory = (index: number) => {
    if (selectedHistory.includes(index)) {
      setSelectedHistory(selectedHistory.filter((i) => i !== index));
    } else {
      if (selectedHistory.length < MAX_SELECTION) {
        setSelectedHistory([...selectedHistory, index]);
      }
    }
  };

  const handleSelectAllHistory = () => {
    if (!supplier?.history) return;

    if (selectedHistory.length === Math.min(supplier.history.length, MAX_SELECTION)) {
      setSelectedHistory([]);
    } else {
      setSelectedHistory(supplier.history.slice(0, MAX_SELECTION).map((_, i) => i));
    }
  };

  const buildPdfSupplierFromLatest = (s: Supplier): any => {
    // ✅ Pass server tamper-evident fields to PDF generator
    return {
      urn: s.urn,
      name: s.name,
      status: s.status,
      lastChecked: s.lastChecked,

      rawStatus: s.rawStatus,
      hmrcUrl: s.hmrcUrl,
      hmrcSearchDateRaw: s.hmrcSearchDateRaw,

      recordId: s.recordId,
      canonicalSha256: s.canonicalSha256,
      evidenceHtmlSha256: s.evidenceHtmlSha256,
      signatureHmacSha256: s.signatureHmacSha256,

      checkerVersion: 'unknown',
    };
  };

  const buildPdfSupplierFromHistory = (base: Supplier, entry: HistoryEntry): any => {
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
  };

  const handleDownloadSingleHistory = (index: number) => {
    if (!supplier || !supplier.history) return;

    trackEvent('certificate_downloaded', {
      type: 'single',
      supplier_has_history: (supplier.history?.length || 0) > 1
    });

    const historyItem = supplier.history[index];
    const pdfSupplier = buildPdfSupplierFromHistory(supplier, historyItem);

    generatePDF(pdfSupplier, customer?.name || 'Company');
  };

  const handleDownloadSelectedHistory = async () => {
    if (!supplier || !supplier.history || selectedHistory.length === 0) return;

    trackEvent('certificate_downloaded', {
      type: 'bulk',
      count: selectedHistory.length
    });

    setDownloadingHistory(true);
    try {
      const selectedSnapshots = selectedHistory.map((index) => {
        const entry = supplier.history![index];
        const pdfSupplier = buildPdfSupplierFromHistory(supplier, entry);
        // add date label into filename via name (your generator uses supplier.name for filename)
        return { ...pdfSupplier, name: `${supplier.name} (${entry.hmrcSearchDateRaw || entry.checkedAtIso})` };
      });

      await generateBulkPDF(selectedSnapshots, customer?.name || 'Company');

      setSelectedHistory([]);
      setToastMessage(
        `Downloaded ${selectedHistory.length} certificate${selectedHistory.length > 1 ? 's' : ''}`
      );
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error('Bulk download failed:', error);

      setToastMessage('Bulk download failed. Please try again.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setDownloadingHistory(false);
    }
  };

  if (!supplier) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  const lastCheckedDisplay = supplier.hmrcSearchDateRaw
    ? `HMRC search: ${supplier.hmrcSearchDateRaw}`
    : new Date(supplier.lastChecked).toLocaleString('en-GB');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Suppliers</span>
        </button>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{supplier.name}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1 font-mono text-sm">{supplier.urn}</p>
      </header>

      <div className="p-8 max-w-5xl">
        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-button border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Current Status</h2>
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm ${supplier.status === 'Approved'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : supplier.status === 'Temporary error'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                <CheckCircle className="w-5 h-5" />
                {supplier.status}
              </span>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                Last checked: {lastCheckedDisplay}
              </p>
            </div>

            <button
              onClick={handleManualCheck}
              disabled={checking}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-button hover:shadow-button-hover disabled:opacity-50"
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Check Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Check Frequency */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-button border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Check Frequency
          </h2>

          <div className="space-y-3">
            {['on-demand', 'daily', 'weekly', 'monthly'].map((freq) => (
              <label
                key={freq}
                className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all shadow-sm hover:shadow-button"
              >
                <input
                  type="radio"
                  name="frequency"
                  value={freq}
                  checked={frequency === freq}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize block">
                    {freq.replace('-', ' ')}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {freq === 'on-demand' && 'Manual checks only'}
                    {freq === 'daily' && 'Checked every day at 9:00 AM'}
                    {freq === 'weekly' && 'Checked every Monday at 9:00 AM'}
                    {freq === 'monthly' && 'Checked on the 1st of each month'}
                  </span>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={handleSaveFrequency}
            className="mt-4 w-full bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-button hover:shadow-button-hover flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Save Frequency
          </button>
        </div>

        {/* Selection Limit Warning */}
        {selectedHistory.length >= MAX_SELECTION && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 dark:border-amber-500 p-4 mb-6 rounded-r-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Selection Limit Reached</p>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  You can download up to {MAX_SELECTION} certificates at once. Deselect some to add others.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Check History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-button border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Check History
              </h2>

              {supplier.history && supplier.history.length > 0 && (
                <button
                  onClick={handleSelectAllHistory}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  {selectedHistory.length === Math.min(supplier.history.length, MAX_SELECTION)
                    ? 'Deselect All'
                    : `Select ${supplier.history.length > MAX_SELECTION ? 'First 10' : 'All'}`}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {selectedHistory.length > 0 ? (
                <>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedHistory.length} selected{selectedHistory.length >= MAX_SELECTION && ' (max)'}
                  </span>

                  <button
                    onClick={() => setSelectedHistory([])}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm hover:shadow-button"
                    title="Clear selection"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleDownloadSelectedHistory}
                    disabled={downloadingHistory}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-button hover:shadow-button-hover disabled:opacity-50"
                  >
                    {downloadingHistory ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download {selectedHistory.length}
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => generatePDF(buildPdfSupplierFromLatest(supplier), customer?.name || 'Company')}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all shadow-sm hover:shadow-button font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download Latest
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {supplier.history && supplier.history.length > 0 ? (
              supplier.history.map((check, i) => {
                const isSelected = selectedHistory.includes(i);
                const canSelect = isSelected || selectedHistory.length < MAX_SELECTION;

                const rowDateLabel = check.hmrcSearchDateRaw
                  ? check.hmrcSearchDateRaw
                  : new Date(check.checkedAtIso).toLocaleString('en-GB');

                return (
                  <div
                    key={i}
                    className={`p-4 flex items-center gap-4 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectHistory(i)}
                      disabled={!canSelect}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title={!canSelect ? `Maximum ${MAX_SELECTION} selections allowed` : ''}
                    />

                    <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />

                    <span
                      className={`text-sm flex-1 ${!canSelect && !isSelected
                        ? 'text-gray-400 dark:text-gray-600'
                        : 'text-gray-600 dark:text-gray-400'
                        }`}
                    >
                      {rowDateLabel}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${check.status === 'Approved'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : check.status === 'Temporary error'
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}
                    >
                      {check.status === 'Approved' ? '✅' : check.status === 'Temporary error' ? '⚠️' : '❌'} {check.status}
                    </span>

                    <button
                      onClick={() => handleDownloadSingleHistory(i)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all shadow-sm hover:shadow-button"
                      title="Download this certificate"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No check history available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}