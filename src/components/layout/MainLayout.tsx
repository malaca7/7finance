import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    const handler = (e: any) => {
      setSidebarCollapsed(e.detail?.isCollapsed);
    };
    window.addEventListener('sidebar-toggle', handler);
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  return (
    <div className="min-h-screen bg-premium-black flex flex-col relative pt-16">
      <TopBar />
      <div className="flex flex-1 flex-row">
        <Sidebar />
        <main
          className={
            sidebarCollapsed
              ? "flex-1 w-full p-4 lg:p-8 pb-28 lg:pb-8 lg:overflow-y-auto lg:ml-24"
              : "flex-1 w-full p-4 lg:p-8 pb-28 lg:pb-8 lg:overflow-y-auto lg:ml-72"
          }
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}