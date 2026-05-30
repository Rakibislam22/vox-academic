import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { processPdfRequestSchema, processPdfResponseSchema } from '@/lib/validations/process-pdf';

export const runtime = 'nodejs';

const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
const REQUEST_TIMEOUT_MS = 45_000;
const RESPONSE_MIME_TYPE = 'application/json';

const GEMINI_RESPONSE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'keyTakeaways', 'academicVocabulary'],
  properties: {
    summary: {
      type: 'string',
      minLength: 1,
      description: 'Concise academic summary grounded in the input text.',
    },
    keyTakeaways: {
      type: 'array',
      minItems: 1,
      maxItems: 8,
      items: {
        type: 'string',
        minLength: 1,
      },
      description: 'A short list of core takeaways from the document.',
    },
    academicVocabulary: {
      type: 'array',
      minItems: 0,
      maxItems: 20,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['word', 'definition'],
        properties: {
          word: {
            type: 'string',
            minLength: 1,
          },
          definition: {
            type: 'string',
            minLength: 1,
          },
        },
      },
      description: 'Academic or domain-specific terms with brief definitions.',
    },
  },
} as const;

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (geminiClient) {
    return geminiClient;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  geminiClient = new GoogleGenAI({ apiKey });
  return geminiClient;
}

function buildSystemInstruction() {
  return [
    'You are an academic analysis engine for raw text extracted from PDFs or web-discovered documents.',
    'Return only valid JSON that matches exactly this schema:',
    '{"summary":string,"keyTakeaways":[string],"academicVocabulary":[{"word":string,"definition":string}]}',
    'Rules:',
    '- Output JSON only. No markdown, no code fences, no commentary, and no extra keys.',
    '- summary must be concise, factual, and grounded strictly in the provided text.',
    '- keyTakeaways must contain short, distinct, practical takeaways derived from the text.',
    '- academicVocabulary must contain relevant academic or domain terms with brief plain-language definitions.',
    '- Do not invent facts, citations, or terminology that is not supported by the source text.',
    '- If the source text is sparse, be conservative and preserve meaning without embellishment.',
  ].join('\n');
}

function buildJsonError(status: number, message: string, details?: Record<string, unknown>) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        status,
        message,
        ...(details ?? {}),
      },
    },
    { status },
  );
}

function getRetryAfterSecondsFromHeaders(headers: Headers | undefined) {
  if (!headers) {
    return undefined;
  }

  const retryAfterHeader = headers.get('retry-after');
  if (!retryAfterHeader) {
    return undefined;
  }

  const parsed = Number(retryAfterHeader);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractJsonFromText(text: string) {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

function getRetryAfterSecondsFromError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const candidate = error as {
    response?: { headers?: Headers };
    headers?: Headers;
    retryAfter?: string | number;
  };

  if (typeof candidate.retryAfter === 'number') {
    return candidate.retryAfter;
  }

  if (typeof candidate.retryAfter === 'string') {
    const parsed = Number(candidate.retryAfter);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return getRetryAfterSecondsFromHeaders(candidate.response?.headers ?? candidate.headers);
}

function isGeminiRateLimitError(error: unknown) {
  if (!error) {
    return false;
  }

  if (typeof error === 'object') {
    const candidate = error as {
      status?: number;
      code?: number | string;
      response?: { status?: number };
      message?: string;
      cause?: { code?: string; message?: string };
    };

    if (candidate.status === 429 || candidate.response?.status === 429 || candidate.code === 429) {
      return true;
    }

    const message = `${candidate.message ?? ''} ${candidate.cause?.message ?? ''}`.toLowerCase();
    return (
      message.includes('429') ||
      message.includes('rate limit') ||
      message.includes('resource_exhausted')
    );
  }

  return false;
}

export async function POST(request: Request) {
  const client = getGeminiClient();

  if (!client) {
    return buildJsonError(500, 'Server configuration error: missing GEMINI_API_KEY', {
      code: 'MISSING_GEMINI_API_KEY',
    });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return buildJsonError(400, 'Invalid JSON payload', { code: 'INVALID_JSON' });
  }

  const parsedInput = processPdfRequestSchema.safeParse(body);

  if (!parsedInput.success) {
    return buildJsonError(400, 'Invalid PDF processing payload. Expected { text: string }', {
      code: 'INVALID_PDF_PROCESSING_PAYLOAD',
      issues: parsedInput.error.flatten(),
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: parsedInput.data.text,
      config: {
        abortSignal: controller.signal,
        systemInstruction: buildSystemInstruction(),
        temperature: 0.2,
        topP: 0.9,
        maxOutputTokens: 2048,
        responseMimeType: RESPONSE_MIME_TYPE,
        responseJsonSchema: GEMINI_RESPONSE_JSON_SCHEMA,
      },
    });

    const rawText = response.text?.trim() ?? '';

    if (!rawText) {
      return buildJsonError(502, 'Gemini returned an empty response', {
        code: 'EMPTY_GEMINI_RESPONSE',
      });
    }

    const jsonText = extractJsonFromText(rawText);
    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(jsonText);
    } catch {
      return buildJsonError(502, 'Gemini returned invalid JSON', {
        code: 'INVALID_GEMINI_JSON',
        rawText,
      });
    }

    const parsedOutput = processPdfResponseSchema.safeParse(parsedJson);

    if (!parsedOutput.success) {
      return buildJsonError(502, 'Gemini output did not match the expected schema', {
        code: 'INVALID_GEMINI_SCHEMA',
        issues: parsedOutput.error.flatten(),
        rawText,
      });
    }

    return NextResponse.json(parsedOutput.data, { status: 200 });
  } catch (error) {
    if (isAbortError(error)) {
      return buildJsonError(504, 'Gemini request timed out', {
        code: 'GEMINI_TIMEOUT',
      });
    }

    if (isGeminiRateLimitError(error)) {
      const retryAfterSeconds = getRetryAfterSecondsFromError(error);

      console.error('Gemini rate limit response:', error);

      return NextResponse.json(
        {
          ok: false,
          error: {
            status: 429,
            code: 'GEMINI_RATE_LIMIT',
            message: 'Gemini rate limit exceeded. Please retry shortly.',
            retryAfterSeconds,
          },
        },
        {
          status: 429,
          headers:
            typeof retryAfterSeconds === 'number'
              ? { 'Retry-After': String(retryAfterSeconds) }
              : undefined,
        },
      );
    }

    console.error('process-pdf error:', error);

    return buildJsonError(500, 'Unable to process document', {
      code: 'UNHANDLED_GEMINI_ERROR',
    });
  } finally {
    clearTimeout(timeout);
  }
}
