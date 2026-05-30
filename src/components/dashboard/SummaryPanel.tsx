'use client';

import { useMemo } from 'react';
import { usePDFContext } from './PDFContext';

const waveformHeights = [
  34, 58, 44, 76, 52, 63, 41, 71, 49, 68, 37, 55, 62, 46, 74, 39, 57, 69, 43, 61, 48, 73, 35, 66,
];

const stopWords = new Set([
  'the', 'and', 'that', 'with', 'from', 'this', 'have', 'will', 'your', 'into', 'their', 'there',
  'about', 'through', 'for', 'are', 'was', 'were', 'has', 'had', 'its', 'our', 'can', 'also', 'not',
  'they', 'you', 'but', 'what', 'when', 'where', 'which', 'who', 'whom', 'why', 'how', 'a', 'an', 'to',
  'of', 'in', 'on', 'or', 'as', 'at', 'by', 'be', 'is', 'it', 'we', 'he', 'she', 'them', 'his', 'her',
  'than', 'then', 'more', 'less', 'over', 'under', 'after', 'before', 'during', 'each', 'every',
]);

function buildKeyConcepts(text: string) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 4 && !stopWords.has(word));

  const counts = new Map<string, number>();

  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([word, count]) => ({
      label: word.replace(/\b\w/g, (character) => character.toUpperCase()),
      description:
        count === 1
          ? 'Important term appearing in the extracted document'
          : `Repeated ${count} times in the extracted document`,
    }));
}

export default function SummaryPanel() {
  const { cleanedTextForSpeech, documentSummary, documentTitle } = usePDFContext();

  const insights = useMemo(() => buildKeyConcepts(cleanedTextForSpeech), [cleanedTextForSpeech]);

  const studyTips = [
    'Take notes while listening to highlight personal connections',
    'Review the summary every 24 hours for spaced repetition',
    'Adjust playback speed to 1.25x for active engagement',
  ];

  return (
    <div className="panel flex flex-col h-full min-h-0 overflow-hidden rounded-2xl bg-white/2 backdrop-blur-xl border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      {/* Header */}
      <div className="border-b border-white/10 px-5 sm:px-6 py-5 bg-white/3">
        <h3 className="text-subheading flex items-center gap-2">
          <span>🧠</span>
          {documentTitle}
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto scrollbar-custom">
        <div className="px-5 sm:px-6 py-5 sm:py-6 border-b border-white/10">
          <div className="text-label accent-primary mb-4">Summary Report</div>
          <p className="text-sm leading-6 text-slate-300/90">{documentSummary}</p>
        </div>

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
                  <div className="shrink-0 w-2 h-2 rounded-full mt-2 bg-cyan-accent" />
                  <div className="flex-1 min-w-0">
                    <div className="text-label text-white group-hover:accent-primary transition-colors">
                      {insight.label}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{insight.description}</p>
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
