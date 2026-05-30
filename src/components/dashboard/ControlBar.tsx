'use client';

import { usePDFContext } from './PDFContext';

export default function ControlBar() {
  const { speech } = usePDFContext();

  return (
    <div className="glass mx-3 mb-3 rounded-2xl border border-white/10 bg-white/3 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl shrink-0 overflow-visible sm:mx-4 sm:mb-4 sm:px-5 lg:mx-0 lg:mb-0 lg:rounded-none lg:border-x-0 lg:border-b lg:px-6 lg:py-3 lg:h-16">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 min-w-0 w-full lg:w-auto">
          <button
            onClick={speech.toggle}
            disabled={!speech.isSupported}
            className="shrink-0 btn-primary w-11 h-11 rounded-xl flex items-center justify-center transition-transform active:scale-95 hover:shadow-electric disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={speech.status === 'playing' ? 'Pause speech' : 'Play speech'}
          >
            {speech.status === 'playing' ? '⏸' : '▶'}
          </button>

          <button
            onClick={speech.stop}
            disabled={!speech.isSupported}
            className="shrink-0 btn-secondary px-3 py-2 text-xs uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Stop
          </button>

          <div className="min-w-0 flex-1 lg:w-96">
            <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-slate-400">
              <span>Speech speed</span>
              <span className="text-electric-blue font-semibold">{speech.rate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={speech.rate}
              onChange={(event) => speech.setRate(Number(event.target.value))}
              className="w-full h-1 bg-electric-blue/20 rounded-full appearance-none cursor-pointer accent-electric-blue disabled:cursor-not-allowed"
              disabled={!speech.isSupported}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-between text-xs text-slate-400 lg:justify-end">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
            {speech.status === 'playing'
              ? 'Speaking'
              : speech.status === 'paused'
                ? 'Paused'
                : 'Ready'}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
            {speech.activeWordIndex >= 0 ? `Word ${speech.activeWordIndex + 1}` : 'No word active'}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
            {speech.words.length} words
          </span>
          {!speech.isSupported && (
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-amber-200 backdrop-blur-md">
              Web Speech API unavailable
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
