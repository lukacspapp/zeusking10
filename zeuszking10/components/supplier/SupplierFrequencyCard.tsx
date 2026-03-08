'use client';

import { Calendar, CheckCircle } from 'lucide-react';
import { SectionCard } from '@/components/common/SectionCard';
import { CHECK_FREQUENCIES } from '../../constants/supplier';

type SupplierFrequencyCardProps = {
  frequency: string;
  onChange: (value: string) => void;
  onSave: () => void;
};

export function SupplierFrequencyCard({
  frequency,
  onChange,
  onSave,
}: SupplierFrequencyCardProps) {
  return (
    <SectionCard
      title="Check Frequency"
      icon={<Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
      className="mb-6"
    >
      <div className="p-6 pt-0 space-y-3">
        {CHECK_FREQUENCIES.map((option) => (
          <label
            key={option}
            className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all shadow-sm hover:shadow-button"
          >
            <input
              type="radio"
              name="frequency"
              value={option}
              checked={frequency === option}
              onChange={(event) => onChange(event.target.value)}
              className="w-4 h-4 text-blue-600"
            />

            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white capitalize block">
                {option.replace('-', ' ')}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {option === 'on-demand' && 'Manual checks only'}
                {option === 'daily' && 'Checked every day at 9:00 AM'}
                {option === 'weekly' && 'Checked every Monday at 9:00 AM'}
                {option === 'monthly' && 'Checked on the 1st of each month'}
              </span>
            </div>
          </label>
        ))}

        <button
          onClick={onSave}
          className="mt-4 w-full bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-button hover:shadow-button-hover flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          Save Frequency
        </button>
      </div>
    </SectionCard>
  );
}