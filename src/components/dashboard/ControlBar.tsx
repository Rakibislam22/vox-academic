"use client";

import { useState } from "react";

interface ControlBarProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    currentTime: number;
    onTimeChange: (time: number) => void;
    duration: number;
    playbackSpeed: number;
    onSpeedChange: (speed: number) => void;
    selectedVoice: string;
    onVoiceChange: (voice: string) => void;
}

export default function ControlBar({
    isPlaying,
    onPlayPause,
    currentTime,
    onTimeChange,
    duration,
    playbackSpeed,
    onSpeedChange,
    selectedVoice,
    onVoiceChange,
}: ControlBarProps) {
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [showVoiceMenu, setShowVoiceMenu] = useState(false);

    const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
    const voices = [
        "Aura - Natural",
        "Nova - Confident",
        "Echo - Calm",
        "Ember - Energetic",
    ];

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="glass mx-3 mb-3 rounded-2xl border border-white/10 bg-white/3 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl shrink-0 overflow-visible sm:mx-4 sm:mb-4 sm:px-5 lg:mx-0 lg:mb-0 lg:rounded-none lg:border-x-0 lg:border-b lg:px-6 lg:py-3 lg:h-16">
            {/* Left: Playback Controls */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full lg:w-auto">
                {/* Play/Pause */}
                <button
                    onClick={onPlayPause}
                    className="shrink-0 btn-primary w-10 h-10 rounded-lg flex items-center justify-center transition-transform active:scale-95 hover:shadow-electric"
                >
                    {isPlaying ? "⏸" : "▶"}
                </button>

                {/* Time Display */}
                <div className="text-data text-slate-400 shrink-0 hidden sm:block">
                    {formatTime(currentTime)} / {formatTime(duration || 600)}
                </div>

                {/* Progress Bar */}
                <div className="flex-1 min-w-0 w-full lg:w-64 xl:w-md">
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={(e) => onTimeChange(Number(e.target.value))}
                        className="w-full h-1 bg-electric-blue/20 rounded-full appearance-none cursor-pointer accent-electric-blue"
                        style={{
                            background: `linear-gradient(to right, #1a8cff 0%, #1a8cff ${((currentTime / (duration || 100)) * 100) || 0
                                }%, rgba(26,140,255,0.2) ${((currentTime / (duration || 100)) * 100) || 0
                                }%, rgba(26,140,255,0.2) 100%)`,
                        }}
                    />
                </div>
            </div>

            {/* Right: Settings & Voice */}
            <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 w-full justify-between lg:mt-0 lg:w-auto lg:justify-end lg:flex-nowrap">
                {/* Speed Selector */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowSpeedMenu(!showSpeedMenu);
                            setShowVoiceMenu(false);
                        }}
                        className="btn-secondary px-3 py-2 text-xs whitespace-nowrap"
                    >
                        {playbackSpeed}x
                    </button>
                    {showSpeedMenu && (
                        <div className="absolute bottom-12 right-0 bg-white/4 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg z-modal overflow-hidden min-w-24">
                            {speeds.map((speed) => (
                                <button
                                    key={speed}
                                    onClick={() => {
                                        onSpeedChange(speed);
                                        setShowSpeedMenu(false);
                                    }}
                                    className={`block w-full px-4 py-2 text-left text-sm border-b border-white/5 hover:bg-white/10 active:scale-95 transition-transform ${playbackSpeed === speed ? "text-electric-blue font-semibold" : ""
                                        }`}
                                >
                                    {speed}x
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Voice Selector */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowVoiceMenu(!showVoiceMenu);
                            setShowSpeedMenu(false);
                        }}
                        className="btn-secondary px-3 py-2 text-xs max-w-xs truncate"
                    >
                        {selectedVoice.split(" ")[0]}
                    </button>
                    {showVoiceMenu && (
                        <div className="absolute bottom-12 right-0 bg-white/4 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg z-modal overflow-hidden max-w-xs min-w-40">
                            {voices.map((voice) => (
                                <button
                                    key={voice}
                                    onClick={() => {
                                        onVoiceChange(voice);
                                        setShowVoiceMenu(false);
                                    }}
                                    className={`block w-full px-4 py-2 text-left text-sm border-b border-white/5 hover:bg-white/10 active:scale-95 transition-transform whitespace-nowrap ${selectedVoice === voice ? "text-electric-blue font-semibold" : ""
                                        }`}
                                >
                                    {voice}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Waveform Indicator */}
                <div className="hidden sm:flex items-center gap-1 h-6">
                    {[30, 45, 60, 50, 70, 55, 40].map((height, i) => (
                        <div
                            key={i}
                            className="w-1 bg-linear-to-t from-electric-blue to-cyan-accent rounded-sm opacity-60 animate-breathe"
                            style={{
                                height: `${height}%`,
                                animationDelay: `${i * 0.1}s`,
                            }}
                        />
                    ))}
                </div>

                {/* Volume/More Options */}
                <button className="btn-ghost w-10 h-10 rounded-lg flex items-center justify-center active:scale-95 transition-transform">
                    ⚙️
                </button>
            </div>
        </div>
    );
}
