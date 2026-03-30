import React, { useState, useRef, useEffect } from "react";

interface AttachmentsHUDProps {
    darkMode?: boolean;
    attachments: { id: number; from: string; type: string; label: string; status: string }[];
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
    onClose: () => void;
}

export function AttachmentsHUD({ darkMode = true, attachments, onApprove, onReject, onClose }: AttachmentsHUDProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    const pending = attachments.filter((a) => a.status === "Pending");
    const approved = attachments.filter((a) => a.status === "Approved");
    const rejected = attachments.filter((a) => a.status === "Rejected");

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
                        <span className="material-icons text-[18px] text-blue-400">attach_file</span>
                        <span className={`text-[13px] font-semibold ${darkMode ? "text-white" : "text-slate-700"}`}>Attachments</span>
                        {pending.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[9px] font-medium">
                                {pending.length} pending
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className={`p-1.5 hover:bg-muted rounded-full transition-colors ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                        <span className="material-icons text-[18px]">close</span>
                    </button>
                </div>

                {/* Pending Section */}
                {pending.length > 0 && (
                    <div className="mb-4">
                        <div className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"} mb-2 uppercase tracking-wide`}>Pending</div>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto">
                            {pending.map((a) => (
                                <div key={a.id} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? "bg-slate-900/50" : "bg-slate-50"} border border-orange-500/30`}>
                                    <div className="min-w-0 flex-1">
                                        <div className={`text-[11px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-700"} truncate`}>{a.label}</div>
                                        <div className={`text-[9px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{a.type.toUpperCase()} · {a.from}</div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-2">
                                        <button 
                                            className="px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-medium"
                                            onClick={() => onApprove(a.id)}
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            className={`px-3 py-1.5 rounded-full text-[9px] ${darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-500"}`}
                                            onClick={() => onReject(a.id)}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Approved Section */}
                {approved.length > 0 && (
                    <div className="mb-4">
                        <div className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"} mb-2 uppercase tracking-wide`}>Approved</div>
                        <div className="space-y-1 max-h-[100px] overflow-y-auto">
                            {approved.map((a) => (
                                <div key={a.id} className={`flex items-center justify-between p-2 rounded-lg ${darkMode ? "bg-slate-900/30 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                                    <div className="min-w-0 flex-1">
                                        <div className={`text-[10px] ${darkMode ? "text-slate-300" : "text-slate-600"} truncate`}>{a.label}</div>
                                        <div className={`text-[8px] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>{a.type.toUpperCase()}</div>
                                    </div>
                                    <span className="material-icons text-[14px] text-emerald-700 dark:text-emerald-400">check_circle</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rejected Section */}
                {rejected.length > 0 && (
                    <div>
                        <div className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"} mb-2 uppercase tracking-wide`}>Rejected</div>
                        <div className="space-y-1 max-h-[80px] overflow-y-auto">
                            {rejected.map((a) => (
                                <div key={a.id} className={`flex items-center justify-between p-2 rounded-lg ${darkMode ? "bg-slate-900/20 border-slate-800/50" : "bg-slate-50 border-slate-200"} opacity-60`}>
                                    <div className="min-w-0 flex-1">
                                        <div className={`text-[10px] ${darkMode ? "text-slate-400" : "text-slate-500"} truncate`}>{a.label}</div>
                                        <div className={`text-[8px] ${darkMode ? "text-slate-600" : "text-slate-400"}`}>{a.type.toUpperCase()}</div>
                                    </div>
                                    <span className="material-icons text-[14px] text-red-400">cancel</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {attachments.length === 0 && (
                    <div className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"} text-center py-4`}>
                        No attachments yet
                    </div>
                )}
            </div>
        </div>
    );
}
