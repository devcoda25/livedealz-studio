import { Mode } from "./types";

interface MobileBottomNavProps {
    micOn: boolean;
    camOn: boolean;
    mode: Mode;
    flashActive: boolean;
    onToggleMic: () => void;
    onToggleCam: () => void;
    onToggleLive: () => void;
    isSessionActive: boolean;
    onOpenFlashConfig: () => void;
    onStopFlash: () => void;
    onOpenSlideMenu: () => void;
}

export function MobileBottomNav({
    micOn,
    camOn,
    mode,
    flashActive,
    onToggleMic,
    onToggleCam,
    onToggleLive,
    isSessionActive,
    onOpenFlashConfig,
    onStopFlash,
    onOpenSlideMenu,
}: MobileBottomNavProps) {
    const isLive = mode === "live";
    const isRecording = mode === "record";
    const isRehearsing = mode === "rehearsal";
    const isActive = isSessionActive;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 px-2 pb-safe">
            <div className="flex items-center justify-between max-w-md mx-auto h-16 pb-2">
                {/* Mic Button */}
                <button
                    onClick={onToggleMic}
                    className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all backdrop-blur-md ${
                        micOn
                            ? "bg-white/20 text-white"
                            : "bg-black/40 text-white/50"
                    }`}
                >
                    <span className="material-icons text-[22px]">{micOn ? "mic" : "mic_off"}</span>
                </button>

                {/* Camera Button */}
                <button
                    onClick={onToggleCam}
                    className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all backdrop-blur-md ${
                        camOn
                            ? "bg-white/20 text-white"
                            : "bg-black/40 text-white/50"
                    }`}
                >
                    <span className="material-icons text-[22px]">{camOn ? "videocam" : "videocam_off"}</span>
                </button>

                {/* Action Button - Center, Larger */}
                <button
                    onClick={onToggleLive}
                    className={`flex items-center justify-center w-16 h-16 rounded-full transition-all shadow-lg text-white ${
                        isActive
                            ? isRecording ? "bg-red-500 animate-pulse" : isRehearsing ? "bg-blue-500" : "bg-red-600"
                            : "bg-[#FF5C00]"
                    }`}
                >
                    <span className="material-icons text-3xl">{isSessionActive ? "stop" : "play_arrow"}</span>
                </button>

                {/* Commerce / Shopping Bag Button */}
                <button
                    onClick={flashActive ? onStopFlash : onOpenFlashConfig}
                    className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all shadow-lg backdrop-blur-md ${
                        flashActive
                            ? "bg-amber-500/90 text-white border-2 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse"
                            : "bg-black/40 text-amber-500"
                    }`}
                >
                    <span className="material-icons text-[22px]">local_mall</span>
                </button>

                {/* More Menu Button */}
                <button
                    onClick={onOpenSlideMenu}
                    className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-black/40 text-white/80 backdrop-blur-md transition-all"
                >
                    <span className="material-icons text-[22px]">more_horiz</span>
                </button>
            </div>
        </div>
    );
}
