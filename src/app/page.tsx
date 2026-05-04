"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const backgroundVideos = [
    {
      id: "hero-main",
      src: "/demo.mp4",
      className:
        "left-1/2 top-1/2 h-[82vh] w-[min(72vw,1080px)] -translate-x-1/2 -translate-y-1/2 lg:h-[78vh] lg:w-[min(66vw,980px)]",
      objectPosition: "center center",
      speed: 0.06,
      opacity: "opacity-45",
    },
    {
      id: "hero-left",
      src: "/demo2.mp4",
      className:
        "left-[-3%] top-[12%] h-[28vh] w-[min(26vw,360px)] rotate-[-7deg] max-lg:left-auto max-lg:right-[-2%] max-lg:top-[8%] max-lg:h-[22vh] max-lg:w-[min(40vw,320px)] max-lg:rotate-[6deg]",
      objectPosition: "center top",
      speed: -0.08,
      opacity: "opacity-30",
    },
    {
      id: "hero-right",
      src: "/demo3.mp4",
      className:
        "right-[-2%] bottom-[10%] h-[30vh] w-[min(28vw,390px)] rotate-[6deg] max-lg:right-auto max-lg:left-[-4%] max-lg:bottom-[9%] max-lg:h-[24vh] max-lg:w-[min(42vw,340px)] max-lg:rotate-[-6deg]",
      objectPosition: "center center",
      speed: 0.1,
      opacity: "opacity-30",
    },
  ];

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
        {/* Background Videos */}
        <div className="absolute inset-0 z-base overflow-hidden">
          {backgroundVideos.map((video) => (
            <div
              key={video.id}
              className={`absolute overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/20 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm ${video.className}`}
              style={{ transform: `translateY(${scrollY * video.speed}px)` }}
            >
              <video
                className={`h-full w-full object-cover ${video.opacity}`}
                style={{ objectPosition: video.objectPosition }}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster="/bg-imj.png"
                aria-hidden="true"
              >
                <source src={video.src} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-black/35" />
            </div>
          ))}
          <div className="absolute inset-0 bg-linear-to-b from-navy-dark/40 via-navy-darker/55 to-charcoal/75" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(26,140,255,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(0,212,255,0.12),transparent_38%)]" />
        </div>

        {/* Animated background elements */}
        <div className="absolute inset-0 z-base">
          <div
            className="absolute top-20 right-10 w-72 h-72 bg-electric-blue/10 rounded-full mix-blend-screen filter blur-3xl"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          />
          <div
            className="absolute -bottom-20 -left-10 w-96 h-96 bg-cyan-accent/5 rounded-full mix-blend-screen filter blur-3xl"
            style={{ transform: `translateY(${scrollY * -0.2}px)` }}
          />
        </div>

        {/* Content */}
        <div className="relative z-content max-w-5xl mx-auto text-center">
          {/* Logo/Badge */}
          <div className="mb-8 inline-block">
            <div className="px-4 py-2 rounded-full border-light bg-navy-darker/50 backdrop-blur-md">
              <span className="text-data accent-primary">✨ AI-Powered Audio Learning</span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-display mb-6 font-bold leading-tight">
            Transform <span className="accent-primary">PDFs</span> Into
            <br />
            <span className="text-warm text-cyan-accent">Engaging Audio Lessons</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            Vox Academic converts academic papers into intelligent audio experiences. Study
            smarter with AI-powered insights, interactive summaries, and adaptive playback
            controls — all designed for deep focus and active learning.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/dashboard">
              <button className="btn-primary px-8 py-4 text-lg">
                Start Learning Now
              </button>
            </Link>
            <button className="btn-secondary px-8 py-4 text-lg">
              Watch Demo
            </button>
          </div>

          {/* Feature Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
            {/* Feature 1 */}
            <div className="group relative panel p-6 hover:border-light/60 transition-smooth cursor-pointer">
              <div className="absolute inset-0 bg-linear-to-br from-electric-blue/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-electric-blue/20 flex items-center justify-center mb-4 group-hover:bg-electric-blue/30 transition-smooth">
                  <span className="text-2xl">📄</span>
                </div>
                <h3 className="text-subheading mb-3 text-left">Upload & Convert</h3>
                <p className="text-white/70 text-left">
                  Upload any academic PDF and instantly convert it to crystal-clear audio with
                  natural-sounding voices.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative panel p-6 hover:border-light/60 transition-smooth cursor-pointer">
              <div className="absolute inset-0 bg-linear-to-br from-electric-blue/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-electric-blue/20 flex items-center justify-center mb-4 group-hover:bg-electric-blue/30 transition-smooth">
                  <span className="text-2xl">🧠</span>
                </div>
                <h3 className="text-subheading mb-3 text-left">AI Insights</h3>
                <p className="text-white/70 text-left">
                  Get intelligent summaries, key concepts, and study tips powered by advanced AI
                  analysis.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative panel p-6 hover:border-light/60 transition-smooth cursor-pointer">
              <div className="absolute inset-0 bg-linear-to-br from-electric-blue/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-electric-blue/20 flex items-center justify-center mb-4 group-hover:bg-electric-blue/30 transition-smooth">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-subheading mb-3 text-left">Smart Playback</h3>
                <p className="text-white/70 text-left">
                  Adjust speed, voice selection, and highlight sync. Built for active learners
                  who demand control.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 border-t border-subtle">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-heading text-center mb-16">
            Built for <span className="accent-primary">Deep Focus</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Left Column */}
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-electric-blue/20">
                    <span className="text-xl">🎯</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-subheading mb-2">Focused Reading</h3>
                  <p className="text-white/70">
                    Immersive PDF reader with word-level highlighting synchronized to audio
                    playback.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-cyan-accent/20">
                    <span className="text-xl">📊</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-subheading mb-2">Side-by-Side Analytics</h3>
                  <p className="text-white/70">
                    Real-time AI summaries, key concepts, and learning tips appear alongside
                    your document.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-electric-blue/20">
                    <span className="text-xl">🎚️</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-subheading mb-2">Playback Control</h3>
                  <p className="text-white/70">
                    Adjust speed (0.75x–2.0x), switch voices, and control progress with our
                    minimalist control bar.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="relative">
              <div className="panel p-8 border-light">
                <div className="aspect-video bg-linear-to-br from-electric-blue/10 to-cyan-accent/5 rounded-lg flex items-center justify-center mb-6 overflow-hidden relative">
                  {/* Fake dashboard preview */}
                  <div className="absolute inset-0 opacity-50">
                    <div className="h-full flex flex-col">
                      <div className="h-12 border-b border-light/30 flex items-center px-4">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 rounded-full bg-electric-blue/40" />
                          <div className="w-2 h-2 rounded-full bg-electric-blue/40" />
                          <div className="w-2 h-2 rounded-full bg-electric-blue/40" />
                        </div>
                      </div>
                      <div className="flex-1 flex">
                        <div className="w-16 border-r border-light/30" />
                        <div className="flex-1 p-4">
                          <div className="space-y-2">
                            <div className="h-4 bg-electric-blue/20 rounded w-3/4" />
                            <div className="h-4 bg-electric-blue/20 rounded w-5/6" />
                            <div className="h-4 bg-electric-blue/20 rounded w-2/3" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-4xl relative z-10">📊</span>
                </div>
                <p className="text-white/60 text-sm">
                  Dual-panel interface optimized for reading and learning simultaneously
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center panel p-12 border-light">
          <h2 className="text-heading mb-4">Ready to Transform Your Learning?</h2>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            Join thousands of students and researchers who are studying smarter with
            Vox Academic.
          </p>
          <Link href="/dashboard">
            <button className="btn-primary px-10 py-4 text-lg">
              Get Started Free
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-subtle py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-label mb-4 accent-primary">Product</h4>
              <ul className="space-y-2 text-sm text-white/60 hover:text-white/80">
                <li>
                  <a href="#" className="transition-smooth">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-smooth">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-smooth">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-label mb-4 accent-primary">Learn</h4>
              <ul className="space-y-2 text-sm text-white/60 hover:text-white/80">
                <li>
                  <a href="#" className="transition-smooth">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-smooth">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-smooth">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-label mb-4 accent-primary">Company</h4>
              <ul className="space-y-2 text-sm text-white/60 hover:text-white/80">
                <li>
                  <a href="#" className="transition-smooth">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-smooth">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-smooth">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-label mb-4 accent-primary">Legal</h4>
              <ul className="space-y-2 text-sm text-white/60 hover:text-white/80">
                <li>
                  <a href="#" className="transition-smooth">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-smooth">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-smooth">
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-subtle pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-white/50">
            <div>© 2026 Vox Academic. All rights reserved.</div>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white/80 transition-smooth">
                Twitter
              </a>
              <a href="#" className="hover:text-white/80 transition-smooth">
                LinkedIn
              </a>
              <a href="#" className="hover:text-white/80 transition-smooth">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
