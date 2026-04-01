import React from "react";
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
    onToggleCamera?: () => void;
}

export function MobileTopNav({
    hostName,
    hostAvatarUrl,
    viewerCount,
    mode,
    liveTimerLabel,
    onEndLive,
    onModeChange,
    onToggleCamera
}: MobileTopNavProps) {
    return (
        <div className="absolute top-0 left-0 right-0 z-50 pt-safe bg-gradient-to-b from-black/60 to-transparent pb-6 pointer-events-auto flex justify-between items-start px-4 pt-4">
            {/* Left: Host Pill */}
            <div className="flex bg-black/40 backdrop-blur-md p-1 pr-3 rounded-full items-center gap-2 max-w-[55%]">
                {/* Avatar */}
                <div className="relative h-8 w-8 shrink-0">
                    {hostAvatarUrl ? (
                        <Image src={hostAvatarUrl} alt={hostName} fill className="rounded-full object-cover" />
                    ) : (
                        <div className="h-full w-full rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                            {hostName.substring(0, 2)}
                        </div>
                    )}
                </div>

                {/* Info Text */}
                <div className="flex flex-col min-w-0">
                    <span className="text-white text-[13px] font-semibold leading-tight truncate">
                        {hostName}
                    </span>
                    <span className="text-white/80 text-[10px] whitespace-nowrap hidden sm:block">
                        {mode === "live" ? "Live Studio" : "Pre-Live"}
                    </span>
                </div>
            </div>

            {/* Center: Phase Segmented Control (Lobby | Rehearsal | Record) */}
            <div className="absolute top-[70px] left-1/2 -translate-x-1/2 w-[90%] max-w-[320px]">
                <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-full h-8 flex p-0.5 shadow-2xl">
                    {[
                        { id: "rehearsal", label: "Rehearsal", color: "bg-blue-500/80" },
                        { id: "record", label: "Record", color: "bg-red-500/80" },
                    ].map((phase) => (
                        <button
                            key={phase.id}
                            onClick={() => onModeChange?.(phase.id as Mode)}
                            className={`flex-1 rounded-full text-[11px] font-bold transition-all duration-300 flex items-center justify-center ${
                                mode === phase.id 
                                    ? `${phase.color} text-white shadow-lg scale-[1.02]` 
                                    : "text-white/40 hover:text-white/60"
                            }`}
                        >
                            {phase.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right: Actions and Stats */}
            <div className="flex flex-col items-end gap-2 shrink-0">
                {/* Viewers & Time row */}
                <div className="flex gap-2 items-center">
                    {/* Viewers Pill */}
                    <div className="bg-black/40 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1.5">
                        <span className="material-icons text-white text-[12px]">visibility</span>
                        <span className="text-white text-[12px] font-semibold">{viewerCount.toLocaleString()}</span>
                    </div>

                    {/* End Live / Close Button */}
                    <button 
                        onClick={onEndLive}
                        className="h-8 w-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-red-500/80 transition-colors"
                    >
                        <span className="material-icons text-lg">close</span>
                    </button>
                </div>

                {/* Live Timer Pill (Only if Live) */}
                {mode === "live" && (
                    <div className="bg-red-500/90 backdrop-blur-md rounded-full px-2 py-0.5 flex items-center gap-1 shadow-lg border border-red-400/20">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        <span className="text-white text-[10px] font-mono font-medium tracking-wide">{liveTimerLabel}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
