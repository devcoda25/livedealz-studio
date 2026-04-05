import React, { memo, useState } from "react";
import { Mode } from "../../shared/types";

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

    return (
        <>
            {/* Backdrop */}
            <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${darkMode ? "bg-black/60" : "bg-slate-900/40"} backdrop-blur-[2px]`} onClick={onClose} />
            
            {/* Bottom Sheet */}
            <div className={`
                fixed bottom-0 left-0 right-0 z-[100] rounded-t-[32px] animate-in slide-in-from-bottom duration-400 ease-out max-h-[85vh] flex flex-col
                ${darkMode ? "bg-[#121212]/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl" : "bg-white/95 backdrop-blur-2xl border-t border-slate-200 shadow-xl"}
            `}>
                {/* Drag Handle */}
                <div className="w-full flex justify-center pt-4 pb-1 cursor-pointer group" onClick={onClose}>
                    <div className={`w-12 h-1.5 rounded-full transition-colors ${darkMode ? "bg-white/10 group-hover:bg-white/20" : "bg-slate-200 group-hover:bg-slate-300"}`} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-2">
                    <h2 className={`${darkMode ? "text-white" : "text-slate-900"} text-[18px] font-black uppercase tracking-widest`}>Settings</h2>
                    <button 
                        onClick={onClose} 
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? "bg-white/5 hover:bg-white/10 text-white/40" : "bg-slate-100 hover:bg-slate-200 text-slate-400"}`}
                    >
                        <span className="material-icons text-[18px]">close</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className={`flex px-6 gap-6 border-b transition-colors ${darkMode ? "border-white/5" : "border-slate-100"}`}>
                    {(["video", "tools"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                                py-3 text-[12px] font-black uppercase tracking-widest transition-all relative
                                ${activeTab === tab
                                    ? "text-[#f77f00]"
                                    : darkMode ? "text-white/30" : "text-slate-400"
                                }
                            `}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#f77f00] rounded-full shadow-[0_0_8px_rgba(247,127,0,0.5)]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-6 py-6 pb-safe">
                    {activeTab === "video" && (
                        <div className="space-y-6">
                            {/* Quality Select */}
                            <div>
                                <label className={`${darkMode ? "text-white/40" : "text-slate-400"} text-[10px] font-black uppercase tracking-[0.2em] mb-3 block`}>Visual Quality</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {videoQualities.map((q) => (
                                        <button
                                            key={q.id}
                                            onClick={() => onVideoQualityChange(q.id)}
                                            className={`
                                                flex items-center justify-between p-4 rounded-2xl transition-all border group
                                                ${videoQuality === q.id
                                                    ? "bg-[#f77f00]/10 border-[#f77f00]/30 shadow-lg shadow-[#f77f00]/5"
                                                    : darkMode ? "bg-white/5 border-transparent active:bg-white/10" : "bg-slate-50 border-transparent active:bg-slate-100"
                                                }
                                            `}
                                        >
                                            <div className="flex flex-col items-start">
                                                <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[14px] font-bold`}>{q.label}</span>
                                                <span className={`text-[11px] ${darkMode ? "text-white/30" : "text-slate-400"}`}>{q.desc}</span>
                                            </div>
                                            <div className={`
                                                w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                                                ${videoQuality === q.id 
                                                    ? "border-[#f77f00] bg-[#f77f00]" 
                                                    : darkMode ? "border-white/10 bg-black/20" : "border-slate-200 bg-white"
                                                }
                                            `}>
                                                {videoQuality === q.id && <span className="material-icons text-white text-[14px]">check</span>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Appearance Switches */}
                            <div className="space-y-2">
                                <label className={`${darkMode ? "text-white/40" : "text-slate-400"} text-[10px] font-black uppercase tracking-[0.2em] mb-3 block`}>Appearance</label>
                                
                                <div className={`flex items-center justify-between p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-transparent" : "bg-slate-50 border-transparent"}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? "bg-white/5" : "bg-white shadow-sm"}`}>
                                            <span className={`material-icons text-[18px] ${darkMode ? "text-amber-400" : "text-slate-400"}`}>dark_mode</span>
                                        </div>
                                        <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[14px] font-bold`}>Dark Mode</span>
                                    </div>
                                    <button
                                        onClick={onToggleDarkMode}
                                        className={`w-12 h-7 rounded-full transition-all relative ${darkMode ? "bg-[#f77f00]" : "bg-slate-300"}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full bg-white absolute top-1 shadow-md transition-all ${darkMode ? "left-6" : "left-1"}`} />
                                    </button>
                                </div>

                                <div className={`flex items-center justify-between p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-transparent" : "bg-slate-50 border-transparent"}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? "bg-white/5" : "bg-white shadow-sm"}`}>
                                            <span className={`material-icons text-[18px] ${darkMode ? "text-indigo-400" : "text-slate-400"}`}>flip</span>
                                        </div>
                                        <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[14px] font-bold`}>Mirror Preview</span>
                                    </div>
                                    <button
                                        onClick={() => onMirrorVideoChange(!mirrorVideo)}
                                        className={`w-12 h-7 rounded-full transition-all relative ${mirrorVideo ? "bg-[#f77f00]" : "bg-slate-300"}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full bg-white absolute top-1 shadow-md transition-all ${mirrorVideo ? "left-6" : "left-1"}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "tools" && (
                        <div className="space-y-6">
                            <label className={`${darkMode ? "text-white/40" : "text-slate-400"} text-[10px] font-black uppercase tracking-[0.2em] mb-3 block`}>Active Overlay Tools</label>
                            <div className="grid grid-cols-2 gap-3">
                                {( [
                                    { id: "filters", label: "AR Filters", icon: "auto_awesome", color: "text-amber-400" },
                                    { id: "polls", label: "Live Polls", icon: "poll", color: "text-blue-400" },
                                    { id: "giveaways", label: "Giveaways", icon: "card_giftcard", color: "text-emerald-400" },
                                    { id: "multicam", label: "Multi-Cam", icon: "videocam", color: "text-indigo-400" },
                                    { id: "cohosts", label: "Co-Hosts", icon: "group", color: "text-pink-400" },
                                ] as const).map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => onOpenTool(t.id)}
                                        className={`
                                            flex flex-col items-center gap-3 p-5 rounded-[24px] transition-all border group
                                            ${darkMode ? "bg-white/5 border-transparent active:scale-95" : "bg-slate-50 border-transparent active:scale-95"}
                                        `}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${darkMode ? "bg-white/5 group-hover:bg-white/10" : "bg-white group-hover:bg-slate-100 shadow-sm"}`}>
                                            <span className={`material-icons ${t.color} text-2xl`}>{t.icon}</span>
                                        </div>
                                        <span className={`${darkMode ? "text-white/80" : "text-slate-600"} text-[12px] font-bold uppercase tracking-tight`}>{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className={`p-6 border-t transition-colors ${darkMode ? "border-white/5" : "border-slate-100"}`}>
                    <div className={`text-[10px] font-black uppercase tracking-[0.2em] text-center ${darkMode ? "text-white/20" : "text-slate-300"}`}>
                        LiveDeals Studio Pro v2.4
                    </div>
                </div>
            </div>
        </>
    );
});
export default MobileSettingsSheet;
