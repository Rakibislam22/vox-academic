'use client';

import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf.mjs';
import { usePDFContext } from './PDFContext';

GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export default function PDFPanel() {
  const { cleanedTextForSpeech, documentSummary, documentTitle, speech } = usePDFContext();

  const renderToken = (tokenText: string, tokenIndex: number) => {
    const token = speech.tokens[tokenIndex];
    const isActiveWord = token?.isWord && token.wordIndex === speech.activeWordIndex;

    if (token?.isWord) {
      return (
        <span
          key={`${token.start}-${token.end}`}
          className={`inline rounded-md px-1 py-0.5 transition-[background-color,box-shadow,color,transform] duration-200 ${isActiveWord
            ? 'bg-cyan-400/20 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_0_24px_rgba(34,211,238,0.22)] ring-1 ring-cyan-300/30 backdrop-blur-md'
            : 'text-white/92 hover:bg-white/5'
            }`}
          onClick={() => speech.speakFromWordIndex(token.wordIndex ?? 0)}
        >
          {tokenText}
        </span>
      );
    }

    return (
      <span key={`${token.start}-${token.end}`} className="text-white/88">
        {tokenText}
      </span>
    );
  };

  const hasSpeechText = cleanedTextForSpeech.trim().length > 0;

  return (
    <div className="panel flex flex-col h-full min-h-0 overflow-hidden rounded-2xl bg-white/2 backdrop-blur-xl border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      {/* Header */}
      <div className="border-b border-white/10 px-5 sm:px-6 py-5 bg-white/3">
        <h2 className="text-subheading mb-2 text-base sm:text-lg lg:text-xl">
          <span className="text-warm text-cyan-accent">{documentTitle}</span>
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-data text-slate-400">
          <span>{speech.words.length ? `${speech.words.length} spoken words` : 'Awaiting text'}</span>
          <span>{speech.status === 'playing' ? 'Live sync active' : 'Ready for playback'}</span>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/90">{documentSummary}</p>
      </div>

      {/* PDF Content Area */}
      <div className="flex-1 overflow-auto scrollbar-custom p-5 sm:p-6 relative">
        {/* Scan-line effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 h-1 bg-linear-to-r from-transparent via-electric-blue to-transparent opacity-30 animate-scan-line" />
        </div>

        {/* Main content */}
        <div className="prose prose-invert max-w-none">
          {hasSpeechText ? (
            <div className="relative inline-flex w-full rounded-2xl border border-white/10 bg-white/3 px-3 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_0_30px_rgba(26,140,255,0.12)]">
              <span className="absolute left-3 top-4 h-2 w-2 rounded-full bg-cyan-accent shadow-[0_0_14px_rgba(0,212,255,0.9)]" />
              <p className="pl-5 text-body leading-relaxed text-sm sm:text-base text-white whitespace-pre-wrap">
                {speech.tokens.length > 0
                  ? speech.tokens.map((token, index) => renderToken(token.text, index))
                  : cleanedTextForSpeech}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/3 p-6 text-slate-400">
              No cleaned text is loaded yet. Paste the cleanedTextForSpeech payload to see live word
              highlighting.
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-white/10 px-5 sm:px-6 py-4 bg-white/3 text-data text-white/40">
        <span>
          📍 {speech.status === 'playing' ? `Speaking word ${speech.activeWordIndex + 1}` : 'Ready to sync'}
        </span>
      </div>
    </div>
  );
}
