'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  ChevronRight,
  Search,
  FileText,
  Trash2,
  AlertTriangle,
  X,
  Info
} from 'lucide-react';

interface Supplier {
  urn: string;
  name: string;
  status: string;
  lastChecked: string;
  frequency?: string;
  history?: { date: string; status: string }[];
}

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const [showInfoBanner, setShowInfoBanner] = useState(true);

  useEffect(() => {
    const savedSuppliers = localStorage.getItem('awrs_suppliers');
    if (savedSuppliers) {
      setSuppliers(JSON.parse(savedSuppliers));
    }

    // Check if user has seen the info banner
    const bannerSeen = localStorage.getItem('supplier_delete_info_seen');
    if (bannerSeen) {
      setShowInfoBanner(false);
    }
  }, []);

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.urn.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selected.length === filteredSuppliers.length) {
      setSelected([]);
    } else {
      setSelected(filteredSuppliers.map(s => s.urn));
    }
  };

  const handleSelect = (urn: string) => {
    if (selected.includes(urn)) {
      setSelected(selected.filter(u => u !== urn));
    } else {
      setSelected([...selected, urn]);
    }
  };

  const handleDeleteClick = () => {
    if (selected.length === 0) return;
    setDeleteModal(true);
  };

  const confirmDelete = () => {
    const updated = suppliers.filter(s => !selected.includes(s.urn));
    setSuppliers(updated);
    localStorage.setItem('awrs_suppliers', JSON.stringify(updated));

    setSelected([]);
    setDeleteModal(false);
  };

  const cancelDelete = () => {
    setDeleteModal(false);
  };

  const dismissBanner = () => {
    setShowInfoBanner(false);
    localStorage.setItem('supplier_delete_info_seen', 'true');
  };

  const suppliersToDelete = suppliers.filter(s => selected.includes(s.urn));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-gray-600 mt-1">Manage and monitor all verified suppliers</p>
          </div>

          {/* Bulk Actions */}
          {selected.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {selected.length} selected
              </span>
              <button
                onClick={() => setSelected([])}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all shadow-sm hover:shadow-button flex items-center gap-2 font-medium"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
              <button
                onClick={handleDeleteClick}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all shadow-button hover:shadow-button-hover flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete {selected.length}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="p-8">
        {/* Info Banner */}
        {showInfoBanner && suppliers.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-5 mb-6 rounded-r-lg shadow-sm">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-2">Managing Supplier Records</p>
                <p className="text-sm text-blue-800 mb-3">
                  You can delete supplier records by selecting them and clicking the delete button. Common reasons to delete include:
                </p>
                <ul className="text-sm text-blue-800 space-y-1 mb-3 ml-4">
                  <li>• <strong>Duplicate entries</strong> - Same supplier added multiple times</li>
                  <li>• <strong>Incorrect entries</strong> - Wrong URN or test data</li>
                  <li>• <strong>Old records</strong> - Suppliers you no longer work with (after 5+ years)</li>
                  <li>• <strong>Business closure</strong> - Supplier no longer trading</li>
                </ul>
                <p className="text-xs text-blue-700 italic">
                  Note: HMRC recommends keeping records for 5 years. You'll be reminded before deletion.
                </p>
              </div>
              <button
                onClick={dismissBanner}
                className="p-1 hover:bg-blue-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-button border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suppliers by name or URN..."
              className="w-full pl-10 pr-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white rounded-xl shadow-button border border-gray-200 overflow-hidden">
          {/* Table Header with Instructions */}
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-medium">💡 Tip:</span> Select suppliers using checkboxes to delete multiple at once
            </p>
          </div>

          {filteredSuppliers.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                {search ? 'No suppliers found' : 'No suppliers yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selected.length === filteredSuppliers.length && filteredSuppliers.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        title="Select all suppliers"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">URN</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Frequency</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Check</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSuppliers.map((supplier) => {
                    const isSelected = selected.includes(supplier.urn);

                    return (
                      <tr
                        key={supplier.urn}
                        className={`transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelect(supplier.urn)}
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                            title="Select for deletion"
                          />
                        </td>
                        <td
                          className="px-6 py-4 cursor-pointer"
                          onClick={() => router.push(`/dashboard/suppliers/${supplier.urn}`)}
                        >
                          <p className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                            {supplier.name}
                          </p>
                        </td>
                        <td
                          className="px-6 py-4 cursor-pointer"
                          onClick={() => router.push(`/dashboard/suppliers/${supplier.urn}`)}
                        >
                          <p className="text-sm text-gray-600 font-mono">{supplier.urn}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${supplier.status === 'Approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                            }`}>
                            <CheckCircle className="w-3.5 h-3.5" />
                            {supplier.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 capitalize">
                            {supplier.frequency || 'On-demand'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">
                            {new Date(supplier.lastChecked).toLocaleDateString('en-GB')}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => router.push(`/dashboard/suppliers/${supplier.urn}`)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all shadow-sm hover:shadow-button"
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
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-amber-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete {selected.length} Supplier{selected.length > 1 ? 's' : ''}?
                </h3>
                <p className="text-sm text-gray-600">
                  You are about to delete the following supplier{selected.length > 1 ? 's' : ''}:
                </p>
              </div>
            </div>

            {/* Suppliers List */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {suppliersToDelete.map((supplier) => (
                  <div key={supplier.urn} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{supplier.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{supplier.urn}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HMRC Warning */}
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
              <p className="text-sm font-semibold text-amber-900 mb-2">
                ⚠️ HMRC Compliance Reminder
              </p>
              <p className="text-sm text-amber-800">
                HMRC regulations recommend maintaining supplier verification records for up to <strong>5 years</strong> for compliance and audit purposes.
              </p>
            </div>

            {/* Clarification */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>You can still delete</strong> if you're certain you no longer need these records (e.g., duplicates, errors, or records older than 5 years).
              </p>
            </div>

            {/* Question */}
            <p className="text-sm text-gray-700 mb-6 font-medium">
              Do you want to proceed with deletion?
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all font-medium shadow-button hover:shadow-button-hover"
              >
                Keep Records
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium shadow-button hover:shadow-button-hover flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
