/**
 * MobileFilterSheet - Native iOS/Android style filter picker
 * 
 * Bottom sheet with:
 * - Category tabs (Beauty, Color, Background, etc.)
 * - Filter grid with thumbnails
 * - Intensity slider
 */

import React, { memo, useState } from "react";

interface Filter {
    id: string;
    name: string;
    icon: string;
    category: string;
}

interface MobileFilterSheetProps {
    isOpen: boolean;
    onClose: () => void;
    activeFilter: string;
    onSelectFilter: (id: string) => void;
    intensity: number;
    onIntensityChange: (value: number) => void;
    darkMode?: boolean;
}

const FILTER_CATEGORIES = [
    { id: "none", name: "None", icon: "block" },
    { id: "beauty", name: "Beauty", icon: "face_retouching_natural" },
    { id: "color", name: "Color", icon: "palette" },
    { id: "background", name: "BG", icon: "wallpaper" },
    { id: "effects", name: "Effects", icon: "auto_awesome" },
    { id: "ar", name: "AR", icon: "view_in_ar" },
];

const FILTERS: Filter[] = [
    // None
    { id: "none", name: "None", icon: "block", category: "none" },
    // Beauty
    { id: "smooth", name: "Smooth", icon: "spa", category: "beauty" },
    { id: "glow", name: "Glow", icon: "wb_sunny", category: "beauty" },
    { id: "slim", name: "Slim", icon: "accessibility_new", category: "beauty" },
    { id: "eyes", name: "Eyes", icon: "visibility", category: "beauty" },
    // Color
    { id: "warm", name: "Warm", icon: "local_fire_department", category: "color" },
    { id: "cool", name: "Cool", icon: "ac_unit", category: "color" },
    { id: "vintage", name: "Vintage", icon: "camera", category: "color" },
    { id: "bw", name: "B&W", icon: "contrast", category: "color" },
    { id: "vivid", name: "Vivid", icon: "tune", category: "color" },
    // Background
    { id: "blur", name: "Blur", icon: "blur_on", category: "background" },
    { id: "replace", name: "Replace", icon: "insert_photo", category: "background" },
    { id: "bokeh", name: "Bokeh", icon: "blur_circular", category: "background" },
    // Effects
    { id: "sparkle", name: "Sparkle", icon: "stars", category: "effects" },
    { id: "confetti", name: "Confetti", icon: "celebration", category: "effects" },
    { id: "hearts", name: "Hearts", icon: "favorite", category: "effects" },
    { id: "glitch", name: "Glitch", icon: "electric_bolt", category: "effects" },
    // AR
    { id: "mask", name: "Mask", icon: "face", category: "ar" },
    { id: "glasses", name: "Glasses", icon: "visibility", category: "ar" },
    { id: "hat", name: "Hat", icon: "emoji_objects", category: "ar" },
];

export const MobileFilterSheet = memo(function MobileFilterSheet({
    isOpen,
    onClose,
    activeFilter,
    onSelectFilter,
    intensity,
    onIntensityChange,
    darkMode = true,
}: MobileFilterSheetProps) {
    const [activeCategory, setActiveCategory] = useState("beauty");

    if (!isOpen) return null;

    const filteredFilters = FILTERS.filter(f =>
        activeCategory === "none" ? f.category === "none" : f.category === activeCategory
    );

    const selectedFilter = FILTERS.find(f => f.id === activeFilter);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className={`
                fixed bottom-0 left-0 right-0 z-50
                ${darkMode ? "bg-[#1C1C1E]" : "bg-white"}
                rounded-t-[24px] overflow-hidden
                animate-in slide-in-from-bottom duration-300
            `}>
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className={`w-9 h-1 rounded-full ${darkMode ? "bg-white/20" : "bg-slate-300"}`} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-2">
                    <h2 className={`${darkMode ? "text-white" : "text-slate-900"} text-[17px] font-semibold`}>
                        Filters
                    </h2>
                    <button
                        onClick={onClose}
                        className={`
                            w-7 h-7 rounded-full flex items-center justify-center
                            ${darkMode ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500"}
                        `}
                    >
                        <span className="material-icons text-[16px]">close</span>
                    </button>
                </div>

                {/* Category pills */}
                <div className="flex gap-2 px-5 py-2 overflow-x-auto scrollbar-hide">
                    {FILTER_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`
                                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium
                                whitespace-nowrap transition-all duration-150
                                ${activeCategory === cat.id
                                    ? "bg-[#FF5C00] text-white"
                                    : darkMode
                                        ? "bg-white/10 text-white/60"
                                        : "bg-slate-100 text-slate-500"
                                }
                            `}
                        >
                            <span className="material-icons text-[14px]">{cat.icon}</span>
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Filter grid */}
                <div className="px-4 py-3">
                    <div className="grid grid-cols-4 gap-3">
                        {filteredFilters.map((filter) => {
                            const isActive = filter.id === activeFilter;
                            return (
                                <button
                                    key={filter.id}
                                    onClick={() => onSelectFilter(filter.id)}
                                    className={`
                                        flex flex-col items-center gap-1.5 p-2 rounded-xl
                                        transition-all duration-150 active:scale-95
                                        ${isActive
                                            ? "bg-[#FF5C00]/20 border border-[#FF5C00]/50"
                                            : darkMode
                                                ? "bg-white/5 border border-transparent"
                                                : "bg-slate-50 border border-transparent"
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center
                                        ${isActive
                                            ? "bg-[#FF5C00] text-white"
                                            : darkMode
                                                ? "bg-white/10 text-white/70"
                                                : "bg-slate-100 text-slate-600"
                                        }
                                    `}>
                                        <span className="material-icons text-[22px]">{filter.icon}</span>
                                    </div>
                                    <span className={`
                                        text-[10px] font-medium
                                        ${isActive
                                            ? "text-[#FF5C00]"
                                            : darkMode ? "text-white/60" : "text-slate-500"
                                        }
                                    `}>
                                        {filter.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Intensity slider */}
                {activeFilter !== "none" && (
                    <div className={`px-5 py-3 border-t ${darkMode ? "border-white/10" : "border-slate-200"}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[12px]`}>
                                Intensity
                            </span>
                            <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[12px] font-bold`}>
                                {intensity}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={intensity}
                            onChange={(e) => onIntensityChange(parseInt(e.target.value))}
                            className="w-full h-1 rounded-full appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #FF5C00 0%, #FF5C00 ${intensity}%, ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} ${intensity}%, ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} 100%)`,
                            }}
                        />
                    </div>
                )}

                {/* Safe area bottom */}
                <div className="h-safe" />
            </div>
        </>
    );
});

export default MobileFilterSheet;
