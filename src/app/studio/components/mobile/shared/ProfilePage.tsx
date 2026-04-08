"use client";

import React, { useState } from "react";

interface ProfilePageProps {
    onGoBack: () => void;
    onOpenSettings: () => void;
    storeHandle?: string;
    darkMode?: boolean;
}

export function ProfilePage({
    onGoBack,
    onOpenSettings,
    storeHandle = "yourstore",
    darkMode = true,
}: ProfilePageProps) {
    const [selectedTab, setSelectedTab] = useState<"overview" | "followers" | "products">("overview");

    const stats = [
        { label: "Followers", value: "12.5K", icon: "👥" },
        { label: "Total Views", value: "245K", icon: "👁" },
        { label: "Total Sales", value: "$12.8K", icon: "💰" },
    ];

    const tabs = [
        { id: "overview", label: "Overview" },
        { id: "followers", label: "Followers" },
        { id: "products", label: "Products" },
    ] as const;

    return (
        <div className={`absolute inset-0 pointer-events-auto ${darkMode ? "bg-[#0a0a0a]" : "bg-slate-50"} overflow-y-auto`}>
            {/* Header */}
            <div className={`px-4 pt-[env(safe-area-inset-top,0px)] pb-6 ${darkMode ? "bg-gradient-to-b from-[#1a1a1a]" : "bg-white"}`}>
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={onGoBack}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-white/10" : "bg-slate-100"}`}
                    >
                        <span className={`material-icons ${darkMode ? "text-white" : "text-slate-700"}`}>arrow_back</span>
                    </button>
                    <h1 className={`text-xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>
                        Profile
                    </h1>
                </div>

                {/* Profile Info */}
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#f77f00] to-orange-600 flex items-center justify-center">
                        <span className="text-3xl">🎬</span>
                    </div>
                    <div>
                        <h2 className={`text-xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>
                            Studio Host
                        </h2>
                        <p className={`${darkMode ? "text-white/60" : "text-slate-500"}`}>
                            @{storeHandle}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">✓ Verified</span>
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">★ 4.9</span>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="flex gap-3 mt-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className={`flex-1 p-3 rounded-xl ${darkMode ? "bg-white/5" : "bg-slate-100"}`}>
                            <div className="flex items-center gap-2">
                                <span>{stat.icon}</span>
                                <span className={`text-lg font-black ${darkMode ? "text-white" : "text-slate-900"}`}>
                                    {stat.value}
                                </span>
                            </div>
                            <p className={`text-xs mt-1 ${darkMode ? "text-white/50" : "text-slate-500"}`}>
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Edit Profile Button */}
                <button className="w-full mt-4 py-3 rounded-xl font-bold border border-[#f77f00] text-[#f77f00]">
                    Edit Profile
                </button>
            </div>

            {/* Tabs */}
            <div className={`sticky top-0 z-10 px-4 py-3 ${darkMode ? "bg-[#0a0a0a]" : "bg-white"}`}>
                <div className={`flex rounded-xl p-1 ${darkMode ? "bg-white/5" : "bg-slate-100"}`}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id)}
                            className={`
                                flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                                ${selectedTab === tab.id 
                                    ? "bg-[#f77f00] text-white" 
                                    : darkMode ? "text-white/60" : "text-slate-500"
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-24">
                {selectedTab === "overview" && (
                    <div className="space-y-4">
                        {/* Bio */}
                        <div className={`p-4 rounded-xl ${darkMode ? "bg-white/5" : "bg-white"}`}>
                            <h3 className={`font-bold mb-2 ${darkMode ? "text-white" : "text-slate-900"}`}>Bio</h3>
                            <p className={`text-sm ${darkMode ? "text-white/70" : "text-slate-600"}`}>
                                Live shopping enthusiast 🎬 | Quality products at great prices | Follow for daily deals!
                            </p>
                        </div>

                        {/* Store Info */}
                        <div className={`p-4 rounded-xl ${darkMode ? "bg-white/5" : "bg-white"}`}>
                            <h3 className={`font-bold mb-2 ${darkMode ? "text-white" : "text-slate-900"}`}>Store Info</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className={`material-icons text-[18px] ${darkMode ? "text-white/40" : "text-slate-400"}`}>location_on</span>
                                    <span className={`text-sm ${darkMode ? "text-white/70" : "text-slate-600"}`}>Kampala, Uganda</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`material-icons text-[18px] ${darkMode ? "text-white/40" : "text-slate-400"}`}>store</span>
                                    <span className={`text-sm ${darkMode ? "text-white/70" : "text-slate-600"}`}>45 Products</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`material-icons text-[18px] ${darkMode ? "text-white/40" : "text-slate-400"}`}>calendar_today</span>
                                    <span className={`text-sm ${darkMode ? "text-white/70" : "text-slate-600"}`}>Joined Jan 2024</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {selectedTab === "followers" && (
                    <div className="text-center py-16">
                        <span className="text-5xl">👥</span>
                        <p className={`mt-4 ${darkMode ? "text-white/60" : "text-slate-500"}`}>
                            12,500 Followers
                        </p>
                    </div>
                )}

                {selectedTab === "products" && (
                    <div className="text-center py-16">
                        <span className="text-5xl">📦</span>
                        <p className={`mt-4 ${darkMode ? "text-white/60" : "text-slate-500"}`}>
                            45 Products
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProfilePage;