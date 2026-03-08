'use client';

import { Clock, Download, Loader2, TrendingUp, X } from 'lucide-react';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Supplier } from '../../types/supplier';

type SupplierHistoryCardProps = {
  supplier: Supplier;
  selectedHistory: number[];
  maxSelection: number;
  downloadingHistory: boolean;
  onToggleHistory: (index: number) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDownloadLatest: () => void;
  onDownloadSingle: (index: number) => void;
  onDownloadSelected: () => void;
};

export function SupplierHistoryCard({
  supplier,
  selectedHistory,
  maxSelection,
  downloadingHistory,
  onToggleHistory,
  onSelectAll,
  onClearSelection,
  onDownloadLatest,
  onDownloadSingle,
  onDownloadSelected,
}: SupplierHistoryCardProps) {
  return (
    <SectionCard
      title="Check History"
      icon={<TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
      headerActions={
        <div className="flex items-center gap-3">
          {selectedHistory.length > 0 ? (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedHistory.length} selected
              </span>

              <button
                onClick={onClearSelection}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm hover:shadow-button"
              >
                <X className="w-4 h-4" />
              </button>

              <button
                onClick={onDownloadSelected}
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
              onClick={onDownloadLatest}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all shadow-sm hover:shadow-button font-medium"
            >
              <Download className="w-4 h-4" />
              Download Latest
            </button>
          )}
        </div>
      }
    >
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {supplier.history && supplier.history.length > 0 ? (
          <>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={onSelectAll}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                {selectedHistory.length === Math.min(supplier.history.length, maxSelection)
                  ? 'Deselect All'
                  : `Select ${supplier.history.length > maxSelection ? 'First 10' : 'All'}`}
              </button>
            </div>

            {supplier.history.map((entry, index) => {
              const isSelected = selectedHistory.includes(index);
              const canSelect = isSelected || selectedHistory.length < maxSelection;

              const rowDateLabel = entry.hmrcSearchDateRaw
                ? entry.hmrcSearchDateRaw
                : new Date(entry.checkedAtIso).toLocaleString('en-GB');

              return (
                <div
                  key={index}
                  className={`p-4 flex items-center gap-4 transition-colors ${isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleHistory(index)}
                    disabled={!canSelect}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
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

                  <StatusBadge status={entry.status} />

                  <button
                    onClick={() => onDownloadSingle(index)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all shadow-sm hover:shadow-button"
                    title="Download this certificate"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No check history available
          </div>
        )}
      </div>
    </SectionCard>
  );
}