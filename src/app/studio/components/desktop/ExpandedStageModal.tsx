import React, { useRef, useState, useEffect } from "react";
import { PreviewMode, ProductionMode, ExternalTool, SourceId, FlashDealState, CurrentSpeaker } from "../shared/types";
import { StagePreview } from "./StagePreview";
import { PreviewModeToggle } from "./PreviewModeToggle";
import { sourceLabel, getFullscreenElement, exitFullscreen, requestFullscreen } from "../shared/utils";
import { FilterCategory } from "../../../../engines/media/types";

export function ExpandedStageModal(props: {
    darkMode?: boolean;
    onClose: () => void;
    cameraHint: string;
    previewMode: PreviewMode;
    onChangePreviewMode: (m: PreviewMode) => void;
    resolvedPreviewMode: "mobile" | "desktop";
    liveTimerLabel: string;
    viewerCount: number;
    liveLangMix: { label: string; pct: number }[];
    productionMode: ProductionMode;
    externalTool: ExternalTool;
    activeSourceId: SourceId;
    flash: FlashDealState;
    flashUrgency: string;
    currentSpeaker: CurrentSpeaker | null;
    speakerSecondsLeft: number;
    videoRef: React.RefObject<HTMLVideoElement>;
    hasCameraPermission: boolean;
    transcriptionOn: boolean;
    transcript: string;
    activeFilter: string;
    activeFilterCategory?: FilterCategory | null;
    filterIntensity?: number;
    coHosts?: { id: number; name: string; status: string; isMainPresenter?: boolean; isPresenting?: boolean }[];
    mainPresenterId?: number | null;
    hostPresenting?: boolean;
}) {
    const {
        darkMode,
        onClose,
        cameraHint,
        previewMode,
        onChangePreviewMode,
        resolvedPreviewMode,
        liveTimerLabel,
        viewerCount,
        liveLangMix,
        productionMode,
        externalTool,
        activeSourceId,
        flash,
        flashUrgency,
        currentSpeaker,
        speakerSecondsLeft,
        videoRef,
        hasCameraPermission,
        transcriptionOn,
        transcript,
        activeFilter,
        activeFilterCategory,
        filterIntensity,
        coHosts,
        mainPresenterId,
        hostPresenting,
    } = props;

    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isFs, setIsFs] = useState(false);

    useEffect(() => {
        const onFsChange = () => setIsFs(!!getFullscreenElement());
        document.addEventListener("fullscreenchange", onFsChange);
        // @ts-ignore
        document.addEventListener("webkitfullscreenchange", onFsChange);
        // @ts-ignore
        document.addEventListener("MSFullscreenChange", onFsChange);
        onFsChange();
        return () => {
            document.removeEventListener("fullscreenchange", onFsChange);
            // @ts-ignore
            document.removeEventListener("webkitfullscreenchange", onFsChange);
            // @ts-ignore
            document.removeEventListener("MSFullscreenChange", onFsChange);
        };
    }, []);

    const handleClose = async () => {
        const fsEl = getFullscreenElement();
        if (fsEl) await exitFullscreen();
        onClose();
    };

    const toggleFullscreen = async () => {
        try {
            if (!containerRef.current) return;
            const fsEl = getFullscreenElement();
            if (fsEl) await exitFullscreen();
            else await requestFullscreen(containerRef.current);
        } catch (e) {
            console.warn("Fullscreen error", e);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] bg-black/75 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl relative">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">Expanded preview</span>
                        <span className="text-[11px] text-slate-300">{cameraHint}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <PreviewModeToggle previewMode={previewMode} onChange={onChangePreviewMode} />
                        <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-muted text-[11px]"
                            onClick={toggleFullscreen}
                            title="Uses the browser Fullscreen API"
                        >
                            <span className="material-icons text-[14px]">{isFs ? "fullscreen_exit" : "fullscreen"}</span>
                            {isFs ? "Exit fullscreen" : "Fullscreen"}
                        </button>
                        <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-muted text-[11px]"
                            onClick={handleClose}
                        >
                            <span className="material-icons text-[14px]">close</span>
                            Close
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleClose}
                    className={`absolute -top-2 -right-2 z-10 h-8 w-8 rounded-full ${darkMode ? "bg-slate-800/80 hover:bg-slate-700" : "bg-white/80 hover:bg-slate-100"} ${darkMode ? "text-white" : "text-slate-900"} flex items-center justify-center`}
                    aria-label="Close expanded view"
                >
                    <span className="material-icons text-[20px]">close</span>
                </button>

                <div
                    ref={containerRef}
                    className="bg-background border border-border rounded-3xl p-3 shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
                    onDoubleClick={toggleFullscreen}
                >
                    <StagePreview
                        darkMode={darkMode}
                        resolvedPreviewMode={resolvedPreviewMode}
                        activeSceneLabel="Expanded"
                        liveTimerLabel={liveTimerLabel}
                        viewerCount={viewerCount}
                        liveLangMix={liveLangMix}
                        // @ts-ignore
                        source={sourceLabel(activeSourceId, productionMode, externalTool)}
                        flash={flash as { active: boolean; secondsLeft: number; discountPct: number; productId?: string }}
                        flashUrgency={flashUrgency}
                        micOn={true}
                        camOn={true}
                        screenShareOn={false}
                        currentSpeaker={currentSpeaker ? { name: currentSpeaker.viewerName } : null}
                        speakerSecondsLeft={speakerSecondsLeft}
                        onExpand={toggleFullscreen}
                        videoRef={videoRef}
                        hasCameraPermission={hasCameraPermission}
                        transcriptionOn={transcriptionOn}
                        transcript={transcript}
                        activeFilter={activeFilter}
                        activeFilterCategory={activeFilterCategory}
                        filterIntensity={filterIntensity}
                        hostPresenting={hostPresenting}
                        coHosts={coHosts}
                        mainPresenterId={mainPresenterId}
                    />
                    <div className="mt-3 text-[11px] text-slate-300 flex items-center justify-between">
                        <span>Tip: double-click the preview to toggle fullscreen.</span>
                        <span className="text-slate-500">ESC exits fullscreen</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
