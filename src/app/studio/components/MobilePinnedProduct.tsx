/**
 * MobilePinnedProduct - TikTok-style pinned product overlay
 * 
 * Shows the currently pinned product on the camera view with:
 * - Product name and price
 * - Stock indicator
 * - Flash deal countdown (if active)
 * - Quick "Buy Now" action
 */

import React, { memo, useState, useEffect } from "react";
import { Product, FlashDealState } from "./types";

interface MobilePinnedProductProps {
    product: Product | null;
    flash: FlashDealState;
    flashUrgency: "none" | "high" | "critical";
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
        <div className="absolute left-3 bottom-28 z-20 pointer-events-auto animate-in slide-in-from-left duration-300">
            {/* Collapsed state */}
            {!isExpanded && (
                <button
                    onClick={() => setIsExpanded(true)}
                    className={`
                        flex items-center gap-2 px-3 py-2 rounded-2xl
                        ${isFlashProduct
                            ? "bg-gradient-to-r from-red-500/90 to-orange-500/90 border border-red-400/50"
                            : "bg-black/50 backdrop-blur-md border border-white/10"
                        }
                        shadow-lg
                    `}
                >
                    <span className="material-icons text-white text-[18px]">shopping_bag</span>
                    <span className="text-white text-[11px] font-semibold truncate max-w-[100px]">
                        {product.name}
                    </span>
                    {isFlashProduct && (
                        <span className="text-white text-[10px] font-bold animate-pulse">
                            -{flash.discountPct}%
                        </span>
                    )}
                </button>
            )}

            {/* Expanded state */}
            {isExpanded && (
                <div
                    className={`
                        relative w-[220px] rounded-2xl overflow-hidden
                        ${isFlashProduct
                            ? flashUrgency === "critical"
                                ? "bg-gradient-to-br from-red-600/95 to-red-800/95 border-2 border-red-400/60 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                                : flashUrgency === "high"
                                    ? "bg-gradient-to-br from-orange-600/95 to-red-700/95 border-2 border-orange-400/60 shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                                    : "bg-gradient-to-br from-[#FF5C00]/95 to-orange-700/95 border-2 border-[#FF5C00]/60"
                            : "bg-black/60 backdrop-blur-xl border border-white/10"
                        }
                        shadow-2xl
                    `}
                >
                    {/* Collapse button */}
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-white/60 z-10"
                    >
                        <span className="material-icons text-[14px]">close</span>
                    </button>

                    {/* Flash deal banner */}
                    {isFlashProduct && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30">
                            <span className="material-icons text-yellow-300 text-[14px]">bolt</span>
                            <span className="text-white text-[10px] font-bold uppercase tracking-wider">Flash Deal</span>
                            <div className="ml-auto flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-full">
                                <span className="material-icons text-yellow-300 text-[12px]">timer</span>
                                <span className="text-white text-[11px] font-mono font-bold">
                                    {Math.floor(flash.secondsLeft / 60)}:{(flash.secondsLeft % 60).toString().padStart(2, "0")}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Product info */}
                    <div className="p-3">
                        <div className="flex items-start gap-2.5">
                            {/* Product icon */}
                            <div className={`
                                w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                                ${isFlashProduct ? "bg-white/20" : "bg-white/10"}
                            `}>
                                <span className="material-icons text-white text-[20px]">
                                    {product.tag === "bundle" ? "inventory_2" : "shopping_bag"}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white text-[13px] font-semibold truncate leading-tight">
                                    {product.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-white text-[15px] font-bold">
                                        ${displayPrice.toFixed(2)}
                                    </span>
                                    {isFlashProduct && (
                                        <span className="text-white/50 text-[11px] line-through">
                                            ${product.basePrice.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className={`
                                        w-1.5 h-1.5 rounded-full
                                        ${isLowStock ? "bg-red-400 animate-pulse" : "bg-emerald-400"}
                                    `} />
                                    <span className={`text-[10px] ${isLowStock ? "text-red-300" : "text-white/60"}`}>
                                        {isLowStock ? `Only ${product.stock} left!` : `${product.stock} in stock`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 mt-2.5">
                            <button
                                onClick={() => onBuy?.(product.id)}
                                className={`
                                    flex-1 py-2 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5
                                    transition-all active:scale-95
                                    ${isFlashProduct
                                        ? "bg-white text-red-600 shadow-lg"
                                        : "bg-[#FF5C00] text-white"
                                    }
                                `}
                            >
                                <span className="material-icons text-[16px]">shopping_cart</span>
                                Buy Now
                            </button>
                            <button
                                onClick={() => onPin?.(product.id)}
                                className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/80 active:bg-white/20"
                            >
                                <span className="material-icons text-[18px]">share</span>
                            </button>
                        </div>
                    </div>

                    {/* Pulse effect for critical flash */}
                    {isFlashProduct && flashUrgency === "critical" && (
                        <div className="absolute inset-0 border-2 border-red-400 rounded-2xl animate-ping opacity-20 pointer-events-none" />
                    )}
                </div>
            )}
        </div>
    );
});

export default MobilePinnedProduct;
