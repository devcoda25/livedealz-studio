/**
 * MobileTeleprompterSheet - Campaign & Session selection
 * 
 * Allows creators to browse their campaigns, select a session,
 * and load its script cues into the teleprompter.
 */

import React, { useState, memo } from "react";
import { Campaign, CampaignSession, ScriptCue } from "../../shared/types";
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

export const MobileTeleprompterSheet = memo(function MobileTeleprompterSheet({
    isOpen,
    onClose,
    campaigns,
    onSelectSession,
    darkMode = true,
}: MobileTeleprompterSheetProps) {
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

    const handleBack = () => setSelectedCampaign(null);

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent 
                side="bottom" 
                className={`h-[85vh] rounded-t-[32px] border-none p-0 overflow-hidden ${darkMode ? "bg-[#121212]/95 text-white shadow-2xl" : "bg-white/95 text-slate-900 shadow-xl"} backdrop-blur-2xl transition-all duration-300`}
            >
                {/* Drag Handle */}
                <div className="w-full flex justify-center pt-4 pb-1 cursor-pointer group" onClick={onClose}>
                    <div className={`w-12 h-1.5 rounded-full transition-colors ${darkMode ? "bg-white/10 group-hover:bg-white/20" : "bg-slate-200 group-hover:bg-slate-300"}`} />
                </div>
                
                <SheetHeader className="px-6 py-4 flex flex-col gap-1 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        {selectedCampaign && (
                            <button 
                                onClick={handleBack}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 ${darkMode ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                            >
                                <span className="material-icons text-[20px]">arrow_back</span>
                            </button>
                        )}
                        <div className="flex flex-col">
                            <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${darkMode ? "text-white/30" : "text-slate-400"}`}>Campaign Engine</span>
                            <SheetTitle className={`${darkMode ? "text-white" : "text-slate-900"} text-2xl font-black uppercase tracking-tight truncate max-w-[240px]`}>
                                {selectedCampaign ? selectedCampaign.name : "My Content"}
                            </SheetTitle>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 no-scrollbar">
                    {!selectedCampaign ? (
                        /* Campaign List */
                        <div className="grid gap-4">
                            {campaigns.length === 0 ? (
                                <div className={`flex flex-col items-center justify-center py-20 ${darkMode ? "bg-white/5 border-dashed border-white/10" : "bg-slate-50 border-dashed border-slate-200"} border-2 rounded-[32px]`}>
                                    <span className={`material-icons text-[56px] mb-4 ${darkMode ? "text-white/10" : "text-slate-200"}`}>campaign</span>
                                    <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${darkMode ? "text-white/20" : "text-slate-400"}`}>No Active Campaigns</p>
                                </div>
                            ) : (
                                campaigns.map((campaign) => (
                                    <button
                                        key={campaign.id}
                                        onClick={() => setSelectedCampaign(campaign)}
                                        className={`w-full flex items-center gap-5 p-5 rounded-[28px] text-left transition-all active:scale-[0.98] border ${darkMode ? "bg-white/5 border-transparent hover:bg-white/10" : "bg-white border-slate-100 hover:bg-slate-50 shadow-sm"}`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${darkMode ? "bg-[#f77f00]/20 text-[#f77f00]" : "bg-[#f77f00] text-white"}`}>
                                            <span className="material-icons text-[28px]">folder_open</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-[16px] font-black uppercase tracking-tight truncate ${darkMode ? "text-white" : "text-slate-900"}`}>{campaign.name}</h4>
                                            <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${darkMode ? "text-white/30" : "text-slate-400"}`}>{campaign.sessions.length} RECORDING SESSIONS</p>
                                        </div>
                                        <span className={`material-icons ${darkMode ? "text-white/20" : "text-slate-300"}`}>chevron_right</span>
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
                                    className={`p-6 rounded-[32px] border transition-all ${darkMode ? "bg-white/5 border-transparent" : "bg-white border-slate-100 shadow-xl"}`}
                                >
                                    <div className="flex flex-col gap-1 mb-4">
                                        <h4 className={`text-[18px] font-black uppercase tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{session.name}</h4>
                                        <p className={`text-[12px] font-bold leading-snug ${darkMode ? "text-white/50" : "text-slate-500"}`}>{session.description}</p>
                                    </div>
                                    
                                    <div className={`rounded-2xl p-4 mb-6 border ${darkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="material-icons text-[16px] text-[#f77f00]">subtitles</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-white/30" : "text-slate-400"}`}>Cues Preview</span>
                                        </div>
                                        <ul className="space-y-2">
                                            {session.scriptCues.slice(0, 3).map((cue: ScriptCue, idx: number) => (
                                                <li key={cue.id} className={`text-[12px] font-bold truncate flex items-center gap-2 ${darkMode ? "text-white/70" : "text-slate-600"}`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#f77f00]" /> {cue.text}
                                                </li>
                                            ))}
                                            {session.scriptCues.length > 3 && (
                                                <li className={`text-[10px] font-black uppercase tracking-[0.2em] mt-3 ${darkMode ? "text-white/20" : "text-slate-400"}`}>
                                                    AND {session.scriptCues.length - 3} MORE SEQUENCE{session.scriptCues.length - 3 > 1 ? "S" : ""}
                                                </li>
                                            )}
                                        </ul>
                                    </div>

                                    <button
                                        onClick={() => {
                                            onSelectSession(session);
                                            onClose();
                                        }}
                                        className="w-full py-4 bg-[#f77f00] text-white rounded-2xl text-[13px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#f77f00]/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        <span className="material-icons text-[20px]">play_circle</span>
                                        Initialize Prompter
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
});

export default MobileTeleprompterSheet;
