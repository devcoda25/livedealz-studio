import React, { useState, useEffect, useRef } from "react";
import {
    Video,
    Monitor,
    Image,
    Type,
    Globe,
    Bell,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    Lock,
    Unlock,
    Volume2,
    VolumeX,
    MoreVertical,
    GripVertical,
    Layers
} from "lucide-react";

export interface CanvasSource {
    id: string;
    name: string;
    type: "camera" | "screen" | "image" | "text" | "browser" | "alert" | "product" | "price" | "cta" | "widget";
    enabled: boolean;
    visible: boolean;
    locked: boolean;
    muted: boolean;
    volume: number;
    order: number;
    position: { x: number; y: number };
    size: { width: number; height: number };
    // Type-specific properties
    url?: string; // For browser source
    text?: string; // For text source
    imageUrl?: string; // For image source
    deviceId?: string; // For camera
}

interface SourcesPanelProps {
    darkMode?: boolean;
    isOpen?: boolean;
    onClose?: () => void;
    sources: CanvasSource[];
    onAddSource: (type: CanvasSource["type"]) => void;
    onRemoveSource: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onToggleLock: (id: string) => void;
    onToggleMute: (id: string) => void;
    onUpdateVolume: (id: string, volume: number) => void;
    onReorderSources: (sources: CanvasSource[]) => void;
    onSelectSource: (id: string | null) => void;
    selectedSourceId: string | null;
}

