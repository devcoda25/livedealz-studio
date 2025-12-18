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
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 md:p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-300">Camera view</span>
                    <span className="text-[10px] text-slate-500">{cameraHint}</span>
                </div>
                <PreviewModeToggle previewMode={previewMode} onChange={onChangePreviewMode} />
            </div>

            {mode === "lobby" ? (
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-6 text-center">
                    <div className="text-[11px] text-slate-300 font-semibold">Pre-live lobby</div>
                    <div className="text-[10px] text-slate-500 mt-1">Device and scene check before going live</div>
                </div>
            ) : (
                <StagePreview
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

            <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Scene presets</span>
                <span>Active: {activeScene.label}</span>
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1">
                {SCENES.map((s) => (
                    <button
                        key={s.id}
                        className={`px-2.5 py-1 rounded-xl border text-[10px] min-w-[120px] text-left ${s.id === activeSceneId
                            ? "bg-[#f77f00] border-[#f77f00] text-white"
                            : "bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-900"
                            }`}
                        onClick={() => onChangeScene(s.id)}
                    >
                        <span className="font-semibold">{s.label}</span>
                        <span className="block text-[9px] text-slate-400">{s.desc}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
