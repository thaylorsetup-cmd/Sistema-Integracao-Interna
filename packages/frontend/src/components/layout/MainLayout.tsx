import type { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { VideoBackground } from '@/components/ui';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-950 text-white font-sans">
      {/* Background Layer - Video from BBT Website */}
      <VideoBackground
        videoSrc="/background-bbt.webm"
        fallbackToAnimated={true}
      />

      {/* Content Layer - Full height flex layout */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Header - Fixed at top */}
        <Header />

        {/* Main Layout Container - Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Sticky/Fixed with internal scroll */}
          <Sidebar className="flex-shrink-0" />

          {/* Main Content - Scrollable area */}
          <main className="flex-1 overflow-y-auto scroll-smooth">
            <div className="py-6 px-4 lg:px-8 animate-fadeIn min-h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
