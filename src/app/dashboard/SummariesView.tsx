'use client';

import React, { useEffect, useState } from 'react';
import { usePDFContext } from '@/components/dashboard/PDFContext';
import { DownloadCloud } from 'lucide-react';

export type DocumentRecord = {
    id: string;
    title: string;
    summary?: string;
};

interface SummariesViewProps {
    documents?: DocumentRecord[];
}

export default function SummariesView({ documents: initialDocs }: SummariesViewProps) {
    const { documentsRefreshKey } = usePDFContext();
    const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocs || []);
    const [loading, setLoading] = useState(!initialDocs);

    useEffect(() => {
        if (initialDocs) return;
        fetch('/api/documents?view=summaries')
            .then(res => res.json())
            .then(data => {
                if (data.ok) setDocuments(data.documents);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [documentsRefreshKey, initialDocs]);

    const downloadSummaryPdf = (title: string, summary: string) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>${title} - Executive Summary</title>
            <style>body { font-family: sans-serif; padding: 2rem; line-height: 1.6; max-width: 800px; margin: 0 auto; }</style>
          </head>
          <body>
            <h1>${title}</h1>
            <h3>Executive Summary</h3>
            <p>${summary.replace(/\n/g, '<br/>')}</p>
          </body>
        </html>
      `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    };

    if (loading) return <div className="text-slate-400">Loading summaries...</div>;

    return (
        <div className="w-full text-slate-200">
            <h2 className="mb-6 text-2xl font-bold">Saved Executive Summaries</h2>
            {documents.length === 0 ? (
                <p className="text-slate-400">No summaries found.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.map(doc => (
                        <div key={doc.id} className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                            <div className="p-5 flex-1">
                                <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-white">{doc.title}</h3>
                                <p className="line-clamp-4 text-sm text-slate-400">{doc.summary || 'No summary text available.'}</p>
                            </div>
                            <div className="border-t border-white/5 bg-black/20 p-3">
                                <button
                                    onClick={() => downloadSummaryPdf(doc.title, doc.summary || '')}
                                    className="flex w-full items-center justify-center gap-2 border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 p-4 rounded-xl text-xs font-semibold text-white tracking-wide transition-all active:scale-95"
                                >
                                    <DownloadCloud className="h-4 w-4" />
                                    Download Summary PDF
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}