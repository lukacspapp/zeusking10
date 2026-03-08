'use client';

import { FileText, Home, LogOut, Shield, User } from 'lucide-react';
import type { CustomerTheme } from '../../types/supplier';

type DashboardSidebarProps = {
  customer: CustomerTheme;
  pathname: string;
  mobileMenuOpen: boolean;
  onCloseMenu: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/dashboard/suppliers', icon: FileText, label: 'Suppliers' },
  { path: '/dashboard/account', icon: User, label: 'Account' },
];

export function DashboardSidebar({
  customer,
  pathname,
  mobileMenuOpen,
  onCloseMenu,
  onNavigate,
  onLogout,
}: DashboardSidebarProps) {
  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 h-screen
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        flex flex-col shadow-lg transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${customer.color}20` }}
          >
            <Shield className="w-6 h-6" style={{ color: customer.color }} />
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
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => {
                onNavigate(item.path);
                onCloseMenu();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm shadow-sm hover:shadow-button ${isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-button'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all font-medium text-sm shadow-sm hover:shadow-button"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}