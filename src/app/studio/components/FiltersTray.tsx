import React, { useState } from "react";
import { X } from "lucide-react";
import { FILTER_CATEGORIES } from "./filters";

export function FiltersTray({ onClose, activeFilter, onSelectFilter }: { onClose: () => void; activeFilter: string; onSelectFilter: (f: string) => void; }) {
    const [activeTab, setActiveTab] = useState(FILTER_CATEGORIES[0].id);
    const currentCategory = FILTER_CATEGORIES.find(c => c.id === activeTab) ?? FILTER_CATEGORIES[0];

    return (
        <div className="fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4">
            <div className="w-full max-w-sm sm:max-w-xl rounded-3xl border border-slate-800 shadow-2xl px-4 py-4 bg-slate-950/95 backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="material-icons text-[18px] text-purple-400">auto_awesome</span>
                        <span className="text-[13px] font-semibold text-white">Studio Filters</span>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-2">
                    {FILTER_CATEGORIES.map((cat) => {
                        const isActive = activeTab === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveTab(cat.id)}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all md:px-4 ${isActive
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40"
                                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                    }`}
                            >
                                {cat.label}
                            </button>
                        );
                    })}
                </div>

                {/* Filter Grid */}
                <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/50 min-h-[90px]">
                    {currentCategory.filters.map((f) => {
                        const isActive = activeFilter === f.label;
                        return (
                            <button
                                key={f.label}
                                className={`flex-shrink-0 group flex flex-col items-center gap-2 min-w-[72px] p-2 rounded-2xl border transition-all ${isActive
                                    ? "bg-purple-500/10 border-purple-500/60 ring-1 ring-purple-500/40 scale-105"
                                    : "bg-slate-900/50 border-slate-800 hover:border-slate-600 hover:bg-slate-800"
                                    }`}
                                onClick={() => onSelectFilter(f.label)}
                            >
                                <div
                                    className={`h-10 w-10 rounded-full overflow-hidden border relative shadow-sm transition-transform group-hover:scale-105 ${isActive ? "border-purple-400" : "border-white/10"
                                        }`}
                                    style={{ filter: f.style }} // Preview
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-500" />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className={`text-[10px] font-medium ${isActive ? "text-purple-300" : "text-slate-300"}`}>
                                        {f.label}
                                    </span>
                                    {isActive && <span className="text-[9px] text-purple-400/60">Active</span>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
