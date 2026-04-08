"use client";

import React from "react";
import { MobileHomeBottomNav } from "./MobileHomeBottomNav";

interface MobileHomePageProps {
  hostName?: string;
  storeHandle?: string;

  onGoToPreLive: () => void;
  onStartRecording: () => void;
  onStartRehearsal: () => void;

  onOpenCampaigns: () => void;
  onOpenProducts: () => void;
  onOpenSettings: () => void;
  onOpenAnalytics: () => void;

  onGoHome: () => void;
  onOpenVideos: () => void;
  onOpenProfile: () => void;
  onOpenMore: () => void;

  darkMode?: boolean;
  activeTab?: "home" | "videos" | "campaigns" | "profile" | "settings" | "more";
}

export function MobileHomePage({
  hostName = "Studio Host",
  storeHandle = "yourstore",

  onGoToPreLive,
  onStartRecording,
  onStartRehearsal,

  onOpenCampaigns,
  onOpenProducts,
  onOpenSettings,
  onOpenAnalytics,

  onGoHome,
  onOpenVideos,
  onOpenProfile,
  onOpenMore,

  darkMode = true,
  activeTab = "home",
}: MobileHomePageProps) {
  return (
    <div className={`absolute inset-0 ${darkMode ? "bg-[#07070a]" : "bg-slate-50"} overflow-hidden`}>
      {/* Subtle background glow (TikTok-ish) */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-[#f77f00]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />

      {/* Scrollable content */}
      <div className="absolute inset-0 overflow-y-auto pb-28">
        {/* Header */}
        <div className="px-4 pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#f77f00] to-orange-600 flex items-center justify-center shadow-[0_10px_30px_rgba(247,127,0,0.25)]">
                <img
                  src="/assets/logos/evlogo.png"
                  alt="LiveDealz"
                  className="w-7 h-7 object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className={`text-[11px] font-black tracking-[0.2em] uppercase ${darkMode ? "text-white/40" : "text-slate-500"}`}>
                  Studio
                </p>
                <h1 className={`text-[18px] font-black leading-tight truncate ${darkMode ? "text-white" : "text-slate-900"}`}>
                  {hostName}
                </h1>
                <p className={`text-[12px] truncate ${darkMode ? "text-white/55" : "text-slate-500"}`}>
                  @{storeHandle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAnalytics}
                className={`h-11 w-11 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${darkMode ? "bg-white/10 text-white" : "bg-white border border-slate-200 text-slate-700"}`}
                aria-label="Open analytics"
              >
                <span className="material-icons text-[20px]">insights</span>
              </button>
              <button
                onClick={onOpenSettings}
                className={`h-11 w-11 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${darkMode ? "bg-white/10 text-white" : "bg-white border border-slate-200 text-slate-700"}`}
                aria-label="Open settings"
              >
                <span className="material-icons text-[20px]">tune</span>
              </button>
            </div>
          </div>

          {/* Quick stats (placeholder) */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <StatCard label="Followers" value="12.5K" darkMode={darkMode} />
            <StatCard label="Avg Viewers" value="842" darkMode={darkMode} />
            <StatCard label="Sales Today" value="$0" darkMode={darkMode} />
          </div>
        </div>

        {/* Primary CTA */}
        <div className="px-4 mt-5">
          <div
            className={`
              rounded-3xl p-4 border relative overflow-hidden
              ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}
            `}
          >
            <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-red-500/20 blur-2xl" />

            <p className={`text-[11px] font-black tracking-[0.2em] uppercase ${darkMode ? "text-white/40" : "text-slate-500"}`}>
              Start here
            </p>
            <h2 className={`mt-1 text-[20px] font-black leading-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
              Go live and sell in real time
            </h2>
            <p className={`mt-2 text-[13px] leading-snug ${darkMode ? "text-white/60" : "text-slate-600"}`}>
              Set up your products, rehearse the script, then hit Live when you’re ready.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <PrimaryAction
                title="Go Live"
                subtitle="Pre-live setup"
                icon="wifi_tethering"
                tone="live"
                onClick={onGoToPreLive}
              />
              <PrimaryAction
                title="Rehearsal"
                subtitle="Practice run"
                icon="sports_esports"
                tone="rehearsal"
                onClick={onStartRehearsal}
              />
              <PrimaryAction
                title="Record"
                subtitle="Create clip"
                icon="radio_button_checked"
                tone="record"
                onClick={onStartRecording}
              />
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between">
            <p className={`text-[11px] font-black tracking-[0.2em] uppercase ${darkMode ? "text-white/40" : "text-slate-500"}`}>
              Workspace
            </p>
            <button
              onClick={onOpenMore}
              className={`text-[12px] font-bold ${darkMode ? "text-white/60" : "text-slate-600"}`}
            >
              See all
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Tile
              title="Products"
              subtitle="Pin + flash deals"
              icon="inventory_2"
              onClick={onOpenProducts}
              darkMode={darkMode}
            />
            <Tile
              title="Campaigns"
              subtitle="Scripts + sessions"
              icon="campaign"
              onClick={onOpenCampaigns}
              darkMode={darkMode}
            />
            <Tile
              title="Videos"
              subtitle="Replays + clips"
              icon="video_library"
              onClick={onOpenVideos}
              darkMode={darkMode}
            />
            <Tile
              title="Profile"
              subtitle="Store identity"
              icon="person"
              onClick={onOpenProfile}
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* Recent */}
        <div className="px-4 mt-6">
          <p className={`text-[11px] font-black tracking-[0.2em] uppercase ${darkMode ? "text-white/40" : "text-slate-500"}`}>
            Recent
          </p>
          <div className={`mt-3 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}>
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-white/10" : "bg-slate-100"}`}>
                  <span className={`material-icons text-[20px] ${darkMode ? "text-white/70" : "text-slate-600"}`}>history</span>
                </div>
                <div className="min-w-0">
                  <p className={`text-[13px] font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                    No sessions yet
                  </p>
                  <p className={`text-[12px] ${darkMode ? "text-white/55" : "text-slate-600"}`}>
                    Your live replays and recordings will show here.
                  </p>
                </div>
              </div>
              <button
                onClick={onGoToPreLive}
                className={`px-3 py-2 rounded-xl text-[12px] font-black active:scale-95 transition-all ${darkMode ? "bg-white/10 text-white" : "bg-slate-100 text-slate-800"}`}
              >
                Start
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <MobileHomeBottomNav
        darkMode={darkMode}
        activeTab={activeTab}
        onGoHome={onGoHome}
        onOpenVideos={onOpenVideos}
        onOpenCampaigns={onOpenCampaigns}
        onOpenProfile={onOpenProfile}
        onOpenSettings={onOpenSettings}
        onOpenMore={onOpenMore}
      />
    </div>
  );
}

export default MobileHomePage;

function StatCard({ label, value, darkMode }: { label: string; value: string; darkMode: boolean }) {
  return (
    <div className={`rounded-2xl px-3 py-3 border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}>
      <p className={`text-[16px] font-black tabular-nums ${darkMode ? "text-white" : "text-slate-900"}`}>{value}</p>
      <p className={`mt-0.5 text-[10px] font-bold tracking-wider uppercase ${darkMode ? "text-white/40" : "text-slate-500"}`}>{label}</p>
    </div>
  );
}

function PrimaryAction({
  title,
  subtitle,
  icon,
  tone,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: string;
  tone: "live" | "rehearsal" | "record";
  onClick: () => void;
}) {
  const toneClass =
    tone === "live"
      ? "from-red-500 to-rose-600 shadow-red-500/25"
      : tone === "record"
        ? "from-indigo-500 to-violet-600 shadow-indigo-500/25"
        : "from-amber-500 to-orange-600 shadow-amber-500/25";

  return (
    <button
      onClick={onClick}
      className={`relative rounded-2xl p-3 text-left bg-gradient-to-br ${toneClass} shadow-lg active:scale-95 transition-all`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-white text-[13px] font-black leading-tight">{title}</p>
          <p className="text-white/70 text-[10px] font-bold tracking-wider uppercase mt-1">{subtitle}</p>
        </div>
        <span className="material-icons text-white/90 text-[22px]">{icon}</span>
      </div>
    </button>
  );
}

function Tile({
  title,
  subtitle,
  icon,
  onClick,
  darkMode,
}: {
  title: string;
  subtitle: string;
  icon: string;
  onClick: () => void;
  darkMode: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        rounded-2xl p-4 text-left border active:scale-[0.99] transition-all
        ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`text-[14px] font-black ${darkMode ? "text-white" : "text-slate-900"}`}>{title}</p>
          <p className={`mt-1 text-[12px] ${darkMode ? "text-white/55" : "text-slate-600"}`}>{subtitle}</p>
        </div>
        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${darkMode ? "bg-white/10" : "bg-slate-100"}`}>
          <span className={`material-icons text-[20px] ${darkMode ? "text-white/70" : "text-slate-700"}`}>{icon}</span>
        </div>
      </div>
    </button>
  );
}

