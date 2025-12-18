import React from "react";

export function StatPill({ label, value }: { label: string; value: string }) {
    return (
        <span className="inline-flex flex-col items-start px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px]">
            <span className="text-[9px] text-slate-400">{label}</span>
            <span className="text-[11px] font-semibold text-slate-50">{value}</span>
        </span>
    );
}
