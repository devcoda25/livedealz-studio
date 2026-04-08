"use client";

import React, { useState } from "react";

interface CampaignsPageProps {
    onGoBack: () => void;
    onOpenSettings: () => void;
    darkMode?: boolean;
}

export function CampaignsPage({
    onGoBack,
    onOpenSettings,
    darkMode = true,
}: CampaignsPageProps) {
    const campaigns = [
        { id: "1", title: "Summer Sale", status: "Active", audience: "2.5K", scheduled: "Now" },
        { id: "2", title: "New Product Launch", status: "Scheduled", audience: "5K", scheduled: "Tomorrow 2PM" },
        { id: "3", title: "Flash Deal Alert", status: "Draft", audience: "-", scheduled: "Not scheduled" },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Active": return "bg-green-500";
            case "Scheduled": return "bg-blue-500";
            case "Draft": return "bg-slate-500";
            default: return "bg-slate-500";
        }
    };

    return (
        <div className={`absolute inset-0 pointer-events-auto ${darkMode ? "bg-[#0a0a0a]" : "bg-slate-50"} overflow-y-auto`}>
            {/* Header */}
            <div className={`sticky top-0 z-10 px-4 pt-[env(safe-area-inset-top,0px)] pb-4 ${darkMode ? "bg-[#0a0a0a]/95 backdrop-blur-sm" : "bg-white/95"}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onGoBack}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-white/10" : "bg-slate-100"}`}
                        >
                            <span className={`material-icons ${darkMode ? "text-white" : "text-slate-700"}`}>arrow_back</span>
                        </button>
                        <h1 className={`text-xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>
                            Campaigns
                        </h1>
                    </div>
                    <button className="px-4 py-2 bg-[#f77f00] rounded-full text-white text-sm font-bold">
                        + New
                    </button>
                </div>
            </div>

            {/* Campaigns List */}
            <div className="px-4 pb-24 space-y-3">
                {campaigns.map((campaign) => (
                    <div
                        key={campaign.id}
                        className={`
                            p-4 rounded-2xl
                            ${darkMode ? "bg-white/5 border border-white/10" : "bg-white border border-slate-200"}
                        `}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${getStatusColor(campaign.status)}`} />
                                    <span className={`text-xs font-semibold ${darkMode ? "text-white/60" : "text-slate-500"}`}>
                                        {campaign.status}
                                    </span>
                                </div>
                                <h3 className={`font-bold mt-2 ${darkMode ? "text-white" : "text-slate-900"}`}>
                                    {campaign.title}
                                </h3>
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center gap-1">
                                        <span className={`material-icons text-[16px] ${darkMode ? "text-white/40" : "text-slate-400"}`}>people</span>
                                        <span className={`text-xs ${darkMode ? "text-white/50" : "text-slate-500"}`}>
                                            {campaign.audience}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className={`material-icons text-[16px] ${darkMode ? "text-white/40" : "text-slate-400"}`}>schedule</span>
                                        <span className={`text-xs ${darkMode ? "text-white/50" : "text-slate-500"}`}>
                                            {campaign.scheduled}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button className={`p-2 rounded-xl ${darkMode ? "bg-white/10" : "bg-slate-100"}`}>
                                <span className={`material-icons ${darkMode ? "text-white/60" : "text-slate-500"}`}>more_vert</span>
                            </button>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {campaigns.length === 0 && (
                    <div className="text-center py-16">
                        <span className="text-5xl">📢</span>
                        <p className={`mt-4 ${darkMode ? "text-white/60" : "text-slate-500"}`}>
                            No campaigns yet
                        </p>
                        <p className={`text-sm ${darkMode ? "text-white/40" : "text-slate-400"}`}>
                            Create a campaign to promote your live streams
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CampaignsPage;