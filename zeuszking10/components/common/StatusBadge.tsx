import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { getSupplierStatusVariant } from '../../utils/supplier';

type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant = getSupplierStatusVariant(status);

  const className =
    variant === 'approved'
      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      : variant === 'warning'
        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';

  const Icon =
    variant === 'approved'
      ? CheckCircle
      : variant === 'warning'
        ? AlertTriangle
        : XCircle;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
}