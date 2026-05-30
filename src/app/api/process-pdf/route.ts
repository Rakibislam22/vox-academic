import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import {
    processPdfRequestSchema,
    processPdfResponseSchema,
    type ProcessPdfRequest,
} from '@/lib/validations/process-pdf';

export const runtime = 'nodejs';

const GEMINI_MODEL = 'gemini-1.5-flash';

const geminiResponseJsonSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['summary', 'keyVocabulary', 'cleanedTextForSpeech'],
    properties: {
        summary: {
            type: 'string',
            description: 'A concise summary of the provided multi-page source text.',
        },
        keyVocabulary: {
            type: 'array',
            description: 'Important terms from the source text with short definitions.',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['word', 'definition'],
                properties: {
                    word: {
                        type: 'string',
                        description: 'A key term extracted from the source text.',
                    },
                    definition: {
                        type: 'string',
                        description: 'A short definition written for a reader or listener.',
                    },
                },
                propertyOrdering: ['word', 'definition'],
            },
        },
        cleanedTextForSpeech: {
            type: 'string',
            description: 'A cleaned, fluent version of the source text that is ready for speech.',
        },
    },
    propertyOrdering: ['summary', 'keyVocabulary', 'cleanedTextForSpeech'],
} as const;

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
        'You are an extraction and cleanup engine for academic and web-discovered source text.',
        'Return only a valid JSON object that exactly matches this schema:',
        '{"summary":string,"keyVocabulary":[{"word":string,"definition":string}],"cleanedTextForSpeech":string}',
        'Rules:',
        '- Output JSON only. Do not wrap the response in markdown, code fences, or commentary.',
        '- Do not add any extra keys.',
        '- Keep the summary concise, accurate, and grounded in the source text.',
        '- keyVocabulary must contain the most important technical or domain-specific terms, with short plain-language definitions.',
        '- cleanedTextForSpeech must read naturally aloud, preserve meaning, remove page headers, page numbers, broken hyphenation, repeated noise, and OCR artifacts, and merge multi-page fragments into a smooth flow.',
        '- Do not invent facts, citations, or terminology not supported by the input.',
    ].join('\n');
}

function getStatusCode(error: unknown) {
    if (!error || typeof error !== 'object') {
        return undefined;
    }

    const candidate = error as { status?: unknown; code?: unknown; response?: { status?: unknown } };
    const status = candidate.status ?? candidate.code ?? candidate.response?.status;

    return typeof status === 'number' ? status : undefined;
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

    const retryAfterHeader = candidate.response?.headers?.get?.('retry-after') ?? candidate.headers?.get?.('retry-after');
    if (!retryAfterHeader) {
        return undefined;
    }

    const parsed = Number(retryAfterHeader);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function isRateLimitError(error: unknown) {
    const status = getStatusCode(error);

    if (status === 429) {
        return true;
    }

    if (error instanceof Error && /rate limit|quota|429/i.test(error.message)) {
        return true;
    }

    if (error && typeof error === 'object') {
        const message = 'message' in error ? String((error as { message?: unknown }).message ?? '') : '';
        return /rate limit|quota|429/i.test(message);
    }

    return false;
}

function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    return new GoogleGenAI({ apiKey });
}

export async function POST(request: Request) {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    }

    const parsedInput = processPdfRequestSchema.safeParse(body);

    if (!parsedInput.success) {
        return NextResponse.json(
            {
                message: 'Invalid PDF processing payload',
                issues: parsedInput.error.flatten(),
            },
            { status: 400 },
        );
    }

    const prompt = buildSourceText(parsedInput.data);

    try {
        const client = getGeminiClient();
        const response = await client.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
                systemInstruction: buildSystemPrompt(),
                temperature: 0.2,
                maxOutputTokens: 4096,
                responseMimeType: 'application/json',
                responseJsonSchema: geminiResponseJsonSchema,
            },
        });

        const rawText = response.text?.trim();

        if (!rawText) {
            return NextResponse.json(
                { message: 'Gemini returned an empty response' },
                { status: 502 },
            );
        }

        let parsedJson: unknown;

        try {
            parsedJson = JSON.parse(rawText);
        } catch {
            return NextResponse.json(
                {
                    message: 'Gemini returned invalid JSON',
                    rawText,
                },
                { status: 502 },
            );
        }

        const parsedOutput = processPdfResponseSchema.safeParse(parsedJson);

        if (!parsedOutput.success) {
            return NextResponse.json(
                {
                    message: 'Gemini output did not match the expected schema',
                    issues: parsedOutput.error.flatten(),
                },
                { status: 502 },
            );
        }

        return NextResponse.json(parsedOutput.data, { status: 200 });
    } catch (error) {
        if (isRateLimitError(error)) {
            const retryAfterSeconds = getRetryAfterSeconds(error);

            return NextResponse.json(
                {
                    message: 'Gemini rate limit exceeded. Please retry shortly.',
                    retryAfterSeconds,
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

        return NextResponse.json(
            {
                message: 'Unable to process document',
            },
            { status: 500 },
        );
    }
}