import React, { useState, useRef, useEffect } from "react";

interface CoHostsHUDProps {
    darkMode?: boolean;
    coHosts: { id: number; name: string; status: string }[];
    onInvite: (name: string) => void;
    onClose: () => void;
}

export function CoHostsHUD({ darkMode = true, coHosts, onInvite, onClose }: CoHostsHUDProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

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
                        <span className="material-icons text-[18px] text-purple-400">group</span>
                        <span className={`text-[13px] font-semibold ${darkMode ? "text-white" : "text-slate-700"}`}>Co-host & Crew</span>
                    </div>
                    <button onClick={onClose} className={`p-1.5 hover:bg-muted rounded-full transition-colors ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                        <span className="material-icons text-[18px]">close</span>
                    </button>
                </div>

                {/* Invite Button */}
                <div className="mb-4">
                    <button 
                        className="w-full py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold flex items-center justify-center gap-2"
                        onClick={() => { const name = window.prompt("Enter co-host name:"); if (name) onInvite(name); }}
                    >
                        <span className="material-icons text-[16px]">person_add</span>
                        Invite Co-host
                    </button>
                </div>

                {/* Co-hosts List */}
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {coHosts.length === 0 ? (
                        <div className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"} text-center py-4`}>
                            No co-hosts yet. Invite someone to join your stream!
                        </div>
                    ) : (
                        coHosts.map((c) => (
                            <div key={c.id} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-[12px] font-semibold ${darkMode ? "bg-slate-800 text-slate-100" : "bg-slate-200 text-slate-600"}`}>
                                        {c.name.split(" ").map((w) => w[0]).join("")}
                                    </div>
                                    <div className="min-w-0">
                                        <div className={`text-[11px] font-semibold ${darkMode ? "text-slate-100" : "text-slate-700"} truncate`}>{c.name}</div>
                                        <div className={`text-[9px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{c.status}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        className="px-3 py-1.5 rounded-full border border-emerald-500/50 bg-emerald-500/10 text-emerald-300 text-[9px] hover:bg-emerald-500/20"
                                        onClick={() => alert("Accept (demo)")}
                                    >
                                        Accept
                                    </button>
                                    <button 
                                        className="px-3 py-1.5 rounded-full border border-slate-700 bg-muted text-muted-foreground text-[9px] hover:bg-muted/80"
                                        onClick={() => alert("Remove (demo)")}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
