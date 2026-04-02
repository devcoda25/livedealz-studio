/**
 * Mobile Top Nav - Native floating header
 * 
 * - Host avatar + name (left)
 * - Phase selector (Rehearsal | Record | Live)
 * - Stats + theme toggle (right)
 */

import React, { memo } from "react";
import Image from "next/image";
import { Mode } from "./types";

interface MobileTopNavProps {
    hostName: string;
    hostAvatarUrl?: string;
    viewerCount: number;
    mode: Mode;
    liveTimerLabel: string;
    onEndLive: () => void;
    onModeChange?: (mode: Mode) => void;
    darkMode?: boolean;
    onToggleDarkMode?: () => void;
}

export const MobileTopNav = memo(function MobileTopNav({
    hostName,
    hostAvatarUrl,
    viewerCount,
    mode,
    liveTimerLabel,
    onEndLive,
    onModeChange,
    darkMode = true,
    onToggleDarkMode,
}: MobileTopNavProps) {
    const isLive = mode === "live";
    const isRecording = mode === "record";
    const isRehearsing = mode === "rehearsal";

    return (
        <div className="relative z-50 pointer-events-auto">
            {/* Gradient fade */}
            <div className={`absolute inset-0 bg-gradient-to-b ${darkMode ? "from-black/60" : "from-white/80"} to-transparent h-40 pointer-events-none`} />

            {/* Content */}
            <div className="relative flex items-center justify-between px-4 pt-safe pt-3 pb-2">
                {/* Left: Host info */}
                <div className="flex items-center gap-2 min-w-0">
                    {/* Avatar */}
                    <div className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                        <img
                            src="/assets/logos/evlogo.png"
                            alt="LiveDealz"
                            className="w-7 h-7 object-contain"
                        />
                        {/* Live indicator dot */}
                        {isLive && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-black animate-pulse" />
                        )}
                    </div>

                    {/* Name + status */}
                    <div className="flex flex-col min-w-0">
                        <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[13px] font-semibold truncate drop-shadow`}>
                            {hostName}
                        </span>
                        <div className="flex items-center gap-1.5">
                            {isLive ? (
                                <>
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-red-400 text-[10px] font-bold uppercase tracking-wider">LIVE</span>
                                </>
                            ) : isRecording ? (
                                <>
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-red-400 text-[10px] font-bold uppercase tracking-wider">REC</span>
                                </>
                            ) : (
                                <span className={`${darkMode ? "text-white/50" : "text-slate-500"} text-[10px]`}>Rehearsal</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Center: Phase selector (always visible) */}
                {onModeChange && (
                    <div className="absolute top-[65px] left-1/2 -translate-x-1/2 w-[85%] max-w-[300px]">
                        <div className={`
                            backdrop-blur-xl border rounded-full h-9 flex p-0.5
                            ${darkMode
                                ? "bg-black/50 border-white/10"
                                : "bg-white/70 border-slate-200"
                            }
                        `}>
                            {(["rehearsal", "record", "live"] as Mode[]).map((phase) => {
                                const isActive = mode === phase;
                                const isLivePhase = phase === "live";
                                const isRecordPhase = phase === "record";

                                return (
                                    <button
                                        key={phase}
                                        onClick={() => onModeChange(phase)}
                                        className={`
                                            flex-1 rounded-full text-[11px] font-bold transition-all duration-200
                                            flex items-center justify-center capitalize gap-1
                                            ${isActive
                                                ? isLivePhase
                                                    ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                                                    : isRecordPhase
                                                        ? "bg-red-500/80 text-white shadow-lg shadow-red-500/20"
                                                        : "bg-blue-500/80 text-white shadow-lg shadow-blue-500/20"
                                                : darkMode
                                                    ? "text-white/50 active:text-white/80"
                                                    : "text-slate-500 active:text-slate-700"
                                            }
                                        `}
                                    >
                                        {isLivePhase && isActive && (
                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                        )}
                                        {phase}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Right: Stats + close */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Theme toggle */}
                    {onToggleDarkMode && (
                        <button
                            onClick={onToggleDarkMode}
                            className={`h-8 w-8 ${darkMode ? "bg-black/30 text-white/80" : "bg-white/50 text-slate-700"} backdrop-blur-md rounded-full flex items-center justify-center transition-colors`}
                        >
                            <span className="material-icons text-[16px]">
                                {darkMode ? "light_mode" : "dark_mode"}
                            </span>
                        </button>
                    )}

                    {/* Viewers */}
                    {isLive && (
                        <div className={`flex items-center gap-1 ${darkMode ? "bg-black/30" : "bg-white/50"} backdrop-blur-md rounded-full px-2.5 py-1`}>
                            <span className={`material-icons ${darkMode ? "text-white/80" : "text-slate-600"} text-[14px]`}>visibility</span>
                            <span className={`${darkMode ? "text-white" : "text-slate-800"} text-[12px] font-semibold tabular-nums`}>
                                {viewerCount.toLocaleString()}
                            </span>
                        </div>
                    )}

                    {/* Live timer */}
                    {isLive && (
                        <div className="bg-red-500/90 backdrop-blur-md rounded-full px-2 py-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            <span className="text-white text-[10px] font-mono font-medium tracking-wide">
                                {liveTimerLabel}
                            </span>
                        </div>
                    )}

                    {/* Close / End */}
                    <button
                        onClick={onEndLive}
                        className={`h-8 w-8 ${darkMode ? "bg-black/30 text-white/80" : "bg-white/50 text-slate-700"} backdrop-blur-md rounded-full flex items-center justify-center transition-colors`}
                    >
                        <span className="material-icons text-[18px]">
                            {isLive ? "stop" : "close"}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
});

export default MobileTopNav;
