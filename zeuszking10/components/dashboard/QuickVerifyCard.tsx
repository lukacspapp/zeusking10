'use client';

import { CheckCircle, Loader2 } from 'lucide-react';
import { SectionCard } from '../common/SectionCard';

type QuickVerifyCardProps = {
  urnInput: string;
  setUrnInput: (value: string) => void;
  loading: boolean;
  onVerify: () => void;
};

export function QuickVerifyCard({
  urnInput,
  setUrnInput,
  loading,
  onVerify,
}: QuickVerifyCardProps) {
  return (
    <SectionCard
      title="Quick Verify"
      icon={<CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
    >
      <div className="p-6 pt-0 space-y-3">
        <input
          type="text"
          value={urnInput}
          onChange={(event) => setUrnInput(event.target.value.toUpperCase())}
          placeholder="Enter URN (e.g., XJAW00000102990)"
          className="w-full px-4 text-black dark:text-white bg-white dark:bg-gray-700 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
          onKeyDown={(event) => event.key === 'Enter' && onVerify()}
        />

        <button
          onClick={onVerify}
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
    </SectionCard>
  );
}