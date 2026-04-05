import React from "react";
import { MobileTopNav } from "../shared/MobileTopNav";
import { MobileRightActions } from "../shared/MobileRightActions";
import { Mode } from "../../shared/types";

interface MobileRehearsalHUDProps {
    hostName: string;
    mode: Mode;
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
    
    darkMode?: boolean;
}

export function MobileRehearsalHUD({
    hostName,
    mode,
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
    darkMode = true
}: MobileRehearsalHUDProps) {
    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col">
            {/* Top Navigation */}
            <MobileTopNav
                hostName={hostName}
                viewerCount={0}
                mode={mode}
                liveTimerLabel=""
                recordingTimerLabel=""
                onEndLive={onEndLive}
                onModeChange={onModeChange}
                darkMode={darkMode}
            />

            {/* Rehearsal Status Badge (Center Top) */}
            <div className={`absolute top-24 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg border backdrop-blur-md ${darkMode ? "bg-black/40 border-white/10 text-white/60" : "bg-white/60 border-black/5 text-black/60"}`}>
                <span className="material-icons text-[14px]">visibility_off</span>
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase">Private Stage</span>
            </div>

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

            {/* Helpful Hint */}
            <div className="absolute bottom-24 left-6 right-6 flex justify-center">
                <div className={`px-8 py-5 rounded-[32px] flex items-center gap-4 backdrop-blur-3xl shadow-2xl border transition-all animate-in slide-in-from-bottom duration-700 ${darkMode ? "bg-black/30 border-white/10" : "bg-white/80 border-slate-200 shadow-xl"}`}>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                        <span className="material-icons text-emerald-400 text-[22px]">info</span>
                    </div>
                    <div>
                        <p className={`text-[14px] font-black uppercase tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>Stealth Mode Active</p>
                        <p className={`text-[11px] font-bold uppercase tracking-widest leading-none mt-1 ${darkMode ? "text-white/40" : "text-slate-400"}`}>No viewers can access this session</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
