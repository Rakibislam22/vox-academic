'use client';

import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentProxy,
  type PDFPageProxy,
  type RenderTask,
} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { usePDFContext } from './PDFContext';

GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

type PdfTextContent = Awaited<ReturnType<PDFPageProxy['getTextContent']>>;

function normalizeTextFromContent(textContent: PdfTextContent) {
  return textContent.items
    .map((item) => (item && typeof item === 'object' && 'str' in item ? String((item as { str?: unknown }).str ?? '') : ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizePageText(rawText: string) {
  return rawText.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function useElementWidth<T extends HTMLElement>() {
  const elementRef = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    let frame = 0;
    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 0;

      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      frame = window.requestAnimationFrame(() => {
        setWidth(nextWidth);
        frame = 0;
      });
    });

    observer.observe(element);

    setWidth(element.getBoundingClientRect().width);

    return () => {
      observer.disconnect();

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return { elementRef, width };
}

export default function PDFPanel() {
  const {
    cleanedTextForSpeech,
    currentSentence,
    speech,
    uploadedPdfFile,
    setCleanedTextForSpeech,
    setCurrentSentence,
  } = usePDFContext();

  const { elementRef: viewportRef, width: viewportWidth } = useElementWidth<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const documentRef = useRef<PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const pageTextCacheRef = useRef<Map<number, string>>(new Map());

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isDocumentLoading, setIsDocumentLoading] = useState(false);
  const [isPageRendering, setIsPageRendering] = useState(false);
  const [documentError, setDocumentError] = useState('');

  const hasPdfFile = Boolean(uploadedPdfFile);
  const hasSpeechText = cleanedTextForSpeech.trim().length > 0;

  const goToPage = useCallback((nextPage: number) => {
    if (!totalPages) {
      return;
    }

    const safePage = Math.max(1, Math.min(nextPage, totalPages));
    setCurrentPage(safePage);
  }, [totalPages]);

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
      setIsPageRendering(false);
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
          setDocumentError(error instanceof Error ? error.message : 'Failed to load the PDF document.');
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
    const canvas = canvasRef.current;

    if (!pdfDocument || !canvas || currentPage < 1 || currentPage > totalPages) {
      return undefined;
    }

    let cancelled = false;

    const renderCurrentPage = async () => {
      setIsPageRendering(true);
      setDocumentError('');

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      try {
        const [page, textContent] = await Promise.all([
          pdfDocument.getPage(currentPage),
          pageTextCacheRef.current.has(currentPage)
            ? Promise.resolve(null)
            : pdfDocument.getPage(currentPage).then((pageProxy: PDFPageProxy) => pageProxy.getTextContent()),
        ]);

        if (cancelled) {
          return;
        }

        const pageText = pageTextCacheRef.current.get(currentPage)
          ?? sanitizePageText(textContent ? normalizeTextFromContent(textContent) : '');

        if (!pageTextCacheRef.current.has(currentPage)) {
          pageTextCacheRef.current.set(currentPage, pageText);
        }

        setCurrentSentence(pageText);
        setCleanedTextForSpeech(pageText);

        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Unable to initialize the PDF canvas context.');
        }

        const baseViewport = page.getViewport({ scale: 1 });
        const availableWidth = viewportWidth > 0 ? Math.max(viewportWidth - 2, 0) : baseViewport.width;
        const responsiveScale = Math.min(2.25, Math.max(0.75, availableWidth / baseViewport.width));
        const outputScale = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: responsiveScale * outputScale });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(viewport.width / outputScale)}px`;
        canvas.style.height = `${Math.floor(viewport.height / outputScale)}px`;

        const renderTask = page.render({ canvasContext: context, canvas, viewport });
        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (error) {
        if (!cancelled) {
          if (error instanceof Error && error.name !== 'RenderingCancelledException') {
            console.error('Failed to render PDF page:', error);
            setDocumentError(error.message || 'Failed to render the PDF page.');
          }
        }
      } finally {
        if (!cancelled) {
          setIsPageRendering(false);
        }
      }
    };

    void renderCurrentPage();

    return () => {
      cancelled = true;

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [currentPage, setCleanedTextForSpeech, setCurrentSentence, totalPages, viewportWidth]);

  return (
    <div className="flex flex-col h-full w-full rounded-2xl border border-white/5 bg-slate-900/20 p-5 backdrop-blur-xl overflow-hidden">
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
            <span>{speech.words.length ? `${speech.words.length} spoken words` : 'Awaiting synced page text'}</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>{speech.status === 'playing' ? 'Live sync active' : 'Ready for playback'}</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>{currentSentence.trim().length ? 'Current page text synced' : 'No page text available yet'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
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
              {isDocumentLoading ? 'Loading document' : isPageRendering ? 'Rendering page' : 'Viewer ready'}
            </span>
          </div>
        </div>

        <div ref={viewportRef} className="flex-1 min-h-0 w-full overflow-y-auto rounded-xl bg-slate-950/40 p-4 border border-white/5 flex justify-center items-start">
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
                      Upload a PDF from the left panel to render pages, extract the visible page text,
                      and sync the current page into the audio pipeline.
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
                      Preparing the document for responsive canvas rendering and text extraction.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-104 justify-center rounded-2xl bg-[#0b1220] p-3 sm:p-4">
                  <canvas
                    ref={canvasRef}
                    className="block max-w-full rounded-xl border border-white/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/5 px-5 py-4 text-xs text-slate-400 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {speech.status === 'playing'
                ? `Speaking word ${Math.max(speech.activeWordIndex + 1, 1)}`
                : 'Ready to sync'}
            </span>
            <span>
              {hasSpeechText ? 'Visible page text is pushed to the audio system' : 'Waiting for synced page text'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
