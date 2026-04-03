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
}: MobileRightActionsProps) {
    return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-4 pointer-events-auto">
            {/* --- Primary Capture Controls --- */}
            <div className="space-y-3">
                <ActionButton
                    icon="cameraswitch"
                    label="Flip"
                    onClick={onFlipCamera}
                />

                <div className="relative group">
                    <ActionButton
                        icon={micOn ? "mic" : "mic_off"}
                        label={micOn ? "Mute" : "Unmute"}
                        onClick={onToggleMic}
                        active={!micOn}
                    />
                    {micOn && (
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2">
                            <MobileAudioVisualizer stream={stream} isOn={micOn} />
                        </div>
                    )}
                </div>
            </div>

            <div className="w-8 h-[1px] bg-white/10" />

            {/* --- Engagement & Management --- */}
            <div className="space-y-3">
                {/* Hype / Reaction Trigger */}
                <ActionButton
                    icon="favorite"
                    label="Hype"
                    onClick={onSendReaction}
                    color="pink"
                />

                {/* The "Hub" - Settings & Tools */}
                <ActionButton
                    icon="settings"
                    label="Tools"
                    onClick={onOpenSettings}
                />
            </div>

            <div className="w-8 h-[1px] bg-white/10" />

            {/* --- Commerce --- */}
            <ActionButton
                icon="shopping_bag"
                label="Shop"
                onClick={onOpenProducts}
                badge={productCount > 0 ? productCount : undefined}
                color="orange"
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
    color = "white",
}: {
    icon: string;
    label: string;
    onClick: () => void;
    active?: boolean;
    badge?: number;
    color?: "white" | "orange" | "pink";
}) {
    const getBgColor = () => {
        if (active) {
            if (color === "pink") return "bg-pink-500/90 shadow-pink-500/30";
            if (color === "orange") return "bg-[#FF5C00]/90 shadow-[#FF5C00]/30";
            return "bg-white/90 text-black";
        }
        return "bg-black/40 text-white border border-white/10";
    };

    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-0.5 active:scale-95 transition-all"
        >
            <div className={`
                relative w-11 h-11 rounded-full flex items-center justify-center
                backdrop-blur-md transition-all duration-150 shadow-sm
                ${getBgColor()}
            `}>
                <span className="material-icons text-[20px]">{icon}</span>
                {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-black/20">
                        {badge > 9 ? "9+" : badge}
                    </span>
                )}
            </div>
            <span className="text-[10px] text-white font-medium drop-shadow-sm opacity-80">{label}</span>
        </button>
    );
}

export default MobileRightActions;
