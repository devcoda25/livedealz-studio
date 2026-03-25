/**
 * Mobile Live Chat - Professional TikTok-style floating chat overlay
 * 
 * Features:
 * - Floating messages that animate from bottom to top over the video
 * - Professional, native app appearance
 * - Auto-fading older messages
 * - Demo simulation for live mode
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// Types
interface ChatMessage {
    id: string;
    from: string;
    body: string;
    avatar?: string;
    isHighlight?: boolean;
    langTag?: string;
    timestamp: number;
}

// Helper to generate unique ID
const uid = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

// Sample data
const VIEWER_NAMES = [
    "ShopQueen", "DealHunter", "SavvyShopper", "LiveLover", "BargainBoss",
    "TrendTracker", "SmartBuyer", "FlashFinder", "DealDiva", "Shopaholic99",
    "PricePatrol", "BuyNow201", "SaleSeeker", "CartCrasher", "OfferHunter",
    "TrendyTom", "FashionFan", "StyleSeeker", "ChicChoice", "GlamGirl"
];

const CHAT_MESSAGES = [
    "Love this! 🔥",
    "What's the price??",
    "Can you show more colors?",
    "Adding to cart now! 🛒",
    "Best deal ever!",
    "Take my money! 💰",
    "Is shipping free?",
    "This is amazing 😍",
    "How long does it last?",
    "Worth every penny!",
    "Limited stock?",
    "What's the return policy?",
    "Do you have a discount code?",
    "Is it true to size?",
    "Ship to UK? 🇬🇧",
    "Need this in my life!",
    "Show the back please",
    "Can you do a demo?",
    "What's in the box?",
    "Quality looks great!"
];

interface MobileLiveChatProps {
    mode: "lobby" | "live";
    isEnabled?: boolean;
}

export function MobileLiveChat({ mode, isEnabled = true }: MobileLiveChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const messageIdCounter = useRef(0);

    // Generate a unique message
    const generateMessage = useCallback((): ChatMessage => {
        const viewer = VIEWER_NAMES[Math.floor(Math.random() * VIEWER_NAMES.length)];
        const body = CHAT_MESSAGES[Math.floor(Math.random() * CHAT_MESSAGES.length)];
        const isHighlight = Math.random() > 0.85; // 15% chance of highlighted
        const langs = ["en", "es", "fr", "de", "pt", "it"];
        const lang = Math.random() > 0.7 ? langs[Math.floor(Math.random() * langs.length)] : null;
        
        return {
            id: `msg_${messageIdCounter.current++}`,
            from: viewer,
            body,
            isHighlight,
            langTag: lang || undefined,
            timestamp: Date.now(),
        };
    }, []);

    // Initialize with some messages
    useEffect(() => {
        if (mode !== "live" || !isEnabled) {
            setMessages([]);
            return;
        }

        // Initial messages
        const initial: ChatMessage[] = [];
        for (let i = 0; i < 8; i++) {
            const msg = generateMessage();
            msg.timestamp = Date.now() - (7 - i) * 2000;
            initial.push(msg);
        }
        setMessages(initial);

        // Add new messages periodically
        const interval = setInterval(() => {
            const newMsg = generateMessage();
            setMessages(prev => {
                // Keep last 15 messages, add new one
                const updated = [...prev, newMsg];
                if (updated.length > 15) {
                    return updated.slice(-15);
                }
                return updated;
            });
        }, 1200); // New message every 1.2 seconds

        return () => clearInterval(interval);
    }, [mode, isEnabled, generateMessage]);

    // Don't render in lobby or if disabled
    if (mode !== "live" || !isEnabled) {
        return null;
    }

    return (
        <div 
            ref={containerRef}
            className="absolute bottom-20 left-2 right-16 h-[45%] max-h-[280px] overflow-hidden pointer-events-none z-10"
        >
            {/* Chat messages floating up */}
            <div className="flex flex-col justify-end h-full gap-1.5">
                {messages.map((msg, index) => (
                    <ChatBubble key={msg.id} message={msg} isNew={index >= messages.length - 3} />
                ))}
            </div>
            
            {/* Gradient fade at top */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        </div>
    );
}

// Individual chat bubble component
function ChatBubble({ message, isNew }: { message: ChatMessage; isNew: boolean }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    // Animate in
    useEffect(() => {
        if (isNew) {
            // Staggered animation for new messages
            const timer = setTimeout(() => setIsVisible(true), 50);
            return () => clearTimeout(timer);
        }
        setIsVisible(true);
    }, [isNew]);

    const isHighlight = message.isHighlight;
    
    return (
        <div 
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-2xl max-w-[85%] 
                transform transition-all duration-500 ease-out
                ${isNew && !isVisible 
                    ? "translate-y-8 opacity-0" 
                    : isExiting 
                        ? "-translate-x-full opacity-0" 
                        : "translate-y-0 opacity-100"
                }
                ${isHighlight 
                    ? "bg-gradient-to-r from-orange-500/90 to-pink-500/90 backdrop-blur-md" 
                    : "bg-black/50 backdrop-blur-md"
                }
            `}
            style={{
                animation: isNew ? "floatUp 0.5s ease-out forwards" : "none",
            }}
        >
            {/* Avatar */}
            <div className={`
                w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                text-xs font-bold
                ${isHighlight 
                    ? "bg-white/20 text-white" 
                    : "bg-slate-600 text-slate-200"
                }
            `}>
                {message.from.charAt(0).toUpperCase()}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`
                        text-[11px] font-semibold truncate
                        ${isHighlight ? "text-white" : "text-white/90"}
                    `}>
                        {message.from}
                    </span>
                    {message.langTag && message.langTag !== "en" && (
                        <span className={`
                            text-[9px] px-1 rounded
                            ${isHighlight ? "bg-white/20 text-white" : "bg-slate-700 text-slate-300"}
                        `}>
                            {message.langTag.toUpperCase()}
                        </span>
                    )}
                </div>
                <p className={`
                    text-xs leading-tight truncate
                    ${isHighlight ? "text-white" : "text-white/80"}
                `}>
                    {message.body}
                </p>
            </div>
            
            {/* Highlight emoji */}
            {isHighlight && (
                <span className="text-sm animate-bounce">🔥</span>
            )}
        </div>
    );
}

export default MobileLiveChat;

/* CSS animations are in the global styles */