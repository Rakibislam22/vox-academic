"use client";

import { useState } from "react";

const VideoSlider = () => {

    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [nextVideoIndex, setNextVideoIndex] = useState<number | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const backgroundVideos = [
        {
            id: "hero-main",
            src: "/demo.webm",
        },
        {
            id: "hero-left",
            src: "/demo2.webm",
        },
        {
            id: "hero-right",
            src: "/demo3.webm",
        },
    ];

    const handleVideoEnd = () => {
        if (isTransitioning) return;
        const next = (currentVideoIndex + 1) % backgroundVideos.length;
        setNextVideoIndex(next);
    };

    const handleNextVideoReady = () => {
        // Start crossfade only after next video is confirmed ready by the browser
        setIsTransitioning(true);

        const timerId = window.setTimeout(() => {
            setCurrentVideoIndex(nextVideoIndex!);
            setNextVideoIndex(null);
            setIsTransitioning(false);
        }, 800); // Slightly longer than CSS transition to ensure stability

        return () => window.clearTimeout(timerId);
    };

    return (
        <div>
            {backgroundVideos.map((video, index) => {
                const isActive = index === currentVideoIndex;
                const isNext = index === nextVideoIndex;

                // Only render active or next video to keep DOM clean but prevent unmounting blink
                if (!isActive && !isNext) return null;

                return (
                    <div
                        key={video.id}
                        className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                        style={{
                            // Current video fades out, next video fades in
                            opacity: isActive && isTransitioning ? 0 : (isActive || (isNext && isTransitioning) ? 1 : 0),
                            zIndex: isNext ? 10 : 5,
                        }}
                    >
                        <video
                            className="h-full w-full object-cover object-right"
                            autoPlay
                            muted
                            playsInline
                            preload="auto"
                            poster="/bg-imj.png"
                            aria-hidden="true"
                            onEnded={isActive ? handleVideoEnd : undefined}
                            onCanPlayThrough={isNext ? handleNextVideoReady : undefined}
                        >
                            <source src={video.src} type="video/mp4" />
                        </video>
                        <div className="absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-black/35" />
                    </div>
                );
            })}
        </div>
    );
};

export default VideoSlider;