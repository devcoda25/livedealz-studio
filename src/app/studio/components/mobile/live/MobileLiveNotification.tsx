/**
 * MobileLiveNotification - High-conversion social proof popups
 * 
 * Shows short-lived notifications like:
 * - "User X added to cart"
 * - "User Y purchased [Product]"
 * - "New follower!"
 */

import React, { useState, useEffect, memo } from "react";

export interface LiveNotificationEvent {
    id: string;
    type: "cart" | "purchase" | "follow";
    userNode: React.ReactNode;
    message: string;
    duration?: number;
}

interface MobileLiveNotificationProps {
    event: LiveNotificationEvent | null;
    onComplete: () => void;
    darkMode?: boolean;
}

export const MobileLiveNotification = memo(function MobileLiveNotification({
    event,
    onComplete,
    darkMode = true,
}: MobileLiveNotificationProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (event) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onComplete, 500); // Wait for exit animation
            }, event.duration || 4000);
            return () => clearTimeout(timer);
        }
    }, [event, onComplete]);

    if (!event) return null;

    const iconMap = {
        cart: { icon: "shopping_cart", color: "bg-[#f77f00]", textColor: "text-white" },
        purchase: { icon: "payments", color: "bg-emerald-500", textColor: "text-white" },
        follow: { icon: "person_add", color: "bg-blue-500", textColor: "text-white" },
    };

    const { icon, color, textColor } = iconMap[event.type];

    return (
        <div className={`
            fixed left-4 bottom-52 z-[60] pointer-events-none transition-all duration-700 cubic-bezier(0.23, 1, 0.32, 1)
            ${isVisible ? "opacity-100 translate-x-0 scale-100" : "opacity-0 -translate-x-12 scale-90"}
        `}>
            <div className={`
                flex items-center gap-4 p-3 pr-6 rounded-[28px] shadow-2xl relative overflow-hidden
                ${darkMode ? "bg-[#121212]/95 border border-white/10" : "bg-white/95 border border-slate-200"}
                backdrop-blur-2xl
            `}>
                {/* Icon Circle */}
                <div className={`w-10 h-10 rounded-2xl ${color} flex items-center justify-center shadow-lg transition-transform active:scale-95`}>
                    <span className={`material-icons ${textColor} text-[20px]`}>{icon}</span>
                </div>

                {/* Text Content */}
                <div className="flex flex-col min-w-0">
                    <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[13px] font-black uppercase tracking-tight leading-tight truncate max-w-[160px]`}>
                        {event.userNode}
                    </span>
                    <span className={`${darkMode ? "text-white/40" : "text-slate-500"} text-[10px] font-black uppercase tracking-widest leading-tight mt-0.5`}>
                        {event.message}
                    </span>
                </div>

                {/* Activity Border Pulse */}
                {event.type === "purchase" && (
                    <div className="absolute inset-0 rounded-[28px] border-2 border-emerald-500/30 animate-pulse pointer-events-none" />
                )}
                {event.type === "cart" && (
                    <div className="absolute inset-0 rounded-[28px] border-2 border-[#f77f00]/30 animate-pulse pointer-events-none" />
                )}
            </div>
        </div>
    );
});

export default MobileLiveNotification;
