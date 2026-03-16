import React from "react";
import { FlashDealState, SaleEvent } from "./types";
import { formatHMS } from "./utils";
import { EV_ORANGE } from "./constants";

export function CommercePanel(props: {
    targetUnits: number;
    soldUnits: number;
    cartCount: number;
    last5MinSales: number;
    flash: FlashDealState;
    flashUrgency: string;
    salesEvents: SaleEvent[];
}) {
    const { targetUnits, soldUnits, cartCount, last5MinSales, flash, flashUrgency, salesEvents } = props;
    const progress = Math.min(soldUnits / Math.max(1, targetUnits), 1);

    const flashTone =
        flashUrgency === "critical"
            ? "border-red-500/60 bg-red-500/10 text-red-200"
            : flashUrgency === "high"
                ? "border-orange-500/60 bg-orange-500/10 text-orange-200"
                : "border-[#f77f00]/70 bg-[#f77f00]/10 text-foreground";

    return (
        <div className="bg-card border border-border rounded-2xl p-3 flex flex-col gap-2 text-[11px]">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-[13px]">💰</span>
                    <div>
                        <h3 className="text-xs font-semibold">Commerce HUD</h3>
                        <p className="text-[10px] text-muted-foreground">Sales feed and goal tracking</p>
                    </div>
                </div>
                {flash.active && (
                    <span className={`px-2 py-1 rounded-full text-[10px] border ${flashTone}`}>
                        ⚡ -{flash.discountPct}% ends in {formatHMS(flash.secondsLeft)}
                    </span>
                )}
            </div>

            <div className="flex items-center justify-between gap-3 text-[10px]">
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-foreground">{soldUnits}/{targetUnits} sold</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, backgroundColor: EV_ORANGE }} />
                    </div>
                </div>
                <div className="flex flex-col items-end text-[10px]">
                    <span className="text-muted-foreground">In carts</span>
                    <span className="text-foreground font-semibold">{cartCount}</span>
                    <span className="text-muted-foreground">{last5MinSales} sales · 5 min</span>
                </div>
            </div>

            <div className="border border-border rounded-xl p-2 bg-muted">
                <div className="flex items-center justify-between mb-1">
                    <h4 className="text-[10px] font-semibold text-foreground">Live sales feed</h4>
                    <span className="text-[9px] text-muted-foreground">latest first</span>
                </div>
                <ul className="space-y-1 max-h-28 overflow-y-auto text-[10px] text-foreground">
                    {salesEvents.map((e) => (
                        <li key={e.id} className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <span className="truncate">{e.label}</span>
                                {e.amount && <span className="ml-2 text-[9px] text-emerald-300">{e.amount}</span>}
                                {e.langTag && <span className="ml-2 text-[9px] text-muted-foreground">({e.langTag})</span>}
                            </div>
                            <span className="text-muted-foreground text-[9px]">{e.time}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
