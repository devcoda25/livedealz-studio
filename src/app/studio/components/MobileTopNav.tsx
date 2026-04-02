/**
 * Mobile Top Nav - TikTok-style floating header
 * 
 * Minimal, transparent, with:
 * - Host avatar + name (left)
 * - Viewer count + close button (right)
 * - Live timer pill (when live)
 * - Dark/Light mode toggle
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

    return (
        <div className="relative z-50 pointer-events-auto">
            {/* Gradient fade */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent h-32 pointer-events-none" />

            {/* Content */}
            <div className="relative flex items-center justify-between px-4 pt-safe pt-3 pb-2">
                {/* Left: Host info */}
                <div className="flex items-center gap-2 min-w-0">
                    {/* Avatar */}
                    <div className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                        {hostAvatarUrl ? (
                            <Image src={hostAvatarUrl} alt={hostName} fill className="object-cover" />
                        ) : (
                            <div className="h-full w-full bg-gradient-to-br from-[#FF5C00] to-orange-600 flex items-center justify-center text-sm font-bold text-white">
                                {hostName.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                        {/* Live indicator dot */}
                        {isLive && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-black animate-pulse" />
                        )}
                    </div>

                    {/* Name + status */}
                    <div className="flex flex-col min-w-0">
                        <span className="text-white text-[13px] font-semibold truncate drop-shadow">
                            {hostName}
                        </span>
                        <div className="flex items-center gap-1.5">
                            {isLive ? (
                                <>
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-red-400 text-[10px] font-bold uppercase tracking-wider">LIVE</span>
                                </>
                            ) : mode === "record" ? (
                                <>
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-red-400 text-[10px] font-bold uppercase tracking-wider">REC</span>
                                </>
                            ) : (
                                <span className="text-white/50 text-[10px]">Rehearsal</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Center: Phase selector (when not live) */}
                {!isLive && onModeChange && (
                    <div className="absolute top-[70px] left-1/2 -translate-x-1/2 w-[90%] max-w-[280px]">
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-full h-8 flex p-0.5">
                            {(["rehearsal", "record"] as Mode[]).map((phase) => (
                                <button
                                    key={phase}
                                    onClick={() => onModeChange(phase)}
                                    className={`
                                        flex-1 rounded-full text-[11px] font-bold transition-all duration-200
                                        flex items-center justify-center capitalize
                                        ${mode === phase
                                            ? phase === "record"
                                                ? "bg-red-500/80 text-white shadow-lg"
                                                : "bg-blue-500/80 text-white shadow-lg"
                                            : "text-white/40 active:text-white/60"
                                        }
                                    `}
                                >
                                    {phase}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Right: Stats + close */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Theme toggle */}
                    {onToggleDarkMode && (
                        <button
                            onClick={onToggleDarkMode}
                            className="h-8 w-8 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 active:text-white transition-colors"
                        >
                            <span className="material-icons text-[16px]">
                                {darkMode ? "light_mode" : "dark_mode"}
                            </span>
                        </button>
                    )}

                    {/* Viewers */}
                    <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md rounded-full px-2.5 py-1">
                        <span className="material-icons text-white/80 text-[14px]">visibility</span>
                        <span className="text-white text-[12px] font-semibold tabular-nums">
                            {viewerCount.toLocaleString()}
                        </span>
                    </div>

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
                        className="h-8 w-8 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 active:text-white active:bg-red-500/60 transition-colors"
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
