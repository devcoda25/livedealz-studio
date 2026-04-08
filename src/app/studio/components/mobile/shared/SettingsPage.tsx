"use client";

import React from "react";

interface SettingsPageProps {
    onGoBack: () => void;
    onOpenSettings: () => void;
    darkMode?: boolean;
}

export function SettingsPage({
    onGoBack,
    onOpenSettings,
    darkMode = true,
}: SettingsPageProps) {
    const settingsSections = [
        {
            title: "Account",
            items: [
                { icon: "person", label: "Edit Profile", onClick: () => {} },
                { icon: "notifications", label: "Notifications", onClick: () => {}, badge: "3" },
                { icon: "lock", label: "Privacy", onClick: () => {} },
                { icon: "security", label: "Security", onClick: () => {} },
            ],
        },
        {
            title: "Studio",
            items: [
                { icon: "videocam", label: "Camera Settings", onClick: () => {} },
                { icon: "mic", label: "Audio Settings", onClick: () => {} },
                { icon: "tune", label: "Broadcast Quality", onClick: () => {} },
                { icon: "filter", label: "Filters & Effects", onClick: () => {} },
            ],
        },
        {
            title: "Store",
            items: [
                { icon: "inventory_2", label: "Products", onClick: () => {} },
                { icon: "local_shipping", label: "Shipping", onClick: () => {} },
                { icon: "receipt_long", label: "Orders", onClick: () => {} },
                { icon: "payments", label: "Payments", onClick: () => {} },
            ],
        },
        {
            title: "Support",
            items: [
                { icon: "help", label: "Help Center", onClick: () => {} },
                { icon: "description", label: "Terms & Policies", onClick: () => {} },
                { icon: "info", label: "About", onClick: () => {} },
            ],
        },
    ];

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
                        Settings
                    </h1>
                </div>
            </div>

            {/* Settings Sections */}
            <div className="px-4 pb-24 space-y-6">
                {settingsSections.map((section, idx) => (
                    <div key={idx}>
                        <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 ${darkMode ? "text-white/50" : "text-slate-500"}`}>
                            {section.title}
                        </h2>
                        <div className={`rounded-2xl overflow-hidden ${darkMode ? "bg-white/5" : "bg-white"}`}>
                            {section.items.map((item, itemIdx) => (
                                <button
                                    key={itemIdx}
                                    onClick={item.onClick}
                                    className={`
                                        w-full flex items-center gap-4 p-4
                                        ${itemIdx !== section.items.length - 1 ? `border-b ${darkMode ? "border-white/5" : "border-slate-100"}` : ""}
                                        active:bg-white/5
                                    `}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-white/10" : "bg-slate-100"}`}>
                                        <span className={`material-icons ${darkMode ? "text-white/70" : "text-slate-600"}`}>
                                            {item.icon}
                                        </span>
                                    </div>
                                    <span className={`flex-1 text-left font-medium ${darkMode ? "text-white" : "text-slate-900"}`}>
                                        {item.label}
                                    </span>
                                    {item.badge && (
                                        <span className="px-2 py-0.5 bg-[#f77f00] rounded-full text-white text-xs font-bold">
                                            {item.badge}
                                        </span>
                                    )}
                                    <span className={`material-icons ${darkMode ? "text-white/30" : "text-slate-300"}`}>
                                        chevron_right
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Logout */}
                <button className="w-full p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <span className="text-red-500 font-bold">Log Out</span>
                </button>

                {/* Version */}
                <p className={`text-center text-sm ${darkMode ? "text-white/30" : "text-slate-400"}`}>
                    LiveDealz Studio v1.0.0
                </p>
            </div>
        </div>
    );
}

export default SettingsPage;