import React, { useState, useRef, useEffect, useCallback } from "react";
import { ProductionMode, ExternalTool, SourceId } from "../shared/types";
import { useToast } from "@/hooks/use-toast";

interface CameraDevice {
    deviceId: string;
    label: string;
    kind: "videoinput";
}

interface CameraPreview {
    deviceId: string;
    stream: MediaStream | null;
    error: string | null;
}

export function ProductionPanel(props: {
    productionMode: ProductionMode;
    externalTool: ExternalTool;
    activeSourceId: SourceId;
    onChangeProductionMode: (v: ProductionMode) => void;
    onChangeExternalTool: (v: ExternalTool) => void;
    onChangeSource: (v: SourceId) => void;
    onClose: () => void;
    onCameraSwitch?: (deviceId: string | null) => void; // Callback when camera is switched
}) {
    const { productionMode, externalTool, activeSourceId, onChangeProductionMode, onChangeExternalTool, onChangeSource, onClose, onCameraSwitch } = props;
    const { toast } = useToast();

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [cameras, setCameras] = useState<CameraDevice[]>([]);
    const [cameraPreviews, setCameraPreviews] = useState<Map<string, CameraPreview>>(new Map());
    const [isEnumerating, setIsEnumerating] = useState(false);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const previewVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

    // Enumerate cameras when panel opens
    const enumerateCameras = useCallback(async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            setPermissionError("Camera enumeration not supported in this browser");
            return;
        }

        setIsEnumerating(true);
        setPermissionError(null);

        try {
            // Get devices WITHOUT requesting new permission (use existing stream if available)
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices
                .filter((d) => d.kind === "videoinput")
                .map((d) => ({
                    deviceId: d.deviceId,
                    label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
                    kind: d.kind as "videoinput",
                }));

            setCameras(videoDevices);

            // Initialize preview map
            const previewMap = new Map<string, CameraPreview>();
            videoDevices.forEach((cam) => {
                previewMap.set(cam.deviceId, { deviceId: cam.deviceId, stream: null, error: null });
            });
            setCameraPreviews(previewMap);
        } catch (err: any) {
            console.error("Error enumerating cameras:", err);
            setPermissionError(`Error accessing cameras: ${err.message}`);
        } finally {
            setIsEnumerating(false);
        }
    }, []);

    // Start camera preview
    const startPreview = useCallback(async (deviceId: string) => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraPreviews((prev) => {
                const newMap = new Map(prev);
                newMap.set(deviceId, { deviceId, stream: null, error: "getUserMedia not supported" });
                return newMap;
            });
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId }, width: { ideal: 320 }, height: { ideal: 240 } },
                audio: false,
            });

            setCameraPreviews((prev) => {
                const newMap = new Map(prev);
                // Stop any existing stream for this device
                const existing = prev.get(deviceId);
                if (existing?.stream) {
                    existing.stream.getTracks().forEach((t) => t.stop());
                }
                newMap.set(deviceId, { deviceId, stream, error: null });
                return newMap;
            });
        } catch (err: any) {
            console.error(`Error starting preview for ${deviceId}:`, err);
            setCameraPreviews((prev) => {
                const newMap = new Map(prev);
                newMap.set(deviceId, { deviceId, stream: null, error: err.message || "Failed to start" });
                return newMap;
            });
        }
    }, []);

    // Stop camera preview
    const stopPreview = useCallback((deviceId: string) => {
        setCameraPreviews((prev) => {
            const existing = prev.get(deviceId);
            if (existing?.stream) {
                existing.stream.getTracks().forEach((t) => t.stop());
            }
            const newMap = new Map(prev);
            newMap.set(deviceId, { deviceId, stream: null, error: null });
            return newMap;
        });
    }, []);

    // Enumerate cameras on mount
    useEffect(() => {
        enumerateCameras();
    }, []);

    // Only notify parent when user manually selects a camera, not on initial enumeration
    // This prevents camera conflicts when switching
    useEffect(() => {
        // Don't auto-switch on mount - let user choose
    }, [cameras]);

    // Cleanup streams on unmount
    useEffect(() => {
        return () => {
            cameraPreviews.forEach((preview) => {
                if (preview.stream) {
                    preview.stream.getTracks().forEach((t) => t.stop());
                }
            });
        };
    }, []);

    // Drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest("button, input, select, video")) return;
        dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        e.preventDefault();
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragStartRef.current) return;
        setPosition({
            x: e.clientX - dragStartRef.current.x,
            y: e.clientY - dragStartRef.current.y,
        });
    };

    const handleMouseUp = () => {
        dragStartRef.current = null;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if ((e.target as HTMLElement).closest("button, input, select, video")) return;
        const touch = e.touches[0];
        dragStartRef.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("touchend", handleTouchEnd);
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!dragStartRef.current) return;
        e.preventDefault();
        const touch = e.touches[0];
        setPosition({
            x: touch.clientX - dragStartRef.current.x,
            y: touch.clientY - dragStartRef.current.y,
        });
    };

    const handleTouchEnd = () => {
        dragStartRef.current = null;
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
    };

    useEffect(() => {
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleTouchEnd);
        };
    }, []);

    // Static sources for external tools
    const externalSources = [
        { id: "obs" as const, label: "OBS Studio", desc: "Virtual Camera / RTMP" },
        { id: "vmix" as const, label: "vMix", desc: "Switcher / RTMP" },
    ];

    // Get current active camera device ID
    const getActiveCameraDeviceId = () => {
        if (activeSourceId === "cam1" && cameras.length > 0) return cameras[0].deviceId;
        if (activeSourceId === "cam2" && cameras.length > 1) return cameras[1].deviceId;
        return null;
    };

    // Handle source selection - switch main preview to selected camera
    const handleCameraSelect = (index: number) => {
        const sourceMap: Record<number, SourceId> = { 0: "cam1", 1: "cam2" };
        if (index < cameras.length) {
            const selectedCamera = cameras[index];
            onChangeSource(sourceMap[index] || "cam1");
            
            // Notify parent to switch the main preview to this camera
            onCameraSwitch?.(selectedCamera.deviceId);
        }
    };

    // Get preview stream for camera index
    const getPreviewForIndex = (index: number): CameraPreview | null => {
        if (index < cameras.length) {
            return cameraPreviews.get(cameras[index].deviceId) || null;
        }
        return null;
    };

    return (
        <div
            ref={dialogRef}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[70] bg-card border border-border rounded-2xl p-3 flex flex-col gap-2 text-[11px] cursor-move touch-none shadow-2xl w-[420px] max-w-[95vw]"
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            <div className="flex items-center justify-between pointer-events-none">
                <h3 className="text-xs font-semibold">Multi-Camera</h3>
                <button
                    onClick={onClose}
                    className="pointer-events-auto p-1 hover:bg-secondary rounded-full transition-colors -mt-1 -mr-1"
                >
                    <span className="material-icons text-sm text-muted-foreground">close</span>
                </button>
            </div>

            <div className="flex items-center justify-between gap-2">
                <div className="inline-flex rounded-full bg-muted border border-border p-0.5 text-[10px]">
                    <button
                        className={`px-2.5 py-1 rounded-full ${productionMode === "inapp" ? "bg-primary text-primary-foreground" : "text-foreground"}`}
                        onClick={() => onChangeProductionMode("inapp")}
                    >
                        In-app
                    </button>
                    <button
                        className={`px-2.5 py-1 rounded-full ${productionMode === "external" ? "bg-primary text-primary-foreground" : "text-foreground"}`}
                        onClick={() => onChangeProductionMode("external")}
                    >
                        OBS/vMix
                    </button>
                </div>

                {productionMode === "external" && (
                    <select
                        className="px-2 py-1 rounded-full border border-border bg-card text-foreground text-[10px]"
                        value={externalTool}
                        onChange={(e) => onChangeExternalTool(e.target.value as ExternalTool)}
                    >
                        <option value="OBS">OBS Studio</option>
                        <option value="vMix">vMix</option>
                    </select>
                )}
            </div>

            {productionMode === "external" ? (
                <div className="rounded-xl border border-border bg-muted p-2 text-[10px] text-foreground">
                    Send one clean program feed from <span className="text-foreground font-semibold">{externalTool}</span> using Virtual Camera or RTMP.
                    Keep audio consistent for best AI translation accuracy.
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-muted p-2 text-[10px] text-foreground flex items-center justify-between">
                    <span>Select active camera below. Click refresh to rescan.</span>
                    <button
                        onClick={enumerateCameras}
                        disabled={isEnumerating}
                        className="px-2 py-1 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                    >
                        {isEnumerating ? "Scanning..." : "⟳ Refresh"}
                    </button>
                </div>
            )}

            {/* Camera Sources */}
            {productionMode === "inapp" && (
                <>
                    {permissionError ? (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[10px] text-red-200">
                            {permissionError}
                        </div>
                    ) : cameras.length === 0 && !isEnumerating ? (
                        <div className="rounded-xl border border-border bg-muted p-4 text-center text-[10px] text-muted-foreground">
                            {isEnumerating ? "Scanning for cameras..." : "No cameras found. Click refresh to scan."}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {/* Camera 1 */}
                            <button
                                onClick={() => handleCameraSelect(0)}
                                className={`rounded-xl border px-2 py-2 text-left transition-all ${
                                    activeSourceId === "cam1"
                                        ? "border-emerald-600 dark:border-emerald-400 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                                        : "border-border bg-muted text-foreground hover:border-muted-foreground"
                                }`}
                            >
                                <div className="text-[10px] font-semibold truncate">
                                    {cameras[0]?.label || "Camera 1"}
                                </div>
                                <div className="text-[9px] text-muted-foreground">
                                    {cameras[0] ? (cameras[0].deviceId.slice(0, 12) + "...") : "No camera"}
                                </div>
                                {/* Status indicator - no preview to avoid camera conflict */}
                                <div className="mt-2 rounded-lg overflow-hidden bg-muted/50 aspect-video relative flex items-center justify-center">
                                    <span className="material-icons text-[20px] text-muted-foreground">videocam</span>
                                </div>
                            </button>

                            {/* Camera 2 */}
                            <button
                                onClick={() => handleCameraSelect(1)}
                                disabled={cameras.length < 2}
                                className={`rounded-xl border px-2 py-2 text-left transition-all ${
                                    activeSourceId === "cam2"
                                        ? "border-emerald-600 dark:border-emerald-400 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                                        : cameras.length < 2
                                        ? "border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
                                        : "border-border bg-muted text-foreground hover:border-muted-foreground"
                                }`}
                            >
                                <div className="text-[10px] font-semibold truncate">
                                    {cameras[1]?.label || (cameras.length < 2 ? "No Camera 2" : "Camera 2")}
                                </div>
                                <div className="text-[9px] text-muted-foreground">
                                    {cameras[1] ? (cameras[1].deviceId.slice(0, 12) + "...") : cameras.length < 2 ? "Not available" : "Loading..."}
                                </div>
                                {/* Status indicator - no preview to avoid camera conflict */}
                                <div className="mt-2 rounded-lg overflow-hidden bg-muted/50 aspect-video relative flex items-center justify-center">
                                    {cameras.length >= 2 ? (
                                        <span className="material-icons text-[20px] text-muted-foreground">videocam</span>
                                    ) : (
                                        <span className="material-icons text-[20px] text-muted-foreground/50">videocam_off</span>
                                    )}
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Screen Share Option */}
                    <button
                        onClick={() => onChangeSource("screen")}
                        className={`rounded-xl border px-2 py-2 text-left transition-all ${
                            activeSourceId === "screen"
                                ? "border-emerald-600 dark:border-emerald-400 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                                : "border-border bg-muted text-foreground hover:border-muted-foreground"
                        }`}
                    >
                        <div className="text-[10px] font-semibold">Screen Share</div>
                        <div className="text-[9px] text-muted-foreground">Share screen or window</div>
                    </button>
                </>
            )}

            {/* External Tools */}
            {productionMode === "external" && (
                <div className="grid grid-cols-2 gap-2">
                    {externalSources.map((s) => {
                        const isActive = (s.id === "obs" && externalTool === "OBS") || (s.id === "vmix" && externalTool === "vMix");
                        return (
                            <button
                                key={s.id}
                                onClick={() => onChangeExternalTool(s.id === "obs" ? "OBS" : "vMix")}
                                className={`rounded-xl border px-2 py-2 text-left ${
                                    isActive
                                        ? "border-emerald-600 dark:border-emerald-400 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                                        : "border-border bg-muted text-foreground hover:border-muted-foreground"
                                }`}
                            >
                                <div className="text-[10px] font-semibold">{s.label}</div>
                                <div className="text-[9px] text-muted-foreground">{s.desc}</div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-1">
                <button
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-[10px] text-foreground hover:bg-secondary"
                    onClick={() => {
                        // Copy RTMP ingest URL to clipboard
                        const url = productionMode === "external" 
                            ? (externalTool === "OBS" ? "rtmp://live.obsproject.com/live" : "rtmp://live.vmix.com/live")
                            : "In-app (no RTMP needed)";
                        navigator.clipboard.writeText(url);
                        toast({
                            title: "Ingest URL Copied",
                            description: url,
                            variant: "default",
                        });
                    }}
                >
                    <span className="material-icons text-[14px]">content_copy</span>
                    Copy ingest
                </button>
                <button
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-[10px] text-foreground hover:bg-secondary"
                    onClick={() => {
                        const setupInfo = productionMode === "external"
                            ? `1. In ${externalTool}, go to Settings > Stream\n2. Set Service to "Custom..."\n3. Server: ${externalTool === "OBS" ? "rtmp://live.obsproject.com/live" : "rtmp://live.vmix.com/live"}\n4. Enter Stream Key from dashboard\n5. Start streaming!`
                            : "Connect additional cameras via USB. Click Refresh to detect them.";
                        toast({
                            title: productionMode === "external" ? `${externalTool} Setup` : "Multi-Camera Setup",
                            description: setupInfo,
                            variant: "default",
                        });
                    }}
                >
                    <span className="material-icons text-[14px]">menu_book</span>
                    Setup guide
                </button>
            </div>

            {/* Active Source Indicator */}
            <div className="text-[9px] text-center text-muted-foreground pt-1 border-t border-border">
                Active: <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    {productionMode === "external" 
                        ? `${externalTool} Output` 
                        : activeSourceId === "screen" 
                            ? "Screen Share" 
                            : cameras.find((c, i) => (i === 0 && activeSourceId === "cam1") || (i === 1 && activeSourceId === "cam2"))?.label || "Camera"}
                </span>
            </div>
        </div>
    );
}
