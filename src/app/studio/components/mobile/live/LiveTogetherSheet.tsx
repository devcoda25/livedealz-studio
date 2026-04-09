"use client";

import React, { useMemo, useState } from "react";

export type LiveGuestStatus = "requested" | "invited" | "connecting" | "joined";
export type LiveGuestLayout = "grid" | "panel" | "pinned";

export type LiveGuest = {
  id: string;
  name: string;
  status: LiveGuestStatus;
  isOnStage: boolean;
  isMuted: boolean;
  videoOn: boolean;
};

export type LiveGuestRequest = {
  id: string;
  name: string;
  requestedAt: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  darkMode?: boolean;

  // Requests
  requests: LiveGuestRequest[];
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  onSimulateRequest?: () => void;

  // Guests
  guests: LiveGuest[];
  maxGuests: number;
  onInvite: (name: string) => void;
  onCancelInvite: (guestId: string) => void;
  onKick: (guestId: string) => void;
  onToggleStage: (guestId: string) => void;
  onToggleMute: (guestId: string) => void;
  onToggleVideo: (guestId: string) => void;

  // Layout
  layout: LiveGuestLayout;
  onSetLayout: (layout: LiveGuestLayout) => void;
  pinnedGuestId: string | null;
  onPin: (guestId: string | null) => void;
};

