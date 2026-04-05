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
            {/* Backdrop */}
            <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${darkMode ? "bg-black/60" : "bg-slate-900/40"} backdrop-blur-sm animate-in fade-in`} onClick={onClose} />
            
            {/* Bottom Sheet */}
            <div className={`
                fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] animate-in slide-in-from-bottom duration-400 ease-out max-h-[85vh] flex flex-col
                ${darkMode ? "bg-[#121212]/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl" : "bg-white/95 backdrop-blur-2xl border-t border-slate-200 shadow-xl"}
            `}>
                {/* Drag Handle */}
                <div className="w-full flex justify-center pt-4 pb-1 cursor-pointer group" onClick={onClose}>
                    <div className={`w-12 h-1.5 rounded-full transition-colors ${darkMode ? "bg-white/10 group-hover:bg-white/20" : "bg-slate-200 group-hover:bg-slate-300"}`} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-2">
                    <h2 className={`${darkMode ? "text-white" : "text-slate-900"} text-[18px] font-black uppercase tracking-widest`}>Giveaways</h2>
                    <button 
                        onClick={onClose} 
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? "bg-white/5 hover:bg-white/10 text-white/40" : "bg-slate-100 hover:bg-slate-200 text-slate-400"}`}
                    >
                        <span className="material-icons text-[18px]">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {!showCreate ? (
                        <div className="px-6 py-4 space-y-6">
                            {/* Active Giveaway Section */}
                            {activeGiveaway && (
                                <div className={`p-6 rounded-[32px] border relative overflow-hidden ${darkMode ? "bg-[#f77f00]/10 border-[#f77f00]/30 shadow-lg shadow-[#f77f00]/5" : "bg-[#f77f00]/5 border-[#f77f00]/20 shadow-xl"}`}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2 h-2 bg-[#f77f00] rounded-full animate-ping" />
                                        <span className="text-[#f77f00] text-[11px] font-black uppercase tracking-[0.2em]">Active Giveaway</span>
                                    </div>
                                    
                                    <h3 className={`${darkMode ? "text-white" : "text-slate-900"} text-2xl font-black mb-4 uppercase leading-tight`}>{activeGiveaway.prize}</h3>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className={`p-4 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white shadow-sm"}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="material-icons text-[16px] text-[#f77f00]">people</span>
                                                <span className="text-[14px] font-black text-[#f77f00]">{activeGiveaway.entries}</span>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase ${darkMode ? "text-white/20" : "text-slate-400"}`}>Entries</span>
                                        </div>
                                        <div className={`p-4 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white shadow-sm"}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="material-icons text-[16px] text-emerald-500">emoji_events</span>
                                                <span className="text-[14px] font-black text-emerald-500">{activeGiveaway.winners}</span>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase ${darkMode ? "text-white/20" : "text-slate-400"}`}>Winners</span>
                                        </div>
                                    </div>

                                    {/* Progressive Countdown */}
                                    {activeGiveaway.countdown > 0 && (
                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-white/40" : "text-slate-500"}`}>Closing Soon</span>
                                                <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[13px] font-black tabular-nums`}>{activeGiveaway.countdown}s Remaining</span>
                                            </div>
                                            <div className={`h-2.5 rounded-full overflow-hidden ${darkMode ? "bg-white/5" : "bg-black/5"}`}>
                                                <div 
                                                    className="h-full bg-[#f77f00] shadow-[0_0_10px_rgba(247,127,0,0.5)] transition-all duration-1000" 
                                                    style={{ width: `${(activeGiveaway.countdown / 60) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Winner Display Area */}
                                    {activeGiveaway.winnerNames && activeGiveaway.winnerNames.length > 0 && (
                                        <div className={`p-4 rounded-2xl ${darkMode ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-100"} mb-6 animate-in zoom-in-95`}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="material-icons text-emerald-500 text-[18px]">workspace_premium</span>
                                                <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Winners Selected</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {activeGiveaway.winnerNames.map((name, i) => (
                                                    <span key={i} className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-black uppercase">
                                                        {name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => onEndGiveaway(activeGiveaway.id)}
                                        className="w-full py-4 rounded-2xl bg-red-500/10 text-red-500 text-[12px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all"
                                    >
                                        Terminate Giveaway
                                    </button>
                                </div>
                            )}

                            {/* Dashboard & History */}
                            <div className="space-y-4">
                                <h3 className={`${darkMode ? "text-white/40" : "text-slate-400"} text-[10px] font-black uppercase tracking-[0.3em] px-1`}>Giveaway History</h3>
                                
                                {giveaways.filter(g => !g.isActive).length === 0 && !activeGiveaway ? (
                                    <div className={`flex flex-col items-center justify-center py-12 ${darkMode ? "bg-white/5 border-dashed border-white/10" : "bg-slate-50 border-dashed border-slate-200"} border-2 rounded-[32px]`}>
                                        <span className={`material-icons text-[48px] mb-3 ${darkMode ? "text-white/10" : "text-slate-200"}`}>card_giftcard</span>
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? "text-white/20" : "text-slate-400"}`}>Vault Empty</span>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {giveaways.filter(g => !g.isActive).map((g) => (
                                            <div key={g.id} className={`flex items-center gap-4 p-4 rounded-[24px] border ${darkMode ? "bg-white/5 border-transparent" : "bg-white shadow-sm border-slate-100 hover:bg-slate-50"} transition-all`}>
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${darkMode ? "bg-white/5 text-white/20" : "bg-slate-50 text-slate-400"}`}>
                                                    <span className="material-icons text-[22px]">history</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`${darkMode ? "text-white" : "text-slate-900"} text-[14px] font-black uppercase tracking-tight truncate`}>{g.prize}</h4>
                                                    <div className="flex items-center gap-3 mt-0.5">
                                                        <span className={`${darkMode ? "text-white/20" : "text-slate-400"} text-[10px] font-bold uppercase`}>{g.entries} Participants</span>
                                                        <span className={`${darkMode ? "text-white/20" : "text-slate-400"} text-[10px] font-bold uppercase`}>{g.winners} Placed</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Configuration Interface */
                        <div className="px-6 py-4 animate-in slide-in-from-right duration-300">
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className={`${darkMode ? "text-white/40" : "text-slate-500"} text-[10px] font-black uppercase tracking-[0.2em] px-1`}>Giveaway Prize</label>
                                    <input
                                        type="text"
                                        value={prize}
                                        onChange={(e) => setPrize(e.target.value)}
                                        placeholder="e.g., $100 EV_STUDIO CREDIT"
                                        className={`w-full px-5 py-4 rounded-2xl text-[14px] font-bold transition-all border outline-none ${darkMode ? "bg-white/5 border-white/10 focus:border-[#f77f00] text-white placeholder-white/20" : "bg-slate-50 border-slate-200 focus:border-[#f77f00] text-slate-900 placeholder-slate-400"}`}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className={`${darkMode ? "text-white/40" : "text-slate-500"} text-[10px] font-black uppercase tracking-[0.2em] px-1`}>Winners</label>
                                        <div className={`flex items-center justify-between p-2 rounded-2xl ${darkMode ? "bg-white/5" : "bg-slate-50"} border ${darkMode ? "border-white/10" : "border-slate-200"}`}>
                                            <button onClick={() => setWinners(Math.max(1, winners - 1))} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${darkMode ? "text-white/60 hover:bg-white/10 active:scale-95" : "text-slate-500 hover:bg-white shadow-sm active:scale-95"}`}>
                                                <span className="material-icons text-[18px]">remove</span>
                                            </button>
                                            <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[16px] font-black tabular-nums`}>{winners}</span>
                                            <button onClick={() => setWinners(Math.min(10, winners + 1))} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${darkMode ? "text-white/60 hover:bg-white/10 active:scale-95" : "text-slate-500 hover:bg-white shadow-sm active:scale-95"}`}>
                                                <span className="material-icons text-[18px]">add</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className={`${darkMode ? "text-white/40" : "text-slate-500"} text-[10px] font-black uppercase tracking-[0.2em] px-1`}>Duration (sec)</label>
                                        <div className={`flex items-center justify-between p-2 rounded-2xl ${darkMode ? "bg-white/5" : "bg-slate-50"} border ${darkMode ? "border-white/10" : "border-slate-200"}`}>
                                            <button onClick={() => setDuration(Math.max(30, duration - 30))} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${darkMode ? "text-white/60 hover:bg-white/10 active:scale-95" : "text-slate-500 hover:bg-white shadow-sm active:scale-95"}`}>
                                                <span className="material-icons text-[18px]">remove</span>
                                            </button>
                                            <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[16px] font-black tabular-nums`}>{duration}</span>
                                            <button onClick={() => setDuration(Math.min(300, duration + 30))} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${darkMode ? "text-white/60 hover:bg-white/10 active:scale-95" : "text-slate-500 hover:bg-white shadow-sm active:scale-95"}`}>
                                                <span className="material-icons text-[18px]">add</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setShowCreate(false)} className={`flex-1 py-4 rounded-2xl text-[12px] font-black uppercase tracking-[0.1em] ${darkMode ? "bg-white/5 text-white/40" : "bg-slate-100 text-slate-500"}`}>
                                        Discard
                                    </button>
                                    <button onClick={handleCreate} className="flex-2 py-4 px-10 rounded-2xl bg-[#f77f00] text-white text-[13px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#f77f00]/20 active:scale-95 transition-all">
                                        Broadcast Giveaway
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                {!showCreate && !activeGiveaway && (
                    <div className={`p-6 border-t ${darkMode ? "border-white/5" : "border-slate-100"}`}>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="w-full py-4 rounded-2xl bg-[#f77f00] text-white text-[13px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg shadow-[#f77f00]/20 active:scale-95 transition-all"
                        >
                            <span className="material-icons text-[20px]">add_circle</span>
                            Initialize New Giveaway
                        </button>
                    </div>
                )}

                <div className="h-safe" />
            </div>
        </>
    );
});

export default MobileGiveawaysSheet;
