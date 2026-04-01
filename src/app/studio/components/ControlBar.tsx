import React from "react";
import { Mode, PreviewMode, Campaign, CampaignSession } from "./types";

export function ControlBar(props: {
    darkMode?: boolean;
    mode: Mode;
    onToggleRehearsal: () => void;
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
    showProduction: boolean;
    onToggleProduction: () => void;
    onToggleSceneManager: () => void;
    onToggleAudioMixer: () => void;
    audioMixerOpen: boolean;
    showBuyers: boolean;
    onToggleBuyers: () => void;
    showSources: boolean;
    onToggleSources: () => void;
    campaigns: Campaign[];
    currentCampaign: Campaign | null;
    currentSession: CampaignSession | null;
    onSelectCampaign: (campaign: Campaign) => void;
    onSelectSession: (session: CampaignSession) => void;
    campaignModalOpen?: boolean;
    onToggleCampaignModal?: () => void;
    hostPresenting?: boolean;
    onToggleHostPresenting?: () => void;
    isRecording: boolean;
    onToggleRecording: () => void;
}) {
    const {
        darkMode,
        mode,
        onToggleRehearsal,
        onToggleLive,
        micOn,
        onToggleMic,
        camOn,
        onToggleCam,
        screenShareOn,
        onCyclePreviewMode,
        flashActive,
        onOpenFlashConfig,
        onStopFlash,
        onToggleFilters,
        onToggleCommerceHud,
        commerceHudOpen,
        onToggleCoHosts,
        coHostsOpen,
        showProduction,
        onToggleProduction,
        onToggleSceneManager,
        onToggleAudioMixer,
        audioMixerOpen,
        showBuyers,
        onToggleBuyers,
        showSources,
        onToggleSources,
        currentCampaign,
        currentSession,
        campaignModalOpen,
        onToggleCampaignModal,
        hostPresenting,
        onToggleHostPresenting,
        isRecording,
        onToggleRecording,
    } = props;

    const isLive = mode === "live";
    const isRehearsal = mode === "rehearsal";

    const btnBase = "group h-9 px-2.5 rounded-full border text-[10px] font-medium flex items-center justify-center gap-1.5 transition-all shrink-0";

    const labelClass = "whitespace-nowrap ml-1";

    return (
        <div className="flex items-center justify-between w-full px-2 sm:px-4 md:px-6 py-2 sm:py-3 border-t border-border bg-background/95 overflow-x-auto">
            {/* Left Group - Audio/Video Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Mic Button */}
                <button
                    className={`${btnBase} ${micOn
                        ? "bg-secondary border-border text-foreground hover:bg-accent"
                        : "bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20"
                        }`}
                    onClick={onToggleMic}
                    title={micOn ? "Mute Microphone" : "Unmute Microphone"}
                >
                    <span className="material-icons text-[16px] sm:text-[18px]">{micOn ? "mic" : "mic_off"}</span>
                    <span className={labelClass}>{micOn ? "Mic" : "Muted"}</span>
                </button>

                {/* Camera Button */}
                <button
                    className={`${btnBase} ${camOn
                        ? "bg-secondary border-border text-foreground hover:bg-accent"
                        : "bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20"
                        }`}
                    onClick={onToggleCam}
                    title={camOn ? "Turn Off Camera" : "Turn On Camera"}
                >
                    <span className="material-icons text-[16px] sm:text-[18px]">{camOn ? "videocam" : "videocam_off"}</span>
                    <span className={labelClass}>{camOn ? "Camera" : "No Cam"}</span>
                </button>

                {/* Present Toggle Button */}
                {onToggleHostPresenting && (
                    <button
                        className={`${btnBase} ${hostPresenting
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30"
                            : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
                            }`}
                        onClick={onToggleHostPresenting}
                        title={hostPresenting ? "Stop Presenting" : "Start Presenting"}
                    >
                        <span className="material-icons text-[16px] sm:text-[18px]">{hostPresenting ? "stop_circle" : "play_circle"}</span>
                        <span className={labelClass}>{hostPresenting ? "Stop" : "Present"}</span>
                    </button>
                )}

                {/* Sources Button */}
                <button
                    className={`${btnBase} ${showSources
                        ? darkMode ? "bg-emerald-600 border-emerald-500 text-white" : "bg-emerald-500 border-emerald-400 text-white"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        }`}
                    onClick={onToggleSources}
                    title="Sources"
                >
                    <span className="material-icons text-[16px] sm:text-[18px]">add_circle</span>
                    <span className={labelClass}>Sources</span>
                </button>

                {/* Divider */}
                <div className={`w-px h-5 sm:h-6 mx-1 sm:mx-1.5 ${darkMode ? "bg-slate-700" : "bg-slate-300"}`} />

                {/* Buyers */}
                <button
                    className={`${btnBase} ${showBuyers
                        ? darkMode ? "bg-sky-600 border-sky-500 text-white" : "bg-sky-500 border-sky-400 text-white"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        }`}
                    onClick={onToggleBuyers}
                    title="Buyers"
                >
                    <span className="material-icons text-[16px] sm:text-[18px]">groups</span>
                    <span className={labelClass}>Buyers</span>
                </button>

                {/* Audio & Video */}
                <button
                    className={`${btnBase} ${audioMixerOpen
                        ? darkMode ? "bg-cyan-600 border-cyan-500 text-white" : "bg-cyan-500 border-cyan-400 text-white"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        }`}
                    onClick={onToggleAudioMixer}
                    title="Audio & Video"
                >
                    <span className="material-icons text-[16px] sm:text-[18px]">tune</span>
                    <span className={labelClass}>A/V</span>
                </button>

                {/* Multi-Cam */}
                <button
                    className={`${btnBase} ${showProduction
                        ? darkMode ? "bg-purple-600 border-purple-500 text-white" : "bg-purple-500 border-purple-400 text-white"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        }`}
                    onClick={onToggleProduction}
                    title="Multi-Camera"
                >
                    <span className="material-icons text-[16px] sm:text-[18px]">cameraswitch</span>
                    <span className={labelClass}>Multi-Cam</span>
                </button>
            </div>

            {/* Divider */}
            <div className={`w-px h-5 sm:h-6 mx-1 sm:mx-1.5 ${darkMode ? "bg-slate-700" : "bg-slate-300"}`} />

            {/* Center - Rehearsal & Go Live Buttons */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 shrink-0">
                {/* Rehearsal Button */}
                <button
                    className={`h-9 sm:h-10 px-3 sm:px-4 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wide shadow-lg transition-all flex items-center gap-1.5 ${isRehearsal
                        ? darkMode ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/30" : "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-900/20"
                        : darkMode ? "bg-slate-700 hover:bg-slate-600 text-slate-200 shadow-slate-900/30" : "bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-slate-900/20"
                        }`}
                    onClick={onToggleRehearsal}
                    title={isRehearsal ? "End Rehearsal" : "Start Rehearsal"}
                >
                    <span className="material-icons text-[14px] sm:text-[16px]">{isRehearsal ? "stop" : "play_arrow"}</span>
                    <span className={labelClass}>{isRehearsal ? "End" : "Rehearsal"}</span>
                </button>

                {/* Record Button */}
                <button
                    className={`h-9 sm:h-10 px-3 sm:px-4 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wide shadow-lg transition-all flex items-center gap-1.5 ${isRecording
                        ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                        : darkMode ? "bg-slate-700 hover:bg-slate-600 text-slate-200" : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                        }`}
                    onClick={onToggleRecording}
                    title={isRecording ? "Stop Recording" : "Start Recording"}
                >
                    <span className="material-icons text-[14px] sm:text-[16px]">{isRecording ? "stop" : "fiber_manual_record"}</span>
                    <span className={labelClass}>{isRecording ? "Stop" : "Record"}</span>
                </button>

                {/* Go Live Button */}
                <button
                    className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full text-[12px] font-bold tracking-wide shadow-lg transition-all flex items-center justify-center ${isLive
                        ? darkMode ? "bg-red-600 hover:bg-red-700 text-white shadow-red-900/30" : "bg-red-500 hover:bg-red-600 text-white shadow-red-900/20"
                        : darkMode ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-900/30" : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-900/20"
                        }`}
                    onClick={onToggleLive}
                    title={isLive ? "End Live Stream" : "Go Live"}
                >
                    <span className="material-icons text-[18px] sm:text-[20px]">{isLive ? "stop_circle" : "videocam"}</span>
                </button>
            </div>

            {/* Divider */}
            <div className={`w-px h-5 sm:h-6 mx-1 sm:mx-1.5 ${darkMode ? "bg-slate-700" : "bg-slate-300"}`} />

            {/* Right Group - Production & Tools */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Scenes */}
                <button
                    className={`${btnBase} ${darkMode ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20" : "border-indigo-400/40 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
                    onClick={onToggleSceneManager}
                    title="Scene Manager"
                >
                    <span className="material-icons text-[16px] sm:text-[18px]">theaters</span>
                    <span className={labelClass}>Scenes</span>
                </button>

                {/* Filters */}
                <button
                    className={`${btnBase} bg-secondary border-border text-foreground hover:bg-accent`}
                    onClick={onToggleFilters}
                    title="Filters"
                >
                    <span className="material-icons text-[16px] sm:text-[18px]">auto_awesome</span>
                    <span className={labelClass}>Filters</span>
                </button>

                {/* My Campaigns */}
                <div className="relative">
                    <button
                        className={`${btnBase} ${currentCampaign ? "bg-amber-600 border-amber-500 text-white" : "bg-secondary border-border text-foreground hover:bg-accent"}`}
                        onClick={() => onToggleCampaignModal?.()}
                        title={currentCampaign ? `Campaign: ${currentCampaign.name}` : "My Campaigns"}
                    >
                        <span className="material-icons text-[16px] sm:text-[18px]">campaign</span>
                        <span className={labelClass}>Campaigns</span>
                        {currentSession && <span className="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[10px]">{currentSession.name.substring(0, 6)}..</span>}
                    </button>
                </div>

                {/* Divider */}
                <div className={`w-px h-5 sm:h-6 mx-1 sm:mx-1.5 ${darkMode ? "bg-slate-700" : "bg-slate-300"}`} />

                {/* Commerce/Feeds */}
                <button
                    className={`${btnBase} ${commerceHudOpen
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary border-border text-foreground hover:bg-accent"
                        }`}
                    onClick={onToggleCommerceHud}
                    title="Product Feeds"
                >
                    <span className="material-icons text-[16px] sm:text-[18px]">shopping_bag</span>
                    <span className={labelClass}>Feeds</span>
                </button>

                {/* Co-hosts */}
                <button
                    className={`${btnBase} ${coHostsOpen
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "bg-secondary border-border text-foreground hover:bg-accent"
                        }`}
                    onClick={onToggleCoHosts}
                    title="Co-hosts"
                >
                    <span className="material-icons text-[16px] sm:text-[18px]">group</span>
                    <span className={labelClass}>Co-hosts</span>
                </button>

                {/* Flash Deal */}
                {flashActive ? (
                    <button
                        className={`${btnBase} border-rose-500/50 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 animate-pulse`}
                        onClick={onStopFlash}
                        title="Stop Flash Deal"
                    >
                        <span className="material-icons text-[16px] sm:text-[18px]">bolt</span>
                        <span className={labelClass}>Stop Deal</span>
                    </button>
                ) : (
                    <button
                        className={`${btnBase} border-orange-500/50 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20`}
                        onClick={onOpenFlashConfig}
                        title="Start Flash Deal"
                    >
                        <span className="material-icons text-[16px] sm:text-[18px]">bolt</span>
                        <span className={labelClass}>Start Deal</span>
                    </button>
                )}
            </div>
        </div>
    );
}
