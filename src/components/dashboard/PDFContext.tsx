"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface PDFContextType {
    currentSentence: string;
    highlightedWord: string;
    setCurrentSentence: (sentence: string) => void;
    setHighlightedWord: (word: string) => void;
}

const PDFContext = createContext<PDFContextType | undefined>(undefined);

export function PDFProvider({ children }: { children: ReactNode }) {
    const [currentSentence, setCurrentSentence] = useState(
        "The phenomenon of neuroplasticity demonstrates that the brain possesses a remarkable capacity for adaptation and reorganization throughout our lifespan."
    );
    const [highlightedWord, setHighlightedWord] = useState("NEUROPLASTICITY");

    return (
        <PDFContext.Provider
            value={{
                currentSentence,
                highlightedWord,
                setCurrentSentence,
                setHighlightedWord,
            }}
        >
            {children}
        </PDFContext.Provider>
    );
}

export function usePDFContext() {
    const context = useContext(PDFContext);
    if (!context) {
        throw new Error("usePDFContext must be used within PDFProvider");
    }
    return context;
}
