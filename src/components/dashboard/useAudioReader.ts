'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type AudioReaderStatus = 'idle' | 'playing' | 'paused';

export interface AudioWordRange {
    start: number;
    end: number;
}

export interface AudioToken {
    text: string;
    start: number;
    end: number;
    isWord: boolean;
    wordIndex: number | null;
}

export interface AudioReaderState {
    isSupported: boolean;
    status: AudioReaderStatus;
    isPlaying: boolean;
    playbackSpeed: number;
    rate: number;
    currentTime: number;
    duration: number;
    activeWordIndex: number;
    currentWord: string;
    currentWordRange: AudioWordRange | null;
    cleanedText: string;
    tokens: AudioToken[];
    words: string[];
    voices: SpeechSynthesisVoice[];
    selectedVoice: SpeechSynthesisVoice | null;
    play: () => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    toggle: () => void;
    setPlaybackSpeed: (nextSpeed: number) => void;
    setRate: (nextRate: number) => void;
    setSelectedVoice: (voiceNameOrUri: string) => void;
    seekToTime: (nextTime: number) => void;
    speakFromWordIndex: (wordIndex: number) => void;
}

const MIN_PLAYBACK_SPEED = 0.5;
const MAX_PLAYBACK_SPEED = 2;
const BASE_WORDS_PER_MINUTE = 185;
const BASE_CHARS_PER_SECOND = 14;

function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(maximum, Math.max(minimum, value));
}

function normalizeWhitespace(text: string) {
    return text.replace(/\u00a0/g, ' ').replace(/[ \t]+\n/g, '\n').trim();
}

function isPageMarkerLine(line: string) {
    return /^(?:page\s*)?\d+(?:\s*(?:of|\/)?\s*\d+)?$/i.test(line)
        || /^page\s*\d+\s*of\s*\d+$/i.test(line)
        || /^page\s*\d+$/i.test(line)
        || /^\d+\s*of\s*\d+$/i.test(line);
}

function looksLikeDecorativeHeaderOrFooter(line: string) {
    const compact = line.replace(/\s+/g, ' ').trim();

    if (!compact) {
        return true;
    }

    if (isPageMarkerLine(compact)) {
        return true;
    }

    const words = compact.split(/\s+/).filter(Boolean);
    const letters = compact.replace(/[^A-Za-z]/g, '');

    if (words.length <= 8 && compact.length <= 80 && letters.length > 0) {
        const uppercaseRatio = letters.replace(/[^A-Z]/g, '').length / letters.length;

        if (uppercaseRatio >= 0.65) {
            return true;
        }

        if (/^\d+\s*[|\-–—]\s*\d+$/.test(compact)) {
            return true;
        }
    }

    return false;
}

