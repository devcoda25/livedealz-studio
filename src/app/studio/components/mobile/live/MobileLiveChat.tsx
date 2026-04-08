/**
 * Mobile Live Chat
 * 
 * - TikTok variant: stacked bottom-left comments that flow upward and fade
 * - Instagram variant: simple stacked rows (no timed fade/float)
 */

import React, { useState, useEffect, useRef, memo } from "react";
import { Mode, ChatMsg } from "../../shared/types";

interface MobileLiveChatProps {
    messages?: ChatMsg[];
    mode: Mode;
    isEnabled?: boolean;
    maxVisible?: number;
    variant?: "tiktok" | "instagram";
}

interface AnimatedMessage extends ChatMsg {
    _animId: number;
    _enteredAt: number;
}

const EMPTY_MESSAGES: ChatMsg[] = [];

export const MobileLiveChat = memo(function MobileLiveChat({
    messages = EMPTY_MESSAGES,
    mode,
    isEnabled = true,
    maxVisible = 6,
    variant = "tiktok",
}: MobileLiveChatProps) {
    if (variant === "instagram") {
        if (mode !== "live" || !isEnabled) return null;
        const visible = (messages ?? EMPTY_MESSAGES).slice(-maxVisible);
        return (
            <div className="w-full max-w-[320px] pointer-events-none px-4 pb-2">
                <div className="flex flex-col gap-2">
                    {visible.map((msg) => (
                        <InstagramChatRow key={msg.id} message={msg} />
                    ))}
                </div>
            </div>
        );
    }

    const [visibleMessages, setVisibleMessages] = useState<AnimatedMessage[]>([]);
    const lastProcessedIdx = useRef(-1);
    const animCounter = useRef(0);

    // Process new messages
    useEffect(() => {
        if (mode !== "live" || !isEnabled) {
            setVisibleMessages(prev => prev.length === 0 ? prev : []);
            lastProcessedIdx.current = -1;
            return;
        }

        // Only process new messages (ones we haven't seen)
        if (!messages || messages.length === 0) return;

        const newMessages = messages.slice(lastProcessedIdx.current + 1);
        if (newMessages.length === 0) return;

        lastProcessedIdx.current = messages.length - 1;

        const animated: AnimatedMessage[] = newMessages.map(msg => ({
            ...msg,
            _animId: animCounter.current++,
            _enteredAt: Date.now(),
        }));

        setVisibleMessages(prev => {
            const combined = [...prev, ...animated];
            return combined.slice(-maxVisible);
        });
    }, [messages, mode, isEnabled, maxVisible]);

    // Auto-remove old messages after they've been visible for 5 seconds
    useEffect(() => {
        if (visibleMessages.length === 0) return;

        const interval = setInterval(() => {
            const now = Date.now();
            setVisibleMessages(prev =>
                prev.filter(msg => now - msg._enteredAt < 5000)
            );
        }, 500);

        return () => clearInterval(interval);
    }, [visibleMessages.length]);

    if (mode !== "live" || !isEnabled) return null;

    return (
        <div
            className="relative w-full max-w-[320px] pointer-events-none"
            style={{
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
            }}
        >
            <div className="flex flex-col gap-1.5 px-4 pb-3 pt-6">
                {visibleMessages.map((msg) => (
                    <TikTokChatRow
                        key={msg._animId}
                        message={msg}
                    />
                ))}
            </div>
        </div>
    );
});

const TikTokChatRow = memo(function TikTokChatRow({ message }: { message: AnimatedMessage }) {
    const isSystem = message.system;
    const hasLang = message.langTag && message.langTag !== "en" && message.langTag !== "System";
    const isNew = Date.now() - message._enteredAt < 500;

    // Premium avatar colors
    const nameHash = message.from.charCodeAt(0) % 6;
    const avatarGradients = [
        "from-pink-500 to-rose-600", 
        "from-violet-500 to-purple-600", 
        "from-blue-500 to-cyan-600",
        "from-emerald-500 to-teal-600", 
        "from-amber-400 to-orange-500", 
        "from-fuchsia-500 to-purple-600",
    ];

    if (isSystem) {
        return (
            <div
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-full max-w-fit
                    bg-white/10 backdrop-blur-xl border border-white/5
                    ${isNew ? "opacity-0" : "opacity-100"}
                `}
                style={{ animation: "tiktokChatLife 5s ease-out forwards" }}
            >
                <span className="material-icons text-[14px] text-[#f77f00]">info</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{message.body}</span>
            </div>
        );
    }

    return (
        <div
            className={`
                flex items-center gap-3 max-w-fit
                px-3 py-2 rounded-[18px]
                bg-black/45 backdrop-blur-xl border border-white/10 shadow-lg
                ${isNew ? "opacity-0" : "opacity-100"}
            `}
            style={{ animation: "tiktokChatLife 5s ease-out forwards" }}
        >
            {/* Avatar */}
            <div className={`
                w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                text-[11px] font-black text-white shadow-lg
                bg-gradient-to-br ${avatarGradients[nameHash]}
            `}>
                {message.from.charAt(0).toUpperCase()}
            </div>

            {/* Content */}
            <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-white uppercase tracking-tight truncate max-w-[100px]">
                        {message.from}
                    </span>
                    {hasLang && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-white/10 text-white/40 uppercase tracking-tighter">
                            {message.langTag}
                        </span>
                    )}
                </div>
                <span className="text-[12px] font-bold text-white/90 leading-tight">
                    {message.body}
                </span>
            </div>
        </div>
    );
});

// Inline keyframe animation
if (typeof document !== "undefined") {
    const styleId = "mobile-live-chat-styles";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            @keyframes tiktokChatLife {
                0% {
                    transform: translateY(14px) scale(0.98);
                    opacity: 0;
                }
                10% {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
                80% {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translateY(-8px) scale(1);
                    opacity: 0;
                }
            }

            @keyframes bubbleIn {
                0% {
                    transform: translateY(16px) scale(0.95);
                    opacity: 0;
                }
                100% {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

export default MobileLiveChat;

const InstagramChatRow = memo(function InstagramChatRow({ message }: { message: ChatMsg }) {
    const isSystem = message.system;
    const nameHash = message.from.charCodeAt(0) % 6;
    const avatarGradients = [
        "from-pink-500 to-rose-600",
        "from-violet-500 to-purple-600",
        "from-blue-500 to-cyan-600",
        "from-emerald-500 to-teal-600",
        "from-amber-400 to-orange-500",
        "from-fuchsia-500 to-purple-600",
    ];

    if (isSystem) {
        return (
            <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-white/10 border border-white/10 backdrop-blur-md flex items-center justify-center">
                    <span className="material-icons text-[#f77f00] text-[16px]">info</span>
                </div>
                <div className="px-3 py-2 rounded-2xl bg-black/45 border border-white/10 backdrop-blur-md">
                    <span className="text-[12px] font-bold text-white/85">{message.body}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <div
                className={`h-7 w-7 rounded-full bg-gradient-to-br ${avatarGradients[nameHash]} flex items-center justify-center text-[11px] font-black text-white shadow-lg`}
            >
                {message.from.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
                <span className="text-[12px] font-black text-white/90 drop-shadow-sm">{message.from}</span>
                <span className="text-[12px] font-semibold text-white/80 drop-shadow-sm"> {message.body}</span>
            </div>
        </div>
    );
});
