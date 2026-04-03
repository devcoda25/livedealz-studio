/**
 * MobileSourcesSheet - Native source management panel
 * 
 * Manage camera, screen share, images, and other sources.
 */

import React, { memo, useState } from "react";

interface Source {
    id: string;
    name: string;
    type: "camera" | "screen" | "image" | "video" | "audio" | "audioFile";
    icon: string;
    active: boolean;
    visible: boolean;
    isPlaying?: boolean;
}

interface MobileSourcesSheetProps {
    isOpen: boolean;
    onClose: () => void;
    sources: Source[];
    onToggleSource: (id: string) => void;
    onAddSource: (type: string) => void;
    onRemoveSource: (id: string) => void;
    onUploadAudio?: (file: File) => void;
    onPlayAudio?: (id: string) => void;
    onStopAudio?: (id: string) => void;
    darkMode?: boolean;
}

export const MobileSourcesSheet = memo(function MobileSourcesSheet({
    isOpen,
    onClose,
    sources,
    onToggleSource,
    onAddSource,
    onRemoveSource,
    onUploadAudio,
    onPlayAudio,
    onStopAudio,
    darkMode = true,
}: MobileSourcesSheetProps) {
    const [showAddMenu, setShowAddMenu] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onUploadAudio) {
            onUploadAudio(file);
        }
    };

    const addOptions = [
        { type: "camera", icon: "videocam", label: "Camera" },
        { type: "screen", icon: "screen_share", label: "Screen Share" },
        { type: "image", icon: "image", label: "Image" },
        { type: "video", icon: "movie", label: "Video" },
        { type: "audioFile", icon: "library_music", label: "Audio File" },
        { type: "audio", icon: "mic", label: "Mic" },
    ];

    return (
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50" onClick={onClose} />
            <div className={`fixed bottom-0 left-0 right-0 z-50 ${darkMode ? "bg-[#1C1C1E]" : "bg-white"} rounded-t-[24px] animate-in slide-in-from-bottom duration-300`}>
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className={`w-9 h-1 rounded-full ${darkMode ? "bg-white/20" : "bg-slate-300"}`} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-2">
                    <h2 className={`${darkMode ? "text-white" : "text-slate-900"} text-[17px] font-semibold`}>Sources</h2>
                    <button onClick={onClose} className={`w-7 h-7 rounded-full flex items-center justify-center ${darkMode ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500"}`}>
                        <span className="material-icons text-[16px]">close</span>
                    </button>
                </div>

                {/* Sources list */}
                <div className="px-4 py-2 max-h-[40vh] overflow-y-auto">
                    {sources.length === 0 ? (
                        <div className={`flex flex-col items-center justify-center py-8 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                            <span className="material-icons text-4xl mb-2">source</span>
                            <span className="text-sm">No sources yet</span>
                            <span className="text-xs mt-1">Tap + to add a source</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sources.map((source) => (
                                <div
                                    key={source.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? "bg-white/5" : "bg-slate-50"} ${!source.visible ? "opacity-50" : ""}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${source.active ? "bg-[#FF5C00]" : darkMode ? "bg-white/10" : "bg-slate-200"}`}>
                                        <span className={`material-icons text-[18px] ${source.active ? "text-white" : darkMode ? "text-white/60" : "text-slate-500"}`}>{source.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className={`${darkMode ? "text-white" : "text-slate-900"} text-sm font-medium truncate block`}>{source.name}</span>
                                        <span className={`text-[10px] ${darkMode ? "text-white/40" : "text-slate-400"} capitalize`}>{source.type}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {(source.type === "audioFile" || source.type === "audio") && (
                                            <button
                                                onClick={() => source.isPlaying ? onStopAudio?.(source.id) : onPlayAudio?.(source.id)}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center ${source.isPlaying ? "bg-[#FF5C00] text-white" : darkMode ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500"}`}
                                            >
                                                <span className="material-icons text-[16px]">{source.isPlaying ? "stop" : "play_arrow"}</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onToggleSource(source.id)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center ${source.visible ? "bg-emerald-500/20 text-emerald-400" : darkMode ? "bg-white/10 text-white/40" : "bg-slate-100 text-slate-400"}`}
                                        >
                                            <span className="material-icons text-[16px]">{source.visible ? "visibility" : "visibility_off"}</span>
                                        </button>
                                        <button
                                            onClick={() => onRemoveSource(source.id)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? "bg-white/10 text-red-400" : "bg-slate-100 text-red-500"}`}
                                        >
                                            <span className="material-icons text-[16px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add source button */}
                <div className="px-4 py-3">
                    {!showAddMenu ? (
                        <button
                            onClick={() => setShowAddMenu(true)}
                            className="w-full py-3 rounded-xl bg-[#FF5C00] text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <span className="material-icons text-[18px]">add</span>
                            Add Source
                        </button>
                    ) : (
                        <div className="grid grid-cols-5 gap-2">
                            {addOptions.map((opt) => (
                                <button
                                    key={opt.type}
                                    onClick={() => { 
                                        if (opt.type === "audioFile") {
                                            fileInputRef.current?.click();
                                        } else {
                                            onAddSource(opt.type); 
                                        }
                                        setShowAddMenu(false); 
                                    }}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl ${darkMode ? "bg-white/10" : "bg-slate-100"} active:scale-95 transition-transform`}
                                >
                                    <span className={`material-icons text-[20px] ${darkMode ? "text-white" : "text-slate-700"}`}>{opt.icon}</span>
                                    <span className={`text-[9px] ${darkMode ? "text-white/60" : "text-slate-500"}`}>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="audio/*" 
                    onChange={handleFileChange} 
                />

                <div className="h-safe" />
            </div>
        </>
    );
});

export default MobileSourcesSheet;
