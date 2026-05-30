'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type SpeechStatus = 'idle' | 'playing' | 'paused';

export interface SpeechToken {
    text: string;
    start: number;
    end: number;
    isWord: boolean;
    wordIndex: number | null;
}

export interface SpeechSyncState {
    isSupported: boolean;
    status: SpeechStatus;
    rate: number;
    activeWordIndex: number;
    tokens: SpeechToken[];
    words: string[];
    play: () => void;
    pause: () => void;
    stop: () => void;
    toggle: () => void;
    setRate: (rate: number) => void;
    speakFromWordIndex: (wordIndex: number) => void;
}

const MIN_RATE = 0.5;
const MAX_RATE = 2.5;

function clampRate(rate: number) {
    return Math.min(MAX_RATE, Math.max(MIN_RATE, rate));
}

function tokenizeSpeechText(text: string): SpeechToken[] {
    if (!text.trim()) {
        return [];
    }

    const tokens: SpeechToken[] = [];
    const matcher = /\s+|[^\s]+/g;
    let match: RegExpExecArray | null;
    let wordIndex = 0;

    while ((match = matcher.exec(text)) !== null) {
        const tokenText = match[0];
        const isWord = !/^\s+$/.test(tokenText);

        tokens.push({
            text: tokenText,
            start: match.index,
            end: match.index + tokenText.length,
            isWord,
            wordIndex: isWord ? wordIndex++ : null,
        });
    }

    return tokens;
}

function findWordIndexByCharIndex(tokens: SpeechToken[], charIndex: number) {
    let left = 0;
    let right = tokens.length - 1;

    while (left <= right) {
        const middle = Math.floor((left + right) / 2);
        const token = tokens[middle];

        if (charIndex < token.start) {
            right = middle - 1;
            continue;
        }

        if (charIndex >= token.end) {
            left = middle + 1;
            continue;
        }

        return token.isWord ? token.wordIndex : null;
    }

    for (let index = Math.min(left, tokens.length - 1); index >= 0; index -= 1) {
        const token = tokens[index];

        if (token.isWord && charIndex >= token.start) {
            return token.wordIndex;
        }
    }

    return null;
}

function scoreVoice(voice: SpeechSynthesisVoice) {
    const preferredNames = [
        'Microsoft Aria Online (Natural) - English (United States)',
        'Microsoft Andrew Online (Natural) - English (United States)',
        'Microsoft Guy Online (Natural) - English (United States)',
        'Google UK English Female',
        'Google US English',
        'Samantha',
        'Victoria',
        'Alex',
        'Daniel',
        'Karen',
    ];

    const preferredIndex = preferredNames.findIndex((name) => voice.name.toLowerCase().includes(name.toLowerCase()));
    let score = 0;

    if (preferredIndex >= 0) {
        score += 100 - preferredIndex;
    }

    if (voice.default) {
        score += 20;
    }

    if (voice.localService) {
        score += 10;
    }

    if (/^en(-|_)/i.test(voice.lang)) {
        score += 15;
    }

    if (/female|woman|natural|premium|neural/i.test(voice.name)) {
        score += 10;
    }

    return score;
}

function selectPremiumVoice(voices: SpeechSynthesisVoice[]) {
    if (!voices.length) {
        return null;
    }

    return [...voices].sort((left, right) => scoreVoice(right) - scoreVoice(left))[0] ?? null;
}

