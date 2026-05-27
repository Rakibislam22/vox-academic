'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

type Props = {
  isDrawer?: boolean;
  onClose?: () => void;
  session?: Session | null;
};

export default function Sidebar({ isDrawer = false, onClose, session: sessionProp }: Props) {
  const [activeNav, setActiveNav] = useState('library');
  const { data: clientSession, status } = useSession();
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

  const navItems = [
    { id: 'library', label: 'My Library', icon: '📚', badge: '5' },
    { id: 'recent', label: 'Recent Reads', icon: '⏱️', badge: '' },
    { id: 'summaries', label: 'Summaries', icon: '📝', badge: '' },
    { id: 'settings', label: 'Settings', icon: '⚙️', badge: '' },
  ];

  const baseClasses = isDrawer
    ? 'fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 bg-white/2 backdrop-blur-xl border-r border-white/10 flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain'
    : 'w-full xl:w-52 h-auto xl:h-full xl:min-h-0 bg-white/2 backdrop-blur-xl border-b xl:border-b-0 xl:border-r border-white/10 flex xl:flex-col';

  return (
    <aside className={baseClasses}>
      <div
        className={`relative h-16 w-full border-r xl:border-r-0 xl:border-b border-white/10 flex items-center px-4 shrink-0 bg-white/3 ${isDrawer ? 'justify-between border-r-0' : 'justify-center'}`}
      >
        <Link
          href="/"
          className={`text-xl font-bold accent-primary ${isDrawer ? '' : 'absolute left-1/2 -translate-x-1/2'}`}
        >
          Vox
        </Link>
        {isDrawer && (
          <button
            aria-label="Close menu"
            onClick={onClose}
            className="lg:hidden btn btn-ghost btn-sm"
          >
            ✕
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-x-auto overflow-y-hidden xl:overflow-y-auto scrollbar-custom px-2 sm:px-3 py-3 xl:py-6">
        <div className="flex flex-col gap-2 xl:space-y-2 xl:block min-w-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-label transition-transform active:scale-95 whitespace-nowrap xl:w-full ${
                activeNav === item.id
                  ? 'bg-electric-blue/20 text-electric-blue border border-electric-blue/40'
                  : 'text-white/70 hover:text-white/90 hover:bg-navy-dark'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 text-left truncate">{item.label}</span>
              {item.badge && (
                <span className="text-xs px-2 py-1 rounded-full bg-electric-blue/30 text-electric-blue">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <div className="border-t border-white/10 p-4 bg-white/2">
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
