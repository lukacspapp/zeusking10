'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  CheckCircle,
  Calendar,
  Download,
  RefreshCw,
  ArrowLeft,
  Clock,
  Loader2,
  TrendingUp,
  X,
  AlertTriangle
} from 'lucide-react';
import { generatePDF, generateBulkPDF } from '../../../../lib/pdf-generator';
import Toast from '../../../../components/Toast';

interface Supplier {
  urn: string;
  name: string;
  status: string;
  lastChecked: string;
  frequency?: string;
  history?: { date: string; status: string }[];
}

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const urn = params?.urn as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [frequency, setFrequency] = useState('on-demand');
  const [checking, setChecking] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedHistory, setSelectedHistory] = useState<number[]>([]);
  const [downloadingHistory, setDownloadingHistory] = useState(false);

  const MAX_SELECTION = 10;

  useEffect(() => {
    const savedSuppliers = localStorage.getItem('awrs_suppliers');
    if (savedSuppliers) {
      const suppliers: Supplier[] = JSON.parse(savedSuppliers);
      const found = suppliers.find(s => s.urn === urn);
      if (found) {
        setSupplier(found);
        setFrequency(found.frequency || 'on-demand');
      }
    }

    const stored = localStorage.getItem('awrs_customer');
    if (stored) {
      setCustomer(JSON.parse(stored));
    }
  }, [urn]);

  const handleManualCheck = async () => {
    if (!supplier) return;

    setChecking(true);
    try {
      const res = await fetch(`/api/verify?urn=${supplier.urn}`);
      const data = await res.json();

      const updatedSupplier: Supplier = {
        ...supplier,
        status: data.status,
        lastChecked: new Date().toISOString(),
        history: [
          { date: new Date().toISOString().split('T')[0], status: data.status },
          ...(supplier.history || [])
        ]
      };

      const savedSuppliers = localStorage.getItem('awrs_suppliers');
      if (savedSuppliers) {
        const suppliers: Supplier[] = JSON.parse(savedSuppliers);
        const updated = suppliers.map(s => s.urn === supplier.urn ? updatedSupplier : s);
        localStorage.setItem('awrs_suppliers', JSON.stringify(updated));
        setSupplier(updatedSupplier);
      }

      setToastMessage('Verification completed successfully');
      setShowToast(true);
    } catch (error) {
      console.error('Check failed:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSaveFrequency = () => {
    if (!supplier) return;

    const savedSuppliers = localStorage.getItem('awrs_suppliers');
    if (savedSuppliers) {
      const suppliers: Supplier[] = JSON.parse(savedSuppliers);
      const updated = suppliers.map(s =>
        s.urn === supplier.urn ? { ...s, frequency } : s
      );
      localStorage.setItem('awrs_suppliers', JSON.stringify(updated));
      setSupplier({ ...supplier, frequency });

      const frequencyLabel = frequency.replace('-', ' ');
      setToastMessage(`Frequency confirmed: ${frequencyLabel.charAt(0).toUpperCase() + frequencyLabel.slice(1)}`);
      setShowToast(true);
    }
  };

  const handleSelectHistory = (index: number) => {
    if (selectedHistory.includes(index)) {
      setSelectedHistory(selectedHistory.filter(i => i !== index));
    } else {
      if (selectedHistory.length < MAX_SELECTION) {
        setSelectedHistory([...selectedHistory, index]);
      }
    }
  };

  const handleSelectAllHistory = () => {
    if (!supplier?.history) return;

    if (selectedHistory.length === Math.min(supplier.history.length, MAX_SELECTION)) {
      setSelectedHistory([]);
    } else {
      setSelectedHistory(supplier.history.slice(0, MAX_SELECTION).map((_, i) => i));
    }
  };

  const handleDownloadSingleHistory = (index: number) => {
    if (!supplier || !supplier.history) return;

    const historyItem = supplier.history[index];
    const supplierSnapshot: Supplier = {
      ...supplier,
      status: historyItem.status,
      lastChecked: historyItem.date,
    };

    generatePDF(supplierSnapshot, customer?.name || 'Company');
  };

  const handleDownloadSelectedHistory = async () => {
    if (!supplier || !supplier.history || selectedHistory.length === 0) return;

    setDownloadingHistory(true);
    try {
      const selectedSnapshots = selectedHistory.map(index => {
        const historyItem = supplier.history![index];
        return {
          ...supplier,
          status: historyItem.status,
          lastChecked: historyItem.date,
          name: `${supplier.name} (${historyItem.date})`,
        };
      });

      await generateBulkPDF(selectedSnapshots, customer?.name || 'Company');
      setSelectedHistory([]);
      setToastMessage(`Downloaded ${selectedHistory.length} certificate${selectedHistory.length > 1 ? 's' : ''}`);
      setShowToast(true);
    } catch (error) {
      console.error('Bulk download failed:', error);
    } finally {
      setDownloadingHistory(false);
    }
  };

  if (!supplier) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}

      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Suppliers</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{supplier.name}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1 font-mono text-sm">{supplier.urn}</p>
      </header>

      <div className="p-8 max-w-5xl">
        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-button border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Current Status</h2>
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm ${supplier.status === 'Approved'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                <CheckCircle className="w-5 h-5" />
                {supplier.status}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                Last checked: {new Date(supplier.lastChecked).toLocaleString('en-GB')}
              </p>
            </div>
            <button
              onClick={handleManualCheck}
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
        </div>

        {/* Check Frequency */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-button border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Check Frequency
          </h2>
          <div className="space-y-3">
            {['on-demand', 'daily', 'weekly', 'monthly'].map((freq) => (
              <label key={freq} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all shadow-sm hover:shadow-button">
                <input
                  type="radio"
                  name="frequency"
                  value={freq}
                  checked={frequency === freq}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize block">
                    {freq.replace('-', ' ')}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {freq === 'on-demand' && 'Manual checks only'}
                    {freq === 'daily' && 'Checked every day at 9:00 AM'}
                    {freq === 'weekly' && 'Checked every Monday at 9:00 AM'}
                    {freq === 'monthly' && 'Checked on the 1st of each month'}
                  </span>
                </div>
              </label>
            ))}
          </div>
          <button
            onClick={handleSaveFrequency}
            className="mt-4 w-full bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-button hover:shadow-button-hover flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Save Frequency
          </button>
        </div>

        {/* Selection Limit Warning */}
        {selectedHistory.length >= MAX_SELECTION && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 dark:border-amber-500 p-4 mb-6 rounded-r-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Selection Limit Reached</p>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  You can download up to {MAX_SELECTION} certificates at once. Deselect some to add others.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Check History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-button border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Check History
              </h2>
              {supplier.history && supplier.history.length > 0 && (
                <button
                  onClick={handleSelectAllHistory}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  {selectedHistory.length === Math.min(supplier.history.length, MAX_SELECTION)
                    ? 'Deselect All'
                    : `Select ${supplier.history.length > MAX_SELECTION ? 'First 10' : 'All'}`
                  }
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {selectedHistory.length > 0 && (
                <>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedHistory.length} selected
                    {selectedHistory.length >= MAX_SELECTION && ' (max)'}
                  </span>
                  <button
                    onClick={() => setSelectedHistory([])}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm hover:shadow-button"
                    title="Clear selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDownloadSelectedHistory}
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
              )}

              {selectedHistory.length === 0 && (
                <button
                  onClick={() => generatePDF(supplier, customer?.name || 'Company')}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all shadow-sm hover:shadow-button font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download Latest
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {supplier.history && supplier.history.length > 0 ? (
              supplier.history.map((check, i) => {
                const isSelected = selectedHistory.includes(i);
                const canSelect = isSelected || selectedHistory.length < MAX_SELECTION;

                return (
                  <div
                    key={i}
                    className={`p-4 flex items-center gap-4 transition-colors ${isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectHistory(i)}
                      disabled={!canSelect}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title={!canSelect ? `Maximum ${MAX_SELECTION} selections allowed` : ''}
                    />

                    <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />

                    <span className={`text-sm flex-1 ${!canSelect && !isSelected
                        ? 'text-gray-400 dark:text-gray-600'
                        : 'text-gray-600 dark:text-gray-400'
                      }`}>
                      {check.date}
                    </span>

                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${check.status === 'Approved'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                      {check.status === 'Approved' ? '✅' : '❌'} {check.status}
                    </span>

                    <button
                      onClick={() => handleDownloadSingleHistory(i)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all shadow-sm hover:shadow-button"
                      title="Download this certificate"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No check history available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
