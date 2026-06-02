import { useState, useRef, useEffect, useCallback } from 'react';
import { useSpeechSynthesisSync } from './useSpeechSynthesisSync';
import { fetchGeneratedAudio } from './audioApi';

export function useAudioController(text: string, voice = 'en-US-AndrewNeural') {
  const [playbackMode, setPlaybackMode] = useState<'stream' | 'browser'>('stream');
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showFallbackToast, setShowFallbackToast] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // Your existing hook automatically generates the SpeechSynthesisUtterance internally
  const speechSync = useSpeechSynthesisSync(text);

  // Reset the state whenever the text changes so users can attempt standard server-fetching again
  useEffect(() => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    queueMicrotask(() => {
      setPlaybackMode('stream');
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setShowFallbackToast(false);
    });
  }, [text]);

  const effectiveIsPlaying =
    playbackMode === 'browser' ? speechSync.status === 'playing' : isPlaying;

  const onPlayPause = useCallback(async () => {
    // 1. Browser Speech Synthesis Fallback Mode
    if (playbackMode === 'browser') {
      speechSync.toggle();
      return;
    }

    // 2. HTML5 Audio Stream Mode - Pause
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    // 3. HTML5 Audio Stream Mode - Resume existing audio
    if (audioRef.current?.src) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    // 4. Initial Fetch
    setIsLoadingAudio(true);
    try {
      const blob = await fetchGeneratedAudio(text, voice);
      const url = URL.createObjectURL(blob);

      if (!audioRef.current) {
        const audio = new Audio(url);
        audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
        audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
        audio.addEventListener('ended', () => setIsPlaying(false));
        audioRef.current = audio;
      } else {
        audioRef.current.src = url;
      }

      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play();
      setIsPlaying(true);
      setPlaybackMode('stream');
    } catch (error) {
      console.error('Audio generation failed:', error);
    } finally {
      setIsLoadingAudio(false);
    }
  }, [playbackMode, isPlaying, text, speechSync, playbackSpeed, voice]);

  const onStop = useCallback(() => {
    if (playbackMode === 'browser') {
      speechSync.stop();
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [playbackMode, speechSync]);

  const onSpeedChange = useCallback(
    (speed: number) => {
      setPlaybackSpeed(speed);
      if (playbackMode === 'browser') {
        speechSync.setRate(speed); // Your underlying hook natively handles restarting the utterance with the new rate
      } else if (audioRef.current) {
        audioRef.current.playbackRate = speed;
      }
    },
    [playbackMode, speechSync],
  );

  const onSeek = useCallback(
    (time: number) => {
      // Note: ControlBar dynamically disables scrub/seek for 'browser' mode (`!canScrub`), so we only need to handle stream
      if (playbackMode === 'stream' && audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
    [playbackMode],
  );

  const onSkipBackward = useCallback(() => {
    onSeek(Math.max(0, currentTime - 10));
  }, [currentTime, onSeek]);

  const onSkipForward = useCallback(() => {
    onSeek(Math.min(duration, currentTime + 10));
  }, [currentTime, duration, onSeek]);

  return {
    playbackMode,
    isLoadingAudio,
    isPlaying: effectiveIsPlaying,
    playbackSpeed,
    currentTime,
    duration,
    onPlayPause,
    onStop,
    onSpeedChange,
    onSeek,
    onSkipBackward,
    onSkipForward,
    showFallbackToast,
  };
}
