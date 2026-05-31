import { createRequire } from 'node:module';
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ProxyAgent } from 'undici';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 45_000;
const DEFAULT_MODEL = 'gemini-3.1-flash-tts-preview';
const DEFAULT_VOICE = 'Kore';
const DEFAULT_AUDIO_CONTENT_TYPE = 'audio/mpeg';
const MAX_TEXT_LENGTH = 4_000;
const require = createRequire(import.meta.url);

const { Mp3Encoder } = require('lamejs') as {
    Mp3Encoder: new (
        channels: number,
        sampleRate: number,
        kbps: number,
    ) => {
        encodeBuffer: (left: Int16Array, right?: Int16Array) => number[];
        flush: () => number[];
    };
};

const GEMINI_VOICES = [
    'Zephyr',
    'Puck',
    'Charon',
    'Kore',
    'Fenrir',
    'Leda',
    'Orus',
    'Aoede',
    'Callirrhoe',
    'Autonoe',
    'Enceladus',
    'Iapetus',
    'Umbriel',
    'Algieba',
    'Despina',
    'Erinome',
    'Algenib',
    'Rasalgethi',
    'Laomedeia',
    'Achernar',
    'Alnilam',
    'Schedar',
    'Gacrux',
    'Pulcherrima',
    'Achird',
    'Zubenelgenubi',
    'Vindemiatrix',
    'Sadachbia',
    'Sadaltager',
    'Sulafat',
] as const;

const PROXY_ENV_KEYS = ['GEMINI_PROXY_URL', 'HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy'] as const;

const requestSchema = z
    .object({
        text: z
            .string()
            .trim()
            .min(1, 'Text is required')
            .max(MAX_TEXT_LENGTH, 'Text is too long for Gemini TTS')
            .transform((value) => value.replace(/\s+/g, ' ').trim()),
    })
    .strict();

type GenerateAudioRequest = z.infer<typeof requestSchema>;

type GeminiAudioPart = {
    inlineData?: {
        data?: string;
        mimeType?: string;
    };
};

type GeminiAudioResponse = {
    candidates?: Array<{
        content?: {
            parts?: GeminiAudioPart[];
        };
    }>;
    output_audio?: {
        data?: string;
        mime_type?: string;
    };
    outputAudio?: {
        data?: string;
        mimeType?: string;
    };
};

const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

function resolveProxyUrl() {
    for (const key of PROXY_ENV_KEYS) {
        const value = process.env[key]?.trim();

        if (value) {
            return value;
        }
    }

    return null;
}

function createGeminiFetch() {
    const proxyUrl = resolveProxyUrl();

    if (!proxyUrl) {
        return undefined;
    }

    try {
        const dispatcher = new ProxyAgent(proxyUrl);

        return (input: RequestInfo | URL, init?: RequestInit) =>
            fetch(input, {
                ...(init ?? {}),
                dispatcher,
            } as RequestInit & { dispatcher: unknown });
    } catch (error) {
        console.warn('Invalid Gemini proxy configuration, continuing without proxy:', error);
        return undefined;
    }
}

const geminiClient = geminiApiKey
    ? new GoogleGenAI({
        apiKey: geminiApiKey,
        fetch: createGeminiFetch(),
    } as never)
    : null;

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

async function parseRequestBody(request: Request): Promise<GenerateAudioRequest | null> {
    let rawBody: unknown;

    try {
        rawBody = await request.json();
    } catch {
        return null;
    }

    const parsed = requestSchema.safeParse(rawBody);
    return parsed.success ? parsed.data : null;
}

function bufferToStream(audioBuffer: Buffer) {
    return new ReadableStream<Uint8Array>({
        start(controller) {
            controller.enqueue(new Uint8Array(audioBuffer));
            controller.close();
        },
    });
}

function mapLegacyVoiceAlias(voice: string) {
    const normalized = voice.trim();

    if (normalized === 'en-US-AndrewNeural') {
        return 'Kore';
    }

    if (normalized === 'en-US-EmmaNeural') {
        return 'Aoede';
    }

    return normalized;
}

function resolveVoice(request: Request) {
    const requestVoice = new URL(request.url).searchParams.get('voice')?.trim();
    const configuredVoice = process.env.GEMINI_TTS_VOICE?.trim() || process.env.EDGE_TTS_VOICE?.trim();
    const requestedVoice = requestVoice || configuredVoice || DEFAULT_VOICE;
    const mappedVoice = mapLegacyVoiceAlias(requestedVoice);

    return GEMINI_VOICES.includes(mappedVoice as (typeof GEMINI_VOICES)[number])
        ? mappedVoice
        : DEFAULT_VOICE;
}

function extractAudioBytes(response: GeminiAudioResponse) {
    const inlineOutput = response.outputAudio?.data || response.output_audio?.data;

    if (inlineOutput) {
        return {
            audioBytes: Buffer.from(inlineOutput, 'base64'),
            mimeType: response.outputAudio?.mimeType || response.output_audio?.mime_type,
        };
    }

    const firstInlinePart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;

    if (!firstInlinePart?.data) {
        return null;
    }

    return {
        audioBytes: Buffer.from(firstInlinePart.data, 'base64'),
        mimeType: firstInlinePart.mimeType,
    };
}

function parseAudioMetadata(mimeType?: string) {
    const sampleRateMatch = mimeType?.match(/rate=(\d+)/i);
    const channelsMatch = mimeType?.match(/channels=(\d+)/i);

    return {
        sampleRate: sampleRateMatch ? Number(sampleRateMatch[1]) : 24_000,
        channels: channelsMatch ? Number(channelsMatch[1]) : 1,
    };
}

