/**
 * Mobile Bottom Nav - Native control bar
 * 
 * Layout: [Sources] [Scenes] [▶ PLAY] [Settings] [Campaigns]
 * - PLAY is the large center button
 */

import React, { memo } from "react";
import { Mode } from "../shared/types";

interface MobileBottomNavProps {
    mode: Mode;
    isSessionActive: boolean;
    darkMode?: boolean;
    onToggleLive: () => void;
    onOpenSources: () => void;
    onOpenScenes: () => void;
    onOpenSettings: () => void;
    onOpenCampaigns: () => void;
}

export const MobileBottomNav = memo(function MobileBottomNav({
    mode,
    isSessionActive,
    darkMode = true,
    onToggleLive,
    onOpenSources,
    onOpenScenes,
    onOpenSettings,
    onOpenCampaigns,
}: MobileBottomNavProps) {
    const isLiveActive = mode === "live" && isSessionActive;
    const isRecordActive = mode === "record" && isSessionActive;
    const isRehearsalActive = mode === "rehearsal" && isSessionActive;
    const isActive = isSessionActive;

    // Determine button style based on mode and active state
    const getButtonStyle = () => {
        if (isActive) {
            // Session is running - show stop style
            switch (mode) {
                case "live":
                    return "bg-white shadow-[0_0_20px_rgba(255,255,255,0.3)]";
                case "record":
                    return "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]";
                default:
                    return "bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]";
            }
        }
        // Session not running - show play style based on mode
        switch (mode) {
            case "live":
                return "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]";
            case "record":
                return "bg-red-400 shadow-[0_0_20px_rgba(248,113,113,0.4)]";
            default:
                return "bg-[#FF5C00] shadow-[0_0_20px_rgba(255,92,0,0.4)]";
        }
    };

    const getRingStyle = () => {
        if (isActive) {
            switch (mode) {
                case "live": return "border-white/60";
                case "record": return "border-red-300/60";
                default: return "border-blue-300/60";
            }
        }
        switch (mode) {
            case "live": return "border-red-400/60";
            case "record": return "border-red-300/60";
            default: return "border-[#FF5C00]/60";
        }
    };

    const getIcon = () => {
        if (isActive) {
            return "stop";
        }
        switch (mode) {
            case "live": return "play_arrow";
            case "record": return "radio_button_checked";
            default: return "play_arrow";
        }
    };

    return (
        <div className="relative z-50 pointer-events-auto">
            {/* Gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-t ${darkMode ? "from-black/80 via-black/40" : "from-white/90 via-white/50"} to-transparent h-28 -top-12`} />

            {/* Control bar */}
            <div className="relative flex items-center justify-center px-6 pb-safe pt-2 pb-4">
                <div className="flex items-center justify-between w-full max-w-[320px]">
                    {/* Sources */}
                    <NavButton
                        icon="folder"
                        label="Sources"
                        onClick={onOpenSources}
                        darkMode={darkMode}
                    />

                    {/* Scenes */}
                    <NavButton
                        icon="view_carousel"
                        label="Scenes"
                        onClick={onOpenScenes}
                        darkMode={darkMode}
                    />

                    {/* PLAY - Large center button */}
                    <button
                        onClick={onToggleLive}
                        className={`
                            relative flex items-center justify-center
                            w-[68px] h-[68px] rounded-full
                            transition-all duration-200 active:scale-95
                            shadow-lg
                            ${getButtonStyle()}
                        `}
                    >
                        {/* Ring */}
                        <div className={`absolute inset-[-3px] rounded-full border-[3px] ${getRingStyle()}`} />

                        {/* Icon */}
                        <span className={`material-icons text-[28px] ${isActive ? "text-red-500" : "text-white"}`}>
                            {getIcon()}
                        </span>

                        {/* Pulse animation when active */}
                        {isActive && mode === "live" && (
                            <span className="absolute inset-0 rounded-full animate-ping bg-red-500/20" />
                        )}
                        {isActive && mode === "record" && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        )}
                    </button>

                    {/* Settings */}
                    <NavButton
                        icon="tune"
                        label="Settings"
                        onClick={onOpenSettings}
                        darkMode={darkMode}
                    />

                    {/* Campaigns */}
                    <NavButton
                        icon="campaign"
                        label="Campaigns"
                        onClick={onOpenCampaigns}
                        darkMode={darkMode}
                    />
                </div>
            </div>
        </div>
    );
});

// Nav button
function NavButton({
    icon,
    label,
    onClick,
    darkMode = true,
}: {
    icon: string;
    label: string;
    onClick: () => void;
    darkMode?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
        >
            <div className={`
                w-11 h-11 rounded-full flex items-center justify-center
                backdrop-blur-md transition-all duration-150
                ${darkMode
                    ? "bg-white/10 text-white/80 border border-white/10"
                    : "bg-slate-100/80 text-slate-600 border border-slate-200"
                }
            `}>
                <span className="material-icons text-[20px]">{icon}</span>
            </div>
            <span className={`text-[9px] font-medium ${darkMode ? "text-white/60" : "text-slate-500"}`}>{label}</span>
        </button>
    );
}

export default MobileBottomNav;
