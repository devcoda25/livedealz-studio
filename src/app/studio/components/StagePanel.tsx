import React from "react";
import { Mode, SceneId, PreviewMode, ProductionMode, ExternalTool, SourceId, FlashDealState, CurrentSpeaker, SCENES } from "./types";
import { StagePreview } from "./StagePreview";
import { PreviewModeToggle } from "./PreviewModeToggle";
import { FilterCategory } from "../../../engines/media/types";

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
    forceMobileMode?: boolean; // Force mobile view
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
    activeFilterCategory?: FilterCategory | null;
    filterIntensity?: number;
    retryCameraAccess?: () => void;
    canvasSources?: any[];
    selectedSourceId?: string | null;
    onSelectSource?: (id: string) => void;
    onUpdateSourcePosition?: (id: string, position: any) => void;
    onUpdateSourceSize?: (id: string, size: any) => void;
    isDemoMode?: boolean;
    cameraError?: string | null;
    coHosts?: { id: number; name: string; status: string; isMainPresenter?: boolean }[];
    mainPresenterId?: number | null;
    hostPresenting?: boolean;
    onVideoElementReady?: () => void;
    isRecording?: boolean;
    recordingSeconds?: number;
    onFilterEngineReady?: (engine: any) => void;
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
        activeFilterCategory,
        filterIntensity,
        retryCameraAccess,
        canvasSources,
        selectedSourceId,
        onSelectSource,
        onUpdateSourcePosition,
        onUpdateSourceSize,
        isDemoMode,
        cameraError,
        coHosts,
        mainPresenterId,
        hostPresenting,
        onVideoElementReady,
        isRecording,
        recordingSeconds,
        onFilterEngineReady,
    } = props;

    const activeScene = SCENES.find((s) => s.id === activeSceneId) ?? SCENES[0];

    return (
        <div className={`flex-1 min-h-0 md:rounded-3xl p-0 md:p-4 flex flex-col md:gap-3 ${darkMode ? "bg-black md:bg-slate-950 md:border md:border-slate-800" : "bg-black md:bg-white md:border md:border-slate-200"}`}>
            <div className="hidden md:flex items-center justify-between gap-2 flex-shrink-0 p-2 md:p-0">
                <div className="flex items-center gap-2">
                    <span className={`text-[11px] ${darkMode ? "text-slate-300" : "text-slate-600"} drop-shadow-md`}>Camera view</span>
                    <span className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"} drop-shadow-md`}>{cameraHint}</span>
                </div>
                <PreviewModeToggle previewMode={previewMode} onChange={onChangePreviewMode} />
            </div>

            <StagePreview
                {...props}
                activeSceneLabel={activeScene.label}
                source={sourceLabel(activeSourceId, productionMode, externalTool)}
            />
        </div>
    );
}
