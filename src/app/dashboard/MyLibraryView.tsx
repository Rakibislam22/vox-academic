'use client';

import React, { useEffect, useState } from 'react';
import { usePDFContext } from '@/components/dashboard/PDFContext';
import { FileText } from 'lucide-react';

export type DocumentRecord = {
    id: string;
    title: string;
    summary?: string;
    extractedText?: string[];
    createdAt: string;
    fileUrl?: string;
};

interface MyLibraryViewProps {
    onSelectDocument: (doc: DocumentRecord) => void;
    documents?: DocumentRecord[];
}

export default function MyLibraryView({ onSelectDocument, documents: initialDocs }: MyLibraryViewProps) {
    const { documentsRefreshKey } = usePDFContext();
    const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocs || []);
    const [loading, setLoading] = useState(!initialDocs);

    useEffect(() => {
        if (initialDocs) return;
        fetch('/api/documents?view=library')
            .then(res => res.json())
            .then(data => {
                if (data.ok) setDocuments(data.documents);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [documentsRefreshKey, initialDocs]);

    if (loading) return <div className="text-slate-400">Loading library...</div>;

    return (
        <div className="w-full text-slate-200">
            <h2 className="mb-6 text-2xl font-bold">My Library</h2>
            {documents.length === 0 ? (
                <p className="text-slate-400">Your library is empty.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map(doc => (
                        <div
                            key={doc.id}
                            onClick={() => onSelectDocument(doc)}
                            className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10"
                        >
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-blue-500/20 p-2 text-blue-400">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <h3 className="truncate text-lg font-semibold text-white">{doc.title}</h3>
                                    <span className="mt-1 text-xs text-slate-500">
                                        Added: {new Date(doc.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}