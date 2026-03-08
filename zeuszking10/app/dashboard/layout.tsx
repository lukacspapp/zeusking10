'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDarkMode } from '../../hooks/useDarkMode';
import { getStoredCustomer, clearStoredCustomer } from '../../lib/db/supplierRepository';
import { CustomerTheme } from '../../types/supplier';
import { DashboardMobileHeader } from '../../components/dashboard/DashBoardMobileHeader';
import { DashboardFooter } from '../../components/layout/DashBoardFooter';
import { DashboardSidebar } from '../../components/layout/DashboardSidebar';


export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [customer, setCustomer] = useState<CustomerTheme | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useDarkMode();

  useEffect(() => {
    const storedCustomer = getStoredCustomer();

    if (!storedCustomer) {
      router.push('/');
      return;
    }

    setCustomer(storedCustomer);
  }, [router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearStoredCustomer();
    router.push('/');
  };

  if (!customer) return null;

  return (
    <div className="h-screen bg-slate-50 dark:bg-gray-900 flex transition-colors duration-200 overflow-hidden">
      <DashboardMobileHeader
        customer={customer}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMenu={() => setMobileMenuOpen((prev) => !prev)}
      />

      <DashboardSidebar
        customer={customer}
        pathname={pathname}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMenu={() => setMobileMenuOpen(false)}
        onNavigate={(path) => router.push(path)}
        onLogout={handleLogout}
      />

      <main className="flex-1 h-screen flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pt-16 lg:pt-0">{children}</div>
        <DashboardFooter />
      </main>
    </div>
  );
}