'use client';

interface ControlBarProps {
  isPlaying: boolean;
  isLoadingAudio: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  hasText: boolean;
  onPlayPause: () => void | Promise<void>;
  onStop: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onSeek: (nextTime: number) => void;
  onSpeedChange: (speed: number) => void;
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
  hasText,
  onPlayPause,
  onStop,
  onSkipBackward,
  onSkipForward,
  onSeek,
  onSpeedChange,
}: ControlBarProps) {
  const canControl = hasText && !isLoadingAudio;

  return (
    <div className="glass mx-3 mb-3 rounded-2xl border border-white/10 bg-white/3 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl shrink-0 overflow-visible sm:mx-4 sm:mb-4 sm:px-5 lg:mx-0 lg:mb-0 lg:rounded-none lg:border-x-0 lg:border-b lg:px-6 lg:py-3 lg:h-16">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 w-full lg:w-auto">
          <button
            onClick={onSkipBackward}
            disabled={!canControl}
            className="shrink-0 btn-secondary w-10 h-10 rounded-xl flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Skip back 10 seconds"
          >
            -10
          </button>

          <button
            onClick={() => void onPlayPause()}
            disabled={!canControl}
            className="shrink-0 btn-primary w-11 h-11 rounded-xl flex items-center justify-center transition-transform active:scale-95 hover:shadow-electric disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isLoadingAudio ? '…' : isPlaying ? '⏸' : '▶'}
          </button>

          <button
            onClick={onSkipForward}
            disabled={!canControl}
            className="shrink-0 btn-secondary w-10 h-10 rounded-xl flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Skip forward 10 seconds"
          >
            +10
          </button>

          <button
            onClick={onStop}
            disabled={!hasText}
            className="shrink-0 btn-secondary px-3 py-2 text-xs uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Stop
          </button>

          <div className="min-w-0 flex-1 lg:w-96">
            <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-slate-400">
              <span>Playback speed</span>
              <span className="text-electric-blue font-semibold">{playbackSpeed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={playbackSpeed}
              onChange={(event) => onSpeedChange(Number(event.target.value))}
              className="w-full h-1 bg-electric-blue/20 rounded-full appearance-none cursor-pointer accent-electric-blue disabled:cursor-not-allowed"
              disabled={!hasText}
            />

            <input
              type="range"
              min={0}
              max={Math.max(duration, 1)}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => onSeek(Number(event.target.value))}
              className="mt-3 w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-accent disabled:cursor-not-allowed"
              disabled={!hasText}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-between text-xs text-slate-400 lg:justify-end">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
            {isLoadingAudio ? 'Buffering' : isPlaying ? 'Playing' : hasText ? 'Paused' : 'No text'}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
            {hasText ? 'Fish Audio stream' : 'Upload text to enable audio'}
          </span>
        </div>
      </div>
    </div>
  );
}
