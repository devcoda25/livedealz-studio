"use client";

import React from "react";
import { Campaign, CampaignSession } from "./types";

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  currentSession: CampaignSession | null;
  onSelectCampaign: (campaign: Campaign) => void;
  onSelectSession: (session: CampaignSession) => void;
}

export function CampaignModal({
  isOpen,
  onClose,
  campaigns,
  currentCampaign,
  currentSession,
  onSelectCampaign,
  onSelectSession,
}: CampaignModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="material-icons text-amber-500">campaign</span>
            <h2 className="text-sm font-semibold text-foreground">My Campaigns</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted"
          >
            <span className="material-icons text-[18px] text-muted-foreground">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No campaigns yet. Create one in the seller platform.
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className={`rounded-xl border p-3 cursor-pointer transition-all ${
                    currentCampaign?.id === campaign.id
                      ? "border-amber-500/50 bg-amber-500/10"
                      : "border-border hover:border-amber-500/30 hover:bg-muted/30"
                  }`}
                  onClick={() => onSelectCampaign(campaign)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-foreground text-sm">{campaign.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{campaign.description}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {campaign.sessions.length} session{campaign.sessions.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    {currentCampaign?.id === campaign.id && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-medium">
                        Selected
                      </span>
                    )}
                  </div>

                  {/* Sessions */}
                  {currentCampaign?.id === campaign.id && campaign.sessions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Select Session
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {campaign.sessions.map((session) => (
                          <button
                            key={session.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSession(session);
                            }}
                            className={`p-2 rounded-lg border text-left transition-all ${
                              currentSession?.id === session.id
                                ? "border-amber-500 bg-amber-500/10"
                                : "border-border hover:border-amber-500/30"
                            }`}
                          >
                            <div className="text-[11px] font-medium text-foreground">{session.name}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {session.description || `${Math.floor(session.duration / 3600)}h`}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-muted/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            disabled={!currentSession}
            className="px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Load Session
          </button>
        </div>
      </div>
    </div>
  );
}