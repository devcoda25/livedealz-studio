/**
 * SalesGoalBar - Visual progress toward sales target
 * 
 * Shows a compact progress bar indicating how close the stream
 * is to reaching its sales goal. Appears when a goal is set.
 */

import React, { memo } from "react";

interface SalesGoalBarProps {
    currentSales: number;
    goalAmount: number;
    salesCount: number;
    darkMode?: boolean;
    onSetGoal?: () => void;
}

export const SalesGoalBar = memo(function SalesGoalBar({
    currentSales,
    goalAmount,
    salesCount,
    darkMode = true,
    onSetGoal,
}: SalesGoalBarProps) {
    const hasGoal = goalAmount > 0;
    const progress = hasGoal ? Math.min(currentSales / goalAmount, 1) : 0;
    const percentage = Math.round(progress * 100);
    const isComplete = progress >= 1;

    // Compact mode - just the bar
    if (!hasGoal) {
        return (
            <button
                onClick={onSetGoal}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-95 shadow-lg
                    ${darkMode ? "bg-[#121212]/60 border border-white/10 text-white/80" : "bg-white/60 border border-slate-200 text-slate-700"}
                    backdrop-blur-xl
                `}
            >
                <span className="material-icons text-[16px] text-[#f77f00]">flag</span>
                <span className="text-[11px] font-black uppercase tracking-widest">Set Sales Goal</span>
            </button>
        );
    }

    return (
        <div className={`
            relative px-4 py-3 rounded-[24px] min-w-[180px]
            ${isComplete
                ? "bg-gradient-to-br from-emerald-600/95 to-green-800/95 border border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : `${darkMode ? "bg-[#121212]/60 border border-white/10 shadow-2xl" : "bg-white/60 border border-slate-200 shadow-xl"}`
            }
            backdrop-blur-2xl animate-in slide-in-from-top duration-400 ease-out
        `}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {isComplete ? (
                        <>
                            <span className="material-icons text-emerald-300 text-[18px]">emoji_events</span>
                            <span className="text-emerald-50 text-[11px] font-black uppercase tracking-widest">Goal Smashed!</span>
                        </>
                    ) : (
                        <>
                            <span className="material-icons text-[#f77f00] text-[18px]">track_changes</span>
                            <span className={`${darkMode ? "text-white/80" : "text-slate-600"} text-[11px] font-black uppercase tracking-widest`}>Live Goal</span>
                        </>
                    )}
                </div>
                <div className={`px-2 py-0.5 rounded-lg ${isComplete ? "bg-white/20 text-white" : "bg-[#f77f00]/10 text-[#f77f00]"} text-[12px] font-black`}>
                    {percentage}%
                </div>
            </div>

            {/* Progress Bar */}
            <div className={`relative h-2.5 rounded-full overflow-hidden ${darkMode ? "bg-white/5" : "bg-slate-100"}`}>
                <div
                    className={`
                        absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out
                        ${isComplete
                            ? "bg-gradient-to-r from-emerald-300 to-green-400 shadow-[0_0_10px_rgba(110,231,183,0.5)]"
                            : "bg-[#f77f00] shadow-[0_0_12px_rgba(247,127,0,0.5)]"
                        }
                    `}
                    style={{ width: `${percentage}%` }}
                />
                {/* Shimmer effect */}
                <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between mt-2.5">
                <div className="flex flex-col">
                    <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[14px] font-black tabular-nums`}>
                        ${currentSales.toFixed(0)} <span className={`${darkMode ? "text-white/30" : "text-slate-400"} text-[10px] font-bold`}>/ ${goalAmount.toFixed(0)}</span>
                    </span>
                </div>
                <div className={`text-[10px] font-black uppercase tracking-tighter ${darkMode ? "text-white/40" : "text-slate-500"}`}>
                    {salesCount} {salesCount === 1 ? "Order" : "Orders"}
                </div>
            </div>

            {/* Celebration effect when complete */}
            {isComplete && (
                <div className="absolute -top-2 -right-2 transform rotate-12 scale-125">
                    <span className="text-2xl animate-bounce filter drop-shadow-lg">🏆</span>
                </div>
            )}
        </div>
    );
});

// Add shimmer animation
if (typeof document !== "undefined") {
    const styleId = "sales-goal-styles";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            .animate-shimmer {
                animation: shimmer 2s infinite;
            }
        `;
        document.head.appendChild(style);
    }
}

export default SalesGoalBar;
