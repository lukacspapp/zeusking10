'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Shield, Loader2, CheckCircle } from 'lucide-react';

export default function AccountPage() {
  const [customer, setCustomer] = useState<any>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
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
        setRequestSent(true);
        setTimeout(() => setRequestSent(false), 5000);
      }
    } catch (error) {
      console.error('Request failed:', error);
    } finally {
      setRequestLoading(false);
    }
  };

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600 mt-1">Manage your compliance portal settings</p>
      </header>

      <div className="p-8 max-w-3xl">
        {/* Account Info */}
        <div className="bg-white rounded-xl shadow-button border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Account Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Company Name</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">{customer.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Account Type</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">Demo Account</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Access Level</label>
              <span className="inline-block mt-2 ml-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                Limited Access
              </span>
            </div>
          </div>
        </div>

        {/* Upgrade CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center text-white shadow-button-hover">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h3 className="text-2xl font-bold mb-2">Upgrade to Full Account</h3>
          <p className="text-blue-100 mb-6">
            Unlock unlimited suppliers, automated checks, email alerts, and priority support
          </p>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
            <p className="text-sm font-semibold mb-2">Full Account Includes:</p>
            <ul className="text-sm space-y-2 text-blue-100">
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
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-button-hover hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
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
