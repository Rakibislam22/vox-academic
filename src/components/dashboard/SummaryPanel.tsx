"use client";

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
        <div className="panel border-light flex flex-col h-full min-h-0 overflow-hidden">
            {/* Header */}
            <div className="border-b border-light px-4 sm:px-6 py-4 bg-navy-dark/50">
                <h3 className="text-subheading flex items-center gap-2">
                    <span>🧠</span>
                    AI Insights
                </h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto scrollbar-custom">
                {/* Key Concepts */}
                <div className="px-4 sm:px-6 py-5 sm:py-6 border-b border-light/30">
                    <div className="text-label accent-primary mb-4">Key Concepts</div>
                    <div className="space-y-3">
                        {insights.map((insight, idx) => (
                            <div
                                key={idx}
                                className="group p-3 panel-inset border-subtle hover:border-light/50 transition-smooth cursor-pointer"
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${insight.color === "cyan-accent"
                                            ? "bg-cyan-accent"
                                            : "bg-electric-blue"
                                            }`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-label text-white/90 group-hover:accent-primary transition-colors">
                                            {insight.label}
                                        </div>
                                        <p className="text-xs text-white/60 mt-1">
                                            {insight.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Study Tips */}
                <div className="px-4 sm:px-6 py-5 sm:py-6 border-b border-light/30">
                    <div className="text-label accent-primary mb-4">💡 Study Tips</div>
                    <div className="space-y-3">
                        {studyTips.map((tip, idx) => (
                            <div
                                key={idx}
                                className="p-3 panel-inset border-subtle hover:border-light/50 transition-smooth"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 text-lg">✓</span>
                                    <p className="text-xs text-white/70">{tip}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Waveform Visualizer */}
                <div className="px-4 sm:px-6 py-5 sm:py-6">
                    <div className="text-label accent-primary mb-4">Audio Activity</div>
                    <div className="h-14 sm:h-16 panel-inset border-subtle rounded-lg flex items-center justify-center p-4 gap-1 overflow-hidden">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex-1 h-full min-w-[3px] bg-gradient-to-t from-electric-blue to-cyan-accent rounded-sm opacity-70 animate-breathe"
                                style={{
                                    animationDelay: `${i * 0.08}s`,
                                    height: `${30 + Math.random() * 70}%`,
                                }}
                            />
                        ))}
                    </div>
                    <div className="text-data text-white/40 mt-2 text-center text-[10px] sm:text-xs">
                        Playing at 1.25x speed
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="border-t border-light/30 px-4 sm:px-6 py-4 bg-navy-dark/50">
                <button className="w-full btn-secondary text-center">
                    Download Summary PDF
                </button>
            </div>
        </div>
    );
}
