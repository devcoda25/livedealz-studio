"use client";

import React, { useMemo } from "react";
import { PlayCircle, Mic, Globe, DollarSign, Bell, BellOff, ShoppingCart, Lock, Eye, EyeOff, CreditCard, Calendar, FileText, Zap, Maximize2, Minimize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurrencyDef, LiveItem, LiveProductItem, LiveServiceItem, LiveSession, ViewerAuth, WholesaleTier } from "../data";
import { formatMoney, shipsFromLabel, flagEmoji } from "../utils";

interface VideoPaneProps {
    session: LiveSession;
    pinned: LiveItem | null;
    currency: CurrencyDef;
    audioLabel: string;
    displayNative: string;
    captionsOn: boolean;
    tr: (s: string) => string;
    t: (k: string) => string;
    isDesktop: boolean;
    reactions: { id: string; emoji: string }[];
    // Actions
    onPin: (id: string) => void;
    addToCart: (p: LiveProductItem) => void;
    openMiniCheckout: (p: LiveProductItem) => void;
    openDeal: (id: string) => void;
    openBooking: (id: string) => void;
    openQuote: (id: string) => void;
    openConsultation: (id: string) => void;
    toggleRestockReminder: (p: LiveProductItem) => void;
    // State checks
    isOutOfStock: (p: LiveProductItem) => boolean;
    isReminding: (p: LiveProductItem) => boolean;
    pinnedWholesaleLocked: boolean;
    pinnedWholesaleTier: WholesaleTier | null;
    packType: string;
    qty: number;
}

