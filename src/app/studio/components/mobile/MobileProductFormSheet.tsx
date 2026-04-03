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
import { Product } from "../shared/types";
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
                className={`h-auto rounded-t-[32px] border-none p-6 pb-12 overflow-hidden ${darkMode ? "bg-[#121212] text-white" : "bg-white text-slate-900"}`}
            >
                <div className={`w-12 h-1.5 rounded-full mx-auto mb-6 ${darkMode ? "bg-white/10" : "bg-slate-200"}`} />
                
                <SheetHeader className="mb-6">
                    <SheetTitle className={darkMode ? "text-white" : ""}>
                        {product ? "Edit Product" : "Add New Product"}
                    </SheetTitle>
                </SheetHeader>

                <div className="space-y-5">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Product Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Premium Bundle"
                            className={`w-full p-4 rounded-2xl text-[15px] outline-none transition-all ${darkMode ? "bg-white/5 focus:bg-white/10 text-white" : "bg-slate-50 focus:bg-slate-100 text-slate-900"}`}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Price */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Price ($)</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                className={`w-full p-4 rounded-2xl text-[15px] outline-none transition-all ${darkMode ? "bg-white/5 focus:bg-white/10 text-white" : "bg-slate-50 focus:bg-slate-100 text-slate-900"}`}
                            />
                        </div>

                        {/* Stock */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Initial Stock</label>
                            <input
                                type="number"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                placeholder="0"
                                className={`w-full p-4 rounded-2xl text-[15px] outline-none transition-all ${darkMode ? "bg-white/5 focus:bg-white/10 text-white" : "bg-slate-50 focus:bg-slate-100 text-slate-900"}`}
                            />
                        </div>
                    </div>

                    {/* Tag/Category */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Category Tag</label>
                        <div className="flex gap-2">
                            {["product", "bundle", "featured", "accessories"].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTag(t)}
                                    className={`px-4 py-2 rounded-xl text-[12px] font-bold capitalize transition-all ${tag === t 
                                        ? "bg-primary text-white" 
                                        : darkMode ? "bg-white/5 text-slate-400" : "bg-slate-50 text-slate-500"}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={!name || !price || !stock}
                        className={`w-full py-4 mt-4 rounded-2xl text-md font-bold transition-all active:scale-95 shadow-xl ${!name || !price || !stock 
                            ? "bg-slate-800 text-slate-500" 
                            : "bg-[#FF5C00] text-white shadow-[#FF5C00]/20"}`}
                    >
                        {product ? "Update Product" : "Confirm & Add"}
                    </button>
                    
                    <button
                        onClick={onClose}
                        className={`w-full py-2 text-sm font-medium ${darkMode ? "text-slate-500" : "text-slate-400"}`}
                    >
                        Cancel
                    </button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
