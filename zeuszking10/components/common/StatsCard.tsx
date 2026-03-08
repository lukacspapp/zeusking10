import { LucideIcon } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  valueClassName?: string;
  iconClassName?: string;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  valueClassName = 'text-gray-900 dark:text-white',
  iconClassName = 'text-blue-500 dark:text-blue-400',
}: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-button hover:shadow-button-hover transition-shadow border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <Icon className={`w-5 h-5 ${iconClassName}`} />
      </div>
      <p className={`text-3xl font-bold ${valueClassName}`}>{value}</p>
    </div>
  );
}