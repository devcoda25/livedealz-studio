import React from "react";
import { Mode, SceneId, PreviewMode, ProductionMode, ExternalTool, SourceId, FlashDealState, CurrentSpeaker, SCENES } from "./types";
import { StagePreview } from "./StagePreview";
import { PreviewModeToggle } from "./PreviewModeToggle";

// Helper for source label
function sourceLabel(id: SourceId, pm: ProductionMode, et: ExternalTool) {
    if (pm === "external") return et === "OBS" ? "OBS Virtual" : "vMix Output";
    const map: Record<SourceId, string> = {
        cam1: "Camera 1",
        cam2: "Camera 2",
        screen: "Screen Share",
        obs: "OBS",
        vmix: "vMix",
    };
    return map[id] || "Unknown";
}

export function StagePanel(props: {
    darkMode?: boolean;
    mode: Mode;
    activeSceneId: SceneId;
    onChangeScene: (id: SceneId) => void;
    previewMode: PreviewMode;
    onChangePreviewMode: (m: PreviewMode) => void;
    resolvedPreviewMode: "mobile" | "desktop";
    cameraHint: string;
    liveTimerLabel: string;
    viewerCount: number;
    liveLangMix: { label: string; pct: number }[];
    productionMode: ProductionMode;
    externalTool: ExternalTool;
    activeSourceId: SourceId;
    flash: FlashDealState;
    flashUrgency: string;
    micOn: boolean;
    camOn: boolean;
    screenShareOn: boolean;
    currentSpeaker: CurrentSpeaker | null;
    speakerSecondsLeft: number;
    onExpand: () => void;
    videoRef: React.RefObject<HTMLVideoElement>;
    hasCameraPermission: boolean;
    transcriptionOn: boolean;
    transcript: string;
    activeFilter: string;
}) {
    const {
        darkMode = true,
        mode,
        activeSceneId,
        onChangeScene,
        previewMode,
        onChangePreviewMode,
        resolvedPreviewMode,
        cameraHint,
        liveTimerLabel,
        viewerCount,
        liveLangMix,
        productionMode,
        externalTool,
        activeSourceId,
        flash,
        flashUrgency,
        micOn,
        camOn,
        screenShareOn,
        currentSpeaker,
        speakerSecondsLeft,
        onExpand,
        videoRef,
        hasCameraPermission,
        transcriptionOn,
        transcript,
        activeFilter,
    } = props;

    const activeScene = SCENES.find((s) => s.id === activeSceneId) ?? SCENES[0];

    return (
        <div className={`flex-1 min-h-0 rounded-3xl p-3 md:p-4 flex flex-col gap-3 ${darkMode ? "bg-slate-950 border border-slate-800" : "bg-white border border-slate-200"}`}>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className={`text-[11px] ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Camera view</span>
                    <span className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{cameraHint}</span>
                </div>
                <PreviewModeToggle previewMode={previewMode} onChange={onChangePreviewMode} />
            </div>

            {mode === "lobby" ? (
                <div className={`flex-1 rounded-2xl p-4 md:p-6 text-center flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] ${resolvedPreviewMode === 'mobile' ? 'max-w-[280px] mx-auto' : 'w-full'} ${darkMode ? "bg-slate-950 border border-slate-800" : "bg-slate-50 border border-slate-200"}`}>
                    <div className={`text-[11px] md:text-[13px] ${darkMode ? "text-slate-300" : "text-slate-700"} font-semibold`}>Pre-live lobby</div>
                    <div className={`text-[10px] md:text-[11px] ${darkMode ? "text-slate-500" : "text-slate-400"} mt-1 md:mt-2`}>Device and scene check before going live</div>
                </div>
            ) : (
                <StagePreview
                    darkMode={darkMode}
                    resolvedPreviewMode={resolvedPreviewMode}
                    activeSceneLabel={activeScene.label}
                    liveTimerLabel={liveTimerLabel}
                    viewerCount={viewerCount}
                    liveLangMix={liveLangMix}
                    // @ts-ignore
                    source={sourceLabel(activeSourceId, productionMode, externalTool)}
                    flash={flash}
                    flashUrgency={flashUrgency}
                    micOn={micOn}
                    camOn={camOn}
                    screenShareOn={screenShareOn}
                    currentSpeaker={currentSpeaker}
                    speakerSecondsLeft={speakerSecondsLeft}
                    onExpand={onExpand}
                    videoRef={videoRef}
                    hasCameraPermission={hasCameraPermission}
                    transcriptionOn={transcriptionOn}
                    transcript={transcript}
                    activeFilter={activeFilter}
                />
            )}
        </div>
    );
}
