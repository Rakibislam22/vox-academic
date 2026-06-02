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
    setLoading(true);
    fetch('/api/documents?view=library')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setDocuments(data.documents);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch documents from the server.');
        setLoading(false);
      });
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
    } catch (err) {
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
      <div className="text-slate-400 flex items-center gap-2">
        <Loader2 className="animate-spin w-4 h-4" /> Fetching storage data...
      </div>
    );

  return (
    <div className="w-full text-slate-200 animate-fade-in">
      <h2 className="mb-6 text-2xl font-bold flex items-center gap-3">
        <HardDrive className="w-6 h-6 text-indigo-400" />
        Account Settings & Data Control
      </h2>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
        <div className="border-b border-white/10 bg-black/20 px-6 py-4">
          <h3 className="font-semibold text-white">Storage Management</h3>
          <p className="text-xs text-slate-400 mt-1">
            Manage your uploaded PDFs and generated AI insights.
          </p>
        </div>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <FileX className="w-12 h-12 mb-3 opacity-20" />
            <p>Your storage is completely empty.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-white/5 bg-white/3 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Document Name
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Upload Date
                </th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {documents.map((doc) => (
                <tr key={doc.id} className="transition-colors hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-white break-words max-w-[200px] sm:max-w-xs">
                    {doc.title}
                  </td>
                  <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                    {new Date(doc.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      disabled={deletingIds.has(doc.id)}
                      onClick={() => handlePurge(doc.id)}
                      className="inline-flex items-center justify-center min-w-[155px] gap-2 rounded-xl bg-rose-500/10 px-4 py-2 font-semibold text-rose-500 hover:bg-rose-500/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all border border-rose-500/20"
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
        )}
      </div>
    </div>
  );
}
