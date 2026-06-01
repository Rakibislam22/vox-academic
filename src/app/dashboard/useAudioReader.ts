import { useState, useRef, useCallback, useEffect } from 'react';

type TtsVoice = 'en-US-AndrewNeural' | 'en-US-EmmaNeural';

/**
 * A hook to manage text-to-speech using the Web Speech API.
 * It handles playing, pausing, resuming, and tracking the currently spoken word.
 *
 * @param cleanedText The text to be spoken.
 * @param voiceName The name of the voice to use.
 * @param playbackSpeed The desired playback speed.
 * @returns An object with TTS state and controls.
 */
export function useAudioReader(
    cleanedText: string,
    voiceName: TtsVoice,
    playbackSpeed: number,
) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [audioError, setAudioError] = useState<string | null>(null);
    const isPausedRef = useRef(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const cancelSpeech = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        isPausedRef.current = false;
        setIsPlaying(false);
        setCurrentWordIndex(-1);
        setAudioError(null);
        utteranceRef.current = null;
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // When the source text or voice changes, cancel any ongoing speech.
    useEffect(() => {
        cancelSpeech();
    }, [cleanedText, voiceName, cancelSpeech]);

    const togglePlayPause = useCallback(() => {
        if (!cleanedText) return;

        const synth = window.speechSynthesis;
        if (!synth) {
            setAudioError('Speech Synthesis is not supported by this browser.');
            return;
        }

        // **Guideline 1: Fix the State Toggle**
        if (synth.speaking && !isPausedRef.current) {
            synth.pause();
            isPausedRef.current = true;
            setIsPlaying(false);
        } else if (synth.paused && isPausedRef.current) {
            synth.resume();
            isPausedRef.current = false;
            setIsPlaying(true);
        } else {
            cancelSpeech();

            const utterance = new SpeechSynthesisUtterance(cleanedText);
            utteranceRef.current = utterance;

            const voices = synth.getVoices();
            const selectedVoice = voices.find((v) => v.name === voiceName);
            if (selectedVoice) utterance.voice = selectedVoice;

            utterance.rate = playbackSpeed;

            // **Guideline 2: Fix Word Boundary Calculation**
            utterance.onboundary = (event) => {
                if (event.name === 'word') {
                    const textUntilBoundary = cleanedText.substring(0, event.charIndex);
                    const wordIndex = textUntilBoundary.split(/\s+/).length - 1;
                    setCurrentWordIndex(wordIndex);
                }
            };

            utterance.onstart = () => {
                setIsPlaying(true);
                isPausedRef.current = false;
                setAudioError(null);
            };

            utterance.onend = () => {
                setIsPlaying(false);
                isPausedRef.current = false;
                setCurrentWordIndex(-1);
                utteranceRef.current = null;
            };

            utterance.onerror = (event) => {
                setAudioError(`Speech error: ${event.error}`);
                cancelSpeech();
            };

            synth.speak(utterance);
        }
    }, [cleanedText, voiceName, playbackSpeed, cancelSpeech]);

    return { isPlaying, currentWordIndex, togglePlayPause, isLoadingAudio: false, audioError };
}