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
}

export const MobileLiveNotification = memo(function MobileLiveNotification({
    event,
    onComplete,
}: MobileLiveNotificationProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (event) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onComplete, 300); // Wait for exit animation
            }, event.duration || 3000);
            return () => clearTimeout(timer);
        }
    }, [event, onComplete]);

    if (!event) return null;

    const iconMap = {
        cart: { icon: "shopping_cart", color: "bg-emerald-500" },
        purchase: { icon: "payments", color: "bg-amber-500" },
        follow: { icon: "person_add", color: "bg-blue-500" },
    };

    const { icon, color } = iconMap[event.type];

    return (
        <div className={`
            fixed left-4 bottom-52 z-[60] pointer-events-none transition-all duration-300
            ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}
        `}>
            <div className="flex items-center gap-3 p-2.5 pr-4 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl">
                {/* Icon Circle */}
                <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shadow-lg`}>
                    <span className="material-icons text-white text-[18px]">{icon}</span>
                </div>

                {/* Text Content */}
                <div className="flex flex-col">
                    <span className="text-white text-[12px] font-bold leading-tight">
                        {event.userNode}
                    </span>
                    <span className="text-white/60 text-[10px] font-medium leading-tight">
                        {event.message}
                    </span>
                </div>

                {/* Pulse for purchase */}
                {event.type === "purchase" && (
                    <div className="absolute inset-0 rounded-2xl border-2 border-amber-500/50 animate-pulse pointer-events-none" />
                )}
            </div>
        </div>
    );
});
