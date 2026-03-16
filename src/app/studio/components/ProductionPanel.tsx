import React, { useState, useRef, useEffect } from "react";
import { ProductionMode, ExternalTool, SourceId } from "./types";

export function ProductionPanel(props: {
    productionMode: ProductionMode;
    externalTool: ExternalTool;
    activeSourceId: SourceId;
    onChangeProductionMode: (v: ProductionMode) => void;
    onChangeExternalTool: (v: ExternalTool) => void;
    onChangeSource: (v: SourceId) => void;
    onClose: () => void;
}) {
    const { productionMode, externalTool, activeSourceId, onChangeProductionMode, onChangeExternalTool, onChangeSource, onClose } = props;

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest("button, input, select")) return;
        dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        e.preventDefault();
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragStartRef.current) return;
        setPosition({
            x: e.clientX - dragStartRef.current.x,
            y: e.clientY - dragStartRef.current.y
        });
    };

    const handleMouseUp = () => {
        dragStartRef.current = null;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if ((e.target as HTMLElement).closest("button, input, select")) return;
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
            y: touch.clientY - dragStartRef.current.y
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

    const sources = [
        { id: "cam1" as const, label: "Camera 1", desc: "USB/Integrated" },
        { id: "cam2" as const, label: "Camera 2", desc: "HDMI capture" },
        { id: "screen" as const, label: "Screen", desc: "Share window" },
        { id: "obs" as const, label: "OBS Program", desc: "Virtual cam / RTMP" },
        { id: "vmix" as const, label: "vMix Output", desc: "Switcher / RTMP" },
    ];

    const visibleSources = sources.filter((s) => {
        if (productionMode === "external") return s.id === (externalTool === "OBS" ? "obs" : "vmix");
        return s.id !== "obs" && s.id !== "vmix";
    });

    return (
        <div 
            ref={dialogRef}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[70] bg-card border border-border rounded-2xl p-3 flex flex-col gap-2 text-[11px] cursor-move touch-none shadow-2xl w-[380px] max-w-[90vw]"
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            <div className="flex items-center justify-between pointer-events-none">
                <h3 className="text-xs font-semibold">Production</h3>
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

            <div className="rounded-xl border border-border bg-muted p-2 text-[10px] text-foreground">
                {productionMode === "external" ? (
                    <>
                        Send one clean program feed from <span className="text-foreground font-semibold">{externalTool}</span> using Virtual Camera or RTMP.
                        Keep audio consistent for best AI translation accuracy.
                    </>
                ) : (
                    <>Use in-app sources and select the active camera below.</>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2">
                {visibleSources.map((s) => {
                    const active = s.id === activeSourceId;
                    return (
                        <button
                            key={s.id}
                            onClick={() => onChangeSource(s.id)}
                            className={`rounded-xl border px-2 py-2 text-left ${active ? "border-emerald-400 bg-emerald-500/10 text-emerald-200" : "border-border bg-muted text-foreground hover:border-muted-foreground"}`}
                        >
                            <div className="text-[10px] font-semibold">{s.label}</div>
                            <div className="text-[9px] text-muted-foreground">{s.desc}</div>
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center justify-between">
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-[10px] text-foreground hover:bg-secondary" onClick={() => alert("Copy ingest URL (demo)")}>
                    <span className="material-icons text-[14px]">content_copy</span>
                    Copy ingest
                </button>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-[10px] text-foreground hover:bg-secondary" onClick={() => alert("Open setup guide (demo)")}>
                    <span className="material-icons text-[14px]">menu_book</span>
                    Setup guide
                </button>
            </div>
        </div>
    );
}
