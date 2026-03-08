'use client';

import { Info, X } from 'lucide-react';

type SupplierDeleteInfoBannerProps = {
  onDismiss: () => void;
};

export function SupplierDeleteInfoBanner({
  onDismiss,
}: SupplierDeleteInfoBannerProps) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 p-5 mb-6 rounded-r-lg shadow-sm">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />

        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Managing Supplier Records
          </p>

          <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
            You can delete supplier records by selecting them and clicking the
            delete button. Common reasons to delete include:
          </p>

          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 mb-3 ml-4">
            <li>• <strong>Duplicate entries</strong> - Same supplier added multiple times</li>
            <li>• <strong>Incorrect entries</strong> - Wrong URN or test data</li>
            <li>• <strong>Old records</strong> - Suppliers you no longer work with (after 5+ years)</li>
            <li>• <strong>Business closure</strong> - Supplier no longer trading</li>
          </ul>

          <p className="text-xs text-blue-700 dark:text-blue-300 italic">
            Note: HMRC recommends keeping records for 5 years. You&apos;ll be reminded before deletion.
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded transition-colors"
        >
          <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </button>
      </div>
    </div>
  );
}