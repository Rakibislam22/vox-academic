"use client";

import Link from "next/link";
import { useState } from "react";

export default function Sidebar() {
    const [activeNav, setActiveNav] = useState("library");

    const navItems = [
        { id: "library", label: "My Library", icon: "📚", badge: "5" },
        { id: "recent", label: "Recent Reads", icon: "⏱️", badge: "" },
        { id: "summaries", label: "Summaries", icon: "📝", badge: "" },
        { id: "settings", label: "Settings", icon: "⚙️", badge: "" },
    ];

    return (
        <aside className="w-full xl:w-52 xl:min-h-screen bg-navy-darker border-b xl:border-b-0 xl:border-r border-light flex xl:flex-col">
            {/* Logo/Brand */}
            <div className="h-16 w-24 sm:w-28 xl:w-full border-r xl:border-r-0 xl:border-b border-light flex items-center justify-center flex-shrink-0">
                <Link href="/" className="text-xl font-bold accent-primary">
                    Vox
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-x-auto overflow-y-hidden xl:overflow-y-auto scrollbar-custom px-2 sm:px-3 py-3 xl:py-6">
                <div className="flex xl:block gap-2 xl:space-y-2 min-w-max xl:min-w-0">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveNav(item.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-label transition-smooth whitespace-nowrap xl:w-full ${activeNav === item.id
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

            {/* User Profile */}
            <div className="hidden xl:block border-t border-light p-4">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-navy-dark transition-smooth cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-blue to-cyan-accent flex items-center justify-center text-xs font-bold text-navy-dark">
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
