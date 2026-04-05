import React from "react";
import { MobileTopNav } from "../shared/MobileTopNav";
import { MobileRightActions } from "../shared/MobileRightActions";
import { MobileTeleprompterOverlay } from "./MobileTeleprompterOverlay";
import { Mode } from "../../shared/types";

interface MobileRecordHUDProps {
    hostName: string;
    mode: Mode;
    recordingTimerLabel: string;
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
    onOpenCampaigns: () => void;
    onSendReaction: () => void;
    productCount: number;
    
    // Record Specific
    activePrompterSession: any | null;
    isSessionActive: boolean;
    onClosePrompter: () => void;
    
    darkMode?: boolean;
}

export function MobileRecordHUD({
    hostName,
    mode,
    recordingTimerLabel,
    onEndLive,
    onModeChange,
    cameraFacing,
    onFlipCamera,
    micOn,
    onToggleMic,
    stream,
    onOpenSettings,
    onOpenCommerce,
    onOpenCampaigns,
    onSendReaction,
    productCount,
    activePrompterSession,
    isSessionActive,
    onClosePrompter,
    darkMode = true
}: MobileRecordHUDProps) {
    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col">
            {/* Top Navigation */}
            <MobileTopNav
                hostName={hostName}
                viewerCount={0}
                mode={mode}
                liveTimerLabel=""
                recordingTimerLabel={recordingTimerLabel}
                onEndLive={onEndLive}
                onModeChange={onModeChange}
                darkMode={darkMode}
            />

            {/* Recording Status Badge (Center Top) */}
            {isSessionActive && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 px-5 py-2 bg-rose-600/90 backdrop-blur-xl rounded-full flex items-center gap-2.5 shadow-2xl border border-rose-400/30 animate-pulse">
                    <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_white]" />
                    <span className="text-white text-[11px] font-black tracking-[0.2em] uppercase">On Air</span>
                </div>
            )}

            {/* Teleprompter Overlay */}
            {activePrompterSession && (
                <div className="pointer-events-auto">
                    <MobileTeleprompterOverlay
                        session={activePrompterSession}
                        isRecording={isSessionActive}
                        onClose={onClosePrompter}
                        darkMode={darkMode}
                    />
                </div>
            )}

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

            {/* Recording Controls (Bottom Center) - If we want specialized big record button later */}
        </div>
    );
}
