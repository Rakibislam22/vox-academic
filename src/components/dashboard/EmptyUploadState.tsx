'use client';

import { useRef, useState } from 'react';
import {
  Upload,
  Globe,
  FileText,
  ArrowRight,
  Loader2,
  Plus,
  Download,
  Search,
} from 'lucide-react';
import {
  GlobalWorkerOptions,
  getDocument,
} from 'pdfjs-dist/legacy/build/pdf.mjs';
import { usePDFContext } from './PDFContext';
import { useInternetPdfSearch } from './useInternetPdfSearch';
import type { InternetPdfResult } from '@/types/internet-pdf';

interface EmptyUploadStateProps {
  onUploadSuccess: (doc: unknown) => void;
}

GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

type ImageKitAuthResponse = {
  ok: boolean;
  publicKey: string;
  urlEndpoint: string;
  token: string;
  expire: number;
  signature: string;
  message?: string;
};

type ImageKitUploadResponse = {
  url?: string;
  fileId?: string;
  message?: string;
};

type ProcessPdfResponse = {
  summary?: string;
  error?: {
    message?: string;
  };
};

type PersistDocumentResponse = {
  message?: string;
  document?: unknown;
};

async function extractPdfText(file: File) {
  const pdfData = await file.arrayBuffer();
  const loadingTask = getDocument({ data: pdfData });
  const pdfDocument = await loadingTask.promise;

  const pageTexts: string[] = [];

  for (
    let pageNumber = 1;
    pageNumber <= pdfDocument.numPages;
    pageNumber += 1
  ) {
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .reduce<string[]>((accumulator, item) => {
        if ('str' in item && item.str) {
          accumulator.push(item.str);
        }

        return accumulator;
      }, [])
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (pageText) {
      pageTexts.push(`Page ${pageNumber}: ${pageText}`);
    }
  }

  return {
    pageTexts,
    fullText: pageTexts.join('\n\n').trim(),
  };
}

function deriveDocumentTitle(file: File, extractedText: string) {
  const normalizedText = extractedText.replace(/^Page \d+:\s*/gm, '').trim();
  const firstLine = normalizedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  if (firstLine) {
    const candidate = firstLine.replace(/\s+/g, ' ').replace(/[.!?]+$/, '');

    if (candidate.length >= 8 && candidate.length <= 110) {
      return candidate;
    }
  }

  return (
    file.name
      .replace(/\.pdf$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim() || 'Uploaded PDF'
  );
}

function deriveDocumentSummary(extractedText: string) {
  const cleanedText = extractedText
    .replace(/^Page \d+:\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanedText) {
    return 'No readable text was extracted from this PDF.';
  }

  const sentences = cleanedText.match(/[^.!?]+[.!?]+/g) ?? [];
  const summarySentences = sentences.slice(0, 2).join(' ').trim();

  if (summarySentences) {
    return summarySentences;
  }

  const words = cleanedText.split(' ');
  return `${words.slice(0, 40).join(' ')}${words.length > 40 ? '…' : ''}`;
}

function buildImageKitFileName(file: File) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeName =
    file.name
      .replace(/\.pdf$/i, '')
      .replace(/[^a-z0-9-_]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'document';

  return `${safeName}-${timestamp}.pdf`;
}

async function fetchImageKitAuth() {
  const response = await fetch('/api/imagekit-auth', {
    method: 'GET',
    cache: 'no-store',
  });
  const payload = (await response.json()) as Partial<ImageKitAuthResponse>;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || 'Unable to authorize ImageKit upload.');
  }

  return payload as ImageKitAuthResponse;
}

async function uploadPdfToImageKit(file: File) {
  const authPayload = await fetchImageKitAuth();
  const formData = new FormData();

  formData.append('file', file);
  formData.append('fileName', buildImageKitFileName(file));
  formData.append('publicKey', authPayload.publicKey);
  formData.append('signature', authPayload.signature);
  formData.append('expire', String(authPayload.expire));
  formData.append('token', authPayload.token);
  formData.append('folder', '/vox-academic/documents');
  formData.append('useUniqueFileName', 'true');

  const response = await fetch(
    'https://upload.imagekit.io/api/v1/files/upload',
    {
      method: 'POST',
      body: formData,
    },
  );
  const payload = (await response.json()) as ImageKitUploadResponse;

  if (!response.ok || !payload.url || !payload.fileId) {
    throw new Error(payload.message || 'ImageKit upload failed.');
  }

  return {
    fileUrl: payload.url,
    imageKitFileId: payload.fileId,
  };
}

async function generateDocumentSummary(extractedText: string) {
  const response = await fetch('/api/process-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: extractedText }),
  });
  const payload = (await response.json()) as ProcessPdfResponse;

  if (!response.ok || !payload.summary) {
    throw new Error(payload.error?.message || 'AI summary generation failed.');
  }

  return payload.summary;
}

async function persistDocument(payload: {
  title: string;
  fileUrl: string;
  imageKitFileId: string;
  extractedText: string[];
  summary: string;
}) {
  const response = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const responsePayload = (await response.json()) as PersistDocumentResponse;

  if (!response.ok) {
    throw new Error(
      responsePayload.message || 'Document metadata could not be saved.',
    );
  }

  return responsePayload;
}

