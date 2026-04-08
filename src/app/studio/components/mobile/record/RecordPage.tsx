"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { RECORD_EFFECTS } from "./recordEffects";

interface RecordPageProps {
  hostName?: string;
  isRecording: boolean;
  recordingTime: string;
  micOn: boolean;

  activeFilter: string;
  previewFilter?: string | null;

  onFlipCamera: () => void;
  onToggleMic: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;

  onSelectFilter: (filter: string) => void;
  onPreviewFilter: (filter: string) => void;
  onClearPreviewFilter: () => void;

  onGoBack: () => void;
  darkMode?: boolean;
}

export function RecordPage({
  hostName = "Studio Host",
  isRecording,
  recordingTime,
  micOn,
  activeFilter,
  previewFilter = null,

  onFlipCamera,
  onToggleMic,
  onStartRecording,
  onStopRecording,

  onSelectFilter,
  onPreviewFilter,
  onClearPreviewFilter,

  onGoBack,
  darkMode = true,
}: RecordPageProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingEffectId, setPendingEffectId] = useState<string>(previewFilter ?? activeFilter);
  const [locked, setLocked] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [lockProgress, setLockProgress] = useState(0);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const lockProgress01 = useRef(0);
  const lockedRef = useRef(false);

  const visibleEffectName = useMemo(() => {
    const id = previewFilter ?? activeFilter;
    return RECORD_EFFECTS.find((e) => e.id === id)?.name ?? "Normal";
  }, [activeFilter, previewFilter]);

  useEffect(() => {
    if (!isRecording) {
      setLocked(false);
      setPressing(false);
      pressStart.current = null;
      lockProgress01.current = 0;
      setLockProgress(0);
      lockedRef.current = false;
    }
  }, [isRecording]);

  useEffect(() => {
    setPendingEffectId(previewFilter ?? activeFilter);
  }, [activeFilter, previewFilter]);

  const lockThresholdPx = 64;

  const stopIfNotLocked = () => {
    if (!lockedRef.current) {
      onStopRecording();
    }
  };

  const handleRecordPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isRecording) {
      onStopRecording();
      return;
    }

    setFiltersOpen(false);
    onClearPreviewFilter();

    setPressing(true);
    setLocked(false);
    lockedRef.current = false;
    lockProgress01.current = 0;
    setLockProgress(0);
    pressStart.current = { x: e.clientX, y: e.clientY };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch { }

    onStartRecording();
  };

  const handleRecordPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!pressing || locked || !pressStart.current) return;
    const dx = e.clientX - pressStart.current.x;
    const dy = e.clientY - pressStart.current.y;

    // Only treat as a lock swipe if the gesture is mostly horizontal.
    if (Math.abs(dy) > 48) return;

    const movedLeft = Math.max(0, -dx);
    lockProgress01.current = Math.max(0, Math.min(1, movedLeft / lockThresholdPx));
    setLockProgress(lockProgress01.current);

    if (movedLeft >= lockThresholdPx) {
      setLocked(true);
      lockedRef.current = true;
    }
  };

  const handleRecordPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    setPressing(false);
    pressStart.current = null;
    lockProgress01.current = 0;
    setLockProgress(0);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch { }

    stopIfNotLocked();
  };

  const handleRecordPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    setPressing(false);
    pressStart.current = null;
    lockProgress01.current = 0;
    setLockProgress(0);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch { }

    stopIfNotLocked();
  };

  const openFilters = () => {
    if (isRecording) return;
    setPendingEffectId(previewFilter ?? activeFilter);
    onPreviewFilter(previewFilter ?? activeFilter);
    setFiltersOpen(true);
  };

  const closeFilters = () => {
    setFiltersOpen(false);
    onClearPreviewFilter();
  };

  const applyFilters = () => {
    onSelectFilter(pendingEffectId);
    setFiltersOpen(false);
    onClearPreviewFilter();
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Readability overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/55" />

      {/* Top controls (Snap-ish) */}
      <div className="pointer-events-auto absolute top-0 left-0 right-0 z-50 px-4 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-2">
            <TopIconButton icon="arrow_back" label="Back" onClick={onGoBack} />
            <TopIconButton icon="person" label="Profile" onClick={() => {}} />
            <TopIconButton icon="search" label="Search" onClick={() => {}} />
          </div>

          <div className="flex flex-col items-center">
            {isRecording ? (
              <div className="px-4 py-2 rounded-full bg-rose-600/85 backdrop-blur-md flex items-center gap-2 shadow-xl border border-rose-400/25">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span className="text-white font-black text-[13px] tabular-nums">{recordingTime}</span>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-black tracking-[0.25em] uppercase text-white/50">Record</p>
                <p className="text-[12px] font-bold text-white/80 truncate max-w-[180px]">{hostName}</p>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <TopIconButton icon="person_add" label="Invite" onClick={() => {}} />
            <TopIconButton icon="more_horiz" label="More" onClick={() => {}} />
          </div>
        </div>
      </div>

      {/* Right toolbar */}
      <div className="pointer-events-auto absolute right-3 top-[calc(env(safe-area-inset-top,0px)+76px)] z-50 flex flex-col items-center gap-3">
        <DockIconButton icon="flip_camera_ios" label="Flip camera" onClick={onFlipCamera} />
        <DockIconButton icon={micOn ? "mic" : "mic_off"} label={micOn ? "Mute mic" : "Unmute mic"} onClick={onToggleMic} />
        <DockIconButton icon="bolt" label="Flash" onClick={() => {}} />
        <DockIconButton icon="music_note" label="Sound" onClick={() => {}} />
        <DockIconButton icon="timer" label="Timer" onClick={() => {}} />
        <DockIconButton icon="auto_awesome" label="Filters" onClick={openFilters} active={filtersOpen} />
      </div>

      {/* Bottom controls */}
      <div className="pointer-events-auto absolute left-0 right-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="px-4">
          {/* Effect name + hint */}
          <div className="flex items-center justify-center pb-3">
            {!isRecording && (
              <button
                type="button"
                onClick={openFilters}
                className="px-4 py-2 rounded-full bg-black/35 backdrop-blur-md border border-white/10 shadow-xl active:scale-95 transition-transform"
                aria-label="Open filters"
              >
                <span className="text-white text-[12px] font-black tracking-wide">{visibleEffectName}</span>
                <span className="material-icons align-middle ml-2 text-white/75 text-[18px]">
                  tune
                </span>
              </button>
            )}
          </div>

          {/* Record button row */}
          <div className="flex items-end justify-between gap-3 pb-4">
            {/* Left quick action (gallery) */}
            <button
              type="button"
              className="h-12 w-12 rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              aria-label="Open gallery"
              onClick={() => {}}
              disabled={isRecording}
            >
              <span className="material-icons text-white text-[22px]">photo_library</span>
            </button>

            {/* Center: record button */}
            <div className="relative flex-shrink-0 flex flex-col items-center">
              {/* Lock pill (slide left) */}
              {(pressing || locked) && (
                <div className="absolute -left-[74px] top-1/2 -translate-y-1/2">
                  <div
                    className={`relative w-14 h-14 rounded-2xl backdrop-blur-md border shadow-xl flex items-center justify-center ${
                      locked ? "bg-white/15 border-white/25" : "bg-black/35 border-white/10"
                    }`}
                    aria-label={locked ? "Recording locked" : "Slide left to lock recording"}
                  >
                    <div className="absolute left-2 right-2 bottom-2 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-white/70" style={{ width: `${Math.round(lockProgress * 100)}%` }} />
                    </div>
                    <span className={`material-icons ${locked ? "text-white" : "text-white/70"} text-[22px]`}>
                      {locked ? "lock" : "lock_open"}
                    </span>
                  </div>
                </div>
              )}

              <button
                onPointerDown={handleRecordPointerDown}
                onPointerMove={handleRecordPointerMove}
                onPointerUp={handleRecordPointerUp}
                onPointerCancel={handleRecordPointerCancel}
                className="relative h-[92px] w-[92px] rounded-full flex items-center justify-center active:scale-95 transition-transform"
                style={{ touchAction: "none" }}
                aria-label={isRecording ? "Stop recording" : "Hold to record"}
                type="button"
              >
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-[6px] border-white/90 shadow-2xl" />

                {/* Subtle glow while recording */}
                {isRecording && <div className="absolute inset-[-12px] rounded-full bg-rose-500/15 blur-2xl" />}

                {/* Inner button */}
                <div
                  className={`relative h-[70px] w-[70px] rounded-full flex items-center justify-center transition-colors ${
                    isRecording ? "bg-white" : "bg-rose-600"
                  }`}
                >
                  {isRecording ? <div className="h-7 w-7 bg-rose-600 rounded-md" /> : <div className="h-5 w-5 rounded-full bg-white/15" />}
                </div>
              </button>

              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">
                  {isRecording ? (locked ? "Locked" : "Recording") : "Hold to record"}
                </span>
              </div>
            </div>

            {/* Right spacer (keeps record centered) */}
            <div className="h-12 w-12" aria-hidden="true" />
          </div>
        </div>

        <RecordBottomNav />
      </div>

      <FiltersSheet
        open={filtersOpen}
        activeEffectId={pendingEffectId}
        onClose={closeFilters}
        onPreview={(id) => {
          setPendingEffectId(id);
          onPreviewFilter(id);
        }}
        onApply={applyFilters}
      />
    </div>
  );
}

export default RecordPage;

function TopIconButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-10 w-10 rounded-2xl bg-black/35 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform border border-white/10 shadow-lg"
      aria-label={label}
      type="button"
    >
      <span className="material-icons text-white text-[20px]">{icon}</span>
    </button>
  );
}

