import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 25_000;

const ingestUrlSchema = z
  .object({
    pdfUrl: z.string().trim().url(),
  })
  .strict();

function jsonError(status: number, message: string) {
  return NextResponse.json({ ok: false, message }, { status });
}

function isPrivateIpAddress(address: string) {
  if (address === '::1') {
    return true;
  }

  if (address.startsWith('fc') || address.startsWith('fd')) {
    return true;
  }

  const parts = address.split('.').map(Number);

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [first, second] = parts;

  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254) ||
    first === 0
  );
}

async function assertSafePdfUrl(rawUrl: string) {
  const parsedUrl = new URL(rawUrl);

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Only HTTP and HTTPS PDF URLs are supported.');
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new Error('Local PDF URLs are not allowed.');
  }

  if (isIP(hostname)) {
    if (isPrivateIpAddress(hostname)) {
      throw new Error('Private network PDF URLs are not allowed.');
    }

    return;
  }

  const addresses = await lookup(hostname, { all: true });

  if (addresses.some((address) => isPrivateIpAddress(address.address))) {
    throw new Error('Private network PDF URLs are not allowed.');
  }
}

async function fetchPdf(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      headers: {
        Accept: 'application/pdf,application/octet-stream;q=0.9,*/*;q=0.1',
        'User-Agent': 'VoxAcademicPDFIngest/1.0',
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid JSON request body.');
  }

  const parsed = ingestUrlSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(400, 'A valid pdfUrl is required.');
  }

  try {
    await assertSafePdfUrl(parsed.data.pdfUrl);

    const upstreamResponse = await fetchPdf(parsed.data.pdfUrl);

    if (!upstreamResponse.ok) {
      return jsonError(
        upstreamResponse.status === 404 ? 404 : 502,
        'The selected PDF could not be downloaded.',
      );
    }

    if (upstreamResponse.url) {
      await assertSafePdfUrl(upstreamResponse.url);
    }

    const contentLength = Number(
      upstreamResponse.headers.get('content-length') ?? 0,
    );

    if (contentLength > MAX_PDF_BYTES) {
      return jsonError(413, 'This PDF is larger than the 50 MB ingest limit.');
    }

    const contentType = upstreamResponse.headers.get('content-type') ?? '';
    const arrayBuffer = await upstreamResponse.arrayBuffer();

    if (arrayBuffer.byteLength > MAX_PDF_BYTES) {
      return jsonError(413, 'This PDF is larger than the 50 MB ingest limit.');
    }

    const pdfBuffer = Buffer.from(arrayBuffer);
    const header = pdfBuffer.subarray(0, 5).toString('utf8');

    if (header !== '%PDF-') {
      return jsonError(
        415,
        contentType
          ? `The selected URL returned ${contentType}, not a readable PDF.`
          : 'The selected URL did not return a readable PDF.',
      );
    }

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(pdfBuffer.byteLength),
        'Cache-Control': 'no-store',
        'Content-Disposition': 'inline; filename="vox-academic-ingest.pdf"',
      },
    });
  } catch (error) {
    console.error('PDF URL ingestion error:', error);

    return jsonError(
      error instanceof Error && error.name === 'AbortError' ? 504 : 400,
      error instanceof Error
        ? error.message
        : 'Unable to ingest the selected PDF.',
    );
  }
}
