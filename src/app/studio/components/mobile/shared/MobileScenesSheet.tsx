import React, { memo } from "react";

interface Scene {
    id: string;
    name: string;
    icon: string;
    preview?: string;
}

interface MobileScenesSheetProps {
    isOpen: boolean;
    onClose: () => void;
    scenes: Scene[];
    activeSceneId: string;
    onSelectScene: (id: string) => void;
    onAddScene: () => void;
    darkMode?: boolean;
}

const DEFAULT_SCENES: Scene[] = [
    { id: "main", name: "Main Camera", icon: "videocam" },
    { id: "split", name: "Split Screen", icon: "splitscreen" },
    { id: "pip", name: "Picture in Picture", icon: "picture_in_picture" },
    { id: "guest", name: "Guest View", icon: "group" },
    { id: "product", name: "Product Focus", icon: "shopping_bag" },
    { id: "screen", name: "Screen Share", icon: "screen_share" },
];

export const MobileScenesSheet = memo(function MobileScenesSheet({
    isOpen,
    onClose,
    scenes = DEFAULT_SCENES,
    activeSceneId,
    onSelectScene,
    onAddScene,
    darkMode = true,
}: MobileScenesSheetProps) {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${darkMode ? "bg-black/60" : "bg-slate-900/40"} backdrop-blur-sm animate-in fade-in`} onClick={onClose} />
            
            {/* Bottom Sheet */}
            <div className={`
                fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] animate-in slide-in-from-bottom duration-400 ease-out max-h-[85vh] flex flex-col
                ${darkMode ? "bg-[#121212]/90 backdrop-blur-3xl border-t border-white/10 shadow-2xl" : "bg-white/90 backdrop-blur-3xl border-t border-slate-200 shadow-xl"}
            `}>
                {/* Drag Handle */}
                <div className="w-full flex justify-center pt-4 pb-1 cursor-pointer group" onClick={onClose}>
                    <div className={`w-12 h-1.5 rounded-full transition-colors ${darkMode ? "bg-white/10 group-hover:bg-white/20" : "bg-slate-200 group-hover:bg-slate-300"}`} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-2">
                    <h2 className={`${darkMode ? "text-white" : "text-slate-900"} text-[18px] font-black uppercase tracking-widest`}>Scenes</h2>
                    <button 
                        onClick={onClose} 
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? "bg-white/5 hover:bg-white/10 text-white/40" : "bg-slate-100 hover:bg-slate-200 text-slate-400"}`}
                    >
                        <span className="material-icons text-[18px]">close</span>
                    </button>
                </div>

                {/* Scenes Grid */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="grid grid-cols-3 gap-3">
                        {scenes.map((scene) => {
                            const isActive = scene.id === activeSceneId;
                            return (
                                <button
                                    key={scene.id}
                                    onClick={() => onSelectScene(scene.id)}
                                    className={`
                                        flex flex-col items-center gap-3 p-4 rounded-[28px] transition-all border group relative
                                        ${isActive
                                            ? "bg-[#f77f00]/10 border-[#f77f00]/30 shadow-lg shadow-[#f77f00]/5"
                                            : `${darkMode ? "bg-white/5 border-transparent active:scale-95" : "bg-slate-50 border-transparent active:scale-95"}`
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-14 h-14 rounded-2xl flex items-center justify-center transition-all
                                        ${isActive
                                            ? "bg-[#f77f00] text-white shadow-lg shadow-[#f77f00]/30"
                                            : `${darkMode ? "bg-white/5 text-white/40 group-hover:bg-white/10" : "bg-white shadow-sm text-slate-400 group-hover:text-slate-600"}`
                                        }
                                    `}>
                                        <span className="material-icons text-[28px]">{scene.icon}</span>
                                    </div>
                                    <span className={`
                                        text-[11px] font-black uppercase tracking-tight text-center leading-tight
                                        ${isActive
                                            ? "text-[#f77f00]"
                                            : darkMode ? "text-white/40" : "text-slate-500"
                                        }
                                    `}>
                                        {scene.name}
                                    </span>
                                    {isActive && (
                                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#f77f00] shadow-[0_0_8px_rgba(247,127,0,0.8)]" />
                                    )}
                                </button>
                            );
                        })}

                        {/* Add scene button */}
                        <button
                            onClick={onAddScene}
                            className={`
                                flex flex-col items-center gap-3 p-4 rounded-[28px] transition-all border border-dashed
                                ${darkMode ? "bg-white/5 border-white/10 active:scale-95" : "bg-slate-50 border-slate-200 active:scale-95"}
                            `}
                        >
                            <div className={`
                                w-14 h-14 rounded-2xl flex items-center justify-center
                                ${darkMode ? "text-white/20" : "text-slate-300"}
                            `}>
                                <span className="material-icons text-[32px]">add_circle_outline</span>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-tight ${darkMode ? "text-white/20" : "text-slate-400"}`}>
                                Add Scene
                            </span>
                        </button>
                    </div>
                </div>

                <div className="h-safe" />
            </div>
        </>
    );
});

export default MobileScenesSheet;
