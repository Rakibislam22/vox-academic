'use client';

import dynamic from 'next/dynamic';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { usePDFContext } from '@/components/dashboard/PDFContext';
import { useAudioReader } from './useAudioReader';
import MyLibraryView from './MyLibraryView';
import RecentReadsView from './RecentReadsView';
import SummariesView from './SummariesView';
import SettingsView from './SettingsView';

const PDFPanel = dynamic(() => import('@/components/dashboard/PDFPanel'), { ssr: false });
const SummaryPanel = dynamic(() => import('@/components/dashboard/SummaryPanel'), { ssr: false });
const ControlBar = dynamic(() => import('@/components/dashboard/ControlBar'), { ssr: false });
const EmptyUploadState = dynamic(() => import('@/components/dashboard/EmptyUploadState'), {
  ssr: false,
});

type TtsVoice = 'en-US-AndrewNeural' | 'en-US-EmmaNeural';

export default function DashboardPage() {
  const {
    cleanedTextForSpeech,
    setDocumentTitle,
    setDocumentSummary,
    setCleanedTextForSpeech,
    setUploadedPdfFile,
    activeView,
    documentsRefreshKey,
    refreshDocuments,
  } = usePDFContext();
  const textForAudio = useMemo(() => cleanedTextForSpeech.trim(), [cleanedTextForSpeech]);

  const [dbDocuments, setDbDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState<'pdf' | 'insights'>('pdf');
  const [hasFile, setHasFile] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState<TtsVoice>('en-US-AndrewNeural');

  const { isPlaying, togglePlayPause, isLoadingAudio, audioError } = useAudioReader(
    textForAudio,
    selectedVoice,
    playbackSpeed,
  );

  // Reset workspace layout when navigating through the sidebar
  useEffect(() => {
    setHasFile(false);
    setLoading(true);
    fetch(`/api/documents?view=${activeView}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setDbDocuments(data.documents);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeView, documentsRefreshKey]);

  const handlePlayPause = useCallback(() => {
    togglePlayPause();
  }, [togglePlayPause]);

  const handleOpenDocument = useCallback(
    async (doc: any) => {
      setDocumentTitle(doc.title);
      setDocumentSummary(doc.summary || 'Summary not available.');
      setCleanedTextForSpeech(doc.extractedText?.join('\n') || '');
      try {
        if (doc.fileUrl) {
          const response = await fetch(doc.fileUrl);
          const blob = await response.blob();
          const file = new File([blob], doc.title, { type: 'application/pdf' });
          setUploadedPdfFile(file);
        }
      } catch (err) {
        console.error('Failed to load PDF file from URL', err);
      }
      setHasFile(true);
    },
    [setDocumentTitle, setDocumentSummary, setCleanedTextForSpeech, setUploadedPdfFile],
  );

  const handleUploadSuccess = useCallback(
    (newDocument: any) => {
      handleOpenDocument(newDocument);
      refreshDocuments();
    },
    [handleOpenDocument, refreshDocuments],
  );

  return (
    <div className="flex h-screen max-h-screen w-full overflow-hidden bg-[#070a13] text-slate-200">
      {/* Sidebar is provided by the parent DashboardClient; avoid duplicate sidebars here */}

      {/* Right workspace - main content + pinned control bar */}
      <div className="flex flex-1 flex-col h-full min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden px-4 pt-4 sm:px-6 sm:pt-6 lg:px-6 lg:pt-6">
          {!hasFile ? (
            <div className="h-full min-h-0 overflow-y-auto w-full py-4 lg:py-8 flex flex-col items-center">
              {loading ? (
                <div className="text-slate-400">Loading documents...</div>
              ) : (
                <Fragment>
                  {activeView === 'upload' && (
                    <div className="w-full max-w-2xl mx-auto py-12">
                      <EmptyUploadState onUploadSuccess={handleUploadSuccess} />
                    </div>
                  )}
                  {activeView === 'library' && (
                    <div className="w-full max-w-7xl">
                      <MyLibraryView
                        documents={dbDocuments}
                        onSelectDocument={handleOpenDocument}
                      />
                    </div>
                  )}
                  {activeView === 'recent' && (
                    <div className="w-full max-w-7xl">
                      <RecentReadsView
                        documents={dbDocuments}
                        onSelectDocument={handleOpenDocument}
                      />
                    </div>
                  )}
                  {activeView === 'summaries' && (
                    <div className="w-full max-w-7xl">
                      <SummariesView documents={dbDocuments} />
                    </div>
                  )}
                  {activeView === 'settings' && (
                    <div className="w-full max-w-5xl">
                      <SettingsView />
                    </div>
                  )}
                </Fragment>
              )}
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
              onSkipBackward={() => { }} // Not applicable for Web Speech API
              onSkipForward={() => { }} // Not applicable for Web Speech API
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
