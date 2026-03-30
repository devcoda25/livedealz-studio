import React, { useState, useRef, useEffect } from "react";

interface SceneSource {
    id: string;
    name: string;
    type: "camera" | "screen" | "image" | "text" | "product" | "price" | "cta" | "widget";
    enabled: boolean;
    visible: boolean;
    order: number;
}

interface Scene {
    id: string;
    name: string;
    sources: SceneSource[];
}

interface SceneManagerHUDProps {
    darkMode?: boolean;
    scenes: Scene[];
    activeSceneId: string;
    onSceneChange: (sceneId: string) => void;
    onSourceToggle: (sceneId: string, sourceId: string) => void;
    onSourceVisibility: (sceneId: string, sourceId: string) => void;
    onClose: () => void;
}

export function SceneManagerHUD({
    darkMode = true,
    scenes,
    activeSceneId,
    onSceneChange,
    onSourceToggle,
    onSourceVisibility,
    onClose,
}: SceneManagerHUDProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [activeTab, setActiveTab] = useState<"scenes" | "sources">("scenes");
    const [selectedScene, setSelectedScene] = useState<string>(activeSceneId);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    const currentScene = scenes.find(s => s.id === selectedScene) || scenes[0];

    // Mouse drag handlers
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

    // Touch drag handlers
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

    const getSourceIcon = (type: SceneSource["type"]) => {
        switch (type) {
            case "camera": return "videocam";
            case "screen": return "present_to_all";
            case "image": return "image";
            case "text": return "text_fields";
            case "product": return "shopping_bag";
            case "price": return "sell";
            case "cta": return "touch_app";
            case "widget": return "widgets";
            default: return "layers";
        }
    };

    const getSourceColor = (type: SceneSource["type"]) => {
        switch (type) {
            case "camera": return "text-blue-400";
            case "screen": return "text-green-700 dark:text-green-400";
            case "image": return "text-purple-400";
            case "text": return "text-yellow-400";
            case "product": return "text-emerald-700 dark:text-emerald-400";
            case "price": return "text-orange-400";
            case "cta": return "text-pink-400";
            case "widget": return "text-cyan-400";
            default: return "text-slate-400";
        }
    };

    return (
        <div
            ref={dialogRef}
            className={`fixed left-4 bottom-4 z-[70] w-96 sm:w-[480px] rounded-2xl border shadow-xl cursor-move touch-none ${
                darkMode 
                    ? "border-slate-800/80 bg-slate-950/80" 
                    : "border-slate-200 bg-white"
            }`}
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
                <div className="flex items-center gap-2">
                    <span className="material-icons text-[18px] text-indigo-400">theaters</span>
                    <span className={`text-[13px] font-semibold ${darkMode ? "text-white" : "text-slate-700"}`}>Scene Manager</span>
                </div>
                <button onClick={onClose} className={`p-1.5 hover:bg-muted rounded-full transition-colors ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    <span className="material-icons text-[18px]">close</span>
                </button>
            </div>

            {/* Tabs */}
            <div className={`flex border-b ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
                <button
                    className={`flex-1 py-2 text-[11px] font-medium ${activeTab === "scenes" ? "text-indigo-400 border-b-2 border-indigo-400" : darkMode ? "text-slate-400" : "text-slate-500"}`}
                    onClick={() => setActiveTab("scenes")}
                >
                    Scenes ({scenes.length})
                </button>
                <button
                    className={`flex-1 py-2 text-[11px] font-medium ${activeTab === "sources" ? "text-indigo-400 border-b-2 border-indigo-400" : darkMode ? "text-slate-400" : "text-slate-500"}`}
                    onClick={() => setActiveTab("sources")}
                >
                    Sources ({currentScene?.sources.length || 0})
                </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[400px] overflow-y-auto">
                {activeTab === "scenes" ? (
                    <div className="space-y-2">
                        {scenes.map((scene) => (
                            <div
                                key={scene.id}
                                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                    scene.id === activeSceneId
                                        ? "bg-indigo-500/10 border-indigo-500/50"
                                        : (darkMode ? "bg-slate-900/50 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-200 hover:border-slate-300")
                                }`}
                                onClick={() => {
                                    setSelectedScene(scene.id);
                                    onSceneChange(scene.id);
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-icons text-[16px] text-slate-400">movie</span>
                                        <span className="text-[12px] font-medium text-white">{scene.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {scene.id === activeSceneId && (
                                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[9px] font-medium">
                                                Active
                                            </span>
                                        )}
                                        <span className={`text-[9px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{scene.sources.length} sources</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button className={`w-full py-2 mt-2 rounded-xl border border-dashed ${darkMode ? "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300" : "border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-600"} text-[11px] transition-colors`}>
                            + Add New Scene
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {currentScene?.sources.map((source) => (
                            <div
                                key={source.id}
                                className={`p-3 rounded-xl ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`material-icons text-[16px] ${getSourceColor(source.type)}`}>
                                            {getSourceIcon(source.type)}
                                        </span>
                                        <span className={`text-[12px] font-medium ${darkMode ? "text-white" : "text-slate-700"}`}>{source.name}</span>
                                        <span className={`text-[9px] ${darkMode ? "text-slate-500" : "text-slate-400"} uppercase`}>{source.type}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className={`w-8 h-4 rounded-full transition-colors ${source.enabled ? "bg-indigo-500" : "bg-slate-700"}`}
                                            onClick={() => onSourceToggle(selectedScene, source.id)}
                                        >
                                            <div className={`w-3 h-3 rounded-full bg-white transform transition-transform ${source.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                                            source.visible
                                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                                : (darkMode ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-600 border-slate-200")
                                        }`}
                                        onClick={() => onSourceVisibility(selectedScene, source.id)}
                                    >
                                        {source.visible ? "✓ Visible" : "Hidden"}
                                    </button>
                                    <button className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-[10px] hover:bg-slate-700">
                                        Edit
                                    </button>
                                    <button className={`px-3 py-1.5 rounded-lg text-[10px] ${darkMode ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                                        <span className="material-icons text-[14px]">drag_indicator</span>
                                    </button>
                                </div>
                            </div>
                        ))}

                        <div className="grid grid-cols-4 gap-2 mt-3">
                            {[
                                { type: "camera" as const, icon: "videocam", label: "Camera" },
                                { type: "screen" as const, icon: "present_to_all", label: "Screen" },
                                { type: "product" as const, icon: "shopping_bag", label: "Product" },
                                { type: "price" as const, icon: "sell", label: "Price" },
                                { type: "cta" as const, icon: "touch_app", label: "CTA" },
                                { type: "text" as const, icon: "text_fields", label: "Text" },
                                { type: "image" as const, icon: "image", label: "Image" },
                                { type: "widget" as const, icon: "widgets", label: "Widget" },
                            ].map((item) => (
                                <button
                                    key={item.type}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${darkMode ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}
                                >
                                    <span className={`material-icons text-[18px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{item.icon}</span>
                                    <span className={`text-[9px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
