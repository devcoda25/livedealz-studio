"use client";

import React from "react";
import { Eye, Pin, ShoppingCart, Bell, BellOff, CreditCard, Lock, Truck, Calendar, Zap, Video, MapPin, Clock, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LiveProductItem, LiveServiceItem, CurrencyDef, WholesaleTier } from "../data";
import { formatMoney, shipsFromLabel, findTier } from "../utils";

interface ProductCardProps {
    p: LiveProductItem;
    sessionState: string;
    buyerMode: string;
    auth: string;
    wholesaleApproved: boolean;
    currency: CurrencyDef;
    qty: number;
    packType: string;
    captionsOn: boolean;
    t: (k: string) => string;
    tr: (s: string) => string;
    // Actions
    onIdentify: (id: string) => void; // navigate to deal
    onPin: (id: string) => void;
    addToCart: (p: LiveProductItem) => void;
    openMiniCheckout: (p: LiveProductItem) => void;
    getStockLeft: (p: LiveProductItem) => number | null;
    isOutOfStock: (p: LiveProductItem) => boolean;
    isReminding: (p: LiveProductItem) => boolean;
}

export function ProductCard({
    p,
    sessionState,
    buyerMode,
    auth,
    wholesaleApproved,
    currency,
    qty,
    packType,
    captionsOn,
    t,
    tr,
    onIdentify,
    onPin,
    addToCart,
    openMiniCheckout,
    getStockLeft,
    isOutOfStock,
    isReminding,
}: ProductCardProps) {
    const isExpired = sessionState === "replay" && p.expired;
    const showRetail = p.type === "retail" || p.type === "mixed";
    const showWholesale = p.type === "wholesale" || p.type === "mixed";

    const lockedWholesale =
        showWholesale && (auth === "guest" || !wholesaleApproved) && (p.wholesaleOnly || buyerMode === "wholesale");

    const retailPriceLine =
        typeof p.retailPromo === "number"
            ? `${formatMoney(p.retailPromo, currency)}${typeof p.retailOriginal === "number" ? ` (was ${formatMoney(p.retailOriginal, currency)})` : ""
            }`
            : "";

    const whTier = findTier(p.tiers, qty);
    const whPriceUsd = whTier?.unitPrice ?? p.tiers?.[0]?.unitPrice;

    const stockLeft = getStockLeft(p);
    const oos = isOutOfStock(p);
    const remindOn = isReminding(p);

    return (
        <Card className={`rounded-xl shadow-sm border-border bg-card text-card-foreground ${isExpired ? "opacity-65" : ""}`}>
            <div className="flex">
                <img src={p.thumbnailUrl} alt={p.title} className="w-24 h-24 object-cover rounded-l-xl bg-muted" />
                <div className="flex-1 min-w-0">
                    <CardContent className="p-3 pb-4">
                        <div className="flex align-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-sm font-black truncate text-foreground">{captionsOn ? tr(p.title) : p.title}</p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    <span className="text-xs text-muted-foreground">{captionsOn ? tr(p.category) : p.category}</span>
                                    <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[10px] font-normal gap-1">
                                        <Truck className="h-3 w-3" /> {shipsFromLabel(p.shipFrom)}
                                    </Badge>
                                    {typeof stockLeft === "number" && (
                                        <Badge variant={oos ? "secondary" : "default"} className={`rounded-full px-1.5 py-0 text-[10px] items-center ${oos ? '' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'}`}>
                                            {oos ? t("outOfStock") : `Stock: ${stockLeft}`}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Badges/Chips */}
                            <div className="flex flex-wrap justify-end gap-1">
                                {p.liveOnlyPrice && <Badge className="rounded-full text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20">Live-only</Badge>}
                                {p.type === "wholesale" && <Badge className="rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 font-black text-[10px]">Wholesale</Badge>}
                            </div>
                        </div>

                        {/* Price Blocks */}
                        {buyerMode !== "wholesale" && showRetail && (
                            <div className="mt-2">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">{t("retail")}</p>
                                <p className="text-sm font-black text-foreground">{retailPriceLine || tr("Retail pricing")}</p>
                                {(p.urgency || p.countdown) && (
                                    <p className="text-xs text-orange-500 dark:text-orange-400 mt-0.5">
                                        {captionsOn ? tr(p.urgency ?? "") : p.urgency} {p.urgency && p.countdown ? "·" : ""} {p.countdown}
                                    </p>
                                )}
                            </div>
                        )}

                        {buyerMode === "wholesale" && showWholesale && (
                            <div className="mt-2">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">{t("wholesale")}</p>
                                {lockedWholesale ? (
                                    <Alert className="mt-1 py-2 bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-300">
                                        <Lock className="h-4 w-4" />
                                        <AlertDescription className="text-xs ml-2">{t("wholesaleLocked")}</AlertDescription>
                                    </Alert>
                                ) : (
                                    <>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {p.moqLabel && <Badge variant="outline" className="text-[10px]">{p.moqLabel}</Badge>}
                                            {p.packType && <Badge variant="outline" className="text-[10px]">Pack: {p.packType}</Badge>}
                                        </div>
                                        {typeof whPriceUsd === "number" && (
                                            <p className="text-sm font-black mt-1 text-foreground">
                                                {formatMoney(whPriceUsd, currency)} / {packType.toLowerCase()} · Qty {qty}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Actions Row 1 */}
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" onClick={() => onIdentify(p.id)} className="h-8 rounded-full text-xs font-bold">
                                <Eye className="mr-1.5 h-3.5 w-3.5" /> {t("view")}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => onPin(p.id)} className="h-8 rounded-full text-xs font-bold">
                                <Pin className="mr-1.5 h-3.5 w-3.5" /> {t("pin")}
                            </Button>
                        </div>

                        {/* Actions Row 2 */}
                        <div className="mt-2 grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={isExpired || sessionState === "upcoming"}
                                onClick={() => addToCart(p)}
                                className="h-8 rounded-full text-xs font-bold"
                            >
                                {oos ? (remindOn ? <Bell className="mr-1.5 h-3.5 w-3.5" /> : <BellOff className="mr-1.5 h-3.5 w-3.5" />) : <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />}
                                {oos ? (remindOn ? t("reminding") : t("remindMe")) : t("addToCart")}
                            </Button>

                            <Button
                                size="sm"
                                disabled={isExpired || sessionState === "upcoming" || oos}
                                onClick={() => {
                                    onPin(p.id);
                                    openMiniCheckout(p);
                                }}
                                className={`bg-[#f77f00] hover:bg-[#d06b00] text-white border-0 h-8 rounded-full text-xs font-bold ${oos ? 'opacity-75' : ''}`}
                            >
                                {oos ? <Eye className="mr-1.5 h-3.5 w-3.5" /> : <CreditCard className="mr-1.5 h-3.5 w-3.5" />}
                                {oos ? t("outOfStock") : t("buyNow")}
                            </Button>
                        </div>

                    </CardContent>
                </div>
            </div>
        </Card>
    );
}

interface ServiceCardProps {
    s: LiveServiceItem;
    buyerMode: string;
    auth: string;
    wholesaleApproved: boolean;
    currency: CurrencyDef;
    t: (k: string) => string;
    tr: (s: string) => string;
    onIdentify: (id: string) => void;
    onPin: (id: string) => void;
    openBooking: (id: string) => void;
    openQuote: (id: string) => void;
    openConsultation: (id: string) => void;
}

export function ServiceCard({
    s,
    buyerMode,
    auth,
    wholesaleApproved,
    currency,
    t,
    tr,
    onIdentify,
    onPin,
    openBooking,
    openQuote,
    openConsultation,
}: ServiceCardProps) {
    const isConsult = s.serviceType === "consultation";
    const isOnDemand = isConsult && s.consultationMode === "onDemand";

    const primaryLabel = isConsult
        ? isOnDemand
            ? t("startNow")
            : t("bookSlot")
        : s.servicePricingModel === "quote"
            ? t("requestQuote")
            : t("requestBooking");

    const primaryIcon = isConsult ? (
        isOnDemand ? (
            <Zap className="mr-1.5 h-3.5 w-3.5" />
        ) : (
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
        )
    ) : s.servicePricingModel === "quote" ? (
        <FileText className="mr-1.5 h-3.5 w-3.5" />
    ) : (
        <Calendar className="mr-1.5 h-3.5 w-3.5" />
    );

    const modeIcon = s.serviceMode === "Remote" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />;
    const showPackages = buyerMode === "wholesale" && Boolean(s.b2bAvailable) && Boolean(s.packages?.length);
    const packagesLocked = showPackages && (auth === "guest" || !wholesaleApproved);
    const pillButtonClass = "rounded-full font-black text-xs h-8";

    return (
        <Card className="rounded-xl shadow-sm border-border bg-card text-card-foreground">
            <div className="flex">
                <img src={s.thumbnailUrl} alt={s.title} className="w-24 h-24 object-cover rounded-l-xl bg-muted" />
                <div className="flex-1 min-w-0">
                    <CardContent className="p-3 pb-4">
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                                <p className="text-sm font-black truncate text-foreground">{s.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{s.category}</p>
                            </div>
                            <div className="flex flex-wrap gap-1 justify-end">
                                <Badge variant="secondary" className="text-[10px]">Provider</Badge>
                                {s.bookAfterLive && <Badge variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">Book later</Badge>}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-2">
                            <Badge variant="outline" className="rounded-full text-[10px] font-normal">{s.providerName}</Badge>
                            <Badge variant="outline" className="rounded-full text-[10px] font-normal gap-1">{modeIcon} {s.serviceMode}</Badge>
                            <Badge variant="outline" className="rounded-full text-[10px] font-normal gap-1"><Clock className="h-3 w-3" />{s.duration}</Badge>
                        </div>

                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">From</span>
                            <span className="text-sm font-black text-foreground">
                                {s.servicePricingModel === "quote" ? "-" : formatMoney(s.fromUsd, currency)}
                            </span>
                            {typeof s.rating === 'number' && (
                                <span className="text-xs text-muted-foreground">★ {s.rating.toFixed(1)}</span>
                            )}
                        </div>

                        {showPackages && (
                            <div className="mt-2 p-2 bg-muted/50 rounded-lg border border-border">
                                <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Wholesale Packages</p>
                                {packagesLocked ? (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Lock className="h-3 w-3" /> Access required
                                    </div>
                                ) : (
                                    s.packages!.slice(0, 2).map(p => (
                                        <div key={p.label} className="text-xs text-muted-foreground">
                                            {p.label}: {formatMoney(p.priceUsd, currency)}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" onClick={() => onIdentify(s.id)} className={pillButtonClass}>
                                <Eye className="mr-1.5 h-3.5 w-3.5" /> {t("view")}
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => {
                                    onPin(s.id);
                                    if (isConsult && isOnDemand) openConsultation(s.id);
                                    else if (s.servicePricingModel === "quote") openQuote(s.id);
                                    else openBooking(s.id);
                                }}
                                className={`bg-[#f77f00] hover:bg-[#d06b00] text-white border-0 ${pillButtonClass}`}
                            >
                                {primaryIcon}
                                {primaryLabel}
                            </Button>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => onPin(s.id)} className="w-full mt-1 text-xs text-muted-foreground h-6">
                            Pin to screen
                        </Button>
                    </CardContent>
                </div>
            </div>
        </Card>
    );
}
