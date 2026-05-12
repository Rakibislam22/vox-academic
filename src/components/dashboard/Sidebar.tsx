"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
    isDrawer?: boolean;
    onClose?: () => void;
};

export default function Sidebar({ isDrawer = false, onClose }: Props) {
    const [activeNav, setActiveNav] = useState("library");

    const navItems = [
        { id: "library", label: "My Library", icon: "📚", badge: "5" },
        { id: "recent", label: "Recent Reads", icon: "⏱️", badge: "" },
        { id: "summaries", label: "Summaries", icon: "📝", badge: "" },
        { id: "settings", label: "Settings", icon: "⚙️", badge: "" },
    ];

    const baseClasses = isDrawer
        ? "fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 bg-white/2 backdrop-blur-xl border-r border-white/10 flex flex-col overflow-auto"
        : "w-full xl:w-52 h-auto xl:h-full xl:min-h-0 bg-white/2 backdrop-blur-xl border-b xl:border-b-0 xl:border-r border-white/10 flex xl:flex-col";

    return (
        <aside className={baseClasses}>
            <div className={`h-16 w-full border-r xl:border-r-0 xl:border-b border-white/10 flex items-center justify-between px-4 shrink-0 bg-white/3 ${isDrawer ? "border-r-0" : ""}`}>
                <Link href="/" className="text-xl font-bold accent-primary">
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
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-label transition-transform active:scale-95 whitespace-nowrap xl:w-full ${activeNav === item.id
                                ? "bg-electric-blue/20 text-electric-blue border border-electric-blue/40"
                                : "text-white/70 hover:text-white/90 hover:bg-navy-dark"
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

            <div className="hidden xl:block border-t border-white/10 p-4 bg-white/2">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-navy-dark active:scale-95 transition-transform cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-electric-blue to-cyan-accent flex items-center justify-center text-xs font-bold text-navy-dark">
                        U
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-label text-white/90 truncate">User</div>
                        <div className="text-xs text-white/50 truncate">user@example.com</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
