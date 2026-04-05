/**
 * Mobile Chat Overlay - TikTok-style live chat with animations
 * 
 * Features:
 * - Animated messages scrolling from top to bottom
 * - Q&A panel with viewer questions
 * - Audio request handling
 * - Simulated viewer messages for demo
 */

import React, { useState, useEffect, useRef, useCallback, memo } from "react";

// Types
interface ChatMessage {
    id: string;
    from: string;
    body: string;
    time: string;
    avatar?: string;
    isHighlight?: boolean;
    langTag?: string;
}

interface QaItem {
    id: string;
    question: string;
    from: string;
    status: "unanswered" | "pinned" | "answered";
    langTag: string;
    createdAt: number;
}

interface AudioRequest {
    id: string;
    viewerName: string;
    langTag: string;
    time: string;
    status: "pending" | "accepted" | "declined";
}

// Helper to generate random ID
const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper to format time
const nowTimeLabel = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
};

// Sample viewer names
const VIEWER_NAMES = [
    "ShopQueen", "DealHunter", "SavvyShopper", "LiveLover", "BargainBoss",
    "TrendTracker", "SmartBuyer", "FlashFinder", "DealDiva", "Shopaholic99",
    "PricePatrol", "BuyNow201", "SaleSeeker", "CartCrasher", "OfferHunter"
];

// Sample chat messages
const CHAT_TEMPLATES = [
    "Love this product! 🔥",
    "What's the price?",
    "Is this available in blue?",
    "Can you show the back?",
    "How long is shipping?",
    "Adding to cart now! 🛒",
    "Best deal I've seen!",
    "Is there a discount code?",
    "What's the return policy?",
    "Can you do a closer shot?",
    "This is amazing!",
    "Take my money! 💰",
    "What's the material?",
    "Does it come in other colors?",
    "Is it true to size?",
    "Worth every penny!",
    "Adding to wishlist ❤️",
    "What's the warranty?",
    "Can I pay on delivery?",
    "Limited stock?",
];

// Sample Q&A questions
const QA_TEMPLATES = [
    "Is this suitable for sensitive skin?",
    "How long does one bottle last?",
    "Do you have a discount code?",
    "Can you show the ingredients?",
    "Is there a fragrance?",
    "What age group is this for?",
    "Is it cruelty-free?",
    "Where is this made?",
    "What's the shelf life?",
    "Can I use this with other products?",
];

interface MobileChatOverlayProps {
    mode: "lobby" | "live";
    isOpen: boolean;
    onClose: () => void;
    darkMode?: boolean;
}

