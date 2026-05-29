'use client';

import { useState, useRef } from 'react';
import { Upload, Globe, FileText, ArrowRight, Loader2 } from 'lucide-react';

interface EmptyUploadStateProps {
  onUploadSuccess: () => void;
}

export default function EmptyUploadState({ onUploadSuccess }: EmptyUploadStateProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].type === 'application/pdf') {
      triggerProcessing();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      triggerProcessing();
    }
  };

  // Mock processing loader to simulate backend extraction
  const triggerProcessing = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onUploadSuccess();
    }, 2000); // 2 seconds processing animation
  };

  const handleWebSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      triggerProcessing();
    }
  };

  return (
    <div className="flex h-full w-full flex-col justify-center space-y-6 py-8 animate-fade-in">
      {/* Title block */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Welcome to{' '}
          <span className="bg-gradient-to-r select-none from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Vox Academic
          </span>
        </h1>
        <p className="text-sm text-slate-400">
          Upload an academic paper or search the web to transform static text into an interactive
          audio experience.
        </p>
      </div>

      {isLoading ? (
        /* Processing/Loading State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl min-h-[320px]">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <h3 className="mt-4 text-lg font-semibold text-white">Analyzing Document...</h3>
          <p className="mt-2 text-sm text-slate-400 max-w-xs">
            Extracting structural milestones, layout structures, and building AI insights.
          </p>
        </div>
      ) : (
        /* Action Options Setup */
        <div className="space-y-4">
          {/* Option 1: PDF Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center backdrop-blur-xl cursor-pointer transition-all duration-300 min-h-[220px] ${isDragging
                ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.2)]'
                : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
              }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              className="hidden"
            />

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-blue-400 transition-transform group-hover:scale-110 shadow-inner">
              <Upload className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-white">Upload your PDF</h3>
            <p className="mt-1 text-xs text-slate-400">
              Drag & drop your academic paper here, or browse local files
            </p>
            <div className="mt-4 flex items-center space-x-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-400 border border-white/5">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span>Supports PDF only</span>
            </div>
          </div>

          {/* Divider text separator */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-slate-500 uppercase tracking-widest select-none">
              OR
            </span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          {/* Option 2: Dynamic Web Discovery (Browse over internet) */}
          <form
            onSubmit={handleWebSearchSubmit}
            className="group rounded-2xl border border-white/10 bg-white/3 p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/5"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-indigo-400">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Browse over Internet</h4>
                <p className="text-xs text-slate-400">
                  Discover and extract from open-access web materials
                </p>
              </div>
            </div>

            <div className="relative mt-1 flex items-center">
              <input
                type="text"
                placeholder="Enter topic or open-access paper URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-500 focus:bg-white/8 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className="absolute right-1.5 rounded-lg bg-indigo-600 p-2 text-white transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:active:scale-100"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
