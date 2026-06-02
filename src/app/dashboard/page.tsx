'use client';

import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';
import { usePDFContext } from '@/components/dashboard/PDFContext';
import { useAudioReader } from './useAudioReader';

const PDFPanel = dynamic(() => import('@/components/dashboard/PDFPanel'), { ssr: false });
const SummaryPanel = dynamic(() => import('@/components/dashboard/SummaryPanel'), { ssr: false });
const ControlBar = dynamic(() => import('@/components/dashboard/ControlBar'), { ssr: false });
const EmptyUploadState = dynamic(() => import('@/components/dashboard/EmptyUploadState'), {
  ssr: false,
});

type TtsVoice = 'en-US-AndrewNeural' | 'en-US-EmmaNeural';

export default function DashboardPage() {
  const { cleanedTextForSpeech } = usePDFContext();
  const textForAudio = useMemo(() => cleanedTextForSpeech.trim(), [cleanedTextForSpeech]);

  const [activeMobileTab, setActiveMobileTab] = useState<'pdf' | 'insights'>('pdf');
  const [hasFile, setHasFile] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState<TtsVoice>('en-US-AndrewNeural');

  const { isPlaying, togglePlayPause, isLoadingAudio, audioError } = useAudioReader(
    textForAudio,
    selectedVoice,
    playbackSpeed,
  );

  const handleFileSelect = useCallback(() => {
    setHasFile(true);
  }, []);

  const handlePlayPause = useCallback(() => {
    togglePlayPause();
  }, [togglePlayPause]);

  return (
    <div className="flex h-screen max-h-screen w-full overflow-hidden bg-[#070a13] text-slate-200">
      {/* Sidebar is provided by the parent DashboardClient; avoid duplicate sidebars here */}

      {/* Right workspace - main content + pinned control bar */}
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
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition-transform active:scale-95 ${
                        activeMobileTab === 'pdf'
                          ? 'bg-white/8 text-white shadow-[0_0_20px_rgba(26,140,255,0.14)]'
                          : 'text-slate-400'
                      }`}
                    >
                      PDF View
                    </button>
                    <button
                      onClick={() => setActiveMobileTab('insights')}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition-transform active:scale-95 ${
                        activeMobileTab === 'insights'
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
        </div>

        {/* Pinned ControlBar at the bottom of the right workspace - show only after a file is uploaded */}
        {hasFile && (
          <div className="w-full shrink-0 border-t border-white/5 bg-[#070a13]/90 px-6 py-3 backdrop-blur-2xl z-50">
            {audioError && (
              <div
                className="mb-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
                role="alert"
              >
                Speech Synthesis Error: {audioError}
              </div>
            )}

            <ControlBar
              isPlaying={isPlaying}
              isLoadingAudio={isLoadingAudio}
              currentTime={0} // Not applicable for Web Speech API
              duration={0} // Not applicable for Web Speech API
              playbackSpeed={playbackSpeed}
              playbackMode="browser"
              hasText={Boolean(textForAudio)}
              compact={hasFile}
              onPlayPause={handlePlayPause}
              onSkipBackward={() => {}} // Not applicable for Web Speech API
              onSkipForward={() => {}} // Not applicable for Web Speech API
              onSpeedChange={setPlaybackSpeed}
              selectedVoice={selectedVoice}
              onVoiceChange={(voice) => setSelectedVoice(voice as TtsVoice)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
