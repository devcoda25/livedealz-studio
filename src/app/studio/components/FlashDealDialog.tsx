import React, { useState, useRef, useEffect } from "react";
import { EV_ORANGE } from "./constants";

export function FlashDealDialog(props: { onClose: () => void; onStart: (durationMin: number, discountPct: number) => void }) {
    const { onClose, onStart } = props;
    const [duration, setDuration] = useState(5);
    const [discount, setDiscount] = useState(15);
    const durationOptions = [5, 10, 15];

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    // Mouse
    const handleMouseDown = (e: React.MouseEvent) => {
        // Ignore if clicking on buttons or inputs
        if ((e.target as HTMLElement).closest("button, input, select")) return;

        dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        e.preventDefault(); // prevent text selection

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
        // Ignore if clicking on buttons or inputs
        if ((e.target as HTMLElement).closest("button, input, select")) return;

        const touch = e.touches[0];
        dragStartRef.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
        // e.preventDefault(); // might block scrolling if we aren't careful, but since it's a dialog...

        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("touchend", handleTouchEnd);
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!dragStartRef.current) return;
        e.preventDefault(); // prevent scrolling while dragging
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

    // Cleanup
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
            className="fixed left-4 bottom-20 z-[70] w-80 rounded-2xl border border-slate-800 bg-slate-950 shadow-xl text-[11px] cursor-move touch-none"
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                // ensure it's on top and reachable
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            <div className="flex items-start justify-between mb-2 px-4 pt-3 pointer-events-none">
                <div className="flex items-center gap-1.5 pointer-events-auto">
                    <span className="material-icons text-[16px]" style={{ color: EV_ORANGE }}>bolt</span>
                    <div className="flex flex-col">
                        <span className="text-[12px] font-semibold text-white">Flash Deal Control</span>
                        <span className="text-[10px] text-slate-400">Countdown + urgency + buyer CTAs</span>
                    </div>
                </div>
                <button className="text-[10px] text-slate-400 hover:text-white pointer-events-auto" onClick={onClose}>Close</button>
            </div>

            <div className="px-4 pb-3">
                <p className="text-[11px] text-slate-300 mb-3 pointer-events-none">
                    Start a limited-time offer. Discount applies to the currently featured product.
                </p>

                <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] text-slate-400 pointer-events-none">Duration</span>
                    <div className="flex gap-1">
                        {durationOptions.map((d) => (
                            <button
                                key={d}
                                className={`px-2 py-0.5 rounded-full text-[10px] border ${duration === d ? "bg-white text-slate-900 border-white" : "bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800"}`}
                                onClick={() => setDuration(d)}
                            >
                                {d} min
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[10px] text-slate-400 pointer-events-none">Extra discount</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            className="w-14 px-2 py-1 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-[11px] outline-none"
                            value={discount}
                            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                        />
                        <span className="text-[10px] text-slate-400 pointer-events-none">%</span>
                    </div>
                </div>

                <button
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold text-white shadow-sm"
                    style={{ backgroundColor: EV_ORANGE }}
                    onClick={() => onStart(duration, discount)}
                >
                    <span className="material-icons text-[14px]">play_arrow</span>
                    Start flash deal
                </button>
            </div>
        </div>
    );
}
