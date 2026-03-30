import React from "react";
import { BuyerAgent, Product } from "./types";
import { formatHMS, fmtMoneyUSD, mockTranslate } from "./utils";
import { EV_ORANGE, EV_GREEN } from "./constants";
import { useEffect, useRef, useState } from "react";

export function BuyerSimulatorPanel(props: {
    darkMode?: boolean;
    isOpen: boolean;
    onClose: () => void;
    buyers: BuyerAgent[];
    selectedBuyerId: string | null;
    onSelectBuyer: (id: string) => void;
    featuredProduct: Product | null;
    featuredPrice: { price: number; applies: boolean };
    flashOnFeatured: boolean;
    flashDiscountPct: number;
    flashSecondsLeft: number;
    flashUrgency: string;
    selectedBuyerHasReminder: boolean;
    selectedBuyerCartQty: number;
    outOfStock: boolean;
    lowStock: boolean;
    onBuyNow: () => void;
    onAddToCart: () => void;
    onRemindMe: () => void;
    transcript: string;
}) {
    const {
        darkMode,
        isOpen,
        onClose,
        buyers,
        selectedBuyerId,
        onSelectBuyer,
        featuredProduct,
        featuredPrice,
        flashOnFeatured,
        flashDiscountPct,
        flashSecondsLeft,
        flashUrgency,
        selectedBuyerHasReminder,
        selectedBuyerCartQty,
        outOfStock,
        lowStock,
        onBuyNow,
        onAddToCart,
        onRemindMe,
        transcript,
    } = props;

    const selected = buyers.find((b) => b.id === selectedBuyerId) ?? buyers[0];

    // TTS Logic
    const lastTranscriptRef = useRef(transcript);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        if (!selected) return;
        const last = lastTranscriptRef.current;
        const current = transcript;

        if (current.length > last.length && current.startsWith(last)) {
            const newText = current.slice(last.length).trim();
            lastTranscriptRef.current = current;

            if (selected.listenMode === "ai_audio" && newText) {
                setIsSpeaking(true);
                mockTranslate(newText, selected.lang).then(translatedText => {
                    const cleanText = translatedText.replace(/^\[.*?\]\s*/, "");
                    const u = new SpeechSynthesisUtterance(cleanText);
                    u.lang = selected.lang;
                    u.rate = 1.1;
                    u.onend = () => setIsSpeaking(false);
                    window.speechSynthesis.speak(u);
                });
            }
        } else if (current.length < last.length) {
            lastTranscriptRef.current = current;
        } else {
            lastTranscriptRef.current = current;
        }
    }, [transcript, selected]);

    // Drag functionality for modal
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest("button, .cursor-pointer")) return;
        dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragStartRef.current) return;
        setPosition({
            x: e.clientX - dragStartRef.current.x,
            y: e.clientY - dragStartRef.current.y
        });
    };

    const handleMouseUp = () => {
        dragStartRef.current = null;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
    };

    const modeLabel = selected?.listenMode === "ai_audio" ? "AI audio" : selected?.listenMode === "ai_captions" ? "Captions" : "Original";
    const primaryLabel = outOfStock ? "Out of stock" : "Buy now";
    const secondaryLabel = outOfStock ? (selectedBuyerHasReminder ? "Reminder set" : "Remind me") : "Add to cart";
    const flashTone = flashUrgency === "critical" ? "border-red-500/60 bg-red-500/10 text-red-200" : flashUrgency === "high" ? "border-orange-500/60 bg-orange-500/10 text-orange-200" : "border-[#f77f00]/70 bg-[#f77f00]/10 text-slate-100";

    if (!isOpen) return null;
    if (!selected) return null;

    return (
        <div
            className="fixed left-4 top-20 z-[60] w-80 max-h-[70vh] overflow-hidden rounded-2xl border border-border shadow-2xl bg-muted/95 backdrop-blur-xl cursor-move"
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            onMouseDown={handleMouseDown}
        >
            {/* Header with close button */}
            <div className="flex items-center justify-between gap-2 p-3 border-b border-border">
                <div>
                    <div className="text-xs font-semibold">Buyer Simulation</div>
                    <div className="text-[10px] text-muted">Multi-buyer carts & reminders</div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="h-7 w-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <span className="material-icons text-[16px]">close</span>
                    </button>
                )}
            </div>

            <div className="p-3 overflow-y-auto max-h-[calc(70vh-60px)]">
                {/* Buyer List */}
                <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1 mb-2 flex-shrink-0">
                    {buyers.map((b) => {
                        const selectedRow = b.id === selectedBuyerId;
                        const cartCount = Object.values(b.carts).reduce((a, v) => a + v, 0);
                        const reminderCount = Object.keys(b.reminders).length;

                        return (
                            <button
                                key={b.id}
                                onClick={() => onSelectBuyer(b.id)}
                                className={`w-full rounded-lg border px-2 py-1.5 text-left ${selectedRow ? "border-sky-500 bg-sky-500/10" : "border-border bg-muted hover:border-muted-foreground"}`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-semibold text-foreground">
                                            {b.name.split(" ")[1]?.[0] ?? "B"}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[10px] font-semibold text-foreground truncate">{b.name}</div>
                                            <div className="text-[9px] text-muted">{b.lang.toUpperCase()} · {b.listenMode}</div>
                                        </div>
                                    </div>
                                    <div className="text-right text-[9px] text-muted-foreground">
                                        <div>🛒 {cartCount}</div>
                                        <div>🔔 {reminderCount}</div>
                                    </div>
                                </div>
                                {b.lastAction && (
                                    <div className="text-[8px] text-muted mt-1">
                                        Last: {b.lastAction}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Selected Buyer Preview */}
                {selected && (
                    <div className={`border-t ${darkMode ? "border-slate-800" : "border-slate-200"} pt-2 mb-2`}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] text-muted-foreground">Preview: <span className="text-sky-400">{selected.name}</span>{isSpeaking && <span className="ml-1 animate-pulse text-green-700 dark:text-green-400">🔊</span>}</span>
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-muted-foreground">
                                {selected.lang.toUpperCase()} · {modeLabel}
                            </span>
                        </div>

                        {/* Mini Phone Preview */}
                        <div className="rounded-lg border border-border bg-muted overflow-hidden">
                            <div className="h-[80px] bg-gradient-to-tr from-muted via-muted-foreground to-muted-foreground relative">
                                {/* Flash banner */}
                                {flashOnFeatured && (
                                    <div className="absolute top-1 inset-x-1">
                                        <div className={`px-1.5 py-0.5 rounded-full border text-[8px] inline-flex items-center gap-1 ${flashTone}`}>
                                            <span className="font-semibold">⚡</span>
                                            <span>-{flashDiscountPct}%</span>
                                            <span>{formatHMS(flashSecondsLeft)}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Product info */}
                                <div className="absolute bottom-0 left-0 right-0 bg-muted/95 border-t border-border p-1.5">
                                    <div className="text-[9px] font-semibold text-foreground truncate">{featuredProduct?.name || 'No product'}</div>
                                    <div className="text-[8px] text-muted mt-0.5 flex items-center gap-2">
                                        {outOfStock ? (
                                            <span className="text-rose-300">Out of stock</span>
                                        ) : lowStock ? (
                                            <span className="text-orange-200">{featuredProduct?.stock || 0} left</span>
                                        ) : (
                                            <span>{featuredProduct?.stock || 0} stock</span>
                                        )}
                                        {selectedBuyerCartQty > 0 && (
                                            <span className="text-slate-300">🛒 {selectedBuyerCartQty}</span>
                                        )}
                                    </div>
                                    <div className="text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] mt-0.5">
                                        {flashOnFeatured && featuredPrice.applies ? (
                                            <>
                                                <span className="line-through text-muted text-[8px] mr-1">{fmtMoneyUSD(featuredProduct?.basePrice || 0)}</span>
                                                <span>{fmtMoneyUSD(featuredPrice.price)}</span>
                                            </>
                                        ) : (
                                            fmtMoneyUSD(featuredProduct?.basePrice || 0)
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-1 mt-2">
                            <button
                                className={`flex-1 px-2 py-1.5 rounded-lg text-[9px] font-semibold ${outOfStock ? (darkMode ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-500") : "text-white"}`}
                                style={{ backgroundColor: outOfStock ? undefined : EV_GREEN }}
                                onClick={outOfStock ? undefined : onBuyNow}
                            >
                                {primaryLabel}
                            </button>
                            <button
                                className={`flex-1 px-2 py-1.5 rounded-lg text-[9px] font-semibold border ${outOfStock
                                    ? (selectedBuyerHasReminder ? "border-muted-foreground bg-muted text-muted-foreground" : "border-muted-foreground bg-background text-foreground")
                                    : "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
                                    }`}
                                onClick={outOfStock ? (selectedBuyerHasReminder ? undefined : onRemindMe) : onAddToCart}
                            >
                                {secondaryLabel}
                            </button>
                        </div>
                        {outOfStock && (
                            <div className="text-[8px] text-muted mt-1">
                                When stock = 0, Add to cart → <span className="text-foreground font-semibold">Remind me</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Simulation Controls */}
                <div className="grid grid-cols-3 gap-1 mt-2">
                    <button className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-700 dark:text-emerald-300 text-[8px] text-muted-foreground transition-colors" onClick={onBuyNow}>
                        <span className="material-icons text-[12px]">shopping_bag</span>
                        Buy
                    </button>
                    <button className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-sky-500/10 hover:border-sky-500/50 hover:text-sky-300 text-[8px] text-muted-foreground transition-colors" onClick={onAddToCart}>
                        <span className="material-icons text-[12px]">add_shopping_cart</span>
                        Cart
                    </button>
                    <button className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-purple-500/10 hover:border-purple-500/50 hover:text-purple-300 text-[8px] text-muted-foreground transition-colors" onClick={onRemindMe}>
                        <span className="material-icons text-[12px]">notifications</span>
                        Remind
                    </button>
                </div>
            </div>
        </div>
    );
}
