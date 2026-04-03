import React, { useState, useRef, useEffect } from "react";
import { X, GripHorizontal } from "lucide-react";
import { FILTER_CATEGORIES } from "../shared/filters";
import { FilterCategory as MediaFilterCategory } from "../../../../engines/media/types";

// Static Tailwind class maps (dynamic classes like bg-${color}-600 are purged by Tailwind)
const CATEGORY_COLORS: Record<string, { bg: string; bgLight: string; text: string; ring: string; shadow: string; border: string; icon: string }> = {
    beauty: {
        bg: "bg-rose-600",
        bgLight: "bg-rose-500/15",
        text: "text-rose-400",
        ring: "ring-rose-500/30",
        shadow: "shadow-rose-900/40",
        border: "border-rose-500/60",
        icon: "face_retouching_natural",
    },
    color: {
        bg: "bg-purple-600",
        bgLight: "bg-purple-500/15",
        text: "text-purple-400",
        ring: "ring-purple-500/30",
        shadow: "shadow-purple-900/40",
        border: "border-purple-500/60",
        icon: "palette",
    },
    ar_face: {
        bg: "bg-pink-600",
        bgLight: "bg-pink-500/15",
        text: "text-pink-400",
        ring: "ring-pink-500/30",
        shadow: "shadow-pink-900/40",
        border: "border-pink-500/60",
        icon: "face",
    },
    background: {
        bg: "bg-cyan-600",
        bgLight: "bg-cyan-500/15",
        text: "text-cyan-400",
        ring: "ring-cyan-500/30",
        shadow: "shadow-cyan-900/40",
        border: "border-cyan-500/60",
        icon: "wallpaper",
    },
    green_screen: {
        bg: "bg-green-600",
        bgLight: "bg-green-500/15",
        text: "text-green-400",
        ring: "ring-green-500/30",
        shadow: "shadow-green-900/40",
        border: "border-green-500/60",
        icon: "green_screen",
    },
    gesture: {
        bg: "bg-amber-600",
        bgLight: "bg-amber-500/15",
        text: "text-amber-400",
        ring: "ring-amber-500/30",
        shadow: "shadow-amber-900/40",
        border: "border-amber-500/60",
        icon: "pan_tool",
    },
    time: {
        bg: "bg-indigo-600",
        bgLight: "bg-indigo-500/15",
        text: "text-indigo-400",
        ring: "ring-indigo-500/30",
        shadow: "shadow-indigo-900/40",
        border: "border-indigo-500/60",
        icon: "slow_motion_video",
    },
};

const FALLBACK_COLOR = {
    bg: "bg-purple-600",
    bgLight: "bg-purple-500/15",
    text: "text-purple-400",
    ring: "ring-purple-500/30",
    shadow: "shadow-purple-900/40",
    border: "border-purple-500/60",
    icon: "auto_awesome",
};

