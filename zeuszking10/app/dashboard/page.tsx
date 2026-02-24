'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Upload,
  FileText,
  Loader2,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import Toast from '../../components/Toast';
import { trackEvent } from '../../lib/analytics';

interface Supplier {
  urn: string;
  name: string;
  status: string;
  lastChecked: string;
  history?: { date: string; status: string }[];
}

export default function Dashboard() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [urnInput, setUrnInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  useEffect(() => {
    trackEvent('page_viewed', { page: 'dashboard' });
    const savedSuppliers = localStorage.getItem('awrs_suppliers');
    if (savedSuppliers) {
      setSuppliers(JSON.parse(savedSuppliers));
    }
  }, []);

  const handleVerify = async () => {
    if (!urnInput.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/verify?urn=${urnInput.trim()}`);
      const data = await res.json();

      trackEvent('urn_verified', {
        status: data.status,
        urn_format: data.urn ? 'valid' : 'invalid',
      });

      const newSupplier: Supplier = {
        urn: data.urn,
        name: data.name || 'Unknown',
        status: data.status,
        lastChecked: new Date().toISOString(),
        history: [{ date: new Date().toISOString().split('T')[0], status: data.status }]
      };

      const updated = [newSupplier, ...suppliers.filter(s => s.urn !== data.urn)];
      setSuppliers(updated);
      localStorage.setItem('awrs_suppliers', JSON.stringify(updated));
      setUrnInput('');

      setToastMessage(`Verified: ${data.name || data.urn}`);
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error('Verification failed:', error);

      trackEvent('verification_failed', {
        error: 'api_error'
      });

      setToastMessage('Verification failed. Please try again.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/import-suppliers', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.suppliers && data.suppliers.length > 0) {
        let verifiedCount = 0;
        const verifiedNames: string[] = [];

        for (const imported of data.suppliers) {
          const verifyRes = await fetch(`/api/verify?urn=${imported.urn}`);
          const verifyData = await verifyRes.json();

          const newSupplier: Supplier = {
            urn: verifyData.urn,
            name: verifyData.name || 'Unknown',
            status: verifyData.status,
            lastChecked: new Date().toISOString(),
            history: [{ date: new Date().toISOString().split('T')[0], status: verifyData.status }]
          };

          const updated = [newSupplier, ...suppliers.filter(s => s.urn !== verifyData.urn)];
          setSuppliers(updated);
          localStorage.setItem('awrs_suppliers', JSON.stringify(updated));

          verifiedCount++;
          verifiedNames.push(verifyData.name || verifyData.urn);
        }

        trackEvent('bulk_import_completed', {
          count: verifiedCount,
          file_type: file.name.endsWith('.csv') ? 'csv' : 'excel'
        });

        if (verifiedCount === 1) {
          setToastMessage(`Imported 1 supplier: ${verifiedNames[0]}`);
        } else if (verifiedCount <= 3) {
          setToastMessage(`Imported ${verifiedCount} suppliers: ${verifiedNames.join(', ')}`);
        } else {
          setToastMessage(`Imported ${verifiedCount} suppliers: ${verifiedNames.slice(0, 2).join(', ')} and ${verifiedCount - 2} more`);
        }
        setToastType('success');
        setShowToast(true);
      } else if (data.error) {
        setToastMessage(data.error);
        setToastType('error');
        setShowToast(true);
      } else {
        setToastMessage('No AWRS numbers found in file');
        setToastType('info');
        setShowToast(true);
      }
    } catch (error: any) {
      console.error('Import failed:', error);

      trackEvent('bulk_import_failed', {
        error: error.message
      });

      setToastMessage(`Failed to import: ${error.message}`);
      setToastType('error');
      setShowToast(true);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        handleFileUpload(file);
      } else {
        setToastMessage('Please upload a CSV or Excel file');
        setToastType('error');
        setShowToast(true);
      }
    }
  };

  const stats = {
    total: suppliers.length,
    approved: suppliers.filter(s => s.status === 'Approved').length,
    pending: suppliers.filter(s => s.status !== 'Approved').length,
    lastCheck: suppliers[0]?.lastChecked || null,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Quick verification and compliance overview</p>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-button hover:shadow-button-hover transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Suppliers</p>
              <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-button hover:shadow-button-hover transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
              <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.approved}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-button hover:shadow-button-hover transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Needs Review</p>
              <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            </div>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-button hover:shadow-button-hover transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Last Check</p>
              <Clock className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats.lastCheck
                ? new Date(stats.lastCheck).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                : 'No checks yet'
              }
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-button border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Quick Verify
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                value={urnInput}
                onChange={(e) => setUrnInput(e.target.value.toUpperCase())}
                placeholder="Enter URN (e.g., XJAW00000102990)"
                className="w-full px-4 text-black dark:text-white bg-white dark:bg-gray-700 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
              />
              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-button hover:shadow-button-hover"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Verify URN
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-button border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400" />
              Bulk Import
            </h2>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${dragActive
                ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
            >
              {uploadLoading ? (
                <div className="space-y-3">
                  <Loader2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto animate-spin" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Processing file...</p>
                </div>
              ) : (
                <>
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Drag & drop CSV or Excel here
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                    File must contain an {'"'}AWRS{'"'} or {'"'}URN{'"'} column
                  </p>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block bg-green-600 dark:bg-green-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-all cursor-pointer shadow-button hover:shadow-button-hover"
                  >
                    Choose File
                  </label>
                </>
              )}
            </div>
          </div>
        </div>

        {suppliers.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-button border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Verifications</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Click on any supplier to view details</p>
            </div>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">{supplier.urn}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right mr-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${supplier.status === 'Approved'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        {supplier.status}
                      </span>
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
          </div>
        )}
      </div>
    </div>
  );
}
