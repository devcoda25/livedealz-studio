"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatMsg, Product, FlashDealState, SaleEvent } from "../../shared/types";
import { EV_ORANGE } from "../../shared/constants";

interface MobileLivePageProps {
    hostName: string;
    storeHandle: string;
    followerCount?: number;
    rating?: number;
    viewerCount: number;
    liveTimerLabel: string;
    micOn: boolean;
    onToggleMic: () => void;
    onFlipCamera: () => void;
    stream: MediaStream | null;
    onOpenSettings: () => void;
    onOpenProducts: () => void;
    onShare: () => void;
    onWishlist: () => void;
    onFollow: () => void;
    onSendReaction: () => void;
    onOpenQA: () => void;
    onOpenComments: () => void;
    onSendMessage: (message: string) => void;
    productCount: number;
    messages: ChatMsg[];
    products: Product[];
    highlightedProductId: string | null;
    flash: FlashDealState;
    salesEvents: SaleEvent[];
    onSelectProduct: (id: string) => void;
    onBuyNow: (productId: string) => void;
    onAddToCart: (productId: string) => void;
    darkMode?: boolean;
}

export function MobileLivePage({
    hostName,
    storeHandle,
    followerCount = 12500,
    rating = 4.9,
    viewerCount,
    liveTimerLabel,
    micOn,
    onToggleMic,
    onFlipCamera,
    stream,
    onOpenSettings,
    onOpenProducts,
    onShare,
    onWishlist,
    onFollow,
    onSendReaction,
    onOpenQA,
    onOpenComments,
    onSendMessage,
    productCount,
    messages,
    products,
    highlightedProductId,
    flash,
    salesEvents,
    onSelectProduct,
    onBuyNow,
    onAddToCart,
    darkMode = true,
}: MobileLivePageProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [likeCount, setLikeCount] = useState(284700);
    const [pinnedIdx, setPinnedIdx] = useState(0);
    const [messageInput, setMessageInput] = useState("");
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    
    const pinnedCarouselRef = useRef<HTMLDivElement>(null);
    const chatScrollRef = useRef<HTMLDivElement>(null);
    const messageInputRef = useRef<HTMLInputElement>(null);

    const currentProduct = products.find(p => p.id === highlightedProductId) || products[0];
    const pinnedProducts = products.length > 1 ? [...products, products[0]] : products;

    // Auto-rotate pinned products
    useEffect(() => {
        if (products.length <= 1) return;
        const timer = setInterval(() => {
            setPinnedIdx((i) => (i + 1) % products.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [products.length]);

    // Format follower count
    const formatFollowers = (n: number) => {
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n.toString();
    };

    // Handle product carousel click
    const handleProductClick = (idx: number) => {
        const actualIdx = idx % products.length;
        const product = products[actualIdx];
        if (product) {
            onSelectProduct(product.id);
        }
        setPinnedIdx(idx);
    };

    // Handle sending message to chat
    const handleSendMessage = () => {
        const msg = messageInput.trim();
        if (msg) {
            onSendMessage(msg);
            setMessageInput("");
        }
    };

    // Add emoji to input
    const addEmojiToInput = (emoji: string) => {
        setMessageInput(prev => prev + emoji);
    };

    return (
        <div className="absolute inset-0 pointer-events-auto flex flex-col">
            {/* 1. TOP STATUS/HEADER BAR */}
            <LiveTopHeader
                hostName={hostName}
                storeHandle={storeHandle}
                followerCount={followerCount}
                rating={rating}
                viewerCount={viewerCount}
                liveTimerLabel={liveTimerLabel}
                onMenuToggle={() => setMenuOpen(!menuOpen)}
                darkMode={darkMode}
            />

            {/* 2. MAIN CONTENT STAGE - Video fills screen */}

            {/* 3. LEFT SIDE - Chat/Comments overlay */}
            <div 
                className="absolute left-3 w-[68%] max-w-[232px] pointer-events-none"
                style={{
                    top: 140,
                    bottom: 220,
                }}
            >
                <LiveChatOverlay
                    messages={messages}
                    chatScrollRef={chatScrollRef}
                    onUnreadClick={() => {
                        if (chatScrollRef.current) {
                            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
                        }
                    }}
                    darkMode={darkMode}
                />
            </div>

            {/* 4. RIGHT SIDE - Action Rail */}
            <LiveActionRail
                likeCount={likeCount}
                onLike={() => {
                    setLikeCount(prev => prev + 1);
                    onSendReaction();
                }}
                onComments={onOpenComments}
                onShare={onShare}
                onWishlist={onWishlist}
                onCart={onOpenProducts}
                onFollow={() => {
                    setIsFollowing(!isFollowing);
                    onFollow();
                }}
                isFollowing={isFollowing}
                cartCount={productCount}
                darkMode={darkMode}
            />

            {/* 5. BOTTOM COMMERCE PANEL */}
            <LiveCommercePanel
                products={pinnedProducts}
                highlightedIdx={pinnedIdx % products.length}
                flash={flash}
                onSelectProduct={handleProductClick}
                onBuyNow={onBuyNow}
                onAddToCart={onAddToCart}
                darkMode={darkMode}
            />

            {/* 6. Message Input Bar - positioned above product card */}
            <div 
                className="absolute left-3 right-3 pointer-events-auto"
                style={{ 
                    bottom: `calc(180px + env(safe-area-inset-bottom, 0px) + 12px)`,
                }}
            >
                <div 
                    className="rounded-full border-[1.5px] pr-1 shadow-[0_10px_25px_rgba(0,0,0,0.2)] pl-1.5 py-1"
                    style={{ background: "rgba(15,23,42,0.20)", borderColor: "rgba(255,255,255,0.42)" }}
                >
                    <div className="flex items-center gap-1.5">
                        {/* Emoji Button */}
                        <button
                            type="button"
                            onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                            className="shrink-0 rounded-full grid place-items-center transition-all h-8 w-8"
                            style={{
                                background: emojiPickerOpen ? "rgba(247,127,0,0.22)" : "rgba(255,255,255,0.12)",
                                border: emojiPickerOpen ? "1px solid rgba(247,127,0,0.45)" : "1px solid rgba(255,255,255,0.25)",
                                color: "#fff",
                            }}
                        >
                            <span className="text-[17px]">😊</span>
                        </button>
                        
                        {/* Message Input */}
                        <input
                            ref={messageInputRef}
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                            placeholder="Say something to viewers..."
                            className="flex-1 bg-transparent font-bold outline-none text-white placeholder-white/80 h-8 text-[14px]"
                            style={{ caretColor: "#fff" }}
                        />
                        
                        {/* Send Button */}
                        <button 
                            type="button" 
                            onClick={handleSendMessage}
                            className="shrink-0 rounded-full grid place-items-center transition-all bg-[rgba(247,127,0,0.95)] shadow-[0_4px_12px_rgba(247,127,0,0.3)] h-9 w-9 disabled:bg-white/10 disabled:shadow-none"
                            disabled={!messageInput.trim()}
                        >
                            <span className="material-icons text-white text-[18px]">send</span>
                        </button>
                    </div>
                </div>

                        {/* Emoji Picker */}
                        {emojiPickerOpen && (
                            <div 
                                className="mt-2 p-3 rounded-2xl border"
                                style={{ background: "rgba(0,0,0,0.52)", borderColor: "rgba(255,255,255,0.22)" }}
                            >
                                <div className="grid grid-cols-4 gap-2">
                                    {["❤️", "🔥", "😍", "😂", "👏", "💯", "😮", "🎉"].map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => {
                                                addEmojiToInput(emoji);
                                                setEmojiPickerOpen(false);
                                            }}
                                            className="h-10 w-10 rounded-xl grid place-items-center text-[20px]"
                                            style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.18)" }}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
            </div>

            {/* Menu Dropdown */}
            {menuOpen && (
                <LiveMenuDropdown
                    onClose={() => setMenuOpen(false)}
                    onOpenSettings={onOpenSettings}
                    darkMode={darkMode}
                />
            )}
        </div>
    );
}

/* ============== TOP HEADER ============== */
function LiveTopHeader({
    hostName,
    storeHandle,
    followerCount,
    rating,
    viewerCount,
    liveTimerLabel,
    onMenuToggle,
    darkMode,
}: {
    hostName: string;
    storeHandle: string;
    followerCount: number;
    rating: number;
    viewerCount: number;
    liveTimerLabel: string;
    onMenuToggle: () => void;
    darkMode: boolean;
}) {
    return (
        <div className="absolute top-0 left-0 right-0 z-30">
            {/* Gradient fade */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-transparent h-24 pointer-events-none" />
            
            <div className="relative flex items-center justify-between px-4 pt-[env(safe-area-inset-top,0px)] py-3">
                {/* Left: Creator/Store handle */}
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-white/10">
                        <img 
                            src="https://randomuser.me/api/portraits/women/44.jpg" 
                            alt={hostName} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white text-[13px] font-extrabold drop-shadow-md">{hostName}</span>
                        <span className="text-white/60 text-[10px] font-medium drop-shadow-md">@{storeHandle}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-amber-400 text-[9px]">★ {rating}</span>
                            <span className="text-white/40 text-[9px]">•</span>
                            <span className="text-white/60 text-[9px]">{followerCount >= 1000 ? `${(followerCount/1000).toFixed(1)}K` : followerCount} followers</span>
                        </div>
                    </div>
                </div>

                {/* Center: Live viewer badge */}
                <div className="absolute left-1/2 -translate-x-1/2 top-14">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/80 backdrop-blur-md rounded-full border border-rose-400/30">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span className="text-white text-[11px] font-bold">{viewerCount.toLocaleString()}</span>
                    </div>
                </div>

                {/* Right: Timer + Menu */}
                <div className="flex items-center gap-2">
                    <div className="text-white text-[12px] font-mono font-bold drop-shadow-md">
                        {liveTimerLabel}
                    </div>
                    <button 
                        onClick={onMenuToggle}
                        className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
                    >
                        <span className="material-icons text-white text-[18px]">more_vert</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ============== LEFT CHAT OVERLAY ============== */
function LiveChatOverlay({
    messages,
    chatScrollRef,
    onUnreadClick,
    darkMode,
}: {
    messages: ChatMsg[];
    chatScrollRef: React.MutableRefObject<HTMLDivElement | null>;
    onUnreadClick: () => void;
    darkMode: boolean;
}) {
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [unreadMsgs, setUnreadMsgs] = useState(0);
    const visibleMessages = messages.slice(-15);
    
    // Auto-scroll to bottom
    useEffect(() => {
        if (chatScrollRef.current && isAtBottom) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [messages, isAtBottom]);

    const formatCompact = (n: number) => {
        if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n/1000).toFixed(1)}K`;
        return String(n);
    };

    return (
        <div 
            ref={chatScrollRef}
            className="h-full overflow-y-auto"
            style={{
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
                maskImage: "linear-gradient(to top, black 62%, rgba(0,0,0,0.82) 74%, rgba(0,0,0,0.46) 88%, transparent 100%)",
            }}
            onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                const atBottom = scrollHeight - scrollTop - clientHeight < 40;
                if (atBottom) {
                    setIsAtBottom(true);
                    setUnreadMsgs(0);
                } else if (isAtBottom) {
                    setIsAtBottom(false);
                }
            }}
        >
            <div className="flex flex-col justify-end min-h-full pb-1 gap-1.5 pt-4">
                {visibleMessages.map((msg) => {
                    // Join message
                    if (msg.system || msg.body?.includes("joined")) {
                        return (
                            <div 
                                key={msg.id}
                                className="rounded-full font-extrabold inline-flex items-center self-start backdrop-blur-md px-2.5 py-1"
                                style={{
                                    background: "rgba(0,0,0,0.45)",
                                    border: "1px solid rgba(255,255,255,0.18)",
                                    color: "#fff",
                                    textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                                    fontSize: "10.5px",
                                }}
                            >
                                <span className="h-2 w-2 rounded-full mr-1.5" style={{ background: "#03cd8c" }} />
                                {msg.body || `${msg.from} joined`}
                            </div>
                        );
                    }
                    
                    // Regular chat message
                    return (
                        <div 
                            key={msg.id}
                            className="inline-flex items-center gap-2 self-start"
                        >
                            <div 
                                className="h-6 w-6 rounded-full overflow-hidden shrink-0"
                                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
                            >
                                <img 
                                    src="https://randomuser.me/api/portraits/women/65.jpg" 
                                    alt={msg.from}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div 
                                className="rounded-2xl px-2.5 py-1 backdrop-blur-md"
                                style={{
                                    background: "rgba(0,0,0,0.45)",
                                    border: "1px solid rgba(255,255,255,0.18)",
                                }}
                            >
                                <span 
                                    className="font-extrabold mr-1.5"
                                    style={{ color: msg.from === "Host" ? EV_ORANGE : "#fff", fontSize: "11px" }}
                                >
                                    {msg.from}
                                </span>
                                <span className="text-white font-semibold" style={{ fontSize: "13px" }}>
                                    {msg.body}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Unread pill */}
            {unreadMsgs > 0 && !isAtBottom && (
                <button
                    onClick={onUnreadClick}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold animate-bounce"
                >
                    ↓ {unreadMsgs} new
                </button>
            )}
        </div>
    );
}

/* ============== RIGHT ACTION RAIL ============== */
function LiveActionRail({
    likeCount,
    onLike,
    onComments,
    onShare,
    onWishlist,
    onCart,
    onFollow,
    isFollowing,
    cartCount,
    darkMode,
}: {
    likeCount: number;
    onLike: () => void;
    onComments: () => void;
    onShare: () => void;
    onWishlist: () => void;
    onCart: () => void;
    onFollow: () => void;
    isFollowing: boolean;
    cartCount: number;
    darkMode: boolean;
}) {
    const formatCompact = (n: number) => {
        if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n/1000).toFixed(1)}K`;
        return String(n);
    };

    return (
        <div className="absolute right-1 z-[92] flex flex-col items-center gap-4 pointer-events-auto" style={{ top: 150, bottom: 200 }}>
            {/* Follow Button */}
            <button
                onClick={onFollow}
                className="flex flex-col items-center gap-1"
            >
                <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2
                    transition-all
                    ${isFollowing 
                        ? "bg-white/10 border-white/40" 
                        : "bg-rose-600 border-rose-400"
                    }
                `}>
                    <span className="material-icons text-white text-[20px]">
                        {isFollowing ? "check" : "add"}
                    </span>
                </div>
                <span className="text-[9px] font-extrabold text-white drop-shadow-md">
                    {isFollowing ? "Following" : "Follow"}
                </span>
            </button>

            {/* Like/Heart */}
            <button
                onClick={onLike}
                className="flex flex-col items-center gap-1"
            >
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/18">
                    <span className="text-pink-500 text-[24px]">💗</span>
                </div>
                <span className="text-[9px] font-extrabold text-white drop-shadow-md">
                    {formatCompact(likeCount)}
                </span>
            </button>

            {/* Comments/Chat */}
            <button
                onClick={onComments}
                className="flex flex-col items-center gap-1"
            >
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/18">
                    <span className="material-icons text-white text-[22px]">chat_bubble</span>
                </div>
                <span className="text-[9px] font-extrabold text-white drop-shadow-md">Comment</span>
            </button>

            {/* Share */}
            <button
                onClick={onShare}
                className="flex flex-col items-center gap-1"
            >
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/18">
                    <span className="material-icons text-white text-[22px]">share</span>
                </div>
                <span className="text-[9px] font-extrabold text-white drop-shadow-md">Share</span>
            </button>

            {/* Bookmark/Wishlist */}
            <button
                onClick={onWishlist}
                className="flex flex-col items-center gap-1"
            >
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/18">
                    <span className="material-icons text-white text-[22px]">bookmark_border</span>
                </div>
                <span className="text-[9px] font-extrabold text-white drop-shadow-md">Save</span>
            </button>

            {/* Cart/Shop */}
            <button
                onClick={onCart}
                className="flex flex-col items-center gap-1"
            >
                <div className="relative w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/18">
                    <span className="material-icons text-white text-[22px]">shopping_bag</span>
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center border-2 border-black">
                            {cartCount > 9 ? "9+" : cartCount}
                        </span>
                    )}
                </div>
                <span className="text-[9px] font-extrabold text-white drop-shadow-md">Cart</span>
            </button>
        </div>
    );
}

/* ============== BOTTOM COMMERCE PANEL ============== */
function LiveCommercePanel({
    products,
    highlightedIdx,
    flash,
    onSelectProduct,
    onBuyNow,
    onAddToCart,
    darkMode,
}: {
    products: Product[];
    highlightedIdx: number;
    flash: FlashDealState;
    onSelectProduct: (idx: number) => void;
    onBuyNow: (productId: string) => void;
    onAddToCart: (productId: string) => void;
    darkMode: boolean;
}) {
    const currentProduct = products[highlightedIdx % products.length];
    if (!currentProduct) return null;

    const isFlashActive = flash.active && flash.productId === currentProduct.id;

    return (
        <div 
            className="absolute left-3 right-3 bottom-3 pointer-events-auto"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}
        >
            {/* Pinned Card - Buyer Style */}
            <div 
                className="rounded-[26px] border bg-white shadow-[0_18px_30px_rgba(0,0,0,0.18)] overflow-hidden"
                style={{ borderColor: "rgba(15,23,42,0.10)" }}
            >
                <div className="flex items-start p-3 gap-3">
                    {/* Product Thumbnail - Vertical for mobile */}
                    <div 
                        className="rounded-[18px] border overflow-hidden shrink-0 bg-white h-[68px] w-[68px]"
                        style={{ borderColor: "rgba(15,23,42,0.10)" }}
                    >
                        <img 
                            src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=200&h=200&fit=crop" 
                            alt={currentProduct.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Product Details */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                            <div className="min-w-0 flex-1">
                                <div 
                                    className="truncate font-extrabold leading-[1.1] text-[13px]"
                                    style={{ color: "#1f2937" }}
                                >
                                    {currentProduct.name}
                                </div>
                            </div>
                            {isFlashActive && (
                                <span 
                                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white"
                                    style={{ background: "rgba(43,163,106,0.95)", boxShadow: "0 6px 14px rgba(43,163,106,0.18)" }}
                                >
                                    {flash.discountPct}% OFF
                                </span>
                            )}
                        </div>

                        {/* Price */}
                        <div className="mt-1 flex items-center">
                            <span 
                                className="block font-black text-[14px]"
                                style={{ color: EV_ORANGE }}
                            >
                                ${currentProduct.basePrice.toFixed(2)}
                            </span>
                            {isFlashActive && (
                                <span className="ml-2 text-[11px] text-gray-400 line-through">
                                    ${(currentProduct.basePrice * 1.3).toFixed(2)}
                                </span>
                            )}
                        </div>

                        {/* Shipping Info */}
                        <div 
                            className="font-semibold mt-1 text-[11px]"
                            style={{ color: "#1f2937" }}
                        >
                            In Stock • Ready to show
                        </div>
                        <div 
                            className="grid gap-0.5 font-semibold mt-1 text-[9px]"
                            style={{ color: "rgba(107,114,128,0.92)" }}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className="inline-block h-1 w-1 rounded-full" style={{ background: "#0ea5e9" }} />
                                📦 18 items in stock
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="inline-block h-1 w-1 rounded-full" style={{ background: "#03cd8c" }} />
                                🚚 Free shipping available
                            </div>
                        </div>
                    </div>

                    {/* Product Thumbnails Carousel */}
                    <div className="shrink-0 flex flex-col gap-1.5 w-[110px]">
                        <div className="flex items-center justify-end -space-x-1.5 overflow-visible" style={{ maxWidth: "100%" }}>
                            {products.slice(0, products.length > 6 ? 6 : products.length).map((p, i) => (
                                <button
                                    key={p.id ?? i}
                                    onClick={() => onSelectProduct(i)}
                                    className={`
                                        h-6 w-6 shrink-0 rounded-full border-2 cursor-pointer transition-transform duration-300 overflow-hidden relative
                                        ${i === highlightedIdx ? "z-10 scale-110" : "z-0 opacity-60"}
                                    `}
                                    style={{ borderColor: "#fff", background: "rgba(255,255,255,0.70)", boxShadow: "0 2px 6px rgba(15,23,42,0.10)" }}
                                >
                                    <img 
                                        src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=100&h=100&fit=crop" 
                                        alt={p.name}
                                        className="h-full w-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>

                        {/* Pin/Show Button */}
                        <button
                            onClick={() => onBuyNow(currentProduct.id)}
                            className="rounded-full px-3 font-black inline-flex items-center justify-center gap-1.5 h-9 text-[12px]"
                            style={{ 
                                background: "linear-gradient(180deg,#ff9d1a 0%, #f77f00 100%)", 
                                border: "1px solid rgba(247,127,0,0.32)", 
                                color: "#fff", 
                                boxShadow: "0 10px 20px rgba(247,127,0,0.28)" 
                            }}
                        >
                            <span className="text-[14px]">📌</span> Pin Product
                        </button>

                        {/* Edit/Manage Button */}
                        <button
                            onClick={() => onAddToCart(currentProduct.id)}
                            className="rounded-full border px-3 font-black inline-flex items-center justify-center gap-1.5 h-9 text-[12px] active:scale-95 transition-transform"
                            style={{ 
                                background: "linear-gradient(180deg,#f7f7f8 0%, #ececec 100%)", 
                                borderColor: "rgba(15,23,42,0.12)", 
                                color: "#1f2937", 
                                boxShadow: "0 1px 2px rgba(15,23,42,0.04)" 
                            }}
                        >
                            ✏️ Edit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ============== MENU DROPDOWN ============== */
function LiveMenuDropdown({
    onClose,
    onOpenSettings,
    darkMode,
}: {
    onClose: () => void;
    onOpenSettings: () => void;
    darkMode: boolean;
}) {
    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className={`
                absolute top-24 right-4 z-50 w-56 py-2 rounded-3xl animate-in slide-in-from-top duration-200
                bg-[rgba(0,0,0,0.52)] backdrop-blur-2xl border
            `}
            style={{ borderColor: "rgba(255,255,255,0.22)" }}
            >
                <MenuItem icon="help_outline" label="Q&A" onClick={() => {}} />
                <MenuItem icon="card_giftcard" label="Giveaways" onClick={() => {}} />
                <MenuItem icon="poll" label="Polls" onClick={() => {}} />
                <MenuItem icon="people" label="Co-hosts" onClick={() => {}} />
                <MenuItem icon="videocam" label="Multi-cam" onClick={() => {}} />
                <div className="my-1 bg-white/10 h-[1px]" />
                <MenuItem icon="settings" label="Settings" onClick={onOpenSettings} />
                <MenuItem icon="flag" label="Report" onClick={() => {}} />
            </div>
        </>
    );
}

function MenuItem({
    icon,
    label,
    onClick,
}: {
    icon: string;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors text-white/80"
        >
            <span className="material-icons text-[18px]">{icon}</span>
            <span className="text-[13px] font-semibold">{label}</span>
        </button>
    );
}

export default MobileLivePage;