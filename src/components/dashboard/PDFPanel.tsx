"use client";

import { usePDFContext } from "./PDFContext";

export default function PDFPanel() {
    const { currentSentence, highlightedWord, setHighlightedWord } =
        usePDFContext();

    // Mock function to simulate scanning animation
    const highlightWords = currentSentence.split(" ").map((word) => {
        const cleanWord = word.replace(/[.,!?;:]/g, "");
        const isHighlighted = cleanWord.toUpperCase() === highlightedWord;

        return (
            <span key={word} className="mr-1">
                {isHighlighted ? (
                    <span
                        className="bg-electric-blue/60 px-1 py-0.5 rounded animate-pulse-soft"
                        onClick={() =>
                            setHighlightedWord(
                                highlightedWord === cleanWord.toUpperCase() ? "" : cleanWord.toUpperCase()
                            )
                        }
                    >
                        {word}
                    </span>
                ) : (
                    <span className="hover:bg-electric-blue/20 px-1 py-0.5 rounded cursor-pointer transition-smooth">
                        {word}
                    </span>
                )}
            </span>
        );
    });

    return (
        <div className="panel border-light flex flex-col h-full min-h-0 overflow-hidden">
            {/* Header */}
            <div className="border-b border-light px-4 sm:px-6 py-4">
                <h2 className="text-subheading mb-2 text-base sm:text-lg lg:text-xl">
                    <span className="text-warm text-cyan-accent">Aural Learning</span> in
                    Cognitive Psychology
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-data text-white/50">
                    <span>Page 12 of 45</span>
                    <span>Reading time: 8:24</span>
                </div>
            </div>

            {/* PDF Content Area */}
            <div className="flex-1 overflow-auto scrollbar-custom p-4 sm:p-6 relative">
                {/* Scan-line effect */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-electric-blue to-transparent opacity-30 animate-scan-line" />
                </div>

                {/* Main content */}
                <div className="prose prose-invert max-w-none">
                    {/* Paragraph 1 */}
                    <p className="text-body leading-relaxed text-sm sm:text-base text-white/85 mb-6">
                        {highlightWords}
                    </p>

                    {/* Paragraph 2 */}
                    <p className="text-body leading-relaxed text-sm sm:text-base text-white/85 mb-6">
                        This adaptive capacity, known as synaptic plasticity, allows the brain to form new
                        neural connections and reorganize existing pathways in response to learning,
                        experience, and injury. The implications for education are profound: traditional
                        rote memorization approaches may be suboptimal compared to active, multi-sensory
                        engagement strategies.
                    </p>

                    {/* Paragraph 3 */}
                    <p className="text-body leading-relaxed text-sm sm:text-base text-white/85 mb-6">
                        Research conducted at leading cognitive science laboratories has consistently
                        demonstrated that auditory input combined with visual tracking significantly
                        enhances comprehension retention and long-term memory formation. When learners
                        engage with material through multiple sensory channels simultaneously, cognitive
                        load is distributed more effectively across working memory systems.
                    </p>

                    {/* Callout Box */}
                    <div className="my-8 p-4 panel-inset border-light">
                        <div className="text-label accent-primary mb-2">💡 Key Finding</div>
                        <p className="text-body text-sm sm:text-base text-white/80">
                            Multi-modal learning (audio + visual) increases retention by 65% compared to
                            single-modality approaches, according to Mayer's Cognitive Theory of Multimedia
                            Learning (2009).
                        </p>
                    </div>

                    {/* Paragraph 4 */}
                    <p className="text-body leading-relaxed text-sm sm:text-base text-white/85">
                        The synchronization between auditory playback and visual highlighting serves two
                        critical functions: it maintains attention through paced exposure and it leverages
                        the dual-coding hypothesis, whereby concepts encoded in multiple formats are more
                        robustly represented in long-term memory.
                    </p>
                </div>
            </div>

            {/* Footer Info */}
            <div className="border-t border-light px-4 sm:px-6 py-3 bg-navy-dark/50 text-data text-white/40">
                <span>📍 Synchronized to: 2m 45s</span>
            </div>
        </div>
    );
}
