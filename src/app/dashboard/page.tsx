'use client';

import { useState } from 'react';
import PDFPanel from '@/components/dashboard/PDFPanel';
import SummaryPanel from '@/components/dashboard/SummaryPanel';
import ControlBar from '@/components/dashboard/ControlBar';
import EmptyUploadState from '@/components/dashboard/EmptyUploadState'; // Initial layout custom component

export default function DashboardPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState('Aura - Natural');
  const [activeMobileTab, setActiveMobileTab] = useState<'pdf' | 'insights'>('pdf');

  // New state to check if a document is uploaded/selected
  const [hasFile, setHasFile] = useState(false);

  // Simulated function for upload or internet browsing selection
  const handleFileSelect = () => {
    setHasFile(true);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto overflow-x-hidden lg:overflow-hidden">
      {/* Mobile tabs: Show ONLY if file is present */}
      {hasFile && (
        <div className="px-4 pt-4 sm:px-6 sm:pt-6 lg:hidden">
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
      )}

      {/* Main content area */}
      <div
        className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 pt-0 sm:p-6 sm:pt-0 ${
          hasFile
            ? 'lg:grid lg:grid-cols-[1.22fr_1fr] lg:gap-6 lg:overflow-hidden'
            : 'lg:flex lg:justify-start' // When no file, take initial alignment
        }`}
      >
        {/* INITIAL STATE (No file loaded) */}
        {!hasFile ? (
          <div className="w-full lg:w-[55%] h-full transition-all duration-500 ease-in-out">
            {/* Apnar upload component jekhane user local file and dynamic web discovery options pabe */}
            <EmptyUploadState onUploadSuccess={handleFileSelect} />
          </div>
        ) : (
          /* ACTIVE STATE (File loaded) */
          <>
            {/* Mobile View Toggle */}
            <div className="min-h-0 overflow-y-auto overflow-x-hidden lg:hidden">
              {activeMobileTab === 'pdf' ? <PDFPanel /> : <SummaryPanel />}
            </div>

            {/* Desktop Panel 1: PDF Viewer / Processor */}
            <div className="hidden min-h-0 overflow-hidden lg:block">
              <PDFPanel />
            </div>

            {/* Desktop Panel 2: AI Insights (Hidden initially, appears now) */}
            <div className="hidden min-h-0 overflow-hidden lg:block">
              <SummaryPanel />
            </div>
          </>
        )}
      </div>

      {/* Control Bar: Only displays or becomes active when file exists */}
      {hasFile && (
        <ControlBar
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          currentTime={currentTime}
          onTimeChange={setCurrentTime}
          duration={duration}
          playbackSpeed={playbackSpeed}
          onSpeedChange={setPlaybackSpeed}
          selectedVoice={selectedVoice}
          onVoiceChange={setSelectedVoice}
        />
      )}
    </div>
  );
}
