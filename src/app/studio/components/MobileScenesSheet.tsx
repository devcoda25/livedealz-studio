/**
 * MobileScenesSheet - Native scene switcher
 * 
 * Switch between different camera/scene layouts
 */

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
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50" onClick={onClose} />
            <div className={`fixed bottom-0 left-0 right-0 z-50 ${darkMode ? "bg-[#1C1C1E]" : "bg-white"} rounded-t-[24px] animate-in slide-in-from-bottom duration-300`}>
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className={`w-9 h-1 rounded-full ${darkMode ? "bg-white/20" : "bg-slate-300"}`} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-2">
                    <h2 className={`${darkMode ? "text-white" : "text-slate-900"} text-[17px] font-semibold`}>Scenes</h2>
                    <button onClick={onClose} className={`w-7 h-7 rounded-full flex items-center justify-center ${darkMode ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500"}`}>
                        <span className="material-icons text-[16px]">close</span>
                    </button>
                </div>

                {/* Scenes grid */}
                <div className="px-4 py-3">
                    <div className="grid grid-cols-3 gap-3">
                        {scenes.map((scene) => {
                            const isActive = scene.id === activeSceneId;
                            return (
                                <button
                                    key={scene.id}
                                    onClick={() => onSelectScene(scene.id)}
                                    className={`
                                        flex flex-col items-center gap-2 p-3 rounded-xl transition-all active:scale-95
                                        ${isActive
                                            ? "bg-[#FF5C00]/20 border-2 border-[#FF5C00]"
                                            : darkMode
                                                ? "bg-white/5 border-2 border-transparent"
                                                : "bg-slate-50 border-2 border-transparent"
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-14 h-14 rounded-xl flex items-center justify-center
                                        ${isActive
                                            ? "bg-[#FF5C00] text-white"
                                            : darkMode
                                                ? "bg-white/10 text-white/60"
                                                : "bg-slate-100 text-slate-500"
                                        }
                                    `}>
                                        <span className="material-icons text-[24px]">{scene.icon}</span>
                                    </div>
                                    <span className={`
                                        text-[10px] font-medium text-center
                                        ${isActive
                                            ? "text-[#FF5C00]"
                                            : darkMode ? "text-white/60" : "text-slate-500"
                                        }
                                    `}>
                                        {scene.name}
                                    </span>
                                </button>
                            );
                        })}

                        {/* Add scene button */}
                        <button
                            onClick={onAddScene}
                            className={`
                                flex flex-col items-center gap-2 p-3 rounded-xl transition-all active:scale-95
                                ${darkMode ? "bg-white/5" : "bg-slate-50"}
                            `}
                        >
                            <div className={`
                                w-14 h-14 rounded-xl flex items-center justify-center border-2 border-dashed
                                ${darkMode ? "border-white/20 text-white/40" : "border-slate-300 text-slate-400"}
                            `}>
                                <span className="material-icons text-[24px]">add</span>
                            </div>
                            <span className={`text-[10px] font-medium ${darkMode ? "text-white/40" : "text-slate-400"}`}>
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
