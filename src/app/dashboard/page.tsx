'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePDFContext } from '@/components/dashboard/PDFContext';
import { fetchGeneratedAudio } from '@/components/dashboard/audioApi';

const PDFPanel = dynamic(() => import('@/components/dashboard/PDFPanel'), { ssr: false });
const SummaryPanel = dynamic(() => import('@/components/dashboard/SummaryPanel'), { ssr: false });
const ControlBar = dynamic(() => import('@/components/dashboard/ControlBar'), { ssr: false });
const EmptyUploadState = dynamic(() => import('@/components/dashboard/EmptyUploadState'), {
  ssr: false,
});

type TtsVoice = 'en-US-AndrewNeural' | 'en-US-EmmaNeural';

export default function DashboardPage() {
  const { cleanedTextForSpeech } = usePDFContext();
  const [activeMobileTab, setActiveMobileTab] = useState<'pdf' | 'insights'>('pdf');
  const [hasFile, setHasFile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<TtsVoice>('en-US-AndrewNeural');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlCacheRef = useRef<Map<string, string>>(new Map());
  const loadedTextRef = useRef('');

  const textForAudio = useMemo(() => cleanedTextForSpeech.trim(), [cleanedTextForSpeech]);
  const audioCacheKey = `${selectedVoice}::${textForAudio}`;

  const handleFileSelect = useCallback(() => {
    setHasFile(true);
  }, []);

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
    setAudioError(null);
  }, [textForAudio, selectedVoice]);

  const ensureAudioSource = useCallback(async (): Promise<boolean> => {
    const audio = audioRef.current;

    if (!audio || !textForAudio) {
      return false;
    }

    if (loadedTextRef.current === audioCacheKey && audio.src) {
      return true;
    }

    const cachedUrl = audioUrlCacheRef.current.get(audioCacheKey);

    if (cachedUrl) {
      audio.src = cachedUrl;
      audio.load();
      loadedTextRef.current = audioCacheKey;
      return true;
    }

    setAudioError(null);
    setIsLoadingAudio(true);

    try {
      const audioBlob = await fetchGeneratedAudio(textForAudio, selectedVoice);
      const objectUrl = URL.createObjectURL(audioBlob);

      audioUrlCacheRef.current.set(audioCacheKey, objectUrl);
      audio.src = objectUrl;
      audio.load();
      loadedTextRef.current = audioCacheKey;

      return true;
    } catch (error) {
      console.error('Failed to load audio stream:', error);
      setAudioError(error instanceof Error ? error.message : 'Audio loading failed');
      return false;
    } finally {
      setIsLoadingAudio(false);
    }
  }, [audioCacheKey, selectedVoice, textForAudio]);

  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    if (!textForAudio) {
      return;
    }

    const sourceMode = await ensureAudioSource();

    if (!sourceMode) {
      return;
    }

    setIsPlaying(true);

    try {
      await audio.play();
    } catch (error) {
      setIsPlaying(false);
      console.error('Audio play failed:', error);
      setAudioError(error instanceof Error ? error.message : 'Audio play failed');
    }
  }, [ensureAudioSource, isPlaying, textForAudio]);

  const handleSeek = useCallback(
    (nextTime: number) => {
      const audio = audioRef.current;

      if (!audio) {
        return;
      }

      const safeTime = Math.max(0, Math.min(nextTime, duration || 0));
      audio.currentTime = safeTime;
      setCurrentTime(safeTime);
    },
    [duration],
  );

  const handleSkipBy = useCallback(
    (offsetSeconds: number) => {
      const audio = audioRef.current;

      if (!audio) {
        return;
      }

      const safeTime = Math.max(0, Math.min(audio.currentTime + offsetSeconds, duration || 0));
      audio.currentTime = safeTime;
      setCurrentTime(safeTime);
    },
    [duration],
  );

  return (
    <div className="flex h-screen max-h-screen w-full overflow-hidden bg-[#070a13] text-slate-200">
      <div className="flex flex-1 flex-col h-full min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden px-4 pt-4 sm:px-6 sm:pt-6 lg:px-6 lg:pt-6">
          {!hasFile ? (
            <div className="flex h-full min-h-0 items-center justify-center overflow-hidden">
              <div className="w-full transition-all duration-500 ease-in-out lg:w-[55%]">
                <EmptyUploadState onUploadSuccess={handleFileSelect} />
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
              <div className="mb-4 shrink-0 lg:hidden">
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

              <div className="flex-1 min-h-0 overflow-hidden lg:grid lg:grid-cols-[1.2fr_1fr] lg:gap-6 lg:h-full">
                <div className="h-full min-h-0 overflow-hidden lg:hidden">
                  {activeMobileTab === 'pdf' ? <PDFPanel /> : <SummaryPanel />}
                </div>

                <div className="hidden h-full min-h-0 overflow-hidden lg:block">
                  <PDFPanel />
                </div>

                <div className="hidden h-full min-h-0 overflow-hidden lg:block">
                  <SummaryPanel />
                </div>
              </div>
            </div>
          )}

          {hasFile && (
            <div className="w-full shrink-0 border-t border-white/5 bg-[#070a13]/90 px-6 py-3 backdrop-blur-2xl">
              {audioError && (
                <div className="mb-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  Audio failed: {audioError}
                </div>
              )}
              <ControlBar
                isPlaying={isPlaying}
                isLoadingAudio={isLoadingAudio}
                currentTime={currentTime}
                duration={duration}
                playbackSpeed={playbackSpeed}
                playbackMode="stream"
                hasText={Boolean(textForAudio)}
                onPlayPause={handlePlayPause}
                onSkipBackward={() => handleSkipBy(-10)}
                onSkipForward={() => handleSkipBy(10)}
                onSeek={handleSeek}
                onSpeedChange={setPlaybackSpeed}
                selectedVoice={selectedVoice}
                onVoiceChange={(voice) => setSelectedVoice(voice as TtsVoice)}
              />
            </div>
          )}

          <audio ref={audioRef} className="hidden" />
        </div>
      </div>
    </div>
  );
}