function DockIconButton({
  icon,
  label,
  onClick,
  active = false,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button onClick={onClick} className="active:scale-95 transition-transform" aria-label={label} type="button">
      <div
        className={`h-11 w-11 rounded-2xl backdrop-blur-md border flex items-center justify-center shadow-lg ${
          active ? "bg-white/15 border-white/25" : "bg-black/35 border-white/10"
        }`}
      >
        <span className="material-icons text-white text-[22px]">{icon}</span>
      </div>
    </button>
  );
}

function RecordBottomNav() {
  const items = [
    { icon: "edit_square", label: "Create", active: false },
    { icon: "radio_button_checked", label: "Scan", active: true },
    { icon: "explore", label: "Browse", active: false },
    { icon: "grid_view", label: "Explore", active: false },
  ];

  return (
    <div className="px-6 pb-[calc(env(safe-area-inset-bottom,0px)+10px)]">
      <div className="flex items-end justify-between">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
            aria-label={item.label}
            onClick={() => {}}
          >
            <span className={`material-icons ${item.active ? "text-white" : "text-white/70"} text-[22px]`}>
              {item.icon}
            </span>
            <span className={`text-[11px] font-bold ${item.active ? "text-white" : "text-white/70"}`}>{item.label}</span>
            <span className={`mt-1 h-[3px] w-7 rounded-full ${item.active ? "bg-white" : "bg-transparent"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

function FiltersSheet({
  open,
  activeEffectId,
  onClose,
  onPreview,
  onApply,
}: {
  open: boolean;
  activeEffectId: string;
  onClose: () => void;
  onPreview: (id: string) => void;
  onApply: () => void;
}) {
  if (!open) return null;

  return (
    <div className="pointer-events-auto absolute inset-0 z-[80]">
      <button
        type="button"
        aria-label="Close filters"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
      />

      <div className="absolute left-0 right-0 bottom-0">
        <div className="mx-auto max-w-[520px] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
          <div className="rounded-t-[28px] bg-black/70 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-5 pt-4 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-10 rounded-full bg-white/20" />
                <span className="text-white/85 font-black tracking-wide text-[12px]">Filters</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-9 w-9 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Close"
              >
                <span className="material-icons text-white text-[20px]">close</span>
              </button>
            </div>

            <div className="px-5 pb-4">
              <div className="grid grid-cols-4 gap-3">
                {RECORD_EFFECTS.map((effect) => {
                  const selected = effect.id === activeEffectId;
                  return (
                    <button
                      key={effect.id}
                      type="button"
                      onClick={() => onPreview(effect.id)}
                      className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
                      aria-label={`Preview ${effect.name}`}
                    >
                      <div
                        className={`relative rounded-full bg-gradient-to-br ${effect.gradient} flex items-center justify-center shadow-lg h-14 w-14 ${
                          selected ? "ring-2 ring-white/90 ring-offset-2 ring-offset-black/70 scale-105" : "opacity-95"
                        }`}
                      >
                        <span className="material-icons text-white text-[22px]">{effect.icon}</span>
                      </div>
                      <span className={`text-[10px] font-black ${selected ? "text-white" : "text-white/70"}`}>
                        {effect.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-5 pb-5 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-2xl bg-white/10 border border-white/10 text-white/85 font-black tracking-wide active:scale-[0.99] transition-transform"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onApply}
                className="flex-1 h-11 rounded-2xl bg-white text-black font-black tracking-wide active:scale-[0.99] transition-transform"
              >
                Apply
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
