'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Shield, Loader2, CheckCircle, Moon, Sun } from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { trackEvent } from '../../../lib/analytics';

export default function AccountPage() {
  const [customer, setCustomer] = useState<any>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const { darkMode, toggleDarkMode } = useDarkMode();

  useEffect(() => {
    trackEvent('page_viewed', { page: 'account' });

    const stored = localStorage.getItem('awrs_customer');
    if (stored) {
      setCustomer(JSON.parse(stored));
    }
  }, []);

  const handleRequestFullAccount = async () => {
    if (!customer) return;

    setRequestLoading(true);
    try {
      const savedSuppliers = localStorage.getItem('awrs_suppliers');
      const suppliers = savedSuppliers ? JSON.parse(savedSuppliers) : [];

      trackEvent('full_account_requested', {
        supplier_count: suppliers.length
      });

      const res = await fetch('/api/request-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: customer.name,
          supplierCount: suppliers.length,
          timestamp: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        trackEvent('full_account_request_sent', {
          success: true,
          supplier_count: suppliers.length
        })
        setRequestSent(true);
        setTimeout(() => setRequestSent(false), 5000);
      }
    } catch (error) {
      trackEvent('full_account_request_sent', {
        success: false,
        error: 'api_error'
      });
      console.error('Request failed:', error);
    } finally {
      setRequestLoading(false);
    }
  };

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your compliance portal settings</p>
      </header>

      <div className="p-8 max-w-3xl">
        {/* Account Info with Toggle Icon */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-button border border-gray-200 dark:border-gray-700 p-6 mb-6 relative">
          {/* Dark Mode Toggle Icon - Top Right */}
          <button
            onClick={toggleDarkMode}
            className="absolute top-6 right-6 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all shadow-sm hover:shadow-button group"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-500 group-hover:text-amber-400 transition-colors" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 group-hover:text-gray-700 transition-colors" />
            )}
          </button>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Account Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Company Name</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{customer.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Type</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">Demo Account</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Access Level</label>
              <span className="inline-block mt-2 px-2 ml-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-sm font-semibold">
                Limited Access
              </span>
            </div>
          </div>
        </div>

        {/* Upgrade CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-xl p-8 text-center text-white shadow-button-hover">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h3 className="text-2xl font-bold mb-2">Upgrade to Full Account</h3>
          <p className="text-blue-100 dark:text-blue-200 mb-6">
            Unlock unlimited suppliers, automated checks, email alerts, and priority support
          </p>

          <div className="bg-white/10 dark:bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
            <p className="text-sm font-semibold mb-2">Full Account Includes:</p>
            <ul className="text-sm space-y-2 text-blue-100 dark:text-blue-200">
              <li>✅ Unlimited supplier verifications</li>
              <li>✅ Automated daily/weekly/monthly checks</li>
              <li>✅ Email alerts for status changes</li>
              <li>✅ Bulk PDF upload & extraction</li>
              <li>✅ Priority support</li>
            </ul>
          </div>

          {requestSent ? (
            <div className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-semibold inline-flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Request Sent Successfully!
            </div>
          ) : (
            <button
              onClick={handleRequestFullAccount}
              disabled={requestLoading}
              className="bg-white dark:bg-gray-100 text-blue-600 dark:text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-white transition-all shadow-button-hover hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {requestLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending Request...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Request Full Account
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
