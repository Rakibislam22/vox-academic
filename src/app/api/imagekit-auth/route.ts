import { randomUUID, createHmac } from 'node:crypto';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const AUTH_TTL_SECONDS = 30 * 60;

function jsonError(status: number, message: string) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError(401, 'Authentication required');
  }

  const publicKey =
    process.env.IMAGEKIT_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint =
    process.env.IMAGEKIT_URL_ENDPOINT ||
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    return jsonError(500, 'ImageKit configuration is missing');
  }

  const token = randomUUID();
  const expire = Math.floor(Date.now() / 1000) + AUTH_TTL_SECONDS;
  const signature = createHmac('sha1', privateKey)
    .update(`${token}${expire}`)
    .digest('hex');

  return NextResponse.json({
    ok: true,
    publicKey,
    urlEndpoint,
    token,
    expire,
    signature,
  });
}
