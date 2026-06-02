import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

export function useAudioReader(
    textForAudio: string,
    selectedVoice: string,
    playbackSpeed: number
) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    const words = useMemo(
        () => textForAudio.trim() ? textForAudio.trim().split(/\s+/) : [],
        [textForAudio],
    );

    const isPausedRef = useRef(false);
    const startWordIndexRef = useRef(0);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const speakFromWordIndex = useCallback((wordIndex: number) => {
        if (!window.speechSynthesis) {
            setAudioError('Web Speech API is not supported in this browser.');
            return;
        }

        if (words.length === 0) {
            return;
        }

        const clickedIndex = Math.max(0, Math.min(wordIndex, words.length - 1));
        const utteranceText = words.slice(clickedIndex).join(' ');

        if (!utteranceText.trim()) {
            return;
        }

        window.speechSynthesis.cancel();
        startWordIndexRef.current = clickedIndex;
        setCurrentWordIndex(clickedIndex);
        setAudioError(null);
        isPausedRef.current = false;

        const utterance = new SpeechSynthesisUtterance(utteranceText);
        utteranceRef.current = utterance;

        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.voiceURI === selectedVoice);
        if (voice) {
            utterance.voice = voice;
        }

        utterance.rate = playbackSpeed;

        utterance.onstart = () => {
            setIsPlaying(true);
            isPausedRef.current = false;
            setIsLoadingAudio(false);
            setCurrentWordIndex(startWordIndexRef.current);
        };

        utterance.onend = () => {
            setIsPlaying(false);
            isPausedRef.current = false;
            setCurrentWordIndex(-1);
        };

        utterance.onerror = (event) => {
            if (event.error !== 'canceled' && event.error !== 'interrupted') {
                setAudioError(event.error);
                setIsPlaying(false);
                isPausedRef.current = false;
                setIsLoadingAudio(false);
            }
        };

        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                const charIndex = event.charIndex;
                const remainingTextUpToBoundary = utteranceText.substring(0, charIndex).trim();
                const relativeWordIndex =
                    remainingTextUpToBoundary === '' ? 0 : remainingTextUpToBoundary.split(/\s+/).length;
                const absoluteWordIndex = startWordIndexRef.current + relativeWordIndex;
                const totalWordsLength = words.length;

                if (absoluteWordIndex >= 0 && absoluteWordIndex < totalWordsLength) {
                    setCurrentWordIndex(absoluteWordIndex);
                }
            }
        };

        setIsLoadingAudio(true);
        window.speechSynthesis.speak(utterance);
    }, [playbackSpeed, selectedVoice, words]);

    const togglePlayPause = useCallback(() => {
        if (!window.speechSynthesis) {
            setAudioError('Web Speech API is not supported in this browser.');
            return;
        }

        if (window.speechSynthesis.paused || isPausedRef.current) {
            window.speechSynthesis.resume();
            isPausedRef.current = false;
            setIsPlaying(true);
            return;
        }

        if (window.speechSynthesis.speaking || isPlaying) {
            window.speechSynthesis.pause();
            isPausedRef.current = true;
            setIsPlaying(false);
            return;
        }

        window.speechSynthesis.cancel();
        speakFromWordIndex(0);
    }, [isPlaying, speakFromWordIndex]);

    // Stop talking when switching tabs/unmounting
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    return {
        isPlaying,
        currentWordIndex,
        togglePlayPause,
        isLoadingAudio,
        audioError,
        speakFromWordIndex,
    };
}
