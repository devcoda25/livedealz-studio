/**
 * MobileMultiCamSheet - Native camera switching
 * 
 * Switch between front/back cameras and external cameras
 */

import React, { memo } from "react";

interface Camera {
    id: string;
    label: string;
    facing: "user" | "environment" | "external";
    active: boolean;
}

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
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50" onClick={onClose} />
            <div className={`fixed bottom-0 left-0 right-0 z-50 ${darkMode ? "bg-[#1C1C1E]" : "bg-white"} rounded-t-[24px] animate-in slide-in-from-bottom duration-300`}>
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className={`w-9 h-1 rounded-full ${darkMode ? "bg-white/20" : "bg-slate-300"}`} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-2">
                    <h2 className={`${darkMode ? "text-white" : "text-slate-900"} text-[17px] font-semibold`}>Cameras</h2>
                    <button onClick={onClose} className={`w-7 h-7 rounded-full flex items-center justify-center ${darkMode ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500"}`}>
                        <span className="material-icons text-[16px]">close</span>
                    </button>
                </div>

                {/* Camera list */}
                <div className="px-4 py-3">
                    <div className="space-y-2">
                        {cameras.map((cam) => {
                            const isActive = cam.id === activeCameraId;
                            return (
                                <button
                                    key={cam.id}
                                    onClick={() => onSelectCamera(cam.id)}
                                    className={`
                                        w-full flex items-center gap-3 p-4 rounded-xl transition-all active:scale-[0.98]
                                        ${isActive
                                            ? "bg-[#FF5C00]/20 border-2 border-[#FF5C00]/50"
                                            : darkMode
                                                ? "bg-white/5 border-2 border-transparent"
                                                : "bg-slate-50 border-2 border-transparent"
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center
                                        ${isActive
                                            ? "bg-[#FF5C00] text-white"
                                            : darkMode
                                                ? "bg-white/10 text-white/60"
                                                : "bg-slate-100 text-slate-500"
                                        }
                                    `}>
                                        <span className="material-icons text-[22px]">
                                            {cam.facing === "user" ? "camera_front" : cam.facing === "environment" ? "camera_rear" : "videocam"}
                                        </span>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <span className={`${darkMode ? "text-white" : "text-slate-900"} text-sm font-medium block`}>
                                            {cam.label}
                                        </span>
                                        <span className={`text-[10px] ${darkMode ? "text-white/40" : "text-slate-400"} capitalize`}>
                                            {cam.facing === "user" ? "Selfie" : cam.facing === "environment" ? "Rear" : "External"}
                                        </span>
                                    </div>
                                    {isActive && (
                                        <span className="material-icons text-[#FF5C00] text-[22px]">check_circle</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick flip button */}
                    <div className="mt-4">
                        <button
                            onClick={() => {
                                const current = cameras.findIndex(c => c.id === activeCameraId);
                                const next = cameras[(current + 1) % cameras.length];
                                if (next) onSelectCamera(next.id);
                            }}
                            className="w-full py-3 rounded-xl bg-[#FF5C00] text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <span className="material-icons text-[18px]">cameraswitch</span>
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
