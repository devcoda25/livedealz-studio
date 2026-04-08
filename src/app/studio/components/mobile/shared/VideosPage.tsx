"use client";

import React, { useState } from "react";

interface VideosPageProps {
    onGoBack: () => void;
    onOpenSettings: () => void;
    darkMode?: boolean;
}

export function VideosPage({
    onGoBack,
    onOpenSettings,
    darkMode = true,
}: VideosPageProps) {
    const [selectedFilter, setSelectedFilter] = useState<"all" | "live" | "recorded">("all");

    const videos = [
        { id: "1", title: "Summer Collection Launch", thumbnail: "🎬", date: "2 days ago", views: "1.2K", duration: "45:30" },
        { id: "2", title: "Flash Sale Special", thumbnail: "🔥", date: "5 days ago", views: "2.8K", duration: "32:15" },
        { id: "3", title: "Product Demo #12", thumbnail: "📦", date: "1 week ago", views: "890", duration: "28:45" },
    ];

    const filters = [
        { id: "all", label: "All" },
        { id: "live", label: "Live" },
        { id: "recorded", label: "Recorded" },
    ] as const;

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
                        My Videos
                    </h1>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mt-4">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setSelectedFilter(filter.id)}
                            className={`
                                px-4 py-2 rounded-full text-sm font-semibold transition-all
                                ${selectedFilter === filter.id 
                                    ? "bg-[#f77f00] text-white" 
                                    : darkMode ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-600"
                                }
                            `}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Videos Grid */}
            <div className="px-4 pb-24">
                {videos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {videos.map((video) => (
                            <div
                                key={video.id}
                                className={`
                                    rounded-2xl overflow-hidden
                                    ${darkMode ? "bg-white/5" : "bg-white"}
                                    border ${darkMode ? "border-white/10" : "border-slate-200"}
                                `}
                            >
                                <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
                                    <span className="text-4xl">{video.thumbnail}</span>
                                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs font-bold">
                                        {video.duration}
                                    </span>
                                </div>
                                <div className="p-3">
                                    <p className={`font-bold text-sm line-clamp-2 ${darkMode ? "text-white" : "text-slate-900"}`}>
                                        {video.title}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className={`text-xs ${darkMode ? "text-white/50" : "text-slate-500"}`}>
                                            {video.date}
                                        </span>
                                        <span className={`text-xs ${darkMode ? "text-white/50" : "text-slate-500"}`}>
                                            {video.views} views
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <span className="text-5xl">🎥</span>
                        <p className={`mt-4 ${darkMode ? "text-white/60" : "text-slate-500"}`}>
                            No videos yet
                        </p>
                        <p className={`text-sm ${darkMode ? "text-white/40" : "text-slate-400"}`}>
                            Start recording to see your videos here
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default VideosPage;