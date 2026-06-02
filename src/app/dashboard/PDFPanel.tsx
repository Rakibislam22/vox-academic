import React, { useMemo } from 'react';
import { usePDFContext } from '@/components/dashboard/PDFContext';

interface PDFPanelProps {
  currentWordIndex: number;
  onWordClick?: (wordIndex: number) => void;
}

export default function PDFPanel({
  currentWordIndex,
  onWordClick,
}: PDFPanelProps) {
  const { cleanedTextForSpeech } = usePDFContext();

  // **Guideline 3: Preserve Full Text Flow**
  const words = useMemo(
    () =>
      cleanedTextForSpeech.trim()
        ? cleanedTextForSpeech.trim().split(/\s+/)
        : [],
    [cleanedTextForSpeech],
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101622]">
      {/* Text Truncation Layout Bug Fix */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto whitespace-pre-wrap break-words p-6 text-base leading-relaxed text-slate-200">
        {words.map((word, index) => (
          <span
            key={index}
            onClick={() => onWordClick?.(index)}
            className={`cursor-pointer transition-colors duration-150 hover:text-sky-400 ${
              index === currentWordIndex
                ? 'bg-blue-500/40 text-blue-100 rounded-sm'
                : ''
            }`}
          >
            {word}{' '}
          </span>
        ))}
      </div>
    </div>
  );
}
