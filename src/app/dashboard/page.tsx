'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PDFPanel from '@/components/dashboard/PDFPanel';
import SummaryPanel from '@/components/dashboard/SummaryPanel';
import ControlBar from '@/components/dashboard/ControlBar';
import EmptyUploadState from '@/components/dashboard/EmptyUploadState'; // Initial layout custom component
import { usePDFContext } from '@/components/dashboard/PDFContext';

export default function DashboardPage() {
  const { cleanedTextForSpeech } = usePDFContext();
  const [activeMobileTab, setActiveMobileTab] = useState<'pdf' | 'insights'>('pdf');

  // New state to check if a document is uploaded/selected
  const [hasFile, setHasFile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlCacheRef = useRef<Map<string, string>>(new Map());
  const loadedTextRef = useRef('');

  const textForAudio = useMemo(() => cleanedTextForSpeech.trim(), [cleanedTextForSpeech]);

  // Simulated function for upload or internet browsing selection
  const handleFileSelect = () => {
    setHasFile(true);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    const audioUrlCache = audioUrlCacheRef.current;

    audio.preload = 'auto';

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleDurationChange = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);

      for (const url of audioUrlCache.values()) {
        URL.revokeObjectURL(url);
      }
      audioUrlCache.clear();
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    audio.currentTime = 0;
    loadedTextRef.current = '';
  }, [textForAudio]);

  const ensureAudioSource = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio || !textForAudio) {
      return false;
    }

    if (loadedTextRef.current === textForAudio && audio.src) {
      return true;
    }

    const cachedUrl = audioUrlCacheRef.current.get(textForAudio);
    if (cachedUrl) {
      audio.src = cachedUrl;
      audio.load();
      loadedTextRef.current = textForAudio;
      return true;
    }

    setIsLoadingAudio(true);

    try {
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textForAudio }),
      });

      if (!response.ok) {
        throw new Error(`Audio generation failed with status ${response.status}`);
      }

      const audioBlob = await response.blob();
      const objectUrl = URL.createObjectURL(audioBlob);

      audioUrlCacheRef.current.set(textForAudio, objectUrl);
      audio.src = objectUrl;
      audio.load();
      loadedTextRef.current = textForAudio;
      return true;
    } catch (error) {
      console.error('Failed to load audio stream:', error);
      return false;
    } finally {
      setIsLoadingAudio(false);
    }
  }, [textForAudio]);

  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (isPlaying) {
      audio.pause();
      return;
    }

    if (!textForAudio) {
      return;
    }

    const hasSource = await ensureAudioSource();
    if (!hasSource) {
      return;
    }

    try {
      await audio.play();
    } catch (error) {
      console.error('Audio play failed:', error);
    }
  }, [ensureAudioSource, isPlaying, textForAudio]);

  const handleStop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  const handleSeek = useCallback((nextTime: number) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const safeTime = Math.max(0, Math.min(nextTime, duration || 0));
    audio.currentTime = safeTime;
    setCurrentTime(safeTime);
  }, [duration]);

  const handleSkipBy = useCallback((offsetSeconds: number) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const safeTime = Math.max(0, Math.min(audio.currentTime + offsetSeconds, duration || 0));
    audio.currentTime = safeTime;
    setCurrentTime(safeTime);
  }, [duration]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto overflow-x-hidden lg:overflow-hidden">
      {/* Mobile tabs: Show ONLY if file is present */}
      {hasFile && (
        <div className="px-4 pt-4 sm:px-6 sm:pt-6 lg:hidden">
          <div className="rounded-2xl border border-white/10 bg-white/3 p-1 backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setActiveMobileTab('pdf')}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-transform active:scale-95 ${activeMobileTab === 'pdf'
                  ? 'bg-white/8 text-white shadow-[0_0_20px_rgba(26,140,255,0.14)]'
                  : 'text-slate-400'
                  }`}
              >
                PDF View
              </button>
              <button
                onClick={() => setActiveMobileTab('insights')}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-transform active:scale-95 ${activeMobileTab === 'insights'
                  ? 'bg-white/8 text-white shadow-[0_0_20px_rgba(26,140,255,0.14)]'
                  : 'text-slate-400'
                  }`}
              >
                AI Insights
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div
        className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 pt-0 sm:p-6 sm:pt-0 ${hasFile
          ? 'lg:grid lg:grid-cols-[1.22fr_1fr] lg:gap-6 lg:overflow-hidden'
          : 'lg:flex lg:justify-start' // When no file, take initial alignment
          }`}
      >
        {/* INITIAL STATE (No file loaded) */}
        {!hasFile ? (
          <div className="w-full h-full transition-all duration-500 ease-in-out">
            {/* Apnar upload component jekhane user local file and dynamic web discovery options pabe */}
            <EmptyUploadState onUploadSuccess={handleFileSelect} />
          </div>
        ) : (
          /* ACTIVE STATE (File loaded) */
          <>
            {/* Mobile View Toggle */}
            <div className="min-h-0 overflow-y-auto overflow-x-hidden lg:hidden">
              {activeMobileTab === 'pdf' ? <PDFPanel /> : <SummaryPanel />}
            </div>

            {/* Desktop Panel 1: PDF Viewer / Processor */}
            <div className="hidden min-h-0 overflow-hidden lg:block">
              <PDFPanel />
            </div>

            {/* Desktop Panel 2: AI Insights (Hidden initially, appears now) */}
            <div className="hidden min-h-0 overflow-hidden lg:block">
              <SummaryPanel />
            </div>
          </>
        )}
      </div>

      {/* Control Bar: Only displays or becomes active when file exists */}
      {hasFile && (
        <ControlBar
          isPlaying={isPlaying}
          isLoadingAudio={isLoadingAudio}
          currentTime={currentTime}
          duration={duration}
          playbackSpeed={playbackSpeed}
          hasText={Boolean(textForAudio)}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onSkipBackward={() => handleSkipBy(-10)}
          onSkipForward={() => handleSkipBy(10)}
          onSeek={handleSeek}
          onSpeedChange={setPlaybackSpeed}
        />
      )}

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
