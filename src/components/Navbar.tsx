'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

function getInitials(name?: string | null, email?: string | null) {
    const source = name || email || 'User';
    const parts = source.split(' ').filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
}

export default function Navbar() {
    const { data: session, status } = useSession();
    const isAuthenticated = status === 'authenticated' && !!session?.user;
    const displayName = session?.user?.name || session?.user?.email || 'Account';
    const initials = getInitials(session?.user?.name, session?.user?.email);
    const email = session?.user?.email || '';
    const provider = (session && (session as unknown as { user?: { provider?: string } }).user?.provider) ?? 'credentials';
    const image = session?.user?.image || '';

    return (
        <header className="w-full border-b border-white/10 bg-[rgba(5,11,24,0.78)] backdrop-blur-xl">
            <div className="navbar mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
                <div className="navbar-start">
                    <div className="dropdown lg:hidden">
                        <button tabIndex={0} className="btn btn-ghost btn-circle" aria-label="Open navigation menu">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <ul tabIndex={0} className="menu dropdown-content mt-3 w-52 rounded-box bg-base-100 p-2 shadow">
                            <li><Link href="/">Home</Link></li>
                            <li><Link href="/dashboard">Dashboard</Link></li>
                            {!isAuthenticated && <li><Link href="/login">Login</Link></li>}
                            {!isAuthenticated && <li><Link href="/signup">Sign up</Link></li>}
                        </ul>
                    </div>

                    <Link href="/" className="btn btn-ghost text-lg font-semibold tracking-wide text-white">
                        Vox Academic
                    </Link>
                </div>

                <div className="navbar-center hidden lg:flex">
                    <ul className="menu menu-horizontal px-1 text-white/80">
                        <li><Link href="/">Home</Link></li>
                        <li><Link href="/dashboard">Dashboard</Link></li>
                    </ul>
                </div>

                <div className="navbar-end gap-3">
                    {!isAuthenticated ? (
                        <>
                            <Link href="/login" className="btn btn-ghost hidden sm:inline-flex text-white/85 hover:bg-white/5 hover:text-white">
                                Login
                            </Link>
                            <Link href="/signup" className="btn btn-primary border-0 bg-linear-to-r from-cyan-500 to-sky-500 text-white hover:from-cyan-400 hover:to-sky-400">
                                Sign up
                            </Link>
                        </>
                    ) : (
                        <div className="dropdown dropdown-end">
                            <button tabIndex={0} className="btn btn-ghost border border-white/10 bg-white/5 text-white hover:bg-white/10">
                                <span className="avatar placeholder">
                                    {image ? (
                                        <img src={image} alt={displayName} className="w-9 rounded-full object-cover" />
                                    ) : (
                                        <span className="w-9 rounded-full bg-linear-to-r from-cyan-500 to-sky-500 text-sm font-semibold text-white">
                                            {initials}
                                        </span>
                                    )}
                                </span>
                                <span className="hidden text-left sm:block">
                                    <span className="block text-sm font-medium leading-4">{displayName}</span>
                                    <span className="block text-xs text-white/55">{provider}</span>
                                </span>
                            </button>
                            <ul tabIndex={0} className="menu dropdown-content mt-3 w-56 rounded-box border border-white/10 bg-base-100 p-2 shadow-xl">
                                <li className="pointer-events-none px-3 py-2 text-xs uppercase tracking-[0.2em] text-base-content/50">
                                    {displayName}
                                </li>
                                <li className="pointer-events-none px-3 pb-1 text-xs text-base-content/50 normal-case tracking-normal">
                                    {email}
                                </li>
                                <li><Link href="/dashboard">Dashboard</Link></li>
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => void signOut({ callbackUrl: '/' })}
                                    >
                                        Sign out
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
