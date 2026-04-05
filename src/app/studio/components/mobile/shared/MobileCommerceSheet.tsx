import React, { memo, useState } from "react";
import { Product, SaleEvent, FlashDealState } from "../../shared/types";

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
    darkMode?: boolean;
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
    darkMode = true,
}: MobileCommerceSheetProps) {
    const [activeTab, setActiveTab] = useState<TabId>("products");

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-50 transition-opacity duration-300 ${darkMode ? "bg-black/60" : "bg-slate-900/40"} backdrop-blur-sm animate-in fade-in`}
                onClick={onClose}
            />

            {/* Sheet */}
            <div className={`
                fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] rounded-t-[32px] animate-in slide-in-from-bottom duration-400 ease-out flex flex-col
                ${darkMode ? "bg-[#121212]/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl" : "bg-white/95 backdrop-blur-2xl border-t border-slate-200 shadow-xl"}
            `}>
                {/* Drag Handle */}
                <div className="w-full flex justify-center pt-4 pb-1 cursor-pointer group" onClick={onClose}>
                    <div className={`w-12 h-1.5 rounded-full transition-colors ${darkMode ? "bg-white/10 group-hover:bg-white/20" : "bg-slate-200 group-hover:bg-slate-300"}`} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-2">
                    <h2 className={`${darkMode ? "text-white" : "text-slate-900"} text-[18px] font-black uppercase tracking-widest`}>Commerce</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onAddProduct}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 ${darkMode ? "bg-[#f77f00]/10 text-[#f77f00] hover:bg-[#f77f00]/20" : "bg-[#f77f00] text-white shadow-lg shadow-[#f77f00]/20"}`}
                        >
                            <span className="material-icons text-[18px]">add</span>
                        </button>
                        <button
                            onClick={onClose}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? "bg-white/5 hover:bg-white/10 text-white/40" : "bg-slate-100 hover:bg-slate-200 text-slate-400"}`}
                        >
                            <span className="material-icons text-[18px]">close</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className={`flex px-6 gap-6 border-b transition-colors ${darkMode ? "border-white/5" : "border-slate-100"}`}>
                    <TabButton
                        label="Products"
                        icon="inventory_2"
                        active={activeTab === "products"}
                        onClick={() => setActiveTab("products")}
                        count={products.length}
                        darkMode={darkMode}
                    />
                    <TabButton
                        label="Sales"
                        icon="payments"
                        active={activeTab === "sales"}
                        onClick={() => setActiveTab("sales")}
                        count={salesCount}
                        darkMode={darkMode}
                    />
                </div>

                {/* Stats bar */}
                <div className="flex items-center gap-3 px-6 py-3 overflow-x-auto no-scrollbar">
                    <StatChip label="Last 5m" value={String(last5MinSales)} color="emerald" darkMode={darkMode} />
                    <StatChip label="Revenue" value={`$${(salesCount * 29.99).toFixed(0)}`} color="amber" darkMode={darkMode} />
                    {flash.active && (
                        <StatChip
                            label="Flash"
                            value={`${flash.secondsLeft}s`}
                            color="red"
                            pulse
                            darkMode={darkMode}
                        />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 pb-safe-bottom">
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
                            darkMode={darkMode}
                        />
                    ) : (
                        <SalesFeed events={salesEvents} darkMode={darkMode} />
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
    darkMode,
}: {
    label: string;
    icon: string;
    active: boolean;
    onClick: () => void;
    count?: number;
    darkMode: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`
                py-3 text-[12px] font-black uppercase tracking-widest transition-all relative flex items-center gap-2
                ${active
                    ? "text-[#f77f00]"
                    : darkMode ? "text-white/30" : "text-slate-400"
                }
            `}
        >
            <span className="material-icons text-[16px]">{icon}</span>
            {label}
            {count !== undefined && count > 0 && (
                <span className={`
                    text-[10px] px-1.5 py-0.5 rounded-full font-black
                    ${active ? "bg-[#f77f00]/20 text-[#f77f00]" : `${darkMode ? "bg-white/5 text-white/30" : "bg-slate-100 text-slate-400"}`}
                `}>
                    {count}
                </span>
            )}
            {active && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#f77f00] rounded-full shadow-[0_0_8px_rgba(247,127,0,0.5)]" />
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
    darkMode,
}: {
    label: string;
    value: string;
    color: "emerald" | "amber" | "red";
    pulse?: boolean;
    darkMode: boolean;
}) {
    const colorStyles = {
        emerald: {
            bg: darkMode ? "bg-emerald-500/10" : "bg-emerald-50",
            text: "text-emerald-500",
            border: darkMode ? "border-emerald-500/20" : "border-emerald-200"
        },
        amber: {
            bg: darkMode ? "bg-[#f77f00]/10" : "bg-[#f77f00]/5",
            text: "text-[#f77f00]",
            border: darkMode ? "border-[#f77f00]/20" : "border-[#f77f00]/20"
        },
        red: {
            bg: darkMode ? "bg-red-500/10" : "bg-red-50",
            text: "text-red-500",
            border: darkMode ? "border-red-500/20" : "border-red-200"
        }
    };

    const style = colorStyles[color];

    return (
        <div className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all flex-shrink-0
            ${style.bg} ${style.text} ${style.border}
            ${pulse ? "animate-pulse" : ""}
        `}>
            <span className="text-[10px] font-black uppercase tracking-wider opacity-60">{label}</span>
            <span className="text-[12px] font-black tabular-nums">{value}</span>
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
    darkMode,
}: {
    products: Product[];
    highlightedId: string | null;
    flash: FlashDealState;
    onSelect: (id: string) => void;
    onOpenFlashConfig: () => void;
    onStopFlash: () => void;
    onEdit: (product: Product) => void;
    onDelete: (productId: string) => void;
    darkMode: boolean;
}) {
    return (
        <div className="space-y-3">
            {products.map((product) => {
                const isHighlighted = product.id === highlightedId;
                const isFlashProduct = flash.active && flash.productId === product.id;
                const isLowStock = product.stock <= 5;

                return (
                    <div
                        key={product.id}
                        className={`
                            flex items-center gap-4 p-4 rounded-2xl transition-all border group
                            ${isHighlighted
                                ? "bg-[#f77f00]/10 border-[#f77f00]/30 shadow-lg shadow-[#f77f00]/5"
                                : `${darkMode ? "bg-white/5 border-transparent active:bg-white/10" : "bg-slate-50 border-transparent active:bg-slate-100"}`
                            }
                        `}
                        onClick={() => onSelect(product.id)}
                    >
                        {/* Product icon */}
                        <div className={`
                            w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-active:scale-90
                            ${isHighlighted ? "bg-[#f77f00] text-white shadow-lg shadow-[#f77f00]/30" : `${darkMode ? "bg-white/5 text-white/40" : "bg-white text-slate-400 shadow-sm"}`}
                        `}>
                            <span className="material-icons text-[24px]">
                                {product.tag === "bundle" ? "inventory_2" : "shopping_bag"}
                            </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[14px] font-black truncate`}>
                                    {product.name}
                                </span>
                                {isFlashProduct && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-black animate-pulse">
                                        FLASH
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[#f77f00] text-[13px] font-black">
                                    ${product.basePrice.toFixed(2)}
                                </span>
                                <span className={`
                                    text-[10px] font-bold uppercase tracking-tight ${isLowStock ? "text-red-500" : `${darkMode ? "text-white/30" : "text-slate-400"}`}
                                `}>
                                    {isLowStock ? `ONLY ${product.stock} LEFT!` : `Stock: ${product.stock}`}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(product);
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${darkMode ? "bg-white/5 hover:bg-white/10 text-white/40" : "bg-white hover:bg-slate-100 text-slate-400 shadow-sm"}`}
                            >
                                <span className="material-icons text-[18px]">edit</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(product.id);
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${darkMode ? "bg-red-500/10 text-red-500/60 hover:text-red-500" : "bg-red-50 text-red-400 hover:text-red-500 shadow-sm"}`}
                            >
                                <span className="material-icons text-[18px]">delete</span>
                            </button>
                            {isHighlighted && (
                                <div className="p-1 rounded-full bg-[#f77f00] animate-in zoom-in">
                                    <span className="material-icons text-[12px] text-white">push_pin</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Sales feed
function SalesFeed({ events, darkMode }: { events: SaleEvent[], darkMode: boolean }) {
    if (events.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center py-16 transition-colors ${darkMode ? "text-white/20" : "text-slate-300"}`}>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
                    <span className="material-icons text-5xl">receipt_long</span>
                </div>
                <span className="text-sm font-black uppercase tracking-widest">No transactions yet</span>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {[...events].reverse().map((event) => (
                <div
                    key={event.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${darkMode ? "bg-white/5 border-transparent" : "bg-slate-50 border-transparent"}`}
                >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
                        <span className="material-icons text-[20px] text-emerald-500">sell</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[13px] font-bold truncate block`}>{event.label}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-emerald-500 text-[12px] font-black">{event.amount}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-tight ${darkMode ? "text-white/20" : "text-slate-400"}`}>{event.time}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default MobileCommerceSheet;
