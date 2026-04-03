import React, { memo, useState } from "react";
import { Mode } from "../shared/types";

interface MobileSettingsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    // Video
    videoQuality: string;
    onVideoQualityChange: (q: string) => void;
    mirrorVideo: boolean;
    onMirrorVideoChange: (v: boolean) => void;
    // Audio
    audioBitrate: string;
    onAudioBitrateChange: (b: string) => void;
    // Broadcast & Theme
    mode: Mode;
    onModeChange: (mode: Mode) => void;
    darkMode?: boolean;
    onToggleDarkMode: () => void;
    // Tool Triggers
    onOpenTool: (tool: "polls" | "giveaways" | "cohosts" | "multicam" | "filters") => void;
}

export const MobileSettingsSheet = memo(function MobileSettingsSheet({
    isOpen,
    onClose,
    videoQuality,
    onVideoQualityChange,
    audioBitrate,
    onAudioBitrateChange,
    mirrorVideo,
    onMirrorVideoChange,
    mode,
    onModeChange,
    darkMode = true,
    onToggleDarkMode,
    onOpenTool,
}: MobileSettingsSheetProps) {
    const [activeTab, setActiveTab] = useState<"video" | "tools">("video");

    if (!isOpen) return null;

    const videoQualities = [
        { id: "720p30", label: "720p 30fps", desc: "Recommended" },
        { id: "1080p30", label: "1080p 30fps", desc: "High quality" },
        { id: "480p30", label: "480p 30fps", desc: "Low bandwidth" },
    ];

    const audioBitrates = [
        { id: "128", label: "128 kbps", desc: "Standard" },
        { id: "192", label: "192 kbps", desc: "High quality" },
    ];

    return (
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50" onClick={onClose} />
            <div className={`fixed bottom-0 left-0 right-0 z-[100] ${darkMode ? "bg-[#1C1C1E]" : "bg-white"} rounded-t-[24px] animate-in slide-in-from-bottom duration-300 max-h-[85vh]`}>
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className={`w-9 h-1 rounded-full ${darkMode ? "bg-white/20" : "bg-slate-300"}`} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-2">
                    <h2 className={`${darkMode ? "text-white" : "text-slate-900"} text-[17px] font-semibold`}>Studio Settings</h2>
                    <button onClick={onClose} className={`w-7 h-7 rounded-full flex items-center justify-center ${darkMode ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500"}`}>
                        <span className="material-icons text-[16px]">close</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className={`flex px-5 gap-1 border-b ${darkMode ? "border-white/10" : "border-slate-200"}`}>
                    {(["video", "tools"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                                px-4 py-2.5 text-[13px] font-medium capitalize transition-all
                                ${activeTab === tab
                                    ? "text-[#FF5C00] border-b-2 border-[#FF5C00]"
                                    : darkMode ? "text-white/40" : "text-slate-400"
                                }
                            `}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="px-5 py-4 overflow-y-auto max-h-[55vh]">
                    {activeTab === "video" && (
                        <div className="space-y-4">
                            {/* Performance Mode / Quality */}
                            <div>
                                <label className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[11px] font-medium uppercase tracking-wider`}>Stream Quality</label>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    {videoQualities.map((q) => (
                                        <button
                                            key={q.id}
                                            onClick={() => onVideoQualityChange(q.id)}
                                            className={`
                                                flex flex-col items-start p-3 rounded-xl transition-all border
                                                ${videoQuality === q.id
                                                    ? "bg-[#FF5C00]/10 border-[#FF5C00]/50"
                                                    : darkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-transparent"
                                                }
                                            `}
                                        >
                                            <span className={`${darkMode ? "text-white" : "text-slate-900"} text-sm font-medium`}>{q.label}</span>
                                            <span className={`text-[10px] ${darkMode ? "text-white/40" : "text-slate-400"}`}>{q.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Appearance & Mirror */}
                            <div className="space-y-2">
                                <label className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[11px] font-medium uppercase tracking-wider`}>Appearance</label>
                                <div className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
                                    <span className={`${darkMode ? "text-white" : "text-slate-900"} text-sm`}>Dark Mode</span>
                                    <button
                                        onClick={onToggleDarkMode}
                                        className={`w-12 h-7 rounded-full transition-all relative ${darkMode ? "bg-[#FF5C00]" : "bg-slate-200"}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${darkMode ? "left-6" : "left-1"}`} />
                                    </button>
                                </div>
                                <div className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
                                    <span className={`${darkMode ? "text-white" : "text-slate-900"} text-sm`}>Mirror Preview</span>
                                    <button
                                        onClick={() => onMirrorVideoChange(!mirrorVideo)}
                                        className={`w-12 h-7 rounded-full transition-all relative ${mirrorVideo ? "bg-[#FF5C00]" : "bg-slate-200"}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${mirrorVideo ? "left-6" : "left-1"}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "tools" && (
                        <div className="space-y-4">
                            <label className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[11px] font-medium uppercase tracking-wider`}>Engagement Tools</label>
                            <div className="grid grid-cols-2 gap-3">
                                {([
                                    { id: "polls", label: "Live Polls", icon: "poll" },
                                    { id: "giveaways", label: "Giveaways", icon: "card_giftcard" },
                                    { id: "cohosts", label: "Co-Hosts", icon: "group" },
                                    { id: "multicam", label: "Multi-Cam", icon: "switch_video" },
                                    { id: "filters", label: "AR Filters", icon: "auto_awesome" },
                                ] as const).map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => onOpenTool(t.id)}
                                        className={`
                                            flex flex-col items-center gap-2 p-4 rounded-2xl transition-all
                                            ${darkMode ? "bg-white/5 active:bg-white/10" : "bg-slate-50 active:bg-slate-100"}
                                        `}
                                    >
                                        <span className={`material-icons ${darkMode ? "text-white/80" : "text-slate-600"} text-2xl`}>{t.icon}</span>
                                        <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[13px] font-medium`}>{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-safe p-4">
                    <p className={`text-[10px] text-center ${darkMode ? "text-white/20" : "text-slate-300"}`}>
                        LiveDealz Studio v2.4 • Session ID: {Math.random().toString(36).substring(7).toUpperCase()}
                    </p>
                </div>
            </div>
        </>
    );
});

export default MobileSettingsSheet;
