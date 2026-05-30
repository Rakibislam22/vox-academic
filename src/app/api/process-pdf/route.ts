import { NextResponse } from 'next/server';
import {
    processPdfRequestSchema,
    processPdfResponseSchema,
    type ProcessPdfRequest,
} from '@/lib/validations/process-pdf';

export const runtime = 'nodejs';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile';
const REQUEST_TIMEOUT_MS = 45_000;

function buildSourceText(payload: ProcessPdfRequest) {
    const sections: string[] = [];

    if (payload.title) {
        sections.push(`Title: ${payload.title}`);
    }

    if (payload.sourceType) {
        sections.push(`Source type: ${payload.sourceType}`);
    }

    if (payload.sourceUrl) {
        sections.push(`Source URL: ${payload.sourceUrl}`);
    }

    if (payload.pages?.length) {
        const pageText = payload.pages
            .map((page, index) => {
                const pageLabel = page.pageNumber ?? index + 1;
                return `Page ${pageLabel}:\n${page.text.trim()}`;
            })
            .join('\n\n');

        sections.push(`Multi-page content:\n${pageText}`);
    }

    if (payload.content) {
        sections.push(`Content:\n${payload.content.trim()}`);
    }

    return sections.join('\n\n');
}

function buildSystemPrompt() {
    return [
        'You are an academic summarization engine for PDF text and web-discovered content.',
        'Return only valid JSON that matches exactly this schema:',
        '{"summary":string,"keyVocabulary":[{"word":string,"definition":string}],"cleanedTextForSpeech":string}',
        'Rules:',
        '- Output JSON only. Do not include markdown fences, explanations, or extra keys.',
        '- summary must be concise, factual, and grounded in the provided text.',
        '- keyVocabulary must capture important domain terms with short plain-language definitions.',
        '- cleanedTextForSpeech must be fluent, natural to read aloud, and remove headers, footers, page numbers, broken hyphenation, and OCR noise.',
        '- If the input is too sparse, preserve meaning without inventing unsupported facts.',
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

function getRetryAfterSeconds(error: unknown) {
    if (!error || typeof error !== 'object') {
        return undefined;
    }

    const candidate = error as {
        response?: { headers?: { get?: (name: string) => string | null } };
        headers?: { get?: (name: string) => string | null };
        retryAfter?: string | number;
    };

    if (typeof candidate.retryAfter === 'number') {
        return candidate.retryAfter;
    }

    if (typeof candidate.retryAfter === 'string') {
        const parsed = Number(candidate.retryAfter);
        return Number.isFinite(parsed) ? parsed : undefined;
    }

    const retryAfterHeader =
        candidate.response?.headers?.get?.('retry-after') ?? candidate.headers?.get?.('retry-after');
    if (!retryAfterHeader) {
        return undefined;
    }

    const parsed = Number(retryAfterHeader);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function getGroqApiKey() {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey || !apiKey.trim()) {
        return null;
    }

    return apiKey.trim();
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

async function readUpstreamError(response: Response) {
    const rawText = await response.text();
    const trimmed = rawText.trim();

    if (!trimmed) {
        return undefined;
    }

    try {
        const parsed = JSON.parse(trimmed) as Record<string, unknown>;
        const detail =
            typeof parsed.error === 'string'
                ? parsed.error
                : typeof parsed.message === 'string'
                    ? parsed.message
                    : typeof parsed.detail === 'string'
                        ? parsed.detail
                        : undefined;

        return detail ?? trimmed;
    } catch {
        return trimmed;
    }
}

export async function POST(request: Request) {
    const apiKey = getGroqApiKey();

    if (!apiKey) {
        return buildJsonError(
            500,
            'Server configuration error: missing GROQ_API_KEY',
            { code: 'MISSING_GROQ_API_KEY' },
        );
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return buildJsonError(400, 'Invalid JSON payload', { code: 'INVALID_JSON' });
    }

    const parsedInput = processPdfRequestSchema.safeParse(body);

    if (!parsedInput.success) {
        return buildJsonError(
            400,
            'Invalid PDF processing payload',
            {
                code: 'INVALID_PDF_PROCESSING_PAYLOAD',
                issues: parsedInput.error.flatten(),
            },
        );
    }

    const prompt = buildSourceText(parsedInput.data);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            signal: controller.signal,
            cache: 'no-store',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                temperature: 0.2,
                max_tokens: 2048,
                top_p: 0.9,
                stream: false,
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: buildSystemPrompt(),
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            }),
        });

        const retryAfterSeconds = getRetryAfterSeconds(response.headers);

        if (response.status === 429) {
            const upstreamMessage = await readUpstreamError(response);

            console.error('Groq rate limit response:', upstreamMessage || '[empty body]');

            return NextResponse.json(
                {
                    ok: false,
                    error: {
                        status: 429,
                        code: 'GROQ_RATE_LIMIT',
                        message: 'Groq rate limit exceeded. Please retry shortly.',
                        retryAfterSeconds,
                        details: upstreamMessage || undefined,
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

        if (!response.ok) {
            const upstreamMessage = await readUpstreamError(response);

            console.error('Groq upstream error:', {
                status: response.status,
                body: upstreamMessage || '[empty body]',
            });

            return buildJsonError(502, 'Groq upstream request failed', {
                code: 'GROQ_UPSTREAM_ERROR',
                upstreamStatus: response.status,
                upstreamBody: upstreamMessage || undefined,
                retryAfterSeconds,
            });
        }

        const responseJson = (await response.json()) as {
            choices?: Array<{
                message?: {
                    content?: string | null;
                };
            }>;
        };

        const rawContent = responseJson.choices?.[0]?.message?.content?.trim();

        if (!rawContent) {
            return buildJsonError(502, 'Groq returned an empty response', {
                code: 'EMPTY_GROQ_RESPONSE',
            });
        }

        const jsonText = extractJsonFromText(rawContent);
        let parsedJson: unknown;

        try {
            parsedJson = JSON.parse(jsonText);
        } catch {
            return buildJsonError(502, 'Groq returned invalid JSON', {
                code: 'INVALID_GROQ_JSON',
                rawText: rawContent,
            });
        }

        const parsedOutput = processPdfResponseSchema.safeParse(parsedJson);

        if (!parsedOutput.success) {
            return buildJsonError(502, 'Groq output did not match the expected schema', {
                code: 'INVALID_GROQ_SCHEMA',
                issues: parsedOutput.error.flatten(),
                rawText: rawContent,
            });
        }

        return NextResponse.json(parsedOutput.data, { status: 200 });
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            return buildJsonError(504, 'Groq request timed out', {
                code: 'GROQ_TIMEOUT',
            });
        }

        console.error('process-pdf error:', error);

        return buildJsonError(500, 'Unable to process document', {
            code: 'UNHANDLED_GROQ_ERROR',
        });
    } finally {
        clearTimeout(timeout);
    }
}