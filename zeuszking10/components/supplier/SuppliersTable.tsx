'use client';

import { ChevronRight, FileText } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Supplier } from '../../types/supplier';

type SuppliersTableProps = {
  suppliers: Supplier[];
  selected: string[];
  onSelectAll: () => void;
  onSelect: (urn: string) => void;
  onOpenSupplier: (urn: string) => void;
};

export function SuppliersTable({
  suppliers,
  selected,
  onSelectAll,
  onSelect,
  onOpenSupplier,
}: SuppliersTableProps) {
  if (suppliers.length === 0) {
    return (
      <div className="p-12 text-center">
        <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
          No suppliers found
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-6 py-3 text-left">
              <input
                type="checkbox"
                checked={selected.length === suppliers.length && suppliers.length > 0}
                onChange={onSelectAll}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                title="Select all suppliers"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
              Supplier
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
              URN
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
              Frequency
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
              Last Check
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {suppliers.map((supplier) => {
            const isSelected = selected.includes(supplier.urn);

            return (
              <tr
                key={supplier.urn}
                className={`transition-colors ${isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(supplier.urn)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    title="Select for deletion"
                  />
                </td>

                <td
                  className="px-6 py-4 cursor-pointer"
                  onClick={() => onOpenSupplier(supplier.urn)}
                >
                  <p className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {supplier.name}
                  </p>
                </td>

                <td
                  className="px-6 py-4 cursor-pointer"
                  onClick={() => onOpenSupplier(supplier.urn)}
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {supplier.urn}
                  </p>
                </td>

                <td className="px-6 py-4">
                  <StatusBadge status={supplier.status} />
                </td>

                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {supplier.frequency || 'On-demand'}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(supplier.lastChecked).toLocaleDateString('en-GB')}
                  </p>
                </td>

                <td className="px-6 py-4">
                  <button
                    onClick={() => onOpenSupplier(supplier.urn)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm hover:shadow-button"
                    title="View details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}