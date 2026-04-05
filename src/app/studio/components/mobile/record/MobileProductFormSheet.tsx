/**
 * MobileProductFormSheet - Add/Edit Product Form
 * 
 * A bottom sheet for entering product details:
 * - Name
 * - Price
 * - Stock
 * - Tag/Category
 */

import React, { useState, useEffect } from "react";
import { Product } from "../../shared/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface MobileProductFormSheetProps {
    isOpen: boolean;
    onClose: () => void;
    product?: Product | null; // If present, we're in "Edit" mode
    onSave: (productData: Partial<Product>) => void;
    darkMode?: boolean;
}

export const MobileProductFormSheet = ({
    isOpen,
    onClose,
    product,
    onSave,
    darkMode = true,
}: MobileProductFormSheetProps) => {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [tag, setTag] = useState("product");

    // Reset or populate fields when sheet opens/changes
    useEffect(() => {
        if (isOpen) {
            if (product) {
                setName(product.name);
                setPrice(product.basePrice.toString());
                setStock(product.stock.toString());
                setTag(product.tag);
            } else {
                setName("");
                setPrice("");
                setStock("");
                setTag("product");
            }
        }
    }, [isOpen, product]);

    const handleSave = () => {
        if (!name || !price || !stock) return;

        onSave({
            ...(product ? { id: product.id } : {}),
            name,
            basePrice: parseFloat(price),
            stock: parseInt(stock, 10),
            tag,
            currency: "USD"
        });
        onClose();
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent 
                side="bottom" 
                className={`h-auto rounded-t-[32px] border-none p-6 pb-12 overflow-hidden ${darkMode ? "bg-[#121212]/95 text-white" : "bg-white/95 text-slate-900"} backdrop-blur-2xl transition-all duration-300`}
            >
                <div className={`w-12 h-1.5 rounded-full mx-auto mb-6 ${darkMode ? "bg-white/10" : "bg-slate-200"}`} />
                
                <SheetHeader className="mb-8">
                    <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${darkMode ? "text-white/30" : "text-slate-400"}`}>Marketplace Engine</span>
                        <SheetTitle className={`${darkMode ? "text-white" : "text-slate-900"} text-2xl font-black uppercase tracking-tight`}>
                            {product ? "Update Inventory" : "Register Product"}
                        </SheetTitle>
                    </div>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className={`text-[10px] font-black uppercase tracking-[0.2em] px-1 ${darkMode ? "text-white/40" : "text-slate-500"}`}>Product Identifer</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="EX: PREMIUM BUNDLE"
                            className={`w-full p-4 rounded-2xl text-[15px] font-bold border transition-all outline-none ${darkMode ? "bg-white/5 border-white/10 focus:border-[#f77f00] text-white" : "bg-slate-50 border-slate-100 focus:border-[#f77f00] text-slate-900"}`}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Price */}
                        <div className="space-y-2">
                            <label className={`text-[10px] font-black uppercase tracking-[0.2em] px-1 ${darkMode ? "text-white/40" : "text-slate-500"}`}>Price (USD)</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                className={`w-full p-4 rounded-2xl text-[15px] font-black border transition-all outline-none tabular-nums ${darkMode ? "bg-white/5 border-white/10 focus:border-[#f77f00] text-white" : "bg-slate-50 border-slate-100 focus:border-[#f77f00] text-slate-900"}`}
                            />
                        </div>

                        {/* Stock */}
                        <div className="space-y-2">
                            <label className={`text-[10px] font-black uppercase tracking-[0.2em] px-1 ${darkMode ? "text-white/40" : "text-slate-500"}`}>Initial Units</label>
                            <input
                                type="number"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                placeholder="0"
                                className={`w-full p-4 rounded-2xl text-[15px] font-black border transition-all outline-none tabular-nums ${darkMode ? "bg-white/5 border-white/10 focus:border-[#f77f00] text-white" : "bg-slate-50 border-slate-100 focus:border-[#f77f00] text-slate-900"}`}
                            />
                        </div>
                    </div>

                    {/* Tag/Category */}
                    <div className="space-y-3">
                        <label className={`text-[10px] font-black uppercase tracking-[0.2em] px-1 ${darkMode ? "text-white/40" : "text-slate-500"}`}>Listing Category</label>
                        <div className="flex flex-wrap gap-2">
                            {["product", "bundle", "featured", "accessories"].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTag(t)}
                                    className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${tag === t 
                                        ? "bg-[#f77f00] text-white shadow-lg shadow-[#f77f00]/20" 
                                        : darkMode ? "bg-white/5 text-white/40 hover:text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 space-y-4">
                        <button
                            onClick={handleSave}
                            disabled={!name || !price || !stock}
                            className={`w-full py-4 rounded-2xl text-[13px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl ${!name || !price || !stock 
                                ? `${darkMode ? "bg-white/5 text-white/10" : "bg-slate-100 text-slate-300"}` 
                                : "bg-[#f77f00] text-white shadow-[#f77f00]/30"}`}
                        >
                            {product ? "Apply Changes" : "Broadcast Product"}
                        </button>
                        
                        <button
                            onClick={onClose}
                            className={`w-full py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${darkMode ? "text-white/20 hover:text-white/40" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            Decline Entry
                        </button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
