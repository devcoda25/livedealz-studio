import React from "react";
import { MobileLiveNotification } from "./MobileLiveNotification";
import { FloatingReactions } from "../../shared/FloatingReactions";
import type { Mode } from "../../shared/types";

interface MobileLiveHUDProps {
    hostName: string;
    viewerCount: number;
    liveTimerLabel: string;
    onEndLive: () => void;
    onModeChange: (mode: Mode) => void;
    onSendMessage?: (message: string) => void;
    isLiveActive: boolean;
    isPaused: boolean;
    onTogglePause: () => void;
    onOpenGuests: () => void;
    
    // Right Actions
    cameraFacing: "user" | "environment";
    onFlipCamera: () => void;
    micOn: boolean;
    onToggleMic: () => void;
    stream: MediaStream | null;
    onOpenSettings: () => void;
    onOpenCommerce: () => void;
    onOpenFilters: () => void;
    onOpenElements: () => void;
    onSendReaction: () => void;
    productCount: number;
    
    // Live Specific
    isChatOpen: boolean;
    onToggleChat: (open: boolean) => void;
    currentNotification: any | null;
    onNotificationComplete: () => void;
    triggerHeartCount: number;
    salesGoal: number;
    salesCount: number;
    cartEvents: any[];
    
    darkMode?: boolean;
}

export function MobileLiveHUD({
    hostName,
    viewerCount,
    liveTimerLabel: _liveTimerLabel,
    onEndLive,
    onModeChange: _onModeChange,
    onSendMessage,
    isLiveActive,
    isPaused,
    onTogglePause,
    onOpenGuests,
    onOpenSettings,
    onOpenCommerce,
    onOpenFilters,
    onOpenElements,
    onSendReaction,
    isChatOpen,
    onToggleChat,
    currentNotification,
    onNotificationComplete,
    triggerHeartCount,
    salesGoal,
    salesCount,
    cartEvents,
    darkMode = true
}: MobileLiveHUDProps) {
    const [comment, setComment] = React.useState("");

    const handleSend = () => {
        const message = comment.trim();
        if (!message) return;
        onSendMessage?.(message);
        setComment("");
    };

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col">
            {/* Top header (Instagram Live style) */}
            <div className="pointer-events-auto relative z-50 px-4 pt-[env(safe-area-inset-top,0px)]">
                <div className="flex items-center justify-between pt-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="material-icons text-white text-[22px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">person</span>
                        <div className="min-w-0">
                            <p className="text-white text-[13px] font-black truncate max-w-[160px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">{hostName}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isLiveActive ? (
                            <span className="text-white text-[11px] font-black tracking-[0.2em] uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">LIVE</span>
                        ) : (
                            <span className="text-white text-[11px] font-black tracking-[0.2em] uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">PREVIEW</span>
                        )}

                        {isLiveActive && (
                            <div className="flex items-center gap-1.5">
                                <span className="material-icons text-white text-[16px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">visibility</span>
                                <span className="text-white text-[12px] font-black tabular-nums drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">{viewerCount.toLocaleString()}</span>
                            </div>
                        )}

                        <button
                            onClick={onOpenGuests}
                            className="h-10 w-10 flex items-center justify-center active:scale-95 transition-transform"
                            aria-label="Guests"
                            type="button"
                        >
                            <span className="material-icons text-white text-[22px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">group_add</span>
                        </button>

                        <button
                            onClick={onOpenSettings}
                            className="h-10 w-10 flex items-center justify-center active:scale-95 transition-transform"
                            aria-label="More tools"
                            type="button"
                        >
                            <span className="material-icons text-white text-[22px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">more_horiz</span>
                        </button>

                        <button
                            onClick={onOpenElements}
                            className="h-10 w-10 flex items-center justify-center active:scale-95 transition-transform"
                            aria-label="Add element"
                            type="button"
                        >
                            <span className="material-icons text-white text-[22px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">add_box</span>
                        </button>

                        <button
                            onClick={onTogglePause}
                            disabled={!isLiveActive}
                            className="h-10 w-10 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
                            aria-label={isPaused ? "Resume live" : "Pause live"}
                            type="button"
                        >
                            <span className="material-icons text-white text-[22px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">{isPaused ? "play_arrow" : "pause"}</span>
                        </button>

                        <button
                            onClick={onEndLive}
                            className="h-10 w-10 flex items-center justify-center active:scale-95 transition-transform"
                            aria-label="End live"
                            type="button"
                        >
                            <span className="material-icons text-white text-[22px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">close</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Center Area (Notifications) */}
            <div className="flex-1 relative">
                {currentNotification && (
                    <MobileLiveNotification 
                        event={currentNotification} 
                        onComplete={onNotificationComplete}
                    />
                )}

                {isLiveActive && isPaused && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-white text-[12px] font-black tracking-[0.2em] uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">PAUSED</span>
                    </div>
                )}
            </div>

            {/* Floating Reactions */}
            <FloatingReactions triggerHeartCount={triggerHeartCount} className="right-24" />

            {/* Bottom comment composer (Instagram Live style) */}
            <div className="pointer-events-auto absolute left-0 right-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
                <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 px-2 py-2">
                        <span className="material-icons text-white text-[18px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">chat_bubble_outline</span>
                        <input
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSend();
                            }}
                            placeholder="Comment"
                            className="flex-1 bg-transparent outline-none text-white text-[13px] placeholder:text-white/60 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]"
                        />
                        <button
                            type="button"
                            onClick={handleSend}
                            className="h-8 w-8 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                            aria-label="Send comment"
                        >
                            <span className="material-icons text-white text-[20px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">send</span>
                        </button>
                    </div>

                    <button
                        onClick={onSendReaction}
                        className="h-12 w-12 flex items-center justify-center active:scale-95 transition-transform"
                        aria-label="Send reaction"
                        type="button"
                    >
                        <span className="material-icons text-white text-[24px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">favorite_border</span>
                    </button>

                    <button
                        onClick={onOpenCommerce}
                        className="h-12 w-12 flex items-center justify-center active:scale-95 transition-transform"
                        aria-label="Open products"
                        type="button"
                    >
                        <span className="material-icons text-white text-[24px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">shopping_bag</span>
                    </button>

                    <button
                        onClick={onOpenFilters}
                        className="h-12 w-12 flex items-center justify-center active:scale-95 transition-transform"
                        aria-label="Open filters"
                        type="button"
                    >
                        <span className="material-icons text-white text-[24px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">auto_awesome</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
