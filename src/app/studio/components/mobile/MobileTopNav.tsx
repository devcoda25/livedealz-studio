/**
 * Mobile Top Nav - Native floating header
 * 
 * - Host avatar + name (left)
 * - Phase selector (Rehearsal | Record | Live)
 * - Stats + theme toggle (right)
 */

import React, { memo } from "react";
import Image from "next/image";
import { Mode } from "../shared/types";

interface MobileTopNavProps {
    hostName: string;
    viewerCount: number;
    mode: Mode;
    liveTimerLabel: string;
    recordingTimerLabel?: string;
    onEndLive: () => void;
    onModeChange: (mode: Mode) => void;
    darkMode?: boolean;
}

export const MobileTopNav = memo(function MobileTopNav({
    hostName,
    viewerCount,
    mode,
    liveTimerLabel,
    recordingTimerLabel,
    onEndLive,
    onModeChange,
    darkMode = true,
}: MobileTopNavProps) {
    const isLive = mode === "live";
    const isRecording = mode === "record";

    return (
        <div className="relative z-50 pointer-events-auto">
            {/* Gradient fade */}
            <div className={`absolute inset-0 bg-gradient-to-b ${darkMode ? "from-black/60" : "from-white/80"} to-transparent h-40 pointer-events-none`} />

            {/* Content */}
            <div className="relative flex items-center justify-between px-4 pt-safe pt-3 pb-2">
                {/* Left: Host + Stats Cluster */}
                <div className="flex items-center gap-2 min-w-0">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0 bg-black/30 backdrop-blur-sm flex items-center justify-center shadow-lg">
                        <img
                            src="/assets/logos/evlogo.png"
                            alt="LiveDealz"
                            className="w-8 h-8 object-contain"
                        />
                        {isLive && (
                            <div className="absolute inset-0 border-2 border-red-500 rounded-full animate-pulse" />
                        )}
                    </div>

                    <div className="flex flex-col min-w-0">
                        <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[14px] font-bold truncate drop-shadow-md`}>
                            {hostName}
                        </span>
                        <div className="flex items-center gap-1.5">
                            {isLive ? (
                                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/10">
                                    <div className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                        <span className="text-white text-[10px] font-black tracking-tighter">LIVE</span>
                                    </div>
                                    <div className="w-[1px] h-2 bg-white/20" />
                                    <div className="flex items-center gap-1">
                                        <span className="material-icons text-white/60 text-[12px]">visibility</span>
                                        <span className="text-white text-[10px] font-bold tabular-nums">{viewerCount.toLocaleString()}</span>
                                    </div>
                                </div>
                            ) : isRecording ? (
                                <span className="text-red-400 text-[10px] font-black tracking-widest uppercase">● REC</span>
                            ) : (
                                <span className={`${darkMode ? "text-white/50" : "text-slate-500"} text-[10px] font-medium`}>Rehearsal</span>
                            )}
                        </div>
                    </div>
                </div>



                {/* Center: Phase selector (No background version) */}
                <div className="absolute top-[60px] left-1/2 -translate-x-1/2 flex items-center justify-center gap-6 pointer-events-auto">
                    {(["rehearsal", "record", "live"] as Mode[]).map((phase) => {
                        const isActive = mode === phase;
                        const label = phase === "live" ? "GO LIVE" : phase.toUpperCase();
                        
                        return (
                            <button
                                key={phase}
                                onClick={() => onModeChange(phase)}
                                className="flex flex-col items-center group"
                            >
                                <span className={`
                                    text-[11px] font-black tracking-[0.1em] transition-all duration-300
                                    ${isActive 
                                        ? phase === "live" ? "text-red-500 scale-110" : "text-white scale-110"
                                        : "text-white/40 group-active:text-white/70"
                                    }
                                `}>
                                    {label}
                                </span>
                                {isActive && (
                                    <div className={`
                                        w-1 h-1 rounded-full mt-1 animate-in zoom-in duration-300
                                        ${phase === "live" ? "bg-red-500" : "bg-white"}
                                    `} />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Right: Timer + Action Cluster */}
                <div className="flex items-center gap-2">
                    {/* Timer / REC */}
                    {(isLive || isRecording) && (
                        <div className={`
                            flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md border shadow-lg
                            ${isLive
                                ? "bg-red-500/20 border-red-500/40 text-white"
                                : "bg-black/40 border-white/10 text-white"
                            }
                        `}>
                            <span className="text-[12px] font-mono font-black">
                                {isLive ? liveTimerLabel : recordingTimerLabel || "0:00"}
                            </span>
                        </div>
                    )}

                    {/* Exit / End */}
                    <button
                        onClick={onEndLive}
                        className={`h-9 w-9 ${darkMode ? "bg-black/40 text-white" : "bg-white/80 text-slate-900"} backdrop-blur-md rounded-full flex items-center justify-center transition-all active:scale-90 border border-white/10 shadow-lg`}
                    >
                        <span className="material-icons text-[20px]">
                            {isLive ? "stop" : "close"}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
});

export default MobileTopNav;
