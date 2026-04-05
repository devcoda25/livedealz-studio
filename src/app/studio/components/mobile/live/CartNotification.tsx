/**
 * CartNotification - Floating cart notification (TikTok-style)
 * 
 * Shows a floating notification when someone:
 * - Adds a product to cart
 * - Makes a purchase
 * 
 * Animates upward and fades out, similar to floating hearts.
 */

import React, { memo, useState, useEffect } from "react";

interface CartEvent {
    id: string;
    buyerName: string;
    productName: string;
    action: "cart" | "purchase";
    amount?: string;
    timestamp: number;
}

interface CartNotificationProps {
    events: CartEvent[];
}

export const CartNotification = memo(function CartNotification({
    events,
}: CartNotificationProps) {
    return (
        <div className="absolute left-4 bottom-48 z-30 pointer-events-none w-[240px]">
            <div className="flex flex-col gap-3">
                {events.slice(-3).map((event) => (
                    <NotificationBubble key={event.id} event={event} />
                ))}
            </div>
        </div>
    );
});

const NotificationBubble = memo(function NotificationBubble({ event }: { event: CartEvent }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animate in
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const isPurchase = event.action === "purchase";

    return (
        <div
            className={`
                flex items-center gap-3 px-4 py-2.5 rounded-[24px]
                transform transition-all duration-700 ease-out
                ${isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-6 opacity-0"
                }
                ${isPurchase
                    ? "bg-gradient-to-br from-emerald-600/95 to-green-800/95 border border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    : "bg-black/60 border border-white/10 shadow-2xl"
                }
                backdrop-blur-2xl
            `}
            style={{
                animation: `floatUpCart 4s cubic-bezier(0.23, 1, 0.32, 1) forwards`,
            }}
        >
            {/* Icon */}
            <div className={`
                w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg
                ${isPurchase ? "bg-white/20" : "bg-[#f77f00]/20"}
            `}>
                <span className={`material-icons text-[18px] ${isPurchase ? "text-white" : "text-[#f77f00]"}`}>
                    {isPurchase ? "paid" : "shopping_cart"}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-white text-[12px] font-black uppercase tracking-tight truncate leading-tight">
                    {event.buyerName}
                </p>
                <p className={`${isPurchase ? "text-white/80" : "text-white/60"} text-[10px] font-bold uppercase tracking-widest truncate mt-0.5`}>
                    {isPurchase ? `ORDERED ${event.productName}` : `ADDED TO CART`}
                </p>
            </div>

            {/* Amount (for purchases) */}
            {isPurchase && event.amount && (
                <div className="bg-white/20 px-2 py-1 rounded-lg flex-shrink-0">
                    <span className="text-white text-[11px] font-black tabular-nums">
                        {event.amount}
                    </span>
                </div>
            )}
        </div>
    );
});

// Helper to create cart events from sales events
export function createCartEvent(
    buyerName: string,
    productName: string,
    action: "cart" | "purchase",
    amount?: string
): CartEvent {
    return {
        id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        buyerName,
        productName,
        action,
        amount,
        timestamp: Date.now(),
    };
}

// Add keyframe animation
if (typeof document !== "undefined") {
    const styleId = "cart-notification-styles";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            @keyframes floatUpCart {
                0% {
                    transform: translateY(20px) scale(0.9);
                    opacity: 0;
                }
                15% {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
                85% {
                    opacity: 1;
                }
                100% {
                    transform: translateY(-50px) scale(0.95);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

export default CartNotification;
