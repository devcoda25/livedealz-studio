import React from "react";

export function TeleprompterPanel() {
    const scriptCues = [
        "Welcome + short intro.",
        "Explain key benefits clearly.",
        "Mention flash deal and show the timer.",
        "Answer 2 top questions.",
        "Recommend the best bundle.",
        "Close with CTA and follow reminder.",
    ];
    const runOfShow = [
        { id: "shot-1", label: "Intro + hook", window: "00:00-03:00", scene: "intro" },
        { id: "shot-2", label: "Hero demo", window: "03:00-08:00", scene: "product" },
        { id: "shot-3", label: "Offer + urgency", window: "08:00-12:00", scene: "offer" },
        { id: "shot-4", label: "Q&A", window: "12:00-18:00", scene: "split" },
    ];
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 text-[11px]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-[13px]">📜</span>
                    <h3 className="text-xs font-semibold">Teleprompter</h3>
                </div>
                <span className="text-[10px] text-slate-500">Run-of-show</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-2">
                <div className="space-y-1 max-h-32 overflow-y-auto">
                    {scriptCues.map((cue, idx) => (
                        <div key={idx} className={`text-[10px] px-2 py-1 rounded-lg ${idx === 2 ? "bg-[#f77f00]/20 text-slate-50" : "bg-slate-950 text-slate-200"}`}>
                            {idx === 2 && <span className="mr-1 text-[9px] uppercase tracking-wide text-[#f77f00]">Now:</span>}
                            {cue}
                        </div>
                    ))}
                </div>
                <div className="border border-slate-800 rounded-xl p-2 bg-slate-950 text-[10px] text-slate-200 max-h-32 overflow-y-auto">
                    <ul className="space-y-1">
                        {runOfShow.map((shot) => (
                            <li key={shot.id} className="flex items-center justify-between gap-2">
                                <div className="flex flex-col">
                                    <span className="font-medium">{shot.label}</span>
                                    <span className="text-slate-500">Scene: {shot.scene}</span>
                                </div>
                                <span className="text-slate-400 text-[9px]">{shot.window}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