// Main component
export const MobileChatOverlay = memo(function MobileChatOverlay({ mode, isOpen, onClose, darkMode = true }: MobileChatOverlayProps) {
    const [activeTab, setActiveTab] = useState<"chat" | "qa" | "audio">("chat");
    
    // Chat state
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Q&A state
    const [qaItems, setQaItems] = useState<QaItem[]>([]);
    
    // Audio requests state
    const [audioRequests, setAudioRequests] = useState<AudioRequest[]>([]);
    
    // Animation state - track which messages should animate in
    const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());

    // Generate random message
    const generateMessage = useCallback((): ChatMessage => {
        const viewer = VIEWER_NAMES[Math.floor(Math.random() * VIEWER_NAMES.length)];
        const body = CHAT_TEMPLATES[Math.floor(Math.random() * CHAT_TEMPLATES.length)];
        const isHighlight = Math.random() > 0.7;
        const langs = ["en", "es", "fr", "de", "pt"];
        const langTag = langs[Math.floor(Math.random() * langs.length)];
        
        return {
            id: uid("msg"),
            from: viewer,
            body,
            time: nowTimeLabel(),
            isHighlight,
            langTag,
        };
    }, []);

    // Generate Q&A
    const generateQA = useCallback((): QaItem => {
        const viewer = VIEWER_NAMES[Math.floor(Math.random() * VIEWER_NAMES.length)];
        const question = QA_TEMPLATES[Math.floor(Math.random() * QA_TEMPLATES.length)];
        const langs = ["en", "es", "fr", "de", "pt"];
        
        return {
            id: uid("qa"),
            question,
            from: viewer,
            status: "unanswered",
            langTag: langs[Math.floor(Math.random() * langs.length)],
            createdAt: Date.now(),
        };
    }, []);

    // Generate audio request
    const generateAudioRequest = useCallback((): AudioRequest => {
        const viewer = VIEWER_NAMES[Math.floor(Math.random() * VIEWER_NAMES.length)];
        const langs = ["en", "es", "fr", "de", "pt"];
        
        return {
            id: uid("ar"),
            viewerName: viewer,
            langTag: langs[Math.floor(Math.random() * langs.length)],
            time: nowTimeLabel(),
            status: "pending",
        };
    }, []);

    // Chat message simulation - only when live
    useEffect(() => {
        if (mode !== "live" || !isOpen) return;

        // Add initial messages
        const initialCount = 5;
        const initial: ChatMessage[] = [];
        for (let i = 0; i < initialCount; i++) {
            const msg = generateMessage();
            initial.push(msg);
        }
        setMessages(initial);

        // Set up interval for new messages
        const chatInterval = setInterval(() => {
            const newMsg = generateMessage();
            setNewMessageIds(prev => new Set(prev).add(newMsg.id));
            setMessages(prev => [...prev.slice(-30), newMsg]); // Keep last 30 messages
        }, 1800); // New message every 1.8 seconds

        // Clear animation state after messages appear
        const clearAnimations = setInterval(() => {
            setNewMessageIds(new Set());
        }, 500);

        return () => {
            clearInterval(chatInterval);
            clearInterval(clearAnimations);
        };
    }, [mode, isOpen, generateMessage]);

    // Q&A simulation - only when live
    useEffect(() => {
        if (mode !== "live" || !isOpen) return;

        // Add initial Q&A
        const initialQA: QaItem[] = [
            {
                id: uid("qa"),
                question: "Is this available in other colors?",
                from: "ShopQueen",
                status: "unanswered",
                langTag: "en",
                createdAt: Date.now() - 60000,
            },
            {
                id: uid("qa"),
                question: "What's the shipping time to Europe?",
                from: "DealHunter",
                status: "pinned",
                langTag: "en",
                createdAt: Date.now() - 120000,
            },
        ];
        setQaItems(initialQA);

        // Occasional new Q&A
        const qaInterval = setInterval(() => {
            if (Math.random() > 0.6) {
                const newQA = generateQA();
                setQaItems(prev => [newQA, ...prev].slice(0, 15));
            }
            
            // Occasionally update Q&A status
            setQaItems(prev => {
                const copy = [...prev];
                const unanswered = copy.filter(q => q.status === "unanswered");
                const pinned = copy.filter(q => q.status === "pinned");
                
                if (unanswered.length > 0 && Math.random() > 0.7) {
                    const idx = Math.floor(Math.random() * unanswered.length);
                    const target = unanswered[idx];
                    const actualIdx = copy.findIndex(q => q.id === target.id);
                    if (actualIdx !== -1) {
                        copy[actualIdx] = { ...copy[actualIdx], status: "pinned" };
                    }
                }
                
                if (pinned.length > 0 && Math.random() > 0.8) {
                    const idx = Math.floor(Math.random() * pinned.length);
                    const target = pinned[idx];
                    const actualIdx = copy.findIndex(q => q.id === target.id);
                    if (actualIdx !== -1) {
                        copy[actualIdx] = { ...copy[actualIdx], status: "answered" };
                    }
                }
                
                return copy;
            });
        }, 4000);

        return () => clearInterval(qaInterval);
    }, [mode, isOpen, generateQA]);

    // Audio request simulation - only when live
    useEffect(() => {
        if (mode !== "live" || !isOpen) return;

        // Add initial audio request
        const initialAudio: AudioRequest[] = [
            {
                id: uid("ar"),
                viewerName: "LiveLover",
                langTag: "en",
                time: nowTimeLabel(),
                status: "pending",
            },
        ];
        setAudioRequests(initialAudio);

        // Occasional new audio requests
        const audioInterval = setInterval(() => {
            if (Math.random() > 0.7) {
                const newReq = generateAudioRequest();
                setAudioRequests(prev => [newReq, ...prev].slice(0, 10));
            }
        }, 8000);

        return () => clearInterval(audioInterval);
    }, [mode, isOpen, generateAudioRequest]);

    // Handlers
    const handleAcceptAudio = useCallback((id: string) => {
        setAudioRequests(prev => prev.map(r => 
            r.id === id ? { ...r, status: "accepted" } : r
        ));
    }, []);

    const handleDeclineAudio = useCallback((id: string) => {
        setAudioRequests(prev => prev.map(r => 
            r.id === id ? { ...r, status: "declined" } : r
        ));
    }, []);

    const handlePinQA = useCallback((id: string) => {
        setQaItems(prev => prev.map(q => 
            q.id === id ? { ...q, status: "pinned" } : q
        ));
    }, []);

    const handleAnswerQA = useCallback((id: string) => {
        setQaItems(prev => prev.map(q => 
            q.id === id ? { ...q, status: "answered" } : q
        ));
    }, []);

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${darkMode ? "bg-black/60" : "bg-slate-900/40"} backdrop-blur-sm animate-in fade-in`} onClick={onClose}>
            <div 
                className={`
                    absolute bottom-0 left-0 right-0 top-16 flex flex-col rounded-t-[32px] overflow-hidden
                    ${darkMode ? "bg-[#121212]/95 backdrop-blur-2xl border-t border-white/10" : "bg-white/95 backdrop-blur-2xl border-t border-slate-200"}
                    animate-in slide-in-from-bottom duration-500 ease-out
                `}
                onClick={e => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div className="w-full flex justify-center pt-4 pb-1 cursor-pointer group" onClick={onClose}>
                    <div className={`w-12 h-1.5 rounded-full transition-colors ${darkMode ? "bg-white/10 group-hover:bg-white/20" : "bg-slate-200 group-hover:bg-slate-300"}`} />
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center justify-between px-6 py-2 border-b border-white/5">
                    <div className="flex gap-2">
                        {[
                            { id: "chat", label: "Chat", count: 0 },
                            { id: "qa", label: "Q&A", count: qaItems.filter(q => q.status === "unanswered").length },
                            { id: "audio", label: "Audio", count: audioRequests.filter(a => a.status === "pending").length }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    relative px-5 py-2.5 rounded-full text-[12px] font-black uppercase tracking-widest transition-all
                                    ${activeTab === tab.id 
                                        ? "bg-[#f77f00] text-white shadow-lg shadow-[#f77f00]/20" 
                                        : `${darkMode ? "text-white/40 hover:text-white" : "text-slate-500 hover:text-slate-900"}`
                                    }
                                `}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white border-2 border-[#121212]">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={onClose}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${darkMode ? "bg-white/5 text-white/40 hover:bg-white/10" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}
                    >
                        <span className="material-icons text-[20px]">close</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative">
                    {/* Chat Tab */}
                    {activeTab === "chat" && (
                        <div className="h-full overflow-y-auto p-6 space-y-4 no-scrollbar">
                            {mode !== "live" ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-20">
                                    <span className="material-icons text-[64px] mb-4">chat_bubble_outline</span>
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em]">Chat Reserved for Live</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full opacity-20">
                                    <p className="animate-pulse text-[11px] font-black uppercase tracking-[0.2em]">Synchronizing Stream...</p>
                                </div>
                            ) : (
                                messages.map((msg, index) => (
                                    <ChatMessageItem 
                                        key={msg.id} 
                                        message={msg}
                                        isNew={newMessageIds.has(msg.id)}
                                        isLast={index === messages.length - 1}
                                        darkMode={darkMode}
                                    />
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}

                    {/* Q&A Tab */}
                    {activeTab === "qa" && (
                        <div className="h-full overflow-y-auto p-6 space-y-4 no-scrollbar">
                            {qaItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-20">
                                    <span className="material-icons text-[64px] mb-4">question_answer</span>
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em]">No Questions Registered</p>
                                </div>
                            ) : (
                                qaItems.map(item => (
                                    <QAItemItem 
                                        key={item.id} 
                                        item={item}
                                        onPin={() => handlePinQA(item.id)}
                                        onAnswer={() => handleAnswerQA(item.id)}
                                        darkMode={darkMode}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {/* Audio Requests Tab */}
                    {activeTab === "audio" && (
                        <div className="h-full overflow-y-auto p-6 space-y-4 no-scrollbar">
                            {audioRequests.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-20">
                                    <span className="material-icons text-[64px] mb-4">mic</span>
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em]">Audio Buffer Empty</p>
                                </div>
                            ) : (
                                audioRequests.map(req => (
                                    <AudioRequestItemItem 
                                        key={req.id} 
                                        request={req}
                                        onAccept={() => handleAcceptAudio(req.id)}
                                        onDecline={() => handleDeclineAudio(req.id)}
                                        darkMode={darkMode}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
                
                {/* Safe Area Spacer */}
                <div className="h-safe" />
            </div>
        </div>
    );
});

// Chat message component with animation
function ChatMessageItem({ message, isNew, isLast, darkMode }: { message: ChatMessage; isNew: boolean; isLast: boolean; darkMode: boolean }) {
    const isHighlight = message.isHighlight;
    
    return (
        <div 
            className={`
                flex items-start gap-4 p-4 rounded-[24px] transition-all duration-500 ease-out border
                ${isHighlight 
                    ? "bg-[#f77f00]/10 border-[#f77f00]/30 shadow-lg shadow-[#f77f00]/5" 
                    : `${darkMode ? "bg-white/5 border-transparent" : "bg-slate-50 border-transparent"}`
                } 
                ${isNew && isLast ? "animate-in slide-in-from-top-4 duration-300" : ""}
            `}
        >
            {/* Avatar */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-black flex-shrink-0 shadow-sm ${
                isHighlight 
                    ? "bg-[#f77f00] text-white"
                    : `${darkMode ? "bg-white/10 text-white/60" : "bg-white text-slate-400"}`
            }`}>
                {message.from.charAt(0).toUpperCase()}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                    <span className={`text-[13px] font-black uppercase tracking-tight ${isHighlight ? "text-[#f77f00]" : `${darkMode ? "text-white" : "text-slate-900"}`}`}>
                        {message.from}
                    </span>
                    {message.langTag && message.langTag !== "en" && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded bg-black/20 text-white/40 uppercase tracking-tighter`}>
                            {message.langTag.toUpperCase()}
                        </span>
                    )}
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? "text-white/20" : "text-slate-400"} ml-auto`}>{message.time}</span>
                </div>
                <p className={`text-[14px] mt-1 break-words ${darkMode ? "text-white/80" : "text-slate-600"} leading-snug`}>{message.body}</p>
            </div>
        </div>
    );
}

// Q&A item component
function QAItemItem({ item, onPin, onAnswer, darkMode }: { item: QaItem; onPin: () => void; onAnswer: () => void; darkMode: boolean }) {
    const isPinned = item.status === "pinned";
    const isAnswered = item.status === "answered";
    
    return (
        <div className={`
            p-5 rounded-[28px] border transition-all duration-300
            ${isPinned ? "bg-[#f77f00]/10 border-[#f77f00]/30 shadow-lg shadow-[#f77f00]/5" : ""}
            ${isAnswered ? "bg-emerald-500/10 border-emerald-500/20 opacity-60" : ""}
            ${!isPinned && !isAnswered ? `${darkMode ? "bg-white/5 border-transparent" : "bg-slate-50 border-transparent"}` : ""}
        `}>
            <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
                    isPinned ? "bg-[#f77f00] text-white" : 
                    isAnswered ? "bg-emerald-500 text-white" : 
                    `${darkMode ? "bg-white/10 text-white/40" : "bg-white text-slate-400"}`
                }`}>
                    <span className="material-icons text-[20px]">
                        {isPinned ? "push_pin" : isAnswered ? "check_circle" : "help_outline"}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-[13px] font-black uppercase tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{item.from}</span>
                        <span className={`text-[10px] font-black uppercase tracking-tighter ${darkMode ? "text-white/20" : "text-slate-400"}`}>{item.langTag.toUpperCase()}</span>
                    </div>
                    <p className={`text-[14px] font-bold leading-snug ${darkMode ? "text-white/90" : "text-slate-700"}`}>{item.question}</p>
                </div>
            </div>
            
            {/* Actions */}
            {!isAnswered && (
                <div className="flex gap-2 mt-5">
                    {!isPinned && (
                        <button 
                            onClick={onPin}
                            className={`flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${darkMode ? "bg-white/5 text-white/60" : "bg-white text-slate-500 border border-slate-100 shadow-sm"}`}
                        >
                            <span className="material-icons text-[16px]">push_pin</span>
                            Pin to Stream
                        </button>
                    )}
                    <button 
                        onClick={onAnswer}
                        className="flex-2 py-3 px-6 rounded-2xl bg-[#f77f00] text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-[#f77f00]/20"
                    >
                        <span className="material-icons text-[16px]">chat</span>
                        {isPinned ? "Answer Live" : "Answer Now"}
                    </button>
                </div>
            )}
        </div>
    );
}

// Audio request component
function AudioRequestItemItem({ request, onAccept, onDecline, darkMode }: { 
    request: AudioRequest; 
    onAccept: () => void; 
    onDecline: () => void;
    darkMode: boolean;
}) {
    const isPending = request.status === "pending";
    const isAccepted = request.status === "accepted";
    
    return (
        <div className={`
            p-5 rounded-[28px] border transition-all duration-300
            ${isAccepted ? "bg-emerald-500/10 border-emerald-500/20" : `${darkMode ? "bg-white/5 border-transparent" : "bg-slate-50 border-transparent"}`}
        `}>
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    isAccepted ? "bg-emerald-500 text-white shadow-emerald-500/20 shadow-lg" : 
                    isPending ? "bg-[#f77f00]/20 text-[#f77f00] animate-pulse" :
                    `${darkMode ? "bg-white/5 text-white/20" : "bg-white text-slate-300 shadow-sm"}`
                }`}>
                    <span className="material-icons text-[24px]">
                        {isAccepted ? "mic" : "mic_none"}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <span className={`text-[14px] font-black uppercase tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{request.viewerName}</span>
                        <span className={`text-[10px] font-black uppercase tracking-tighter ${darkMode ? "text-white/20" : "text-slate-400"}`}>{request.time}</span>
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${isAccepted ? "text-emerald-500" : isPending ? "text-[#f77f00]" : "text-slate-500"}`}>
                        {request.status === "pending" ? "Requesting Audio Access" : 
                         request.status === "accepted" ? "Connected to Host" : "Connection Terminated"}
                    </span>
                </div>
            </div>
            
            {isPending && (
                <div className="flex gap-3 mt-5">
                    <button 
                        onClick={onDecline}
                        className={`flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${darkMode ? "bg-white/5 text-white/40" : "bg-white text-slate-400 border border-slate-100 shadow-sm"}`}
                    >
                        Decline
                    </button>
                    <button 
                        onClick={onAccept}
                        className="flex-2 py-3 px-6 rounded-2xl bg-[#f77f00] text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-[#f77f00]/20"
                    >
                        <span className="material-icons text-[18px]">mic</span>
                        Allow Voice
                    </button>
                </div>
            )}
        </div>
    );
}

export default MobileChatOverlay;