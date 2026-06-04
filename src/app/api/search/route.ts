import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { InternetPdfResult } from '@/types/internet-pdf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_RESULTS = 8;
const REQUEST_TIMEOUT_MS = 12_000;

const searchSchema = z
  .object({
    query: z.string().trim().min(2).max(240),
  })
  .strict();

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
};

type TavilyResponse = {
  results?: TavilyResult[];
};

function jsonError(
  status: number,
  message: string,
  details?: Record<string, unknown>,
) {
  return NextResponse.json(
    { ok: false, message, ...(details ?? {}) },
    { status },
  );
}

function getDomain(url: string) {
  return new URL(url).hostname.replace(/^www\./i, '');
}

function isLikelyPdfUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    return (
      /^https?:$/.test(parsedUrl.protocol) &&
      (parsedUrl.pathname.toLowerCase().endsWith('.pdf') ||
        parsedUrl.search.toLowerCase().includes('pdf'))
    );
  } catch {
    return false;
  }
}

function normalizeResult(candidate: {
  title?: string;
  snippet?: string;
  pdfUrl?: string;
}): InternetPdfResult | null {
  if (!candidate.pdfUrl || !isLikelyPdfUrl(candidate.pdfUrl)) {
    return null;
  }

  return {
    title: candidate.title?.trim() || 'Open-access PDF',
    snippet: candidate.snippet?.trim() || 'Academic PDF discovered on the web.',
    pdfUrl: candidate.pdfUrl,
    domain: getDomain(candidate.pdfUrl),
  };
}

function uniqueResults(results: InternetPdfResult[]) {
  const seen = new Set<string>();

  return results.filter((result) => {
    const key = result.pdfUrl.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function searchWithTavily(query: string) {
  const apiKey = process.env.TAVILY_API_KEY?.trim();

  if (!apiKey) {
    return [];
  }

  const response = await fetchWithTimeout('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query: `${query} filetype:pdf open access academic paper`,
      search_depth: 'advanced',
      max_results: MAX_RESULTS * 2,
      include_answer: false,
      include_raw_content: false,
      include_images: false,
    }),
  });

  if (!response.ok) {
    throw new Error('Search provider rejected the request.');
  }

  const payload = (await response.json()) as TavilyResponse;

  return (payload.results ?? [])
    .map((result) =>
      normalizeResult({
        title: result.title,
        snippet: result.content,
        pdfUrl: result.url,
      }),
    )
    .filter((result): result is InternetPdfResult => Boolean(result));
}

async function searchWithArxiv(query: string) {
  const params = new URLSearchParams({
    search_query: `all:${query}`,
    start: '0',
    max_results: String(MAX_RESULTS),
    sortBy: 'relevance',
    sortOrder: 'descending',
  });
  const response = await fetchWithTimeout(
    `https://export.arxiv.org/api/query?${params.toString()}`,
    { headers: { Accept: 'application/atom+xml' } },
  );

  if (!response.ok) {
    return [];
  }

  const xml = await response.text();
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];

  return entries
    .map((entry) => {
      const id = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1]?.trim();
      const title = entry
        .match(/<title>([\s\S]*?)<\/title>/)?.[1]
        ?.replace(/\s+/g, ' ')
        .trim();
      const summary = entry
        .match(/<summary>([\s\S]*?)<\/summary>/)?.[1]
        ?.replace(/\s+/g, ' ')
        .trim();

      return normalizeResult({
        title,
        snippet: summary,
        pdfUrl: id?.replace('/abs/', '/pdf/').concat('.pdf'),
      });
    })
    .filter((result): result is InternetPdfResult => Boolean(result));
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid JSON request body');
  }

  const parsed = searchSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(
      400,
      'Search query must be between 2 and 240 characters.',
      {
        issues: parsed.error.flatten(),
      },
    );
  }

  try {
    const [tavilyResults, arxivResults] = await Promise.all([
      searchWithTavily(parsed.data.query),
      searchWithArxiv(parsed.data.query),
    ]);
    const results = uniqueResults([...tavilyResults, ...arxivResults]).slice(
      0,
      MAX_RESULTS,
    );

    return NextResponse.json({ ok: true, results }, { status: 200 });
  } catch (error) {
    console.error('PDF search error:', error);
    return jsonError(
      502,
      error instanceof Error
        ? error.message
        : 'Unable to search open-access PDFs.',
    );
  }
}
