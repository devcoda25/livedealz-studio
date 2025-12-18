import React from "react";
import { ProductionMode, ExternalTool, SourceId } from "./types";

export function ProductionPanel(props: {
    productionMode: ProductionMode;
    externalTool: ExternalTool;
    activeSourceId: SourceId;
    onChangeProductionMode: (v: ProductionMode) => void;
    onChangeExternalTool: (v: ExternalTool) => void;
    onChangeSource: (v: SourceId) => void;
}) {
    const { productionMode, externalTool, activeSourceId, onChangeProductionMode, onChangeExternalTool, onChangeSource } = props;

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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 text-[11px]">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold">Production</h3>
                <span className="text-[10px] text-slate-500">Multi-camera</span>
            </div>

            <div className="flex items-center justify-between gap-2">
                <div className="inline-flex rounded-full bg-slate-950 border border-slate-800 p-0.5 text-[10px]">
                    <button
                        className={`px-2.5 py-1 rounded-full ${productionMode === "inapp" ? "bg-white text-slate-900" : "text-slate-300"}`}
                        onClick={() => onChangeProductionMode("inapp")}
                    >
                        In-app
                    </button>
                    <button
                        className={`px-2.5 py-1 rounded-full ${productionMode === "external" ? "bg-white text-slate-900" : "text-slate-300"}`}
                        onClick={() => onChangeProductionMode("external")}
                    >
                        OBS/vMix
                    </button>
                </div>

                {productionMode === "external" && (
                    <select
                        className="px-2 py-1 rounded-full border border-slate-700 bg-slate-950 text-slate-100 text-[10px]"
                        value={externalTool}
                        onChange={(e) => onChangeExternalTool(e.target.value as ExternalTool)}
                    >
                        <option value="OBS">OBS Studio</option>
                        <option value="vMix">vMix</option>
                    </select>
                )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-[10px] text-slate-300">
                {productionMode === "external" ? (
                    <>
                        Send one clean program feed from <span className="text-slate-100 font-semibold">{externalTool}</span> using Virtual Camera or RTMP.
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
                            className={`rounded-xl border px-2 py-2 text-left ${active ? "border-emerald-400 bg-emerald-500/10 text-emerald-200" : "border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-600"}`}
                        >
                            <div className="text-[10px] font-semibold">{s.label}</div>
                            <div className="text-[9px] text-slate-500">{s.desc}</div>
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center justify-between">
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-700 text-[10px] text-slate-100 hover:bg-slate-900" onClick={() => alert("Copy ingest URL (demo)")}>
                    <span className="material-icons text-[14px]">content_copy</span>
                    Copy ingest
                </button>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-700 text-[10px] text-slate-100 hover:bg-slate-900" onClick={() => alert("Open setup guide (demo)")}>
                    <span className="material-icons text-[14px]">menu_book</span>
                    Setup guide
                </button>
            </div>
        </div>
    );
}
