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
    
    // Right Actions
    cameraFacing: "user" | "environment";
    onFlipCamera: () => void;
    micOn: boolean;
    onToggleMic: () => void;
    stream: MediaStream | null;
    onOpenSettings: () => void;
    onOpenCommerce: () => void;
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
    onOpenSettings,
    onOpenCommerce,
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
                        <div className="h-9 w-9 rounded-full bg-white/15 border border-white/10 backdrop-blur-md flex items-center justify-center overflow-hidden">
                            <span className="material-icons text-white/80 text-[18px]">person</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-white text-[13px] font-black truncate max-w-[160px]">{hostName}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isLiveActive ? (
                            <div className="px-3 py-1.5 rounded-full bg-rose-600/90 border border-rose-400/25 backdrop-blur-md">
                                <span className="text-white text-[11px] font-black tracking-[0.2em] uppercase">Live</span>
                            </div>
                        ) : (
                            <div className="px-3 py-1.5 rounded-full bg-black/45 border border-white/10 backdrop-blur-md">
                                <span className="text-white text-[11px] font-black tracking-[0.2em] uppercase">Preview</span>
                            </div>
                        )}

                        {isLiveActive && (
                            <div className="px-3 py-1.5 rounded-full bg-black/45 border border-white/10 backdrop-blur-md flex items-center gap-1.5">
                                <span className="material-icons text-white/80 text-[16px]">visibility</span>
                                <span className="text-white text-[12px] font-black tabular-nums">{viewerCount.toLocaleString()}</span>
                            </div>
                        )}

                        <button
                            onClick={onOpenSettings}
                            className="h-10 w-10 rounded-full bg-black/45 border border-white/10 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform"
                            aria-label="Tools"
                            type="button"
                        >
                            <span className="material-icons text-white text-[20px]">more_horiz</span>
                        </button>

                        <button
                            onClick={onTogglePause}
                            disabled={!isLiveActive}
                            className="h-10 w-10 rounded-full bg-black/45 border border-white/10 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
                            aria-label={isPaused ? "Resume live" : "Pause live"}
                            type="button"
                        >
                            <span className="material-icons text-white text-[20px]">{isPaused ? "play_arrow" : "pause"}</span>
                        </button>

                        <button
                            onClick={onEndLive}
                            className="h-10 w-10 rounded-full bg-black/45 border border-white/10 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform"
                            aria-label="End live"
                            type="button"
                        >
                            <span className="material-icons text-white text-[20px]">close</span>
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
                        <div className="px-4 py-2 rounded-full bg-black/55 border border-white/10 backdrop-blur-md">
                            <span className="text-white text-[12px] font-black tracking-[0.2em] uppercase">Paused</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Reactions */}
            <FloatingReactions triggerHeartCount={triggerHeartCount} />

            {/* Bottom comment composer (Instagram Live style) */}
            <div className="pointer-events-auto absolute left-0 right-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
                <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-full bg-black/45 border border-white/10 backdrop-blur-md">
                        <span className="material-icons text-white/60 text-[18px]">chat_bubble_outline</span>
                        <input
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSend();
                            }}
                            placeholder="Comment"
                            className="flex-1 bg-transparent outline-none text-white text-[13px] placeholder:text-white/45"
                        />
                        <button
                            type="button"
                            onClick={handleSend}
                            className="h-8 w-8 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                            aria-label="Send comment"
                        >
                            <span className="material-icons text-white text-[20px]">send</span>
                        </button>
                    </div>

                    <button
                        onClick={onSendReaction}
                        className="h-12 w-12 rounded-full bg-black/45 border border-white/10 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform"
                        aria-label="Send reaction"
                        type="button"
                    >
                        <span className="material-icons text-white text-[22px]">favorite_border</span>
                    </button>

                    <button
                        onClick={onOpenCommerce}
                        className="h-12 w-12 rounded-full bg-black/45 border border-white/10 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform"
                        aria-label="Open products"
                        type="button"
                    >
                        <span className="material-icons text-white text-[22px]">shopping_bag</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
