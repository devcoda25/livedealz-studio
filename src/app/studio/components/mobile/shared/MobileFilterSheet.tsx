import React, { memo } from "react";
import { RECORD_EFFECTS } from "../record/recordEffects";

interface MobileFilterSheetProps {
    isOpen: boolean;
    onClose: () => void;
    activeFilter: string;
    onSelectFilter: (id: string) => void;
    intensity: number;
    onIntensityChange: (value: number) => void;
    darkMode?: boolean;
}

export const MobileFilterSheet = memo(function MobileFilterSheet({
    isOpen,
    onClose,
    activeFilter,
    onSelectFilter,
    intensity,
    onIntensityChange,
    darkMode = true,
}: MobileFilterSheetProps) {
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
                    <h2 className={`${darkMode ? "text-white" : "text-slate-900"} text-[18px] font-black uppercase tracking-widest`}>Filters</h2>
                    <button 
                        onClick={onClose} 
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? "bg-white/5 hover:bg-white/10 text-white/40" : "bg-slate-100 hover:bg-slate-200 text-slate-400"}`}
                    >
                        <span className="material-icons text-[18px]">close</span>
                    </button>
                </div>

                {/* Filter Grid */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="grid grid-cols-3 gap-3">
                        {RECORD_EFFECTS.map((effect) => {
                            const isActive = effect.id === activeFilter;
                            return (
                                <button
                                    key={effect.id}
                                    onClick={() => onSelectFilter(effect.id)}
                                    className={`
                                        flex flex-col items-center gap-3 p-4 rounded-[28px] transition-all border group relative
                                        ${isActive
                                            ? "bg-[#f77f00]/10 border-[#f77f00]/30 shadow-lg shadow-[#f77f00]/5"
                                            : `${darkMode ? "bg-white/5 border-transparent active:scale-95" : "bg-slate-50 border-transparent active:scale-95"}`
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-14 h-14 rounded-2xl flex items-center justify-center transition-all bg-gradient-to-br ${effect.gradient}
                                        ${isActive
                                            ? "ring-2 ring-[#f77f00] shadow-lg shadow-[#f77f00]/30"
                                            : darkMode ? "opacity-90" : "opacity-95"
                                        }
                                    `}>
                                        <span className="material-icons text-[28px] text-white">{effect.icon}</span>
                                    </div>
                                    <span className={`
                                        text-[11px] font-black uppercase tracking-tight
                                        ${isActive
                                            ? "text-[#f77f00]"
                                            : darkMode ? "text-white/40" : "text-slate-500"
                                        }
                                    `}>
                                        {effect.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Intensity Slider */}
                {activeFilter !== "none" && (
                    <div className={`px-8 py-6 border-t animate-in slide-in-from-bottom-2 ${darkMode ? "border-white/5" : "border-slate-100"}`}>
                        <div className="flex items-center justify-between mb-4">
                            <span className={`${darkMode ? "text-white/40" : "text-slate-400"} text-[10px] font-black uppercase tracking-[0.2em]`}>
                                Filter Intensity
                            </span>
                            <span className={`px-2 py-1 rounded bg-[#f77f00]/10 text-[#f77f00] text-[12px] font-black`}>
                                {intensity}%
                            </span>
                        </div>
                        <div className="relative h-6 flex items-center">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={intensity}
                                onChange={(e) => onIntensityChange(parseInt(e.target.value))}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer relative z-10 bg-transparent"
                                style={{
                                    WebkitAppearance: 'none',
                                }}
                            />
                            {/* Custom Track */}
                            <div className="absolute inset-x-0 h-1.5 rounded-full bg-black/10 overflow-hidden">
                                <div 
                                    className="h-full bg-[#f77f00] shadow-[0_0_10px_rgba(247,127,0,0.5)]" 
                                    style={{ width: `${intensity}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="h-safe" />
            </div>
        </>
    );
});

export default MobileFilterSheet;
