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
        cart: { icon: "shopping_cart" },
        purchase: { icon: "payments" },
        follow: { icon: "person_add" },
    };

    const { icon } = iconMap[event.type];

    return (
        <div className={`
            fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+84px)] -translate-x-1/2 z-[60] pointer-events-none
            transition-all duration-700 cubic-bezier(0.23, 1, 0.32, 1)
            ${isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-6 scale-95"}
        `}>
            <div className="flex items-center gap-3">
                <span className={`material-icons text-[20px] ${event.type === "purchase" ? "text-emerald-300" : event.type === "cart" ? "text-[#f77f00]" : "text-blue-300"} drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]`}>
                    {icon}
                </span>

                {/* Text Content */}
                <div className="flex flex-col min-w-0">
                    <span className="text-white text-[13px] font-black uppercase tracking-tight leading-tight truncate max-w-[180px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
                        {event.userNode}
                    </span>
                    <span className="text-white/80 text-[10px] font-black uppercase tracking-widest leading-tight mt-0.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
                        {event.message}
                    </span>
                </div>
            </div>
        </div>
    );
});

export default MobileLiveNotification;
