# Vox Academic — Project Overview for Claude

Purpose
-------
Vox Academic is a Next.js-based web application focused on academic content presentation and PDF-driven dashboard features. The site uses the Next.js App Router with a component-driven UI and Tailwind CSS for styling. This document summarizes the codebase, architecture, key components, developer workflows, and the technology stack — intended for an assistant (Claude) to learn the project quickly.

High-level goals
-----------------
- Provide a marketing-style frontend (home/landing) with call-to-action, feature listings, stats, and media components.
- Provide a dashboard area for interactive PDF workflows, including uploading/inspecting PDFs and a summary panel.
- Keep code small, modular, and componentized using React + TypeScript and Tailwind CSS utilities.

Quick facts
-----------
- Framework: Next.js (App Router)
- Language: TypeScript + React
- Styling: Tailwind CSS (+ DaisyUI)
- Repo layout: app routes under `src/app`, reusable components under `src/components`.
- Scripts: `dev`, `build`, `start`, `lint` (see `package.json`).

How to run locally
-------------------
1. Install dependencies: `npm install` (or `pnpm install` / `yarn`).
2. Run dev server: `npm run dev`.
3. Build for production: `npm run build` and `npm run start` to serve.

Tech stack (detailed)
---------------------
- Next.js 14: App Router, server/client components, routing and build system.
- React 18: UI library.
- TypeScript: static typing for components and pages.
- Tailwind CSS (v4) + DaisyUI: utility-first styling and component utilities.
- ESLint: linting.
- Build & deploy: Standard Next.js build and start commands (suitable for Vercel or any Node host).

Key dependencies (from package.json)
-----------------------------------
- `next` ^14.0.0
- `react` ^18.2.0
- `react-dom` ^18.2.0
- `tailwindcss` ^4
- `daisyui` ^5.5.x
- Type definitions and dev tools: `typescript`, `@types/react`, `@types/node`, `eslint`, `eslint-config-next`.

Project structure (important files & folders)
--------------------------------------------
- `src/app/` — Application routes and global layout.
	- [src/app/layout.tsx](src/app/layout.tsx#L1) — Root layout, global styles.
	- [src/app/page.tsx](src/app/page.tsx#L1) — Landing/home page.
	- [src/app/dashboard/layout.tsx](src/app/dashboard/layout.tsx#L1) — Dashboard layout.
	- [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx#L1) — Dashboard entry page.
- `src/components/` — Reusable UI components for site and dashboard.
	- [src/components/Navbar.tsx](src/components/Navbar.tsx#L1) — Navigation bar.
	- [src/components/Hero.tsx](src/components/Hero.tsx#L1) — Landing hero.
	- [src/components/Cta.tsx](src/components/Cta.tsx#L1) — Call-to-action block.
	- [src/components/FeatureSe.tsx](src/components/FeatureSe.tsx#L1) — Feature section.
	- [src/components/HowItWorks.tsx](src/components/HowItWorks.tsx#L1) — Steps or process UI.
	- [src/components/VideoSlider.tsx](src/components/VideoSlider.tsx#L1) — Media carousel.
	- [src/components/Interactive.tsx](src/components/Interactive.tsx#L1) — Interactive demo area.
	- [src/components/dashboard/PDFContext.tsx](src/components/dashboard/PDFContext.tsx#L1) — React context provider for PDF/dashboard state.
	- [src/components/dashboard/PDFPanel.tsx](src/components/dashboard/PDFPanel.tsx#L1) — PDF viewing/interaction panel.
	- [src/components/dashboard/SummaryPanel.tsx](src/components/dashboard/SummaryPanel.tsx#L1) — Summary/insights panel (open file in editor).
	- [src/components/dashboard/Sidebar.tsx](src/components/dashboard/Sidebar.tsx#L1) — Dashboard navigation.
	- [src/components/dashboard/ControlBar.tsx](src/components/dashboard/ControlBar.tsx#L1) — Dashboard controls and actions.

Component responsibilities (summary)
----------------------------------
- Site components (Hero, FeatureSe, HowItWorks, Stats, UseCase, Footer): compose the marketing pages and present information.
- `Navbar`: site navigation across pages and dashboard.
- Dashboard components: provide a workspace for PDF-based workflows. `PDFContext` centralizes state (current PDF, pages, selections, extracted data). `PDFPanel` renders or embeds a PDF viewer. `SummaryPanel` shows computed summaries, highlights, or notes. `ControlBar` and `Sidebar` expose actions and navigation for the PDF workspace.

Data flow and state
-------------------
- Top-level app layout loads global CSS (`src/app/globals.css`) and wraps routes with shared providers if present.
- Dashboard uses `PDFContext` (React Context) to keep PDF-related data in sync across `PDFPanel`, `SummaryPanel`, and UI controls.
- Actions (upload, select page, request summary) should dispatch updates into the context and may call APIs or client-side summarizers.

APIs, backend, and integrations
--------------------------------
- This repository currently focuses on the frontend. There are no explicit backend API routes included in the repository root. Integrations (if present) are expected to be added as API routes (`src/pages/api` or `src/app/api`) or external services.

Coding conventions
------------------
- Use TypeScript for all components and pages.
- Prefer small, focused components — compose them in the pages under `src/app`.
- Styling is done with Tailwind utility classes; DaisyUI is available for higher-level UI primitives.

Helpful entry points for an assistant (Claude)
--------------------------------------------
- Read `src/app/layout.tsx` and `src/app/page.tsx` to understand the site shell and landing content.
- Inspect `src/components/dashboard/PDFContext.tsx` to learn the dashboard's state model and actions.
- Open `src/components/dashboard/SummaryPanel.tsx` to see where summaries are rendered and how data is consumed.
- Review `package.json` for installed packages and scripts.

Notes & assumptions
-------------------
- The repo uses the Next.js App Router; pages live under `src/app` instead of `src/pages`.
- There are no explicit environment variables or API keys in this repository; if an external summarization or AI service is used, configuration will need to be added.
- If Claude (the assistant) should perform code edits, run builds, or add API integrations, request explicit instructions and credentials where necessary.

Suggested next steps for Claude
------------------------------
1. Parse `src/components/dashboard/PDFContext.tsx` to extract the context shape and actions.
2. Parse `src/components/dashboard/SummaryPanel.tsx` to understand how summary data is rendered and where to plug in summarization logic.
3. If adding AI summarization, create a small API route or client utility and document required environment variables in a new `.env.example`.

References
----------
- `package.json` (scripts & dependencies): [package.json](package.json#L1)
- Root layout: [src/app/layout.tsx](src/app/layout.tsx#L1)
- Dashboard layout: [src/app/dashboard/layout.tsx](src/app/dashboard/layout.tsx#L1)
- Summary panel: [src/components/dashboard/SummaryPanel.tsx](src/components/dashboard/SummaryPanel.tsx#L1)

If you want, I can also generate a `.env.example` and a short developer README with common commands and troubleshooting notes.

