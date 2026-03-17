import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FlashDealState, CurrentSpeaker } from "./types";
import { getFilterStyle } from "./filters";
import { FilterEngine, FilterType } from "@/engines/media/FilterEngine";
import { useRef, useEffect } from "react";

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
    videoRef: React.RefObject<HTMLVideoElement>;
    hasCameraPermission: boolean;
    transcriptionOn: boolean;
    transcript: string;
    activeFilter: string;
}) {
    const {
        darkMode = true,
        resolvedPreviewMode,
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
    } = props;

    const isMobile = resolvedPreviewMode === "mobile";
    const aspect = isMobile ? "9 / 16" : "16 / 9";

    const flashTone =
        flashUrgency === "critical"
            ? "bg-red-600 border-red-400/60"
            : flashUrgency === "high"
                ? "bg-orange-600 border-orange-400/60"
                : "bg-[#f77f00] border-[#f77f00]/70";

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const filterEngineRef = useRef<FilterEngine | null>(null);

    useEffect(() => {
        // Initialize engine
        if (!filterEngineRef.current) {
            filterEngineRef.current = new FilterEngine();
        }
        const engine = filterEngineRef.current;

        const initEngine = async () => {
            if (videoRef.current && canvasRef.current) {
                // Ensure canvas dimensions match video or container
                // For now, allow CSS to handle display size, but we might need to set internal width/height?
                // FilterEngine/FaceMesh usually requires correct internal resolution.
                // We'll set it to videoWidth/videoHeight in the engine or here once loaded.
                // Actually FilterEngine attaches and usually handles resize?
                // Let's attach.
                engine.attach(videoRef.current, canvasRef.current);
                await engine.initialize();
                engine.start();
            }
        };

        // We need to wait for video to be ready? Engine loop checks readyState.
        initEngine();

        return () => {
            engine.stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (filterEngineRef.current) {
            filterEngineRef.current.setFilter(activeFilter as FilterType);
        }
    }, [activeFilter]);

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
                className={"relative rounded-2xl border overflow-hidden shadow-[0_24px_80px_rgba(15,23,42,0.7)] " + (isMobile ? "w-[360px] max-w-[80%] " : "w-full ") + (darkMode ? "bg-slate-950 border-slate-800" : "bg-black border-slate-300")}
                style={{ aspectRatio: aspect }}
            >
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-300"
                    autoPlay muted playsInline
                    style={{ filter: getFilterStyle(activeFilter) }}
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    width={1280}
                    height={720}
                />

                {!hasCameraPermission && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
                        <Alert variant="destructive">
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                                Please allow camera and microphone access to use the preview.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                {/* Live pill */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 text-[10px]">
                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-black/60 border border-white/10 text-slate-100">
                        <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            LIVE
                        </span>
                        <span className="opacity-80">{liveTimerLabel}</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 border border-white/10 text-slate-100">
                        <span className="material-icons text-[14px]">visibility</span>
                        <span>{viewerCount.toLocaleString()} viewers</span>
                    </div>
                </div>

                {/* AI chips */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 text-[10px] items-end">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-emerald-200 border border-emerald-400/60">
                        <span className="material-icons text-[14px]">graphic_eq</span>
                        <span>AI Audio: ON (Multi)</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-sky-100 border border-sky-400/60">
                        <span className="material-icons text-[14px]">subtitles</span>
                        <span>Captions: ON</span>
                    </div>
                </div>

                {/* Speaker */}
                {currentSpeaker && (
                    <div className="absolute top-12 right-2">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/60 text-emerald-200 text-[10px]">
                            <span className="material-icons text-[14px]">mic</span>
                            <span className="font-semibold">Live audio</span>
                            <span className="text-emerald-100">{currentSpeaker.viewerName}</span>
                            <span className="text-emerald-200/80">({currentSpeaker.langTag})</span>
                            <span className="px-2 py-0.5 rounded-full bg-black/40 border border-white/10">
                                {formatHMS(speakerSecondsLeft)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Flash banner */}
                {flash.active && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-12">
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

                {/* Scene label */}
                <div className="absolute top-12 left-2 text-[10px] px-2 py-0.5 rounded-full bg-black/55 border border-white/10 text-slate-100">
                    Scene: <span className="font-semibold">{activeSceneLabel}</span>
                </div>

                {/* Source + language mix */}
                <div className="absolute left-2 right-2 bottom-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] text-slate-200">Viewer languages (sample)</span>
                        <span className="text-[10px] text-slate-300">Source: {source}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-900/70 border border-white/10 overflow-hidden flex">
                        {liveLangMix.map((seg, idx) => (
                            <div
                                key={seg.label}
                                className="h-full"
                                style={{ width: `${seg.pct}%`, backgroundColor: idx % 2 === 0 ? EV_ORANGE : EV_GREEN, opacity: 0.8 }}
                                title={`${seg.label} · ${seg.pct}%`}
                            />
                        ))}
                    </div>
                </div>

                {/* Status */}
                {screenShareOn && (
                    <div className="absolute bottom-24 right-2 text-[10px] px-2 py-0.5 rounded-full bg-slate-900/70 border border-slate-700 text-slate-100">
                        Screen sharing
                    </div>
                )}
                {!camOn && (
                    <div className="absolute bottom-24 left-2 text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white">
                        Camera off
                    </div>
                )}

                <div className="absolute bottom-24 right-2 flex flex-col items-end gap-1 text-[10px]">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-slate-100 border border-white/10">
                        <span className="material-icons text-[14px]">{micOn ? "mic" : "mic_off"}</span>
                        <span>{micOn ? "Mic live" : "Mic muted"}</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-slate-100 border border-white/10">
                        <span className="material-icons text-[14px]">{camOn ? "videocam" : "videocam_off"}</span>
                        <span>{camOn ? "Camera on" : "Camera off"}</span>
                    </div>
                </div>

                {/* Live Captions (YouTube Style Overlay) */}
                {transcriptionOn && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-[90%] flex flex-col items-center pointer-events-none transition-all duration-300">
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

                {isMobile && <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />}
            </div>
        </div>
    );
}
