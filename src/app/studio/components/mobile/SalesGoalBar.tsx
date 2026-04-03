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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/60 text-[10px] active:bg-black/60 transition-all"
            >
                <span className="material-icons text-[14px]">flag</span>
                Set Goal
            </button>
        );
    }

    return (
        <div className={`
            relative px-3 py-2 rounded-2xl
            ${isComplete
                ? "bg-gradient-to-r from-emerald-500/90 to-green-600/90 border border-emerald-400/30"
                : "bg-black/50 backdrop-blur-md border border-white/10"
            }
            shadow-lg animate-in slide-in-from-top duration-300
        `}>
            {/* Header */}
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                    {isComplete ? (
                        <>
                            <span className="material-icons text-emerald-300 text-[14px]">emoji_events</span>
                            <span className="text-emerald-100 text-[10px] font-bold uppercase tracking-wider">Goal Reached!</span>
                        </>
                    ) : (
                        <>
                            <span className="material-icons text-amber-400 text-[14px]">track_changes</span>
                            <span className="text-white/80 text-[10px] font-semibold">Sales Goal</span>
                        </>
                    )}
                </div>
                <span className="text-white text-[11px] font-bold tabular-nums">
                    {percentage}%
                </span>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                    className={`
                        absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out
                        ${isComplete
                            ? "bg-gradient-to-r from-emerald-300 to-green-400"
                            : "bg-gradient-to-r from-[#FF5C00] to-amber-400"
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
            <div className="flex items-center justify-between mt-1.5">
                <span className="text-white/60 text-[10px]">
                    <span className="text-white font-bold">${currentSales.toFixed(0)}</span>
                    {" / "}
                    <span className="text-white/40">${goalAmount.toFixed(0)}</span>
                </span>
                <span className="text-white/60 text-[10px]">
                    {salesCount} orders
                </span>
            </div>

            {/* Celebration effect when complete */}
            {isComplete && (
                <div className="absolute -top-1 -right-1">
                    <span className="text-lg animate-bounce">🎉</span>
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
