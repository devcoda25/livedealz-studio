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
        <div className="absolute left-3 bottom-48 z-30 pointer-events-none w-[200px]">
            <div className="flex flex-col gap-2">
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
                flex items-center gap-2 px-3 py-2 rounded-2xl
                transform transition-all duration-500 ease-out
                ${isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }
                ${isPurchase
                    ? "bg-gradient-to-r from-emerald-500/90 to-green-600/90 border border-emerald-400/30"
                    : "bg-gradient-to-r from-[#FF5C00]/90 to-orange-600/90 border border-[#FF5C00]/30"
                }
                backdrop-blur-md shadow-lg
            `}
            style={{
                animation: `floatUpCart 3s ease-out forwards`,
            }}
        >
            {/* Icon */}
            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                ${isPurchase ? "bg-white/20" : "bg-white/20"}
            `}>
                <span className="material-icons text-white text-[16px]">
                    {isPurchase ? "paid" : "add_shopping_cart"}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-white text-[11px] font-medium truncate">
                    {event.buyerName}
                </p>
                <p className="text-white/80 text-[10px] truncate">
                    {isPurchase ? `Bought ${event.productName}` : `Added ${event.productName}`}
                </p>
            </div>

            {/* Amount (for purchases) */}
            {isPurchase && event.amount && (
                <span className="text-white text-[11px] font-bold flex-shrink-0">
                    {event.amount}
                </span>
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
                    transform: translateY(0) scale(0.95);
                    opacity: 0;
                }
                10% {
                    transform: translateY(-5px) scale(1);
                    opacity: 1;
                }
                80% {
                    opacity: 1;
                }
                100% {
                    transform: translateY(-40px) scale(0.98);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

export default CartNotification;
