"use client";

import React, { memo, useMemo } from "react";
import type { LiveGuest, LiveGuestLayout } from "./LiveTogetherSheet";

type Props = {
  guests: LiveGuest[];
  layout: LiveGuestLayout;
  pinnedGuestId: string | null;
  onPin: (guestId: string | null) => void;
  maxGuests?: number;
  onOpenCoHosts?: () => void;
  darkMode?: boolean;
};

export const LiveGuestsOverlay = memo(function LiveGuestsOverlay({
  guests,
  layout,
  pinnedGuestId,
  onPin,
  maxGuests = 5,
  onOpenCoHosts,
  darkMode = true,
}: Props) {
  const onStage = useMemo(() => guests.filter((g) => g.isOnStage && g.status === "joined"), [guests]);
  if (onStage.length === 0) return null;

  const pinned = onStage.find((g) => g.id === pinnedGuestId) ?? null;
  const isPinnedLayout = layout === "pinned" && pinned;
  const maxTiles = layout === "grid" ? 6 : 3;
  const tiles = (() => {
    if (!isPinnedLayout) return onStage.slice(0, maxTiles);
    const rest = onStage.filter((g) => g.id !== pinned!.id).slice(0, maxTiles - 1);
    return [pinned!, ...rest];
  })();

  const cols = layout === "grid" ? 2 : 1;
  const tileSize = layout === "grid" ? "sm" : "md";
  const seatsLeft = Math.max(0, maxGuests - onStage.length);

  return (
    <div className="absolute top-[calc(env(safe-area-inset-top,0px)+70px)] right-3 bottom-28 z-30 pointer-events-auto">
      <div className="h-full flex flex-col items-end">
        <div className={`grid gap-2 ${cols === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {tiles.map((g, idx) => {
            const isPinned = pinnedGuestId === g.id;
            const size = isPinnedLayout && idx === 0 ? "lg" : tileSize;
            return (
              <GuestPreviewTile
                key={g.id}
                guest={g}
                size={size}
                pinned={isPinned}
                onClick={() => onPin(isPinned ? null : g.id)}
              />
            );
          })}

          {seatsLeft > 0 && onOpenCoHosts && (
            <AddGuestTile cols={cols} onClick={onOpenCoHosts} />
          )}

          {onStage.length > tiles.length && (
            <MoreTile count={onStage.length - tiles.length} />
          )}
        </div>
      </div>
    </div>
  );
});

export default LiveGuestsOverlay;

function GuestPreviewTile({
  guest,
  size,
  pinned,
  onClick,
}: {
  guest: LiveGuest;
  size: "sm" | "md" | "lg";
  pinned: boolean;
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

  const sizeClass =
    size === "lg"
      ? "w-[96px] h-[140px]"
      : size === "md"
        ? "w-[86px] h-[124px]"
        : "w-[76px] h-[110px]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative ${sizeClass} rounded-2xl overflow-hidden active:scale-[0.99] transition-transform ring-1 shadow-[0_10px_30px_rgba(0,0,0,0.55)] ${
        pinned ? "ring-[#FF5C00]" : "ring-white/25"
      }`}
      aria-label={`Guest ${guest.name}`}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`h-11 w-11 rounded-full bg-gradient-to-br ${avatarGradients[nameHash]} flex items-center justify-center text-white text-[14px] font-black shadow-lg`}
        >
          {guest.name.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="absolute top-2 left-2 flex items-center gap-1">
        <span className={`h-2 w-2 rounded-full ${guest.videoOn ? "bg-emerald-400" : "bg-white/60"}`} />
        {pinned && <span className="material-icons text-white text-[16px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">push_pin</span>}
      </div>

      <div className="absolute top-2 right-2 flex items-center gap-1">
        {guest.isMuted && <span className="material-icons text-white text-[16px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">mic_off</span>}
        {!guest.videoOn && <span className="material-icons text-white text-[16px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">videocam_off</span>}
      </div>

      <div className="absolute left-2 right-2 bottom-2">
        <div className="text-white text-[10px] font-black truncate" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.85)" }}>
          {guest.name}
        </div>
      </div>
    </button>
  );
}

function MoreTile({ count }: { count: number }) {
  return (
    <div
      className="w-[76px] h-[52px] rounded-2xl ring-1 ring-white/25 shadow-[0_10px_30px_rgba(0,0,0,0.55)] flex items-center justify-center"
      aria-label={`${count} more guests`}
    >
      <span className="text-white text-[12px] font-black" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.85)" }}>
        +{count}
      </span>
    </div>
  );
}

function AddGuestTile({ cols, onClick }: { cols: number; onClick: () => void }) {
  const sizeClass = cols === 2 ? "w-[76px] h-[110px]" : "w-[86px] h-[124px]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative ${sizeClass} rounded-2xl overflow-hidden active:scale-[0.99] transition-transform ring-1 ring-white/25 shadow-[0_10px_30px_rgba(0,0,0,0.55)] flex items-center justify-center`}
      aria-label="Add co-host"
    >
      <div className="flex flex-col items-center gap-1">
        <span className="material-icons text-white text-[26px]" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.85)" }}>
          add
        </span>
        <span className="text-white text-[10px] font-black uppercase tracking-widest" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.85)" }}>
          Invite
        </span>
      </div>
    </button>
  );
}
