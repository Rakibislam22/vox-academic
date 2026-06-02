import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import StoredDocument from '@/models/Document';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const documentPayloadSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(240, 'Title is too long'),
    fileUrl: z.string().trim().url('A valid ImageKit file URL is required'),
    imageKitFileId: z.string().trim().min(1, 'ImageKit file ID is required'),
    extractedText: z
      .union([z.array(z.string()), z.string()])
      .optional()
      .transform((value) => {
        if (!value) return [];
        return Array.isArray(value) ? value : [value];
      }),
    summary: z.string().trim().optional(),
    userId: z.string().trim().optional(),
  })
  .strict();

const viewTypes = ['library', 'recent', 'summaries'] as const;
const DEFAULT_RECENT_LIMIT = 10;
const MAX_LIMIT = 100;

type StoredDocumentRecord = {
  _id: unknown;
  userId: unknown;
  title: string;
  fileUrl: string;
  imageKitFileId: string;
  extractedText?: string[];
  summary?: string;
  createdAt: Date;
  updatedAt?: Date;
  lastReadAt?: Date;
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

async function getAuthenticatedUserId() {
  const session = await auth();
  const userId = session?.user?.id;

  return userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null;
}

function serializeDocument(document: StoredDocumentRecord) {
  return {
    id: String(document._id),
    userId: String(document.userId),
    title: document.title,
    fileUrl: document.fileUrl,
    imageKitFileId: document.imageKitFileId,
    extractedText: document.extractedText ?? [],
    summary: document.summary ?? '',
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    lastReadAt: document.lastReadAt,
  };
}

export async function POST(request: Request) {
  const authenticatedUserId = await getAuthenticatedUserId();

  if (!authenticatedUserId) {
    return jsonError(401, 'Authentication required');
  }

  try {
    const body: unknown = await request.json();
    const parsed = documentPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(400, 'Invalid document payload', {
        issues: parsed.error.flatten(),
      });
    }

    if (parsed.data.userId && parsed.data.userId !== authenticatedUserId) {
      return jsonError(403, 'Cannot create documents for another user');
    }

    await connectToDatabase();

    const document = await StoredDocument.create({
      userId: new mongoose.Types.ObjectId(authenticatedUserId),
      title: parsed.data.title,
      fileUrl: parsed.data.fileUrl,
      imageKitFileId: parsed.data.imageKitFileId,
      extractedText: parsed.data.extractedText,
      summary: parsed.data.summary,
    });

    return NextResponse.json(
      { ok: true, document: serializeDocument(document) },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonError(400, 'Invalid JSON request body');
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      return jsonError(
        409,
        'A document with this ImageKit file ID already exists',
      );
    }

    console.error('Create document error:', error);
    return jsonError(500, 'Internal server error');
  }
}

export async function GET(request: Request) {
  const authenticatedUserId = await getAuthenticatedUserId();

  if (!authenticatedUserId) {
    return jsonError(401, 'Authentication required');
  }

  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get('userId')?.trim();

  if (requestedUserId && requestedUserId !== authenticatedUserId) {
    return jsonError(403, 'Cannot view documents for another user');
  }

  const view = searchParams.get('view')?.trim() || 'library';
  const normalizedView = viewTypes.includes(view as (typeof viewTypes)[number])
    ? (view as (typeof viewTypes)[number])
    : 'library';
  const requestedLimit = Number(searchParams.get('limit'));
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(Math.floor(requestedLimit), MAX_LIMIT)
      : normalizedView === 'recent'
        ? DEFAULT_RECENT_LIMIT
        : MAX_LIMIT;

  try {
    await connectToDatabase();

    const query: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(authenticatedUserId),
    };

    if (normalizedView === 'summaries') {
      query.summary = { $exists: true, $ne: '' };
    }

    const sortQuery =
      normalizedView === 'recent'
        ? { lastReadAt: -1, createdAt: -1 }
        : { createdAt: -1 };

    const documents = await StoredDocument.find(query)
      .sort(sortQuery as any)
      .limit(limit)
      .lean<StoredDocumentRecord[]>()
      .exec();

    return NextResponse.json({
      ok: true,
      view: normalizedView,
      documents: documents.map(serializeDocument),
    });
  } catch (error) {
    console.error('Fetch documents error:', error);
    return jsonError(500, 'Internal server error');
  }
}

export async function DELETE(request: Request) {
  const authenticatedUserId = await getAuthenticatedUserId();

  if (!authenticatedUserId) {
    return jsonError(401, 'Authentication required');
  }

  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id')?.trim();

    if (!documentId || !mongoose.Types.ObjectId.isValid(documentId)) {
      return jsonError(400, 'A valid document ID is required');
    }

    await connectToDatabase();

    const document = await StoredDocument.findById(documentId);

    if (!document) {
      return jsonError(404, 'Document not found');
    }

    if (String(document.userId) !== authenticatedUserId) {
      return jsonError(
        403,
        'Cannot delete a document belonging to another user',
      );
    }

    // ImageKit Cloud Cleanup
    const imageKitFileId = document.imageKitFileId;
    if (imageKitFileId && process.env.IMAGEKIT_PRIVATE_KEY) {
      const privateKeyBase64 = Buffer.from(
        process.env.IMAGEKIT_PRIVATE_KEY + ':',
      ).toString('base64');
      const imageKitResponse = await fetch(
        `https://api.imagekit.io/v1/files/${imageKitFileId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Basic ${privateKeyBase64}`,
          },
        },
      );

      if (!imageKitResponse.ok) {
        console.warn(
          `ImageKit deletion warning for ${imageKitFileId}:`,
          await imageKitResponse.text(),
        );
      }
    }

    // MongoDB Document Purge
    await StoredDocument.findByIdAndDelete(documentId);

    return NextResponse.json(
      { ok: true, message: 'Document completely purged' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Delete document error:', error);
    return jsonError(500, 'Internal server error');
  }
}
