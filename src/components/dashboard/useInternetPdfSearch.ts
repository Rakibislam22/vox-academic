'use client';

import { useCallback, useState } from 'react';
import type {
  IngestUrlResponse,
  InternetPdfResult,
  SearchPdfsResponse,
} from '@/types/internet-pdf';

function getFilenameFromResult(result: InternetPdfResult) {
  const titleSlug =
    result.title
      .toLowerCase()
      .replace(/\.pdf$/i, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'extracted-paper';

  return `${titleSlug}.pdf`;
}

async function parseJsonResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as Partial<T> &
    IngestUrlResponse &
    SearchPdfsResponse;

  if (!response.ok || payload.ok === false) {
    throw new Error(payload.message || 'The request could not be completed.');
  }

  return payload as T;
}

export function useInternetPdfSearch() {
  const [searchResults, setSearchResults] = useState<InternetPdfResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [processingUrl, setProcessingUrl] = useState<string | null>(null);
  const [searchError, setSearchError] = useState('');

  const searchPdfs = useCallback(async (query: string) => {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      setSearchResults([]);
      return;
    }

    setSearchError('');
    setIsSearching(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: normalizedQuery }),
      });
      const payload = await parseJsonResponse<SearchPdfsResponse>(response);

      setSearchResults(payload.results);
    } catch (error) {
      setSearchResults([]);
      setSearchError(
        error instanceof Error
          ? error.message
          : 'Unable to search open-access PDFs.',
      );
    } finally {
      setIsSearching(false);
    }
  }, []);

  const ingestPdfResult = useCallback(async (result: InternetPdfResult) => {
    setSearchError('');
    setProcessingUrl(result.pdfUrl);

    try {
      const response = await fetch('/api/ingest-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfUrl: result.pdfUrl }),
      });

      if (!response.ok) {
        const payload = (await response
          .json()
          .catch(() => null)) as IngestUrlResponse | null;

        throw new Error(payload?.message || 'Unable to download this PDF.');
      }

      const contentType = response.headers.get('content-type') ?? '';

      if (!contentType.toLowerCase().includes('application/pdf')) {
        throw new Error('The selected URL did not return a PDF file.');
      }

      const blob = await response.blob();

      if (!blob.size) {
        throw new Error('The selected PDF was empty.');
      }

      return new File([blob], getFilenameFromResult(result), {
        type: 'application/pdf',
      });
    } catch (error) {
      setSearchError(
        error instanceof Error
          ? error.message
          : 'Unable to ingest the selected PDF.',
      );
      return null;
    } finally {
      setProcessingUrl(null);
    }
  }, []);

  return {
    searchResults,
    isSearching,
    processingUrl,
    searchError,
    setSearchError,
    searchPdfs,
    ingestPdfResult,
  };
}
