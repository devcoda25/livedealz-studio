"use client";

import React, { memo, useMemo } from "react";
import type { LiveGuest, LiveGuestLayout } from "./LiveTogetherSheet";

type Props = {
  guests: LiveGuest[];
  layout: LiveGuestLayout;
  pinnedGuestId: string | null;
  onPin: (guestId: string | null) => void;
  darkMode?: boolean;
};

export const LiveGuestsOverlay = memo(function LiveGuestsOverlay({
  guests,
  layout,
  pinnedGuestId,
  onPin,
  darkMode = true,
}: Props) {
  const onStage = useMemo(() => guests.filter((g) => g.isOnStage && g.status === "joined"), [guests]);
  if (onStage.length === 0) return null;

  const pinned = layout === "pinned" ? onStage.find((g) => g.id === pinnedGuestId) ?? onStage[0] : null;
  const rest = layout === "pinned" && pinned ? onStage.filter((g) => g.id !== pinned.id) : onStage;

  return (
    <div className="absolute top-[calc(env(safe-area-inset-top,0px)+66px)] left-4 right-4 z-30 pointer-events-auto">
      <div className={`rounded-3xl border shadow-2xl overflow-hidden ${darkMode ? "bg-black/35 border-white/10" : "bg-white/80 border-slate-200"}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className={`material-icons ${darkMode ? "text-white/70" : "text-slate-700"} text-[18px]`}>group</span>
            <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[12px] font-black`}>{onStage.length} guest{onStage.length === 1 ? "" : "s"}</span>
          </div>
          <div className={`${darkMode ? "text-white/45" : "text-slate-500"} text-[11px] font-bold uppercase tracking-wide`}>
            {layout}
          </div>
        </div>

        {layout === "panel" && (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-2">
              {onStage.slice(0, 3).map((g) => (
                <GuestTile
                  key={g.id}
                  guest={g}
                  active={false}
                  darkMode={darkMode}
                  onClick={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {layout === "grid" && (
          <div className="px-4 pb-4">
            <div className={`grid gap-2 ${onStage.length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
              {onStage.slice(0, 5).map((g) => (
                <GuestTile
                  key={g.id}
                  guest={g}
                  active={false}
                  darkMode={darkMode}
                  onClick={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {layout === "pinned" && pinned && (
          <div className="px-4 pb-4">
            <button
              type="button"
              onClick={() => onPin(pinnedGuestId === pinned.id ? null : pinned.id)}
              className="w-full text-left"
              aria-label="Toggle pinned guest"
            >
              <div className={`p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className={`${darkMode ? "text-white" : "text-slate-900"} text-[13px] font-black truncate`}>{pinned.name}</p>
                    <p className={`${darkMode ? "text-white/45" : "text-slate-500"} text-[12px]`}>Pinned</p>
                  </div>
                  <span className={`material-icons ${darkMode ? "text-[#FF5C00]" : "text-[#FF5C00]"} text-[18px]`}>push_pin</span>
                </div>
              </div>
            </button>

            {rest.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {rest.slice(0, 3).map((g) => (
                  <GuestTile
                    key={g.id}
                    guest={g}
                    active={pinnedGuestId === g.id}
                    darkMode={darkMode}
                    onClick={() => onPin(pinnedGuestId === g.id ? null : g.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

function GuestTile({
  guest,
  active,
  darkMode,
  onClick,
}: {
  guest: LiveGuest;
  active: boolean;
  darkMode: boolean;
  onClick: () => void;
}) {
  const nameHash = guest.name.charCodeAt(0) % 6;
  const avatarGradients = [
    "from-pink-500 to-rose-600",
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-amber-400 to-orange-500",
    "from-fuchsia-500 to-purple-600",
  ];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-3 rounded-2xl border flex items-center gap-3 active:scale-[0.99] transition-transform ${
        active
          ? "bg-[#FF5C00]/10 border-[#FF5C00]/30"
          : darkMode
            ? "bg-black/20 border-white/10"
            : "bg-white border-slate-200"
      }`}
      aria-label={`Guest ${guest.name}`}
    >
      <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${avatarGradients[nameHash]} flex items-center justify-center text-white text-[12px] font-black shadow-lg`}>
        {guest.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 text-left">
        <p className={`${darkMode ? "text-white" : "text-slate-900"} text-[12px] font-black truncate`}>{guest.name}</p>
        <div className="flex items-center gap-2">
          {guest.isMuted && <span className="material-icons text-[14px] text-white/60">mic_off</span>}
          {!guest.videoOn && <span className="material-icons text-[14px] text-white/60">videocam_off</span>}
        </div>
      </div>
    </button>
  );
}

export default LiveGuestsOverlay;

