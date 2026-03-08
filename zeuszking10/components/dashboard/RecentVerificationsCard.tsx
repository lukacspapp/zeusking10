'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { SectionCard } from '../common/SectionCard';
import { StatusBadge } from '../common/StatusBadge';
import type { Supplier } from '../../types/supplier';

type RecentVerificationsCardProps = {
  suppliers: Supplier[];
};

export function RecentVerificationsCard({
  suppliers,
}: RecentVerificationsCardProps) {
  const router = useRouter();

  if (suppliers.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <SectionCard
        title="Recent Verifications"
        description="Click on any supplier to view details"
      >
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {suppliers.slice(0, 5).map((supplier) => (
            <button
              key={supplier.urn}
              onClick={() => router.push(`/dashboard/suppliers/${supplier.urn}`)}
              className="w-full p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-between cursor-pointer group shadow-sm hover:shadow-button text-left"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {supplier.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
                  {supplier.urn}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right mr-2">
                  <StatusBadge status={supplier.status} />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(supplier.lastChecked).toLocaleDateString('en-GB')}
                  </p>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>

        {suppliers.length > 5 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => router.push('/dashboard/suppliers')}
              className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              View all {suppliers.length} suppliers →
            </button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}