export function useSpeechSynthesisSync(cleanedTextForSpeech: string): SpeechSyncState {
    const [status, setStatus] = useState<SpeechStatus>('idle');
    const [rate, setRateState] = useState(1);
    const [activeWordIndex, setActiveWordIndex] = useState(-1);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const utteranceSequenceRef = useRef(0);
    const baseCharIndexRef = useRef(0);
    const activeWordIndexRef = useRef(-1);
    const rateRef = useRef(1);
    const rafRef = useRef<number | null>(null);
    const resetTimeoutRef = useRef<number | null>(null);

    const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const tokens = useMemo(() => tokenizeSpeechText(cleanedTextForSpeech), [cleanedTextForSpeech]);

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
        if (resetTimeoutRef.current !== null) {
            window.clearTimeout(resetTimeoutRef.current);
        }

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        utteranceSequenceRef.current += 1;
        utteranceRef.current = null;
        activeWordIndexRef.current = -1;

        resetTimeoutRef.current = window.setTimeout(() => {
            setStatus('idle');
            setActiveWordIndex(-1);
        }, 0);

        return () => {
            if (resetTimeoutRef.current !== null) {
                window.clearTimeout(resetTimeoutRef.current);
            }
        };
    }, [cleanedTextForSpeech]);

    useEffect(() => {
        return () => {
            if (rafRef.current !== null) {
                window.cancelAnimationFrame(rafRef.current);
            }
            if (resetTimeoutRef.current !== null) {
                window.clearTimeout(resetTimeoutRef.current);
            }
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const commitActiveWordIndex = useCallback((nextIndex: number) => {
        if (nextIndex === activeWordIndexRef.current) {
            return;
        }

        activeWordIndexRef.current = nextIndex;

        if (rafRef.current !== null) {
            window.cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = window.requestAnimationFrame(() => {
            setActiveWordIndex(nextIndex);
            rafRef.current = null;
        });
    }, []);

    const stop = useCallback(() => {
        utteranceSequenceRef.current += 1;
        utteranceRef.current = null;

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        setStatus('idle');
        commitActiveWordIndex(-1);
    }, [commitActiveWordIndex]);

    const speakFromWordIndex = useCallback(
        (wordIndex: number) => {
            if (!isSupported || !cleanedTextForSpeech.trim() || tokens.length === 0) {
                return;
            }

            const safeWordIndex = Math.max(0, Math.min(wordIndex, tokens.filter((token) => token.isWord).length - 1));
            const startingToken = tokens.find((token) => token.isWord && token.wordIndex === safeWordIndex);

            if (!startingToken) {
                return;
            }

            const textToSpeak = cleanedTextForSpeech.slice(startingToken.start);
            if (!textToSpeak.trim()) {
                return;
            }

            const utteranceId = utteranceSequenceRef.current + 1;
            utteranceSequenceRef.current = utteranceId;
            baseCharIndexRef.current = startingToken.start;

            if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
                return;
            }

            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            const selectedVoice = selectPremiumVoice(voices.length > 0 ? voices : window.speechSynthesis.getVoices());

            utterance.rate = rateRef.current;
            utterance.pitch = 1;
            utterance.volume = 1;

            if (selectedVoice) {
                utterance.voice = selectedVoice;
                utterance.lang = selectedVoice.lang || 'en-US';
            }

            utterance.onboundary = (event) => {
                if (utteranceSequenceRef.current !== utteranceId || event.name !== 'word') {
                    return;
                }

                const absoluteCharIndex = baseCharIndexRef.current + event.charIndex;
                const nextWordIndex = findWordIndexByCharIndex(tokens, absoluteCharIndex);

                if (nextWordIndex !== null) {
                    commitActiveWordIndex(nextWordIndex);
                }
            };

            utterance.onend = () => {
                if (utteranceSequenceRef.current !== utteranceId) {
                    return;
                }

                utteranceRef.current = null;
                setStatus('idle');
                commitActiveWordIndex(-1);
            };

            utterance.onerror = () => {
                if (utteranceSequenceRef.current !== utteranceId) {
                    return;
                }

                utteranceRef.current = null;
                setStatus('idle');
                commitActiveWordIndex(-1);
            };

            utteranceRef.current = utterance;
            setStatus('playing');
            commitActiveWordIndex(safeWordIndex);
            window.speechSynthesis.speak(utterance);
        },
        [cleanedTextForSpeech, commitActiveWordIndex, isSupported, tokens, voices],
    );

    const pause = useCallback(() => {
        if (!isSupported || !window.speechSynthesis.speaking) {
            return;
        }

        window.speechSynthesis.pause();
        setStatus('paused');
    }, [isSupported]);

    const play = useCallback(() => {
        if (!isSupported) {
            return;
        }

        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            setStatus('playing');
            return;
        }

        if (window.speechSynthesis.speaking) {
            return;
        }

        const resumeWordIndex = activeWordIndexRef.current >= 0 ? activeWordIndexRef.current : 0;
        speakFromWordIndex(resumeWordIndex);
    }, [isSupported, speakFromWordIndex]);

    const toggle = useCallback(() => {
        if (status === 'playing') {
            pause();
            return;
        }

        if (status === 'paused') {
            play();
            return;
        }

        play();
    }, [pause, play, status]);

    const setRate = useCallback(
        (nextRate: number) => {
            const clampedRate = clampRate(nextRate);
            setRateState(clampedRate);
            rateRef.current = clampedRate;

            if (!isSupported) {
                return;
            }

            if (utteranceRef.current) {
                utteranceRef.current.rate = clampedRate;

                if (status === 'playing') {
                    const resumeWordIndex = activeWordIndexRef.current >= 0 ? activeWordIndexRef.current : 0;
                    speakFromWordIndex(resumeWordIndex);
                }
            }
        },
        [isSupported, speakFromWordIndex, status],
    );

    const words = useMemo(() => tokens.filter((token) => token.isWord).map((token) => token.text), [tokens]);

    return {
        isSupported,
        status,
        rate,
        activeWordIndex,
        tokens,
        words,
        play,
        pause,
        stop,
        toggle,
        setRate,
        speakFromWordIndex,
    };
}