import { ReactNode } from 'react';

type SectionCardProps = {
  title?: string;
  description?: string;
  icon?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  description,
  icon,
  headerActions,
  children,
  className = '',
}: SectionCardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-button border border-gray-200 dark:border-gray-700 ${className}`}>
      {(title || description || headerActions) && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {icon}
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            )}
          </div>

          {headerActions}
        </div>
      )}

      <div className={title || description || headerActions ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
}