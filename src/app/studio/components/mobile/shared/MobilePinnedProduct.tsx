import React, { memo, useState, useEffect } from "react";
import { Product, FlashDealState } from "../../shared/types";

interface MobilePinnedProductProps {
    product: Product | null;
    flash: FlashDealState;
    flashUrgency: "none" | "normal" | "high" | "critical";
    darkMode?: boolean;
    onBuy?: (productId: string) => void;
    onPin?: (productId: string) => void;
}

export const MobilePinnedProduct = memo(function MobilePinnedProduct({
    product,
    flash,
    flashUrgency,
    darkMode = true,
    onBuy,
    onPin,
}: MobilePinnedProductProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showPulse, setShowPulse] = useState(false);

    const isFlashProduct = flash.active && flash.productId === product?.id;
    const isLowStock = (product?.stock ?? 0) <= 5;

    // Pulse animation for flash deals
    useEffect(() => {
        if (!isFlashProduct) return;
        const interval = setInterval(() => setShowPulse(v => !v), 1000);
        return () => clearInterval(interval);
    }, [isFlashProduct]);

    if (!product) return null;

    const displayPrice = isFlashProduct
        ? product.basePrice * (1 - flash.discountPct / 100)
        : product.basePrice;

    return (
        <div className="absolute left-4 bottom-28 z-20 pointer-events-auto animate-in slide-in-from-left duration-500 ease-out">
            {/* Collapsed State */}
            {!isExpanded && (
                <button
                    onClick={() => setIsExpanded(true)}
                    className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl transition-all active:scale-95
                        ${isFlashProduct
                            ? "bg-red-600 border border-white/20 text-white"
                            : "bg-black/80 backdrop-blur-xl border border-white/10 text-white"
                        }
                    `}
                >
                    <div className="w-5 h-5 flex items-center justify-center">
                        <span className="material-icons text-[16px]">shopping_bag</span>
                    </div>
                    <span className="text-[12px] font-black uppercase tracking-tight truncate max-w-[120px]">
                        {product.name}
                    </span>
                    {isFlashProduct && (
                        <div className="px-1.5 py-0.5 rounded bg-white text-red-600 text-[10px] font-black animate-pulse">
                            {flash.discountPct}% OFF
                        </div>
                    )}
                </button>
            )}

            {/* Expanded State */}
            {isExpanded && (
                <div
                    className={`
                        relative w-[280px] rounded-[32px] overflow-hidden transition-all duration-300
                        ${isFlashProduct
                            ? flashUrgency === "critical"
                                ? "bg-[#9d1717] border-2 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.4)]"
                                : flashUrgency === "high"
                                    ? "bg-[#b94e1d] border-2 border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.4)]"
                                    : "bg-[#f77f00] border-2 border-white/20"
                            : "bg-black/70 backdrop-blur-2xl border border-white/10"
                        }
                        shadow-2xl
                    `}
                >
                    {/* Header Banner for Flash */}
                    {isFlashProduct && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-black/20">
                            <span className="material-icons text-yellow-400 text-[14px]">bolt</span>
                            <span className="text-white text-[10px] font-black uppercase tracking-widest">Hurry! Flash Deal</span>
                            <div className="ml-auto flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full">
                                <span className="material-icons text-yellow-400 text-[12px]">schedule</span>
                                <span className="text-white text-[11px] font-mono font-black tabular-nums">
                                    {Math.floor(flash.secondsLeft / 60)}:{(flash.secondsLeft % 60).toString().padStart(2, "0")}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Content Section */}
                    <div className="p-4">
                        {/* Close/Minimize */}
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="absolute top-4 right-4 w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-white/40 active:bg-black/40 transition-colors z-10"
                        >
                            <span className="material-icons text-[14px]">expand_more</span>
                        </button>

                        <div className="flex items-center gap-4">
                            {/* Product Thumb */}
                            <div className={`
                                w-16 h-16 rounded-[20px] flex items-center justify-center flex-shrink-0 transition-transform active:scale-95
                                ${isFlashProduct ? "bg-white/20" : "bg-white/10"}
                            `}>
                                <span className="material-icons text-white text-[32px]">
                                    {product.tag === "bundle" ? "inventory_2" : "shopping_bag"}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white text-[14px] font-black uppercase tracking-tight truncate leading-tight">
                                    {product.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-white text-[18px] font-black">
                                        ${displayPrice.toFixed(2)}
                                    </span>
                                    {isFlashProduct && (
                                        <span className="text-white/40 text-[12px] line-through font-bold">
                                            ${product.basePrice.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status Line */}
                        <div className="flex items-center gap-2 mt-4 px-1">
                            <div className={`w-2 h-2 rounded-full ${isLowStock ? "bg-red-400 animate-pulse" : "bg-emerald-400"}`} />
                            <span className={`text-[10px] font-black uppercase tracking-tight ${isLowStock ? "text-white" : "text-white/40"}`}>
                                {isLowStock ? `EXTREMELY LOW STOCK: ${product.stock} LEFT` : `${product.stock} IN STOCK NOW`}
                            </span>
                        </div>

                        {/* Buy Button */}
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => onBuy?.(product.id)}
                                className={`
                                    flex-1 py-3.5 rounded-[20px] text-[13px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2
                                    transition-all active:scale-95 shadow-xl
                                    ${isFlashProduct
                                        ? "bg-white text-red-600"
                                        : "bg-[#f77f00] text-white"
                                    }
                                `}
                            >
                                <span className="material-icons text-[18px]">shopping_cart</span>
                                Buy Now
                            </button>
                            <button
                                onClick={() => onPin?.(product.id)}
                                className="w-12 h-13 rounded-[20px] bg-white/10 flex items-center justify-center text-white/80 active:bg-white/20 transition-all border border-white/5"
                            >
                                <span className="material-icons text-[20px]">share</span>
                            </button>
                        </div>
                    </div>

                    {/* Critical Alert Pulse */}
                    {isFlashProduct && flashUrgency === "critical" && (
                        <div className="absolute inset-0 border-[4px] border-red-500 rounded-[32px] animate-pulse pointer-events-none z-20" />
                    )}
                </div>
            )}
        </div>
    );
});

export default MobilePinnedProduct;
