'use client';

export {
    useAudioReader as useSpeechSynthesisSync,
} from './useAudioReader';

export type {
    AudioReaderState as SpeechSyncState,
    AudioToken as SpeechToken,
    AudioReaderStatus as SpeechStatus,
} from './useAudioReader';
