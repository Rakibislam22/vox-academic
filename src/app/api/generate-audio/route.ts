import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const HUGGING_FACE_MODEL = process.env.HUGGINGFACE_TTS_MODEL?.trim() || 'facebook/mms-tts-eng';
const HUGGING_FACE_ENDPOINT = process.env.HUGGINGFACE_TTS_ENDPOINT?.trim();
const HUGGING_FACE_URL =
    HUGGING_FACE_ENDPOINT || `https://api-inference.huggingface.co/models/${HUGGING_FACE_MODEL}`;
const REQUEST_TIMEOUT_MS = 45_000;
const DEFAULT_AUDIO_CONTENT_TYPE = 'audio/mpeg';

const generateAudioRequestSchema = z
    .object({
        text: z
            .string()
            .trim()
            .min(1, 'Text is required')
            .max(12_000, 'Text is too long')
            .transform((value) => value.replace(/\s+/g, ' ').trim()),
    })
    .strict();

type GenerateAudioRequest = z.infer<typeof generateAudioRequestSchema>;

function getRetryAfterSeconds(headers: Headers) {
    const retryAfter = headers.get('retry-after');
    if (!retryAfter) {
        return undefined;
    }

    const parsed = Number(retryAfter);
    return Number.isFinite(parsed) ? parsed : undefined;
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

function getHuggingFaceToken() {
    const token = process.env.HF_ACCESS_TOKEN;

    if (!token || !token.trim()) {
        return null;
    }

    return token.trim();
}

function isNetworkFetchFailure(error: unknown) {
    if (!(error instanceof Error)) {
        return false;
    }

    const message = `${error.name}: ${error.message}`.toLowerCase();
    const cause = error.cause as { code?: string } | undefined;

    return (
        message.includes('fetch failed') ||
        message.includes('enotfound') ||
        cause?.code === 'ENOTFOUND' ||
        cause?.code === 'EAI_AGAIN' ||
        cause?.code === 'ECONNRESET' ||
        String(error).toLowerCase().includes('enotfound')
    );
}

async function parseRequestBody(request: Request): Promise<GenerateAudioRequest | null> {
    let rawBody: unknown;

    try {
        rawBody = await request.json();
    } catch {
        return null;
    }

    const parsed = generateAudioRequestSchema.safeParse(rawBody);
    return parsed.success ? parsed.data : null;
}

export async function POST(request: Request) {
    const token = getHuggingFaceToken();

    if (!token) {
        return buildJsonError(
            500,
            'Server configuration error: missing HF_ACCESS_TOKEN',
            { code: 'MISSING_HF_ACCESS_TOKEN' },
        );
    }

    const parsedBody = await parseRequestBody(request);

    if (!parsedBody) {
        return buildJsonError(
            400,
            'Invalid request body. Expected JSON payload: { text: string }',
            { code: 'INVALID_REQUEST_BODY' },
        );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const upstreamResponse = await fetch(HUGGING_FACE_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: parsedBody.text }),
            signal: controller.signal,
            cache: 'no-store',
        });

        const retryAfterSeconds = getRetryAfterSeconds(upstreamResponse.headers);
        const upstreamContentType = upstreamResponse.headers.get('content-type') || '';
        const upstreamContentLength = upstreamResponse.headers.get('content-length');
        const upstreamHeaders = Object.fromEntries(upstreamResponse.headers.entries());

        console.log('Hugging Face API response metadata:', {
            status: upstreamResponse.status,
            statusText: upstreamResponse.statusText,
            ok: upstreamResponse.ok,
            contentType: upstreamContentType || undefined,
            contentLength: upstreamContentLength || undefined,
            headers: upstreamHeaders,
        });

        if (upstreamResponse.status === 429) {
            const errorBody = await upstreamResponse.text();

            console.error('Hugging Face API Error Details:', errorBody || '[empty body]');

            return buildJsonError(
                429,
                'Hugging Face rate limit exceeded. Please retry shortly.',
                {
                    code: 'HUGGING_FACE_RATE_LIMIT',
                    retryAfterSeconds,
                    details: errorBody || undefined,
                },
            );
        }

        if (!upstreamResponse.ok) {
            const errorBody = await upstreamResponse.text();

            console.error('Hugging Face API Error Details:', errorBody || '[empty body]');
            console.error('Hugging Face upstream error metadata:', {
                status: upstreamResponse.status,
                statusText: upstreamResponse.statusText,
                contentType: upstreamContentType || undefined,
                contentLength: upstreamContentLength || undefined,
                headers: upstreamHeaders,
            });

            return buildJsonError(
                502,
                'Hugging Face upstream request failed',
                {
                    code: 'HUGGING_FACE_UPSTREAM_ERROR',
                    upstreamStatus: upstreamResponse.status,
                    upstreamBody: errorBody || undefined,
                    retryAfterSeconds,
                },
            );
        }

        const responseContentType = upstreamContentType.toLowerCase();
        const audioContentType =
            responseContentType.includes('audio/wav') || responseContentType.includes('audio/x-wav')
                ? 'audio/wav'
                : DEFAULT_AUDIO_CONTENT_TYPE;

        const audioBuffer = await upstreamResponse.arrayBuffer();
        const audioBytes = new Uint8Array(audioBuffer);

        if (audioBytes.byteLength === 0) {
            return buildJsonError(
                502,
                'Hugging Face returned an empty audio payload',
                { code: 'EMPTY_AUDIO_PAYLOAD' },
            );
        }

        return new NextResponse(audioBytes, {
            status: 200,
            headers: {
                'Content-Type': audioContentType,
                ...(upstreamContentLength ? { 'Content-Length': upstreamContentLength } : {}),
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            return buildJsonError(
                504,
                'Hugging Face request timed out',
                { code: 'HUGGING_FACE_TIMEOUT' },
            );
        }

        // 🧠 TERMINAL CLEANER FIX BOUNDARY
        if (isNetworkFetchFailure(error)) {
            console.warn('⚠️  Hugging Face offline (DNS/Network).');

            return buildJsonError(
                503,
                'Hugging Face is offline or unreachable',
                { code: 'HUGGING_FACE_OFFLINE' },
            );
        }

        console.error('generate-audio error:', error);

        return buildJsonError(
            500,
            'Unable to generate audio right now',
            { code: 'GENERATE_AUDIO_UNHANDLED_ERROR' },
        );
    } finally {
        clearTimeout(timeout);
    }
}