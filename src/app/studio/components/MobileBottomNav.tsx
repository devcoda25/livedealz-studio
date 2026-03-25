import React from "react";
import { EV_ORANGE } from "./constants";

interface MobileBottomNavProps {
    micOn: boolean;
    camOn: boolean;
    isLive: boolean;
    flashActive: boolean;
    onToggleMic: () => void;
    onToggleCam: () => void;
    onToggleLive: () => void;
    onOpenFlashConfig: () => void;
    onStopFlash: () => void;
    onOpenSlideMenu: () => void;
}

export function MobileBottomNav({
    micOn,
    camOn,
    isLive,
    flashActive,
    onToggleMic,
    onToggleCam,
    onToggleLive,
    onOpenFlashConfig,
    onStopFlash,
    onOpenSlideMenu,
}: MobileBottomNavProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 px-2 pb-safe">
            <div className="flex items-center justify-between max-w-md mx-auto h-16">
                {/* Mic Button */}
                <button
                    onClick={onToggleMic}
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${
                        micOn
                            ? "bg-slate-800 text-white"
                            : "bg-slate-900 text-slate-400"
                    }`}
                >
                    <span className="material-icons text-2xl">{micOn ? "mic" : "mic_off"}</span>
                </button>

                {/* Camera Button */}
                <button
                    onClick={onToggleCam}
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${
                        camOn
                            ? "bg-slate-800 text-white"
                            : "bg-slate-900 text-slate-400"
                    }`}
                >
                    <span className="material-icons text-2xl">{camOn ? "videocam" : "videocam_off"}</span>
                </button>

                {/* Go Live Button - Center, Larger */}
                <button
                    onClick={onToggleLive}
                    className={`flex items-center justify-center w-16 h-16 rounded-full transition-all shadow-lg ${
                        isLive
                            ? "bg-red-600 hover:bg-red-700 text-white shadow-red-900/50"
                            : "text-white shadow-orange-900/50"
                    }`}
                    style={!isLive ? { backgroundColor: EV_ORANGE } : undefined}
                >
                    <span className="material-icons text-3xl">{isLive ? "stop" : "play_arrow"}</span>
                </button>

                {/* Flash Deal Button */}
                <button
                    onClick={flashActive ? onStopFlash : onOpenFlashConfig}
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${
                        flashActive
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/50 animate-pulse"
                            : "bg-slate-900 text-slate-400"
                    }`}
                >
                    <span className="material-icons text-2xl">bolt</span>
                </button>

                {/* More Menu Button */}
                <button
                    onClick={onOpenSlideMenu}
                    className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-slate-400 transition-all"
                >
                    <span className="material-icons text-2xl">menu</span>
                </button>
            </div>
        </div>
    );
}
