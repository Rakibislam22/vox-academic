"use client";

import { useState } from "react";
import PDFPanel from "@/components/dashboard/PDFPanel";
import SummaryPanel from "@/components/dashboard/SummaryPanel";
import ControlBar from "@/components/dashboard/ControlBar";

export default function DashboardPage() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [selectedVoice, setSelectedVoice] = useState("Aura - Natural");

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Main content area */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 sm:p-6">
                {/* PDF Panel - 55% */}
                <div className="flex-1 lg:flex-[1.22] min-h-[32rem] lg:min-h-0 overflow-hidden">
                    <PDFPanel />
                </div>

                {/* Summary Panel - 45% */}
                <div className="flex-1 min-h-[30rem] lg:min-h-0 overflow-hidden">
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
