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
        { type: "camera", icon: "videocam", label: "Camera", color: "text-blue-400" },
        { type: "screen", icon: "screen_share", label: "Screen", color: "text-emerald-400" },
        { type: "image", icon: "image", label: "Image", color: "text-amber-400" },
        { type: "video", icon: "movie", label: "Video", color: "text-indigo-400" },
        { type: "audioFile", icon: "library_music", label: "Audio", color: "text-pink-400" },
        { type: "audio", icon: "mic", label: "Mic", color: "text-red-400" },
    ];

    return (
        <>
            {/* Backdrop */}
            <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${darkMode ? "bg-black/60" : "bg-slate-900/40"} backdrop-blur-sm animate-in fade-in`} onClick={onClose} />
            
            {/* Bottom Sheet */}
            <div className={`
                fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] animate-in slide-in-from-bottom duration-400 ease-out max-h-[85vh] flex flex-col
                ${darkMode ? "bg-[#121212]/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl" : "bg-white/95 backdrop-blur-2xl border-t border-slate-200 shadow-xl"}
            `}>
                {/* Drag Handle */}
                <div className="w-full flex justify-center pt-4 pb-1 cursor-pointer group" onClick={onClose}>
                    <div className={`w-12 h-1.5 rounded-full transition-colors ${darkMode ? "bg-white/10 group-hover:bg-white/20" : "bg-slate-200 group-hover:bg-slate-300"}`} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-2">
                    <h2 className={`${darkMode ? "text-white" : "text-slate-900"} text-[18px] font-black uppercase tracking-widest`}>Sources</h2>
                    <button 
                        onClick={onClose} 
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? "bg-white/5 hover:bg-white/10 text-white/40" : "bg-slate-100 hover:bg-slate-200 text-slate-400"}`}
                    >
                        <span className="material-icons text-[18px]">close</span>
                    </button>
                </div>

                {/* Sources list */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {sources.length === 0 ? (
                        <div className={`flex flex-col items-center justify-center py-12 ${darkMode ? "text-white/20" : "text-slate-300"}`}>
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
                                <span className="material-icons text-5xl">layers</span>
                            </div>
                            <span className="text-sm font-black uppercase tracking-widest">No Sources Ready</span>
                            <span className="text-[10px] mt-2 font-bold uppercase opacity-50">Tap ADD to begin layout</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sources.map((source) => (
                                <div
                                    key={source.id}
                                    className={`
                                        flex items-center gap-4 p-4 rounded-[24px] transition-all border
                                        ${darkMode ? "bg-white/5 border-transparent" : "bg-slate-50 border-transparent"}
                                        ${!source.visible ? "opacity-40 grayscale" : ""}
                                    `}
                                >
                                    <div className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center transition-all
                                        ${source.active ? "bg-[#f77f00] text-white shadow-lg shadow-[#f77f00]/30" : `${darkMode ? "bg-white/5 text-white/40" : "bg-white text-slate-400 shadow-sm"}`}
                                    `}>
                                        <span className="material-icons text-[22px]">{source.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[14px] font-black truncate block uppercase tracking-tight`}>{source.name}</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? "text-white/20" : "text-slate-400"}`}>{source.type}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {(source.type === "audioFile" || source.type === "audio") && (
                                            <button
                                                onClick={() => source.isPlaying ? onStopAudio?.(source.id) : onPlayAudio?.(source.id)}
                                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${source.isPlaying ? "bg-[#f77f00] text-white shadow-lg shadow-[#f77f00]/30" : `${darkMode ? "bg-white/5 text-white/40 hover:text-white" : "bg-white text-slate-400 hover:text-slate-900 shadow-sm"}`}`}
                                            >
                                                <span className="material-icons text-[18px]">{source.isPlaying ? "stop" : "play_arrow"}</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onToggleSource(source.id)}
                                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${source.visible ? "bg-emerald-500/10 text-emerald-500" : `${darkMode ? "bg-white/5 text-white/20" : "bg-white text-slate-300 shadow-sm"}`}`}
                                        >
                                            <span className="material-icons text-[18px]">{source.visible ? "visibility" : "visibility_off"}</span>
                                        </button>
                                        <button
                                            onClick={() => onRemoveSource(source.id)}
                                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${darkMode ? "bg-white/5 text-white/20 hover:text-red-500 hover:bg-red-500/10" : "bg-white text-slate-300 hover:text-red-500 shadow-sm"}`}
                                        >
                                            <span className="material-icons text-[18px]">delete_outline</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add Menu */}
                <div className={`p-6 border-t ${darkMode ? "border-white/5" : "border-slate-100"}`}>
                    {!showAddMenu ? (
                        <button
                            onClick={() => setShowAddMenu(true)}
                            className="w-full py-4 rounded-2xl bg-[#f77f00] text-white text-[13px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-[#f77f00]/20"
                        >
                            <span className="material-icons text-[20px]">add_box</span>
                            New Source
                        </button>
                    ) : (
                        <div className="grid grid-cols-3 gap-3 animate-in zoom-in-95 duration-200">
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
                                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border group active:scale-95 ${darkMode ? "bg-white/5 border-transparent" : "bg-slate-50 border-transparent shadow-sm"}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${darkMode ? "bg-white/5" : "bg-white shadow-sm"}`}>
                                        <span className={`material-icons text-[22px] ${opt.color}`}>{opt.icon}</span>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${darkMode ? "text-white/60" : "text-slate-500"}`}>{opt.label}</span>
                                </button>
                            ))}
                            <button
                                onClick={() => setShowAddMenu(false)}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all border ${darkMode ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-red-50 border-red-100 text-red-500"}`}
                            >
                                <span className="material-icons text-[20px]">close</span>
                                <span className="text-[10px] font-black uppercase">Cancel</span>
                            </button>
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
