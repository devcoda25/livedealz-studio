import React, { memo } from "react";
import { Camera } from "../../shared/types";

interface MobileMultiCamSheetProps {
    isOpen: boolean;
    onClose: () => void;
    cameras: Camera[];
    activeCameraId: string;
    onSelectCamera: (id: string) => void;
    darkMode?: boolean;
}

const DEFAULT_CAMERAS: Camera[] = [
    { id: "front", label: "Front Camera", facing: "user", active: true },
    { id: "back", label: "Back Camera", facing: "environment", active: false },
];

export const MobileMultiCamSheet = memo(function MobileMultiCamSheet({
    isOpen,
    onClose,
    cameras = DEFAULT_CAMERAS,
    activeCameraId,
    onSelectCamera,
    darkMode = true,
}: MobileMultiCamSheetProps) {
    if (!isOpen) return null;

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
                    <h2 className={`${darkMode ? "text-white" : "text-slate-900"} text-[18px] font-black uppercase tracking-widest`}>Cameras</h2>
                    <button 
                        onClick={onClose} 
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? "bg-white/5 hover:bg-white/10 text-white/40" : "bg-slate-100 hover:bg-slate-200 text-slate-400"}`}
                    >
                        <span className="material-icons text-[18px]">close</span>
                    </button>
                </div>

                {/* Camera List */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="space-y-3">
                        {cameras.map((cam) => {
                            const isActive = cam.id === activeCameraId;
                            return (
                                <button
                                    key={cam.id}
                                    onClick={() => onSelectCamera(cam.id)}
                                    className={`
                                        w-full flex items-center gap-4 p-4 rounded-[28px] transition-all border relative
                                        ${isActive
                                            ? "bg-[#f77f00]/10 border-[#f77f00]/30 shadow-lg shadow-[#f77f00]/5"
                                            : `${darkMode ? "bg-white/5 border-transparent active:scale-[0.98]" : "bg-slate-50 border-transparent active:scale-[0.98]"}`
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center transition-all
                                        ${isActive
                                            ? "bg-[#f77f00] text-white shadow-lg shadow-[#f77f00]/30"
                                            : `${darkMode ? "bg-white/5 text-white/40" : "bg-white text-slate-400 shadow-sm"}`
                                        }
                                    `}>
                                        <span className="material-icons text-[24px]">
                                            {cam.facing === "user" ? "camera_front" : cam.facing === "environment" ? "camera_rear" : "videocam"}
                                        </span>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[14px] font-black truncate block uppercase tracking-tight`}>
                                            {cam.label}
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? "text-white/20" : "text-slate-400"}`}>
                                            {cam.facing === "user" ? "Selfie Mode" : cam.facing === "environment" ? "Main Rear" : "External Input"}
                                        </span>
                                    </div>
                                    {isActive && (
                                        <div className="w-6 h-6 rounded-full bg-[#f77f00] flex items-center justify-center animate-in zoom-in">
                                            <span className="material-icons text-white text-[14px]">check</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick Flip Button */}
                    <div className="mt-8 mb-4">
                        <button
                            onClick={() => {
                                const current = cameras.findIndex(c => c.id === activeCameraId);
                                const next = cameras[(current + 1) % cameras.length];
                                if (next) onSelectCamera(next.id);
                            }}
                            className="w-full py-4 rounded-2xl bg-[#f77f00] text-white text-[13px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-[#f77f00]/20"
                        >
                            <span className="material-icons text-[20px]">cameraswitch</span>
                            Flip Camera
                        </button>
                    </div>
                </div>

                <div className="h-safe" />
            </div>
        </>
    );
});

export default MobileMultiCamSheet;
