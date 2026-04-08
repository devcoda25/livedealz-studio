"use client";

import React from "react";

interface MorePageProps {
    onGoBack: () => void;
    onOpenAnalytics: () => void;
    onOpenProducts: () => void;
    onOpenOrders: () => void;
    onOpenEarnings: () => void;
    onOpenAudience: () => void;
    onOpenMessages: () => void;
    onOpenTranslations: () => void;
    onOpenSoundLibrary: () => void;
    onOpenBackgrounds: () => void;
    onOpenStickers: () => void;
    darkMode?: boolean;
}

export function MorePage({
    onGoBack,
    onOpenAnalytics,
    onOpenProducts,
    onOpenOrders,
    onOpenEarnings,
    onOpenAudience,
    onOpenMessages,
    onOpenTranslations,
    onOpenSoundLibrary,
    onOpenBackgrounds,
    onOpenStickers,
    darkMode = true,
}: MorePageProps) {
    const moreItems = [
        { id: "analytics", icon: "analytics", label: "Analytics", description: "View your performance", color: "blue", onClick: onOpenAnalytics },
        { id: "products", icon: "inventory_2", label: "Products", description: "Manage your inventory", color: "orange", onClick: onOpenProducts },
        { id: "orders", icon: "receipt_long", label: "Orders", description: "View customer orders", color: "green", onClick: onOpenOrders },
        { id: "earnings", icon: "account_balance_wallet", label: "Earnings", description: "Track your revenue", color: "purple", onClick: onOpenEarnings },
        { id: "audience", icon: "group", label: "Audience", description: "Manage followers", color: "pink", onClick: onOpenAudience },
        { id: "messages", icon: "mail", label: "Messages", description: "View messages", color: "amber", badge: "5", onClick: onOpenMessages },
        { id: "translations", icon: "translate", label: "Translations", description: "Language settings", color: "cyan", onClick: onOpenTranslations },
        { id: "sound", icon: "library_music", label: "Sound Library", description: "Manage audio tracks", color: "red", onClick: onOpenSoundLibrary },
        { id: "background", icon: "wallpaper", label: "Backgrounds", description: "Virtual backgrounds", color: "indigo", onClick: onOpenBackgrounds },
        { id: "stickers", icon: "emoji_emotions", label: "Stickers", description: "Custom stickers", color: "yellow", onClick: onOpenStickers },
    ];

    const getColorClass = (color: string) => {
        const colors: Record<string, string> = {
            blue: "bg-blue-500",
            orange: "bg-[#f77f00]",
            green: "bg-green-500",
            purple: "bg-purple-500",
            pink: "bg-pink-500",
            amber: "bg-amber-500",
            cyan: "bg-cyan-500",
            red: "bg-red-500",
            indigo: "bg-indigo-500",
            yellow: "bg-yellow-500",
        };
        return colors[color] || "bg-slate-500";
    };

    return (
        <div className={`absolute inset-0 pointer-events-auto ${darkMode ? "bg-[#0a0a0a]" : "bg-slate-50"} overflow-y-auto`}>
            {/* Header */}
            <div className={`sticky top-0 z-10 px-4 pt-[env(safe-area-inset-top,0px)] pb-4 ${darkMode ? "bg-[#0a0a0a]/95 backdrop-blur-sm" : "bg-white/95"}`}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onGoBack}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-white/10" : "bg-slate-100"}`}
                    >
                        <span className={`material-icons ${darkMode ? "text-white" : "text-slate-700"}`}>arrow_back</span>
                    </button>
                    <h1 className={`text-xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>
                        More
                    </h1>
                </div>
            </div>

            {/* More Items Grid */}
            <div className="px-4 pb-24">
                <div className="grid grid-cols-2 gap-3">
                    {moreItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={item.onClick}
                            className={`
                                p-4 rounded-2xl flex flex-col items-center gap-3
                                ${darkMode ? "bg-white/5 border border-white/10" : "bg-white border border-slate-200"}
                                active:scale-95 transition-all
                            `}
                        >
                            <div className={`w-14 h-14 rounded-2xl ${getColorClass(item.color)} flex items-center justify-center`}>
                                <span className="material-icons text-white text-[24px]">{item.icon}</span>
                            </div>
                            <div className="text-center">
                                <p className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                                    {item.label}
                                </p>
                                <p className={`text-xs mt-0.5 ${darkMode ? "text-white/50" : "text-slate-500"}`}>
                                    {item.description}
                                </p>
                            </div>
                            {item.badge && (
                                <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default MorePage;