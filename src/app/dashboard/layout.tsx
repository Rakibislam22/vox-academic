"use client";

import { ReactNode } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import { PDFProvider } from "@/components/dashboard/PDFContext";

export default function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <PDFProvider>
            <div className="flex min-h-screen flex-col xl:flex-row overflow-hidden bg-gradient-foundation">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-content">
                    {children}
                </div>
            </div>
        </PDFProvider>
    );
}
