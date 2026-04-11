import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';

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
    <div className="min-h-screen min-h-[100dvh] bg-premium-black flex flex-col lg:flex-row overflow-x-hidden max-w-[100vw] relative">
      <Sidebar />
      <main
        className={
          sidebarCollapsed
            ? "flex-1 w-full min-w-0 p-4 lg:p-8 pt-20 pb-4 lg:pt-8 lg:pb-8 overflow-y-auto lg:ml-20"
            : "flex-1 w-full min-w-0 p-4 lg:p-8 pt-20 pb-4 lg:pt-8 lg:pb-8 overflow-y-auto lg:ml-64"
        }
      >
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}