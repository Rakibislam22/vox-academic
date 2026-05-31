const MAX_AUDIO_TEXT_LENGTH = 4_000;
const DEFAULT_AUDIO_REQUEST_TIMEOUT_MS = 30_000;

function normalizeAudioText(text: string) {
    return text.replace(/\s+/g, ' ').trim().slice(0, MAX_AUDIO_TEXT_LENGTH);
}

function createTimeoutSignal(signal?: AbortSignal, timeoutMs = DEFAULT_AUDIO_REQUEST_TIMEOUT_MS) {
    if (signal) {
        return signal;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    controller.signal.addEventListener(
        'abort',
        () => {
            window.clearTimeout(timeoutId);
        },
        { once: true },
    );

    return controller.signal;
}

export async function fetchGeneratedAudio(text: string, voice: string, signal?: AbortSignal) {
    const audioText = normalizeAudioText(text);
    const requestSignal = createTimeoutSignal(signal);

    const response = await fetch(`/api/generate-audio?voice=${encodeURIComponent(voice)}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: audioText }),
        signal: requestSignal,
    });

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        const responseBody = (await response.json().catch(() => null)) as {
            error?: { message?: string; code?: string };
            ok?: boolean;
        } | null;

        const message = responseBody?.error?.message || 'Audio generation failed on server';
        const code = responseBody?.error?.code;

        throw new Error(code ? `${message} (${code})` : message);
    }

    if (!response.ok) {
        const responseText = await response.text().catch(() => '');
        const suffix = responseText ? `: ${responseText.slice(0, 180)}` : '';

        throw new Error(`Audio generation failed with status ${response.status}${suffix}`);
    }

    return response.blob();
}