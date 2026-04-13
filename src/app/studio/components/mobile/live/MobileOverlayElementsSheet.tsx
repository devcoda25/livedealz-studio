"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { MobileOverlayAlertTone, MobileOverlayElement, MobileOverlayElementType } from "./MobileOverlayElementsLayer";

export function MobileOverlayElementsSheet({
  open,
  focusId = null,
  onClose,
  elements,
  onAdd,
  onUpdate,
  onRemove,
  darkMode = true,
}: {
  open: boolean;
  focusId?: string | null;
  onClose: () => void;
  elements: MobileOverlayElement[];
  onAdd: (type: MobileOverlayElementType) => void;
  onUpdate: (id: string, patch: Partial<MobileOverlayElement>) => void;
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
        className={`absolute left-0 right-0 bottom-0 rounded-t-3xl border p-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] ${
          darkMode ? "bg-[#0a0a0a] border-white/10" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`${darkMode ? "text-white" : "text-slate-900"} text-[14px] font-black`}>Elements</p>
            <p className={`${darkMode ? "text-white/50" : "text-slate-500"} text-[12px] font-bold`}>Drag on screen. Double-tap to edit.</p>
          </div>
          <button type="button" onClick={onClose} className="h-10 w-10 rounded-2xl border border-white/10 flex items-center justify-center">
            <span className={`material-icons ${darkMode ? "text-white" : "text-slate-900"}`}>close</span>
          </button>
        </div>

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

            <div className="mt-3">
              <label className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[11px] font-black uppercase tracking-widest`}>Text</label>
              <input
                value={selected.text}
                onChange={(e) => onUpdate(selected.id, { text: e.target.value })}
                className={`mt-2 w-full h-11 px-3 rounded-xl border outline-none text-[13px] font-bold ${
                  darkMode
                    ? "bg-black/30 border-white/10 text-white placeholder:text-white/40"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                }`}
                placeholder="Type…"
              />
            </div>

            {selected.type === "alert" && (
              <div className="mt-4">
                <label className={`${darkMode ? "text-white/60" : "text-slate-500"} text-[11px] font-black uppercase tracking-widest`}>Tone</label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {(["info", "success", "warning", "error"] as MobileOverlayAlertTone[]).map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => onUpdate(selected.id, { tone })}
                      className={`h-10 rounded-xl border text-[11px] font-black uppercase ${
                        selected.tone === tone
                          ? darkMode
                            ? "bg-white/10 border-white/20 text-white"
                            : "bg-slate-100 border-slate-300 text-slate-900"
                          : darkMode
                            ? "bg-white/5 border-white/10 text-white/70"
                            : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
