import React from "react";
import { BuyerAgent, Product } from "./types";
import { formatHMS, fmtMoneyUSD, mockTranslate } from "./utils";
import { EV_ORANGE, EV_GREEN } from "./constants";
import { useEffect, useRef, useState } from "react";

export function BuyerSimulatorPanel(props: {
    buyers: BuyerAgent[];
    selectedBuyerId: string | null;
    onSelectBuyer: (id: string) => void;
    featuredProduct: Product;
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
    transcript: string; // Add transcript prop
}) {
    const {
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

        // Detect new text (simple append check)
        if (current.length > last.length && current.startsWith(last)) {
            const newText = current.slice(last.length).trim();
            lastTranscriptRef.current = current;

            if (selected.listenMode === "ai_audio" && newText) {
                // Translate and Speak
                setIsSpeaking(true);
                mockTranslate(newText, selected.lang).then(translatedText => {
                    // Remove [LANG] prefix for better speech? Or keep it? keeping it might be weird.
                    // clean prefix:
                    const cleanText = translatedText.replace(/^\[.*?\]\s*/, "");

                    const u = new SpeechSynthesisUtterance(cleanText);
                    // Try to set voice language hint (best effort)
                    u.lang = selected.lang;
                    u.rate = 1.1; // Slightly faster dubbing

                    u.onend = () => setIsSpeaking(false);
                    window.speechSynthesis.speak(u);
                });
            }
        } else if (current.length < last.length) {
            // reset
            lastTranscriptRef.current = current;
        } else {
            // same length or different content? update ref just in case
            lastTranscriptRef.current = current;
        }
    }, [transcript, selected]);

    if (!selected) return null;

    const modeLabel = selected.listenMode === "ai_audio" ? "AI audio" : selected.listenMode === "ai_captions" ? "Captions" : "Original";

    const primaryLabel = outOfStock ? "Out of stock" : "Buy now";
    const secondaryLabel = outOfStock ? (selectedBuyerHasReminder ? "Reminder set" : "Remind me") : "Add to cart";

    const flashTone =
        flashUrgency === "critical"
            ? "border-red-500/60 bg-red-500/10 text-red-200"
            : flashUrgency === "high"
                ? "border-orange-500/60 bg-orange-500/10 text-orange-200"
                : "border-[#f77f00]/70 bg-[#f77f00]/10 text-slate-100";

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-[11px]">
            <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                    <div className="text-xs font-semibold">Buyer view preview</div>
                    <div className="text-[10px] text-slate-500">Multiple buyers, per-buyer carts and reminders</div>
                </div>
                <div className="text-[10px] text-slate-300">
                    Selected: <span className="font-semibold">{selected.name}</span>
                </div>
            </div>

            <div className="flex items-start gap-4">
                {/* Phone frame */}
                <div className="w-[250px] max-w-full rounded-2xl border border-slate-700 bg-slate-950 overflow-hidden shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
                    <div className="h-[280px] bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-700 relative">
                        {/* top HUD */}
                        <div className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-slate-100">
                            LIVE · {modeLabel}
                        </div>
                        <div className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-slate-100">
                            {selected.lang.toUpperCase()}
                        </div>

                        {/* flash banner */}
                        {flashOnFeatured && (
                            <div className="absolute top-10 inset-x-2">
                                <div className={`px-3 py-1 rounded-full border text-[10px] inline-flex items-center gap-2 ${flashTone}`}>
                                    <span className="material-icons text-[14px]">bolt</span>
                                    <span className="font-semibold">FLASH</span>
                                    <span>-{flashDiscountPct}%</span>
                                    <span>{formatHMS(flashSecondsLeft)}</span>
                                </div>
                            </div>
                        )}

                        {/* bottom sheet */}
                        <div className="absolute bottom-0 left-0 right-0 bg-slate-950/95 border-t border-slate-800 p-2">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="text-[11px] font-semibold text-slate-100 truncate">{featuredProduct.name}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                        {outOfStock ? (
                                            <span className="text-rose-300">Out of stock</span>
                                        ) : lowStock ? (
                                            <span className="text-orange-200">Only {featuredProduct.stock} left</span>
                                        ) : (
                                            <span>{featuredProduct.stock} in stock</span>
                                        )}
                                        {selectedBuyerCartQty > 0 && (
                                            <span className="ml-2 text-slate-300">In cart: {selectedBuyerCartQty}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    {flashOnFeatured && featuredPrice.applies ? (
                                        <div className="text-[10px] text-slate-300">
                                            <span className="line-through text-slate-500">{fmtMoneyUSD(featuredProduct.basePrice)}</span>
                                            <div className="text-emerald-300 font-semibold">{fmtMoneyUSD(featuredPrice.price)}</div>
                                        </div>
                                    ) : (
                                        <div className="text-emerald-300 font-semibold text-[11px]">{fmtMoneyUSD(featuredProduct.basePrice)}</div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-2 flex gap-2">
                                <button
                                    className={`flex-1 px-3 py-2 rounded-xl text-[11px] font-semibold ${outOfStock ? "bg-slate-800 text-slate-400 cursor-not-allowed" : "text-white"}`}
                                    style={{ backgroundColor: outOfStock ? undefined : EV_GREEN }}
                                    onClick={outOfStock ? undefined : onBuyNow}
                                >
                                    {primaryLabel}
                                </button>

                                <button
                                    className={`flex-1 px-3 py-2 rounded-xl text-[11px] font-semibold border ${outOfStock
                                        ? (selectedBuyerHasReminder ? "border-slate-700 bg-slate-800 text-slate-400 cursor-not-allowed" : "border-slate-700 bg-slate-950 text-slate-200")
                                        : "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
                                        }`}
                                    onClick={
                                        outOfStock
                                            ? (selectedBuyerHasReminder ? undefined : onRemindMe)
                                            : onAddToCart
                                    }
                                >
                                    {secondaryLabel}
                                </button>
                            </div>

                            {outOfStock && (
                                <div className="mt-2 text-[10px] text-slate-400">
                                    When stock is zero, Add to cart becomes <span className="text-slate-200 font-semibold">Remind me</span>.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Buyer list */}
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-slate-500">Buyers (select one to preview)</div>
                    <div className="mt-2 space-y-2 max-h-[280px] overflow-y-auto pr-1">
                        {buyers.map((b) => {
                            const selectedRow = b.id === selectedBuyerId;
                            const cartCount = Object.values(b.carts).reduce((a, v) => a + v, 0);
                            const reminderCount = Object.keys(b.reminders).length;

                            return (
                                <button
                                    key={b.id}
                                    onClick={() => onSelectBuyer(b.id)}
                                    className={`w-full rounded-xl border px-3 py-2 text-left ${selectedRow ? "border-sky-500 bg-sky-500/10" : "border-slate-800 bg-slate-950 hover:border-slate-600"}`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-[11px] font-semibold text-slate-100">
                                                {b.name.split(" ")[1] ?? "B"}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[11px] font-semibold text-slate-100 truncate">{b.name}</div>
                                                <div className="text-[10px] text-slate-400 truncate">{b.lang.toUpperCase()} · {b.listenMode}</div>
                                            </div>
                                        </div>
                                        <div className="text-right text-[10px] text-slate-300">
                                            <div>Carts: {cartCount}</div>
                                            <div>Remind: {reminderCount}</div>
                                        </div>
                                    </div>

                                    {b.lastAction && (
                                        <div className="mt-2 text-[10px] text-slate-500 truncate">
                                            Last: {b.lastAction}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                        <button className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-300 text-[10px] text-slate-300 transition-colors" onClick={onBuyNow}>
                            <span className="material-icons text-[16px]">shopping_bag</span>
                            Simulate Buy
                        </button>
                        <button className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-sky-500/10 hover:border-sky-500/50 hover:text-sky-300 text-[10px] text-slate-300 transition-colors" onClick={onAddToCart}>
                            <span className="material-icons text-[16px]">add_shopping_cart</span>
                            Simulate Cart
                        </button>
                        <button className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-purple-500/10 hover:border-purple-500/50 hover:text-purple-300 text-[10px] text-slate-300 transition-colors" onClick={onRemindMe}>
                            <span className="material-icons text-[16px]">notifications_active</span>
                            Simulate Reminder
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
