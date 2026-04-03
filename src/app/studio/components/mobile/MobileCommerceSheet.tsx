/**
 * Mobile Commerce Sheet - TikTok-style commerce panel
 * 
 * Bottom sheet with tabs for Products and Sales stats.
 * Slides up from bottom with drag handle.
 */

import React, { memo, useState } from "react";
import { Product, SaleEvent, FlashDealState } from "../shared/types";

interface MobileCommerceSheetProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    salesEvents: SaleEvent[];
    salesCount: number;
    last5MinSales: number;
    flash: FlashDealState;
    highlightedProductId: string | null;
    onSelectProduct: (id: string) => void;
    onOpenFlashConfig: () => void;
    onStopFlash: () => void;
    onAddProduct: () => void;
    onEditProduct: (product: Product) => void;
    onDeleteProduct: (productId: string) => void;
}

type TabId = "products" | "sales";

export const MobileCommerceSheet = memo(function MobileCommerceSheet({
    isOpen,
    onClose,
    products,
    salesEvents,
    salesCount,
    last5MinSales,
    flash,
    highlightedProductId,
    onSelectProduct,
    onOpenFlashConfig,
    onStopFlash,
    onAddProduct,
    onEditProduct,
    onDeleteProduct,
}: MobileCommerceSheetProps) {
    const [activeTab, setActiveTab] = useState<TabId>("products");

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[75vh] bg-slate-950 rounded-t-3xl animate-in slide-in-from-bottom duration-300 flex flex-col">
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-2 cursor-pointer" onClick={onClose}>
                    <div className="w-10 h-1 bg-slate-700 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-3">
                    <h2 className="text-white text-lg font-bold">Commerce</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onAddProduct}
                            className="w-8 h-8 rounded-full bg-[#FF5C00]/10 text-[#FF5C00] flex items-center justify-center active:scale-95 transition-all"
                            title="Add Product"
                        >
                            <span className="material-icons text-[20px]">add</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 active:text-white transition-colors"
                        >
                            <span className="material-icons text-[18px]">close</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-5 gap-1 border-b border-slate-800">
                    <TabButton
                        label="Products"
                        icon="inventory_2"
                        active={activeTab === "products"}
                        onClick={() => setActiveTab("products")}
                        count={products.length}
                    />
                    <TabButton
                        label="Sales"
                        icon="payments"
                        active={activeTab === "sales"}
                        onClick={() => setActiveTab("sales")}
                        count={salesCount}
                    />
                </div>

                {/* Stats bar */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800/50">
                    <StatChip label="Last 5 min" value={String(last5MinSales)} color="emerald" />
                    <StatChip label="Total Sales" value={`$${(salesCount * 29.99).toFixed(0)}`} color="amber" />
                    {flash.active && (
                        <StatChip
                            label="Flash"
                            value={`${flash.secondsLeft}s`}
                            color="red"
                            pulse
                        />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 py-3">
                    {activeTab === "products" ? (
                        <ProductsList
                            products={products}
                            highlightedId={highlightedProductId}
                            flash={flash}
                            onSelect={onSelectProduct}
                            onOpenFlashConfig={onOpenFlashConfig}
                            onStopFlash={onStopFlash}
                            onEdit={onEditProduct}
                            onDelete={onDeleteProduct}
                        />
                    ) : (
                        <SalesFeed events={salesEvents} />
                    )}
                </div>
            </div>
        </>
    );
});

// Tab button
function TabButton({
    label,
    icon,
    active,
    onClick,
    count,
}: {
    label: string;
    icon: string;
    active: boolean;
    onClick: () => void;
    count?: number;
}) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all
                ${active
                    ? "text-white bg-slate-800/50 border-b-2 border-[#FF5C00]"
                    : "text-slate-500 active:text-slate-300"
                }
            `}
        >
            <span className="material-icons text-[16px]">{icon}</span>
            {label}
            {count !== undefined && count > 0 && (
                <span className={`
                    text-[10px] px-1.5 py-0.5 rounded-full font-bold
                    ${active ? "bg-[#FF5C00]/20 text-[#FF5C00]" : "bg-slate-700 text-slate-400"}
                `}>
                    {count}
                </span>
            )}
        </button>
    );
}

// Stat chip
function StatChip({
    label,
    value,
    color,
    pulse = false,
}: {
    label: string;
    value: string;
    color: "emerald" | "amber" | "red";
    pulse?: boolean;
}) {
    const colorClasses = {
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        red: "bg-red-500/10 text-red-400 border-red-500/20",
    };

    return (
        <div className={`
            flex items-center gap-1.5 px-2.5 py-1 rounded-full border
            ${colorClasses[color]}
            ${pulse ? "animate-pulse" : ""}
        `}>
            <span className="text-[10px] opacity-70">{label}</span>
            <span className="text-[12px] font-bold tabular-nums">{value}</span>
        </div>
    );
}

// Products list
function ProductsList({
    products,
    highlightedId,
    flash,
    onSelect,
    onOpenFlashConfig,
    onStopFlash,
    onEdit,
    onDelete,
}: {
    products: Product[];
    highlightedId: string | null;
    flash: FlashDealState;
    onSelect: (id: string) => void;
    onOpenFlashConfig: () => void;
    onStopFlash: () => void;
    onEdit: (product: Product) => void;
    onDelete: (productId: string) => void;
}) {
    return (
        <div className="space-y-2">
            {products.map((product) => {
                const isHighlighted = product.id === highlightedId;
                const isFlashProduct = flash.active && flash.productId === product.id;
                const isLowStock = product.stock <= 5;

                return (
                    <div
                        key={product.id}
                        className={`
                            flex items-center gap-3 p-3 rounded-xl transition-all
                            ${isHighlighted
                                ? "bg-[#FF5C00]/10 border border-[#FF5C00]/30"
                                : "bg-slate-900/50 border border-slate-800"
                            }
                        `}
                        onClick={() => onSelect(product.id)}
                    >
                        {/* Product icon */}
                        <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                            ${isHighlighted ? "bg-[#FF5C00]/20" : "bg-slate-800"}
                        `}>
                            <span className={`material-icons text-[20px] ${isHighlighted ? "text-[#FF5C00]" : "text-slate-400"}`}>
                                {product.tag === "bundle" ? "inventory_2" : "shopping_bag"}
                            </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-white text-[13px] font-medium truncate">
                                    {product.name}
                                </span>
                                {isFlashProduct && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold animate-pulse">
                                        FLASH
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[#FF5C00] text-[12px] font-bold">
                                    ${product.basePrice.toFixed(2)}
                                </span>
                                <span className={`
                                    text-[10px] ${isLowStock ? "text-red-400" : "text-slate-500"}
                                `}>
                                    Stock: {product.stock}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(product);
                                }}
                                className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white active:scale-90 transition-all"
                            >
                                <span className="material-icons text-[16px]">edit</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(product.id);
                                }}
                                className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500/60 hover:text-red-500 active:scale-90 transition-all"
                            >
                                <span className="material-icons text-[16px]">delete</span>
                            </button>
                            {isHighlighted && (
                                <span className="material-icons text-[16px] text-[#FF5C00] ml-1">push_pin</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Sales feed
function SalesFeed({ events }: { events: SaleEvent[] }) {
    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <span className="material-icons text-3xl mb-2">receipt_long</span>
                <span className="text-sm">No sales yet</span>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {[...events].reverse().map((event) => (
                <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800"
                >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="material-icons text-[16px] text-emerald-400">sell</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-white text-[12px] truncate block">{event.label}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-emerald-400 text-[11px] font-bold">{event.amount}</span>
                            <span className="text-slate-500 text-[10px]">{event.time}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default MobileCommerceSheet;
