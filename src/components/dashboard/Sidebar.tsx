'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { usePDFContext } from './PDFContext';
import { Upload } from 'lucide-react';

type Props = {
  isDrawer?: boolean;
  onClose?: () => void;
  session?: Session | null;
};

export default function Sidebar({ isDrawer = false, onClose, session: sessionProp }: Props) {
  const [documentCounts, setDocumentCounts] = useState({
    library: 0,
    recent: 0,
    summaries: 0,
  });
  const { data: clientSession, status } = useSession();
  const { documentsRefreshKey, activeView, setActiveView } = usePDFContext();
  const session = sessionProp ?? clientSession;
  const isAuthenticated = !!session?.user || status === 'authenticated';

  const displayName = session?.user?.name || session?.user?.email || 'User';
  const email = session?.user?.email || '';
  const provider = session?.user?.provider || 'credentials';
  const initials = (displayName || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  useEffect(() => {
    if (!isAuthenticated) {
      setDocumentCounts({ library: 0, recent: 0, summaries: 0 });
      return;
    }

    let cancelled = false;

    const fetchCount = async (view: 'library' | 'recent' | 'summaries') => {
      const response = await fetch(`/api/documents?view=${view}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        return 0;
      }

      const payload = (await response.json()) as { documents?: unknown[] };
      return payload.documents?.length ?? 0;
    };

    const refreshCounts = async () => {
      try {
        const [library, recent, summaries] = await Promise.all([
          fetchCount('library'),
          fetchCount('recent'),
          fetchCount('summaries'),
        ]);

        if (!cancelled) {
          setDocumentCounts({ library, recent, summaries });
        }
      } catch (error) {
        console.error('Failed to refresh document counts:', error);
      }
    };

    void refreshCounts();

    return () => {
      cancelled = true;
    };
  }, [documentsRefreshKey, isAuthenticated]);

  const navItems = [
    { id: 'library', label: 'My Library', icon: '📚', badge: '5' },
    { id: 'recent', label: 'Recent Reads', icon: '⏱️', badge: '' },
    { id: 'summaries', label: 'Summaries', icon: '📝', badge: '' },
    { id: 'settings', label: 'Settings', icon: '⚙️', badge: '' },
  ];

  const baseClasses = isDrawer
    ? 'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex flex-col justify-between overflow-hidden border-r border-white/5 bg-[#0b0f19] py-6 px-4'
    : 'flex h-screen max-h-screen w-full flex-col justify-between overflow-hidden border-r border-white/5 bg-[#0b0f19] py-6 px-4';

  return (
    <aside className={baseClasses}>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-8 scrollbar-custom">
        <div className="relative flex h-16 items-center justify-center border-b border-white/10 pb-4 shrink-0">
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 text-xl font-bold accent-primary"
          >
            Vox
          </Link>
          {isDrawer && (
            <button
              aria-label="Close menu"
              onClick={onClose}
              className="absolute right-0 top-1/2 -translate-y-1/2 lg:hidden btn btn-ghost btn-sm"
            >
              ✕
            </button>
          )}
        </div>

        <button onClick={() => setActiveView('upload')} className="w-full flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm py-3 px-4 shadow-[0_0_20px_rgba(37,99,235,0.2)] active:scale-98 transition-all mb-6">
          <Upload className="h-4 w-4" />
          <span>Upload PDF</span>
        </button>

        <nav className="space-y-2 min-w-0">
          {navItems.map((item) => {
            const visibleBadge =
              item.id === 'library'
                ? String(documentCounts.library)
                : item.id === 'recent'
                  ? documentCounts.recent
                    ? String(documentCounts.recent)
                    : ''
                  : item.id === 'summaries'
                    ? documentCounts.summaries
                      ? String(documentCounts.summaries)
                      : ''
                    : item.badge;

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-label transition-transform active:scale-95 whitespace-nowrap ${activeView === item.id
                  ? 'border border-electric-blue/40 bg-electric-blue/20 text-electric-blue'
                  : 'text-white/70 hover:bg-navy-dark hover:text-white/90'
                  }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1 truncate text-left">{item.label}</span>
                {visibleBadge && (
                  <span className="rounded-full bg-electric-blue/30 px-2 py-1 text-xs text-electric-blue">
                    {visibleBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="shrink-0 mt-6 border-t border-white/5 pt-4">
        {isAuthenticated ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg p-2 transition-transform">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-electric-blue to-cyan-accent flex items-center justify-center text-xs font-bold text-navy-dark overflow-hidden shrink-0">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={displayName}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials || 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-label text-white/90 truncate">{displayName}</div>
                <div className="text-xs text-white/50 truncate">{email}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-electric-blue/90">
                  {provider}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: '/' })}
              className="btn btn-sm btn-outline w-full border-white/15 text-white hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg p-2 text-white/60">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">
              U
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-label truncate">Guest</div>
              <div className="text-xs text-white/50 truncate">Sign in to save progress</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
