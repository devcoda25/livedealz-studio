/**
 * MobileRightActions - Native floating action buttons (right side)
 * 
 * Stacked vertically on the right side of the camera preview.
 * Each button has icon + optional label below.
 */

import React, { memo } from "react";
import { MobileAudioVisualizer } from "./MobileAudioVisualizer";

interface MobileRightActionsProps {
    // Essential controls
    cameraFacing: "user" | "environment";
    onFlipCamera: () => void;
    micOn: boolean;
    onToggleMic: () => void;
    stream: MediaStream | null;
    // Settings & Tools
    onOpenSettings: () => void;
    // Engagement & Shop
    onSendReaction: () => void;
    productCount: number;
    onOpenProducts: () => void;
}

export const MobileRightActions = memo(function MobileRightActions({
    cameraFacing,
    onFlipCamera,
    micOn,
    onToggleMic,
    stream,
    onOpenSettings,
    onSendReaction,
    productCount,
    onOpenProducts,
    darkMode = true
}: MobileRightActionsProps & { darkMode?: boolean }) {
    return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-4 pointer-events-auto">
            {/* --- Primary Capture Controls --- */}
            <div className="space-y-3">
                <ActionButton
                    icon="cameraswitch"
                    label="Flip"
                    onClick={onFlipCamera}
                    darkMode={darkMode}
                />

                <div className="relative group">
                    <ActionButton
                        icon={micOn ? "mic" : "mic_off"}
                        label={micOn ? "Mute" : "Unmute"}
                        onClick={onToggleMic}
                        active={!micOn}
                        darkMode={darkMode}
                        activeColor={micOn ? "white" : "red"}
                    />
                    {micOn && (
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2">
                            <MobileAudioVisualizer stream={stream} isOn={micOn} />
                        </div>
                    )}
                </div>
            </div>

            <div className={`w-8 h-[1px] ${darkMode ? "bg-white/10" : "bg-slate-200"}`} />

            {/* --- Engagement & Management --- */}
            <div className="space-y-3">
                {/* Hype / Reaction Trigger */}
                <ActionButton
                    icon="favorite"
                    label="Hype"
                    onClick={onSendReaction}
                    activeColor="pink"
                    darkMode={darkMode}
                />

                {/* The "Hub" - Settings & Tools */}
                <ActionButton
                    icon="grid_view"
                    label="Tools"
                    onClick={onOpenSettings}
                    darkMode={darkMode}
                />
            </div>

            <div className={`w-8 h-[1px] ${darkMode ? "bg-white/10" : "bg-slate-200"}`} />

            {/* --- Commerce --- */}
            <ActionButton
                icon="shopping_bag"
                label="Shop"
                onClick={onOpenProducts}
                badge={productCount > 0 ? productCount : undefined}
                activeColor="orange"
                darkMode={darkMode}
                glow={productCount > 0}
            />
        </div>
    );
});

// Individual action button
function ActionButton({
    icon,
    label,
    onClick,
    active = false,
    badge,
    activeColor = "white",
    darkMode = true,
    glow = false,
}: {
    icon: string;
    label: string;
    onClick: () => void;
    active?: boolean;
    badge?: number;
    activeColor?: "white" | "orange" | "pink" | "red";
    darkMode?: boolean;
    glow?: boolean;
}) {
    const getBgColor = () => {
        if (active || activeColor === "orange" || activeColor === "pink" || activeColor === "red") {
            if (activeColor === "pink") return "bg-pink-600 shadow-[0_5px_15px_rgba(219,39,119,0.4)] text-white border-pink-400/50";
            if (activeColor === "orange") return "bg-[#f77f00] shadow-[0_5px_15px_rgba(247,127,0,0.4)] text-white border-[#f77f00]/50";
            if (activeColor === "red") return "bg-rose-600 shadow-[0_5px_15px_rgba(225,29,72,0.4)] text-white border-rose-400/50";
            return `${darkMode ? "bg-white text-black border-white" : "bg-slate-900 text-white border-slate-900"}`;
        }
        return "bg-transparent border-transparent";
    };

    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-1.5 active:scale-95 transition-all group"
        >
            <div className={`
                relative w-14 h-14 rounded-[20px] flex items-center justify-center
                backdrop-blur-2xl transition-all duration-300 border
                ${getBgColor()}
                ${glow && activeColor === "orange" ? "animate-pulse" : ""}
            `}>
                <span className="material-icons text-[24px] drop-shadow-md">{icon}</span>
                
                {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-[#121212] shadow-xl animate-in zoom-in">
                        {badge > 9 ? "9+" : badge}
                    </span>
                )}
            </div>
            <span className={`text-[10px] font-black ${darkMode ? "text-white/60 drop-shadow-sm uppercase tracking-tighter" : "text-slate-500 uppercase tracking-tighter"}`}>
                {label}
            </span>
        </button>
    );
}

export default MobileRightActions;
