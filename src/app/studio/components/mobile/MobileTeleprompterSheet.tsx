/**
 * MobileTeleprompterSheet - Campaign & Session selection
 * 
 * Allows creators to browse their campaigns, select a session,
 * and load its script cues into the teleprompter.
 */

import React, { useState } from "react";
import { Campaign, CampaignSession } from "../shared/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface MobileTeleprompterSheetProps {
    isOpen: boolean;
    onClose: () => void;
    campaigns: Campaign[];
    onSelectSession: (session: CampaignSession) => void;
    darkMode?: boolean;
}

export const MobileTeleprompterSheet = ({
    isOpen,
    onClose,
    campaigns,
    onSelectSession,
    darkMode = true,
}: MobileTeleprompterSheetProps) => {
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

    const handleBack = () => setSelectedCampaign(null);

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent 
                side="bottom" 
                className={`h-[80vh] rounded-t-[32px] border-none p-0 overflow-hidden ${darkMode ? "bg-[#121212] text-white" : "bg-white text-slate-900"}`}
            >
                <div className={`w-12 h-1.5 rounded-full mx-auto mt-3 mb-6 ${darkMode ? "bg-white/10" : "bg-slate-200"}`} />
                
                <SheetHeader className="px-6 mb-4">
                    <div className="flex items-center gap-2">
                        {selectedCampaign && (
                            <button 
                                onClick={handleBack}
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? "bg-white/5" : "bg-slate-100"}`}
                            >
                                <span className="material-icons text-[18px]">arrow_back</span>
                            </button>
                        )}
                        <SheetTitle className={darkMode ? "text-white" : ""}>
                            {selectedCampaign ? selectedCampaign.name : "My Campaigns"}
                        </SheetTitle>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 pb-12">
                    {!selectedCampaign ? (
                        /* Campaign List */
                        <div className="grid gap-4">
                            {campaigns.length === 0 ? (
                                <div className="py-12 text-center text-slate-500">
                                    <span className="material-icons text-4xl mb-2">campaign</span>
                                    <p className="text-sm">No campaigns found.</p>
                                </div>
                            ) : (
                                campaigns.map((campaign) => (
                                    <button
                                        key={campaign.id}
                                        onClick={() => setSelectedCampaign(campaign)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-95 ${darkMode ? "bg-white/5 hover:bg-white/10" : "bg-slate-50 hover:bg-slate-100"}`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? "bg-amber-500/20 text-amber-500" : "bg-amber-100 text-amber-600"}`}>
                                            <span className="material-icons">folder</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold truncate text-[15px]">{campaign.name}</h4>
                                            <p className="text-xs text-slate-500 truncate">{campaign.sessions.length} sessions</p>
                                        </div>
                                        <span className="material-icons text-slate-400">chevron_right</span>
                                    </button>
                                ))
                            )}
                        </div>
                    ) : (
                        /* Session List */
                        <div className="grid gap-4">
                            {selectedCampaign.sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className={`p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/5" : "bg-white border-slate-100"}`}
                                >
                                    <h4 className="font-semibold text-[15px] mb-1">{session.name}</h4>
                                    <p className={`text-xs mb-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{session.description}</p>
                                    
                                    <div className={`bg-black/20 rounded-xl p-3 mb-4 ${darkMode ? "bg-black/40" : "bg-slate-50"}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-icons text-[14px] text-primary">subtitles</span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Script Preview</span>
                                        </div>
                                        <ul className="space-y-1">
                                            {session.scriptCues.slice(0, 3).map((cue, idx) => (
                                                <li key={cue.id} className="text-[11px] text-slate-300 truncate">
                                                    <span className="text-primary mr-1">•</span> {cue.text}
                                                </li>
                                            ))}
                                            {session.scriptCues.length > 3 && (
                                                <li className="text-[10px] text-slate-500">+{session.scriptCues.length - 3} more cues</li>
                                            )}
                                        </ul>
                                    </div>

                                    <button
                                        onClick={() => {
                                            onSelectSession(session);
                                            onClose();
                                        }}
                                        className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                    >
                                        Load to Teleprompter
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};
