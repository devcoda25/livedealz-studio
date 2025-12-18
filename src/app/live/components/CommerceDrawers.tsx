"use client";

import React from "react";
import { ShoppingCart, CreditCard, Minus, Plus, Calendar, FileText, CheckCircle2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiveProductItem, LiveServiceItem, CurrencyDef, PackType } from "../data";
import { formatMoney, shipsFromLabel, findTier } from "../utils";

// --- Mini Checkout Drawer ---
interface MiniCheckoutDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: LiveProductItem | null;
    buyerMode: string;
    qty: number;
    setQty: (n: number) => void;
    packType: string;
    setPackType: (s: string) => void;
    currency: CurrencyDef;
    addToCart: (p: LiveProductItem) => void;
    confirmCheckout: (p: LiveProductItem) => void;
    isOutOfStock: (p: LiveProductItem) => boolean;
    t: (k: string) => string;
}

export function MiniCheckoutDrawer({
    open,
    onOpenChange,
    product,
    buyerMode,
    qty,
    setQty,
    packType,
    setPackType,
    currency,
    addToCart,
    confirmCheckout,
    isOutOfStock,
    t,
}: MiniCheckoutDrawerProps) {
    if (!product) return null;

    const oos = isOutOfStock(product);
    const isWholesale = buyerMode === "wholesale";

    // Price calc
    let unitPrice = 0;
    if (isWholesale) {
        const tier = findTier(product.tiers, qty);
        unitPrice = tier?.unitPrice ?? product.tiers?.[0]?.unitPrice ?? 0;
    } else {
        unitPrice = product.retailPromo ?? product.retailOriginal ?? 0;
    }

    const total = unitPrice * (isWholesale ? qty : 1);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="sm:max-w-md mx-auto rounded-t-xl px-4 pb-6 bg-background border-border text-foreground">
                <SheetHeader className="mb-4 text-left">
                    <SheetTitle className="text-foreground">Quick Checkout</SheetTitle>
                </SheetHeader>

                <div className="flex gap-3 mb-6">
                    <img src={product.thumbnailUrl} alt={product.title} className="w-16 h-16 rounded-md object-cover bg-muted" />
                    <div>
                        <p className="font-bold text-sm line-clamp-1 text-foreground">{product.title}</p>
                        <p className="text-xs text-muted-foreground">{buyerMode === 'wholesale' ? 'Wholesale' : 'Retail'} · {currency.code}</p>
                        {oos && <span className="text-xs font-bold text-destructive">{t("outOfStock")}</span>}
                    </div>
                </div>

                {isWholesale ? (
                    <div className="bg-muted/50 p-3 rounded-lg border border-border mb-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-muted-foreground">Pack Type</Label>
                                <Select value={packType} onValueChange={setPackType}>
                                    <SelectTrigger className="h-8 text-xs bg-background border-input text-foreground">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border-border text-foreground">
                                        {["Unit", "Pack", "Carton", "Pallet"].map(pt => (
                                            <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Qty</Label>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQty(Math.max(1, qty - 1))}>
                                        <Minus className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                    <Input
                                        className="h-8 text-center text-xs bg-background border-input text-foreground"
                                        value={qty}
                                        onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                                    />
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQty(qty + 1)}>
                                        <Plus className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-baseline pt-2 border-t border-border">
                            <span className="text-sm font-medium text-muted-foreground">Estimated Total</span>
                            <span className="text-lg font-black text-foreground">{formatMoney(total, currency)}</span>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 flex justify-between items-baseline px-4 py-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium text-muted-foreground">Total</span>
                        <span className="text-xl font-black text-foreground">{formatMoney(total, currency)}</span>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => addToCart(product)} disabled={oos}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {t("addToCart")}
                    </Button>
                    <Button className="bg-[#f77f00] hover:bg-[#d06b00] text-white" onClick={() => confirmCheckout(product)} disabled={oos}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        {t("buyNow")}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// --- Booking Drawer ---
interface BookingDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    service: LiveServiceItem | null;
    bookDate: string;
    setBookDate: (s: string) => void;
    bookTime: string;
    setBookTime: (s: string) => void;
    submitBooking: () => void;
}

export function BookingDrawer({
    open,
    onOpenChange,
    service,
    bookDate,
    setBookDate,
    bookTime,
    setBookTime,
    submitBooking,
}: BookingDrawerProps) {
    if (!service) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="sm:max-w-md mx-auto rounded-t-xl px-4 pb-6 bg-background border-border text-foreground">
                <SheetHeader className="mb-4 text-left">
                    <SheetTitle className="text-foreground">Book Appointment</SheetTitle>
                </SheetHeader>

                <div className="mb-4">
                    <p className="font-bold text-foreground">{service.title}</p>
                    <p className="text-xs text-muted-foreground">{service.providerName} · {service.duration}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Date</Label>
                        <Input type="date" value={bookDate} onChange={e => setBookDate(e.target.value)} className="bg-background border-input text-foreground" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Time</Label>
                        <Select value={bookTime} onValueChange={setBookTime}>
                            <SelectTrigger className="bg-background border-input text-foreground">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-border text-foreground">
                                {["10:00", "12:00", "14:00", "16:00", "18:00"].map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Button className="w-full bg-[#f77f00] hover:bg-[#d06b00] text-white" onClick={submitBooking}>
                    Confirm Booking
                </Button>
            </SheetContent>
        </Sheet>
    );
}

// --- Quote Drawer ---
interface QuoteDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    service: LiveServiceItem | null;
    scope: string;
    setScope: (s: string) => void;
    address: string;
    setAddress: (s: string) => void;
    submitQuote: () => void;
}

export function QuoteDrawer({
    open,
    onOpenChange,
    service,
    scope,
    setScope,
    address,
    setAddress,
    submitQuote,
}: QuoteDrawerProps) {
    if (!service) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="sm:max-w-md mx-auto rounded-t-xl px-4 pb-6 h-[80vh] bg-background border-border text-foreground">
                <SheetHeader className="mb-4 text-left">
                    <SheetTitle className="text-foreground">Request Quote</SheetTitle>
                </SheetHeader>

                <div className="space-y-4 mb-6">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Scope of Work</Label>
                        <Textarea
                            placeholder="Describe your needs..."
                            className="min-h-[100px] bg-background border-input text-foreground placeholder:text-muted-foreground"
                            value={scope}
                            onChange={e => setScope(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Location / Address</Label>
                        <Input
                            placeholder="Where is the service needed?"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    <div className="bg-blue-500/10 p-3 rounded text-xs text-blue-600 dark:text-blue-300 border border-blue-500/20">
                        If this service offers a free assessment, the provider will coordinate a visit after you submit.
                    </div>
                </div>

                <Button className="w-full bg-[#f77f00] hover:bg-[#d06b00] text-white" onClick={submitQuote}>
                    Submit Request
                </Button>
            </SheetContent>
        </Sheet>
    );
}
