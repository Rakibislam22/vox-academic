"use client";

import { ReactNode, useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import { PDFProvider } from "@/components/dashboard/PDFContext";

export default function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        // Lock body scroll when sidebar drawer is open on mobile
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
                {/* Sidebar for desktop */}
                <div className="hidden xl:block">
                    <Sidebar />
                </div>

                {/* Mobile header */}
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

                        <button
                            aria-label="User profile"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-linear-to-br from-[#1a8cff]/20 to-[#00d4ff]/20 text-white shadow-[0_0_18px_rgba(26,140,255,0.16)] transition-transform active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 19.5a7.5 7.5 0 0 1 15 0" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile drawer overlay + sidebar */}
                {sidebarOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <Sidebar isDrawer onClose={() => setSidebarOpen(false)} />
                    </>
                )}

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden relative z-content pt-4 lg:pt-0 lg:overflow-hidden">
                    {children}
                </div>
            </div>
        </PDFProvider>
    );
}
