"use client";

import React, { memo, useMemo, useRef } from "react";

export type MobileOverlayElementType = "text" | "alert";
export type MobileOverlayAlertTone = "info" | "success" | "warning" | "error";

export type MobileOverlayElement = {
  id: string;
  type: MobileOverlayElementType;
  text: string;
  tone?: MobileOverlayAlertTone;
  xPct: number; // 0..1
  yPct: number; // 0..1
};

type Props = {
  elements: MobileOverlayElement[];
  onChange: (id: string, patch: Partial<MobileOverlayElement>) => void;
  onRequestEdit: (id: string) => void;
};

export const MobileOverlayElementsLayer = memo(function MobileOverlayElementsLayer({ elements, onChange, onRequestEdit }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef<{
    id: string;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startXPct: number;
    startYPct: number;
    rect: DOMRect;
    moved: boolean;
  } | null>(null);
  const lastTapById = useRef<Record<string, number>>({});

  const ordered = useMemo(() => elements, [elements]);

  const clamp01 = (v: number) => Math.max(0.03, Math.min(0.97, v));

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-20">
      {ordered.map((el) => {
        const colorClass =
          el.type !== "alert"
            ? "text-white"
            : el.tone === "success"
              ? "text-emerald-200"
              : el.tone === "warning"
                ? "text-amber-200"
                : el.tone === "error"
                  ? "text-rose-200"
                  : "text-white";

        return (
          <button
            key={el.id}
            type="button"
            className="absolute pointer-events-auto active:scale-[0.99] transition-transform"
            style={{
              left: `${Math.round(el.xPct * 1000) / 10}%`,
              top: `${Math.round(el.yPct * 1000) / 10}%`,
              transform: "translate(-50%, -50%)",
              touchAction: "none",
            }}
            aria-label={el.type === "alert" ? "Alert element" : "Text element"}
            onPointerDown={(e) => {
              const rect = containerRef.current?.getBoundingClientRect();
              if (!rect) return;
              dragging.current = {
                id: el.id,
                pointerId: e.pointerId,
                startClientX: e.clientX,
                startClientY: e.clientY,
                startXPct: el.xPct,
                startYPct: el.yPct,
                rect,
                moved: false,
              };
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {}
            }}
            onPointerMove={(e) => {
              const d = dragging.current;
              if (!d || d.id !== el.id || d.pointerId !== e.pointerId) return;

              const dx = e.clientX - d.startClientX;
              const dy = e.clientY - d.startClientY;
              if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;

              const nextXPct = clamp01(d.startXPct + dx / Math.max(1, d.rect.width));
              const nextYPct = clamp01(d.startYPct + dy / Math.max(1, d.rect.height));
              onChange(el.id, { xPct: nextXPct, yPct: nextYPct });
            }}
            onPointerUp={(e) => {
              const d = dragging.current;
              if (!d || d.id !== el.id || d.pointerId !== e.pointerId) return;
              dragging.current = null;
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {}

              if (!d.moved) {
                const now = Date.now();
                const last = lastTapById.current[el.id] ?? 0;
                lastTapById.current[el.id] = now;
                if (now - last < 280) {
                  onRequestEdit(el.id);
                }
              }
            }}
            onPointerCancel={(e) => {
              const d = dragging.current;
              if (!d || d.id !== el.id || d.pointerId !== e.pointerId) return;
              dragging.current = null;
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {}
            }}
          >
            <div
              className={`flex items-center gap-2 ${colorClass}`}
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.85)" }}
            >
              {el.type === "alert" && <span className="material-icons text-[18px]">error_outline</span>}
              <span className={`${el.type === "text" ? "text-[18px] font-black" : "text-[14px] font-black"} whitespace-pre-wrap`}>
                {el.text}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
});

export default MobileOverlayElementsLayer;

