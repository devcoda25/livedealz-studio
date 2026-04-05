/**
 * MobileTeleprompterOverlay - Scrolling script overlay
 * 
 * Features:
 * - Large, readable text
 * - Auto-scrolling with adjustable speed
 * - Font size adjustments
 * - Draggable/Floating container (positioned at top by default)
 */

import React, { useState, useEffect, useRef, memo } from "react";
import { CampaignSession, ScriptCue } from "../../shared/types";

interface MobileTeleprompterOverlayProps {
    session: CampaignSession;
    isRecording: boolean;
    onClose: () => void;
    darkMode?: boolean;
}

export const MobileTeleprompterOverlay = memo(function MobileTeleprompterOverlay({
    session,
    isRecording,
    onClose,
    darkMode = true,
}: MobileTeleprompterOverlayProps) {
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
                
                // Reset if reached end
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
        sm: "text-[18px] leading-[1.6]",
        md: "text-[26px] leading-[1.5]",
        lg: "text-[36px] leading-[1.4]"
    };

    return (
        <div className="absolute top-[12%] left-4 right-4 z-40 animate-in fade-in zoom-in duration-500 ease-out">
            {/* Main prompter window */}
            <div 
                className={`
                    relative rounded-[40px] shadow-2xl overflow-hidden border
                    ${darkMode ? "bg-black/80 backdrop-blur-3xl border-white/10" : "bg-white/90 backdrop-blur-3xl border-slate-200 shadow-xl"}
                `}
                style={{ height: "35vh" }}
            >
                {/* Header / Meta */}
                <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-black/20 to-transparent flex items-center justify-between px-8 z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#f77f00] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Prompter Mode</span>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 transition-all active:scale-95 hover:bg-white/20">
                        <span className="material-icons text-[18px]">close</span>
                    </button>
                </div>

                {/* Scrolling content */}
                <div 
                    ref={scrollContainerRef}
                    className="h-full overflow-y-auto px-10 pt-20 pb-40 no-scrollbar"
                    style={{ scrollBehavior: "auto" }}
                >
                    <div className={`${fontSizeClasses[fontSize]} font-black text-center text-white drop-shadow-xl uppercase tracking-tight`}>
                        {session.scriptCues.map((cue: ScriptCue, i: number) => (
                            <p key={cue.id} className="mb-10 last:mb-0">
                                {cue.text}
                            </p>
                        ))}
                    </div>
                </div>

                {/* Reading Line Indicator */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-[#f77f00]/30 pointer-events-none" />
                <div className="absolute top-1/2 left-0 w-1.5 h-12 bg-[#f77f00] -translate-y-1/2 rounded-r-full shadow-[0_0_15px_rgba(247,127,0,0.6)]" />

                {/* Bottom Controls Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4 pointer-events-auto">
                    {/* Font Size Tuner */}
                    <div className={`flex bg-black/40 backdrop-blur-xl rounded-2xl p-1.5 gap-1.5 border border-white/5 shadow-2xl transition-all`}>
                        {[
                            { id: "sm", label: "S" },
                            { id: "md", label: "M" },
                            { id: "lg", label: "L" }
                        ].map(size => (
                            <button 
                                key={size.id}
                                onClick={() => setFontSize(size.id as any)} 
                                className={`w-9 h-9 rounded-xl text-[12px] font-black uppercase transition-all active:scale-90 ${fontSize === size.id ? "bg-[#f77f00] text-white shadow-lg" : "text-white/40 hover:text-white/60"}`}
                            >
                                {size.label}
                            </button>
                        ))}
                    </div>

                    {/* Play/Pause Heartbeat */}
                    <button 
                        onClick={() => setIsPaused(!isPaused)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-all ${isPaused ? "bg-white text-black" : "bg-[#f77f00] text-white shadow-[#f77f00]/30"}`}
                    >
                        <span className="material-icons text-[28px]">{isPaused ? "play_arrow" : "pause"}</span>
                    </button>

                    {/* Speed Matrix */}
                    <div className={`flex flex-col items-center bg-black/40 backdrop-blur-xl rounded-2xl p-2 gap-1.5 border border-white/5 shadow-2xl`}>
                        <div className="flex gap-1.5">
                            {[1, 2, 3].map(s => (
                                <button 
                                    key={s}
                                    onClick={() => setSpeed(s)}
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black uppercase transition-all active:scale-90 ${speed === s ? "bg-white text-black" : "text-white/30 hover:text-white/60"}`}
                                >
                                    {s}X
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Visual focus mask */}
            <div className="absolute inset-0 rounded-[40px] pointer-events-none" style={{
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)'
            }} />
        </div>
    );
});

export default MobileTeleprompterOverlay;
