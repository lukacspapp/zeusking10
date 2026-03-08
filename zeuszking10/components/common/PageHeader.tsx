import { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  backButton?: ReactNode;
};

export function PageHeader({ title, description, actions, backButton }: PageHeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6" >
      {backButton && <div className="mb-4" > {backButton} </div>
      }

      <div className="flex items-center justify-between gap-4" >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" > {title} </h1>
          {
            description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1" > {description} </p>
            )
          }
        </div>

        {actions}
      </div>
    </header>
  );
}