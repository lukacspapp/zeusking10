'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, FileText, User, LogOut, Shield, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';

interface CustomerTheme {
  name: string;
  color: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerTheme | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useDarkMode();

  useEffect(() => {
    const stored = localStorage.getItem('awrs_customer');
    if (!stored) {
      router.push('/');
      return;
    }
    setCustomer(JSON.parse(stored));
  }, [router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('awrs_customer');
    router.push('/');
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/dashboard/suppliers', icon: FileText, label: 'Suppliers' },
    { path: '/dashboard/account', icon: User, label: 'Account' },
  ];

  if (!customer) return null;

  return (
    <div className="h-screen bg-slate-50 dark:bg-gray-900 flex transition-colors duration-200 overflow-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${customer.color}20` }}>
            <Shield className="w-5 h-5" style={{ color: customer.color }} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">{customer.name}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Compliance Portal</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 dark:bg-black/70 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - FIXED HEIGHT */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 h-screen
          bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          flex flex-col shadow-lg transition-transform duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${customer.color}20` }}>
              <Shield className="w-6 h-6" style={{ color: customer.color }} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-sm">{customer.name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Compliance Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation - SCROLLABLE */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  router.push(item.path);
                  setMobileMenuOpen(false);
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

        {/* Logout - ALWAYS VISIBLE AT BOTTOM */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all font-medium text-sm shadow-sm hover:shadow-button"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content - FIXED HEIGHT */}
      <main className="flex-1 h-screen flex flex-col overflow-hidden">
        {/* Content - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          {children}
        </div>

        {/* Footer - ALWAYS VISIBLE */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-2.5 px-8 flex-shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            This demo tracks anonymous usage (no cookies or personal data).
          </p>
        </div>
      </main>
    </div>
  );
}