function cleanSpeechText(rawText: string) {
    const normalized = normalizeWhitespace(rawText)
        .replace(/(\p{L})-\s*\n\s*(\p{L})/gu, '$1$2')
        .replace(/\bpage\s*\d+(?:\s*(?:of|\/)?\s*\d+)?\b/gi, ' ')
        .replace(/\b\d+\s*\/\s*\d+\b/g, ' ')
        .replace(/\n{3,}/g, '\n\n');

    if (!normalized) {
        return '';
    }

    const lines = normalized
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean);

    const filteredLines = lines.filter((line, index) => {
        if (looksLikeDecorativeHeaderOrFooter(line)) {
            return false;
        }

        if (index > 0 && line.toLowerCase() === lines[index - 1].toLowerCase()) {
            return false;
        }

        if ((index <= 1 || index >= lines.length - 2) && isPageMarkerLine(line)) {
            return false;
        }

        return true;
    });

    return filteredLines
        .join(' ')
        .replace(/\s*\n\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenizeSpeechText(text: string): AudioToken[] {
    if (!text.trim()) {
        return [];
    }

    const tokens: AudioToken[] = [];
    const matcher = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;
    let match: RegExpExecArray | null;
    let wordIndex = 0;

    while ((match = matcher.exec(text)) !== null) {
        const wordText = match[0];

        tokens.push({
            text: wordText,
            start: match.index,
            end: match.index + wordText.length,
            isWord: true,
            wordIndex,
        });

        wordIndex += 1;
    }

    return tokens;
}

function findTokenByCharIndex(tokens: AudioToken[], charIndex: number) {
    if (!tokens.length) {
        return null;
    }

    let left = 0;
    let right = tokens.length - 1;
    let fallbackIndex = 0;

    while (left <= right) {
        const middle = Math.floor((left + right) / 2);
        const token = tokens[middle];

        if (charIndex < token.start) {
            right = middle - 1;
            continue;
        }

        fallbackIndex = middle;

        if (charIndex < token.end) {
            return token;
        }

        left = middle + 1;
    }

    return tokens[Math.min(fallbackIndex, tokens.length - 1)] ?? null;
}

function estimateDurationSeconds(text: string, wordCount: number, playbackSpeed: number) {
    const safePlaybackSpeed = clamp(playbackSpeed, MIN_PLAYBACK_SPEED, MAX_PLAYBACK_SPEED);
    const cleanedLength = Math.max(1, text.replace(/\s+/g, ' ').trim().length);
    const normalizedWordCount = Math.max(1, wordCount);
    const wordsPerSecond = BASE_WORDS_PER_MINUTE / 60;

    const wordBasedDuration = normalizedWordCount / wordsPerSecond;
    const charBasedDuration = cleanedLength / BASE_CHARS_PER_SECOND;

    return Math.max(1, Math.max(wordBasedDuration, charBasedDuration) / safePlaybackSpeed);
}

function scoreVoice(voice: SpeechSynthesisVoice) {
    const name = voice.name.toLowerCase();
    let score = 0;

    if (/(google|natural|neural|online \(natural\)|premium)/i.test(name)) {
        score += 120;
    }

    if (voice.default) {
        score += 15;
    }

    if (voice.localService) {
        score += 8;
    }

    if (/^en(?:[-_]|$)/i.test(voice.lang)) {
        score += 12;
    }

    if (/female|woman|feminine|samantha|aria|emma|andrew|guy|victoria|alex|daniel|karen/i.test(name)) {
        score += 10;
    }

    return score;
}

function matchVoiceByPreference(voices: SpeechSynthesisVoice[], preference: string) {
    if (!preference) {
        return null;
    }

    const preferenceLower = preference.toLowerCase();

    return (
        voices.find((voice) => voice.voiceURI.toLowerCase() === preferenceLower) ??
        voices.find((voice) => voice.name.toLowerCase() === preferenceLower) ??
        voices.find((voice) => voice.name.toLowerCase().includes(preferenceLower)) ??
        null
    );
}

function selectPreferredVoice(voices: SpeechSynthesisVoice[], preference: string) {
    if (!voices.length) {
        return null;
    }

    const preferred = matchVoiceByPreference(voices, preference);

    if (preferred) {
        return preferred;
    }

    return [...voices].sort((left, right) => scoreVoice(right) - scoreVoice(left))[0] ?? null;
}

export function useAudioReader(rawText: string, preferredVoiceHint = ''): AudioReaderState {
    const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const cleanedText = useMemo(() => cleanSpeechText(rawText), [rawText]);
    const tokens = useMemo(() => tokenizeSpeechText(cleanedText), [cleanedText]);
    const words = useMemo(() => tokens.map((token) => token.text), [tokens]);

    const [status, setStatus] = useState<AudioReaderStatus>('idle');
    const [playbackSpeed, setPlaybackSpeedState] = useState(1);
    const [activeWordIndex, setActiveWordIndex] = useState(-1);
    const [currentWord, setCurrentWord] = useState('');
    const [currentWordRange, setCurrentWordRange] = useState<AudioWordRange | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(1);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [voiceOverride, setVoiceOverride] = useState(preferredVoiceHint);

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const utteranceSequenceRef = useRef(0);
    const activeWordIndexRef = useRef(-1);
    const currentTimeRef = useRef(0);
    const playbackAnchorRef = useRef<{ startedAt: number; baseTime: number } | null>(null);
    const progressFrameRef = useRef<number | null>(null);
    const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

    const selectedVoice = useMemo(
        () => selectPreferredVoice(voices, voiceOverride || preferredVoiceHint),
        [preferredVoiceHint, voiceOverride, voices],
    );

    useEffect(() => {
        if (!isSupported) {
            return;
        }

        const syncVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();

            if (availableVoices.length > 0) {
                setVoices(availableVoices);
            }
        };

        syncVoices();
        window.speechSynthesis.addEventListener('voiceschanged', syncVoices);

        return () => {
            window.speechSynthesis.removeEventListener('voiceschanged', syncVoices);
        };
    }, [isSupported]);

    useEffect(() => {
        const nextDuration = estimateDurationSeconds(cleanedText, words.length, playbackSpeed);
        setDuration(nextDuration);

        if (!cleanedText) {
            setStatus('idle');
            setActiveWordIndex(-1);
            setCurrentWord('');
            setCurrentWordRange(null);
            setCurrentTime(0);
            currentTimeRef.current = 0;
            playbackAnchorRef.current = null;
        } else if (currentTimeRef.current > nextDuration) {
            setCurrentTime(nextDuration);
            currentTimeRef.current = nextDuration;
        }
    }, [cleanedText, playbackSpeed, words.length]);

    useEffect(() => {
        selectedVoiceRef.current = selectedVoice;
    }, [selectedVoice]);

    useEffect(() => {
        if (!isSupported || !cleanedText.trim()) {
            return;
        }

        return stop;
    }, [cleanedText, isSupported]);

    const updateProgress = useCallback(
        (nextTime: number) => {
            const safeTime = clamp(nextTime, 0, duration);
            currentTimeRef.current = safeTime;
            setCurrentTime(safeTime);
        },
        [duration],
    );

    const updateWordState = useCallback(
        (wordIndex: number, sourceCharIndex?: number) => {
            const token = tokens[wordIndex] ?? null;

            if (!token) {
                setActiveWordIndex(-1);
                setCurrentWord('');
                setCurrentWordRange(null);
                return;
            }

            activeWordIndexRef.current = wordIndex;
            setActiveWordIndex(wordIndex);
            setCurrentWord(token.text);
            setCurrentWordRange({ start: token.start, end: token.end });

            const textLength = Math.max(1, cleanedText.length);
            const anchor = typeof sourceCharIndex === 'number' ? sourceCharIndex : token.start;
            const estimatedTime = (anchor / textLength) * duration;

            updateProgress(estimatedTime);
            playbackAnchorRef.current = {
                startedAt: performance.now(),
                baseTime: currentTimeRef.current,
            };
        },
        [cleanedText.length, duration, tokens, updateProgress],
    );

    const scheduleProgressTick = useCallback(() => {
        if (typeof window === 'undefined') {
            return;
        }

        if (progressFrameRef.current !== null) {
            window.cancelAnimationFrame(progressFrameRef.current);
        }

        const tick = () => {
            const anchor = playbackAnchorRef.current;

            if (!anchor || status !== 'playing') {
                progressFrameRef.current = null;
                return;
            }

            const elapsedSeconds = (performance.now() - anchor.startedAt) / 1000;
            const nextTime = anchor.baseTime + elapsedSeconds * playbackSpeed;

            updateProgress(nextTime);
            progressFrameRef.current = window.requestAnimationFrame(tick);
        };

        progressFrameRef.current = window.requestAnimationFrame(tick);
    }, [playbackSpeed, status, updateProgress]);

    const stop = useCallback(() => {
        utteranceSequenceRef.current += 1;
        utteranceRef.current = null;
        playbackAnchorRef.current = null;

        if (typeof window !== 'undefined' && isSupported) {
            window.speechSynthesis.cancel();

            if (progressFrameRef.current !== null) {
                window.cancelAnimationFrame(progressFrameRef.current);
                progressFrameRef.current = null;
            }
        }

        activeWordIndexRef.current = -1;
        setStatus('idle');
        setActiveWordIndex(-1);
        setCurrentWord('');
        setCurrentWordRange(null);
        updateProgress(0);
    }, [isSupported, updateProgress]);

    const speakFromWordIndex = useCallback(
        (wordIndex: number) => {
            if (!isSupported || !cleanedText.trim() || tokens.length === 0) {
                return;
            }

            const safeWordIndex = clamp(wordIndex, 0, Math.max(tokens.length - 1, 0));
            const startingToken = tokens[safeWordIndex];

            if (!startingToken) {
                return;
            }

            const textToSpeak = cleanedText.slice(startingToken.start);

            if (!textToSpeak.trim()) {
                return;
            }

            const utteranceId = utteranceSequenceRef.current + 1;
            utteranceSequenceRef.current = utteranceId;

            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            const voice = selectedVoiceRef.current ?? selectPreferredVoice(voices, voiceOverride || preferredVoiceHint);

            utterance.rate = playbackSpeed;
            utterance.pitch = 1;
            utterance.volume = 1;

            if (voice) {
                utterance.voice = voice;
                utterance.lang = voice.lang || 'en-US';
            }

            utterance.onstart = () => {
                if (utteranceSequenceRef.current !== utteranceId) {
                    return;
                }

                setStatus('playing');
                updateWordState(safeWordIndex, startingToken.start);
            };

            utterance.onboundary = (event) => {
                if (utteranceSequenceRef.current !== utteranceId || event.name !== 'word') {
                    return;
                }

                const absoluteCharIndex = startingToken.start + event.charIndex;
                const matchedToken = findTokenByCharIndex(tokens, absoluteCharIndex);

                if (!matchedToken) {
                    return;
                }

                updateWordState(matchedToken.wordIndex ?? safeWordIndex, matchedToken.start);
            };

            utterance.onpause = () => {
                if (utteranceSequenceRef.current !== utteranceId) {
                    return;
                }

                setStatus('paused');

                if (progressFrameRef.current !== null) {
                    window.cancelAnimationFrame(progressFrameRef.current);
                    progressFrameRef.current = null;
                }

                playbackAnchorRef.current = {
                    startedAt: performance.now(),
                    baseTime: currentTimeRef.current,
                };
            };

            utterance.onresume = () => {
                if (utteranceSequenceRef.current !== utteranceId) {
                    return;
                }

                setStatus('playing');
                playbackAnchorRef.current = {
                    startedAt: performance.now(),
                    baseTime: currentTimeRef.current,
                };
                scheduleProgressTick();
            };

            utterance.onend = () => {
                if (utteranceSequenceRef.current !== utteranceId) {
                    return;
                }

                utteranceRef.current = null;
                playbackAnchorRef.current = null;
                setStatus('idle');
                setActiveWordIndex(-1);
                setCurrentWord('');
                setCurrentWordRange(null);
                updateProgress(duration);

                if (progressFrameRef.current !== null) {
                    window.cancelAnimationFrame(progressFrameRef.current);
                    progressFrameRef.current = null;
                }
            };

            utterance.onerror = () => {
                if (utteranceSequenceRef.current !== utteranceId) {
                    return;
                }

                utteranceRef.current = null;
                playbackAnchorRef.current = null;
                setStatus('idle');
                setActiveWordIndex(-1);
                setCurrentWord('');
                setCurrentWordRange(null);
                updateProgress(0);

                if (progressFrameRef.current !== null) {
                    window.cancelAnimationFrame(progressFrameRef.current);
                    progressFrameRef.current = null;
                }
            };

            utteranceRef.current = utterance;
            setStatus('playing');
            updateWordState(safeWordIndex, startingToken.start);
            window.speechSynthesis.speak(utterance);
            scheduleProgressTick();
        },
        [cleanedText, duration, isSupported, preferredVoiceHint, playbackSpeed, scheduleProgressTick, tokens, updateProgress, updateWordState, voices, voiceOverride],
    );

    const play = useCallback(() => {
        if (!isSupported || !cleanedText.trim() || tokens.length === 0) {
            return;
        }

        if (window.speechSynthesis.paused && utteranceRef.current) {
            resume();
            return;
        }

        if (window.speechSynthesis.speaking) {
            return;
        }

        const resumeWordIndex = activeWordIndexRef.current >= 0 ? activeWordIndexRef.current : 0;
        speakFromWordIndex(resumeWordIndex);
    }, [cleanedText, isSupported, speakFromWordIndex, tokens.length]);

    const pause = useCallback(() => {
        if (!isSupported || !window.speechSynthesis.speaking) {
            return;
        }

        window.speechSynthesis.pause();
        setStatus('paused');

        if (progressFrameRef.current !== null) {
            window.cancelAnimationFrame(progressFrameRef.current);
            progressFrameRef.current = null;
        }

        playbackAnchorRef.current = {
            startedAt: performance.now(),
            baseTime: currentTimeRef.current,
        };
    }, [isSupported]);

    const resume = useCallback(() => {
        if (!isSupported || !window.speechSynthesis.paused) {
            return;
        }

        window.speechSynthesis.resume();
        setStatus('playing');

        playbackAnchorRef.current = {
            startedAt: performance.now(),
            baseTime: currentTimeRef.current,
        };
        scheduleProgressTick();
    }, [isSupported, scheduleProgressTick]);

    const toggle = useCallback(() => {
        if (status === 'playing') {
            pause();
            return;
        }

        if (status === 'paused') {
            resume();
            return;
        }

        play();
    }, [pause, play, resume, status]);

    const setPlaybackSpeed = useCallback(
        (nextSpeed: number) => {
            const safeSpeed = clamp(nextSpeed, MIN_PLAYBACK_SPEED, MAX_PLAYBACK_SPEED);
            setPlaybackSpeedState(safeSpeed);

            if (!isSupported) {
                return;
            }

            if (utteranceRef.current && status === 'playing') {
                const resumeWordIndex = activeWordIndexRef.current >= 0 ? activeWordIndexRef.current : 0;
                speakFromWordIndex(resumeWordIndex);
            } else if (playbackAnchorRef.current) {
                playbackAnchorRef.current = {
                    startedAt: performance.now(),
                    baseTime: currentTimeRef.current,
                };
            }
        },
        [isSupported, speakFromWordIndex, status],
    );

    const setSelectedVoice = useCallback((voiceNameOrUri: string) => {
        setVoiceOverride(voiceNameOrUri);
    }, []);

    const seekToTime = useCallback(
        (nextTime: number) => {
            if (!isSupported || !cleanedText.trim() || tokens.length === 0) {
                return;
            }

            const safeTime = clamp(nextTime, 0, duration);
            const safeDuration = Math.max(duration, 1);
            const estimatedWordIndex = Math.min(
                tokens.length - 1,
                Math.max(0, Math.floor((safeTime / safeDuration) * tokens.length)),
            );
            const targetToken = tokens[estimatedWordIndex];

            if (!targetToken) {
                return;
            }

            const shouldResume = status === 'playing';

            utteranceSequenceRef.current += 1;
            utteranceRef.current = null;
            playbackAnchorRef.current = null;

            if (typeof window !== 'undefined' && window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }

            if (progressFrameRef.current !== null && typeof window !== 'undefined') {
                window.cancelAnimationFrame(progressFrameRef.current);
                progressFrameRef.current = null;
            }

            activeWordIndexRef.current = targetToken.wordIndex ?? estimatedWordIndex;
            setActiveWordIndex(targetToken.wordIndex ?? estimatedWordIndex);
            setCurrentWord(targetToken.text);
            setCurrentWordRange({ start: targetToken.start, end: targetToken.end });
            updateProgress(safeTime);

            if (shouldResume) {
                speakFromWordIndex(targetToken.wordIndex ?? estimatedWordIndex);
            } else {
                setStatus('paused');
            }
        },
        [cleanedText, duration, isSupported, speakFromWordIndex, status, tokens, updateProgress],
    );

    const currentWordAtIndex = activeWordIndex >= 0 ? tokens[activeWordIndex] ?? null : null;

    return {
        isSupported,
        status,
        isPlaying: status === 'playing',
        playbackSpeed,
        rate: playbackSpeed,
        currentTime,
        duration,
        activeWordIndex,
        currentWord: currentWord || currentWordAtIndex?.text || '',
        currentWordRange,
        cleanedText,
        tokens,
        words,
        voices,
        selectedVoice,
        play,
        pause,
        resume,
        stop,
        toggle,
        setPlaybackSpeed,
        setRate: setPlaybackSpeed,
        setSelectedVoice,
        seekToTime,
        speakFromWordIndex,
    };
}

export type SpeechSyncState = AudioReaderState;