export function LiveTogetherSheet({
  open,
  onClose,
  darkMode = true,

  requests,
  onAcceptRequest,
  onDeclineRequest,
  onSimulateRequest,

  guests,
  maxGuests,
  onInvite,
  onCancelInvite,
  onKick,
  onToggleStage,
  onToggleMute,
  onToggleVideo,

  layout,
  onSetLayout,
  pinnedGuestId,
  onPin,
}: Props) {
  const [tab, setTab] = useState<"stage" | "requests" | "invite" | "layout">("stage");
  const [inviteName, setInviteName] = useState("");

  const onStage = useMemo(() => guests.filter((g) => g.isOnStage), [guests]);
  const joined = useMemo(() => guests.filter((g) => g.status === "joined"), [guests]);
  const pending = useMemo(() => guests.filter((g) => g.status !== "joined"), [guests]);

  const canAddMoreToStage = onStage.length < maxGuests;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] pointer-events-auto">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close LIVE Together"
        onClick={onClose}
      />

      <div
        className={`absolute left-0 right-0 bottom-0 max-h-[80vh] rounded-t-[28px] border-t border-white/10 shadow-2xl ${
          darkMode ? "bg-slate-950" : "bg-white"
        }`}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className={`w-10 h-1 rounded-full ${darkMode ? "bg-white/15" : "bg-slate-300"}`} />
        </div>

        <div className="px-5 pb-3 flex items-center justify-between">
          <div className="min-w-0">
            <p className={`${darkMode ? "text-white" : "text-slate-900"} text-[16px] font-black`}>LIVE Together</p>
            <p className={`${darkMode ? "text-white/45" : "text-slate-500"} text-[12px]`}>
              Add guests, manage requests, and choose a layout.
            </p>
          </div>
          <button
            onClick={onClose}
            className={`h-10 w-10 rounded-full flex items-center justify-center border ${
              darkMode ? "bg-white/5 border-white/10 text-white/80" : "bg-slate-50 border-slate-200 text-slate-600"
            } active:scale-95 transition-transform`}
            aria-label="Close"
            type="button"
          >
            <span className="material-icons text-[18px]">close</span>
          </button>
        </div>

        <div className="px-5 pb-3">
          <div className={`p-1 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
            <div className="grid grid-cols-4 gap-1">
              <SegTab active={tab === "stage"} label="On stage" onClick={() => setTab("stage")} darkMode={darkMode} />
              <SegTab
                active={tab === "requests"}
                label={`Requests${requests.length ? ` (${requests.length})` : ""}`}
                onClick={() => setTab("requests")}
                darkMode={darkMode}
              />
              <SegTab active={tab === "invite"} label="Invite" onClick={() => setTab("invite")} darkMode={darkMode} />
              <SegTab active={tab === "layout"} label="Layout" onClick={() => setTab("layout")} darkMode={darkMode} />
            </div>
          </div>
        </div>

        <div className="px-5 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] overflow-y-auto max-h-[calc(80vh-148px)]">
          {tab === "stage" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className={`${darkMode ? "text-white/70" : "text-slate-600"} text-[11px] font-black tracking-[0.2em] uppercase`}>
                  Stage
                </p>
                <p className={`${darkMode ? "text-white/45" : "text-slate-500"} text-[12px] font-semibold`}>
                  {onStage.length}/{maxGuests} guests
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <StageCard
                  title="You"
                  subtitle="Host"
                  status="onstage"
                  darkMode={darkMode}
                  right={<span className="material-icons text-[18px] text-white/70">verified</span>}
                />
                {Array.from({ length: Math.max(0, maxGuests) }).map((_, idx) => {
                  const guest = onStage[idx];
                  if (!guest) {
                    return (
                      <button
                        key={`empty-${idx}`}
                        type="button"
                        onClick={() => setTab("requests")}
                        className={`p-4 rounded-2xl border text-left active:scale-[0.99] transition-transform ${
                          darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
                        }`}
                        aria-label="Empty seat"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`${darkMode ? "text-white" : "text-slate-900"} text-[13px] font-black`}>Empty seat</p>
                            <p className={`${darkMode ? "text-white/45" : "text-slate-500"} text-[12px]`}>Accept a request</p>
                          </div>
                          <span className={`material-icons ${darkMode ? "text-white/60" : "text-slate-500"} text-[20px]`}>
                            person_add
                          </span>
                        </div>
                      </button>
                    );
                  }

                  return (
                    <StageCard
                      key={guest.id}
                      title={guest.name}
                      subtitle="Guest"
                      status={guest.status === "joined" ? "onstage" : guest.status}
                      darkMode={darkMode}
                      right={
                        <div className="flex items-center gap-2">
                          <MiniIconButton
                            icon={guest.isMuted ? "mic_off" : "mic"}
                            label={guest.isMuted ? "Unmute" : "Mute"}
                            onClick={() => onToggleMute(guest.id)}
                            darkMode={darkMode}
                          />
                          <MiniIconButton
                            icon="close"
                            label="Remove from stage"
                            onClick={() => onToggleStage(guest.id)}
                            darkMode={darkMode}
                          />
                        </div>
                      }
                    />
                  );
                })}
              </div>

              <div className={`p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                <p className={`${darkMode ? "text-white" : "text-slate-900"} text-[13px] font-black`}>Guests in room</p>
                <p className={`${darkMode ? "text-white/45" : "text-slate-500"} text-[12px] mt-1`}>
                  Invite or accept requests, then add guests to the stage.
                </p>

                <div className="mt-3 space-y-2">
                  {joined.length === 0 && pending.length === 0 ? (
                    <div className={`${darkMode ? "text-white/45" : "text-slate-500"} text-[12px] py-2`}>
                      No guests yet.
                    </div>
                  ) : (
                    <>
                      {pending.map((g) => (
                        <GuestRow
                          key={g.id}
                          guest={g}
                          darkMode={darkMode}
                          onPrimary={() => onCancelInvite(g.id)}
                          primaryLabel="Cancel"
                          onSecondary={() => onKick(g.id)}
                          secondaryLabel="Remove"
                        />
                      ))}
                      {joined.map((g) => (
                        <GuestRow
                          key={g.id}
                          guest={g}
                          darkMode={darkMode}
                          onPrimary={() => onToggleStage(g.id)}
                          primaryLabel={g.isOnStage ? "Remove" : canAddMoreToStage ? "Add" : "Full"}
                          primaryDisabled={!g.isOnStage && !canAddMoreToStage}
                          onSecondary={() => onKick(g.id)}
                          secondaryLabel="Kick"
                        />
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "requests" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className={`${darkMode ? "text-white/70" : "text-slate-600"} text-[11px] font-black tracking-[0.2em] uppercase`}>
                  Requests
                </p>
                {onSimulateRequest && (
                  <button
                    type="button"
                    onClick={onSimulateRequest}
                    className={`px-3 py-2 rounded-xl text-[12px] font-black active:scale-95 transition-transform ${
                      darkMode ? "bg-white/10 text-white" : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    Simulate
                  </button>
                )}
              </div>

              {requests.length === 0 ? (
                <div className={`p-5 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}>
                  <p className={`${darkMode ? "text-white" : "text-slate-900"} text-[13px] font-black`}>No requests</p>
                  <p className={`${darkMode ? "text-white/45" : "text-slate-500"} text-[12px] mt-1`}>
                    When viewers request to join, they’ll appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {requests.map((r) => (
                    <div
                      key={r.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                        darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={`${darkMode ? "text-white" : "text-slate-900"} text-[13px] font-black truncate`}>{r.name}</p>
                        <p className={`${darkMode ? "text-white/45" : "text-slate-500"} text-[12px]`}>Wants to join</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onDeclineRequest(r.id)}
                          className={`h-10 w-10 rounded-xl border flex items-center justify-center active:scale-95 transition-transform ${
                            darkMode ? "bg-white/5 border-white/10 text-white/80" : "bg-slate-50 border-slate-200 text-slate-600"
                          }`}
                          aria-label="Decline"
                        >
                          <span className="material-icons text-[18px]">close</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onAcceptRequest(r.id)}
                          className="h-10 px-4 rounded-xl bg-[#FF5C00] text-white text-[12px] font-black active:scale-95 transition-transform"
                          aria-label="Accept"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "invite" && (
            <div className="space-y-3">
              <p className={`${darkMode ? "text-white/70" : "text-slate-600"} text-[11px] font-black tracking-[0.2em] uppercase`}>
                Invite
              </p>
              <div className={`p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}>
                <div className="flex gap-2">
                  <input
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Enter viewer name…"
                    className={`flex-1 px-4 py-3 rounded-2xl border outline-none text-[13px] ${
                      darkMode
                        ? "bg-black/20 border-white/10 text-white placeholder:text-white/35"
                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && inviteName.trim()) {
                        onInvite(inviteName.trim());
                        setInviteName("");
                        setTab("stage");
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!inviteName.trim()) return;
                      onInvite(inviteName.trim());
                      setInviteName("");
                      setTab("stage");
                    }}
                    className="px-4 rounded-2xl bg-[#FF5C00] text-white text-[12px] font-black active:scale-95 transition-transform"
                  >
                    Invite
                  </button>
                </div>
                <p className={`${darkMode ? "text-white/45" : "text-slate-500"} text-[12px] mt-3`}>
                  Invited guests appear in “Guests in room” once they accept.
                </p>
              </div>
            </div>
          )}

          {tab === "layout" && (
            <div className="space-y-3">
              <p className={`${darkMode ? "text-white/70" : "text-slate-600"} text-[11px] font-black tracking-[0.2em] uppercase`}>
                Layout
              </p>

              <div className="grid grid-cols-3 gap-2">
                <LayoutCard name="Grid" active={layout === "grid"} onClick={() => onSetLayout("grid")} darkMode={darkMode} />
                <LayoutCard name="Panel" active={layout === "panel"} onClick={() => onSetLayout("panel")} darkMode={darkMode} />
                <LayoutCard
                  name="Pinned"
                  active={layout === "pinned"}
                  onClick={() => onSetLayout("pinned")}
                  darkMode={darkMode}
                />
              </div>

              {layout === "pinned" && (
                <div className={`p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}>
                  <p className={`${darkMode ? "text-white" : "text-slate-900"} text-[13px] font-black`}>Pinned guest</p>
                  <p className={`${darkMode ? "text-white/45" : "text-slate-500"} text-[12px] mt-1`}>
                    Tap a guest to pin or unpin.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {joined.filter((g) => g.isOnStage).map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => onPin(pinnedGuestId === g.id ? null : g.id)}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 active:scale-[0.99] transition-transform ${
                          darkMode ? "bg-black/20 border-white/10" : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <span className={`${darkMode ? "text-white" : "text-slate-900"} text-[12px] font-black truncate`}>{g.name}</span>
                        <span className={`material-icons ${pinnedGuestId === g.id ? "text-[#FF5C00]" : darkMode ? "text-white/45" : "text-slate-500"} text-[18px]`}>
                          push_pin
                        </span>
                      </button>
                    ))}
                    {joined.filter((g) => g.isOnStage).length === 0 && (
                      <div className={`${darkMode ? "text-white/45" : "text-slate-500"} text-[12px]`}>
                        Add a guest to stage first.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className={`p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                <p className={`${darkMode ? "text-white" : "text-slate-900"} text-[13px] font-black`}>Controls</p>
                <p className={`${darkMode ? "text-white/45" : "text-slate-500"} text-[12px] mt-1`}>
                  Mute, video, kick, and stage placement are managed per guest in the “On stage” tab.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SegTab({
  active,
  label,
  onClick,
  darkMode,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  darkMode: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-xl text-[11px] font-black tracking-wide active:scale-95 transition-transform ${
        active
          ? darkMode
            ? "bg-white/10 text-white border border-white/10"
            : "bg-white text-slate-900 border border-slate-200"
          : darkMode
            ? "text-white/60"
            : "text-slate-600"
      }`}
    >
      {label}
    </button>
  );
}

function LayoutCard({ name, active, onClick, darkMode }: { name: string; active: boolean; onClick: () => void; darkMode: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-2xl border text-left active:scale-[0.99] transition-transform ${
        active
          ? "bg-[#FF5C00]/10 border-[#FF5C00]/30"
          : darkMode
            ? "bg-white/5 border-white/10"
            : "bg-white border-slate-200"
      }`}
    >
      <p className={`${darkMode ? "text-white" : "text-slate-900"} text-[13px] font-black`}>{name}</p>
      <p className={`${darkMode ? "text-white/45" : "text-slate-500"} text-[12px] mt-1`}>{active ? "Selected" : "Tap to select"}</p>
    </button>
  );
}

function StageCard({
  title,
  subtitle,
  status,
  right,
  darkMode,
}: {
  title: string;
  subtitle: string;
  status: "onstage" | LiveGuestStatus;
  right?: React.ReactNode;
  darkMode: boolean;
}) {
  const statusLabel =
    status === "onstage" ? "On stage" : status === "connecting" ? "Connecting…" : status === "invited" ? "Invited" : "Requested";

  return (
    <div className={`p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`${darkMode ? "text-white" : "text-slate-900"} text-[13px] font-black truncate`}>{title}</p>
          <p className={`${darkMode ? "text-white/50" : "text-slate-500"} text-[12px]`}>{subtitle}</p>
          <p className={`${darkMode ? "text-white/45" : "text-slate-500"} text-[11px] mt-1`}>{statusLabel}</p>
        </div>
        {right}
      </div>
    </div>
  );
}

function GuestRow({
  guest,
  darkMode,
  onPrimary,
  primaryLabel,
  primaryDisabled,
  onSecondary,
  secondaryLabel,
}: {
  guest: LiveGuest;
  darkMode: boolean;
  onPrimary: () => void;
  primaryLabel: string;
  primaryDisabled?: boolean;
  onSecondary: () => void;
  secondaryLabel: string;
}) {
  return (
    <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${darkMode ? "bg-black/20 border-white/10" : "bg-white border-slate-200"}`}>
      <div className="min-w-0">
        <p className={`${darkMode ? "text-white" : "text-slate-900"} text-[13px] font-black truncate`}>{guest.name}</p>
        <p className={`${darkMode ? "text-white/45" : "text-slate-500"} text-[12px]`}>
          {guest.status === "invited" ? "Invited…" : guest.status === "connecting" ? "Connecting…" : guest.isOnStage ? "On stage" : "Joined"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled}
          className={`h-10 px-4 rounded-xl text-[12px] font-black active:scale-95 transition-transform disabled:opacity-40 ${
            guest.isOnStage && primaryLabel === "Remove" ? (darkMode ? "bg-white/10 text-white" : "bg-slate-100 text-slate-800") : "bg-[#FF5C00] text-white"
          }`}
        >
          {primaryLabel}
        </button>
        <button
          type="button"
          onClick={onSecondary}
          className={`h-10 w-10 rounded-xl border flex items-center justify-center active:scale-95 transition-transform ${
            darkMode ? "bg-white/5 border-white/10 text-white/80" : "bg-slate-50 border-slate-200 text-slate-600"
          }`}
          aria-label={secondaryLabel}
        >
          <span className="material-icons text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
}

function MiniIconButton({ icon, label, onClick, darkMode }: { icon: string; label: string; onClick: () => void; darkMode: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 w-9 rounded-xl border flex items-center justify-center active:scale-95 transition-transform ${
        darkMode ? "bg-black/20 border-white/10 text-white/80" : "bg-slate-50 border-slate-200 text-slate-700"
      }`}
      aria-label={label}
    >
      <span className="material-icons text-[18px]">{icon}</span>
    </button>
  );
}

export default LiveTogetherSheet;

