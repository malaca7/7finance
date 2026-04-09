import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-premium-black flex flex-col lg:flex-row overflow-x-hidden relative">
      <Sidebar />
      <main className="flex-1 w-full p-4 lg:p-8 pt-20 pb-20 lg:pt-8 lg:pb-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
