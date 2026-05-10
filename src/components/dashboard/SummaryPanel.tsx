"use client";

const waveformHeights = [34, 58, 44, 76, 52, 63, 41, 71, 49, 68, 37, 55, 62, 46, 74, 39, 57, 69, 43, 61, 48, 73, 35, 66];

export default function SummaryPanel() {
    const insights = [
        {
            type: "concept",
            label: "Neuroplasticity",
            description: "The brain's ability to reorganize and adapt throughout life",
            color: "electric-blue",
        },
        {
            type: "concept",
            label: "Synaptic Plasticity",
            description: "Formation of new neural connections in response to experience",
            color: "cyan-accent",
        },
        {
            type: "concept",
            label: "Dual-Coding Hypothesis",
            description: "Concepts encoded in multiple formats are more robustly remembered",
            color: "electric-blue",
        },
    ];

    const studyTips = [
        "Take notes while listening to highlight personal connections",
        "Review the summary every 24 hours for spaced repetition",
        "Adjust playback speed to 1.25x for active engagement",
    ];

    return (
        <div className="panel flex flex-col h-full min-h-0 overflow-hidden rounded-2xl bg-white/2 backdrop-blur-xl border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            {/* Header */}
            <div className="border-b border-white/10 px-5 sm:px-6 py-5 bg-white/3">
                <h3 className="text-subheading flex items-center gap-2">
                    <span>🧠</span>
                    AI Insights
                </h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto scrollbar-custom">
                {/* Key Concepts */}
                <div className="px-5 sm:px-6 py-5 sm:py-6 border-b border-white/10">
                    <div className="text-label accent-primary mb-4">Key Concepts</div>
                    <div className="space-y-3">
                        {insights.map((insight, idx) => (
                            <div
                                key={idx}
                                className="group p-3 panel-inset border border-white/5 hover:border-white/10 active:scale-95 transition-transform cursor-pointer bg-white/3"
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`shrink-0 w-2 h-2 rounded-full mt-2 ${insight.color === "cyan-accent"
                                            ? "bg-cyan-accent"
                                            : "bg-electric-blue"
                                            }`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-label text-white group-hover:accent-primary transition-colors">
                                            {insight.label}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {insight.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Study Tips */}
                <div className="px-5 sm:px-6 py-5 sm:py-6 border-b border-white/10">
                    <div className="text-label accent-primary mb-4">💡 Study Tips</div>
                    <div className="space-y-3">
                        {studyTips.map((tip, idx) => (
                            <div
                                key={idx}
                                className="p-3 panel-inset border border-white/5 hover:border-white/10 active:scale-95 transition-transform bg-white/3"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="shrink-0 text-lg">✓</span>
                                    <p className="text-xs text-slate-300">{tip}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Waveform Visualizer */}
                <div className="px-5 sm:px-6 py-5 sm:py-6">
                    <div className="text-label accent-primary mb-4">Audio Activity</div>
                    <div className="h-14 sm:h-16 panel-inset border border-white/5 rounded-xl flex items-center justify-center p-4 gap-1 overflow-hidden bg-white/3">
                        {waveformHeights.map((height, i) => (
                            <div
                                key={i}
                                className="flex-1 h-full min-w-0.75 bg-linear-to-t from-electric-blue to-cyan-accent rounded-sm opacity-70 animate-breathe"
                                style={{
                                    animationDelay: `${i * 0.08}s`,
                                    height: `${height}%`,
                                }}
                            />
                        ))}
                    </div>
                    <div className="text-data text-slate-400 mt-2 text-center text-[10px] sm:text-xs">
                        Playing at 1.25x speed
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="border-t border-white/10 px-5 sm:px-6 py-4 bg-white/3">
                <button className="w-full btn-secondary text-center active:scale-95 transition-transform">
                    Download Summary PDF
                </button>
            </div>
        </div>
    );
}
