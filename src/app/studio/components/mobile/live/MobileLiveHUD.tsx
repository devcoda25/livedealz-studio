import React from "react";
import { MobileTopNav } from "../shared/MobileTopNav";
import { MobileRightActions } from "../shared/MobileRightActions";
import { MobileChatOverlay } from "./MobileChatOverlay";
import { SalesGoalBar } from "./SalesGoalBar";
import { MobileLiveNotification } from "./MobileLiveNotification";
import { CartNotification } from "./CartNotification";
import { FloatingReactions } from "../../shared/FloatingReactions";
import { Mode } from "../../shared/types";

interface MobileLiveHUDProps {
    hostName: string;
    viewerCount: number;
    liveTimerLabel: string;
    onEndLive: () => void;
    onModeChange: (mode: Mode) => void;
    
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
    liveTimerLabel,
    onEndLive,
    onModeChange,
    cameraFacing,
    onFlipCamera,
    micOn,
    onToggleMic,
    stream,
    onOpenSettings,
    onOpenCommerce,
    onSendReaction,
    productCount,
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
    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col">
            {/* Top Navigation */}
            <MobileTopNav
                hostName={hostName}
                viewerCount={viewerCount}
                mode="live"
                liveTimerLabel={liveTimerLabel}
                onEndLive={onEndLive}
                onModeChange={onModeChange}
                darkMode={darkMode}
            />

            {/* Sales Goal Bar */}
            <div className="px-4 mt-2">
                <SalesGoalBar 
                    currentSales={salesCount * 15} // Simplified simulation: $15 avg order
                    goalAmount={salesGoal} 
                    salesCount={salesCount}
                    darkMode={darkMode} 
                />
            </div>

            {/* Main Center Area (Notifications) */}
            <div className="flex-1 relative">
                {currentNotification && (
                    <MobileLiveNotification 
                        event={currentNotification} 
                        onComplete={onNotificationComplete}
                    />
                )}
                
                {/* Cart Activity (Bottom Left) */}
                <div className="absolute bottom-4 left-4 pointer-events-auto">
                    <CartNotification events={cartEvents} />
                </div>
            </div>

            {/* Floating Reactions */}
            <FloatingReactions triggerHeartCount={triggerHeartCount} />

            {/* Right Side Actions */}
            <MobileRightActions
                cameraFacing={cameraFacing}
                onFlipCamera={onFlipCamera}
                micOn={micOn}
                onToggleMic={onToggleMic}
                stream={stream}
                onOpenSettings={onOpenSettings}
                onSendReaction={onSendReaction}
                productCount={productCount}
                onOpenProducts={onOpenCommerce}
            />

            {/* Live Chat Overlay */}
            <MobileChatOverlay 
                mode="live" 
                isOpen={isChatOpen} 
                onClose={() => onToggleChat(false)} 
            />

            {/* Chat Trigger (Bottom Left) */}
            {!isChatOpen && (
                <div className="absolute bottom-24 left-4 pointer-events-auto">
                    <button 
                        onClick={() => onToggleChat(true)}
                        className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white shadow-lg active:scale-95 transition-all"
                    >
                        <span className="material-icons text-[18px]">chat</span>
                        <span className="text-[12px] font-bold">Open Chat</span>
                    </button>
                </div>
            )}
        </div>
    );
}
