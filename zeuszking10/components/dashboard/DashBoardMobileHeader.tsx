'use client';

import { Menu, Shield, X } from 'lucide-react';
import { CustomerTheme } from '../../types/supplier';

type DashboardMobileHeaderProps = {
  customer: CustomerTheme;
  mobileMenuOpen: boolean;
  onToggleMenu: () => void;
};

export function DashboardMobileHeader({
  customer,
  mobileMenuOpen,
  onToggleMenu,
}: DashboardMobileHeaderProps) {
  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${customer.color}20` }}
          >
            <Shield className="w-5 h-5" style={{ color: customer.color }} />
          </div>

          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">
              {customer.name}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Compliance Portal
            </p>
          </div>
        </div>

        <button
          onClick={onToggleMenu}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-gray-900 dark:text-gray-100" />
          ) : (
            <Menu className="w-6 h-6 text-gray-900 dark:text-gray-100" />
          )}
        </button>
      </header>

      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 dark:bg-black/70 z-40"
          onClick={onToggleMenu}
        />
      )}
    </>
  );
}