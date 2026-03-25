/**
 * Mobile Chat Overlay - TikTok-style live chat with animations
 * 
 * Features:
 * - Animated messages scrolling from top to bottom
 * - Q&A panel with viewer questions
 * - Audio request handling
 * - Simulated viewer messages for demo
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

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
}

// Main component
export function MobileChatOverlay({ mode, isOpen, onClose }: MobileChatOverlayProps) {
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
        <div className="fixed inset-0 z-40 bg-black/80" onClick={onClose}>
            <div 
                className="absolute bottom-20 left-0 right-0 top-0 flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur">
                    <div className="flex gap-1">
                        <button
                            onClick={() => setActiveTab("chat")}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                activeTab === "chat" 
                                    ? "bg-primary text-white" 
                                    : "text-slate-400 hover:text-white"
                            }`}
                        >
                            Chat
                        </button>
                        <button
                            onClick={() => setActiveTab("qa")}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                activeTab === "qa" 
                                    ? "bg-primary text-white" 
                                    : "text-slate-400 hover:text-white"
                            }`}
                        >
                            Q&A {qaItems.filter(q => q.status === "unanswered").length > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-red-500 rounded-full text-xs">
                                    {qaItems.filter(q => q.status === "unanswered").length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("audio")}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                activeTab === "audio" 
                                    ? "bg-primary text-white" 
                                    : "text-slate-400 hover:text-white"
                            }`}
                        >
                            Audio {audioRequests.filter(a => a.status === "pending").length > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-red-500 rounded-full text-xs">
                                    {audioRequests.filter(a => a.status === "pending").length}
                                </span>
                            )}
                        </button>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-800"
                    >
                        <span className="material-icons text-white">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {/* Chat Tab */}
                    {activeTab === "chat" && (
                        <div className="h-full overflow-y-auto p-4 space-y-3">
                            {mode !== "live" ? (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    <div className="text-center">
                                        <span className="material-icons text-4xl mb-2">chat_bubble_outline</span>
                                        <p>Chat will appear when you go live</p>
                                    </div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    <p>Waiting for messages...</p>
                                </div>
                            ) : (
                                messages.map((msg, index) => (
                                    <ChatMessageItem 
                                        key={msg.id} 
                                        message={msg}
                                        isNew={newMessageIds.has(msg.id)}
                                        isLast={index === messages.length - 1}
                                    />
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}

                    {/* Q&A Tab */}
                    {activeTab === "qa" && (
                        <div className="h-full overflow-y-auto p-4 space-y-3">
                            {qaItems.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    <div className="text-center">
                                        <span className="material-icons text-4xl mb-2">question_answer</span>
                                        <p>No questions yet</p>
                                    </div>
                                </div>
                            ) : (
                                qaItems.map(item => (
                                    <QAItem 
                                        key={item.id} 
                                        item={item}
                                        onPin={() => handlePinQA(item.id)}
                                        onAnswer={() => handleAnswerQA(item.id)}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {/* Audio Requests Tab */}
                    {activeTab === "audio" && (
                        <div className="h-full overflow-y-auto p-4 space-y-3">
                            {audioRequests.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    <div className="text-center">
                                        <span className="material-icons text-4xl mb-2">mic</span>
                                        <p>No audio requests</p>
                                    </div>
                                </div>
                            ) : (
                                audioRequests.map(req => (
                                    <AudioRequestItem 
                                        key={req.id} 
                                        request={req}
                                        onAccept={() => handleAcceptAudio(req.id)}
                                        onDecline={() => handleDeclineAudio(req.id)}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Chat message component with animation
function ChatMessageItem({ message, isNew, isLast }: { message: ChatMessage; isNew: boolean; isLast: boolean }) {
    const isHighlight = message.isHighlight;
    
    return (
        <div 
            className={`flex items-start gap-2 p-2 rounded-xl transition-all duration-300 ${
                isHighlight 
                    ? "bg-orange-500/20 border border-orange-500/30" 
                    : "bg-black/40"
            } ${isNew && isLast ? "animate-slide-in-from-top" : ""}`}
        >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isHighlight 
                    ? "bg-gradient-to-br from-orange-400 to-red-500 text-white"
                    : "bg-slate-700 text-slate-300"
            }`}>
                {message.from.charAt(0).toUpperCase()}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${isHighlight ? "text-orange-400" : "text-white"}`}>
                        {message.from}
                    </span>
                    {message.langTag && message.langTag !== "en" && (
                        <span className="text-[10px] px-1 py-0.5 bg-slate-700 rounded text-slate-400">
                            {message.langTag.toUpperCase()}
                        </span>
                    )}
                    <span className="text-[10px] text-slate-500">{message.time}</span>
                </div>
                <p className="text-sm text-slate-200 break-words">{message.body}</p>
            </div>
        </div>
    );
}

// Q&A item component
function QAItem({ item, onPin, onAnswer }: { item: QaItem; onPin: () => void; onAnswer: () => void }) {
    const statusColors = {
        unanswered: "bg-slate-700",
        pinned: "bg-orange-500/20 border border-orange-500/30",
        answered: "bg-emerald-500/20 border border-emerald-500/30",
    };
    
    const statusIcons = {
        unanswered: "help_outline",
        pinned: "push_pin",
        answered: "check_circle",
    };
    
    return (
        <div className={`p-3 rounded-xl ${statusColors[item.status]}`}>
            <div className="flex items-start gap-2">
                <span className="material-icons text-slate-400 text-lg">{statusIcons[item.status]}</span>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-white">{item.from}</span>
                        <span className="text-[10px] text-slate-500">{item.langTag.toUpperCase()}</span>
                    </div>
                    <p className="text-sm text-slate-200">{item.question}</p>
                </div>
            </div>
            
            {/* Actions */}
            {item.status !== "answered" && (
                <div className="flex gap-2 mt-3">
                    {item.status === "unanswered" && (
                        <button 
                            onClick={onPin}
                            className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-white font-medium"
                        >
                            <span className="material-icons text-sm mr-1">push_pin</span>
                            Pin
                        </button>
                    )}
                    <button 
                        onClick={onAnswer}
                        className="flex-1 py-2 rounded-lg bg-primary hover:bg-primary/80 text-xs text-white font-medium"
                    >
                        <span className="material-icons text-sm mr-1">check</span>
                        Answer
                    </button>
                </div>
            )}
        </div>
    );
}

// Audio request component
function AudioRequestItem({ request, onAccept, onDecline }: { 
    request: AudioRequest; 
    onAccept: () => void; 
    onDecline: () => void;
}) {
    if (request.status !== "pending") {
        return (
            <div className={`p-3 rounded-xl ${
                request.status === "accepted" 
                    ? "bg-emerald-500/20 border border-emerald-500/30"
                    : "bg-slate-800"
            }`}>
                <div className="flex items-center gap-2">
                    <span className="material-icons text-emerald-400">
                        {request.status === "accepted" ? "check_circle" : "cancel"}
                    </span>
                    <div>
                        <span className="text-sm text-white font-medium">{request.viewerName}</span>
                        <span className="text-xs text-slate-400 ml-2">
                            {request.status === "accepted" ? "Connected" : "Declined"}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
                <span className="material-icons text-orange-400 animate-pulse">mic</span>
                <div>
                    <span className="text-sm text-white font-medium">{request.viewerName}</span>
                    <span className="text-xs text-slate-400 ml-2">wants to speak</span>
                </div>
                <span className="text-[10px] text-slate-500 ml-auto">{request.time}</span>
            </div>
            
            <div className="flex gap-2">
                <button 
                    onClick={onAccept}
                    className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs text-white font-medium flex items-center justify-center gap-1"
                >
                    <span className="material-icons text-sm">call</span>
                    Accept
                </button>
                <button 
                    onClick={onDecline}
                    className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-white font-medium flex items-center justify-center gap-1"
                >
                    <span className="material-icons text-sm">call_end</span>
                    Decline
                </button>
            </div>
        </div>
    );
}

export default MobileChatOverlay;