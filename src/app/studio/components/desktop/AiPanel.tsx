import React from "react";
import { AiHint } from "../shared/types";
import { severityPillClass } from "../shared/utils";

export function AiPanel({ prompts }: { prompts: AiHint[] }) {
    return (
        <div className="bg-card border border-border rounded-2xl p-3 flex flex-col gap-2 text-[11px] overflow-hidden">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-[13px]">💡</span>
                    <h3 className="text-xs font-semibold">Live AI prompts</h3>
                </div>
                <span className="text-[10px] text-muted">Real-time hints</span>
            </div>
            <ul className="space-y-1 max-h-52 overflow-y-auto">
                {prompts.map((p) => (
                    <li key={p.id} className="border border-border rounded-xl px-2.5 py-1.5 bg-background text-[10px] text-foreground">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] ${severityPillClass(p.severity)}`}>{p.severity}</span>
                            <span className="text-[9px] text-muted">{p.time}</span>
                        </div>
                        {p.text}
                    </li>
                ))}
            </ul>
        </div>
    );
}
