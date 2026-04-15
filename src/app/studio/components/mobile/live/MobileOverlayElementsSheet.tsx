"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import type {
  MobileOverlayAlertTone,
  MobileOverlayAlign,
  MobileOverlayBackgroundMode,
  MobileOverlayElement,
  MobileOverlayElementType,
  MobileOverlayFontPreset,
} from "./MobileOverlayElementsLayer";

const TEXT_SWATCHES = ["#FFFFFF", "#F8FAFC", "#000000", "#FF2D55", "#FF9500", "#FFD60A", "#34C759", "#0A84FF", "#BF5AF2"];
const BG_SWATCHES = ["#000000", "#FFFFFF", "#FF2D55", "#FF9500", "#FFD60A", "#34C759", "#0A84FF", "#BF5AF2"];
const FONT_PRESETS: { id: MobileOverlayFontPreset; label: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "serif", label: "Serif" },
  { id: "mono", label: "Mono" },
  { id: "bold", label: "Bold" },
  { id: "neon", label: "Neon" },
];
const ALIGN: { id: MobileOverlayAlign; icon: string; label: string }[] = [
  { id: "left", icon: "format_align_left", label: "Left" },
  { id: "center", icon: "format_align_center", label: "Center" },
  { id: "right", icon: "format_align_right", label: "Right" },
];
const BG_MODES: { id: MobileOverlayBackgroundMode; label: string }[] = [
  { id: "none", label: "None" },
  { id: "highlight", label: "Highlight" },
  { id: "box", label: "Box" },
];

