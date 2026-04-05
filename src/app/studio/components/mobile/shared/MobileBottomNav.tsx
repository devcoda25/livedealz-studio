/**
 * Mobile Bottom Nav - Native control bar
 * 
 * Layout: [Sources] [Scenes] [▶ PLAY] [Settings] [Campaigns]
 * - PLAY is the large center button
 */

import React, { memo } from "react";
import { Mode } from "../../shared/types";

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
    const isActive = isSessionActive;

    // Determine button style based on mode and active state
    const getButtonStyle = () => {
        if (isActive) {
            // Session is running - show stop style
            switch (mode) {
                case "live":
                    return "bg-white shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all";
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
                return "bg-[#f77f00] shadow-[0_0_25px_rgba(247,127,0,0.4)] hover:shadow-[0_0_35px_rgba(247,127,0,0.6)]";
        }
    };

    const getRingStyle = () => {
        if (isActive) {
            switch (mode) {
                case "live": return "border-white/60 ring-white/20";
                case "record": return "border-red-300/60 ring-red-500/20";
                default: return "border-blue-300/60 ring-blue-500/20";
            }
        }
        switch (mode) {
            case "live": return "border-red-400/60 ring-red-500/10";
            case "record": return "border-red-200/60 ring-red-400/10";
            default: return "border-[#f77f00]/60 ring-[#f77f00]/20";
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
            <div className={`absolute inset-0 bg-gradient-to-t ${darkMode ? "from-black/90 via-black/40" : "from-white/95 via-white/40"} to-transparent h-32 -top-12 pointer-events-none`} />

            {/* Control bar */}
            <div className="relative flex items-center justify-center px-6 pt-2 pb-[env(safe-area-inset-bottom,0px)]">
                <div className="flex items-center justify-between w-full max-w-[340px]">
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
                    <div className="relative group">
                        {/* Outer Glow */}
                        <div className={`
                            absolute inset-[-8px] rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500
                            ${isActive ? "bg-white/20" : "bg-[#f77f00]/20"}
                        `} />
                        
                        <button
                            onClick={onToggleLive}
                            className={`
                                relative flex items-center justify-center
                                w-[72px] h-[72px] rounded-full
                                transition-all duration-300 active:scale-90 hover:scale-105
                                shadow-lg
                                ${getButtonStyle()}
                            `}
                        >
                            {/* Inner Ring */}
                            <div className={`absolute inset-[-4px] rounded-full border-[2px] transition-all duration-300 ${getRingStyle()}`} />

                            {/* Icon */}
                            <span className={`material-icons text-[32px] ${isActive ? "text-red-500" : "text-white"} drop-shadow-sm`}>
                                {getIcon()}
                            </span>

                            {/* Pulse animation when active */}
                            {isActive && mode === "live" && (
                                <span className="absolute inset-0 rounded-full animate-ping bg-red-500/20" />
                            )}
                            {isActive && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse shadow-lg" />
                            )}
                        </button>
                    </div>

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
            className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform group outline-none"
        >
            <div className={`
                w-12 h-12 flex items-center justify-center
                transition-all duration-300
                ${darkMode
                    ? "text-white/40 group-hover:text-white"
                    : "text-slate-400 group-hover:text-slate-900"
                }
            `}>
                <span className="material-icons text-[26px]">{icon}</span>
            </div>
            <span className={`text-[9px] font-black tracking-[0.15em] transition-all uppercase ${darkMode ? "text-white/30 group-hover:text-white/60" : "text-slate-400 group-hover:text-slate-600"}`}>
                {label}
            </span>
        </button>
    );
}

export default MobileBottomNav;