export function VideoPane({
    session,
    pinned,
    currency,
    audioLabel,
    displayNative,
    captionsOn,
    tr,
    t,
    isDesktop,
    reactions,
    onPin,
    addToCart,
    openMiniCheckout,
    openDeal,
    openBooking,
    openQuote,
    openConsultation,
    toggleRestockReminder,
    isOutOfStock,
    isReminding,
    pinnedWholesaleLocked,
    pinnedWholesaleTier,
    packType,
    qty,
}: VideoPaneProps) {
    const videoStyle = isDesktop
        ? { aspectRatio: "16 / 9", height: "520px" }
        : { aspectRatio: "9 / 16", width: "100%" };

    const isRegulated = Boolean(session.regulated);
    const pinnedIsProduct = pinned?.kind === "product";

    // Helpers for pinned display
    const pinnedPriceLine = useMemo(() => {
        if (!pinned) return "";
        if (pinned.kind === "product") {
            const p = pinned as LiveProductItem;
            // Simplified logic for brevity, assuming retail/mixed for now unless strict wholesale check passed
            if (typeof p.retailPromo === "number") return formatMoney(p.retailPromo, currency);
            if (p.type === "wholesale") return "Wholesale only";
            return "";
        }
        const s = pinned as LiveServiceItem;
        const base = s.servicePricingModel === "quote" ? t("requestQuote") : t("requestBooking");
        const from = typeof s.fromUsd === "number" ? formatMoney(s.fromUsd, currency) : "-";
        return `${base} · ${from} · ${s.duration} · ${s.nextAvailability}`;
    }, [pinned, currency, t]);

    const pillButtonClass = "rounded-full font-black";

    const [isExpanded, setIsExpanded] = React.useState(false);

    // Handle Escape key
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsExpanded(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    const containerClass = isExpanded
        ? "fixed inset-0 z-50 h-[100dvh] w-full bg-black rounded-none"
        : "relative overflow-hidden rounded-xl bg-[#0b0f19]";

    const contentClass = isExpanded ? "h-full w-full" : "w-full";
    const contentStyle = isExpanded ? {} : videoStyle;

    return (
        <div className={containerClass}>
            <div
                className={`${contentClass} relative flex items-center justify-center bg-[#0b0f19]`}
                style={{
                    ...contentStyle,
                    backgroundImage:
                        "radial-gradient(circle at 30% 20%, rgba(247,127,0,0.16), transparent 55%), radial-gradient(circle at 70% 70%, rgba(3,205,140,0.14), transparent 55%)",
                }}
            >
                <div className="text-center">
                    <PlayCircle className="mx-auto h-16 w-16 text-white/75" />
                    <p className="mt-2 text-sm text-white/75">
                        {session.state === "replay"
                            ? tr("Replay video")
                            : session.state === "upcoming"
                                ? tr("Waiting room")
                                : tr("Live stream")}
                    </p>
                </div>

                {/* Top-left overlays */}
                <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2 max-w-[70%]">
                    {session.state === "liveNow" && (
                        <div className="flex items-center gap-1.5 rounded-full border border-[#f77f00] bg-black/65 px-3 py-1">
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-xs font-black text-white">{t("live")}</span>
                            <span className="text-xs text-white">{(session.viewers ?? 0).toLocaleString()}</span>
                        </div>
                    )}

                    {session.audience !== "retail" && (
                        <Badge
                            className={`rounded-full px-2 py-0.5 text-xs font-black hover:bg-opacity-90 ${session.audience === "wholesale" ? "bg-[#7C3AED]/95" : "bg-[#03cd8c]/95"
                                }`}
                        >
                            {session.audience === "wholesale" ? tr("Wholesale") : tr("Retail + Wholesale")}
                        </Badge>
                    )}

                    {session.liveTypeChips?.slice(0, 3).map((x) => (
                        <Badge key={x} variant="outline" className="rounded-full border-white/10 bg-white/10 text-white/85 hover:bg-white/20">
                            {tr(x)}
                        </Badge>
                    ))}

                    <Badge variant="outline" className="flex items-center gap-1 rounded-full border-white/10 bg-white/10 text-white/85 hover:bg-white/20">
                        <Mic className="h-3 w-3" />
                        {audioLabel}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1 rounded-full border-white/10 bg-white/10 text-white/85 hover:bg-white/20">
                        <Globe className="h-3 w-3" />
                        UI: {displayNative}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1 rounded-full border-white/10 bg-white/10 text-white/85 hover:bg-white/20">
                        <DollarSign className="h-3 w-3" />
                        {currency.code}
                    </Badge>
                </div>

                {/* Top-Right Controls Zone */}
                <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
                    {/* Flash deal strip */}
                    {session.flashDeal && session.state === "liveNow" && (
                        <div className="rounded-lg border border-[#f77f00] bg-black/55 px-3 py-1.5">
                            <p className="text-xs font-black text-white">
                                {tr(session.flashDeal.label)} · {session.flashDeal.timeLeft} · extra {session.flashDeal.extraPct}%
                            </p>
                        </div>
                    )}
                </div>

                {/* Bottom-Right Controls (Expand) */}
                <div
                    className={`absolute right-3 transition-all duration-300 z-50 ${pinned
                        ? (isRegulated ? "bottom-36" : "bottom-24")
                        : "bottom-3"
                        }`}
                >
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
                        title={isExpanded ? t("exitFullscreen") : t("enterFullscreen")}
                    >
                        {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Floating reactions */}
                <div className={`absolute right-4 flex flex-col gap-2 pointer-events-none transition-all duration-300 ${pinned ? (isRegulated ? "bottom-48" : "bottom-36") : "bottom-14"}`}>
                    {reactions.map((r) => (
                        <div
                            key={r.id}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 animate-in fade-in zoom-in duration-300 slide-in-from-bottom-4"
                        >
                            <span className="text-lg">{r.emoji}</span>
                        </div>
                    ))}
                </div>

                {/* Regulated disclaimer */}
                {isRegulated && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-4 py-3">
                        <p className="text-xs text-white/80">
                            {captionsOn ? tr(session.regulated!.disclaimer) : session.regulated!.disclaimer}
                        </p>
                    </div>
                )}
            </div>

            {/* Pinned overlay */}
            {pinned && (
                <div className={`absolute left-3 right-3 ${isRegulated ? "bottom-14" : "bottom-3"}`}>
                    <div className="flex items-center w-full gap-3 rounded-xl border border-[#f77f00] bg-black/75 p-3 backdrop-blur-sm">
                        <img
                            src={pinned.thumbnailUrl}
                            alt={pinned.title}
                            className="h-11 w-11 rounded-lg object-cover"
                        />

                        <div className="flex-1 min-w-0">
                            <p className="truncate text-xs font-black text-white/95">
                                {captionsOn ? tr(pinned.title) : pinned.title}
                            </p>
                            <p className="truncate text-xs text-white/70">
                                {pinnedIsProduct
                                    ? pinnedPriceLine
                                    : `${formatMoney((pinned as LiveServiceItem).fromUsd, currency)} · ${(pinned as LiveServiceItem).duration}`}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap justify-end gap-2">
                            {pinnedIsProduct ? (
                                (() => {
                                    const p = pinned as LiveProductItem;
                                    const oos = isOutOfStock(p);
                                    const remindOn = isReminding(p);
                                    return (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => (oos ? toggleRestockReminder(p) : addToCart(p))}
                                                className={`${pillButtonClass} bg-white/92 hover:bg-white h-8 text-xs`}
                                            >
                                                {oos ? (remindOn ? <Bell className="mr-1 h-3 w-3" /> : <BellOff className="mr-1 h-3 w-3" />) : <ShoppingCart className="mr-1 h-3 w-3" />}
                                                {oos ? (remindOn ? t("reminding") : t("remindMe")) : t("addToCart")}
                                            </Button>
                                            <Button
                                                size="sm"
                                                disabled={oos}
                                                onClick={() => openMiniCheckout(p)}
                                                className={`${pillButtonClass} bg-[#f77f00] hover:bg-[#d06b00] text-white h-8 text-xs ${oos ? 'opacity-75' : ''}`}
                                            >
                                                {oos ? <EyeOff className="mr-1 h-3 w-3" /> : <CreditCard className="mr-1 h-3 w-3" />}
                                                {oos ? t("outOfStock") : t("buyNow")}
                                            </Button>
                                        </>
                                    );
                                })()
                            ) : (
                                (() => {
                                    const s = pinned as LiveServiceItem;
                                    const isConsult = s.serviceType === "consultation";
                                    const isOnDemand = isConsult && s.consultationMode === "onDemand";

                                    return (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => openDeal(s.id)}
                                                className={`${pillButtonClass} bg-white/92 hover:bg-white h-8 text-xs`}
                                            >
                                                <Eye className="mr-1 h-3 w-3" />
                                                {t("view")}
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    if (isConsult && isOnDemand) openConsultation(s.id);
                                                    else if (s.servicePricingModel === "quote") openQuote(s.id);
                                                    else openBooking(s.id);
                                                }}
                                                className={`${pillButtonClass} bg-[#f77f00] hover:bg-[#d06b00] text-white h-8 text-xs`}
                                            >
                                                {isConsult && isOnDemand ? <Zap className="mr-1 h-3 w-3" /> : <Calendar className="mr-1 h-3 w-3" />}
                                                {isConsult && isOnDemand ? t("startNow") : t("bookSlot")}
                                            </Button>
                                        </>
                                    )
                                })()
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
