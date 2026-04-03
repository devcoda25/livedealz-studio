import React, { useState, useRef, useEffect } from "react";
import { SaleEvent, FlashDealState } from "../shared/types";
import { formatHMS, fmtMoneyUSD } from "../shared/utils";
import { EV_GREEN, EV_ORANGE } from "../shared/constants";

interface CommerceHUDProps {
    darkMode?: boolean;
    targetUnits: number;
    soldUnits: number;
    cartCount: number;
    last5MinSales: number;
    flash: FlashDealState;
    flashUrgency: string;
    salesEvents: SaleEvent[];
    onClose: () => void;
}

export function CommerceHUD({
    darkMode = true,
    targetUnits,
    soldUnits,
    cartCount,
    last5MinSales,
    flash,
    flashUrgency,
    salesEvents,
    onClose,
}: CommerceHUDProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    const progress = Math.min((soldUnits / targetUnits) * 100, 100);
    const remainingUnits = Math.max(targetUnits - soldUnits, 0);

    // Mouse
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

    // Touch
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

    return (
        <div
            ref={dialogRef}
            className={`fixed left-4 bottom-4 z-[70] w-80 sm:w-96 rounded-2xl border shadow-xl cursor-move touch-none ${
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
            <div className="w-full max-w-sm sm:max-w-xl rounded-3xl px-4 py-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="material-icons text-[18px] text-emerald-700 dark:text-emerald-400">shopping_cart</span>
                        <span className={`text-[13px] font-semibold ${darkMode ? "text-white" : "text-slate-700"}`}>Commerce HUD</span>
                    </div>
                    <button onClick={onClose} className={`p-1.5 hover:bg-muted rounded-full transition-colors ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                        <span className="material-icons text-[18px]">close</span>
                    </button>
                </div>

                {/* Goal Progress */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-[11px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Sales Goal</span>
                        <span className={`text-[11px] font-semibold ${darkMode ? "text-white" : "text-slate-700"}`}>
                            {soldUnits} / {targetUnits} units
                        </span>
                    </div>
                    <div className={`h-3 ${darkMode ? "bg-slate-900" : "bg-slate-100"} rounded-full overflow-hidden`}>
                        <div 
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                            style={{ width: progress + "%" }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <span className={`text-[9px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{remainingUnits} units to go</span>
                        <span className="text-[9px] text-emerald-700 dark:text-emerald-400">{progress.toFixed(0)}% complete</span>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className={`${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"} rounded-xl p-3 border`}>
                        <div className={`text-[9px] ${darkMode ? "text-slate-500" : "text-slate-400"} mb-1`}>Last 5 min</div>
                        <div className={`text-[16px] font-bold ${darkMode ? "text-white" : "text-slate-700"}`}>{last5MinSales}</div>
                        <div className={`text-[8px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>sales</div>
                    </div>
                    <div className={`${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"} rounded-xl p-3 border`}>
                        <div className={`text-[9px] ${darkMode ? "text-slate-500" : "text-slate-400"} mb-1`}>In Carts</div>
                        <div className={`text-[16px] font-bold ${darkMode ? "text-white" : "text-slate-700"}`}>{cartCount}</div>
                        <div className={`text-[8px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>items</div>
                    </div>
                    <div className={`${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"} rounded-xl p-3 border`}>
                        <div className={`text-[9px] ${darkMode ? "text-slate-500" : "text-slate-400"} mb-1`}>Total Sold</div>
                        <div className={`text-[16px] font-bold ${darkMode ? "text-white" : "text-slate-700"}`}>{soldUnits}</div>
                        <div className={`text-[8px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>units</div>
                    </div>
                </div>

                {/* Recent Sales */}
                <div>
                    <div className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"} mb-2 uppercase tracking-wide`}>Recent Sales</div>
                    <div className="space-y-1.5 max-h-[100px] overflow-y-auto">
                        {salesEvents.slice(0, 5).map((ev) => (
                            <div key={ev.id} className="flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-2">
                                    <span className="material-icons text-[12px] text-emerald-700 dark:text-emerald-400">shopping_bag</span>
                                    <span className={darkMode ? "text-slate-300" : "text-slate-600"}>{ev.label}</span>
                                </div>
                                {ev.amount && <span className="text-emerald-700 dark:text-emerald-400 font-medium">+{ev.amount}</span>}
                            </div>
                        ))}
                        {salesEvents.length === 0 && (
                            <div className={`text-[10px] ${darkMode ? "text-slate-600" : "text-slate-400"} text-center py-2`}>No sales yet</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