function encodePcmToMp3(pcmBytes: Buffer, sampleRate: number, channels: number) {
    if (channels !== 1) {
        throw new Error(`Unsupported Gemini TTS channel count: ${channels}`);
    }

    if (pcmBytes.byteLength % 2 !== 0) {
        throw new Error('Gemini PCM output is not aligned to 16-bit samples');
    }

    const samples = new Int16Array(pcmBytes.buffer, pcmBytes.byteOffset, pcmBytes.byteLength / 2);
    const encoder = new Mp3Encoder(1, sampleRate, 128);
    const mp3Chunks: Buffer[] = [];
    const blockSize = 1_152;

    for (let index = 0; index < samples.length; index += blockSize) {
        const sampleBlock = samples.subarray(index, index + blockSize);
        const mp3Buffer = encoder.encodeBuffer(sampleBlock);

        if (mp3Buffer.length > 0) {
            mp3Chunks.push(Buffer.from(mp3Buffer));
        }
    }

    const finalBuffer = encoder.flush();

    if (finalBuffer.length > 0) {
        mp3Chunks.push(Buffer.from(finalBuffer));
    }

    return Buffer.concat(mp3Chunks);
}

function isGeminiAudioError(error: unknown) {
    if (!(error instanceof Error)) {
        return false;
    }

    const message = error.message.toLowerCase();

    return (
        message.includes('prohibited_content') ||
        message.includes('response_modalities') ||
        message.includes('inline_data') ||
        message.includes('audio') ||
        message.includes('speech') ||
        message.includes('token')
    );
}

function isAbortError(error: unknown) {
    return error instanceof Error && error.name === 'AbortError';
}

function isGeminiNetworkError(error: unknown) {
    if (!(error instanceof Error)) {
        return false;
    }

    const message = error.message.toLowerCase();
    const cause = error.cause as { code?: string; causeCode?: string } | undefined;

    return (
        message.includes('fetch failed') ||
        message.includes('und_err_connect_timeout') ||
        cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        cause?.causeCode === 'UND_ERR_CONNECT_TIMEOUT' ||
        cause?.code === 'ECONNRESET' ||
        cause?.code === 'ENOTFOUND' ||
        cause?.code === 'EAI_AGAIN' ||
        cause?.code === 'ETIMEDOUT'
    );
}

export async function POST(request: Request) {
    if (!geminiClient || !geminiApiKey) {
        return buildJsonError(500, 'Server configuration error: missing GEMINI_API_KEY', {
            code: 'MISSING_GEMINI_API_KEY',
        });
    }

    const parsedBody = await parseRequestBody(request);

    if (!parsedBody) {
        return buildJsonError(400, 'Invalid request body. Expected JSON payload: { text: string }', {
            code: 'INVALID_REQUEST_BODY',
        });
    }

    const timeoutController = new AbortController();
    const timeout = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);

    try {
        const preferredVoice = resolveVoice(request);

        const audioResponse = (await Promise.race([
            geminiClient.models.generateContent({
                model: process.env.GEMINI_TTS_MODEL?.trim() || DEFAULT_MODEL,
                contents: `Speak the following text naturally and clearly. Preserve the meaning exactly.\n\n${parsedBody.text}`,
                config: {
                    responseModalities: ['audio'],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: preferredVoice,
                            },
                        },
                    },
                    temperature: 0,
                    maxOutputTokens: 1024,
                },
            }),
            new Promise<never>((_, reject) => {
                timeoutController.signal.addEventListener(
                    'abort',
                    () => reject(new DOMException('Gemini TTS request timed out', 'AbortError')),
                    { once: true },
                );
            }),
        ])) as GeminiAudioResponse;

        const extractedAudio = extractAudioBytes(audioResponse);

        if (!extractedAudio || extractedAudio.audioBytes.length === 0) {
            return buildJsonError(502, 'Gemini TTS returned an empty audio payload', {
                code: 'EMPTY_AUDIO_PAYLOAD',
            });
        }

        const { sampleRate, channels } = parseAudioMetadata(extractedAudio.mimeType);
        const audioBytes = extractedAudio.mimeType?.toLowerCase().includes('audio/l16')
            ? encodePcmToMp3(extractedAudio.audioBytes, sampleRate, channels)
            : extractedAudio.audioBytes;

        return new NextResponse(bufferToStream(audioBytes), {
            status: 200,
            headers: {
                'Content-Type': DEFAULT_AUDIO_CONTENT_TYPE,
                'Content-Length': String(audioBytes.length),
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        if (isAbortError(error)) {
            return buildJsonError(504, 'Gemini TTS request timed out', {
                code: 'GEMINI_TTS_TIMEOUT',
            });
        }

        if (isGeminiNetworkError(error)) {
            return buildJsonError(503, 'Gemini API is unreachable from this server environment', {
                code: 'GEMINI_NETWORK_UNREACHABLE',
                proxyConfigured: Boolean(resolveProxyUrl()),
            });
        }

        if (isGeminiAudioError(error)) {
            return buildJsonError(502, 'Gemini TTS could not generate audio for this request', {
                code: 'GEMINI_TTS_AUDIO_ERROR',
            });
        }

        console.error('generate-audio error:', error);

        return buildJsonError(500, 'Unable to generate audio right now', {
            code: 'GENERATE_AUDIO_UNHANDLED_ERROR',
        });
    } finally {
        clearTimeout(timeout);
    }
}