/**
 * MobileSettingsSheet - Native settings panel
 * 
 * Video, audio, and stream settings
 */

import React, { memo, useState } from "react";

interface MobileSettingsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    videoQuality: string;
    onVideoQualityChange: (q: string) => void;
    audioBitrate: string;
    onAudioBitrateChange: (b: string) => void;
    mirrorVideo: boolean;
    onMirrorVideoChange: (v: boolean) => void;
    darkMode?: boolean;
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
    darkMode = true,
}: MobileSettingsSheetProps) {
    const [activeTab, setActiveTab] = useState<"video" | "audio" | "stream">("video");

    if (!isOpen) return null;

    const videoQualities = [
        { id: "720p30", label: "720p 30fps", desc: "Recommended" },
        { id: "720p60", label: "720p 60fps", desc: "Smooth" },
        { id: "1080p30", label: "1080p 30fps", desc: "High quality" },
        { id: "1080p60", label: "1080p 60fps", desc: "Best quality" },
        { id: "480p30", label: "480p 30fps", desc: "Low bandwidth" },
    ];

    const audioBitrates = [
        { id: "128", label: "128 kbps", desc: "Standard" },
        { id: "192", label: "192 kbps", desc: "High quality" },
        { id: "256", label: "256 kbps", desc: "Studio" },
        { id: "64", label: "64 kbps", desc: "Low bandwidth" },
    ];

    return (
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50" onClick={onClose} />
            <div className={`fixed bottom-0 left-0 right-0 z-50 ${darkMode ? "bg-[#1C1C1E]" : "bg-white"} rounded-t-[24px] animate-in slide-in-from-bottom duration-300 max-h-[80vh]`}>
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className={`w-9 h-1 rounded-full ${darkMode ? "bg-white/20" : "bg-slate-300"}`} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-2">
                    <h2 className={`${darkMode ? "text-white" : "text-slate-900"} text-[17px] font-semibold`}>Settings</h2>
                    <button onClick={onClose} className={`w-7 h-7 rounded-full flex items-center justify-center ${darkMode ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500"}`}>
                        <span className="material-icons text-[16px]">close</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className={`flex px-5 gap-1 border-b ${darkMode ? "border-white/10" : "border-slate-200"}`}>
                    {(["video", "audio", "stream"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                                px-4 py-2.5 text-[13px] font-medium capitalize transition-all
                                ${activeTab === tab
                                    ? `${darkMode ? "text-white border-b-2 border-[#FF5C00]" : "text-slate-900 border-b-2 border-[#FF5C00]"}`
                                    : `${darkMode ? "text-white/40" : "text-slate-400"}`
                                }
                            `}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="px-5 py-4 overflow-y-auto max-h-[50vh]">
                    {activeTab === "video" && (
                        <div className="space-y-4">
                            {/* Video Quality */}
                            <div>
                                <label className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[11px] font-medium uppercase tracking-wider`}>Video Quality</label>
                                <div className="mt-2 space-y-2">
                                    {videoQualities.map((q) => (
                                        <button
                                            key={q.id}
                                            onClick={() => onVideoQualityChange(q.id)}
                                            className={`
                                                w-full flex items-center justify-between p-3 rounded-xl transition-all
                                                ${videoQuality === q.id
                                                    ? "bg-[#FF5C00]/20 border border-[#FF5C00]/50"
                                                    : darkMode ? "bg-white/5" : "bg-slate-50"
                                                }
                                            `}
                                        >
                                            <div>
                                                <span className={`${darkMode ? "text-white" : "text-slate-900"} text-sm font-medium`}>{q.label}</span>
                                                <span className={`block text-[10px] ${darkMode ? "text-white/40" : "text-slate-400"}`}>{q.desc}</span>
                                            </div>
                                            {videoQuality === q.id && (
                                                <span className="material-icons text-[#FF5C00] text-[20px]">check_circle</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mirror Video */}
                            <div className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
                                <div>
                                    <span className={`${darkMode ? "text-white" : "text-slate-900"} text-sm font-medium`}>Mirror Video</span>
                                    <span className={`block text-[10px] ${darkMode ? "text-white/40" : "text-slate-400"}`}>Flip horizontally</span>
                                </div>
                                <button
                                    onClick={() => onMirrorVideoChange(!mirrorVideo)}
                                    className={`
                                        w-12 h-7 rounded-full transition-all relative
                                        ${mirrorVideo ? "bg-[#FF5C00]" : darkMode ? "bg-white/20" : "bg-slate-200"}
                                    `}
                                >
                                    <div className={`
                                        w-5 h-5 rounded-full bg-white absolute top-1 transition-all
                                        ${mirrorVideo ? "left-6" : "left-1"}
                                    `} />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "audio" && (
                        <div className="space-y-4">
                            {/* Audio Bitrate */}
                            <div>
                                <label className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[11px] font-medium uppercase tracking-wider`}>Audio Bitrate</label>
                                <div className="mt-2 space-y-2">
                                    {audioBitrates.map((b) => (
                                        <button
                                            key={b.id}
                                            onClick={() => onAudioBitrateChange(b.id)}
                                            className={`
                                                w-full flex items-center justify-between p-3 rounded-xl transition-all
                                                ${audioBitrate === b.id
                                                    ? "bg-[#FF5C00]/20 border border-[#FF5C00]/50"
                                                    : darkMode ? "bg-white/5" : "bg-slate-50"
                                                }
                                            `}
                                        >
                                            <div>
                                                <span className={`${darkMode ? "text-white" : "text-slate-900"} text-sm font-medium`}>{b.label}</span>
                                                <span className={`block text-[10px] ${darkMode ? "text-white/40" : "text-slate-400"}`}>{b.desc}</span>
                                            </div>
                                            {audioBitrate === b.id && (
                                                <span className="material-icons text-[#FF5C00] text-[20px]">check_circle</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "stream" && (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-xl ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
                                <span className={`${darkMode ? "text-white" : "text-slate-900"} text-sm font-medium block mb-2`}>Stream Key</span>
                                <div className={`flex items-center gap-2 p-2 rounded-lg ${darkMode ? "bg-black/30" : "bg-white"}`}>
                                    <input
                                        type="password"
                                        value="sk_live_••••••••••••"
                                        readOnly
                                        className={`flex-1 bg-transparent text-sm ${darkMode ? "text-white" : "text-slate-900"} outline-none`}
                                    />
                                    <button className="text-[#FF5C00] text-[12px] font-medium">Copy</button>
                                </div>
                            </div>
                            <div className={`p-4 rounded-xl ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
                                <span className={`${darkMode ? "text-white" : "text-slate-900"} text-sm font-medium block mb-2`}>Stream URL</span>
                                <div className={`flex items-center gap-2 p-2 rounded-lg ${darkMode ? "bg-black/30" : "bg-white"}`}>
                                    <input
                                        type="text"
                                        value="rtmp://live.livedealz.com/stream"
                                        readOnly
                                        className={`flex-1 bg-transparent text-sm ${darkMode ? "text-white" : "text-slate-900"} outline-none`}
                                    />
                                    <button className="text-[#FF5C00] text-[12px] font-medium">Copy</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-safe" />
            </div>
        </>
    );
});

export default MobileSettingsSheet;
