import React, { useState, useRef, useEffect } from "react";
import { EV_ORANGE } from "./constants";

export function FlashDealDialog(props: { onClose: () => void; onStart: (durationMin: number, discountPct: number) => void }) {
    const { onClose, onStart } = props;
    const [duration, setDuration] = useState(5);
    const [discount, setDiscount] = useState(15);
    const durationOptions = [5, 10, 15];

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);
    const dialogRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        isDraggingRef.current = true;
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingRef.current) {
                setPosition((pos) => ({
                    x: pos.x + e.movementX,
                    y: pos.y + e.movementY,
                }));
            }
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
        };

        if (isDraggingRef.current) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }

        // Always listen to mouseup on the window to catch the case where the mouse is released outside the component
        window.addEventListener("mouseup", handleMouseUp);


        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDraggingRef.current]);

    return (
        <div
            ref={dialogRef}
            className="fixed left-4 bottom-4 z-[70] w-80 rounded-2xl border border-slate-800 bg-slate-950 shadow-xl text-[11px]"
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        >
            <div
                className="flex items-start justify-between mb-2 px-4 pt-3 cursor-move"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-1.5">
                    <span className="material-icons text-[16px]" style={{ color: EV_ORANGE }}>bolt</span>
                    <div className="flex flex-col">
                        <span className="text-[12px] font-semibold text-white">Flash Deal Control</span>
                        <span className="text-[10px] text-slate-400">Countdown + urgency + buyer CTAs</span>
                    </div>
                </div>
                <button className="text-[10px] text-slate-400 hover:text-white" onClick={onClose}>Close</button>
            </div>

            <div className="px-4 pb-3">
                <p className="text-[11px] text-slate-300 mb-3">
                    Start a limited-time offer. Discount applies to the currently featured product.
                </p>

                <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] text-slate-400">Duration</span>
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
                    <span className="text-[10px] text-slate-400">Extra discount</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            className="w-14 px-2 py-1 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-[11px] outline-none"
                            value={discount}
                            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                        />
                        <span className="text-[10px] text-slate-400">%</span>
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
