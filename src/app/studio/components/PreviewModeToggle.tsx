import React from "react";
import { PreviewMode } from "./types";

export function PreviewModeToggle({ previewMode, onChange }: { previewMode: PreviewMode; onChange: (m: PreviewMode) => void }) {
    const chip = (id: PreviewMode, label: string, icon: string) => {
        const active = previewMode === id;
        return (
            <button
                key={id}
                onClick={() => onChange(id)}
                className={
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] border transition " +
                    (active ? "bg-white text-slate-900 border-white shadow-sm" : "bg-slate-950 text-slate-200 border-slate-700 hover:bg-slate-900")
                }
            >
                <span className="material-icons text-[13px]">{icon}</span>
                {label}
            </button>
        );
    };

    return (
        <div className="flex items-center gap-1">
            {chip("auto", "Auto", "auto_awesome")}
            {chip("desktop", "Desktop", "desktop_windows")}
            {chip("mobile", "Mobile", "smartphone")}
        </div>
    );
}
