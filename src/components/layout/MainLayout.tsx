import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-premium-black flex flex-col lg:flex-row overflow-x-hidden max-w-[100vw] relative">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 p-4 lg:p-8 pt-20 pb-20 lg:pt-8 lg:pb-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
