"use client";

import React, { useState } from "react";

interface PreLivePageProps {
    hostName?: string;
    storeHandle?: string;
    followerCount?: number;
    onGoLive: () => void;
    onOpenProducts: () => void;
    onOpenCampaigns: () => void;
    onOpenAnalytics: () => void; // kept for API compatibility (not shown in PreLive UI)
    onOpenSettings: () => void;
    onFlipCamera: () => void;
    onGoBack: () => void;
    darkMode?: boolean;
}

export function PreLivePage({
    hostName = "Studio Host",
    storeHandle: _storeHandle = "yourstore",
    followerCount: _followerCount = 12500,
    onGoLive,
    onOpenProducts,
    onOpenCampaigns,
    onOpenSettings,
    onFlipCamera,
    onGoBack,
    darkMode = true,
}: PreLivePageProps) {
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);

    const isReady = camOn && micOn;

    return (
        <div className={`absolute inset-0 relative pointer-events-auto ${darkMode ? "bg-[#0a0a0a]" : "bg-slate-50"}`}>
            {/* Header (no full-bleed video preview) */}
            <div className="relative h-[30%] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.18] pointer-events-none">
                    <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white blur-3xl" />
                    <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#f77f00] blur-3xl" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/30 pointer-events-none" />

                <div className="absolute top-0 left-0 right-0 px-4 pt-[env(safe-area-inset-top,0px)]">
                    <div className="flex items-center justify-between pt-3">
                        <button
                            onClick={onGoBack}
                            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
                            aria-label="Back"
                            type="button"
                        >
                            <span className="material-icons text-white text-[20px]">arrow_back</span>
                        </button>

                        <div className="flex flex-col items-center">
                            <p className="text-[10px] font-black tracking-[0.25em] uppercase text-white/50">Pre-live setup</p>
                            <p className="text-[12px] font-bold text-white/85 truncate max-w-[220px]">{hostName}</p>
                        </div>

                        <button
                            onClick={onOpenSettings}
                            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
                            aria-label="Settings"
                            type="button"
                        >
                            <span className="material-icons text-white text-[20px]">settings</span>
                        </button>
                    </div>
                </div>

                <div className="absolute left-4 right-4 bottom-4">
                    <div className="p-4 rounded-2xl bg-black/35 border border-white/10 backdrop-blur-md">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-white font-black text-[14px] truncate">Before you go live</p>
                                <p className="text-white/60 text-[12px] truncate">Check camera + mic, then hit Go Live.</p>
                            </div>
                            <div
                                className={`px-3 py-1.5 rounded-full border backdrop-blur-md ${
                                    isReady ? "bg-emerald-500/10 border-emerald-400/25" : "bg-rose-500/10 border-rose-400/25"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${isReady ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                                    <span className={`text-[12px] font-black ${isReady ? "text-emerald-300" : "text-rose-300"}`}>
                                        {isReady ? "Ready" : "Not ready"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div
                className={`h-[70%] ${darkMode ? "bg-[#0a0a0a]" : "bg-white"} overflow-y-auto`}
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 132px)" }}
            >
                <div className="px-4 pt-5 space-y-4">
                    {/* Preflight */}
                    <div className={`p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className={`font-black ${darkMode ? "text-white" : "text-slate-900"}`}>Pre-flight check</h3>
                            <span className={`${darkMode ? "text-white/50" : "text-slate-500"} text-xs font-semibold`}>
                                {isReady ? "All good" : "Fix setup"}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <ToggleTile
                                iconOn="videocam"
                                iconOff="videocam_off"
                                label="Camera"
                                on={camOn}
                                onToggle={() => setCamOn((v) => !v)}
                                darkMode={darkMode}
                            />
                            <ToggleTile
                                iconOn="mic"
                                iconOff="mic_off"
                                label="Microphone"
                                on={micOn}
                                onToggle={() => setMicOn((v) => !v)}
                                darkMode={darkMode}
                            />
                        </div>

                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={onFlipCamera}
                                className={`w-full px-4 py-3 rounded-2xl border flex items-center justify-between active:scale-[0.99] transition-transform ${
                                    darkMode ? "bg-black/20 border-white/10" : "bg-white border-slate-200"
                                }`}
                                aria-label="Flip camera"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                        <span className={`material-icons ${darkMode ? "text-white" : "text-slate-900"} text-[22px]`}>cameraswitch</span>
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-sm font-black ${darkMode ? "text-white" : "text-slate-900"}`}>Flip camera</p>
                                        <p className={`text-xs ${darkMode ? "text-white/50" : "text-slate-500"} font-semibold`}>Switch front/back</p>
                                    </div>
                                </div>
                                <span className={`material-icons ${darkMode ? "text-white/70" : "text-slate-500"} text-[20px]`}>chevron_right</span>
                            </button>
                        </div>
                    </div>

                    {/* Setup shortcuts (no landing-style stats) */}
                    <div className={`p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                        <h3 className={`font-black mb-3 ${darkMode ? "text-white" : "text-slate-900"}`}>Setup</h3>
                        <div className="space-y-2">
                            <SetupRow icon="inventory_2" label="Products" hint="Select items to sell" onClick={onOpenProducts} darkMode={darkMode} />
                            <SetupRow icon="campaign" label="Campaign" hint="Load your script/session" onClick={onOpenCampaigns} darkMode={darkMode} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Go Live Button (always visible above any bottom nav) */}
            <div className="absolute left-0 right-0 bottom-0 z-[200] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pointer-events-none">
                <div className={`absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t ${darkMode ? "from-[#0a0a0a]" : "from-white"} to-transparent pointer-events-none`} />
                <div className="mx-auto max-w-[520px] pointer-events-auto">
                    <button
                        onClick={onGoLive}
                        className="
                            w-full py-4 rounded-2xl text-white text-lg font-black uppercase tracking-wider
                            bg-gradient-to-r from-red-500 to-rose-600
                            shadow-lg shadow-red-500/30
                            active:scale-[0.98] transition-all
                            flex items-center justify-center gap-3
                        "
                        type="button"
                    >
                        <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
                        Go Live
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PreLivePage;

function ToggleTile({
    iconOn,
    iconOff,
    label,
    on,
    onToggle,
    darkMode,
}: {
    iconOn: string;
    iconOff: string;
    label: string;
    on: boolean;
    onToggle: () => void;
    darkMode: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={`p-4 rounded-2xl border flex items-center gap-3 active:scale-[0.99] transition-transform ${
                darkMode ? "bg-black/20 border-white/10" : "bg-white border-slate-200"
            }`}
            aria-label={on ? `Turn ${label} off` : `Turn ${label} on`}
        >
            <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${on ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>
                <span className={`material-icons ${on ? "text-emerald-400" : "text-rose-400"} text-[22px]`}>{on ? iconOn : iconOff}</span>
            </div>
            <div className="text-left">
                <p className={`text-sm font-black ${darkMode ? "text-white" : "text-slate-900"}`}>{label}</p>
                <p className={`text-xs ${on ? "text-emerald-400" : "text-rose-400"} font-bold`}>{on ? "On" : "Off"}</p>
            </div>
        </button>
    );
}

function SetupRow({
    icon,
    label,
    hint,
    onClick,
    darkMode,
}: {
    icon: string;
    label: string;
    hint: string;
    onClick: () => void;
    darkMode: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full px-4 py-3 rounded-2xl border flex items-center justify-between gap-3 active:scale-[0.99] transition-transform ${darkMode ? "bg-black/20 border-white/10" : "bg-white border-slate-200"}`}
            aria-label={label}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
                    <span className={`material-icons ${darkMode ? "text-white" : "text-slate-900"} text-[22px]`}>{icon}</span>
                </div>
                <div className="min-w-0 text-left">
                    <p className={`text-[13px] font-black ${darkMode ? "text-white" : "text-slate-900"}`}>{label}</p>
                    <p className={`text-[12px] ${darkMode ? "text-white/45" : "text-slate-500"} truncate`}>{hint}</p>
                </div>
            </div>
            <span className={`material-icons ${darkMode ? "text-white/70" : "text-slate-500"} text-[20px]`}>chevron_right</span>
        </button>
    );
}