export default function EmptyUploadState({
  onUploadSuccess,
}: EmptyUploadStateProps) {
  const {
    setCleanedTextForSpeech,
    setCurrentSentence,
    setDocumentTitle,
    setDocumentSummary,
    setUploadedPdfFile,
    refreshDocuments,
  } = usePDFContext();
  const {
    searchResults,
    isSearching,
    processingUrl,
    searchError,
    setSearchError,
    searchPdfs,
    ingestPdfResult,
  } = useInternetPdfSearch();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].type === 'application/pdf') {
      void triggerProcessing(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void triggerProcessing(e.target.files[0]);
    }
  };

  const triggerProcessing = async (file: File) => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const { pageTexts, fullText } = await extractPdfText(file);

      if (!fullText) {
        throw new Error(
          'No readable text was found in this PDF. Scanned PDFs need OCR.',
        );
      }

      const documentTitle = deriveDocumentTitle(file, fullText);
      const [documentSummary, imageKitUpload] = await Promise.all([
        generateDocumentSummary(fullText).catch(() =>
          deriveDocumentSummary(fullText),
        ),
        uploadPdfToImageKit(file),
      ]);

      const response = await persistDocument({
        title: documentTitle,
        fileUrl: imageKitUpload.fileUrl,
        imageKitFileId: imageKitUpload.imageKitFileId,
        extractedText: pageTexts,
        summary: documentSummary,
      });

      const newDocument = response.document;

      setDocumentTitle(documentTitle);
      setDocumentSummary(documentSummary);
      setUploadedPdfFile(file);
      setCleanedTextForSpeech(fullText);
      setCurrentSentence(fullText);
      refreshDocuments();
      onUploadSuccess(newDocument);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to read the PDF.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setErrorMessage('');
      void searchPdfs(searchQuery);
    }
  };

  const handleAddSearchResult = async (result: InternetPdfResult) => {
    setErrorMessage('');
    setSearchError('');

    const file = await ingestPdfResult(result);

    if (file) {
      await triggerProcessing(file);
    }
  };

  return (
    <div className="flex h-full w-full flex-col justify-center space-y-6 py-8 animate-fade-in">
      {/* Title block */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Welcome to{' '}
          <span className="bg-linear-to-r select-none from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Vox Academic
          </span>
        </h1>
        <p className="text-sm text-slate-400">
          Upload an academic paper or search the web to transform static text
          into an interactive audio experience.
        </p>
      </div>

      {isLoading ? (
        /* Processing/Loading State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl min-h-80">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <h3 className="mt-4 text-lg font-semibold text-white">
            Analyzing Document...
          </h3>
          <p className="mt-2 text-sm text-slate-400 max-w-xs">
            Extracting structural milestones, layout structures, and building AI
            insights.
          </p>
        </div>
      ) : (
        /* Action Options Setup */
        <div className="space-y-4">
          {/* Option 1: PDF Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center backdrop-blur-xl cursor-pointer transition-all duration-300 min-h-55 ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.2)]'
                : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              className="hidden"
            />

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-blue-400 transition-transform group-hover:scale-110 shadow-inner">
              <Upload className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-white">
              Upload your PDF
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Drag & drop your academic paper here, or browse local files
            </p>
            <div className="mt-4 flex items-center space-x-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-400 border border-white/5">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span>Supports PDF only</span>
            </div>
          </div>

          {/* Divider text separator */}
          <div className="relative flex py-2 items-center">
            <div className="grow border-t border-white/5"></div>
            <span className="shrink mx-4 text-xs font-semibold text-slate-500 uppercase tracking-widest select-none">
              OR
            </span>
            <div className="grow border-t border-white/5"></div>
          </div>

          {/* Option 2: Dynamic Web Discovery (Browse over internet) */}
          <form
            onSubmit={handleWebSearchSubmit}
            className="group rounded-2xl border border-white/10 bg-white/3 p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/5"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-indigo-400">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Browse over Internet
                </h4>
                <p className="text-xs text-slate-400">
                  Discover and extract from open-access web materials
                </p>
              </div>
            </div>

            <div className="relative mt-1 flex items-center">
              <input
                type="text"
                placeholder="Enter topic or open-access paper URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-500 focus:bg-white/8 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!searchQuery.trim() || isSearching}
                className="absolute right-1.5 rounded-lg bg-indigo-600 p-2 text-white transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:active:scale-100"
                aria-label="Search open-access PDFs"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </button>
            </div>
          </form>

          {(isSearching || searchResults.length > 0 || searchError) && (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Search className="h-4 w-4 text-cyan-300" />
                  Open-access PDFs
                </div>
                {searchResults.length > 0 && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                    {searchResults.length} found
                  </span>
                )}
              </div>

              {isSearching && (
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-300" />
                  Searching scholarly PDF sources...
                </div>
              )}

              {!isSearching && searchResults.length === 0 && !searchError && (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
                  No direct PDFs were found. Try adding an author, paper title,
                  or field-specific keyword.
                </div>
              )}

              {searchResults.map((result) => {
                const isProcessingThisResult = processingUrl === result.pdfUrl;
                const isAnyResultProcessing = Boolean(processingUrl);

                return (
                  <article
                    key={result.pdfUrl}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition-all hover:border-cyan-400/30 hover:bg-white/8"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-200">
                            <FileText className="h-3.5 w-3.5" />
                            {result.domain}
                          </span>
                        </div>
                        <h5 className="line-clamp-2 text-sm font-semibold leading-5 text-white">
                          {result.title}
                        </h5>
                        <p className="line-clamp-3 text-xs leading-5 text-slate-400">
                          {result.snippet}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleAddSearchResult(result)}
                        disabled={isLoading || isAnyResultProcessing}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-400/30 bg-indigo-500/15 px-3 text-xs font-semibold text-indigo-100 transition-all hover:border-indigo-300/50 hover:bg-indigo-500/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
                      >
                        {isProcessingThisResult ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            <Plus className="h-3.5 w-3.5" />
                          </>
                        )}
                        {isProcessingThisResult
                          ? 'Adding...'
                          : 'Add to Library'}
                      </button>
                    </div>
                  </article>
                );
              })}

              {searchError && (
                <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {searchError}
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
