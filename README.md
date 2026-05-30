# Vox Academic 

Vox Academic is a PDF-first academic reading workspace that converts uploaded documents into a structured study experience. The app combines a responsive canvas-based PDF viewer, page text extraction, AI-generated summaries, and audio playback so readers can move between scanning, listening, and revising without leaving the dashboard.

## Executive Summary

The project addresses a common academic workflow problem: long PDFs are difficult to read, hard to revise, and easy to lose context inside. Vox Academic turns each uploaded PDF into an interactive workspace with page navigation, summary insights, and speech-driven playback controls.

The current implementation focuses on three main outcomes:

1. Render the uploaded PDF in a responsive canvas viewer.
2. Extract visible page text and feed it into the summary and audio pipelines.
3. Present playback controls, timers, and progress feedback in a fixed dashboard layout.

## Problem Statement

Academic PDFs are dense, static, and time-consuming to review. Users often need to:

- scan long papers quickly,
- extract the main ideas,
- listen instead of reading,
- jump between pages and sections,
- keep track of what has already been reviewed.

Traditional PDF readers do not provide this workflow in one place.

## Proposed Solution

Vox Academic solves the problem by layering study tools on top of the document itself:

- a PDF viewer that renders pages responsively on canvas,
- a summary panel that surfaces key concepts and reading tips,
- an audio layer for playback and guided listening,
- a dashboard layout that keeps navigation and controls visible.

The idea is to make the PDF act like a study object rather than a static file.

## Core Features

### PDF Viewing

- Upload a PDF and render it inside a responsive canvas.
- Move between pages with previous and next controls.
- Keep the viewer isolated inside the dashboard layout so it does not expand the page.

### Text Extraction

- Extract the visible text from the current page.
- Sync that text into the dashboard summary context.
- Use the extracted content for summaries, concepts, and audio input.

### Summary Panel

- Show the document title and summary.
- Surface key concepts detected from the extracted text.
- Display short study tips for revision and retention.

### Audio Playback

- Generate audio from the extracted text through the backend audio route.
- Provide a fixed bottom control bar with play, skip, timeline, and speed controls.
- Keep the playback state visible while the user continues reading.

### Dashboard Layout

- Left sidebar for library and account access.
- Center PDF viewer.
- Right-side summary and insight panel.
- Bottom control bar pinned across the viewport.

## How It Works

1. A user uploads a PDF.
2. The dashboard loads the document and renders the active page.
3. The page text is extracted and stored in shared PDF context.
4. The summary panel uses that text to generate concepts and guidance.
5. The audio route receives the same text and returns playable output.
6. The control bar updates progress, speed, and seek behavior while the user listens.

## Technical Notes

- Framework: Next.js App Router
- Language: TypeScript + React
- PDF rendering: `pdfjs-dist`
- Styling: Tailwind CSS with utility-first layout patterns
- Audio flow: backend TTS generation with dashboard playback controls

## Important Files

- [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)
- [src/components/dashboard/PDFPanel.tsx](src/components/dashboard/PDFPanel.tsx)
- [src/components/dashboard/SummaryPanel.tsx](src/components/dashboard/SummaryPanel.tsx)
- [src/components/dashboard/ControlBar.tsx](src/components/dashboard/ControlBar.tsx)
- [src/components/dashboard/PDFContext.tsx](src/components/dashboard/PDFContext.tsx)
- [src/app/api/generate-audio/route.ts](src/app/api/generate-audio/route.ts)
- [src/app/api/process-pdf/route.ts](src/app/api/process-pdf/route.ts)

## Project Structure Snapshot

- `src/app/` - application routes and layouts
- `src/components/` - reusable dashboard and site UI
- `src/app/api/` - PDF and audio service routes
- `src/lib/` - validation, auth, and data helpers

## Notes

The source PDF that originally described this report has been removed from the workspace and its content is now represented here in markdown form.
