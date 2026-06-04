'use client';

import React, { useEffect, useState } from 'react';
import { usePDFContext } from '@/components/dashboard/PDFContext';
import { Trash2, Loader2, HardDrive, AlertCircle, FileX } from 'lucide-react';

export type DocumentRecord = {
  id: string;
  title: string;
  createdAt: string;
  fileUrl?: string;
};

export default function SettingsView() {
  const { refreshDocuments, documentsRefreshKey } = usePDFContext();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadDocuments = async () => {
      setLoading(true);

      try {
        const res = await fetch('/api/documents?view=library');
        const data = (await res.json()) as {
          ok?: boolean;
          documents?: DocumentRecord[];
        };

        if (!cancelled && data.ok) {
          setDocuments(data.documents ?? []);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to fetch documents from the server.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDocuments();

    return () => {
      cancelled = true;
    };
  }, [documentsRefreshKey]);

  const handlePurge = async (id: string) => {
    if (
      !window.confirm(
        'Are you sure you want to permanently delete this document? This will remove the file from cloud storage and cannot be undone.',
      )
    )
      return;

    setDeletingIds((prev) => new Set(prev).add(id));
    setError('');

    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        // Instantly slice the deleted file out of the local react list array
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
        // Trigger global state sync to update sidebar badges
        refreshDocuments();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to purge document');
      }
    } catch {
      setError('Network error while attempting to delete document');
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (loading)
    return (
      <div className="flex items-center gap-2 px-1 text-sm text-slate-400 sm:text-base">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        <span>Fetching storage data...</span>
      </div>
    );

  return (
    <div className="w-full min-w-0 animate-fade-in text-slate-200">
      <h2 className="mb-6 flex items-start gap-3 text-xl font-bold leading-tight sm:items-center sm:text-2xl">
        <HardDrive className="h-6 w-6 shrink-0 text-indigo-400" />
        <span className="min-w-0">Account Settings & Data Control</span>
      </h2>

      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400 sm:items-center">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="min-w-0 break-words">{error}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
        <div className="border-b border-white/10 bg-black/20 px-4 py-4 sm:px-6">
          <h3 className="font-semibold text-white">Storage Management</h3>
          <p className="text-xs text-slate-400 mt-1">
            Manage your uploaded PDFs and generated AI insights.
          </p>
        </div>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-slate-500">
            <FileX className="w-12 h-12 mb-3 opacity-20" />
            <p>Your storage is completely empty.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-white/5 md:hidden">
              {documents.map((doc) => (
                <div key={doc.id} className="space-y-4 px-4 py-4">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold leading-6 text-white">
                      {doc.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Uploaded{' '}
                      {new Date(doc.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <button
                    disabled={deletingIds.has(doc.id)}
                    onClick={() => handlePurge(doc.id)}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 text-sm font-semibold text-rose-500 transition-all hover:bg-rose-500/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  >
                    {deletingIds.has(doc.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span>
                      {deletingIds.has(doc.id)
                        ? 'Purging...'
                        : 'Purge Document'}
                    </span>
                  </button>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-white/5 bg-white/3 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-semibold">
                      Document Name
                    </th>
                    <th scope="col" className="px-6 py-4 font-semibold">
                      Upload Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right font-semibold"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="transition-colors hover:bg-white/5"
                    >
                      <td className="max-w-[200px] break-words px-6 py-4 font-medium text-white sm:max-w-xs">
                        {doc.title}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-400">
                        {new Date(doc.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <button
                          disabled={deletingIds.has(doc.id)}
                          onClick={() => handlePurge(doc.id)}
                          className="inline-flex min-w-[155px] items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 font-semibold text-rose-500 transition-all hover:bg-rose-500/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                        >
                          {deletingIds.has(doc.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          <span>
                            {deletingIds.has(doc.id)
                              ? 'Purging...'
                              : 'Purge Document'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
