"use client";

import { useState } from "react";
import PDFPanel from "@/components/dashboard/PDFPanel";
import SummaryPanel from "@/components/dashboard/SummaryPanel";
import ControlBar from "@/components/dashboard/ControlBar";

export default function DashboardPage() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [selectedVoice, setSelectedVoice] = useState("Aura - Natural");
    const [activeMobileTab, setActiveMobileTab] = useState<"pdf" | "insights">("pdf");

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
            {/* Mobile tabs */}
            <div className="px-4 pt-4 sm:px-6 sm:pt-6 lg:hidden">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-1 backdrop-blur-xl">
                    <div className="grid grid-cols-2 gap-1">
                        <button
                            onClick={() => setActiveMobileTab("pdf")}
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition-transform active:scale-95 ${activeMobileTab === "pdf"
                                ? "bg-white/[0.08] text-white shadow-[0_0_20px_rgba(26,140,255,0.14)]"
                                : "text-slate-400"
                                }`}
                        >
                            PDF View
                        </button>
                        <button
                            onClick={() => setActiveMobileTab("insights")}
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition-transform active:scale-95 ${activeMobileTab === "insights"
                                ? "bg-white/[0.08] text-white shadow-[0_0_20px_rgba(26,140,255,0.14)]"
                                : "text-slate-400"
                                }`}
                        >
                            AI Insights
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex-1 min-h-0 overflow-hidden p-4 pt-0 sm:p-6 sm:pt-0 lg:grid lg:grid-cols-[1.22fr_1fr] lg:gap-6">
                {/* Mobile: PDF or Insights */}
                <div className="min-h-0 overflow-hidden lg:hidden">
                    {activeMobileTab === "pdf" ? <PDFPanel /> : <SummaryPanel />}
                </div>

                {/* Desktop: show both panels side-by-side */}
                <div className="hidden min-h-0 overflow-hidden lg:block">
                    <PDFPanel />
                </div>

                <div className="hidden min-h-0 overflow-hidden lg:block">
                    <SummaryPanel />
                </div>
            </div>

            {/* Control Bar */}
            <ControlBar
                isPlaying={isPlaying}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                currentTime={currentTime}
                onTimeChange={setCurrentTime}
                duration={duration}
                playbackSpeed={playbackSpeed}
                onSpeedChange={setPlaybackSpeed}
                selectedVoice={selectedVoice}
                onVoiceChange={setSelectedVoice}
            />
        </div>
    );
}
