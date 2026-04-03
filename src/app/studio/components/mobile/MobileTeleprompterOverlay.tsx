/**
 * MobileTeleprompterOverlay - Scrolling script overlay
 * 
 * Features:
 * - Large, readable text
 * - Auto-scrolling with adjustable speed
 * - Font size adjustments
 * - Draggable/Floating container (positioned at top by default)
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { CampaignSession } from "../shared/types";

interface MobileTeleprompterOverlayProps {
    session: CampaignSession;
    isRecording: boolean;
    onClose: () => void;
    darkMode?: boolean;
}

export const MobileTeleprompterOverlay = ({
    session,
    isRecording,
    onClose,
    darkMode = true,
}: MobileTeleprompterOverlayProps) => {
    const [speed, setSpeed] = useState(2); // 1-5 scale
    const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
    const [isPaused, setIsPaused] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Speed mapping (pixels per 16ms frame)
    const speedMap = {
        1: 0.5,
        2: 1,
        3: 2,
        4: 3.5,
        5: 5
    };

    // Auto-start when recording begins
    useEffect(() => {
        if (isRecording) {
            setIsPaused(false);
        }
    }, [isRecording]);

    // Scrolling logic
    useEffect(() => {
        if (isPaused) {
            if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
            return;
        }

        const scroll = () => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop += speedMap[speed as keyof typeof speedMap];
                
                // Reset if reached end (optional, or just stop)
                if (
                    scrollContainerRef.current.scrollTop + scrollContainerRef.current.clientHeight >=
                    scrollContainerRef.current.scrollHeight
                ) {
                    setIsPaused(true);
                }
            }
        };

        scrollIntervalRef.current = setInterval(scroll, 16); // ~60fps
        return () => {
            if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
        };
    }, [isPaused, speed]);

    const fontSizeClasses = {
        sm: "text-[16px] leading-[1.6]",
        md: "text-[22px] leading-[1.5]",
        lg: "text-[32px] leading-[1.4]"
    };

    return (
        <div className="absolute top-[12%] left-4 right-4 z-40 animate-in fade-in zoom-in duration-300">
            {/* Main prompter window */}
            <div 
                className={`
                    relative rounded-[32px] shadow-2xl overflow-hidden
                    ${darkMode ? "bg-black/60 backdrop-blur-2xl border border-white/10" : "bg-white/80 backdrop-blur-2xl border border-slate-200"}
                `}
                style={{ height: "30vh" }}
            >
                {/* Header / Controls toggle info */}
                <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/40 to-transparent flex items-center justify-between px-6 z-10">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Teleprompter</span>
                    <button onClick={onClose} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/80">
                        <span className="material-icons text-[14px]">close</span>
                    </button>
                </div>

                {/* Scrolling content */}
                <div 
                    ref={scrollContainerRef}
                    className="h-full overflow-y-auto px-8 pt-16 pb-32 scrollbar-none"
                    style={{ scrollBehavior: "auto" }}
                >
                    <div className={`${fontSizeClasses[fontSize]} font-semibold text-center text-white drop-shadow-md`}>
                        {session.scriptCues.map((cue, i) => (
                            <p key={cue.id} className="mb-8 last:mb-0">
                                {cue.text}
                            </p>
                        ))}
                    </div>
                </div>

                {/* Reading Line Indicator */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/40 pointer-events-none" />
                <div className="absolute top-1/2 left-0 w-1 h-8 bg-primary -translate-y-1/2 rounded-r-full shadow-[0_0_10px_#FF5C00]" />

                {/* Bottom Controls Overlay (visible when prompter is active) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between pointer-events-auto">
                    <div className="flex bg-black/40 backdrop-blur-md rounded-2xl p-1 gap-1">
                        <button 
                            onClick={() => setIsFontSize("sm")} 
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${fontSize === "sm" ? "bg-primary text-white" : "text-white/60"}`}
                        >A</button>
                        <button 
                            onClick={() => setIsFontSize("md")} 
                            className={`px-3 py-1.5 rounded-xl text-[13px] font-bold transition-all ${fontSize === "md" ? "bg-primary text-white" : "text-white/60"}`}
                        >A</button>
                        <button 
                            onClick={() => setIsFontSize("lg")} 
                            className={`px-3 py-1.5 rounded-xl text-[16px] font-bold transition-all ${fontSize === "lg" ? "bg-primary text-white" : "text-white/60"}`}
                        >A</button>
                    </div>

                    <button 
                        onClick={() => setIsPaused(!isPaused)}
                        className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
                    >
                        <span className="material-icons text-[24px]">{isPaused ? "play_arrow" : "pause"}</span>
                    </button>

                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[9px] font-bold text-white/60 uppercase">Speed</span>
                        <div className="flex gap-1.5">
                            {[1, 2, 3].map(s => (
                                <button 
                                    key={s}
                                    onClick={() => setSpeed(s)}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all ${speed === s ? "bg-white text-black" : "bg-white/10 text-white/60"}`}
                                >
                                    {s}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    function setIsFontSize(size: "sm" | "md" | "lg") {
        setFontSize(size);
    }
};
