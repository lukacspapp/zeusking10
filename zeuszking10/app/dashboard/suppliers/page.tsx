'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { trackEvent } from '@/lib/analytics';
import { getStoredSuppliers, hasSeenDeleteInfoBanner, saveSuppliers, setDeleteInfoBannerSeen } from '../../../lib/db/supplierRepository';
import { Supplier } from '../../../types/supplier';
import { DeleteSuppliersModal } from '../../../components/supplier/DeleteSuppliersModal';
import { SupplierDeleteInfoBanner } from '../../../components/supplier/SupplierDeleteInfoBanner';
import { SuppliersTable } from '../../../components/supplier/SuppliersTable';

export default function SuppliersPage() {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [showInfoBanner, setShowInfoBanner] = useState(true);

  useEffect(() => {
    trackEvent('page_viewed', { page: 'suppliers' });
    setSuppliers(getStoredSuppliers());
    setShowInfoBanner(!hasSeenDeleteInfoBanner());
  }, []);

  const filteredSuppliers = useMemo(() => {
    const value = search.toLowerCase();

    return suppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(value) ||
        supplier.urn.toLowerCase().includes(value)
    );
  }, [suppliers, search]);

  const suppliersToDelete = useMemo(
    () => suppliers.filter((supplier) => selected.includes(supplier.urn)),
    [suppliers, selected]
  );

  const handleSelectAll = () => {
    if (selected.length === filteredSuppliers.length) {
      setSelected([]);
      return;
    }

    setSelected(filteredSuppliers.map((supplier) => supplier.urn));
  };

  const handleSelect = (urn: string) => {
    setSelected((prev) =>
      prev.includes(urn) ? prev.filter((item) => item !== urn) : [...prev, urn]
    );
  };

  const handleDeleteConfirm = () => {
    trackEvent('suppliers_deleted', {
      count: selected.length,
    });

    const updated = suppliers.filter((supplier) => !selected.includes(supplier.urn));
    setSuppliers(updated);
    saveSuppliers(updated);
    setSelected([]);
    setDeleteModalOpen(false);
  };

  const handleDismissBanner = () => {
    setShowInfoBanner(false);
    setDeleteInfoBannerSeen();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <PageHeader
        title="Suppliers"
        description="Manage and monitor all verified suppliers"
        actions={
          selected.length > 0 ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selected.length} selected
              </span>

              <button
                onClick={() => setSelected([])}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm hover:shadow-button flex items-center gap-2 font-medium"
              >
                <X className="w-4 h-4" />
                Clear
              </button>

              <button
                onClick={() => setDeleteModalOpen(true)}
                className="px-6 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition-all shadow-button hover:shadow-button-hover flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete {selected.length}
              </button>
            </div>
          ) : null
        }
      />

      <div className="p-8">
        {showInfoBanner && suppliers.length > 0 && (
          <SupplierDeleteInfoBanner onDismiss={handleDismissBanner} />
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-button border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search suppliers by name or URN..."
            className="w-full px-4 py-3 text-black dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <SectionCard>
          {suppliers.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">💡 Tip:</span> Select suppliers using checkboxes to delete multiple at once
              </p>
            </div>
          )}

          <SuppliersTable
            suppliers={filteredSuppliers}
            selected={selected}
            onSelectAll={handleSelectAll}
            onSelect={handleSelect}
            onOpenSupplier={(urn) => router.push(`/dashboard/suppliers/${urn}`)}
          />
        </SectionCard>
      </div>

      {deleteModalOpen && (
        <DeleteSuppliersModal
          suppliers={suppliersToDelete}
          onCancel={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}