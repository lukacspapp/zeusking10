'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

const CUSTOMER_THEMES = {
  'seckford123': { name: 'Seckford Wines', color: '#1e40af' },
  'vinovault': { name: 'Vino Vault Ltd', color: '#7c3aed' },
  'demo': { name: 'Demo Company Ltd', color: '#059669' },
};

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    const stored = localStorage.getItem('awrs_customer');
    if (stored) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const theme = CUSTOMER_THEMES[password as keyof typeof CUSTOMER_THEMES];

    if (theme) {
      localStorage.setItem('awrs_customer', JSON.stringify({ password, ...theme }));
      router.push('/dashboard');
    } else {
      setError('Invalid access code');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          AWRS Compliance Portal
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Enter your access code to continue
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Access Code"
            className="w-full px-4 text-black py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-4"
          />

          {error && (
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Access Dashboard
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 font-semibold mb-2">Demo Access:</p>
          <p className="text-xs text-gray-500">This code will be in your email</p>
        </div>
      </div>
    </div>
  );
}
