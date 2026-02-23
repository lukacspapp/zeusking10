'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, FileText, User, LogOut, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    const stored = localStorage.getItem('awrs_customer');
    if (!stored) {
      router.push('/');
      return;
    }
    setCustomer(JSON.parse(stored));
  }, [router]);

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
    <div className="min-h-screen bg-slate-50 flex" >
      {/* Sidebar */}
      < aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg" >
        {/* Logo/Brand */}
        < div className="p-6 border-b border-gray-200" >
          <div className="flex items-center gap-3 mb-2" >
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${customer.color}20` }
            }>
              <Shield className="w-6 h-6" style={{ color: customer.color }} />
            </div>
            < div >
              <h2 className="font-bold text-gray-900 text-sm" > {customer.name} </h2>
              < p className="text-xs text-gray-500" > Compliance Portal </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2" >
          {
            navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)
                  }
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm shadow-sm hover:shadow-button ${isActive
                    ? 'bg-blue-50 text-blue-600 shadow-button'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200" >
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all font-medium text-sm shadow-sm hover:shadow-button"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto" >
        {children}
      </main>
    </div>
  );
}
