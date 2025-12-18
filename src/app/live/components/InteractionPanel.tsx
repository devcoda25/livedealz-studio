"use client";

import React, { useState, useEffect } from "react";
import { Send, Smile, Paperclip, Heart, ThumbsUp, Flame, MoreVertical, Store, User, UserPlus, UserMinus, Flag, EyeOff, Eye, ShoppingCart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { LiveSession, LiveProductItem, LiveServiceItem, ChatMessage, Poll, CurrencyDef, ViewerAuth, BuyerMode } from "../data";
import { ProductCard, ServiceCard } from "./Cards";

interface InteractionPanelProps {
    session: LiveSession;
    auth: ViewerAuth;
    buyerMode: BuyerMode;
    currency: CurrencyDef;
    panelTab: string;
    setPanelTab: (t: string) => void;
    itemFilter: string;
    setItemFilter: (f: string) => void;
    hideChat: boolean;
    messages: ChatMessage[];
    chatInput: string;
    setChatInput: (s: string) => void;
    sendChat: () => void;
    sendAttachment: (f: File) => void;
    reactEmoji: (e: string) => void;
    poll: Poll;
    vote: (oid: string) => void;
    votedOption: string | null;
    // Item actions passed down
    onIdentify: (id: string) => void;
    onPin: (id: string) => void;
    addToCart: (p: LiveProductItem) => void;
    openMiniCheckout: (p: LiveProductItem) => void;
    openBooking: (id: string) => void;
    openQuote: (id: string) => void;
    openConsultation: (id: string) => void;
    getStockLeft: (p: LiveProductItem) => number | null;
    isOutOfStock: (p: LiveProductItem) => boolean;
    isReminding: (p: LiveProductItem) => boolean;
    wholesaleApproved: boolean;
    packType: string;
    qty: number;
    captionsOn: boolean;
    t: (k: string) => string;
    tr: (s: string) => string;
    isDesktop: boolean;
    videoHeight: number;
    hideTabs?: boolean;
}

export function InteractionPanel({
    session,
    auth,
    buyerMode,
    currency,
    panelTab,
    setPanelTab,
    itemFilter,
    setItemFilter,
    hideChat,
    messages,
    chatInput,
    setChatInput,
    sendChat,
    sendAttachment,
    reactEmoji,
    poll,
    vote,
    votedOption,
    // Actions
    onIdentify,
    onPin,
    addToCart,
    openMiniCheckout,
    openBooking,
    openQuote,
    openConsultation,
    getStockLeft,
    isOutOfStock,
    isReminding,
    wholesaleApproved,
    packType,
    qty,
    captionsOn,
    t,
    tr,
    isDesktop,
    videoHeight,
    hideTabs = false,
}: InteractionPanelProps) {

    // Derived lists
    const filteredItems = session.items.filter((x) => {
        if (itemFilter === "products") return x.kind === "product";
        if (itemFilter === "services") return x.kind === "service";
        if (itemFilter === "retail") return x.kind === "service" || (x as LiveProductItem).type !== "wholesale";
        if (itemFilter === "wholesale") return x.kind === "service" ? (x as LiveServiceItem).b2bAvailable : (x as LiveProductItem).type !== "retail";
        return true;
    });

    const products = filteredItems.filter(x => x.kind === 'product') as LiveProductItem[];
    const services = filteredItems.filter(x => x.kind === 'service') as LiveServiceItem[];

    return (
        <Card className={`rounded-xl shadow-sm border-border h-full flex flex-col overflow-hidden bg-card text-card-foreground ${hideTabs ? 'border-0 shadow-none' : ''}`}>
            <Tabs value={panelTab} onValueChange={setPanelTab} className="h-full flex flex-col">
                {!hideTabs && (
                    <>
                        <div className="px-4 pt-2">
                            <TabsList className="grid w-full grid-cols-3 bg-muted border border-border">
                                <TabsTrigger value="products" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground">{t("products")}</TabsTrigger>
                                <TabsTrigger value="chat" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground">
                                    {hideChat ? "Chat (Hidden)" : t("chat")}
                                </TabsTrigger>
                                <TabsTrigger value="info" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground">{t("hostInfo")}</TabsTrigger>
                            </TabsList>
                        </div>
                        <Separator className="my-2 bg-border" />
                    </>
                )}

                <div className="flex-1 overflow-hidden relative">
                    <TabsContent value="products" className="h-full m-0 p-0 absolute inset-0">
                        <ScrollArea className="h-full px-4 pb-4">
                            <div className="flex flex-wrap justify-center gap-2 mb-4 sticky top-0 bg-card/95 backdrop-blur z-10 py-2">
                                {['all', 'products', 'services', 'retail', 'wholesale'].map(f => (
                                    <Badge
                                        key={f}
                                        variant={itemFilter === f ? 'default' : 'outline'}
                                        className={`cursor-pointer ${itemFilter === f ? 'bg-[#f77f00] hover:bg-[#d06b00] text-white border-0' : 'text-muted-foreground hover:text-foreground'}`}
                                        onClick={() => setItemFilter(f)}
                                    >
                                        {t(f) || f}
                                    </Badge>
                                ))}
                            </div>

                            {services.length > 0 && (
                                <div className="mb-6 space-y-3">
                                    <h3 className="font-black text-sm text-muted-foreground">{t("services")} ({services.length})</h3>
                                    {services.map(s => (
                                        <ServiceCard
                                            key={s.id}
                                            s={s}
                                            auth={auth}
                                            buyerMode={buyerMode}
                                            currency={currency}
                                            wholesaleApproved={wholesaleApproved}
                                            t={t} tr={tr}
                                            onIdentify={onIdentify}
                                            onPin={onPin}
                                            openBooking={openBooking}
                                            openQuote={openQuote}
                                            openConsultation={openConsultation}
                                        />
                                    ))}
                                </div>
                            )}

                            {products.length > 0 && (
                                <div className="space-y-3 pb-20">
                                    <h3 className="font-black text-sm text-muted-foreground">{t("products")} ({products.length})</h3>
                                    {products.map(p => (
                                        <ProductCard
                                            key={p.id}
                                            p={p}
                                            sessionState={session.state}
                                            auth={auth}
                                            buyerMode={buyerMode}
                                            currency={currency}
                                            wholesaleApproved={wholesaleApproved}
                                            qty={qty}
                                            packType={packType}
                                            captionsOn={captionsOn}
                                            t={t} tr={tr}
                                            onIdentify={onIdentify}
                                            onPin={onPin}
                                            addToCart={addToCart}
                                            openMiniCheckout={openMiniCheckout}
                                            getStockLeft={getStockLeft}
                                            isOutOfStock={isOutOfStock}
                                            isReminding={isReminding}
                                        />
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="chat" className="h-full m-0 p-0 absolute inset-0 flex flex-col">
                        {hideChat ? (
                            <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground">
                                <p>{t("hideChat")}</p>
                            </div>
                        ) : (
                            <>
                                <ScrollArea className="flex-1 px-4">
                                    {/* Poll */}
                                    <Card className="mb-4 bg-orange-500/10 border-orange-500/20">
                                        <CardContent className="p-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-black text-sm text-orange-600 dark:text-orange-200">{t("poll")}</span>
                                                <span className="text-xs text-orange-600/70 dark:text-orange-300/70">{poll.question}</span>
                                            </div>
                                            <div className="space-y-2">
                                                {poll.options.map(opt => {
                                                    const total = poll.options.reduce((a, b) => a + b.votes, 0) || 1;
                                                    const pct = Math.round((opt.votes / total) * 100);
                                                    return (
                                                        <div key={opt.id} onClick={() => vote(opt.id)} className={`cursor-pointer group relative overflow-hidden rounded-md border text-xs h-8 flex items-center px-3 ${votedOption === opt.id ? 'border-orange-500/50 bg-orange-500/20 text-orange-600 dark:text-orange-100' : 'border-border bg-card hover:bg-muted text-card-foreground'}`}>
                                                            <div className="absolute left-0 top-0 bottom-0 bg-orange-500/10 transition-all duration-500" style={{ width: `${pct}%` }} />
                                                            <span className="relative z-10 flex-1 font-medium">{opt.label}</span>
                                                            <span className="relative z-10 text-muted-foreground">{pct}%</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Messages */}
                                    <div className="space-y-4 pb-4">
                                        {messages.map(m => (
                                            <div key={m.id} className="flex gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">{m.author[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className={`text-xs font-bold ${m.role === 'host' ? 'text-[#f77f00]' : 'text-foreground'}`}>{m.author}</span>
                                                        <span className="text-[10px] text-muted-foreground">{m.ts}</span>
                                                    </div>
                                                    <p className="text-sm text-foreground leading-snug">{m.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>

                                {/* Chat Input */}
                                <div className="p-3 border-t border-border bg-card">
                                    <div className="flex gap-2 pb-2">
                                        {['❤️', '🔥', '👏', '😂'].map(e => (
                                            <button key={e} onClick={() => reactEmoji(e)} className="text-lg hover:scale-110 transition-transform">{e}</button>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10">
                                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                        <Input
                                            placeholder={auth === 'guest' ? "Sign in to chat..." : "Say something..."}
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && sendChat()}
                                            disabled={auth === 'guest'}
                                            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                                        />
                                        <Button onClick={sendChat} disabled={auth === 'guest'} size="icon" className="shrink-0 h-10 w-10 bg-[#f77f00] hover:bg-[#d06b00]">
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="info" className="h-full m-0 p-0 absolute inset-0">
                        <ScrollArea className="h-full px-4 pb-4">
                            <div className="space-y-4">
                                <div className="bg-card rounded-xl p-4 border border-border">
                                    <h3 className="font-black text-lg text-card-foreground">{session.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{session.description}</p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <Badge variant="secondary">{session.category}</Badge>
                                        <Badge variant="secondary">{session.language}</Badge>
                                    </div>
                                </div>

                                {/* Host Info */}
                                <div className="flex items-center gap-3 p-3 border border-border rounded-xl bg-muted/50">
                                    <div className="h-10 w-10 rounded-full bg-[#7C3AED]/20 flex items-center justify-center">
                                        <Store className="h-5 w-5 text-[#7C3AED]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-sm text-foreground">{session.hosts.hostInfo.seller.name}</p>
                                        <p className="text-xs text-muted-foreground">{session.hosts.hostInfo.seller.sellerType} · ★ {session.hosts.hostInfo.seller.rating}</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 text-xs rounded-full">Follow</Button>
                                </div>
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </div>
            </Tabs>
        </Card>
    );
}
