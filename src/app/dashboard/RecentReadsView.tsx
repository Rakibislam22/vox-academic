'use client';

import React, { useEffect, useState } from 'react';
import { usePDFContext } from '@/components/dashboard/PDFContext';
import { PlayCircle } from 'lucide-react';

export type DocumentRecord = {
  id: string;
  title: string;
  summary?: string;
  extractedText?: string[];
  createdAt: string;
  lastReadAt?: string;
  fileUrl?: string;
};

interface RecentReadsViewProps {
  onSelectDocument: (doc: DocumentRecord) => void;
  documents?: DocumentRecord[];
}

export default function RecentReadsView({
  onSelectDocument,
  documents: initialDocs,
}: RecentReadsViewProps) {
  const { documentsRefreshKey } = usePDFContext();
  const [documents, setDocuments] = useState<DocumentRecord[]>(
    initialDocs || [],
  );
  const [loading, setLoading] = useState(!initialDocs);

  useEffect(() => {
    if (initialDocs) return;
    fetch('/api/documents?view=recent&limit=5')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setDocuments(data.documents);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [documentsRefreshKey, initialDocs]);

  if (loading)
    return <div className="text-slate-400">Loading recent reads...</div>;

  return (
    <div className="w-full text-slate-200">
      <h2 className="mb-6 text-2xl font-bold">Recent Reads</h2>
      {documents.length === 0 ? (
        <p className="text-slate-400">No recent reads found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
            >
              <div className="flex flex-col gap-1 overflow-hidden">
                <h3 className="truncate text-base font-semibold text-white">
                  {doc.title}
                </h3>
                <span className="text-xs text-slate-400">
                  Last read:{' '}
                  {new Date(doc.lastReadAt || doc.createdAt).toLocaleDateString(
                    undefined,
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    },
                  )}
                </span>
              </div>
              <button
                onClick={() => onSelectDocument(doc)}
                className="ml-4 inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600/20 px-4 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-600/30 active:scale-95"
              >
                <PlayCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Continue Listening</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
