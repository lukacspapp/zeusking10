'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatsCard';
import Toast from '../../components/Toast';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useToast } from '../../hooks/useToast';
import { trackEvent } from '../../lib/analytics';
import { Supplier } from '../../types/supplier';
import { buildSupplierFromVerify, mergeSuppliersByUrn, formatLastCheckTime } from '../../utils/supplier';
import { verifySupplier, importSuppliersFile } from '../../lib/api/client/supplier';
import { BulkImportCard } from '../../components/dashboard/BulkImportCard';
import { QuickVerifyCard } from '../../components/dashboard/QuickVerifyCard';
import { RecentVerificationsCard } from '../../components/dashboard/RecentVerificationsCard';

export default function DashboardPage() {
  const { suppliers, setSuppliers } = useSuppliers();
  const { showToast, toastMessage, toastType, openToast, closeToast } = useToast();

  const [urnInput, setUrnInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const stats = useMemo(() => {
    return {
      total: suppliers.length,
      approved: suppliers.filter((supplier) => supplier.status === 'Approved').length,
      pending: suppliers.filter((supplier) => supplier.status !== 'Approved').length,
      lastCheck: suppliers[0]?.lastChecked || null,
    };
  }, [suppliers]);

  const handleVerify = async () => {
    if (!urnInput.trim()) return;

    setLoading(true);

    try {
      const data = await verifySupplier(urnInput.trim());

      trackEvent('urn_verified', {
        status: data.status,
        urn_format: data.urn ? 'valid' : 'invalid',
      });

      const newSupplier = buildSupplierFromVerify(data);
      const updatedSuppliers = mergeSuppliersByUrn(suppliers, [newSupplier]);

      setSuppliers(updatedSuppliers);
      setUrnInput('');
      openToast(`Verified: ${data.name || data.urn}`, 'success');
    } catch (error) {
      console.error('Verification failed:', error);

      trackEvent('verification_failed', {
        error: 'api_error',
      });

      openToast('Verification failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadLoading(true);

    try {
      const data = await importSuppliersFile(file);

      if (data.success && data.suppliers && data.suppliers.length > 0) {
        const newSuppliers: Supplier[] = [];
        const verifiedNames: string[] = [];

        for (const imported of data.suppliers) {
          try {
            const verifyData = await verifySupplier(imported.urn);
            const newSupplier = buildSupplierFromVerify(verifyData, imported.name);

            newSuppliers.push(newSupplier);
            verifiedNames.push(verifyData.name || verifyData.urn);
          } catch (error) {
            console.error(`Failed to verify ${imported.urn}:`, error);
          }
        }

        if (newSuppliers.length > 0) {
          const updatedSuppliers = mergeSuppliersByUrn(suppliers, newSuppliers);
          setSuppliers(updatedSuppliers);

          trackEvent('bulk_import_completed', {
            count: newSuppliers.length,
            file_type: file.name.endsWith('.csv') ? 'csv' : 'excel',
          });

          if (newSuppliers.length === 1) {
            openToast(`Imported 1 supplier: ${verifiedNames[0]}`, 'success');
          } else if (newSuppliers.length <= 3) {
            openToast(`Imported ${newSuppliers.length} suppliers: ${verifiedNames.join(', ')}`, 'success');
          } else {
            openToast(
              `Imported ${newSuppliers.length} suppliers: ${verifiedNames.slice(0, 2).join(', ')} and ${newSuppliers.length - 2} more`,
              'success'
            );
          }
        } else {
          openToast('No suppliers could be verified', 'error');
        }

        return;
      }

      if (data.error) {
        openToast(data.error, 'error');
        return;
      }

      openToast('No AWRS numbers found in file', 'info');
    } catch (error: any) {
      console.error('Import failed:', error);

      trackEvent('bulk_import_failed', {
        error: error.message,
      });

      openToast(`Failed to import: ${error.message}`, 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {showToast && <Toast message={toastMessage} type={toastType} onClose={closeToast} />}

      <PageHeader
        title="Dashboard"
        description="Quick verification and compliance overview"
      />

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard label="Total Suppliers" value={stats.total} icon={FileText} />
          <StatCard
            label="Approved"
            value={stats.approved}
            icon={CheckCircle}
            valueClassName="text-green-600 dark:text-green-400"
            iconClassName="text-green-500 dark:text-green-400"
          />
          <StatCard
            label="Needs Review"
            value={stats.pending}
            icon={AlertTriangle}
            valueClassName="text-amber-600 dark:text-amber-400"
            iconClassName="text-amber-500 dark:text-amber-400"
          />
          <StatCard
            label="Last Check"
            value={stats.lastCheck ? formatLastCheckTime(stats.lastCheck) : 'No checks yet'}
            icon={Clock}
            valueClassName="text-lg font-semibold text-gray-900 dark:text-white"
            iconClassName="text-purple-500 dark:text-purple-400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickVerifyCard
            urnInput={urnInput}
            setUrnInput={setUrnInput}
            loading={loading}
            onVerify={handleVerify}
          />

          <BulkImportCard
            uploadLoading={uploadLoading}
            dragActive={dragActive}
            setDragActive={setDragActive}
            onUpload={handleFileUpload}
            onInvalidFile={() => openToast('Please upload a CSV or Excel file', 'error')}
          />
        </div>

        <RecentVerificationsCard suppliers={suppliers} />
      </div>
    </div>
  );
}