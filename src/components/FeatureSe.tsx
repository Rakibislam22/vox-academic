"use client";

import { useState } from "react";

const FeatureSe = () => {
    const [activeFeature, setActiveFeature] = useState(0);

    const features = [
        {
            title: "Focused Reading",
            desc: "Immersive PDF reader with word-level highlighting synchronized to audio playback.",
            icon: "🎯",
            color: "bg-electric-blue/20",
            accent: "text-electric-blue",
            preview: (
                <div className="w-full h-full p-4 flex flex-col gap-3 justify-center">
                    <div className="h-3 w-full bg-white/20 rounded animate-pulse" />
                    <div className="h-3 w-4/5 bg-white/40 rounded shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                    <div className="h-3 w-full bg-white/20 rounded animate-pulse" />
                    <div className="flex justify-center mt-4">
                        <div className="px-3 py-1 rounded bg-electric-blue/30 text-[10px] border border-electric-blue/50 text-white italic">
                            {`Reading line 42: Adaptive Systems...`}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: "Side-by-Side Analytics",
            desc: "Real-time AI summaries, key concepts, and learning tips appear alongside your document.",
            icon: "📊",
            color: "bg-cyan-accent/20",
            accent: "text-cyan-accent",
            preview: (
                <div className="flex h-full w-full border border-white/10 rounded overflow-hidden">
                    <div className="w-1/2 border-r border-white/10 p-2 space-y-2">
                        <div className="h-1 w-full bg-white/10 rounded" />
                        <div className="h-1 w-full bg-white/10 rounded" />
                        <div className="h-1 w-3/4 bg-white/10 rounded" />
                    </div>
                    <div className="w-1/2 p-2 bg-cyan-accent/5">
                        <div className="text-[8px] text-cyan-accent font-bold mb-1">AI INSIGHT</div>
                        <div className="h-2 w-full bg-cyan-accent/20 rounded mb-1" />
                        <div className="h-2 w-2/3 bg-cyan-accent/20 rounded" />
                    </div>
                </div>
            ),
        },
        {
            title: "Playback Control",
            desc: "Adjust speed (0.75x–2.0x), switch voices, and control progress with our minimalist control bar.",
            icon: "🎚️",
            color: "bg-electric-blue/20",
            accent: "text-electric-blue",
            preview: (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                    <div className="flex items-center gap-4">
                        <span className="text-white/40 text-xs">0.75x</span>
                        <div className="px-3 py-1 rounded bg-electric-blue text-white text-xs font-bold ring-4 ring-electric-blue/20">1.5x</div>
                        <span className="text-white/40 text-xs">2.0x</span>
                    </div>
                    <div className="w-3/4 h-1 bg-white/10 rounded-full relative">
                        <div className="absolute left-0 top-0 h-full w-2/3 bg-electric-blue rounded-full" />
                        <div className="absolute left-2/3 top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-lg" />
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 pt-20">
            <h2 className="text-heading text-center mb-16">
                Built for <span className="accent-primary">Deep Focus</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-16 items-center">
                {/* Left Side: Interactive List */}
                <div className="space-y-4">
                    {features.map((f, idx) => (
                        <div
                            key={idx}
                            onMouseEnter={() => setActiveFeature(idx)}
                            className={`flex gap-6 p-6 rounded-2xl cursor-pointer transition-all duration-300 border ${activeFeature === idx
                                    ? "bg-white/5 border-white/10 shadow-2xl scale-[1.02]"
                                    : "bg-transparent border-transparent opacity-60 hover:opacity-100"
                                }`}
                        >
                            <div className="shrink-0">
                                <div className={`flex items-center justify-center h-14 w-14 rounded-xl ${f.color} text-2xl shadow-inner`}>
                                    {f.icon}
                                </div>
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold mb-2 ${activeFeature === idx ? "text-white" : "text-white/80"}`}>
                                    {f.title}
                                </h3>
                                <p className="text-white/60 leading-relaxed text-sm md:text-base">
                                    {f.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Side: Dynamic Visual Device */}
                <div className="relative group">
                    {/* Decorative Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-electric-blue to-cyan-accent rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

                    <div className="relative panel border-light p-4 bg-navy-darker/80 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
                        {/* Minimal Browser Header */}
                        <div className="flex items-center gap-2 mb-4 px-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/20" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                            <div className="w-3 h-3 rounded-full bg-green-500/20" />
                            <div className="ml-4 h-4 w-32 bg-white/5 rounded-full" />
                        </div>

                        {/* Feature Dynamic Content */}
                        <div className="aspect-video bg-black/40 rounded-xl flex items-center justify-center border border-white/5 relative overflow-hidden transition-all duration-500">
                            {features[activeFeature].preview}

                            {/* Background Grid Pattern */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                        </div>

                        {/* Description Tag */}
                        <div className="mt-6 flex items-center justify-between px-2">
                            <div className="flex gap-2">
                                <div className="h-2 w-8 bg-white/10 rounded-full" />
                                <div className="h-2 w-12 bg-white/10 rounded-full" />
                            </div>
                            <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">
                                Vox Studio Engine v3.0
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeatureSe;