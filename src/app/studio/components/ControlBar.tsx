import React from "react";
import { Mode, PreviewMode } from "./types";

export function ControlBar(props: {
    darkMode?: boolean;
    mode: Mode;
    onToggleLive: () => void;
    micOn: boolean;
    onToggleMic: () => void;
    camOn: boolean;
    onToggleCam: () => void;
    screenShareOn: boolean;
    onToggleScreenShare: () => void;
    previewMode: PreviewMode;
    onCyclePreviewMode: () => void;
    cameraHint: string;
    flashActive: boolean;
    onOpenFlashConfig: () => void;
    onStopFlash: () => void;
    onOpenLanguage: () => void;
    onToggleFilters: () => void;
    onToggleCommerceHud: () => void;
    commerceHudOpen: boolean;
    onToggleCoHosts: () => void;
    coHostsOpen: boolean;
    onToggleAttachments: () => void;
    attachmentsOpen: boolean;
    transcriptionOn: boolean;
    onToggleTranscription: () => void;
    showProduction: boolean;
    onToggleProduction: () => void;
    onToggleSceneManager: () => void;
    onToggleAudioMixer: () => void;
    audioMixerOpen: boolean;
    showBuyers: boolean;
    onToggleBuyers: () => void;
    showSources: boolean;
    onToggleSources: () => void;
}) {
    const {
        darkMode,
        mode,
        onToggleLive,
        micOn,
        onToggleMic,
        camOn,
        onToggleCam,
        screenShareOn,
        onToggleScreenShare,
        onCyclePreviewMode,
        flashActive,
        onOpenFlashConfig,
        onStopFlash,
        onToggleFilters,
        onToggleCommerceHud,
        commerceHudOpen,
        onToggleCoHosts,
        coHostsOpen,
        transcriptionOn,
        onToggleTranscription,
        showProduction,
        onToggleProduction,
        onToggleSceneManager,
        onToggleAudioMixer,
        audioMixerOpen,
        showBuyers,
        onToggleBuyers,
        showSources,
        onToggleSources,
    } = props;

    const isLive = mode === "live";

    return (
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-t border-border bg-background/95">
            {/* Left Group - Audio/Video Controls */}
            <div className="flex items-center gap-1.5">
                {/* Mic Button */}
                <button
                    className={`h-10 px-3.5 rounded-full border text-[11px] font-medium flex items-center gap-2 transition-all ${micOn
                        ? "bg-secondary border-border text-foreground hover:bg-accent"
                        : "bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20"
                        }`}
                    onClick={onToggleMic}
                    title={micOn ? "Mute Microphone" : "Unmute Microphone"}
                >
                    <span className="material-icons text-[18px]">{micOn ? "mic" : "mic_off"}</span>
                    <span className="hidden md:inline">{micOn ? "Mic" : "Muted"}</span>
                </button>

                {/* Camera Button */}
                <button
                    className={`h-10 px-3.5 rounded-full border text-[11px] font-medium flex items-center gap-2 transition-all ${camOn
                        ? "bg-secondary border-border text-foreground hover:bg-accent"
                        : "bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20"
                        }`}
                    onClick={onToggleCam}
                    title={camOn ? "Turn Off Camera" : "Turn On Camera"}
                >
                    <span className="material-icons text-[18px]">{camOn ? "videocam" : "videocam_off"}</span>
                    <span className="hidden md:inline">{camOn ? "Camera" : "No Cam"}</span>
                </button>

                {/* Sources Button */}
                <button
                    className={`h-10 px-3.5 rounded-full border text-[11px] font-medium flex items-center gap-2 transition-all ${showSources
                        ? darkMode ? "bg-emerald-600 border-emerald-500 text-white" : "bg-emerald-500 border-emerald-400 text-white"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        }`}
                    onClick={onToggleSources}
                    title="Sources"
                >
                    <span className="material-icons text-[18px]">add_circle</span>
                    <span className="hidden md:inline">Sources</span>
                </button>

                {/* Divider */}
                <div className={`w-px h-6 mx-1 ${darkMode ? "bg-slate-700" : "bg-slate-300"}`} />

                {/* Buyers */}
                <button
                    className={`h-10 px-3.5 rounded-full border text-[11px] font-medium flex items-center gap-2 transition-all ${showBuyers
                        ? darkMode ? "bg-sky-600 border-sky-500 text-white" : "bg-sky-500 border-sky-400 text-white"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        }`}
                    onClick={onToggleBuyers}
                    title="Buyers"
                >
                    <span className="material-icons text-[18px]">groups</span>
                    <span className="hidden md:inline">Buyers</span>
                </button>

                {/* Audio Mixer */}
                <button
                    className={`h-10 px-3.5 rounded-full border text-[11px] font-medium flex items-center gap-2 transition-all ${audioMixerOpen
                        ? darkMode ? "bg-cyan-600 border-cyan-500 text-white" : "bg-cyan-500 border-cyan-400 text-white"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        }`}
                    onClick={onToggleAudioMixer}
                    title="Audio Mixer"
                >
                    <span className="material-icons text-[18px]">graphic_eq</span>
                    <span className="hidden md:inline">Mixer</span>
                </button>

                {/* Multi-Cam */}
                <button
                    className={`h-10 px-3.5 rounded-full border text-[11px] font-medium flex items-center gap-2 transition-all ${showProduction
                        ? darkMode ? "bg-purple-600 border-purple-500 text-white" : "bg-purple-500 border-purple-400 text-white"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        }`}
                    onClick={onToggleProduction}
                    title="Multi-Camera"
                >
                    <span className="material-icons text-[18px]">cameraswitch</span>
                    <span className="hidden md:inline">Multi-Cam</span>
                </button>
            </div>

            {/* Center - Go Live Button */}
            <div className="flex items-center justify-center">
                <button
                    className={`h-11 w-11 rounded-full text-[12px] font-bold tracking-wide shadow-lg transition-all flex items-center justify-center mx-4 ${isLive
                        ? darkMode ? "bg-red-600 hover:bg-red-700 text-white shadow-red-900/30" : "bg-red-500 hover:bg-red-600 text-white shadow-red-900/20"
                        : darkMode ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-900/30" : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-900/20"
                        }`}
                    onClick={onToggleLive}
                    title={isLive ? "End Live Stream" : "Go Live"}
                >
                    <span className="material-icons text-[20px]">{isLive ? "stop_circle" : "videocam"}</span>
                </button>
            </div>

            {/* Right Group - Production & Tools */}
            <div className="flex items-center gap-1.5">
                {/* Scenes */}
                <button
                    className={`h-10 px-3.5 rounded-full border text-[11px] font-medium flex items-center gap-2 transition-all ${darkMode ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20" : "border-indigo-400/40 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
                    onClick={onToggleSceneManager}
                    title="Scene Manager"
                >
                    <span className="material-icons text-[18px]">theaters</span>
                    <span className="hidden md:inline">Scenes</span>
                </button>

                {/* Filters */}
                <button
                    className="h-10 px-3.5 rounded-full border border-border bg-secondary text-[11px] font-medium text-foreground hover:bg-accent flex items-center gap-2 transition-all"
                    onClick={onToggleFilters}
                    title="Filters"
                >
                    <span className="material-icons text-[18px]">auto_awesome</span>
                    <span className="hidden md:inline">Filters</span>
                </button>

                {/* Captions */}
                <button
                    className={`h-10 px-3.5 rounded-full border text-[11px] font-medium flex items-center gap-2 transition-all ${transcriptionOn
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary border-border text-foreground hover:bg-accent"
                        }`}
                    onClick={onToggleTranscription}
                    title={transcriptionOn ? "Turn Off Captions" : "Turn On Captions"}
                >
                    <span className="material-icons text-[18px]">closed_caption</span>
                    <span className="hidden md:inline">Captions</span>
                </button>

                {/* Divider */}
                <div className={`w-px h-6 mx-1 ${darkMode ? "bg-slate-700" : "bg-slate-300"}`} />

                {/* Commerce/Feeds */}
                <button
                    className={`h-10 px-3.5 rounded-full border text-[11px] font-medium flex items-center gap-2 transition-all ${commerceHudOpen
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary border-border text-foreground hover:bg-accent"
                        }`}
                    onClick={onToggleCommerceHud}
                    title="Product Feeds"
                >
                    <span className="material-icons text-[18px]">shopping_bag</span>
                    <span className="hidden md:inline">Feeds</span>
                </button>

                {/* Co-hosts */}
                <button
                    className={`h-10 px-3.5 rounded-full border text-[11px] font-medium flex items-center gap-2 transition-all ${coHostsOpen
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "bg-secondary border-border text-foreground hover:bg-accent"
                        }`}
                    onClick={onToggleCoHosts}
                    title="Co-hosts"
                >
                    <span className="material-icons text-[18px]">group</span>
                    <span className="hidden md:inline">Co-hosts</span>
                </button>

                {/* Flash Deal */}
                {flashActive ? (
                    <button
                        className="h-10 px-3.5 rounded-full border border-rose-500/50 bg-rose-500/20 text-[11px] font-medium text-rose-300 hover:bg-rose-500/30 flex items-center gap-2 transition-all animate-pulse"
                        onClick={onStopFlash}
                        title="Stop Flash Deal"
                    >
                        <span className="material-icons text-[18px]">bolt</span>
                        <span className="hidden md:inline">Stop Deal</span>
                    </button>
                ) : (
                    <button
                        className="h-10 px-3.5 rounded-full border border-orange-500/50 bg-orange-500/10 text-[11px] font-medium text-orange-300 hover:bg-orange-500/20 flex items-center gap-2 transition-all"
                        onClick={onOpenFlashConfig}
                        title="Start Flash Deal"
                    >
                        <span className="material-icons text-[18px]">bolt</span>
                        <span className="hidden md:inline">Start Deal</span>
                    </button>
                )}
            </div>
        </div>
    );
}
