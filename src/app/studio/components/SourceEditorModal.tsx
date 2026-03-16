"use client";

import React, { useState, useEffect } from "react";
import { CanvasSource } from "./StagePreview";

interface SourceEditorModalProps {
    darkMode?: boolean;
    source: CanvasSource | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<CanvasSource>) => void;
    onDelete: (id: string) => void;
    canvasWidth?: number;
    canvasHeight?: number;
}

export function SourceEditorModal({
    darkMode,
    source,
    isOpen,
    onClose,
    onUpdate,
    onDelete,
    canvasWidth = 1280,
    canvasHeight = 720
}: SourceEditorModalProps) {
    const [activeTab, setActiveTab] = useState<"content" | "style" | "position">("content");
    
    // Content state
    const [textContent, setTextContent] = useState("");
    
    // Style state
    const [fontSize, setFontSize] = useState(24);
    const [fontColor, setFontColor] = useState("#ffffff");
    const [bgColor, setBgColor] = useState("transparent");
    const [bgOpacity, setBgOpacity] = useState(0);
    const [fontWeight, setFontWeight] = useState("normal");
    const [textAlign, setTextAlign] = useState("left");
    const [borderRadius, setBorderRadius] = useState(8);
    const [padding, setPadding] = useState(16);
    
    // Position state
    const [posX, setPosX] = useState(0);
    const [posY, setPosY] = useState(0);
    const [width, setWidth] = useState(200);
    const [height, setHeight] = useState(150);
    const [rotation, setRotation] = useState(0);
    const [opacity, setOpacity] = useState(100);

    // Initialize state from source
    useEffect(() => {
        if (source) {
            setTextContent(source.text || source.name || "");
            setPosX(Math.round(source.position.x));
            setPosY(Math.round(source.position.y));
            setWidth(Math.round(source.size.width));
            setHeight(Math.round(source.size.height));
            setOpacity(100);
            setRotation(0);
        }
    }, [source]);

    if (!isOpen || !source) return null;

    // Apply content changes immediately
    const handleTextChange = (value: string) => {
        setTextContent(value);
        onUpdate(source.id, { text: value });
    };

    // Apply style changes
    const handleStyleChange = () => {
        onUpdate(source.id, { 
            // Store style data in a way that can be rendered
            text: textContent,
        });
    };

    // Apply position/size changes
    const handlePositionApply = () => {
        onUpdate(source.id, {
            position: { x: posX, y: posY },
            size: { width: Math.max(50, width), height: Math.max(30, height) }
        });
    };

    const handleAlignment = (alignment: string) => {
        const padding = 20;
        let newX = posX;
        let newY = posY;

        switch (alignment) {
            case "left":
                newX = padding;
                break;
            case "center-h":
                newX = (canvasWidth - width) / 2;
                break;
            case "right":
                newX = canvasWidth - width - padding;
                break;
            case "top":
                newY = padding;
                break;
            case "middle":
                newY = (canvasHeight - height) / 2;
                break;
            case "bottom":
                newY = canvasHeight - height - padding;
                break;
        }

        setPosX(Math.round(newX));
        setPosY(Math.round(newY));
        onUpdate(source.id, { position: { x: Math.round(newX), y: Math.round(newY) } });
    };

    const handleFlip = (direction: "h" | "v") => {
        const newRotation = direction === "h" 
            ? (rotation === 0 ? 180 : 0)
            : (rotation === 0 ? 180 : 0);
        setRotation(newRotation);
    };

    const handleBringForward = () => {
        onUpdate(source.id, { order: source.order - 1 });
    };

    const handleSendBackward = () => {
        onUpdate(source.id, { order: source.order + 1 });
    };

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this source?")) {
            onDelete(source.id);
            onClose();
        }
    };

    // Get type-specific content fields
    const renderContentFields = () => {
        switch (source.type) {
            case "text":
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Text Content</label>
                            <textarea
                                value={textContent}
                                onChange={(e) => handleTextChange(e.target.value)}
                                className="w-full bg-slate-800/80 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
                                rows={4}
                                placeholder="Enter your text here..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Font Weight</label>
                                <select
                                    value={fontWeight}
                                    onChange={(e) => { setFontWeight(e.target.value); handleStyleChange(); }}
                                    className="w-full bg-slate-800/80 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-500"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="medium">Medium</option>
                                    <option value="bold">Bold</option>
                                    <option value="lighter">Light</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Text Align</label>
                                <div className="flex bg-slate-800/80 rounded-lg p-1">
                                    {["left", "center", "right"].map((align) => (
                                        <button
                                            key={align}
                                            onClick={() => { setTextAlign(align); handleStyleChange(); }}
                                            className={`flex-1 py-2 rounded-md transition-all ${
                                                textAlign === align 
                                                    ? "bg-purple-600 text-white" 
                                                    : "text-slate-400 hover:text-white"
                                            }`}
                                        >
                                            <span className="material-icons text-sm">
                                                {align === "left" ? "format_align_left" : align === "center" ? "format_align_center" : "format_align_right"}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "product":
                return (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                            <span className="material-icons text-3xl text-emerald-400">shopping_bag</span>
                        </div>
                        <h3 className="text-white font-semibold mb-2">Product Source</h3>
                        <p className="text-slate-400 text-sm mb-4">Product display is managed through the Commerce panel.</p>
                        <button 
                            onClick={() => { onClose(); /* Open commerce panel */ }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-sm font-medium transition-colors"
                        >
                            Open Commerce Panel
                        </button>
                    </div>
                );

            case "price":
                return (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                            <span className="material-icons text-3xl text-orange-400">sell</span>
                        </div>
                        <h3 className="text-white font-semibold mb-2">Price Display</h3>
                        <p className="text-slate-400 text-sm">Price tags are auto-generated from product data.</p>
                    </div>
                );

            case "cta":
                return (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-pink-500/20 flex items-center justify-center">
                            <span className="material-icons text-3xl text-pink-400">touch_app</span>
                        </div>
                        <h3 className="text-white font-semibold mb-2">Call-to-Action Button</h3>
                        <p className="text-slate-400 text-sm">CTA buttons are configured in the Commerce panel.</p>
                    </div>
                );

            case "widget":
                return (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                            <span className="material-icons text-3xl text-cyan-400">widgets</span>
                        </div>
                        <h3 className="text-white font-semibold mb-2">Widget Source</h3>
                        <p className="text-slate-400 text-sm">Widgets are configured in the Production panel.</p>
                    </div>
                );

            default:
                return (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-500/20 flex items-center justify-center">
                            <span className="material-icons text-3xl text-slate-400">image</span>
                        </div>
                        <h3 className="text-white font-semibold mb-2 capitalize">{source.type}</h3>
                        <p className="text-slate-400 text-sm">This source type doesn't have editable content.</p>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-card rounded-2xl border border-border shadow-2xl w-[520px] max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-muted/80 to-card/80">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            source.type === "text" ? "bg-blue-500/20" :
                            source.type === "product" ? "bg-emerald-500/20" :
                            source.type === "price" ? "bg-orange-500/20" :
                            source.type === "cta" ? "bg-pink-500/20" :
                            source.type === "widget" ? "bg-cyan-500/20" :
                            "bg-purple-500/20"
                        }`}>
                            <span className={`material-icons ${
                                source.type === "text" ? "text-blue-400" :
                                source.type === "product" ? "text-emerald-400" :
                                source.type === "price" ? "text-orange-400" :
                                source.type === "cta" ? "text-pink-400" :
                                source.type === "widget" ? "text-cyan-400" :
                                "text-purple-400"
                            }`}>
                                {source.type === "text" ? "text_fields" :
                                 source.type === "product" ? "shopping_bag" :
                                 source.type === "price" ? "sell" :
                                 source.type === "cta" ? "touch_app" :
                                 source.type === "widget" ? "widgets" :
                                 "image"}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-white font-semibold text-lg">{source.name}</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 capitalize">{source.type} Source</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-xs text-slate-500">{source.size.width}×{source.size.height}</span>
                                {source.locked && (
                                    <>
                                        <span className="text-slate-600">•</span>
                                        <span className="text-amber-400 text-xs flex items-center gap-1">
                                            <span className="material-icons text-xs">lock</span>
                                            Locked
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    >
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex px-6 pt-4 border-b border-slate-700/30">
                    {[
                        { id: "content", label: "Content", icon: "edit_note" },
                        { id: "style", label: "Style", icon: "palette" },
                        { id: "position", label: "Position", icon: "place" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                                activeTab === tab.id 
                                    ? "text-purple-400 border-purple-500" 
                                    : "text-slate-400 border-transparent hover:text-white"
                            }`}
                        >
                            <span className="material-icons text-lg">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {activeTab === "content" && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                            {renderContentFields()}
                        </div>
                    )}

                    {activeTab === "style" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            {source.type === "text" && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Typography</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-2">Size</label>
                                                <div className="flex items-center gap-3 bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-600/50">
                                                    <input
                                                        type="range"
                                                        min={12}
                                                        max={96}
                                                        value={fontSize}
                                                        onChange={(e) => { setFontSize(Number(e.target.value)); handleStyleChange(); }}
                                                        className="flex-1 accent-purple-500"
                                                    />
                                                    <span className="text-white text-sm w-12 text-right">{fontSize}px</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-2">Border Radius</label>
                                                <div className="flex items-center gap-3 bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-600/50">
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={32}
                                                        value={borderRadius}
                                                        onChange={(e) => { setBorderRadius(Number(e.target.value)); handleStyleChange(); }}
                                                        className="flex-1 accent-purple-500"
                                                    />
                                                    <span className="text-white text-sm w-8 text-right">{borderRadius}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Colors</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-2">Text Color</label>
                                                <div className="flex items-center gap-3 bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-600/50">
                                                    <input
                                                        type="color"
                                                        value={fontColor}
                                                        onChange={(e) => { setFontColor(e.target.value); handleStyleChange(); }}
                                                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                                                    />
                                                    <span className="text-slate-400 text-sm font-mono">{fontColor}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-2">Background</label>
                                                <div className="flex items-center gap-3 bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-600/50">
                                                    <input
                                                        type="color"
                                                        value={bgColor === "transparent" ? "#000000" : bgColor}
                                                        onChange={(e) => { setBgColor(e.target.value); setBgOpacity(100); handleStyleChange(); }}
                                                        disabled={bgColor === "transparent"}
                                                        className="w-8 h-8 rounded-lg cursor-pointer border-0 disabled:opacity-30"
                                                    />
                                                    <button
                                                        onClick={() => { setBgColor("transparent"); setBgOpacity(0); handleStyleChange(); }}
                                                        className={`px-2 py-1 rounded text-xs ${bgColor === "transparent" ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-400"}`}
                                                    >
                                                        None
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Padding</label>
                                        <div className="flex items-center gap-3 bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-600/50">
                                            <input
                                                type="range"
                                                min={0}
                                                max={48}
                                                value={padding}
                                                onChange={(e) => { setPadding(Number(e.target.value)); handleStyleChange(); }}
                                                className="flex-1 accent-purple-500"
                                            />
                                            <span className="text-white text-sm w-12 text-right">{padding}px</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Opacity</label>
                                <div className="flex items-center gap-3 bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-600/50">
                                    <input
                                        type="range"
                                        min={10}
                                        max={100}
                                        value={opacity}
                                        onChange={(e) => { 
                                            setOpacity(Number(e.target.value)); 
                                            onUpdate(source.id, { visible: opacity > 10 });
                                        }}
                                        className="flex-1 accent-purple-500"
                                    />
                                    <span className="text-white text-sm w-12 text-right">{opacity}%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "position" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Quick Align</label>
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <button
                                        onClick={() => handleAlignment("left")}
                                        className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 rounded-xl py-3 text-white text-sm transition-all hover:border-purple-500/50"
                                    >
                                        <span className="material-icons text-lg">format_align_left</span>
                                        Left
                                    </button>
                                    <button
                                        onClick={() => handleAlignment("center-h")}
                                        className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 rounded-xl py-3 text-white text-sm transition-all hover:border-purple-500/50"
                                    >
                                        <span className="material-icons text-lg">format_align_center</span>
                                        Center
                                    </button>
                                    <button
                                        onClick={() => handleAlignment("right")}
                                        className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 rounded-xl py-3 text-white text-sm transition-all hover:border-purple-500/50"
                                    >
                                        <span className="material-icons text-lg">format_align_right</span>
                                        Right
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => handleAlignment("top")}
                                        className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 rounded-xl py-3 text-white text-sm transition-all hover:border-purple-500/50"
                                    >
                                        <span className="material-icons text-lg">vertical_align_top</span>
                                        Top
                                    </button>
                                    <button
                                        onClick={() => handleAlignment("middle")}
                                        className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 rounded-xl py-3 text-white text-sm transition-all hover:border-purple-500/50"
                                    >
                                        <span className="material-icons text-lg">vertical_align_center</span>
                                        Middle
                                    </button>
                                    <button
                                        onClick={() => handleAlignment("bottom")}
                                        className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 rounded-xl py-3 text-white text-sm transition-all hover:border-purple-500/50"
                                    >
                                        <span className="material-icons text-lg">vertical_align_bottom</span>
                                        Bottom
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Position & Size</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-2">X Position</label>
                                        <input
                                            type="number"
                                            value={posX}
                                            onChange={(e) => setPosX(Number(e.target.value))}
                                            onBlur={handlePositionApply}
                                            className="w-full bg-slate-800/80 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-2">Y Position</label>
                                        <input
                                            type="number"
                                            value={posY}
                                            onChange={(e) => setPosY(Number(e.target.value))}
                                            onBlur={handlePositionApply}
                                            className="w-full bg-slate-800/80 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-2">Width</label>
                                        <input
                                            type="number"
                                            value={width}
                                            onChange={(e) => setWidth(Number(e.target.value))}
                                            onBlur={handlePositionApply}
                                            className="w-full bg-slate-800/80 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-2">Height</label>
                                        <input
                                            type="number"
                                            value={height}
                                            onChange={(e) => setHeight(Number(e.target.value))}
                                            onBlur={handlePositionApply}
                                            className="w-full bg-slate-800/80 border border-slate-600/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Transform</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleFlip("h")}
                                        className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 rounded-xl py-3 text-white text-sm transition-all hover:border-purple-500/50"
                                    >
                                        <span className="material-icons text-lg">flip</span>
                                        Flip Horizontal
                                    </button>
                                    <button
                                        onClick={() => handleFlip("v")}
                                        className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 rounded-xl py-3 text-white text-sm transition-all hover:border-purple-500/50"
                                    >
                                        <span className="material-icons text-lg">flip</span>
                                        Flip Vertical
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Layer Order</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleBringForward}
                                        className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 rounded-xl py-3 text-white text-sm transition-all hover:border-purple-500/50"
                                    >
                                        <span className="material-icons text-lg">arrow_upward</span>
                                        Bring Forward
                                    </button>
                                    <button
                                        onClick={handleSendBackward}
                                        className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 rounded-xl py-3 text-white text-sm transition-all hover:border-purple-500/50"
                                    >
                                        <span className="material-icons text-lg">arrow_downward</span>
                                        Send Backward
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background/80">
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium transition-all"
                    >
                        <span className="material-icons text-lg">delete_outline</span>
                        Delete
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-600 rounded-xl text-white text-sm font-semibold transition-all shadow-lg shadow-purple-500/20"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
