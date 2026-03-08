'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Supplier } from '../../types/supplier';

type SupplierStatusCardProps = {
  supplier: Supplier;
  checking: boolean;
  onCheckNow: () => void;
};

export function SupplierStatusCard({
  supplier,
  checking,
  onCheckNow,
}: SupplierStatusCardProps) {
  const lastCheckedDisplay = supplier.hmrcSearchDateRaw
    ? `HMRC search: ${supplier.hmrcSearchDateRaw}`
    : new Date(supplier.lastChecked).toLocaleString('en-GB');

  return (
    <SectionCard className="p-6 mb-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Current Status
          </h2>

          <StatusBadge status={supplier.status} />

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
            Last checked: {lastCheckedDisplay}
          </p>
        </div>

        <button
          onClick={onCheckNow}
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
    </SectionCard>
  );
}