import React from "react";

export function LanguagePanel({ onClose, liveLangMix }: { onClose: () => void; liveLangMix: { label: string; pct: number }[] }) {
    return (
        <div className="fixed right-4 top-20 z-[70]">
            <div className="w-80 rounded-2xl border border-border bg-muted shadow-xl px-4 py-3 text-[11px]">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                        <span className="material-icons text-[16px] text-foreground">translate</span>
                        <span className="text-[12px] font-semibold text-foreground">Language & AI audio</span>
                    </div>
                    <button className="text-[10px] text-muted-foreground hover:text-foreground" onClick={onClose}>Close</button>
                </div>

                <div className="space-y-3">
                    <div>
                        <div className="text-[10px] text-muted-foreground mb-1">Live viewer language mix (sample)</div>
                        <div className="flex flex-wrap gap-1">
                            {liveLangMix.map((s) => (
                                <span key={s.label} className="px-2 py-0.5 rounded-full bg-card border border-border text-[10px] text-foreground">
                                    {s.label} · {s.pct}%
                                </span>
                            ))}
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                        Buyers choose their preferred language, and whether they hear AI audio or read captions.
                    </p>
                </div>
            </div>
        </div>
    );
}
