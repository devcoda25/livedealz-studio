import React, { useState, useRef, useEffect } from "react";
import { X, Move } from "lucide-react";
import { FILTER_CATEGORIES } from "./filters";
import { FilterCategory as MediaFilterCategory } from "../../../engines/media/types";

export function FiltersTray({
    darkMode = true,
    onClose,
    activeFilter,
    onSelectFilter
}: {
    darkMode?: boolean;
    onClose: () => void;
    activeFilter: string;
    onSelectFilter: (f: string, category: MediaFilterCategory) => void;
}) {
    const [activeTab, setActiveTab] = useState<MediaFilterCategory>(MediaFilterCategory.BEAUTY);
    const currentCategory = FILTER_CATEGORIES.find(c => c.id === activeTab) ?? FILTER_CATEGORIES[0];

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest("button, input, select")) return;
        dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        e.preventDefault();
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragStartRef.current) return;
        setPosition({
            x: e.clientX - dragStartRef.current.x,
            y: e.clientY - dragStartRef.current.y
        });
    };

    const handleMouseUp = () => {
        dragStartRef.current = null;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if ((e.target as HTMLElement).closest("button, input, select")) return;
        const touch = e.touches[0];
        dragStartRef.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("touchend", handleTouchEnd);
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!dragStartRef.current) return;
        e.preventDefault();
        const touch = e.touches[0];
        setPosition({
            x: touch.clientX - dragStartRef.current.x,
            y: touch.clientY - dragStartRef.current.y
        });
    };

    const handleTouchEnd = () => {
        dragStartRef.current = null;
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
    };

    useEffect(() => {
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleTouchEnd);
        };
    }, []);

    // Get category-specific colors
    const getCategoryColor = (category: MediaFilterCategory) => {
        switch (category) {
            case MediaFilterCategory.BEAUTY: return { bg: "rose", text: "rose", icon: "face_retouching_natural" };
            case MediaFilterCategory.COLOR: return { bg: "purple", text: "purple", icon: "palette" };
            case MediaFilterCategory.AR_FACE: return { bg: "pink", text: "pink", icon: "face" };
            case MediaFilterCategory.BACKGROUND: return { bg: "cyan", text: "cyan", icon: "wallpaper" };
            case MediaFilterCategory.GREEN_SCREEN: return { bg: "green", text: "green", icon: "green_screen" };
            case MediaFilterCategory.GESTURE: return { bg: "amber", text: "amber", icon: "pan_tool" };
            case MediaFilterCategory.TIME: return { bg: "indigo", text: "indigo", icon: "slow_motion_video" };
            default: return { bg: "purple", text: "purple", icon: "auto_awesome" };
        }
    };

    const categoryColor = getCategoryColor(currentCategory.id);

    return (
        <div
            ref={dialogRef}
            className="fixed left-4 bottom-4 z-[70] w-[90vw] max-w-4xl rounded-3xl border border-border shadow-2xl px-5 py-5 bg-background/95 backdrop-blur-xl cursor-move touch-none"
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-${categoryColor.bg}-500/20`}>
                        <span className={`material-icons text-[22px] text-${categoryColor.text}-400`}>{currentCategory.icon}</span>
                    </div>
                    <div>
                        <h3 className="text-[15px] font-bold text-foreground">Studio Filters</h3>
                        <p className="text-[11px] text-muted-foreground">{currentCategory.label} effects</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                    <X className="w-5 h-5 text-muted-foreground" />
                </button>
            </div>

            {/* Category Tabs - Horizontal Scroll */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent">
                {FILTER_CATEGORIES.map((cat) => {
                    const isActive = activeTab === cat.id;
                    const catColor = getCategoryColor(cat.id);
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap ${isActive
                                ? `bg-${catColor.bg}-600 text-white shadow-lg shadow-${catColor.bg}-900/40`
                                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border"
                                }`}
                        >
                            <span className="material-icons text-[16px]">{cat.icon}</span>
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            {/* Filter Grid - Wider and organized */}
            <div className="bg-muted/50 rounded-2xl p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                        {currentCategory.label} ({currentCategory.filters.length})
                    </span>
                    <span className="text-[10px] text-muted">Click to apply</span>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-[280px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground">
                    {currentCategory.filters.map((f) => {
                        const isActive = activeFilter === f.id;
                        return (
                            <button
                                key={f.id}
                                className={`group flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200 ${isActive
                                    ? `bg-${categoryColor.bg}-500/15 border-${categoryColor.bg}-500/60 ring-2 ring-${categoryColor.bg}-500/30`
                                    : "bg-background/50 border-border hover:border-muted-foreground hover:bg-muted"
                                    }`}
                                onClick={() => onSelectFilter(f.id, f.category)}
                            >
                                {/* Preview Circle */}
                                <div
                                    className={`h-14 w-14 rounded-2xl overflow-hidden border-2 relative shadow-md transition-transform group-hover:scale-105 ${isActive
                                        ? `border-${categoryColor.bg}-400 shadow-${categoryColor.bg}-500/30`
                                        : "border-muted-foreground"
                                        }`}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${darkMode ? "from-slate-700 via-slate-800 to-slate-900" : "from-slate-200 via-slate-300 to-slate-400"}`} />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className={`material-icons text-[24px] ${isActive ? `text-${categoryColor.bg}-300` : 'text-slate-500'}`}>
                                            {f.icon}
                                        </span>
                                    </div>
                                </div>

                                {/* Label */}
                                <div className="text-center">
                                    <span className={`text-[10px] font-semibold block ${isActive ? `text-${categoryColor.text}-300` : "text-foreground"}`}>
                                        {f.name}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Intensity Slider - For applicable filters */}
            {(currentCategory.id === MediaFilterCategory.COLOR || currentCategory.id === MediaFilterCategory.BEAUTY) && (
                <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className={`material-icons text-[16px] text-${categoryColor.text}-400`}>tune</span>
                            <span className="text-[12px] font-medium text-foreground">Effect Intensity</span>
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded">100%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue="100"
                        className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-purple-500"
                    />
                </div>
            )}
        </div>
    );
}
