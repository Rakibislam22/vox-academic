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
            <div className="flex h-dvh min-h-0 flex-col xl:flex-row overflow-hidden bg-gradient-foundation">
                {/* Sidebar for desktop */}
                <div className="hidden xl:block">
                    <Sidebar />
                </div>

                {/* Mobile hamburger (shows in header area) */}
                <div className="lg:hidden w-full">
                    <div className="p-3 flex items-center">
                        <button
                            aria-label="Open menu"
                            onClick={() => setSidebarOpen(true)}
                            className="btn btn-ghost"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
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
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-content">
                    {children}
                </div>
            </div>
        </PDFProvider>
    );
}
