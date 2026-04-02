/**
 * MobileRightActions - Native floating action buttons (right side)
 * 
 * Stacked vertically on the right side of the camera preview.
 * Each button has icon + optional label below.
 */

import React, { memo } from "react";

interface MobileRightActionsProps {
    // Camera
    cameraFacing: "user" | "environment";
    onFlipCamera: () => void;
    // Mute
    micOn: boolean;
    onToggleMic: () => void;
    // Filters
    activeFilter: string;
    onOpenFilters: () => void;
    // Polls
    hasActivePoll?: boolean;
    onOpenPolls: () => void;
    // Giveaways
    hasActiveGiveaway?: boolean;
    onOpenGiveaways: () => void;
    // Co-hosts
    coHostCount: number;
    onOpenCoHosts: () => void;
    // Captions
    captionsOn: boolean;
    onToggleCaptions: () => void;
    // Multi-cam
    onOpenMultiCam: () => void;
    // Products
    productCount: number;
    onOpenProducts: () => void;
}

export const MobileRightActions = memo(function MobileRightActions({
    cameraFacing,
    onFlipCamera,
    micOn,
    onToggleMic,
    activeFilter,
    onOpenFilters,
    hasActivePoll = false,
    onOpenPolls,
    hasActiveGiveaway = false,
    onOpenGiveaways,
    coHostCount,
    onOpenCoHosts,
    captionsOn,
    onToggleCaptions,
    onOpenMultiCam,
    productCount,
    onOpenProducts,
}: MobileRightActionsProps) {
    return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-3 pointer-events-auto">
            {/* Camera Flip */}
            <ActionButton
                icon="cameraswitch"
                label="Flip"
                onClick={onFlipCamera}
            />

            {/* Mute */}
            <ActionButton
                icon={micOn ? "mic" : "mic_off"}
                label={micOn ? "Mute" : "Unmute"}
                onClick={onToggleMic}
                active={!micOn}
            />

            {/* Filters */}
            <ActionButton
                icon="auto_awesome"
                label="Filters"
                onClick={onOpenFilters}
                active={activeFilter !== "none"}
            />

            {/* Polls */}
            <ActionButton
                icon="poll"
                label="Polls"
                onClick={onOpenPolls}
                badge={hasActivePoll ? 1 : undefined}
            />

            {/* Giveaways */}
            <ActionButton
                icon="card_giftcard"
                label="Give"
                onClick={onOpenGiveaways}
                badge={hasActiveGiveaway ? 1 : undefined}
            />

            {/* Co-hosts */}
            <ActionButton
                icon="group"
                label="Co-host"
                onClick={onOpenCoHosts}
                badge={coHostCount > 0 ? coHostCount : undefined}
            />

            {/* Captions */}
            <ActionButton
                icon="closed_caption"
                label="CC"
                onClick={onToggleCaptions}
                active={captionsOn}
            />

            {/* Multi-cam */}
            <ActionButton
                icon="switch_video"
                label="Multi"
                onClick={onOpenMultiCam}
            />

            {/* Products */}
            <ActionButton
                icon="shopping_bag"
                label="Shop"
                onClick={onOpenProducts}
                badge={productCount > 0 ? productCount : undefined}
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
}: {
    icon: string;
    label: string;
    onClick: () => void;
    active?: boolean;
    badge?: number;
}) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
        >
            <div className={`
                relative w-10 h-10 rounded-full flex items-center justify-center
                backdrop-blur-md transition-all duration-150
                ${active
                    ? "bg-[#FF5C00]/90 text-white shadow-lg shadow-[#FF5C00]/30"
                    : "bg-black/40 text-white/90 border border-white/10"
                }
            `}>
                <span className="material-icons text-[18px]">{icon}</span>
                {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {badge > 9 ? "9+" : badge}
                    </span>
                )}
            </div>
            <span className="text-[9px] text-white/70 font-medium drop-shadow">{label}</span>
        </button>
    );
}

export default MobileRightActions;
