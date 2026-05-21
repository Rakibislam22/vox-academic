"use client";

import Image from "next/image";
import { ReactNode, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import Sidebar from "@/components/dashboard/Sidebar";
import { PDFProvider } from "@/components/dashboard/PDFContext";

type Props = {
    children: ReactNode;
    session: Session | null;
};

export default function DashboardClient({ children, session }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const displayName = session?.user?.name || session?.user?.email || "Account";
    const email = session?.user?.email || "";
    const provider = session?.user?.provider || "credentials";
    const initials = (displayName || "A")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
    const hasSession = !!session?.user;

    useEffect(() => {
        if (typeof window !== "undefined") {
            document.body.style.overflow = sidebarOpen ? "hidden" : "";
        }
        return () => {
            if (typeof window !== "undefined") document.body.style.overflow = "";
        };
    }, [sidebarOpen]);

    return (
        <PDFProvider>
            <div className="flex h-dvh min-h-0 flex-col xl:flex-row overflow-x-hidden overflow-y-auto lg:overflow-hidden bg-gradient-foundation">
                <div className="hidden xl:block">
                    <Sidebar session={session} />
                </div>

                <div className="sticky top-0 z-40 w-full border-b border-white/10 bg-[rgba(5,11,24,0.72)] px-4 py-3 backdrop-blur-xl lg:hidden">
                    <div className="flex items-center justify-between gap-3">
                        <button
                            aria-label="Open menu"
                            onClick={() => setSidebarOpen(true)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/3 text-[#1a8cff] transition-transform active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <div className="flex-1 text-center">
                            <span className="text-subheading font-semibold tracking-[0.18em] accent-primary">Vox</span>
                        </div>

                        {hasSession ? (
                            <div className="dropdown dropdown-end">
                                <button
                                    tabIndex={0}
                                    className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-linear-to-br from-[#1a8cff]/20 to-[#00d4ff]/20 px-2 pr-3 text-white shadow-[0_0_18px_rgba(26,140,255,0.16)] transition-transform active:scale-95"
                                    aria-label="User profile menu"
                                >
                                    <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/10 text-xs font-bold">
                                        {session?.user?.image ? (
                                            <Image src={session.user.image} alt={displayName} width={32} height={32} className="h-full w-full object-cover" />
                                        ) : (
                                            initials
                                        )}
                                    </span>
                                    <span className="text-left min-w-0">
                                        <span className="block max-w-24 truncate text-xs font-medium leading-4 sm:max-w-28">{displayName}</span>
                                        <span className="block max-w-24 truncate text-[10px] text-white/60 sm:max-w-28">{provider}</span>
                                    </span>
                                </button>

                                <ul tabIndex={0} className="menu dropdown-content mt-3 w-60 rounded-box border border-white/10 bg-base-100 p-2 shadow-xl">
                                    <li className="pointer-events-none px-3 py-2 text-xs uppercase tracking-[0.2em] text-base-content/50">
                                        {displayName}
                                    </li>
                                    <li className="pointer-events-none px-3 pb-1 text-xs text-base-content/50 normal-case tracking-normal">
                                        {email}
                                    </li>
                                    <li><button type="button" className="justify-start" onClick={() => void signOut({ callbackUrl: "/" })}>Logout</button></li>
                                </ul>
                            </div>
                        ) : (
                            <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-linear-to-br from-[#1a8cff]/20 to-[#00d4ff]/20 text-white shadow-[0_0_18px_rgba(26,140,255,0.16)] transition-transform active:scale-95">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 19.5a7.5 7.5 0 0 1 15 0" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>

                {sidebarOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <Sidebar session={session} isDrawer onClose={() => setSidebarOpen(false)} />
                    </>
                )}

                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden relative z-content pt-4 lg:pt-0 lg:overflow-hidden">
                    {children}
                </div>
            </div>
        </PDFProvider>
    );
}
