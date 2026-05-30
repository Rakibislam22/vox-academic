'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePDFContext } from '@/components/dashboard/PDFContext';

const PDFPanel = dynamic(() => import('@/components/dashboard/PDFPanel'), { ssr: false });
const SummaryPanel = dynamic(() => import('@/components/dashboard/SummaryPanel'), { ssr: false });
const ControlBar = dynamic(() => import('@/components/dashboard/ControlBar'), { ssr: false });
const EmptyUploadState = dynamic(() => import('@/components/dashboard/EmptyUploadState'), {
    ssr: false,
});

export default function DashboardPage() {
    const { cleanedTextForSpeech, speech } = usePDFContext();
    const [activeMobileTab, setActiveMobileTab] = useState<'pdf' | 'insights'>('pdf');
    const [playbackMode, setPlaybackMode] = useState<'stream' | 'browser'>('stream');
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
    const browserWordCount = speech.words.length;
    const estimatedBrowserDuration = useMemo(() => {
        if (!textForAudio || browserWordCount === 0) {
            return 0;
        }

        const secondsPerWord = 0.45;
        return Math.max(5, (browserWordCount * secondsPerWord) / Math.max(playbackSpeed, 0.5));
    }, [browserWordCount, playbackSpeed, textForAudio]);

    const browserCurrentTime = useMemo(() => {
        if (estimatedBrowserDuration === 0 || browserWordCount === 0) {
            return 0;
        }

        const completedWords = speech.activeWordIndex >= 0 ? Math.min(speech.activeWordIndex + 1, browserWordCount) : 0;
        const progress = completedWords / browserWordCount;

        return Math.min(estimatedBrowserDuration, progress * estimatedBrowserDuration);
    }, [browserWordCount, estimatedBrowserDuration, speech.activeWordIndex]);

    const displayCurrentTime = playbackMode === 'browser' ? browserCurrentTime : currentTime;
    const displayDuration = playbackMode === 'browser' ? estimatedBrowserDuration : duration;

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
                    | { error?: { message?: string } }
                    | null;

                throw new Error(responseBody?.error?.message || 'Audio generation failed');
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
    }, [textForAudio]);

    const handlePlayPause = useCallback(async () => {
        const audio = audioRef.current;

        if (playbackMode === 'browser') {
            speech.toggle();
            return;
        }

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
        }
    }, [ensureAudioSource, isPlaying, playbackMode, speech, textForAudio]);

    const handleSeek = useCallback(
        (nextTime: number) => {
            if (playbackMode === 'browser') {
                if (estimatedBrowserDuration === 0 || browserWordCount === 0) {
                    return;
                }

                const safeTime = Math.max(0, Math.min(nextTime, estimatedBrowserDuration));
                const targetWordIndex = Math.max(0, Math.min(Math.round((safeTime / estimatedBrowserDuration) * (browserWordCount - 1)), browserWordCount - 1));

                speech.stop();
                speech.speakFromWordIndex(targetWordIndex);
                return;
            }

            const audio = audioRef.current;

            if (!audio) {
                return;
            }

            const safeTime = Math.max(0, Math.min(nextTime, duration || 0));
            audio.currentTime = safeTime;
            setCurrentTime(safeTime);
        },
        [browserWordCount, estimatedBrowserDuration, duration, playbackMode, speech],
    );

    const handleBrowserSkip = useCallback(
        (offsetWords: number) => {
            if (playbackMode !== 'browser' || !textForAudio) {
                return;
            }

            const totalWords = speech.words.length;

            if (totalWords === 0) {
                return;
            }

            const currentWordIndex = speech.activeWordIndex >= 0 ? speech.activeWordIndex : 0;
            const nextWordIndex = Math.max(0, Math.min(currentWordIndex + offsetWords, totalWords - 1));

            speech.stop();
            speech.speakFromWordIndex(nextWordIndex);
        },
        [playbackMode, speech, textForAudio],
    );

    const handleSkipBy = useCallback(
        (offsetSeconds: number) => {
            if (playbackMode === 'browser') {
                handleBrowserSkip(offsetSeconds >= 0 ? 10 : -10);
                return;
            }

            const audio = audioRef.current;

            if (!audio) {
                return;
            }

            const safeTime = Math.max(0, Math.min(audio.currentTime + offsetSeconds, duration || 0));
            audio.currentTime = safeTime;
            setCurrentTime(safeTime);
        },
        [duration, handleBrowserSkip, playbackMode],
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
                            <ControlBar
                                isPlaying={playbackMode === 'browser' ? speech.status === 'playing' : isPlaying}
                                isLoadingAudio={isLoadingAudio}
                                currentTime={displayCurrentTime}
                                duration={displayDuration}
                                playbackSpeed={playbackSpeed}
                                playbackMode={playbackMode}
                                hasText={Boolean(textForAudio)}
                                onPlayPause={handlePlayPause}
                                onSkipBackward={() => {
                                    if (playbackMode === 'browser') {
                                        handleBrowserSkip(-10);
                                        return;
                                    }

                                    handleSkipBy(-10);
                                }}
                                onSkipForward={() => {
                                    if (playbackMode === 'browser') {
                                        handleBrowserSkip(10);
                                        return;
                                    }

                                    handleSkipBy(10);
                                }}
                                onSeek={handleSeek}
                                onSpeedChange={setPlaybackSpeed}
                            />
                        </div>
                    )}

                    <audio ref={audioRef} className="hidden" />
                </div>
            </div>
        </div>
    );
}