"use client";

import React from "react";

interface MobileHomeBottomNavProps {
    darkMode?: boolean;
    onGoHome: () => void;
    onOpenVideos: () => void;
    onOpenCampaigns: () => void;
    onOpenProfile: () => void;
    onOpenSettings: () => void;
    onOpenMore: () => void;
    activeTab?: string;
}

export function MobileHomeBottomNav({
    darkMode = true,
    onGoHome,
    onOpenVideos,
    onOpenCampaigns,
    onOpenProfile,
    onOpenSettings,
    onOpenMore,
    activeTab = "home",
}: MobileHomeBottomNavProps) {
    const navItems = [
        { id: "home", icon: "home", label: "Home", onClick: onGoHome },
        { id: "videos", icon: "videocam", label: "Videos", onClick: onOpenVideos },
        { id: "campaigns", icon: "campaign", label: "Campaigns", onClick: onOpenCampaigns },
        { id: "profile", icon: "person", label: "Profile", onClick: onOpenProfile },
        { id: "settings", icon: "settings", label: "Settings", onClick: onOpenSettings },
        { id: "more", icon: "more_horiz", label: "More", onClick: onOpenMore },
    ];

    return (
        <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-auto">
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-t ${darkMode ? "from-[#0a0a0a]" : "from-white"} to-transparent h-20 pointer-events-none`} />
            
            {/* Nav bar */}
            <div className={`relative px-2 pb-2 pt-4 ${darkMode ? "bg-white/5 border-t border-white/5" : "bg-white border-t border-slate-200"}`}>
                <div className="flex items-center justify-around">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={item.onClick}
                                className="flex flex-col items-center gap-1.5 px-3 py-2 active:scale-90 transition-all"
                            >
                                <div className={`
                                    w-11 h-11 rounded-2xl flex items-center justify-center
                                    transition-all duration-200
                                    ${isActive 
                                        ? darkMode 
                                            ? "bg-[#f77f00] shadow-[0_4px_12px_rgba(247,127,0,0.4)]" 
                                            : "bg-[#f77f00] shadow-lg"
                                        : darkMode 
                                            ? "bg-white/5 text-white/50" 
                                            : "bg-slate-100 text-slate-500"
                                    }
                                `}>
                                    <span className={`material-icons text-[22px] ${isActive ? "text-white" : ""}`}>
                                        {item.icon}
                                    </span>
                                </div>
                                <span className={`
                                    text-[10px] font-semibold transition-colors
                                    ${isActive 
                                        ? darkMode ? "text-white" : "text-[#f77f00]" 
                                        : darkMode ? "text-white/40" : "text-slate-400"
                                    }
                                `}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default MobileHomeBottomNav;