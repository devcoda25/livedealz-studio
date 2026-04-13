import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FlashDealState, CurrentSpeaker, Mode } from "../shared/types";
import { FilterEngine } from "@/engines/media/FilterEngine";
import { FilterCategory } from "@/engines/media/types";
import { useRef, useEffect, useState } from "react";

const EV_ORANGE = "#f77f00";
const EV_GREEN = "#03cd8c";

function formatHMS(totalSeconds: number) {
    const s = Math.max(0, totalSeconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return h > 0 ? `${pad2(h)}:${pad2(m)}:${pad2(ss)}` : `${pad2(m)}:${pad2(ss)}`;
}

function pad2(n: number) {
    return n.toString().padStart(2, "0");
}

export function StagePreview(props: {
    darkMode?: boolean;
    resolvedPreviewMode: "mobile" | "desktop";
    forceMobileMode?: boolean;
    activeSceneLabel: string;
    liveTimerLabel: string;
    viewerCount: number;
    liveLangMix: { label: string; pct: number }[];
    source: string;
    flash: FlashDealState;
    flashUrgency: string;
    micOn: boolean;
    camOn: boolean;
    screenShareOn: boolean;
    currentSpeaker: CurrentSpeaker | null;
    speakerSecondsLeft: number;
    onExpand: () => void;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    hasCameraPermission: boolean;
    transcriptionOn: boolean;
    transcript: string;
    activeFilter: string;
    activeFilterCategory?: FilterCategory | null;
    filterIntensity?: number;
    retryCameraAccess?: () => void;
    isDemoMode?: boolean;
    cameraError?: string | null;
    coHosts?: { id: number; name: string; status: string; isMainPresenter?: boolean; isPresenting?: boolean }[];
    mainPresenterId?: number | null;
    hostPresenting?: boolean;
    mode?: Mode;
    onVideoElementReady?: () => void;
    isRecording?: boolean;
    recordingSeconds?: number;
    onFilterEngineReady?: (engine: FilterEngine) => void;
}) {
    const {
        darkMode = true,
        resolvedPreviewMode,
        forceMobileMode = false,
        activeSceneLabel,
        liveTimerLabel,
        viewerCount,
        liveLangMix,
        source,
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
        filterIntensity = 100,
        retryCameraAccess,
        isDemoMode,
        cameraError,
        coHosts,
        mainPresenterId,
        hostPresenting,
        mode,
        onVideoElementReady,
        isRecording = false,
        recordingSeconds = 0,
        onFilterEngineReady,
    } = props;

    const isMobile = resolvedPreviewMode === "mobile" || forceMobileMode;
    const aspect = isMobile ? "9 / 16" : "16 / 9";

    // Determine presenting state for split-screen logic
    const presentingCoHosts = coHosts?.filter(c => c.isPresenting) || [];
    const onlyHostPresenting = hostPresenting && presentingCoHosts.length === 0;
    const onlyCoHostPresenting = !hostPresenting && presentingCoHosts.length === 1;
    const multiplePresenters = hostPresenting && presentingCoHosts.length >= 1;
    const hasMultipleCoHostsPresenting = presentingCoHosts.length > 1;
    const singlePresenter = (onlyHostPresenting || onlyCoHostPresenting) && !multiplePresenters;
    const mainPresenter = mainPresenterId ? presentingCoHosts.find(c => c.id === mainPresenterId) : null;
    const showMainPresenterLarger = mainPresenter && onlyCoHostPresenting;

    const flashTone =
        flashUrgency === "critical"
            ? "bg-red-600 border-red-400/60"
            : flashUrgency === "high"
                ? "bg-orange-600 border-orange-400/60"
                : "bg-[#f77f00] border-[#f77f00]/70";

    const banubaContainerRef = useRef<HTMLDivElement>(null);
    const filterEngineRef = useRef<FilterEngine | null>(null);

    // Notify parent when video element is ready
    useEffect(() => {
        if (videoRef.current && onVideoElementReady) {
            onVideoElementReady();
        }
    }, [videoRef]);

    // Initialize FilterEngine
    useEffect(() => {
        if (!filterEngineRef.current) {
            filterEngineRef.current = new FilterEngine();
        }
        const engine = filterEngineRef.current;

        const initEngine = async () => {
            if (videoRef.current) {
                // We pass a dummy canvas because FilterEngine API still expects it functionally, 
                // but Banuba uses banubaContainerRef for actual DOM rendering
                engine.attach(videoRef.current, document.createElement('canvas'));
                await engine.initialize();
                engine.start();

                // Set up Banuba rendering to container
                const banuba = engine.getBanubaEngine();
                if (banuba?.isReady() && banubaContainerRef.current) {
                    banuba.renderTo(banubaContainerRef.current);
                }

                if (onFilterEngineReady) {
                    onFilterEngineReady(engine);
                }
            }
        };

        initEngine();

        return () => {
            engine.stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Apply filter when activeFilter or category changes
    useEffect(() => {
        const engine = filterEngineRef.current;
        if (!engine || !activeFilter) return;

        const category = activeFilterCategory;
        const id = activeFilter;

        (async () => {
            // Reset ALL filter types first to prevent cross-category conflicts
            engine.setColorFilter(null);
            await engine.setARFilter(null);
            engine.setBackgroundFilter(null);
            engine.setChromaKeyFilter(null);
            engine.setGestureFilter(null);
            engine.setTimeEffect(null);

            const isResetId = !category
                || id === 'none' || id === 'beauty_none' || id === 'ar_none'
                || id === 'gesture_none' || id === 'bg_none'
                || id === 'chroma_off' || id === 'time_normal';

            if (isResetId) {
                return;
            }

            switch (category) {
                case FilterCategory.COLOR:
                case FilterCategory.BEAUTY:
                    engine.setColorFilter(id);
                    engine.setColorIntensity(filterIntensity);
                    break;
                case FilterCategory.AR_FACE:
                    await engine.setARFilter(id);
                    break;
                case FilterCategory.BACKGROUND:
                    engine.setBackgroundFilter(id);
                    break;
                case FilterCategory.GREEN_SCREEN:
                    engine.setChromaKeyFilter(id);
                    break;
                case FilterCategory.GESTURE:
                    engine.setGestureFilter(id);
                    break;
                case FilterCategory.TIME:
                    engine.setTimeEffect(id);
                    break;
            }
        })();
    }, [activeFilter, activeFilterCategory]);

    // Update intensity when it changes
    useEffect(() => {
        filterEngineRef.current?.setColorIntensity(filterIntensity);
    }, [filterIntensity]);

    // Shared canvas/video classes for positioning
    const mediaClasses = multiplePresenters
        ? 'w-1/2 h-full top-0 left-0'
        : singlePresenter
            ? 'w-2/3 h-full top-0 left-0'
            : '';

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onExpand}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onExpand(); }}
            className="relative w-full flex items-center justify-center cursor-pointer"
            title="Tap to expand preview"
        >
            <div
                className={`relative overflow-hidden transition-all duration-500 ${isMobile ? 'w-full h-full' : 'rounded-2xl border shadow-[0_24px_80px_rgba(15,23,42,0.7)]' + (!isMobile && " w-full ")} ${darkMode ? "bg-slate-950 border-slate-800" : "bg-black border-slate-300"} ${isMobile && (multiplePresenters || onlyCoHostPresenting) ? ' flex flex-col' : ''}`}
                style={isMobile ? { height: '100dvh' } : { aspectRatio: aspect }}
            >
                {isMobile && (multiplePresenters || onlyCoHostPresenting) ? (
                    /* Mobile split-screen */
                    <>
                        <div className="w-full h-1/2 flex-shrink-0 relative">
                            {/* Hidden video - used as input source for FilterEngine */}
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover absolute inset-0"
                                autoPlay muted playsInline
                            />
                            {/* Banuba AR container - single source of truth for video feed */}
                            <div
                                ref={banubaContainerRef}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </div>
                        {presentingCoHosts.length > 0 && (
                            <div className="w-full h-1/2 flex-1 relative">
                                {multiplePresenters || hasMultipleCoHostsPresenting ? (
                                    <div className="w-full h-full flex flex-col gap-1 p-1">
                                        {presentingCoHosts.slice(0, 4).map((coHost) => (
                                            <div key={coHost.id} className="flex-1 rounded-lg overflow-hidden border border-purple-500/50 bg-slate-900 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-semibold text-white mx-auto mb-1">
                                                        {coHost.name.split(" ").map((w: string) => w[0]).join("")}
                                                    </div>
                                                    <div className="text-[8px] text-white truncate px-1">{coHost.name}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="w-full h-full rounded-lg overflow-hidden border-2 border-purple-500 shadow-lg bg-slate-900">
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center text-sm font-semibold text-white mx-auto mb-2">
                                                    {presentingCoHosts[0].name.split(" ").map((w: string) => w[0]).join("")}
                                                </div>
                                                <div className="text-xs text-white font-medium">{presentingCoHosts[0].name}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-600 dark:border-green-400 text-green-700 dark:text-green-300 text-[10px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    LIVE
                                    {presentingCoHosts.length > 1 && <span className="ml-1">+{presentingCoHosts.length - 1}</span>}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* Desktop / single presenter */
                    <>
                        {/* Hidden video - used as input source for FilterEngine */}
                        <video
                            ref={videoRef}
                            className={`absolute inset-0 w-full h-full object-cover ${mediaClasses}`}
                            autoPlay muted playsInline
                        />
                        {/* Banuba AR container - single source of truth for video feed */}
                        <div
                            ref={banubaContainerRef}
                            className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${mediaClasses}`}
                        />
                        {presentingCoHosts.length > 0 && (multiplePresenters || singlePresenter) && (
                            <div
                                className={`absolute inset-0 w-full h-full transition-all duration-300 ${multiplePresenters
                                    ? 'w-1/2 h-full top-0 right-0 left-auto'
                                    : onlyCoHostPresenting
                                        ? 'w-1/2 h-full top-0 right-0 left-auto'
                                        : 'w-1/3 h-1/3 top-2 left-2 right-auto bottom-auto'
                                    }`}
                            >
                                {multiplePresenters || hasMultipleCoHostsPresenting ? (
                                    <div className="w-full h-full grid grid-cols-2 gap-1 p-1">
                                        {presentingCoHosts.slice(0, 4).map((coHost) => (
                                            <div key={coHost.id} className="rounded-lg overflow-hidden border border-purple-500/50 bg-slate-900 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-semibold text-white mx-auto mb-1">
                                                        {coHost.name.split(" ").map((w: string) => w[0]).join("")}
                                                    </div>
                                                    <div className="text-[8px] text-white truncate px-1">{coHost.name}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="w-full h-full rounded-lg overflow-hidden border-2 border-purple-500 shadow-lg bg-slate-900">
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center text-sm font-semibold text-white mx-auto mb-2">
                                                    {presentingCoHosts[0].name.split(" ").map((w: string) => w[0]).join("")}
                                                </div>
                                                <div className="text-xs text-white font-medium">{presentingCoHosts[0].name}</div>
                                                {showMainPresenterLarger && <div className="text-[10px] text-purple-300">Main Presenter</div>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-600 dark:border-green-400 text-green-700 dark:text-green-300 text-[10px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    LIVE
                                    {presentingCoHosts.length > 1 && <span className="ml-1">+{presentingCoHosts.length - 1}</span>}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {(isDemoMode || !hasCameraPermission) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
                        <div className="flex flex-col items-center gap-4">
                            <Alert variant="destructive">
                                <AlertTitle>Camera Access Required</AlertTitle>
                                <AlertDescription>
                                    Please allow camera and microphone access to use the preview.
                                </AlertDescription>
                            </Alert>
                            {retryCameraAccess && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        retryCameraAccess();
                                    }}
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Try Again
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Speaker */}
                {currentSpeaker && (
                    <div className="hidden md:block absolute top-12 right-2 z-40">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-600/60 dark:border-emerald-400/60 text-emerald-700 dark:text-emerald-200 text-[10px]">
                            <span className="material-icons text-[14px]">mic</span>
                            <span className="font-semibold">Live audio</span>
                            <span className="text-emerald-800 dark:text-emerald-100">{currentSpeaker.viewerName}</span>
                            <span className="text-emerald-600/80 dark:text-emerald-200/80">({currentSpeaker.langTag})</span>
                            <span className="px-2 py-0.5 rounded-full bg-black/40 border border-white/10">
                                {formatHMS(speakerSecondsLeft)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Flash banner */}
                {flash.active && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-12 hidden md:block z-40">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] text-white shadow ${flashTone}`}>
                            <span className="material-icons text-[14px]">bolt</span>
                            <span className="font-semibold">FLASH</span>
                            <span>-{flash.discountPct}%</span>
                            <span>ends in {formatHMS(flash.secondsLeft)}</span>
                            <span className="ml-1 h-1.5 w-16 rounded-full bg-black/30 overflow-hidden">
                                <span
                                    className="block h-full"
                                    style={{ width: `${Math.round((flash.secondsLeft / Math.max(1, flash.totalSeconds)) * 100)}%`, backgroundColor: "rgba(255,255,255,0.9)" }}
                                />
                            </span>
                        </div>
                    </div>
                )}

                {/* Live Captions */}
                {transcriptionOn && (
                    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[90%] flex flex-col items-center pointer-events-none transition-all duration-300 z-40">
                        <div className={`px-4 py-2 bg-gradient-to-r from-slate-950/80 to-slate-900/80 text-white text-[14px] md:text-[16px] font-medium leading-relaxed rounded-xl backdrop-blur-md shadow-lg border border-white/10 ${transcript ? 'opacity-100 scale-100' : 'opacity-75 scale-95'} transition-all duration-200`}>
                            {transcript ? (
                                <span className="drop-shadow-md">{transcript}</span>
                            ) : (
                                <span className="text-slate-300 italic flex items-center gap-2 text-sm">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                    Listening...
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Co-hosts Grid */}
                {coHosts && coHosts.length > 0 && (
                    <div className="absolute right-2 top-20 flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                        {coHosts.filter(c => {
                            if (!c.isPresenting) return true;
                            if (c.id === mainPresenterId && !hostPresenting) return true;
                            return false;
                        }).map((coHost) => (
                            <div
                                key={coHost.id}
                                className={`w-20 h-24 rounded-lg overflow-hidden border-2 shadow-lg ${coHost.id === mainPresenterId ? 'border-orange-500/50' : 'border-purple-500/50'}`}
                                title={coHost.name}
                            >
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-[10px] font-semibold text-white mx-auto mb-1 ${coHost.id === mainPresenterId ? 'bg-orange-600' : 'bg-slate-700'}`}>
                                            {coHost.name.split(" ").map((w) => w[0]).join("")}
                                        </div>
                                        <div className="text-[8px] text-slate-300 truncate px-1">{coHost.name}</div>
                                        {coHost.id === mainPresenterId && <div className="text-[8px] text-orange-400 font-medium">Host</div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Status indicators */}
                {screenShareOn && (
                    <div className="absolute bottom-[280px] right-2 text-[10px] px-2 py-0.5 rounded-full bg-slate-900/70 border border-slate-700 text-slate-100 z-40">
                        Screen sharing
                    </div>
                )}
                {!camOn && (
                    <div className="absolute bottom-[280px] left-2 text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white z-40">
                        Camera off
                    </div>
                )}

                {isRecording && (
                    <div className="hidden md:flex absolute top-4 left-4 items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/90 text-white text-[11px] font-bold shadow-lg animate-pulse z-50">
                        <span className="w-2 h-2 rounded-full bg-white block" />
                        REC {formatHMS(recordingSeconds)}
                    </div>
                )}

                {/* Lobby Overlay - Desktop only */}
                {mode === "lobby" && !isMobile && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/20 backdrop-blur-[2px] z-30 pointer-events-none">
                        <div className={`p-8 rounded-2xl border shadow-2xl ${darkMode ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-slate-200"}`}>
                            <div className={`text-[13px] md:text-[15px] ${darkMode ? "text-slate-100" : "text-slate-800"} font-bold tracking-widest uppercase mb-1`}>Pre-live lobby</div>
                            <div className={`text-[10px] md:text-[12px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Prepare your scene securely. You are not yet on air.</div>
                        </div>
                    </div>
                )}

                {isMobile && <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />}
            </div>
        </div>
    );
}
