// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        {/* Phase 0 Orchestrator Dashboard */}
        <div className="fixed bottom-4 right-4 bg-black/80 p-4 rounded-2xl border border-[#00ffcc]/30 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#00ffcc] animate-pulse rounded-full"></div>
            AETHERFORGE-ELITE v2.2 LIVE — Swarm: 4 agents • Bones printed: 0
          </div>
        </div>
      </body>
    </html>
  );
}
