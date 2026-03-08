'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Toast from '@/components/Toast';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { PageHeader } from '@/components/common/PageHeader';
import { trackEvent } from '@/lib/analytics';

import { verifySupplier } from '../../../../lib/api/client/supplier';
import { getStoredSuppliers, getStoredCustomer, saveSuppliers } from '../../../../lib/db/supplierRepository';
import { VerifyResponse, SupplierHistoryEntry, Supplier } from '../../../../types/supplier';
import { normalizeAndValidateVerify } from '../../../../utils/supplier';
import { generatePDF, generateBulkPDF } from '../../../../lib/pdf/pdf-generator';
import { SupplierFrequencyCard } from '../../../../components/supplier/SupplierFrequencyCard';
import { SupplierHistoryCard } from '../../../../components/supplier/SupplierHistoryCard';
import { SupplierStatusCard } from '../../../../components/supplier/SupplierStatusCard';

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const urn = params?.urn as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [customer, setCustomer] = useState<{ name: string } | null>(null);
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

    const suppliers = getStoredSuppliers();
    const found = suppliers.find((item) => item.urn === urn);

    if (found) {
      setSupplier(found);
      setFrequency(found.frequency || 'on-demand');
    }

    setCustomer(getStoredCustomer());
  }, [urn]);

  const openToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const persistSupplier = (updatedSupplier: Supplier) => {
    const suppliers = getStoredSuppliers();
    const existing = suppliers.find((item) => item.urn === updatedSupplier.urn);

    const updated = existing
      ? suppliers.map((item) => (item.urn === updatedSupplier.urn ? updatedSupplier : item))
      : [updatedSupplier, ...suppliers];

    saveSuppliers(updated);
    setSupplier(updatedSupplier);
  };

  const handleManualCheck = async () => {
    if (!supplier) return;

    setChecking(true);

    try {
      const data: VerifyResponse = await verifySupplier(supplier.urn);
      const parsed = normalizeAndValidateVerify(data);

      if (!parsed.ok) {
        throw new Error(parsed.message);
      }

      trackEvent('supplier_rechecked', {
        status: parsed.status,
        previous_status: supplier.status,
      });

      const historyEntry: SupplierHistoryEntry = {
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
      openToast('Verification completed successfully', 'success');
    } catch (error: any) {
      console.error('Check failed:', error);

      trackEvent('verification_failed', {
        urn: supplier.urn,
        error: error?.message || 'unknown_error',
      });

      openToast(error?.message || 'Verification failed. Please try again.', 'error');
    } finally {
      setChecking(false);
    }
  };

  const handleSaveFrequency = () => {
    if (!supplier) return;

    trackEvent('frequency_updated', {
      frequency,
      previous_frequency: supplier.frequency || 'on-demand',
    });

    const updatedSupplier: Supplier = { ...supplier, frequency };
    persistSupplier(updatedSupplier);

    const label = frequency.replace('-', ' ');
    openToast(`Frequency confirmed: ${label.charAt(0).toUpperCase() + label.slice(1)}`, 'success');
  };

  const handleToggleHistory = (index: number) => {
    setSelectedHistory((prev) => {
      if (prev.includes(index)) {
        return prev.filter((item) => item !== index);
      }

      if (prev.length < MAX_SELECTION) {
        return [...prev, index];
      }

      return prev;
    });
  };

  const handleSelectAllHistory = () => {
    if (!supplier?.history) return;

    if (selectedHistory.length === Math.min(supplier.history.length, MAX_SELECTION)) {
      setSelectedHistory([]);
      return;
    }

    setSelectedHistory(supplier.history.slice(0, MAX_SELECTION).map((_, index) => index));
  };

  const buildPdfSupplierFromLatest = (currentSupplier: Supplier) => ({
    urn: currentSupplier.urn,
    name: currentSupplier.name,
    status: currentSupplier.status,
    lastChecked: currentSupplier.lastChecked,
    rawStatus: currentSupplier.rawStatus,
    hmrcUrl: currentSupplier.hmrcUrl,
    hmrcSearchDateRaw: currentSupplier.hmrcSearchDateRaw,
    recordId: currentSupplier.recordId,
    canonicalSha256: currentSupplier.canonicalSha256,
    evidenceHtmlSha256: currentSupplier.evidenceHtmlSha256,
    signatureHmacSha256: currentSupplier.signatureHmacSha256,
    checkerVersion: 'unknown',
  });

  const buildPdfSupplierFromHistory = (
    base: Supplier,
    entry: SupplierHistoryEntry
  ) => ({
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
  });

  const handleDownloadSingleHistory = (index: number) => {
    if (!supplier || !supplier.history) return;

    trackEvent('certificate_downloaded', {
      type: 'single',
      supplier_has_history: (supplier.history?.length || 0) > 1,
    });

    const item = supplier.history[index];
    generatePDF(buildPdfSupplierFromHistory(supplier, item), customer?.name || 'Company');
  };

  const handleDownloadSelectedHistory = async () => {
    if (!supplier || !supplier.history || selectedHistory.length === 0) return;

    trackEvent('certificate_downloaded', {
      type: 'bulk',
      count: selectedHistory.length,
    });

    setDownloadingHistory(true);

    try {
      const selectedSnapshots = selectedHistory.map((index) => {
        const entry = supplier.history![index];
        const pdfSupplier = buildPdfSupplierFromHistory(supplier, entry);

        return {
          ...pdfSupplier,
          name: `${supplier.name} (${entry.hmrcSearchDateRaw || entry.checkedAtIso})`,
        };
      });

      await generateBulkPDF(selectedSnapshots, customer?.name || 'Company');

      setSelectedHistory([]);
      openToast(
        `Downloaded ${selectedHistory.length} certificate${selectedHistory.length > 1 ? 's' : ''}`,
        'success'
      );
    } catch (error) {
      console.error('Bulk download failed:', error);
      openToast('Bulk download failed. Please try again.', 'error');
    } finally {
      setDownloadingHistory(false);
    }
  };

  if (!supplier) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      <PageHeader
        title={supplier.name}
        description={supplier.urn}
        backButton={
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Suppliers</span>
          </button>
        }
      />

      <div className="p-8 max-w-5xl">
        <SupplierStatusCard
          supplier={supplier}
          checking={checking}
          onCheckNow={handleManualCheck}
        />

        <SupplierFrequencyCard
          frequency={frequency}
          onChange={setFrequency}
          onSave={handleSaveFrequency}
        />

        <SupplierHistoryCard
          supplier={supplier}
          selectedHistory={selectedHistory}
          maxSelection={MAX_SELECTION}
          downloadingHistory={downloadingHistory}
          onToggleHistory={handleToggleHistory}
          onSelectAll={handleSelectAllHistory}
          onClearSelection={() => setSelectedHistory([])}
          onDownloadLatest={() =>
            generatePDF(buildPdfSupplierFromLatest(supplier), customer?.name || 'Company')
          }
          onDownloadSingle={handleDownloadSingleHistory}
          onDownloadSelected={handleDownloadSelectedHistory}
        />
      </div>
    </div>
  );
}