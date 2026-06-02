'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useSpeechSynthesisSync, type SpeechSyncState } from './useSpeechSynthesisSync';

export type ViewState = 'library' | 'recent' | 'summaries' | 'upload' | 'settings';

interface PDFContextType {
  currentSentence: string;
  highlightedWord: string;
  setCurrentSentence: (sentence: string) => void;
  setHighlightedWord: (word: string) => void;
  documentTitle: string;
  setDocumentTitle: (title: string) => void;
  documentSummary: string;
  setDocumentSummary: (summary: string) => void;
  cleanedTextForSpeech: string;
  setCleanedTextForSpeech: (text: string) => void;
  uploadedPdfFile: File | null;
  setUploadedPdfFile: (file: File | null) => void;
  documentsRefreshKey: number;
  refreshDocuments: () => void;
  speech: SpeechSyncState;
  activeView: ViewState;
  setActiveView: (view: ViewState) => void;
}

const PDFContext = createContext<PDFContextType | undefined>(undefined);

export function PDFProvider({ children }: { children: ReactNode }) {
  const [currentSentence, setCurrentSentence] = useState(
    'The phenomenon of neuroplasticity demonstrates that the brain possesses a remarkable capacity for adaptation and reorganization throughout our lifespan.',
  );
  const [highlightedWord, setHighlightedWord] = useState('NEUROPLASTICITY');
  const [documentTitle, setDocumentTitle] = useState('Upload a PDF to begin');
  const [documentSummary, setDocumentSummary] = useState(
    'The uploaded document will appear here once text is extracted.',
  );
  const [cleanedTextForSpeech, setCleanedTextForSpeech] = useState('');
  const [uploadedPdfFile, setUploadedPdfFile] = useState<File | null>(null);
  const [documentsRefreshKey, setDocumentsRefreshKey] = useState(0);
  const [activeView, setActiveView] = useState<ViewState>('library');

  const speech = useSpeechSynthesisSync(cleanedTextForSpeech);

  return (
    <PDFContext.Provider
      value={{
        currentSentence,
        highlightedWord,
        setCurrentSentence,
        setHighlightedWord,
        documentTitle,
        setDocumentTitle,
        documentSummary,
        setDocumentSummary,
        cleanedTextForSpeech,
        setCleanedTextForSpeech,
        uploadedPdfFile,
        setUploadedPdfFile,
        documentsRefreshKey,
        refreshDocuments: () => setDocumentsRefreshKey((key) => key + 1),
        speech,
        activeView,
        setActiveView,
      }}
    >
      {children}
    </PDFContext.Provider>
  );
}

export function usePDFContext() {
  const context = useContext(PDFContext);
  if (!context) {
    throw new Error('usePDFContext must be used within PDFProvider');
  }
  return context;
}
