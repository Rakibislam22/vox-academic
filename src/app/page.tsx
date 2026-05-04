import Cta from "@/components/Cta";
import FeatureSe from "@/components/FeatureSe";
import Footer from "@/components/Footer";
import HowItWorks from "@/components/HowItWorks";
import Interactive from "@/components/Interactive";
import Stats from "@/components/Stats";
import UseCase from "@/components/UseCase";
import VideoSlider from "@/components/VideoSlider";
import Link from "next/link";

export default function Home() {

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-left overflow-hidden px-4 sm:px-6 lg:px-8">
        {/* Background Videos Stack */}
        <div className="absolute inset-0 z-base overflow-hidden bg-black">

          <VideoSlider />

          {/* Persistent Overlays */}
          <div className="absolute inset-0 bg-linear-to-b from-navy-dark/40 via-navy-darker/55 to-charcoal/75 z-20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(26,140,255,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(0,212,255,0.12),transparent_38%)] z-20" />
        </div>

        {/* Content */}
        <div className="relative z-content max-w-xl mx-0 ml-4 text-left lg:ml-8">
          <div className="absolute inset-0 -z-10 bg-black/50 rounded-2xl blur-xl" />
          <div className="mb-8 inline-block">
            <div className="px-4 py-2 rounded-full border-light bg-navy-darker/50 backdrop-blur-md">
              <span className="text-data accent-primary">✨ AI-Powered Audio Learning</span>
            </div>
          </div>

          <h1 className="text-display mb-6 font-bold leading-tight">
            Transform <span className="accent-primary">PDFs</span> Into
            <br />
            <span className="text-warm text-cyan-accent">Engaging Audio Lessons</span>
          </h1>

          <p className="text-xl text-white/80 mb-12 max-w-2xl leading-relaxed">
            Vox Academic converts academic papers into intelligent audio experiences. Study
            smarter with AI-powered insights, interactive summaries, and adaptive playback
            controls — all designed for deep focus and active learning.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link href="/dashboard">
              <button className="btn-primary px-8 py-4 text-lg">
                Start Learning Now
              </button>
            </Link>
            <button className="btn-secondary px-8 py-4 text-lg">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <FeatureSe />
      </section>

      {/* How It Works Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <HowItWorks />
      </section>

      {/* Interactive Features Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-transparent via-navy-darker/30 to-transparent">
        <Interactive />
      </section>

      {/* Use Cases Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <UseCase />
      </section>

      {/* Stats/Metrics Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-r from-navy-darker/30 via-navy-dark to-navy-darker/50 border-y border-blue-600/30">
        <Stats />
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <Cta />
      </section>

      <Footer />

    </>
  );
}