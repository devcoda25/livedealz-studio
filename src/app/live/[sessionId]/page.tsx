"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MoreVertical, Share2, Flag, Eye, EyeOff, ShoppingCart, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";

// Shadcn UI
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Local
import {
    LiveSession,
    SAMPLE_SESSIONS,
    LiveProductItem,
    LiveServiceItem,
    ChatMessage,
    Poll,
    CurrencyCode,
    LangCode,
    ViewerAuth,
    BuyerMode,
    PackType,
    LiveOverride,
    CURRENCIES,
    I18N,
    LANGS,
} from "../data";
import { applyPhraseMap, todayIso } from "../utils";

// Components
import { VideoPane } from "../components/VideoPane";
import { InteractionPanel } from "../components/InteractionPanel";
import { PreferencesDrawer } from "../components/PreferencesDrawer";
import { MiniCheckoutDrawer, BookingDrawer, QuoteDrawer } from "../components/CommerceDrawers";

const ORANGE = "#f77f00";

export default function LiveSessionPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { theme, setTheme } = useTheme();

    // Route / Session State
    const sessionIdParam = params?.sessionId as string;
    const [sessionId, setSessionId] = useState<string>(SAMPLE_SESSIONS[0].id);

    // Fallback to first session if not found or if param is generic
    useEffect(() => {
        if (sessionIdParam) {
            const exists = SAMPLE_SESSIONS.some((s) => s.id === sessionIdParam);
            if (exists) setSessionId(sessionIdParam);
        }
    }, [sessionIdParam]);

    const session = useMemo(
        () => SAMPLE_SESSIONS.find((s) => s.id === sessionId) ?? SAMPLE_SESSIONS[0],
        [sessionId]
    );

    // --- Viewer Context ---
    const [auth, setAuth] = useState<ViewerAuth>("guest");
    const [buyerMode, setBuyerMode] = useState<BuyerMode>("retail");
    const [wholesaleApproved, setWholesaleApproved] = useState(false);
    const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 768 : true; // Rough check

    // --- Shell / Prefs ---
    const [shellCurrency, setShellCurrency] = useState<CurrencyCode>("USD");
    const [shellLang, setShellLang] = useState<LangCode>("en");

    // Per-live overrides
    const [overrides, setOverrides] = useState<Record<string, LiveOverride>>({});
    const [displayLang, setDisplayLang] = useState<LangCode>("en");
    const [audioLang, setAudioLang] = useState<LangCode>("en");
    const [currencyCode, setCurrencyCode] = useState<CurrencyCode>("USD");

    // Toggles
    const [voiceTranslationOn, setVoiceTranslationOn] = useState(true);
    const [captionsOn, setCaptionsOn] = useState(true);
    const [translateChatOn, setTranslateChatOn] = useState(true);

    const currency = CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];

    // Helper
    const t = (key: string) => I18N[displayLang]?.[key] ?? I18N.en[key] ?? key;
    const tr = (text: string) => (displayLang === "en" ? text : applyPhraseMap(displayLang, text));

    // --- UI State ---
    const [panelTab, setPanelTab] = useState("products");
    const [itemFilter, setItemFilter] = useState("all");
    const [hideChat, setHideChat] = useState(false);
    const [prefsOpen, setPrefsOpen] = useState(false);
    const [snackOpen, setSnackOpen] = useState(false); // Using sonner toast instead

    // Pinned Logic
    const [pinnedId, setPinnedId] = useState<string>("");
    const pinned = useMemo(() => session.items.find((p) => p.id === pinnedId) ?? null, [session.items, pinnedId]);

    // Stock & Wholesale Logic
    const [packType, setPackType] = useState<string>("Unit");
    const [qty, setQty] = useState<number>(1);
    const [stockMap, setStockMap] = useState<Record<string, number>>({});
    const [restockReminders, setRestockReminders] = useState<Record<string, boolean>>({});

    // Commerce Drawers
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [bookingOpen, setBookingOpen] = useState(false);
    const [bookingItemId, setBookingItemId] = useState<string | null>(null);
    const [bookDate, setBookDate] = useState(todayIso());
    const [bookTime, setBookTime] = useState("14:00");

    const [quoteOpen, setQuoteOpen] = useState(false);
    const [quoteItemId, setQuoteItemId] = useState<string | null>(null);
    const [quoteScope, setQuoteScope] = useState("");
    const [quoteAddress, setQuoteAddress] = useState("");

    // Consultation Room (simulated view switch)
    const [consultRoomOpen, setConsultRoomOpen] = useState(false);
    const [consultItemId, setConsultItemId] = useState<string | null>(null);
    const [consultChat, setConsultChat] = useState<ChatMessage[]>([]);
    const [consultInput, setConsultInput] = useState("");

    // Chat & Poll
    const [chatInput, setChatInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: "sys1", author: "System", role: "system", text: "Welcome to the live.", ts: "Now", type: "system" },
        { id: "pin1", author: "Host", role: "host", text: "Pinned: Use code LIVE10 for retail bonus.", ts: "Now", type: "system" },
        { id: "m1", author: "Host", role: "host", text: "Ask me anything about the items featured today.", ts: "Now", type: "text" },
    ]);
    const [poll, setPoll] = useState<Poll>({
        id: "poll1", question: "Which pack size do you prefer?", options: [{ id: "o1", label: "Unit", votes: 12 }, { id: "o2", label: "Pack", votes: 7 }]
    });
    const [votedOption, setVotedOption] = useState<string | null>(null);
    const [reactions, setReactions] = useState<{ id: string; emoji: string }[]>([]);

    // --- Effects ---

    // Init Session Defaults
    useEffect(() => {
        setPinnedId(session.items[0]?.id ?? "");
        setStockMap(prev => {
            const next = { ...prev };
            session.items.forEach(i => {
                if (i.kind === 'product' && typeof i.stockLeft === 'number') {
                    const k = `${sessionId}:${i.id}`;
                    if (next[k] == null) next[k] = i.stockLeft;
                }
            });
            return next;
        })
    }, [sessionId, session]);

    // Init Prefs
    useEffect(() => {
        const ov = overrides[sessionId];
        if (ov) {
            setDisplayLang(ov.displayLang);
            setAudioLang(ov.audioLang);
            setCurrencyCode(ov.currencyCode);
        } else {
            setDisplayLang(shellLang);
            setAudioLang(shellLang);
            setCurrencyCode(shellCurrency);
        }
    }, [sessionId, overrides, shellLang, shellCurrency]);


    // --- Handlers ---

    const showSnack = (msg: string) => toast(msg);

    const getStockLeft = (p: LiveProductItem) => {
        const k = `${sessionId}:${p.id}`;
        return stockMap[k] ?? p.stockLeft ?? null;
    };
    const isOutOfStock = (p: LiveProductItem) => {
        const sl = getStockLeft(p);
        return typeof sl === 'number' && sl <= 0;
    };
    const isReminding = (p: LiveProductItem) => !!restockReminders[`${sessionId}:${p.id}`];

    const consumeStock = (p: LiveProductItem, amt: number) => {
        const k = `${sessionId}:${p.id}`;
        const curr = stockMap[k];
        if (typeof curr === 'number') {
            setStockMap(prev => ({ ...prev, [k]: Math.max(0, curr - amt) }));
        }
    };

    const onPin = (id: string) => {
        setPinnedId(id);
        const item = session.items.find(i => i.id === id);
        if (item?.kind === 'product') {
            if (item.packType) setPackType(item.packType);
            if (item.tiers?.[0]?.minQty) setQty(item.tiers[0].minQty);
        }
        showSnack("Item pinned");
    };

    const addToCart = (p: LiveProductItem) => {
        if (session.state === 'upcoming') return showSnack("Live not started");
        if (isOutOfStock(p)) {
            setRestockReminders(prev => ({ ...prev, [`${sessionId}:${p.id}`]: !prev[`${sessionId}:${p.id}`] }));
            return showSnack(isReminding(p) ? "Reminder removed" : "We'll notify you when back");
        }
        consumeStock(p, buyerMode === 'wholesale' ? qty : 1);
        showSnack(`Added ${p.title} to cart`);
    };

    const openMiniCheckout = (p: LiveProductItem) => {
        if (isOutOfStock(p)) return showSnack(t("outOfStock"));
        setCheckoutOpen(true);
    };

    const confirmCheckout = (p: LiveProductItem) => {
        if (isOutOfStock(p)) return showSnack(t("outOfStock"));
        consumeStock(p, buyerMode === 'wholesale' ? qty : 1);
        setCheckoutOpen(false);
        showSnack("Order placed (preview)");
    };

    const openBooking = (id: string) => {
        setBookingItemId(id);
        setBookingOpen(true);
    };

    const openQuote = (id: string) => {
        setQuoteItemId(id);
        setQuoteOpen(true);
    };

    const openConsultation = (id: string) => {
        setConsultItemId(id);
        setConsultRoomOpen(true);
    };

    const sendChat = () => {
        if (!chatInput.trim()) return;
        if (auth === 'guest') return showSnack("Sign in to chat");
        setMessages(prev => [...prev, { id: `m-${Date.now()}`, author: "You", role: "viewer", text: chatInput, ts: "Now", type: "text" }]);
        setChatInput("");
    };

    const reactEmoji = (e: string) => {
        const id = `r-${Date.now()}`;
        setReactions(prev => [...prev, { id, emoji: e }]);
        setTimeout(() => setReactions(prev => prev.filter(x => x.id !== id)), 1200);
    };

    const vote = (oid: string) => {
        if (votedOption) return;
        setPoll(prev => ({
            ...prev,
            options: prev.options.map(o => o.id === oid ? { ...o, votes: o.votes + 1 } : o)
        }));
        setVotedOption(oid);
        showSnack("Vote recorded");
    };


    // --- Render ---

    if (consultRoomOpen) {
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-4 bg-background min-h-screen text-foreground">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setConsultRoomOpen(false)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Live
                </Button>
                <div className="bg-black text-white h-[400px] flex items-center justify-center rounded-xl border border-border">
                    <p>Consultation Room Video Feed</p>
                </div>
                <div className="border border-border bg-card p-4 rounded-xl h-[200px] overflow-y-auto">
                    <p className="text-muted-foreground text-sm text-center">Private Session Chat</p>
                </div>
            </div>
        );
    }

    const audioLabel = voiceTranslationOn ? (LANGS.find(l => l.code === audioLang)?.native || "English") : `${t("original")}: ${session.language}`;

    return (
        <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0 transition-colors duration-300">

            {/* Top Bar */}
            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-muted text-muted-foreground">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="hidden md:block">
                        <h1 className="font-bold text-sm leading-tight text-foreground">{captionsOn ? tr(session.title) : session.title}</h1>
                        <p className="text-xs text-muted-foreground">{session.hosts.hostInfo.seller.name}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="hidden md:flex bg-muted text-muted-foreground">{session.state}</Badge>

                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="hover:bg-muted text-muted-foreground"
                    >
                        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => setPrefsOpen(true)} className="bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground">
                        {displayLang.toUpperCase()} / {currency.code}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => showSnack("Share")} className="hover:bg-muted text-muted-foreground">
                        <Share2 className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-muted text-muted-foreground"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                            <DropdownMenuItem onClick={() => setHideChat(!hideChat)} className="focus:bg-muted focus:text-foreground">
                                {hideChat ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                                {hideChat ? t("showChat") : t("hideChat")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem onClick={() => router.push('/cart')} className="focus:bg-muted focus:text-foreground">
                                <ShoppingCart className="mr-2 h-4 w-4" /> Cart
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500 focus:bg-red-500/10 focus:text-red-600 dark:focus:text-red-400">
                                <Flag className="mr-2 h-4 w-4" /> {t("reportStream")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-60px)]">

                {/* Main Video Area */}
                <div className="md:col-span-7 flex flex-col gap-4">
                    <VideoPane
                        session={session}
                        pinned={pinned}
                        currency={currency}
                        audioLabel={audioLabel}
                        displayNative={LANGS.find(l => l.code === displayLang)?.native || "English"}
                        captionsOn={captionsOn}
                        tr={tr} t={t} isDesktop={isDesktop}
                        reactions={reactions}
                        onPin={onPin}
                        addToCart={addToCart}
                        openMiniCheckout={openMiniCheckout}
                        openDeal={(id) => showSnack(`Open Deal ${id}`)}
                        openBooking={openBooking}
                        openQuote={openQuote}
                        openConsultation={openConsultation}
                        toggleRestockReminder={(p) => addToCart(p)}
                        isOutOfStock={isOutOfStock}
                        isReminding={isReminding}
                        pinnedWholesaleLocked={false} // Simplified for demo
                        pinnedWholesaleTier={null}
                        packType={packType}
                        qty={qty}
                    />

                    {/* Desktop only descriptive content below video? */}
                    <div className="hidden md:block">
                        {/* Could put session details here */}
                    </div>
                </div>

                {/* Side Interaction Panel */}
                <div className="md:col-span-5 h-[500px] md:h-full">
                    <InteractionPanel
                        session={session}
                        auth={auth}
                        buyerMode={buyerMode}
                        currency={currency}
                        panelTab={panelTab}
                        setPanelTab={setPanelTab}
                        itemFilter={itemFilter}
                        setItemFilter={setItemFilter}
                        hideChat={hideChat}
                        messages={messages}
                        chatInput={chatInput}
                        setChatInput={setChatInput}
                        sendChat={sendChat}
                        sendAttachment={() => { }}
                        reactEmoji={reactEmoji}
                        poll={poll}
                        vote={vote}
                        votedOption={votedOption}
                        onIdentify={(id) => showSnack(`Identify ${id}`)}
                        onPin={onPin}
                        addToCart={addToCart}
                        openMiniCheckout={openMiniCheckout}
                        openBooking={openBooking}
                        openQuote={openQuote}
                        openConsultation={openConsultation}
                        getStockLeft={getStockLeft}
                        isOutOfStock={isOutOfStock}
                        isReminding={isReminding}
                        wholesaleApproved={wholesaleApproved}
                        packType={packType}
                        qty={qty}
                        captionsOn={captionsOn}
                        t={t} tr={tr}
                        isDesktop={isDesktop}
                        videoHeight={500}
                    />
                </div>

            </div>

            {/* Drawers */}
            <PreferencesDrawer
                open={prefsOpen} onOpenChange={setPrefsOpen}
                displayLang={displayLang} setDisplayLang={setDisplayLang}
                audioLang={audioLang} setAudioLang={setAudioLang}
                currencyCode={currencyCode} setCurrencyCode={setCurrencyCode}
                voiceTranslationOn={voiceTranslationOn} setVoiceTranslationOn={setVoiceTranslationOn}
                captionsOn={captionsOn} setCaptionsOn={setCaptionsOn}
                translateChatOn={translateChatOn} setTranslateChatOn={setTranslateChatOn}
                isOverridden={false} clearOverride={() => { }}
                t={t}
            />

            <MiniCheckoutDrawer
                open={checkoutOpen} onOpenChange={setCheckoutOpen}
                product={pinned?.kind === 'product' ? (pinned as LiveProductItem) : null}
                buyerMode={buyerMode}
                qty={qty} setQty={setQty}
                packType={packType} setPackType={setPackType}
                currency={currency}
                addToCart={addToCart}
                confirmCheckout={confirmCheckout}
                isOutOfStock={isOutOfStock}
                t={t}
            />

            <BookingDrawer
                open={bookingOpen} onOpenChange={setBookingOpen}
                service={bookingItemId ? session.items.find(i => i.id === bookingItemId) as LiveServiceItem : null}
                bookDate={bookDate} setBookDate={setBookDate}
                bookTime={bookTime} setBookTime={setBookTime}
                submitBooking={() => { setBookingOpen(false); showSnack("Booking submitted"); }}
            />

            <QuoteDrawer
                open={quoteOpen} onOpenChange={setQuoteOpen}
                service={quoteItemId ? session.items.find(i => i.id === quoteItemId) as LiveServiceItem : null}
                scope={quoteScope} setScope={setQuoteScope}
                address={quoteAddress} setAddress={setQuoteAddress}
                submitQuote={() => { setQuoteOpen(false); showSnack("Quote requested"); }}
            />

        </div>
    );
}
