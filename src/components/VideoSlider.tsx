"use client";

import { useState, useEffect } from "react";

const VideoSlider = () => {
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [nextVideoIndex, setNextVideoIndex] = useState<number | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isMobile, setIsMobile] = useState(false); // Mobile detection state

    const backgroundVideos = [
        { id: "hero-main", src: "/demo.webm" },
        { id: "hero-left", src: "/demo2.webm" },
        { id: "hero-right", src: "/demo3.webm" },
    ];

    const mBackgroundVideos = [
        { id: "hero-main", src: "/mDemo.webm" },
        { id: "hero-left", src: "/mDemo2.webm" },
        { id: "hero-right", src: "/mDemo3.webm" },
    ];

    // Screen size check korar jonno useEffect
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768); // 768px er niche thakle mobile dhorbe
        };

        checkScreenSize(); // Initial check
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    // Bortoman list konta hobe seta decide kora
    const activeVideoList = isMobile ? mBackgroundVideos : backgroundVideos;

    const handleVideoEnd = () => {
        if (isTransitioning) return;
        const next = (currentVideoIndex + 1) % activeVideoList.length;
        setNextVideoIndex(next);
    };

    const handleNextVideoReady = () => {
        setIsTransitioning(true);
        const timerId = window.setTimeout(() => {
            setCurrentVideoIndex(nextVideoIndex!);
            setNextVideoIndex(null);
            setIsTransitioning(false);
        }, 800);
        return () => window.clearTimeout(timerId);
    };

    return (
        <div className="relative w-full h-screen overflow-hidden">
            {activeVideoList.map((video, index) => {
                const isActive = index === currentVideoIndex;
                const isNext = index === nextVideoIndex;

                if (!isActive && !isNext) return null;

                return (
                    <div
                        key={`${isMobile ? 'm' : 'd'}-${video.id}`} // Screen change hole jeno refresh hoy
                        className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                        style={{
                            opacity: isActive && isTransitioning ? 0 : (isActive || (isNext && isTransitioning) ? 1 : 0),
                            zIndex: isNext ? 10 : 5,
                        }}
                    >
                        <video
                            className="h-full w-full object-cover"
                            autoPlay
                            muted
                            playsInline
                            key={video.src} // Src change hole video element reload hobe
                            preload="auto"
                            poster="/bg-imj.png"
                            onEnded={isActive ? handleVideoEnd : undefined}
                            onCanPlayThrough={isNext ? handleNextVideoReady : undefined}
                        >
                            {/* File extension onujayi type thik kora */}
                            <source src={video.src} type={video.src.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
                        </video>
                        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
                    </div>
                );
            })}
        </div>
    );
};

export default VideoSlider;