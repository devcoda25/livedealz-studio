/**
 * MobilePollsSheet - Native live polls
 * 
 * Create and manage live polls for viewers
 */

import React, { memo, useState } from "react";

interface PollOption {
    id: string;
    text: string;
    votes: number;
}

interface Poll {
    id: string;
    question: string;
    options: PollOption[];
    isActive: boolean;
    totalVotes: number;
}

interface MobilePollsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    polls: Poll[];
    onCreatePoll: (question: string, options: string[]) => void;
    onEndPoll: (id: string) => void;
    darkMode?: boolean;
}

export const MobilePollsSheet = memo(function MobilePollsSheet({
    isOpen,
    onClose,
    polls,
    onCreatePoll,
    onEndPoll,
    darkMode = true,
}: MobilePollsSheetProps) {
    const [showCreate, setShowCreate] = useState(false);
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);

    if (!isOpen) return null;

    const handleCreate = () => {
        if (question.trim() && options.filter(o => o.trim()).length >= 2) {
            onCreatePoll(question.trim(), options.filter(o => o.trim()));
            setQuestion("");
            setOptions(["", ""]);
            setShowCreate(false);
        }
    };

    const addOption = () => {
        if (options.length < 5) setOptions([...options, ""]);
    };

    const activePoll = polls.find(p => p.isActive);

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
                    <h2 className={`${darkMode ? "text-white" : "text-slate-900"} text-[18px] font-black uppercase tracking-widest`}>Polls</h2>
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
                            {/* Active Poll Section */}
                            {activePoll && (
                                <div className={`p-6 rounded-[32px] border relative overflow-hidden ${darkMode ? "bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5" : "bg-emerald-50 border border-emerald-200 shadow-xl"}`}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                                        <span className="text-emerald-500 text-[11px] font-black uppercase tracking-[0.2em]">Active Live Poll</span>
                                    </div>
                                    
                                    <h3 className={`${darkMode ? "text-white" : "text-slate-900"} text-[16px] font-black mb-6 uppercase leading-tight`}>{activePoll.question}</h3>
                                    
                                    <div className="space-y-3 mb-6">
                                        {activePoll.options.map((opt) => {
                                            const percentage = activePoll.totalVotes > 0 ? Math.round((opt.votes / activePoll.totalVotes) * 100) : 0;
                                            return (
                                                <div key={opt.id} className="relative group">
                                                    {/* Custom Track */}
                                                    <div className={`absolute inset-0 rounded-2xl ${darkMode ? "bg-white/5" : "bg-black/5"}`} />
                                                    {/* Custom Progress */}
                                                    <div 
                                                        className={`absolute inset-y-0 left-0 rounded-2xl transition-all duration-1000 ${percentage > 50 ? "bg-[#f77f00]" : "bg-emerald-500 opacity-60"}`} 
                                                        style={{ width: `${percentage}%` }} 
                                                    />
                                                    <div className="relative flex items-center justify-between px-4 py-3.5">
                                                        <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[13px] font-black uppercase tracking-tight`}>{opt.text}</span>
                                                        <span className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[12px] font-black tabular-nums shadow-sm`}>{percentage}%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                        <div className="flex items-center gap-2">
                                            <span className="material-icons text-[16px] text-[#f77f00]">how_to_vote</span>
                                            <span className={`${darkMode ? "text-white/40" : "text-slate-500"} text-[11px] font-black uppercase tracking-widest`}>{activePoll.totalVotes} Total Votes</span>
                                        </div>
                                        <button
                                            onClick={() => onEndPoll(activePoll.id)}
                                            className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                        >
                                            End Poll
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Poll History */}
                            <div className="space-y-4">
                                <h3 className={`${darkMode ? "text-white/40" : "text-slate-400"} text-[10px] font-black uppercase tracking-[0.3em] px-1`}>Engagement History</h3>
                                
                                {polls.filter(p => !p.isActive).length === 0 && !activePoll ? (
                                    <div className={`flex flex-col items-center justify-center py-12 ${darkMode ? "bg-white/5 border-dashed border-white/10" : "bg-slate-50 border-dashed border-slate-200"} border-2 rounded-[32px]`}>
                                        <span className={`material-icons text-[48px] mb-3 ${darkMode ? "text-white/10" : "text-slate-200"}`}>poll</span>
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? "text-white/20" : "text-slate-400"}`}>No Polls Logged</span>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {polls.filter(p => !p.isActive).map((poll) => (
                                            <div key={poll.id} className={`flex items-center gap-4 p-4 rounded-[24px] border ${darkMode ? "bg-white/5 border-transparent" : "bg-white shadow-sm border-slate-100 hover:bg-slate-50"} transition-all`}>
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${darkMode ? "bg-white/5 text-white/20" : "bg-slate-50 text-slate-400"}`}>
                                                    <span className="material-icons text-[22px]">bar_chart</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`${darkMode ? "text-white" : "text-slate-900"} text-[14px] font-black uppercase tracking-tight truncate`}>{poll.question}</h4>
                                                    <span className={`${darkMode ? "text-white/20" : "text-slate-400"} text-[10px] font-bold uppercase tracking-widest mt-0.5`}>{poll.totalVotes} Participants Logged</span>
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
                                    <label className={`${darkMode ? "text-white/40" : "text-slate-500"} text-[10px] font-black uppercase tracking-[0.2em] px-1`}>Poll Question</label>
                                    <input
                                        type="text"
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        placeholder="EX: WHICH SHADE DO YOU PREFER?"
                                        className={`w-full px-5 py-4 rounded-2xl text-[14px] font-bold transition-all border outline-none ${darkMode ? "bg-white/5 border-white/10 focus:border-[#f77f00] text-white placeholder-white/20" : "bg-slate-50 border-slate-200 focus:border-[#f77f00] text-slate-900 placeholder-slate-400"}`}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className={`${darkMode ? "text-white/40" : "text-slate-500"} text-[10px] font-black uppercase tracking-[0.2em] px-1`}>Options (Min 2)</label>
                                    <div className="space-y-3">
                                        {options.map((opt, i) => (
                                            <div key={i} className="relative group">
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const newOpts = [...options];
                                                        newOpts[i] = e.target.value;
                                                        setOptions(newOpts);
                                                    }}
                                                    placeholder={`Option ${i + 1}`}
                                                    className={`w-full px-5 py-3.5 rounded-2xl text-[13px] font-bold transition-all border outline-none ${darkMode ? "bg-white/5 border-white/10 focus:border-[#f77f00] text-white placeholder-white/20" : "bg-slate-50 border-slate-200 focus:border-[#f77f00] text-slate-900 placeholder-slate-400"}`}
                                                />
                                                {options.length > 2 && (
                                                    <button 
                                                        onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                                    >
                                                        <span className="material-icons text-[18px]">remove_circle_outline</span>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {options.length < 5 && (
                                            <button 
                                                onClick={addOption} 
                                                className={`w-full py-3.5 rounded-[24px] border border-dashed transition-all flex items-center justify-center gap-2 ${darkMode ? "border-white/10 text-white/20 hover:border-white/20 hover:text-white/40" : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500"}`}
                                            >
                                                <span className="material-icons text-[18px]">add</span>
                                                <span className="text-[11px] font-black uppercase tracking-widest">Add Vote Option</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setShowCreate(false)} className={`flex-1 py-4 rounded-2xl text-[12px] font-black uppercase tracking-[0.1em] ${darkMode ? "bg-white/5 text-white/40" : "bg-slate-100 text-slate-500"}`}>
                                        Discard
                                    </button>
                                    <button onClick={handleCreate} className="flex-2 py-4 px-10 rounded-2xl bg-[#f77f00] text-white text-[13px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#f77f00]/20 active:scale-95 transition-all">
                                        Launch Live Poll
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                {!showCreate && (
                    <div className={`p-6 border-t ${darkMode ? "border-white/5" : "border-slate-100"}`}>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="w-full py-4 rounded-2xl bg-[#f77f00] text-white text-[13px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg shadow-[#f77f00]/20 active:scale-95 transition-all"
                        >
                            <span className="material-icons text-[20px]">add_task</span>
                            Create Interaction Poll
                        </button>
                    </div>
                )}

                <div className="h-safe" />
            </div>
        </>
    );
});

export default MobilePollsSheet;
