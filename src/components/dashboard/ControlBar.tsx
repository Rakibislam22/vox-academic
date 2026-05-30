'use client';

import { ChevronLeft, ChevronRight, Pause as PauseIcon, Play as PlayIcon } from 'lucide-react';

interface ControlBarProps {
  isPlaying: boolean;
  isLoadingAudio: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  playbackMode: 'stream' | 'browser';
  hasText: boolean;
  onPlayPause: () => void | Promise<void>;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onSeek: (nextTime: number) => void;
  onSpeedChange: (speed: number) => void;
  showFallbackToast?: boolean;
}

function formatTime(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(seconds, 0) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = Math.floor(safeSeconds % 60);

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function ControlBar({
  isPlaying,
  isLoadingAudio,
  currentTime,
  duration,
  playbackSpeed,
  playbackMode,
  hasText,
  onPlayPause,
  onSkipBackward,
  onSkipForward,
  onSeek,
  onSpeedChange,
  showFallbackToast,
}: ControlBarProps) {
  const canControl = hasText && (!isLoadingAudio || playbackMode === 'browser');
  const canScrub = hasText && !isLoadingAudio;

  const playbackStateLabel = isLoadingAudio ? 'Buffering' : isPlaying ? 'Playing' : hasText ? 'Paused' : 'No text';

  return (
    <>
      {showFallbackToast && (
        <div className="pointer-events-none fixed left-1/2 top-4 -translate-x-1/2" style={{ zIndex: 60 }}>
          <div className="flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/12 px-4 py-2 text-sm text-white shadow-[0_12px_32px_rgba(0,0,0,0.22)] backdrop-blur-lg animate-pulse">
            <span className="text-base text-amber-300">⚠️</span>
            <span>Network error. Falling back to offline browser voice.</span>
          </div>
        </div>
      )}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/8 bg-[#070a13]/88 backdrop-blur-lg">
        <div className="mx-auto w-full px-4 py-2 sm:px-5 lg:px-6" style={{ maxWidth: '1600px' }}>
          <div className="grid w-full items-start gap-3 lg:grid-cols-[minmax(0,1.35fr)_auto_minmax(0,0.95fr)] lg:items-center">
            <div className="flex min-w-0 flex-col gap-2 lg:max-w-105">
              <div className="flex min-w-0 items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium tracking-[0.14em] text-slate-400">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      {playbackMode === 'browser' ? 'Browser' : 'Stream'}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {playbackStateLabel}
                  </div>
                </div>

                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-medium uppercase tracking-[0.16em] text-slate-300">
                  {playbackSpeed.toFixed(2)}x
                </span>
              </div>

              <div className="w-full max-w-110 lg:max-w-115">
                <input
                  type="range"
                  min={0}
                  max={Math.max(duration, 1)}
                  step={0.1}
                  value={Math.min(currentTime, duration || 0)}
                  onChange={(event) => onSeek(Number(event.target.value))}
                  style={{
                    background: `linear-gradient(to right, rgb(14 165 233) 0%, rgb(14 165 233) ${duration > 0 ? (Math.min(currentTime, duration) / duration) * 100 : 0}%, rgba(255,255,255,0.1) ${duration > 0 ? (Math.min(currentTime, duration) / duration) * 100 : 0}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                  className="timeline-slider h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 disabled:cursor-not-allowed"
                  disabled={!canScrub}
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={onSkipBackward}
                disabled={!canScrub}
                aria-label="Skip back 10 seconds"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all duration-200 hover:scale-105 hover:border-white/20 hover:bg-white/10 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onPlayPause}
                disabled={!canControl}
                aria-label={isLoadingAudio ? 'Loading audio' : isPlaying ? 'Pause audio' : 'Play audio'}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1a8cff] p-3 text-white shadow-[0_0_20px_rgba(26,140,255,0.4)] transition-transform duration-200 hover:scale-105 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPlaying ? (
                  <PauseIcon className="h-5 w-5 text-slate-950" />
                ) : (
                  <PlayIcon className="h-5 w-5 text-slate-950" />
                )}
              </button>

              <button
                type="button"
                onClick={onSkipForward}
                disabled={!canScrub}
                aria-label="Skip forward 10 seconds"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all duration-200 hover:scale-105 hover:border-white/20 hover:bg-white/10 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-w-0 flex-col items-stretch gap-1.5 lg:items-end">
              <div className="flex w-full items-center justify-end gap-2 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                <span>Speed</span>
                <div className="flex items-center justify-end rounded-full border border-white/10 bg-white/5 px-2.5 py-1" style={{ minWidth: '112px' }}>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.1"
                    value={playbackSpeed}
                    onChange={(event) => onSpeedChange(Number(event.target.value))}
                    style={{
                      background: `linear-gradient(to right, rgb(14 165 233) 0%, rgb(14 165 233) ${((playbackSpeed - 0.5) / 2) * 100}%, rgba(255,255,255,0.1) ${((playbackSpeed - 0.5) / 2) * 100}%, rgba(255,255,255,0.1) 100%)`,
                    }}
                    className="speed-slider w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed"
                    disabled={!hasText}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
