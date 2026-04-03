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
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50" onClick={onClose} />
            <div className={`fixed bottom-0 left-0 right-0 z-50 ${darkMode ? "bg-[#1C1C1E]" : "bg-white"} rounded-t-[24px] animate-in slide-in-from-bottom duration-300 max-h-[80vh]`}>
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className={`w-9 h-1 rounded-full ${darkMode ? "bg-white/20" : "bg-slate-300"}`} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-2">
                    <h2 className={`${darkMode ? "text-white" : "text-slate-900"} text-[17px] font-semibold`}>Polls</h2>
                    <button onClick={onClose} className={`w-7 h-7 rounded-full flex items-center justify-center ${darkMode ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500"}`}>
                        <span className="material-icons text-[16px]">close</span>
                    </button>
                </div>

                {!showCreate ? (
                    <>
                        {/* Active poll */}
                        {activePoll && (
                            <div className="px-4 py-3">
                                <div className={`p-4 rounded-xl ${darkMode ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-emerald-50 border border-emerald-200"}`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                        <span className="text-emerald-400 text-[11px] font-bold uppercase">Live Poll</span>
                                    </div>
                                    <h3 className={`${darkMode ? "text-white" : "text-slate-900"} text-sm font-semibold mb-3`}>{activePoll.question}</h3>
                                    <div className="space-y-2">
                                        {activePoll.options.map((opt) => {
                                            const percentage = activePoll.totalVotes > 0 ? Math.round((opt.votes / activePoll.totalVotes) * 100) : 0;
                                            return (
                                                <div key={opt.id} className="relative">
                                                    <div className={`absolute inset-0 rounded-lg ${darkMode ? "bg-white/10" : "bg-slate-100"}`} style={{ width: `${percentage}%` }} />
                                                    <div className="relative flex items-center justify-between px-3 py-2">
                                                        <span className={`${darkMode ? "text-white" : "text-slate-900"} text-sm`}>{opt.text}</span>
                                                        <span className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[12px] font-bold`}>{percentage}%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <span className={`${darkMode ? "text-white/40" : "text-slate-400"} text-[11px]`}>{activePoll.totalVotes} votes</span>
                                        <button
                                            onClick={() => onEndPoll(activePoll.id)}
                                            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-[11px] font-semibold"
                                        >
                                            End Poll
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Past polls */}
                        <div className="px-4 py-2 max-h-[40vh] overflow-y-auto">
                            {polls.filter(p => !p.isActive).length === 0 && !activePoll ? (
                                <div className={`flex flex-col items-center justify-center py-8 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                                    <span className="material-icons text-4xl mb-2">poll</span>
                                    <span className="text-sm">No polls yet</span>
                                    <span className="text-xs mt-1">Create a poll to engage viewers</span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {polls.filter(p => !p.isActive).map((poll) => (
                                        <div key={poll.id} className={`p-3 rounded-xl ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
                                            <h4 className={`${darkMode ? "text-white" : "text-slate-900"} text-sm font-medium mb-1`}>{poll.question}</h4>
                                            <span className={`${darkMode ? "text-white/40" : "text-slate-400"} text-[10px]`}>{poll.totalVotes} votes</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Create button */}
                        <div className="px-4 py-3">
                            <button
                                onClick={() => setShowCreate(true)}
                                className="w-full py-3 rounded-xl bg-[#FF5C00] text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                                <span className="material-icons text-[18px]">add</span>
                                Create Poll
                            </button>
                        </div>
                    </>
                ) : (
                    /* Create poll form */
                    <div className="px-4 py-3">
                        <div className="space-y-4">
                            <div>
                                <label className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[11px] font-medium uppercase tracking-wider`}>Question</label>
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="Ask your viewers..."
                                    className={`w-full mt-2 px-4 py-3 rounded-xl text-sm ${darkMode ? "bg-white/10 text-white placeholder-white/30" : "bg-slate-50 text-slate-900 placeholder-slate-400"} outline-none`}
                                />
                            </div>
                            <div>
                                <label className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[11px] font-medium uppercase tracking-wider`}>Options</label>
                                <div className="mt-2 space-y-2">
                                    {options.map((opt, i) => (
                                        <input
                                            key={i}
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                                const newOpts = [...options];
                                                newOpts[i] = e.target.value;
                                                setOptions(newOpts);
                                            }}
                                            placeholder={`Option ${i + 1}`}
                                            className={`w-full px-4 py-2.5 rounded-xl text-sm ${darkMode ? "bg-white/10 text-white placeholder-white/30" : "bg-slate-50 text-slate-900 placeholder-slate-400"} outline-none`}
                                        />
                                    ))}
                                    {options.length < 5 && (
                                        <button onClick={addOption} className={`w-full py-2 rounded-xl border-2 border-dashed ${darkMode ? "border-white/10 text-white/40" : "border-slate-200 text-slate-400"} text-sm`}>
                                            + Add Option
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowCreate(false)} className={`flex-1 py-3 rounded-xl ${darkMode ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500"} text-sm font-semibold`}>
                                    Cancel
                                </button>
                                <button onClick={handleCreate} className="flex-1 py-3 rounded-xl bg-[#FF5C00] text-white text-sm font-semibold">
                                    Start Poll
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

export default MobilePollsSheet;
