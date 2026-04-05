/**
 * ProductCarousel - Swipeable product cards on camera
 * 
 * Horizontal scrollable product cards that appear on the camera view.
 * Tap to pin a product, showing its details on the pinned product overlay.
 */

import React, { memo, useRef, useState, useCallback } from "react";
import { Product, FlashDealState } from "../shared/types";

interface ProductCarouselProps {
    products: Product[];
    highlightedId: string | null;
    flash: FlashDealState;
    darkMode?: boolean;
    onSelectProduct: (id: string) => void;
    onQuickBuy?: (id: string) => void;
}

export const ProductCarousel = memo(function ProductCarousel({
    products,
    highlightedId,
    flash,
    darkMode = true,
    onSelectProduct,
    onQuickBuy,
}: ProductCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        setStartX(e.pageX - (scrollRef.current?.offsetLeft ?? 0));
        setScrollLeft(scrollRef.current?.scrollLeft ?? 0);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        scrollRef.current.scrollLeft = scrollLeft - walk;
    }, [isDragging, startX, scrollLeft]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        setIsDragging(true);
        setStartX(e.touches[0].pageX - (scrollRef.current?.offsetLeft ?? 0));
        setScrollLeft(scrollRef.current?.scrollLeft ?? 0);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging || !scrollRef.current) return;
        const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        scrollRef.current.scrollLeft = scrollLeft - walk;
    }, [isDragging, startX, scrollLeft]);

    if (products.length === 0) return null;

    return (
        <div className="absolute left-0 right-0 bottom-16 z-20 pointer-events-auto">
            <div
                ref={scrollRef}
                className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
                style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
            >
                {products.map((product) => {
                    const isHighlighted = product.id === highlightedId;
                    const isFlash = flash.active && flash.productId === product.id;
                    const isLowStock = product.stock <= 5;
                    const displayPrice = isFlash
                        ? product.basePrice * (1 - flash.discountPct / 100)
                        : product.basePrice;

                    return (
                        <div
                            key={product.id}
                            className={`
                                flex-shrink-0 w-[140px] snap-start cursor-pointer
                                rounded-xl overflow-hidden transition-all duration-200
                                ${isHighlighted
                                    ? "bg-gradient-to-br from-[#FF5C00]/90 to-orange-600/90 border-2 border-[#FF5C00] shadow-[0_0_15px_rgba(255,92,0,0.3)]"
                                    : isFlash
                                        ? "bg-gradient-to-br from-red-500/80 to-orange-600/80 border border-red-400/40"
                                        : "bg-black/50 backdrop-blur-md border border-white/10"
                                }
                                active:scale-95
                            `}
                            onClick={() => onSelectProduct(product.id)}
                        >
                            {/* Product image placeholder */}
                            <div className={`
                                h-[80px] flex items-center justify-center
                                ${isHighlighted || isFlash ? "bg-white/10" : "bg-white/5"}
                            `}>
                                <span className={`material-icons text-[32px] ${
                                    isHighlighted || isFlash ? "text-white/80" : "text-white/40"
                                }`}>
                                    {product.tag === "bundle" ? "inventory_2" : "shopping_bag"}
                                </span>
                                {isFlash && (
                                    <div className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                                        -{flash.discountPct}%
                                    </div>
                                )}
                            </div>

                            {/* Product info */}
                            <div className="p-2">
                                <h4 className="text-white text-[10px] font-medium truncate leading-tight">
                                    {product.name}
                                </h4>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-white text-[12px] font-bold">
                                        ${displayPrice.toFixed(2)}
                                    </span>
                                    {isFlash && (
                                        <span className="text-white/40 text-[9px] line-through">
                                            ${product.basePrice.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className={`w-1 h-1 rounded-full ${isLowStock ? "bg-red-400" : "bg-emerald-400"}`} />
                                    <span className={`text-[8px] ${isLowStock ? "text-red-300" : "text-white/40"}`}>
                                        {isLowStock ? `${product.stock} left` : `${product.stock} in stock`}
                                    </span>
                                </div>
                            </div>

                            {/* Quick buy button (only for highlighted) */}
                            {isHighlighted && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onQuickBuy?.(product.id);
                                    }}
                                    className="w-full py-1.5 bg-white/20 text-white text-[9px] font-bold flex items-center justify-center gap-1 active:bg-white/30"
                                >
                                    <span className="material-icons text-[12px]">add_shopping_cart</span>
                                    Quick Buy
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Scroll indicator dots */}
            <div className="flex justify-center gap-1 mt-1">
                {products.slice(0, 5).map((_, i) => (
                    <div
                        key={i}
                        className={`w-1 h-1 rounded-full ${
                            products[i]?.id === highlightedId
                                ? "bg-[#FF5C00]"
                                : "bg-white/30"
                        }`}
                    />
                ))}
                {products.length > 5 && (
                    <span className="text-white/30 text-[8px]">+{products.length - 5}</span>
                )}
            </div>
        </div>
    );
});

// Hide scrollbar
if (typeof document !== "undefined") {
    const styleId = "product-carousel-styles";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            .scrollbar-hide::-webkit-scrollbar {
                display: none;
            }
            .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        `;
        document.head.appendChild(style);
    }
}

export default ProductCarousel;
