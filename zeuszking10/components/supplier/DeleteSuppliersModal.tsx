'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import { Supplier } from '../../types/supplier';

type DeleteSuppliersModalProps = {
  suppliers: Supplier[];
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteSuppliersModal({
  suppliers,
  onCancel,
  onConfirm,
}: DeleteSuppliersModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete {suppliers.length} Supplier{suppliers.length > 1 ? 's' : ''}?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You are about to delete the following supplier{suppliers.length > 1 ? 's' : ''}:
            </p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
          <div className="space-y-2">
            {suppliers.map((supplier) => (
              <div
                key={supplier.urn}
                className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {supplier.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {supplier.urn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 dark:border-amber-500 p-4 mb-4">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-2">
            ⚠️ HMRC Compliance Reminder
          </p>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            HMRC regulations recommend maintaining supplier verification records for up to <strong>5 years</strong> for compliance and audit purposes.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 p-4 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>You can still delete</strong> if you&apos;re certain you no longer need these records.
          </p>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6 font-medium">
          Do you want to proceed with deletion?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium shadow-button hover:shadow-button-hover"
          >
            Keep Records
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-all font-medium shadow-button hover:shadow-button-hover flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}