export function FiltersTray({
    darkMode = true,
    onClose,
    activeFilter,
    onSelectFilter,
    intensity = 100,
    onIntensityChange,
}: {
    darkMode?: boolean;
    onClose: () => void;
    activeFilter: string;
    onSelectFilter: (f: string, category: MediaFilterCategory) => void;
    intensity?: number;
    onIntensityChange?: (value: number) => void;
}) {
    const [activeTab, setActiveTab] = useState<MediaFilterCategory>(MediaFilterCategory.BEAUTY);
    const currentCategory = FILTER_CATEGORIES.find(c => c.id === activeTab) ?? FILTER_CATEGORIES[0];

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    // Drag handlers - only active when triggered from the header drag area
    const handleDragStart = (e: React.MouseEvent) => {
        dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        e.preventDefault();
        window.addEventListener("mousemove", handleDragMove);
        window.addEventListener("mouseup", handleDragEnd);
    };

    const handleDragMove = (e: MouseEvent) => {
        if (!dragStartRef.current) return;
        setPosition({
            x: e.clientX - dragStartRef.current.x,
            y: e.clientY - dragStartRef.current.y
        });
    };

    const handleDragEnd = () => {
        dragStartRef.current = null;
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
    };

    const handleTouchDragStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        dragStartRef.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
        window.addEventListener("touchmove", handleTouchDragMove, { passive: false });
        window.addEventListener("touchend", handleTouchDragEnd);
    };

    const handleTouchDragMove = (e: TouchEvent) => {
        if (!dragStartRef.current) return;
        e.preventDefault();
        const touch = e.touches[0];
        setPosition({
            x: touch.clientX - dragStartRef.current.x,
            y: touch.clientY - dragStartRef.current.y
        });
    };

    const handleTouchDragEnd = () => {
        dragStartRef.current = null;
        window.removeEventListener("touchmove", handleTouchDragMove);
        window.removeEventListener("touchend", handleTouchDragEnd);
    };

    useEffect(() => {
        return () => {
            window.removeEventListener("mousemove", handleDragMove);
            window.removeEventListener("mouseup", handleDragEnd);
            window.removeEventListener("touchmove", handleTouchDragMove);
            window.removeEventListener("touchend", handleTouchDragEnd);
        };
    }, []);

    const categoryColor = CATEGORY_COLORS[currentCategory.id] || FALLBACK_COLOR;
    const showIntensity = currentCategory.id === MediaFilterCategory.COLOR || currentCategory.id === MediaFilterCategory.BEAUTY;

    return (
        <div
            ref={dialogRef}
            className="fixed left-4 bottom-4 z-[70] w-[420px] max-w-[90vw] rounded-2xl border border-border shadow-2xl bg-background/95 backdrop-blur-xl touch-none"
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
            }}
        >
            {/* Drag Handle Header */}
            <div
                className="flex items-center justify-between px-4 pt-4 pb-2 cursor-move select-none"
                onMouseDown={handleDragStart}
                onTouchStart={handleTouchDragStart}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${categoryColor.bgLight}`}>
                        <span className={`material-icons text-[22px] ${categoryColor.text}`}>{currentCategory.icon}</span>
                    </div>
                    <div>
                        <h3 className="text-[15px] font-bold text-foreground">Studio Filters</h3>
                        <p className="text-[11px] text-muted-foreground">{currentCategory.label} effects</p>
                    </div>
                    <GripHorizontal className="w-4 h-4 text-muted-foreground/50 ml-1" />
                </div>
                <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                    <X className="w-5 h-5 text-muted-foreground" />
                </button>
            </div>

            {/* Content area - no drag, clicks work normally */}
            <div className="px-4 pb-4">
                {/* Category Tabs - Horizontal Scroll */}
                <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent">
                    {FILTER_CATEGORIES.map((cat) => {
                        const isActive = activeTab === cat.id;
                        const catColor = CATEGORY_COLORS[cat.id] || FALLBACK_COLOR;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveTab(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap ${isActive
                                    ? `${catColor.bg} text-white shadow-lg ${catColor.shadow}`
                                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border"
                                    }`}
                            >
                                <span className="material-icons text-[16px]">{cat.icon}</span>
                                {cat.label}
                            </button>
                        );
                    })}
                </div>

                {/* Filter Grid */}
                <div className="bg-muted/50 rounded-2xl p-4 border border-border">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                            {currentCategory.label} ({currentCategory.filters.length})
                        </span>
                        <span className="text-[10px] text-muted-foreground">Click to apply</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground">
                        {currentCategory.filters.map((f) => {
                            const isActive = activeFilter === f.id;
                            return (
                                <button
                                    key={f.id}
                                    className={`group flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200 ${isActive
                                        ? `${categoryColor.bgLight} ${categoryColor.border} ring-2 ${categoryColor.ring}`
                                        : "bg-background/50 border-border hover:border-muted-foreground hover:bg-muted"
                                        }`}
                                    onClick={() => onSelectFilter(f.id, f.category)}
                                >
                                    {/* Preview Circle */}
                                    <div
                                        className={`h-14 w-14 rounded-2xl overflow-hidden border-2 relative shadow-md transition-transform group-hover:scale-105 ${isActive
                                            ? `${categoryColor.border} shadow-lg`
                                            : "border-muted-foreground"
                                            }`}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${darkMode ? "from-slate-700 via-slate-800 to-slate-900" : "from-slate-200 via-slate-300 to-slate-400"}`} />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className={`material-icons text-[24px] ${isActive ? categoryColor.text : 'text-slate-500'}`}>
                                                {f.icon}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Label */}
                                    <div className="text-center">
                                        <span className={`text-[10px] font-semibold block ${isActive ? categoryColor.text : "text-foreground"}`}>
                                            {f.name}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Intensity Slider */}
                {showIntensity && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className={`material-icons text-[16px] ${categoryColor.text}`}>tune</span>
                                <span className="text-[12px] font-medium text-foreground">Effect Intensity</span>
                            </div>
                            <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded">{intensity}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={intensity}
                            onChange={(e) => onIntensityChange?.(Number(e.target.value))}
                            className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
