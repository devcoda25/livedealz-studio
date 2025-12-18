import React from "react";
import { Mode, SceneId, PreviewMode, SCENES } from "./types";

export function ControlBar(props: {
    mode: Mode;
    onToggleLive: () => void;
    micOn: boolean;
    onToggleMic: () => void;
    camOn: boolean;
    onToggleCam: () => void;
    screenShareOn: boolean;
    onToggleScreenShare: () => void;
    activeSceneId: SceneId;
    onChangeScene: (id: SceneId) => void;
    previewMode: PreviewMode;
    onCyclePreviewMode: () => void;
    cameraHint: string;
    flashActive: boolean;
    onOpenFlashConfig: () => void;
    onStopFlash: () => void;
    onOpenLanguage: () => void;
    onToggleFilters: () => void;
    transcriptionOn: boolean;
    onToggleTranscription: () => void;
    showProduction: boolean;
    onToggleProduction: () => void;
}) {
    const {
        mode,
        onToggleLive,
        micOn,
        onToggleMic,
        camOn,
        onToggleCam,
        screenShareOn,
        onToggleScreenShare,
        activeSceneId,
        onChangeScene,
        onCyclePreviewMode,
        cameraHint,
        flashActive,
        onOpenFlashConfig,
        onStopFlash,
        onOpenLanguage,
        onToggleFilters,
        transcriptionOn,
        onToggleTranscription,
        showProduction,
        onToggleProduction,
    } = props;

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 md:px-6 py-2 border-t border-slate-800 bg-slate-950/95 text-[11px]">
            <div className="flex items-center gap-2">
                <button
                    className={`h-9 px-5 rounded-full text-[11px] font-bold tracking-wide shadow-lg transition-all flex items-center gap-2 ${mode === "live"
                        ? "bg-red-600 hover:bg-red-700 text-white shadow-red-900/30"
                        : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-900/30"
                        }`}
                    onClick={onToggleLive}
                >
                    <span className="material-icons text-[16px]">{mode === "live" ? "stop_circle" : "videocam"}</span>
                    {mode === "live" ? "End Live Stream" : "Go Live"}
                </button>

                <div className="h-6 w-px bg-slate-800 mx-1" />

                <button
                    className={`h-9 px-3 rounded-full border text-[11px] font-medium flex items-center gap-2 transition-colors ${micOn
                        ? "bg-slate-800 border-slate-600 text-slate-100"
                        : "bg-slate-950 border-slate-800 text-red-400"
                        }`}
                    onClick={onToggleMic}
                >
                    <span className="material-icons text-[16px]">{micOn ? "mic" : "mic_off"}</span>
                    <span className="hidden sm:inline">{micOn ? "Mic On" : "Muted"}</span>
                </button>

                <button
                    className={`h-9 px-3 rounded-full border text-[11px] font-medium flex items-center gap-2 transition-colors ${camOn
                        ? "bg-slate-800 border-slate-600 text-slate-100"
                        : "bg-slate-950 border-slate-800 text-red-400"
                        }`}
                    onClick={onToggleCam}
                >
                    <span className="material-icons text-[16px]">{camOn ? "videocam" : "videocam_off"}</span>
                    <span className="hidden sm:inline">{camOn ? "Cam On" : "No Cam"}</span>
                </button>

                <div className="h-6 w-px bg-slate-800 mx-1" />

                <button
                    className={`h-9 px-3 rounded-full border text-[11px] font-medium flex items-center gap-2 transition-colors ${transcriptionOn
                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300"
                        : "bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200"
                        }`}
                    onClick={onToggleTranscription}
                >
                    <span className="material-icons text-[16px]">subtitles</span>
                    <span className="hidden sm:inline">Captions</span>
                </button>
            </div>

            <div className="flex items-center gap-2 text-[10px]">

                <button className={`px-3 py-1.5 rounded-full border text-[10px] hidden sm:inline-flex ${screenShareOn ? "bg-slate-900 border-slate-600 text-slate-100" : "bg-slate-950 border-slate-800 text-slate-400"}`} onClick={onToggleScreenShare}>
                    Screen share
                </button>

                <button
                    className={`px-3 py-1.5 rounded-full border text-[10px] hidden sm:inline-flex items-center gap-1.5 ${showProduction ? "bg-purple-900/30 border-purple-500 text-purple-200" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                    onClick={onToggleProduction}
                >
                    <span className="material-icons text-[14px]">cameraswitch</span>
                    Multi-Cam
                </button>

                <button className="px-3 py-1.5 rounded-full border border-slate-600 text-[10px] text-slate-100 hover:bg-slate-900 hidden sm:inline-flex items-center gap-1.5" onClick={onToggleFilters}>
                    <span className="material-icons text-[14px]">auto_awesome</span>
                    AR Filters
                </button>

                <button className="px-3 py-1.5 rounded-full border border-slate-700 text-[10px] text-slate-100 hover:bg-slate-900 hidden sm:inline-flex items-center gap-1.5" onClick={onOpenLanguage}>
                    <span className="material-icons text-[14px]">translate</span>
                    Language
                </button>

                {flashActive ? (
                    <button className="px-3 py-1.5 rounded-full border border-rose-500/70 bg-rose-500/10 text-[10px] text-rose-200 hover:bg-rose-500/20 inline-flex items-center gap-1.5" onClick={onStopFlash}>
                        <span className="material-icons text-[14px]">bolt</span>
                        Stop deal
                    </button>
                ) : (
                    <button className="px-3 py-1.5 rounded-full border border-orange-500/70 bg-orange-500/10 text-[10px] text-orange-200 hover:bg-orange-500/20 inline-flex items-center gap-1.5" onClick={onOpenFlashConfig}>
                        <span className="material-icons text-[14px]">bolt</span>
                        Start deal
                    </button>
                )}
                <select
                    className="border border-slate-700 rounded-full px-2 py-0.5 bg-slate-950 text-slate-100 hidden sm:block"
                    value={activeSceneId}
                    onChange={(e) => onChangeScene(e.target.value as SceneId)}
                >
                    {SCENES.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