export function MobileOverlayElementsSheet({
  open,
  focusId = null,
  onClose,
  elements,
  onAdd,
  onUpdate,
  onBringToFront,
  onSendToBack,
  onRemove,
  darkMode = true,
}: {
  open: boolean;
  focusId?: string | null;
  onClose: () => void;
  elements: MobileOverlayElement[];
  onAdd: (type: MobileOverlayElementType) => void;
  onUpdate: (id: string, patch: Partial<MobileOverlayElement>) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onRemove: (id: string) => void;
  darkMode?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (focusId && elements.some((e) => e.id === focusId)) {
      setSelectedId(focusId);
      return;
    }
    if (selectedId && elements.some((e) => e.id === selectedId)) return;
    setSelectedId(elements[0]?.id ?? null);
  }, [elements, focusId, open, selectedId]);

  const selected = useMemo(() => elements.find((e) => e.id === selectedId) ?? null, [elements, selectedId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] pointer-events-auto">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />

      <div
        className={`absolute left-0 right-0 bottom-0 rounded-t-3xl border max-h-[85vh] overflow-hidden flex flex-col ${
          darkMode ? "bg-[#0a0a0a] border-white/10" : "bg-white border-slate-200"
        }`}
      >
        <div
          className={`shrink-0 px-4 pt-4 pb-3 border-b ${darkMode ? "bg-[#0a0a0a] border-white/10" : "bg-white border-slate-200"}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className={`${darkMode ? "text-white" : "text-slate-900"} text-[14px] font-black`}>Elements</p>
              <p className={`${darkMode ? "text-white/50" : "text-slate-500"} text-[12px] font-bold truncate`}>
                Drag on screen. Double-tap to edit.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`h-10 w-10 rounded-2xl border flex items-center justify-center ${
                darkMode ? "border-white/10" : "border-slate-200"
              }`}
            >
              <span className={`material-icons ${darkMode ? "text-white" : "text-slate-900"}`}>close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
        <div className="mt-4 grid grid-cols-2 gap-2">
          <ActionButton label="Add Text" icon="text_fields" onClick={() => onAdd("text")} darkMode={darkMode} />
          <ActionButton label="Add Alert" icon="notification_important" onClick={() => onAdd("alert")} darkMode={darkMode} />
        </div>

        {elements.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {elements.slice(0, 6).map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setSelectedId(e.id)}
                className={`px-3 py-2 rounded-2xl border text-left transition-colors ${
                  e.id === selectedId
                    ? darkMode
                      ? "bg-white/10 border-white/20"
                      : "bg-slate-100 border-slate-300"
                    : darkMode
                      ? "bg-white/5 border-white/10"
                      : "bg-white border-slate-200"
                }`}
              >
                <p className={`${darkMode ? "text-white" : "text-slate-900"} text-[12px] font-black truncate`}>
                  {e.type === "alert" ? "Alert" : "Text"}
                </p>
                <p className={`${darkMode ? "text-white/50" : "text-slate-500"} text-[11px] truncate`}>{e.text}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className={`mt-4 p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10 text-white/60" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
            <p className="text-[12px] font-bold">No elements yet.</p>
          </div>
        )}

        {selected && (
          <div className={`mt-4 p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}>
            <div className="flex items-center justify-between gap-3">
              <p className={`${darkMode ? "text-white" : "text-slate-900"} text-[13px] font-black`}>Edit</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onBringToFront(selected.id)}
                  className={`h-9 px-3 rounded-xl border text-[12px] font-black ${
                    darkMode ? "border-white/15 text-white/80" : "border-slate-300 text-slate-700"
                  }`}
                >
                  Front
                </button>
                <button
                  type="button"
                  onClick={() => onSendToBack(selected.id)}
                  className={`h-9 px-3 rounded-xl border text-[12px] font-black ${
                    darkMode ? "border-white/15 text-white/80" : "border-slate-300 text-slate-700"
                  }`}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRemove(selected.id);
                    setSelectedId(null);
                  }}
                  className={`h-9 px-3 rounded-xl border text-[12px] font-black ${
                    darkMode ? "border-white/15 text-white/80" : "border-slate-300 text-slate-700"
                  }`}
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="mt-3">
              <label className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[11px] font-black uppercase tracking-widest`}>Text</label>
              <Textarea
                value={selected.text}
                onChange={(e) => onUpdate(selected.id, { text: e.target.value })}
                className={`mt-2 min-h-[92px] rounded-xl text-[13px] font-bold ${
                  darkMode
                    ? "bg-black/30 border-white/10 text-white placeholder:text-white/40"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                }`}
                placeholder="Type…"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <Section title="Style" darkMode={darkMode}>
                <div className="flex flex-wrap gap-2">
                  {FONT_PRESETS.map((p) => (
                    <Chip
                      key={p.id}
                      active={(selected.style?.fontPreset ?? "classic") === p.id}
                      label={p.label}
                      onClick={() =>
                        onUpdate(selected.id, {
                          style: {
                            ...(selected.style ?? {}),
                            fontPreset: p.id,
                          },
                        })
                      }
                      darkMode={darkMode}
                    />
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {ALIGN.map((a) => (
                      <IconChip
                        key={a.id}
                        active={(selected.style?.align ?? "center") === a.id}
                        icon={a.icon}
                        label={a.label}
                        onClick={() =>
                          onUpdate(selected.id, {
                            style: {
                              ...(selected.style ?? {}),
                              align: a.id,
                            },
                          })
                        }
                        darkMode={darkMode}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <ToggleChip
                      label="Shadow"
                      active={selected.style?.shadow ?? true}
                      onClick={() =>
                        onUpdate(selected.id, {
                          style: {
                            ...(selected.style ?? {}),
                            shadow: !(selected.style?.shadow ?? true),
                          },
                        })
                      }
                      darkMode={darkMode}
                    />
                    <ToggleChip
                      label="Outline"
                      active={selected.style?.outline?.enabled ?? false}
                      onClick={() =>
                        onUpdate(selected.id, {
                          style: {
                            ...(selected.style ?? {}),
                            outline: {
                              ...(selected.style?.outline ?? { enabled: false, color: "#000000", widthPx: 2 }),
                              enabled: !(selected.style?.outline?.enabled ?? false),
                            },
                          },
                        })
                      }
                      darkMode={darkMode}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[11px] font-black uppercase tracking-widest`}>Text color</label>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {TEXT_SWATCHES.map((c) => (
                      <Swatch
                        key={c}
                        color={c}
                        active={(selected.style?.textColor ?? "#FFFFFF").toUpperCase() === c.toUpperCase()}
                        onClick={() =>
                          onUpdate(selected.id, {
                            style: {
                              ...(selected.style ?? {}),
                              textColor: c,
                            },
                          })
                        }
                      />
                    ))}

                    <label
                      className={`h-9 px-3 rounded-xl border flex items-center gap-2 text-[12px] font-black cursor-pointer ${
                        darkMode ? "bg-white/5 border-white/10 text-white/80" : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      <span className="material-icons text-[16px]">palette</span>
                      Custom
                      <input
                        type="color"
                        value={selected.style?.textColor ?? "#FFFFFF"}
                        onChange={(e) =>
                          onUpdate(selected.id, {
                            style: {
                              ...(selected.style ?? {}),
                              textColor: e.target.value,
                            },
                          })
                        }
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              </Section>

              <Section title="Background" darkMode={darkMode}>
                <div className="flex flex-wrap gap-2">
                  {BG_MODES.map((m) => (
                    <Chip
                      key={m.id}
                      active={(selected.background?.mode ?? "none") === m.id}
                      label={m.label}
                      onClick={() =>
                        onUpdate(selected.id, {
                          background: {
                            ...(selected.background ?? {}),
                            mode: m.id,
                          },
                        })
                      }
                      darkMode={darkMode}
                    />
                  ))}
                </div>

                {(selected.background?.mode ?? "none") !== "none" && (
                  <>
                    <div className="mt-3">
                      <label className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[11px] font-black uppercase tracking-widest`}>Color</label>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {BG_SWATCHES.map((c) => (
                          <Swatch
                            key={c}
                            color={c}
                            active={(selected.background?.color ?? "#000000").toUpperCase() === c.toUpperCase()}
                            onClick={() =>
                              onUpdate(selected.id, {
                                background: {
                                  ...(selected.background ?? {}),
                                  color: c,
                                },
                              })
                            }
                          />
                        ))}

                        <label
                          className={`h-9 px-3 rounded-xl border flex items-center gap-2 text-[12px] font-black cursor-pointer ${
                            darkMode ? "bg-white/5 border-white/10 text-white/80" : "bg-white border-slate-200 text-slate-700"
                          }`}
                        >
                          <span className="material-icons text-[16px]">palette</span>
                          Custom
                          <input
                            type="color"
                            value={selected.background?.color ?? "#000000"}
                            onChange={(e) =>
                              onUpdate(selected.id, {
                                background: {
                                  ...(selected.background ?? {}),
                                  color: e.target.value,
                                },
                              })
                            }
                            className="sr-only"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <label className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[11px] font-black uppercase tracking-widest`}>
                          Opacity
                        </label>
                        <span className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[12px] font-bold`}>
                          {Math.round(selected.background?.opacityPct ?? 40)}%
                        </span>
                      </div>
                      <div className="mt-2">
                        <Slider
                          value={[clampPct(selected.background?.opacityPct ?? 40)]}
                          max={100}
                          step={1}
                          onValueChange={(v) =>
                            onUpdate(selected.id, {
                              background: { ...(selected.background ?? {}), opacityPct: clampPct(v[0] ?? 40) },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <PresetRow
                        title="Padding"
                        values={[0, 6, 10]}
                        active={selected.background?.paddingPx ?? 10}
                        onPick={(paddingPx) => onUpdate(selected.id, { background: { ...(selected.background ?? {}), paddingPx } })}
                        darkMode={darkMode}
                      />
                      <PresetRow
                        title="Radius"
                        values={[0, 12, 18]}
                        active={selected.background?.radiusPx ?? 18}
                        onPick={(radiusPx) => onUpdate(selected.id, { background: { ...(selected.background ?? {}), radiusPx } })}
                        darkMode={darkMode}
                      />
                    </div>
                  </>
                )}
              </Section>

              <Section title="Transform" darkMode={darkMode}>
                <div className="grid grid-cols-3 gap-2">
                  <SmallButton
                    label="Center"
                    icon="filter_center_focus"
                    onClick={() =>
                      onUpdate(selected.id, {
                        transform: { ...(selected.transform ?? { xPct: 0.5, yPct: 0.35, scale: 1, rotationDeg: 0 }), xPct: 0.5, yPct: 0.35 },
                      })
                    }
                    darkMode={darkMode}
                  />
                  <SmallButton
                    label="Scale"
                    icon="aspect_ratio"
                    onClick={() =>
                      onUpdate(selected.id, {
                        transform: { ...(selected.transform ?? { xPct: 0.5, yPct: 0.35, scale: 1, rotationDeg: 0 }), scale: 1 },
                      })
                    }
                    darkMode={darkMode}
                  />
                  <SmallButton
                    label="Rotate"
                    icon="rotate_left"
                    onClick={() =>
                      onUpdate(selected.id, {
                        transform: { ...(selected.transform ?? { xPct: 0.5, yPct: 0.35, scale: 1, rotationDeg: 0 }), rotationDeg: 0 },
                      })
                    }
                    darkMode={darkMode}
                  />
                </div>
              </Section>

              {selected.type === "alert" && (
                <Section title="Alert" darkMode={darkMode}>
                  <div className="grid grid-cols-4 gap-2">
                    {(["info", "success", "warning", "error"] as MobileOverlayAlertTone[]).map((tone) => (
                      <Chip
                        key={tone}
                        active={(selected.tone ?? "info") === tone}
                        label={tone}
                        onClick={() => onUpdate(selected.id, { tone })}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <ToggleChip
                      label="Auto-hide"
                      active={selected.autoHide?.enabled ?? false}
                      onClick={() =>
                        onUpdate(selected.id, {
                          autoHide: {
                            ...(selected.autoHide ?? { enabled: false, durationMs: 4000 }),
                            enabled: !(selected.autoHide?.enabled ?? false),
                          },
                        })
                      }
                      darkMode={darkMode}
                    />

                    <div className="flex items-center gap-2">
                      {[2000, 4000, 6000, 10000].map((ms) => (
                        <Chip
                          key={ms}
                          active={(selected.autoHide?.durationMs ?? 4000) === ms}
                          label={`${ms / 1000}s`}
                          onClick={() =>
                            onUpdate(selected.id, {
                              autoHide: { ...(selected.autoHide ?? { enabled: false, durationMs: 4000 }), durationMs: ms },
                            })
                          }
                          darkMode={darkMode}
                        />
                      ))}
                    </div>
                  </div>
                </Section>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  darkMode,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  darkMode: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-12 rounded-2xl border flex items-center justify-center gap-2 active:scale-[0.99] transition-transform ${
        darkMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}
    >
      <span className="material-icons text-[18px]">{icon}</span>
      <span className="text-[12px] font-black">{label}</span>
    </button>
  );
}

export default MobileOverlayElementsSheet;

function Section({ title, children, darkMode }: { title: string; children: React.ReactNode; darkMode: boolean }) {
  return (
    <div>
      <p className={`${darkMode ? "text-white/70" : "text-slate-600"} text-[11px] font-black tracking-[0.2em] uppercase`}>{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
  darkMode,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  darkMode: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 px-3 rounded-xl border text-[12px] font-black active:scale-95 transition-transform ${
        active
          ? darkMode
            ? "bg-white/10 border-white/20 text-white"
            : "bg-slate-100 border-slate-300 text-slate-900"
          : darkMode
            ? "bg-white/5 border-white/10 text-white/70"
            : "bg-white border-slate-200 text-slate-600"
      }`}
    >
      {label}
    </button>
  );
}

function ToggleChip({
  label,
  active,
  onClick,
  darkMode,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  darkMode: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 px-3 rounded-xl border text-[12px] font-black active:scale-95 transition-transform ${
        active
          ? "bg-[#FF5C00]/15 border-[#FF5C00]/35 text-white"
          : darkMode
            ? "bg-white/5 border-white/10 text-white/70"
            : "bg-white border-slate-200 text-slate-600"
      }`}
    >
      {label}
    </button>
  );
}

function IconChip({
  icon,
  label,
  active,
  onClick,
  darkMode,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  darkMode: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 w-10 rounded-xl border flex items-center justify-center active:scale-95 transition-transform ${
        active
          ? darkMode
            ? "bg-white/10 border-white/20 text-white"
            : "bg-slate-100 border-slate-300 text-slate-900"
          : darkMode
            ? "bg-white/5 border-white/10 text-white/70"
            : "bg-white border-slate-200 text-slate-600"
      }`}
      aria-label={label}
    >
      <span className="material-icons text-[18px]">{icon}</span>
    </button>
  );
}

function Swatch({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 w-9 rounded-xl ring-1 ${active ? "ring-white" : "ring-white/20"} active:scale-95 transition-transform`}
      style={{ backgroundColor: color }}
      aria-label={`Pick ${color}`}
    />
  );
}

function PresetRow({
  title,
  values,
  active,
  onPick,
  darkMode,
}: {
  title: string;
  values: number[];
  active: number;
  onPick: (v: number) => void;
  darkMode: boolean;
}) {
  return (
    <div>
      <p className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[11px] font-black uppercase tracking-widest`}>{title}</p>
      <div className="mt-2 flex items-center gap-2">
        {values.map((v) => (
          <Chip key={v} label={`${v}`} active={active === v} onClick={() => onPick(v)} darkMode={darkMode} />
        ))}
      </div>
    </div>
  );
}

function SmallButton({
  label,
  icon,
  onClick,
  darkMode,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  darkMode: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 rounded-2xl border flex items-center justify-center gap-2 text-[12px] font-black active:scale-[0.99] transition-transform ${
        darkMode ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}
    >
      <span className="material-icons text-[18px]">{icon}</span>
      {label}
    </button>
  );
}

function clampPct(v: number) {
  if (!Number.isFinite(v)) return 40;
  return Math.max(0, Math.min(100, Math.round(v)));
}
