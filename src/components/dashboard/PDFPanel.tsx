'use client';

import {
  GlobalWorkerOptions,
  getDocument,
  type PDFPageProxy,
  type PDFDocumentProxy,
} from 'pdfjs-dist/legacy/build/pdf.mjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePDFContext } from './PDFContext';

GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

type PdfTextContent = Awaited<ReturnType<PDFPageProxy['getTextContent']>>;

function normalizeTextFromContent(textContent: PdfTextContent) {
  return textContent.items
    .map((item) =>
      item && typeof item === 'object' && 'str' in item
        ? String((item as { str?: unknown }).str ?? '')
        : '',
    )
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizePageText(rawText: string) {
  return rawText
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const wordTokenClass =
  'inline-flex items-center rounded px-0.5 transition-all duration-200 ease-out';

export default function PDFPanel() {
  const {
    currentSentence,
    speech,
    uploadedPdfFile,
    setCleanedTextForSpeech,
    setCurrentSentence,
  } = usePDFContext();

  const documentRef = useRef<PDFDocumentProxy | null>(null);
  const pageTextCacheRef = useRef<Map<number, string>>(new Map());

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isDocumentLoading, setIsDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState('');

  const hasPdfFile = Boolean(uploadedPdfFile);
  const readingTokens = useMemo(
    () => speech.tokens as Array<{ text: string; start: number; end: number }>,
    [speech.tokens],
  );
  const currentWordLabel = speech.currentWord || readingTokens[speech.activeWordIndex]?.text || '';

  const goToPage = useCallback(
    (nextPage: number) => {
      if (!totalPages) {
        return;
      }

      const safePage = Math.max(1, Math.min(nextPage, totalPages));
      setCurrentPage(safePage);
    },
    [totalPages],
  );

  const handlePreviousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const handleNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setDocumentError('');
      setCurrentPage(1);
      setTotalPages(0);
      pageTextCacheRef.current.clear();
    });

    const previousDocument = documentRef.current;
    documentRef.current = null;

    void previousDocument;

    if (!uploadedPdfFile) {
      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (!cancelled) {
        setIsDocumentLoading(true);
      }
    });

    const loadDocument = async () => {
      try {
        const pdfData = await uploadedPdfFile.arrayBuffer();
        const loadingTask = getDocument({ data: pdfData });
        const pdfDocument = await loadingTask.promise;

        if (cancelled) {
          void pdfDocument;
          return;
        }

        documentRef.current = pdfDocument;
        setTotalPages(pdfDocument.numPages);
        setCurrentPage(1);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load PDF document:', error);
          setDocumentError(
            error instanceof Error ? error.message : 'Failed to load the PDF document.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsDocumentLoading(false);
        }
      }
    };

    void loadDocument();

    return () => {
      cancelled = true;
    };
  }, [uploadedPdfFile]);

  useEffect(() => {
    const pdfDocument = documentRef.current;

    if (!pdfDocument || currentPage < 1 || currentPage > totalPages) {
      return undefined;
    }

    let cancelled = false;

    const loadCurrentPageText = async () => {
      try {
        const page = await pdfDocument.getPage(currentPage);
        const textContent = pageTextCacheRef.current.has(currentPage)
          ? null
          : await page.getTextContent();

        if (cancelled) {
          return;
        }

        const pageText =
          pageTextCacheRef.current.get(currentPage) ??
          sanitizePageText(textContent ? normalizeTextFromContent(textContent) : '');

        if (!pageTextCacheRef.current.has(currentPage)) {
          pageTextCacheRef.current.set(currentPage, pageText);
        }

        setCurrentSentence(pageText);
        setCleanedTextForSpeech(pageText);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load PDF page text:', error);
          setDocumentError(error instanceof Error ? error.message : 'Failed to load the PDF page.');
        }
      }
    };

    void loadCurrentPageText();

    return () => {
      cancelled = true;
    };
  }, [currentPage, setCleanedTextForSpeech, setCurrentSentence, totalPages]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-900/20 p-5 backdrop-blur-xl">
      <div className="border-b border-white/10 bg-white/5 px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-subheading text-base font-semibold tracking-tight text-white sm:text-lg lg:text-xl">
                <span className="text-cyan-accent">Project Summary Report Vox Academic</span>
              </h2>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs text-sky-400 border border-sky-500/20">
                Page {totalPages ? currentPage : 0} of {totalPages || 0}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>
              {speech.words.length
                ? `${speech.words.length} tracked words`
                : 'Awaiting synced page text'}
            </span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>{speech.isPlaying ? 'Live sync active' : 'Ready for playback'}</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>
              {currentSentence.trim().length
                ? 'Current page text synced'
                : 'No page text available yet'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={!hasPdfFile || currentPage <= 1 || isDocumentLoading}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white transition-all duration-200 hover:border-cyan-400/30 hover:bg-white/8 hover:shadow-[0_0_24px_rgba(26,140,255,0.12)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="text-base">←</span>
              Previous Page
            </button>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={!hasPdfFile || currentPage >= totalPages || isDocumentLoading}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white transition-all duration-200 hover:border-cyan-400/30 hover:bg-white/8 hover:shadow-[0_0_24px_rgba(26,140,255,0.12)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next Page
              <span className="text-base">→</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 shadow-inner">
              {isDocumentLoading ? 'Loading document' : 'Viewer ready'}
            </span>
          </div>
        </div>

        <div
          className="flex min-h-0 flex-1 justify-center overflow-y-auto rounded-xl border border-white/5 bg-slate-950/40 p-4"
        >
          <div className="relative flex w-full min-h-full justify-center">
            <div className="relative w-full max-w-full overflow-hidden rounded-2xl border border-white/10 bg-[#08111f]/80 p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-4">
              {documentError && (
                <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {documentError}
                </div>
              )}

              {!hasPdfFile ? (
                <div className="flex min-h-104 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-slate-300">
                  <div className="max-w-md">
                    <p className="text-lg font-semibold text-white">No PDF selected yet</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Upload a PDF from the left panel to extract page text and sync the visible
                      reading surface into the audio reader.
                    </p>
                  </div>
                </div>
              ) : isDocumentLoading ? (
                <div className="flex min-h-104 items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-300" />
                    <p className="mt-4 text-sm font-medium uppercase tracking-[0.22em] text-slate-300">
                      Loading PDF
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Preparing page text for responsive reading and karaoke sync.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-104 flex-col rounded-2xl bg-[#0b1220] p-4 sm:p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 text-xs text-slate-400">
                    <span>
                      {speech.status === 'playing'
                        ? `Speaking word ${Math.max(speech.activeWordIndex + 1, 1)}`
                        : 'Ready to sync'}
                    </span>
                    <span>{speech.currentWord || currentWordLabel || 'Listening for word boundaries'}</span>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/40 p-4 sm:p-5">
                    {readingTokens.length > 0 ? (
                      <p className="text-pretty text-[1.03rem] leading-9 text-slate-200 sm:text-[1.08rem] sm:leading-10">
                        {readingTokens.map((token, index) => {
                          const isActive = index === speech.activeWordIndex;

                          return (
                            <span
                              key={`${token.start}-${token.end}-${index}`}
                              className={`${wordTokenClass} ${isActive ? 'bg-sky-500/20 text-sky-400 shadow-[0_0_0_1px_rgba(56,189,248,0.2)]' : 'text-slate-200/90'}`}
                            >
                              {token.text}
                              {index < readingTokens.length - 1 ? ' ' : ''}
                            </span>
                          );
                        })}
                      </p>
                    ) : (
                      <div className="flex min-h-64 items-center justify-center text-center text-sm text-slate-400">
                        <div className="max-w-md">
                          <p className="text-base font-medium text-white">No readable text yet</p>
                          <p className="mt-2 leading-6">
                            Move to a page with extracted text to enable the synced reading view.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/5 px-5 py-4 text-xs text-slate-400 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {speech.isPlaying
                ? `Speaking word ${Math.max(speech.activeWordIndex + 1, 1)}`
                : 'Ready to sync'}
            </span>
            <span>
              {speech.words.length
                ? 'Visible page text is pushed to the audio system'
                : 'Waiting for synced page text'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
