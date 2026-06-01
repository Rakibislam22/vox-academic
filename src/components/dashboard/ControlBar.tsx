'use client';

import { Pause as PauseIcon, Play as PlayIcon } from 'lucide-react';
import { usePDFContext } from './PDFContext';

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
  selectedVoice?: string;
  onVoiceChange?: (voice: string) => void;
  showFallbackToast?: boolean;
}

function formatTime(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(seconds, 0) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = Math.floor(safeSeconds % 60);

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function ControlBar(_props: ControlBarProps) {
  void _props;

  const { speech } = usePDFContext();
  const isPlaying = speech.isPlaying;
  const currentTime = speech.currentTime;
  const duration = speech.duration;
  const playbackSpeed = speech.playbackSpeed;
  const hasText = speech.cleanedText.trim().length > 0;

  const canControl = hasText;
  const canScrub = hasText && duration > 0;

  const cyclePlaybackSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const nextIndex = speeds.findIndex((speed) => speed === playbackSpeed);
    const nextSpeed = speeds[(nextIndex + 1) % speeds.length] ?? 1;

    speech.setPlaybackSpeed(nextSpeed);
  };

  const handleSeek = (nextTime: number) => {
    speech.seekToTime(nextTime);
  };

  return (
    <div className="w-full shrink-0 border-t border-white/5 bg-slate-950/80 px-6 py-3 backdrop-blur-2xl">
      <div className="mx-auto grid w-full items-center gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="font-mono text-sm font-medium tracking-[0.18em] text-slate-300 sm:text-base">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => speech.toggle()}
            disabled={!canControl}
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-slate-950 shadow-[0_0_24px_rgba(14,165,233,0.55),0_0_60px_rgba(6,182,212,0.2)] transition-transform duration-200 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPlaying ? (
              <PauseIcon className="h-6 w-6" />
            ) : (
              <PlayIcon className="h-6 w-6" />
            )}
          </button>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-3">
          <div className="min-w-0 flex-1 max-w-[min(100%,38rem)]">
            <input
              type="range"
              min={0}
              max={Math.max(duration, 1)}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => handleSeek(Number(event.target.value))}
              style={{
                background: `linear-gradient(to right, rgb(14 165 233) 0%, rgb(14 165 233) ${duration > 0 ? (Math.min(currentTime, duration) / duration) * 100 : 0}%, rgba(255,255,255,0.12) ${duration > 0 ? (Math.min(currentTime, duration) / duration) * 100 : 0}%, rgba(255,255,255,0.12) 100%)`,
              }}
              className="timeline-slider h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 disabled:cursor-not-allowed"
              disabled={!canScrub}
            />
          </div>

          <button
            type="button"
            onClick={cyclePlaybackSpeed}
            disabled={!hasText}
            className="inline-flex min-w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-sm font-semibold tracking-[0.16em] text-slate-100 transition-all duration-200 hover:border-cyan-400/30 hover:bg-white/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Change playback speed"
          >
            {playbackSpeed.toFixed(2)}X
          </button>
        </div>
      </div>
    </div>
  );
}
