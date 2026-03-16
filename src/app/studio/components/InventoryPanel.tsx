import React from "react";
import { Product, FlashDealState } from "./types";

const EV_ORANGE = "#f77f00";

function formatHMS(totalSeconds: number) {
    const s = Math.max(0, totalSeconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return h > 0 ? `${pad2(h)}:${pad2(m)}:${pad2(ss)}` : `${pad2(m)}:${pad2(ss)}`;
}

function pad2(n: number) {
    return n.toString().padStart(2, "0");
}

function fmtMoneyUSD(n: number) {
    return `$${n.toFixed(2)}`;
}

export function InventoryPanel(props: {
    products: Product[];
    highlightedId: string | null;
    onSelectProduct: (id: string) => void;
    flash: FlashDealState;
    flashUrgency: string;
    onOpenFlash: () => void;
    onStopFlash: () => void;
    onRestock: (productId: string, qty: number) => void;
    getPriceForProduct: (p: Product) => { price: number; applies: boolean };
}) {
    const { products, highlightedId, onSelectProduct, flash, flashUrgency, onOpenFlash, onStopFlash, onRestock, getPriceForProduct } = props;

    const bannerTone =
        flashUrgency === "critical"
            ? "bg-red-600/20 border-red-500/50 text-red-200"
            : flashUrgency === "high"
                ? "bg-orange-500/15 border-orange-400/60 text-orange-200"
                : "bg-[#f77f00]/10 border-[#f77f00]/50 text-foreground";

    return (
        <div className="bg-card border border-border rounded-2xl p-3 flex flex-col gap-2 text-[11px]">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold">Products</h3>
                <span className="text-[10px] text-muted-foreground">{products.length} items</span>
            </div>

            {flash.active ? (
                <div className={`rounded-xl border px-3 py-2 ${bannerTone}`}>
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold">⚡ Flash deal live</span>
                        <span className="text-[10px]">-{flash.discountPct}% · {formatHMS(flash.secondsLeft)}</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-background/60 overflow-hidden">
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: `${Math.round((flash.secondsLeft / Math.max(1, flash.totalSeconds)) * 100)}%`,
                                backgroundColor: flashUrgency === "critical" ? "#ef4444" : EV_ORANGE,
                            }}
                        />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-foreground">Target: {flash.productId ?? "Featured"}</span>
                        <button className="px-2.5 py-1 rounded-full text-[10px] border border-border bg-muted text-foreground hover:bg-secondary" onClick={onStopFlash}>
                            Stop
                        </button>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-muted p-2 text-[10px] text-foreground">
                    No flash deal running. Start one to boost urgency.
                </div>
            )}

            <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {products.map((p) => {
                    const active = p.id === highlightedId;
                    const dealOnThis = flash.active && flash.productId === p.id;
                    const oos = p.stock <= 0;
                    const low = p.stock > 0 && p.stock <= 5;

                    const { price, applies } = getPriceForProduct(p);

                    return (
                        <div
                            key={p.id}
                            role="button"
                            tabIndex={0}
                            className={`w-full text-left border rounded-xl px-2.5 py-1.5 flex flex-col gap-0.5 cursor-pointer ${active ? "bg-[#f77f00]/10 border-[#f77f00] text-foreground" : "bg-muted border-border text-foreground hover:border-muted-foreground"}`}
                            onClick={() => onSelectProduct(p.id)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectProduct(p.id); }}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold truncate">{p.name}</span>
                                <span className="text-[10px] text-emerald-300">
                                    {applies ? (
                                        <span className="inline-flex items-center gap-1">
                                            <span className="line-through text-muted-foreground">{fmtMoneyUSD(p.basePrice)}</span>
                                            <span className="text-emerald-300">{fmtMoneyUSD(price)}</span>
                                        </span>
                                    ) : (
                                        fmtMoneyUSD(p.basePrice)
                                    )}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <span>{oos ? "Out of stock" : `${p.stock} in stock`}</span>
                                    {low && !oos && (
                                        <span className="px-2 py-0.5 rounded-full border border-orange-500/60 bg-orange-500/10 text-orange-200 text-[9px]">Low</span>
                                    )}
                                    {dealOnThis && (
                                        <span className="px-2 py-0.5 rounded-full border border-orange-500/60 bg-orange-500/10 text-orange-200 text-[9px]">
                                            FLASH · {formatHMS(flash.secondsLeft)}
                                        </span>
                                    )}
                                </div>
                                <span className="truncate">{p.tag}</span>
                            </div>

                            <div className="mt-1 flex items-center justify-between">
                                <button
                                    type="button"
                                    className="px-2 py-0.5 rounded-full text-[9px] border border-border bg-card text-foreground hover:bg-secondary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRestock(p.id, 10);
                                    }}
                                >
                                    Restock +10
                                </button>
                                <span className="text-[9px] text-muted-foreground">ID: {p.id}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-1 flex items-center justify-between">
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border text-[10px] text-foreground hover:bg-secondary" onClick={onOpenFlash}>
                    <span className="material-icons text-[14px]" style={{ color: EV_ORANGE }}>bolt</span>
                    Configure flash deal
                </button>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border text-[10px] text-foreground hover:bg-secondary" onClick={() => alert("Open product manager (demo)")}>
                    <span className="material-icons text-[14px]">inventory_2</span>
                    Catalog
                </button>
            </div>
        </div>
    );
}
