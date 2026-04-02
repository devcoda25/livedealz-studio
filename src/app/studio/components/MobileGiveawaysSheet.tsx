/**
 * MobileGiveawaysSheet - Native giveaway management
 * 
 * Run giveaways for viewers
 */

import React, { memo, useState, useEffect } from "react";

interface Giveaway {
    id: string;
    prize: string;
    winners: number;
    entries: number;
    isActive: boolean;
    countdown: number;
    winnerNames?: string[];
}

interface MobileGiveawaysSheetProps {
    isOpen: boolean;
    onClose: () => void;
    giveaways: Giveaway[];
    onCreateGiveaway: (prize: string, winners: number, duration: number) => void;
    onEndGiveaway: (id: string) => void;
    darkMode?: boolean;
}

export const MobileGiveawaysSheet = memo(function MobileGiveawaysSheet({
    isOpen,
    onClose,
    giveaways,
    onCreateGiveaway,
    onEndGiveaway,
    darkMode = true,
}: MobileGiveawaysSheetProps) {
    const [showCreate, setShowCreate] = useState(false);
    const [prize, setPrize] = useState("");
    const [winners, setWinners] = useState(1);
    const [duration, setDuration] = useState(60);

    if (!isOpen) return null;

    const handleCreate = () => {
        if (prize.trim()) {
            onCreateGiveaway(prize.trim(), winners, duration);
            setPrize("");
            setWinners(1);
            setShowCreate(false);
        }
    };

    const activeGiveaway = giveaways.find(g => g.isActive);

    return (
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50" onClick={onClose} />
            <div className={`fixed bottom-0 left-0 right-0 z-50 ${darkMode ? "bg-[#1C1C1E]" : "bg-white"} rounded-t-[24px] animate-in slide-in-from-bottom duration-300 max-h-[80vh]`}>
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className={`w-9 h-1 rounded-full ${darkMode ? "bg-white/20" : "bg-slate-300"}`} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-2">
                    <h2 className={`${darkMode ? "text-white" : "text-slate-900"} text-[17px] font-semibold`}>Giveaways</h2>
                    <button onClick={onClose} className={`w-7 h-7 rounded-full flex items-center justify-center ${darkMode ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500"}`}>
                        <span className="material-icons text-[16px]">close</span>
                    </button>
                </div>

                {!showCreate ? (
                    <>
                        {/* Active giveaway */}
                        {activeGiveaway && (
                            <div className="px-4 py-3">
                                <div className={`p-4 rounded-xl ${darkMode ? "bg-amber-500/10 border border-amber-500/30" : "bg-amber-50 border border-amber-200"}`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="material-icons text-amber-400 text-[18px]">card_giftcard</span>
                                        <span className="text-amber-400 text-[11px] font-bold uppercase">Live Giveaway</span>
                                    </div>
                                    <h3 className={`${darkMode ? "text-white" : "text-slate-900"} text-lg font-bold mb-2`}>{activeGiveaway.prize}</h3>
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="flex items-center gap-1">
                                            <span className="material-icons text-[16px] text-white/40">people</span>
                                            <span className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[12px]`}>{activeGiveaway.entries} entries</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="material-icons text-[16px] text-white/40">emoji_events</span>
                                            <span className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[12px]`}>{activeGiveaway.winners} winner{activeGiveaway.winners > 1 ? "s" : ""}</span>
                                        </div>
                                    </div>
                                    {/* Countdown */}
                                    {activeGiveaway.countdown > 0 && (
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="material-icons text-[18px] text-amber-400">timer</span>
                                            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                                                <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${(activeGiveaway.countdown / 60) * 100}%` }} />
                                            </div>
                                            <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[12px] font-mono`}>{activeGiveaway.countdown}s</span>
                                        </div>
                                    )}
                                    {/* Winners */}
                                    {activeGiveaway.winnerNames && activeGiveaway.winnerNames.length > 0 && (
                                        <div className={`p-3 rounded-lg ${darkMode ? "bg-black/20" : "bg-white/50"} mb-3`}>
                                            <span className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[10px] font-medium uppercase`}>Winners</span>
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {activeGiveaway.winnerNames.map((name, i) => (
                                                    <span key={i} className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-medium">
                                                        {name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => onEndGiveaway(activeGiveaway.id)}
                                        className="w-full py-2.5 rounded-xl bg-red-500/20 text-red-400 text-[12px] font-semibold"
                                    >
                                        End Giveaway
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Past giveaways */}
                        <div className="px-4 py-2 max-h-[30vh] overflow-y-auto">
                            {giveaways.filter(g => !g.isActive).length === 0 && !activeGiveaway ? (
                                <div className={`flex flex-col items-center justify-center py-8 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                                    <span className="material-icons text-4xl mb-2">card_giftcard</span>
                                    <span className="text-sm">No giveaways yet</span>
                                    <span className="text-xs mt-1">Run a giveaway to engage viewers</span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {giveaways.filter(g => !g.isActive).map((g) => (
                                        <div key={g.id} className={`p-3 rounded-xl ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
                                            <h4 className={`${darkMode ? "text-white" : "text-slate-900"} text-sm font-medium`}>{g.prize}</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className={`${darkMode ? "text-white/40" : "text-slate-400"} text-[10px]`}>{g.entries} entries</span>
                                                <span className={`${darkMode ? "text-white/40" : "text-slate-400"} text-[10px]`}>{g.winners} winner{g.winners > 1 ? "s" : ""}</span>
                                            </div>
                                            {g.winnerNames && g.winnerNames.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {g.winnerNames.map((name, i) => (
                                                        <span key={i} className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px]">
                                                            {name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Create button */}
                        {!activeGiveaway && (
                            <div className="px-4 py-3">
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="w-full py-3 rounded-xl bg-[#FF5C00] text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                                >
                                    <span className="material-icons text-[18px]">add</span>
                                    Start Giveaway
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    /* Create giveaway form */
                    <div className="px-4 py-3">
                        <div className="space-y-4">
                            <div>
                                <label className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[11px] font-medium uppercase tracking-wider`}>Prize</label>
                                <input
                                    type="text"
                                    value={prize}
                                    onChange={(e) => setPrize(e.target.value)}
                                    placeholder="e.g., $50 Gift Card, Free Product..."
                                    className={`w-full mt-2 px-4 py-3 rounded-xl text-sm ${darkMode ? "bg-white/10 text-white placeholder-white/30" : "bg-slate-50 text-slate-900 placeholder-slate-400"} outline-none`}
                                />
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[11px] font-medium uppercase tracking-wider`}>Winners</label>
                                    <div className="mt-2 flex items-center gap-2">
                                        <button onClick={() => setWinners(Math.max(1, winners - 1))} className={`w-10 h-10 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"} flex items-center justify-center`}>
                                            <span className="material-icons text-[18px]">remove</span>
                                        </button>
                                        <span className={`${darkMode ? "text-white" : "text-slate-900"} text-lg font-bold w-8 text-center`}>{winners}</span>
                                        <button onClick={() => setWinners(Math.min(10, winners + 1))} className={`w-10 h-10 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"} flex items-center justify-center`}>
                                            <span className="material-icons text-[18px]">add</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[11px] font-medium uppercase tracking-wider`}>Duration</label>
                                    <div className="mt-2 flex items-center gap-2">
                                        <button onClick={() => setDuration(Math.max(30, duration - 30))} className={`w-10 h-10 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"} flex items-center justify-center`}>
                                            <span className="material-icons text-[18px]">remove</span>
                                        </button>
                                        <span className={`${darkMode ? "text-white" : "text-slate-900"} text-sm font-bold w-12 text-center`}>{duration}s</span>
                                        <button onClick={() => setDuration(Math.min(300, duration + 30))} className={`w-10 h-10 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"} flex items-center justify-center`}>
                                            <span className="material-icons text-[18px]">add</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowCreate(false)} className={`flex-1 py-3 rounded-xl ${darkMode ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500"} text-sm font-semibold`}>
                                    Cancel
                                </button>
                                <button onClick={handleCreate} className="flex-1 py-3 rounded-xl bg-[#FF5C00] text-white text-sm font-semibold">
                                    Start
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="h-safe" />
            </div>
        </>
    );
});

export default MobileGiveawaysSheet;
