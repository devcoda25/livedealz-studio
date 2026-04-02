/**
 * Mobile Bottom Nav - TikTok-style control bar
 * 
 * Layout: [Mic] [Cam] [GO LIVE] [Effects] [More]
 * - GO LIVE is the large center button
 * - All buttons have haptic-style visual feedback
 */

import React, { memo } from "react";
import { Mode } from "./types";

interface MobileBottomNavProps {
    micOn: boolean;
    camOn: boolean;
    mode: Mode;
    isSessionActive: boolean;
    flashActive: boolean;
    chatMessageCount?: number;
    onToggleMic: () => void;
    onToggleCam: () => void;
    onToggleLive: () => void;
    onOpenFilters: () => void;
    onOpenSlideMenu: () => void;
    onOpenFlashConfig: () => void;
    onStopFlash: () => void;
    onOpenChat: () => void;
}

export const MobileBottomNav = memo(function MobileBottomNav({
    micOn,
    camOn,
    mode,
    isSessionActive,
    flashActive,
    chatMessageCount = 0,
    onToggleMic,
    onToggleCam,
    onToggleLive,
    onOpenFilters,
    onOpenSlideMenu,
    onOpenFlashConfig,
    onStopFlash,
    onOpenChat,
}: MobileBottomNavProps) {
    const isLive = mode === "live" && isSessionActive;
    const isRecording = mode === "record";
    const isRehearsing = mode === "rehearsal";

    return (
        <div className="relative z-50 pointer-events-auto">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent h-32 -top-16" />

            {/* Control bar */}
            <div className="relative flex items-center justify-center px-4 pb-safe pt-2 pb-3">
                <div className="flex items-center justify-between w-full max-w-[340px]">
                    {/* Mic */}
                    <ControlButton
                        icon={micOn ? "mic" : "mic_off"}
                        active={micOn}
                        onClick={onToggleMic}
                        size="small"
                    />

                    {/* Camera */}
                    <ControlButton
                        icon={camOn ? "videocam" : "videocam_off"}
                        active={camOn}
                        onClick={onToggleCam}
                        size="small"
                    />

                    {/* GO LIVE - Large center button */}
                    <button
                        onClick={onToggleLive}
                        className={`
                            relative flex items-center justify-center
                            w-[72px] h-[72px] rounded-full
                            transition-all duration-200 active:scale-95
                            shadow-lg
                            ${isLive
                                ? "bg-white shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                : isRecording
                                    ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                                    : "bg-[#FF5C00] shadow-[0_0_20px_rgba(255,92,0,0.4)]"
                            }
                        `}
                    >
                        {/* Ring */}
                        <div className={`
                            absolute inset-[-3px] rounded-full border-[3px]
                            ${isLive
                                ? "border-white/60"
                                : isRecording
                                    ? "border-red-300/60"
                                    : "border-[#FF5C00]/60"
                            }
                        `} />

                        {/* Icon */}
                        <span className={`
                            material-icons text-[28px]
                            ${isLive ? "text-red-500" : "text-white"}
                        `}>
                            {isLive ? "stop_circle" : isRecording ? "radio_button_checked" : "play_arrow"}
                        </span>

                        {/* Pulse animation when live */}
                        {isLive && (
                            <span className="absolute inset-0 rounded-full animate-ping bg-red-500/20" />
                        )}
                    </button>

                    {/* Effects / Filters */}
                    <ControlButton
                        icon="auto_awesome"
                        active={false}
                        onClick={onOpenFilters}
                        size="small"
                        label="FX"
                    />

                    {/* More / Menu */}
                    <ControlButton
                        icon="more_horiz"
                        active={false}
                        onClick={onOpenSlideMenu}
                        size="small"
                    />
                </div>
            </div>

            {/* Floating action buttons - right side */}
            <div className="absolute right-3 bottom-20 flex flex-col gap-3 pointer-events-auto">
                {/* Chat button */}
                <FloatingButton
                    icon="chat_bubble"
                    badge={chatMessageCount > 0 ? chatMessageCount : undefined}
                    onClick={onOpenChat}
                />

                {/* Commerce / Flash */}
                <FloatingButton
                    icon={flashActive ? "bolt" : "shopping_bag"}
                    active={flashActive}
                    onClick={flashActive ? onStopFlash : onOpenFlashConfig}
                    pulse={flashActive}
                />

                {/* Reactions */}
                <FloatingButton
                    icon="favorite"
                    onClick={() => {}}
                />
            </div>
        </div>
    );
});

// Small control button
function ControlButton({
    icon,
    active,
    onClick,
    size = "small",
    label,
}: {
    icon: string;
    active: boolean;
    onClick: () => void;
    size?: "small" | "large";
    label?: string;
}) {
    const sizeClasses = size === "large"
        ? "w-14 h-14"
        : "w-12 h-12";

    return (
        <button
            onClick={onClick}
            className={`
                flex flex-col items-center justify-center ${sizeClasses}
                rounded-full transition-all duration-150 active:scale-90
                backdrop-blur-md
                ${active
                    ? "bg-white/20 text-white"
                    : "bg-black/30 text-white/60"
                }
            `}
        >
            <span className={`material-icons ${size === "large" ? "text-[26px]" : "text-[22px]"}`}>
                {icon}
            </span>
            {label && (
                <span className="text-[8px] mt-0.5 font-semibold opacity-80">{label}</span>
            )}
        </button>
    );
}

// Floating action button (right side)
function FloatingButton({
    icon,
    active = false,
    onClick,
    badge,
    pulse = false,
}: {
    icon: string;
    active?: boolean;
    onClick: () => void;
    badge?: number;
    pulse?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`
                relative flex items-center justify-center
                w-11 h-11 rounded-full
                backdrop-blur-md transition-all duration-150 active:scale-90
                ${active
                    ? "bg-amber-500/80 text-white"
                    : "bg-white/15 text-white"
                }
                ${pulse ? "animate-pulse" : ""}
            `}
        >
            <span className="material-icons text-[20px]">{icon}</span>

            {/* Badge */}
            {badge !== undefined && badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {badge > 99 ? "99+" : badge}
                </span>
            )}
        </button>
    );
}

export default MobileBottomNav;
