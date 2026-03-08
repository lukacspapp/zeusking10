import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
    </div>
  );
}