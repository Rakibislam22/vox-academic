'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePDFContext } from '@/components/dashboard/PDFContext';

const PDFPanel = dynamic(() => import('@/components/dashboard/PDFPanel'), {
  ssr: false,
});
const SummaryPanel = dynamic(() => import('@/components/dashboard/SummaryPanel'), {
  ssr: false,
});
const ControlBar = dynamic(() => import('@/components/dashboard/ControlBar'), {
  ssr: false,
});
const EmptyUploadState = dynamic(() => import('@/components/dashboard/EmptyUploadState'), {
  ssr: false,
});

export default function DashboardPage() {
  const { cleanedTextForSpeech, speech } = usePDFContext();
  const [activeMobileTab, setActiveMobileTab] = useState<'pdf' | 'insights'>('pdf');
  const [playbackMode, setPlaybackMode] = useState<'stream' | 'browser'>('stream');

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
    speech.setRate(playbackSpeed);
  }, [playbackSpeed, speech]);

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
    setPlaybackMode('stream');
    speech.stop();
  }, [speech, textForAudio]);

  const activateBrowserFallback = useCallback(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }

    setPlaybackMode('browser');
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setIsLoadingAudio(false);
    loadedTextRef.current = '';

    speech.stop();
    speech.play();
  }, [speech]);

  const ensureAudioSource = useCallback(async (): Promise<'stream' | 'browser' | false> => {
    const audio = audioRef.current;

    if (!audio || !textForAudio) {
      return false;
    }

    if (loadedTextRef.current === textForAudio && audio.src) {
      return 'stream';
    }

    const cachedUrl = audioUrlCacheRef.current.get(textForAudio);
    if (cachedUrl) {
      audio.src = cachedUrl;
      audio.load();
      loadedTextRef.current = textForAudio;
      return 'stream';
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

      const responseContentType = response.headers.get('content-type') || '';

      if (responseContentType.includes('application/json')) {
        const responseBody = (await response.json().catch(() => null)) as
          | { fallbackToBrowser?: boolean }
          | null;

        if (responseBody?.fallbackToBrowser) {
          activateBrowserFallback();
          return 'browser';
        }
      }

      if (!response.ok) {
        throw new Error(`Audio generation failed with status ${response.status}`);
      }

      const audioBlob = await response.blob();
      const objectUrl = URL.createObjectURL(audioBlob);

      audioUrlCacheRef.current.set(textForAudio, objectUrl);
      audio.src = objectUrl;
      audio.load();
      loadedTextRef.current = textForAudio;
      setPlaybackMode('stream');
      return 'stream';
    } catch (error) {
      console.error('Failed to load audio stream:', error);
      return false;
    } finally {
      setIsLoadingAudio(false);
    }
  }, [activateBrowserFallback, textForAudio]);

  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current;

    if (playbackMode === 'browser') {
      if (speech.status === 'playing') {
        speech.pause();
        return;
      }

      if (speech.status === 'paused') {
        speech.play();
        return;
      }

      speech.play();
      return;
    }

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

    const sourceMode = await ensureAudioSource();
    if (!sourceMode) {
      return;
    }

    if (sourceMode === 'browser') {
      return;
    }

    try {
      await audio.play();
    } catch (error) {
      console.error('Audio play failed:', error);
    }
  }, [ensureAudioSource, isPlaying, playbackMode, speech, textForAudio]);

  const handleStop = useCallback(() => {
    if (playbackMode === 'browser') {
      speech.stop();
      setIsPlaying(false);
      return;
    }

    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  }, [playbackMode, speech]);

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
          : 'flex items-center justify-center lg:overflow-hidden'
          }`}
      >
        {/* INITIAL STATE (No file loaded) */}
        {!hasFile ? (
          <div className="w-full lg:w-[55%] transition-all duration-500 ease-in-out">
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
          isPlaying={playbackMode === 'browser' ? speech.status === 'playing' : isPlaying}
          isLoadingAudio={isLoadingAudio}
          currentTime={currentTime}
          duration={duration}
          playbackSpeed={playbackSpeed}
          playbackMode={playbackMode}
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