export function SourcesPanel({
    darkMode,
    isOpen,
    onClose,
    sources,
    onAddSource,
    onRemoveSource,
    onToggleVisibility,
    onToggleLock,
    onToggleMute,
    onUpdateVolume,
    onReorderSources,
    onSelectSource,
    selectedSourceId,
}: SourcesPanelProps) {
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [draggedId, setDraggedId] = useState<string | null>(null);

    const sourceTypeButtons = [
        { type: "camera" as const, icon: Video, label: "Camera", desc: "Webcam or capture device" },
        { type: "screen" as const, icon: Monitor, label: "Screen", desc: "Share screen or window" },
        { type: "image" as const, icon: Image, label: "Image", desc: "PNG, JPG, or GIF" },
        { type: "text" as const, icon: Type, label: "Text", desc: "Text overlay or banner" },
        { type: "browser" as const, icon: Globe, label: "Browser", desc: "URL webview" },
        { type: "alert" as const, icon: Bell, label: "Alert Box", desc: "Social notifications" },
        { type: "product" as const, icon: Bell, label: "Product", desc: "Product showcase" },
        { type: "price" as const, icon: Bell, label: "Price", desc: "Price tag" },
        { type: "cta" as const, icon: Bell, label: "CTA Button", desc: "Call to action" },
        { type: "widget" as const, icon: Bell, label: "Widget", desc: "Timer, stats, etc" },
    ];

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId) return;

        const draggedIndex = sources.findIndex(s => s.id === draggedId);
        const targetIndex = sources.findIndex(s => s.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const newSources = [...sources];
        const [removed] = newSources.splice(draggedIndex, 1);
        newSources.splice(targetIndex, 0, removed);

        // Update order values
        newSources.forEach((s, i) => {
            s.order = i;
        });

        onReorderSources(newSources);
        setDraggedId(null);
    };

    const getSourceIcon = (type: CanvasSource["type"]) => {
        switch (type) {
            case "camera": return Video;
            case "screen": return Monitor;
            case "image": return Image;
            case "text": return Type;
            case "browser": return Globe;
            case "alert": return Bell;
            default: return Video;
        }
    };

    const getSourceColor = (type: CanvasSource["type"]) => {
        switch (type) {
            case "camera": return "text-blue-400 bg-blue-500/10 border-blue-500/30";
            case "screen": return "text-green-700 dark:text-green-400 bg-green-500/10 dark:bg-green-500/10 border-green-600/30 dark:border-green-500/30";
            case "image": return "text-purple-400 bg-purple-500/10 border-purple-500/30";
            case "text": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
            case "browser": return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
            case "alert": return "text-pink-400 bg-pink-500/10 border-pink-500/30";
            default: return "text-slate-400 bg-slate-500/10 border-slate-500/30";
        }
    };

    // Drag functionality for modal
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest("button, input, .cursor-pointer")) return;
        dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
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

    // If isOpen is provided, render as floating modal
    if (isOpen !== undefined) {
        if (!isOpen) return null;
        
        return (
            <div 
                className="fixed right-4 top-20 z-[60] w-80 max-h-[70vh] overflow-hidden rounded-2xl border border-border shadow-2xl bg-muted/95 backdrop-blur-xl cursor-move"
                style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
                onMouseDown={handleMouseDown}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                        <span className="material-icons text-purple-400 text-lg">layers</span>
                        <h3 className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>Sources</h3>
                        <span className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>({sources.length})</span>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-1.5 ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"} rounded-full transition-colors`}
                    >
                        <span className="material-icons text-slate-400 text-[18px]">close</span>
                    </button>
                </div>
                
                {/* Content */}
                <div className="p-3 overflow-y-auto max-h-[calc(70vh-60px)]">
                    {/* Add Button */}
                    <button
                        onClick={() => setShowAddMenu(!showAddMenu)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-secondary hover:bg-accent rounded-xl text-[12px] font-medium text-foreground transition-colors border border-border mb-3"
                    >
                        <Plus className="w-4 h-4" />
                        Add Source
                    </button>

                    {/* Add Source Menu */}
                    {showAddMenu && (
                        <div className="mb-3 bg-muted border border-border rounded-xl py-1">
                            {sourceTypeButtons.map((btn) => (
                                <button
                                    key={btn.type}
                                    onClick={() => {
                                        onAddSource(btn.type);
                                        setShowAddMenu(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-50"} transition-colors`}
                                >
                                    <btn.icon className={`w-4 h-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`} />
                                    <div className="text-left">
                                        <div className={`text-[11px] font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{btn.label}</div>
                                        <div className={`text-[9px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{btn.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Source List */}
                    <div className="flex flex-col gap-2">
                        {sources.map((source) => (
                            <div
                                key={source.id}
                                onClick={() => onSelectSource(source.id)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                    selectedSourceId === source.id
                                        ? "bg-purple-500/10 border-purple-500/40 ring-1 ring-purple-500/30"
                                        : "bg-muted/50 border-border hover:border-muted-foreground"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {React.createElement(getSourceIcon(source.type), { className: `w-4 h-4 ${getSourceColor(source.type)}` })}
                                        <span className="text-[11px] font-medium text-slate-200 truncate max-w-[120px]">
                                            {source.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleVisibility(source.id);
                                            }}
                                            className="p-1 hover:bg-slate-800 rounded"
                                        >
                                            {source.visible ? (
                                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                            ) : (
                                                <EyeOff className="w-3.5 h-3.5 text-red-400" />
                                            )}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveSource(source.id);
                                            }}
                                            className="p-1 hover:bg-slate-800 rounded"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {sources.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-[12px]">No sources added</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Original sidebar render
    return (
        <div className="bg-card border border-border rounded-2xl p-3 flex flex-col gap-2">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-icons text-purple-400 text-lg">layers</span>
                    <h3 className={`text-xs font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>Sources</h3>
                    <span className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>({sources.length})</span>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowAddMenu(!showAddMenu)}
                        className={`p-1.5 ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"} rounded-lg transition-colors`}
                    >
                        <Plus className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Add Source Menu */}
                    {showAddMenu && (
                        <div className="absolute right-0 top-full mt-1 w-56 bg-background border border-border rounded-xl shadow-xl z-50 py-1">
                            {sourceTypeButtons.map((btn) => (
                                <button
                                    key={btn.type}
                                    onClick={() => {
                                        onAddSource(btn.type);
                                        setShowAddMenu(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-50"} transition-colors text-left`}
                                >
                                    <div className={`p-1.5 rounded-lg ${getSourceColor(btn.type)}`}>
                                        <btn.icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <div className={`text-[11px] font-medium ${darkMode ? "text-white" : "text-slate-900"}`}>{btn.label}</div>
                                        <div className={`text-[9px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{btn.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Sources List */}
            <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                {sources.length === 0 ? (
                    <div className="text-[10px] text-slate-500 text-center py-4">
                        No sources added.<br />Click + to add sources.
                    </div>
                ) : (
                    sources.sort((a, b) => a.order - b.order).map((source) => {
                        const Icon = getSourceIcon(source.type);
                        const isSelected = selectedSourceId === source.id;

                        return (
                            <div
                                key={source.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, source.id)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, source.id)}
                                onClick={() => onSelectSource(isSelected ? null : source.id)}
                                className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${isSelected
                                        ? "bg-purple-500/10 border-purple-500/40"
                                        : "bg-background/50 border-border hover:border-muted-foreground"
                                    }`}
                            >
                                {/* Drag Handle */}
                                <div className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400">
                                    <GripVertical className="w-3.5 h-3.5" />
                                </div>

                                {/* Source Icon */}
                                <div className={`p-1.5 rounded-lg ${getSourceColor(source.type)}`}>
                                    <Icon className="w-3 h-3" />
                                </div>

                                {/* Source Name */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-medium text-white truncate">
                                        {source.name}
                                    </div>
                                    <div className="text-[9px] text-slate-500 capitalize">
                                        {source.type}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-0.5">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleVisibility(source.id);
                                        }}
                                        className={`p-1 rounded ${darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"} transition-colors ${source.visible ? "text-slate-400" : "text-slate-600"
                                            }`}
                                        title={source.visible ? "Hide" : "Show"}
                                    >
                                        {source.visible ? (
                                            <Eye className="w-3 h-3" />
                                        ) : (
                                            <EyeOff className="w-3 h-3" />
                                        )}
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleLock(source.id);
                                        }}
                                        className={`p-1 rounded ${darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"} transition-colors ${source.locked ? "text-amber-400" : "text-slate-600"
                                            }`}
                                        title={source.locked ? "Unlock" : "Lock"}
                                    >
                                        {source.locked ? (
                                            <Lock className="w-3 h-3" />
                                        ) : (
                                            <Unlock className="w-3 h-3" />
                                        )}
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveSource(source.id);
                                        }}
                                        className="p-1 rounded hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-colors"
                                        title="Remove"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Help Text */}
            <div className="text-[9px] text-slate-600 text-center">
                Drag to reorder layers
            </div>
        </div>
    );
}
