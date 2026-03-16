import React from "react";

export function StatPill({ label, value }: { label: string; value: string }) {
    return (
        <span className="inline-flex flex-col items-start px-2 py-0.5 rounded-lg bg-card border border-border text-[10px]">
            <span className="text-[9px] text-muted-foreground">{label}</span>
            <span className="text-[11px] font-semibold text-foreground">{value}</span>
        </span>
    );
}
