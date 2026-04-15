"use client";

import React, { memo, useEffect, useMemo, useRef, useState } from "react";

export type MobileOverlayElementType = "text" | "alert";
export type MobileOverlayAlertTone = "info" | "success" | "warning" | "error";
export type MobileOverlayFontPreset = "classic" | "serif" | "mono" | "bold" | "neon";
export type MobileOverlayAlign = "left" | "center" | "right";
export type MobileOverlayBackgroundMode = "none" | "highlight" | "box";

export type MobileOverlayElement = {
  id: string;
  type: MobileOverlayElementType;
  text: string;
  tone?: MobileOverlayAlertTone;

  // Back-compat (older elements)
  xPct?: number; // 0..1
  yPct?: number; // 0..1

  transform?: Partial<{
    xPct: number; // 0..1
    yPct: number; // 0..1
    scale: number; // 0.5..3
    rotationDeg: number; // degrees
  }>;

  style?: Partial<{
    textColor: string; // hex
    fontPreset: MobileOverlayFontPreset;
    align: MobileOverlayAlign;
    shadow: boolean;
    outline: Partial<{ enabled: boolean; color: string; widthPx: number }>;
  }>;

  background?: Partial<{
    mode: MobileOverlayBackgroundMode;
    color: string; // hex
    opacityPct: number; // 0..100
    paddingPx: number; // preset values
    radiusPx: number; // preset values
  }>;

  autoHide?: { enabled: boolean; durationMs: number };
  expiresAt?: number;
};

type Props = {
  elements: MobileOverlayElement[];
  onChange: (id: string, patch: Partial<MobileOverlayElement>) => void;
  onRequestEdit: (id: string) => void;
};

const DEFAULT_STYLE: NonNullable<MobileOverlayElement["style"]> = {
  textColor: "#FFFFFF",
  fontPreset: "classic",
  align: "center",
  shadow: true,
  outline: { enabled: false, color: "#000000", widthPx: 2 },
};

const DEFAULT_BG: NonNullable<MobileOverlayElement["background"]> = {
  mode: "none",
  color: "#000000",
  opacityPct: 40,
  paddingPx: 10,
  radiusPx: 18,
};

type NormalizedOverlayElement = Omit<MobileOverlayElement, "transform" | "style" | "background" | "autoHide"> & {
  transform: { xPct: number; yPct: number; scale: number; rotationDeg: number };
  style: {
    textColor: string;
    fontPreset: MobileOverlayFontPreset;
    align: MobileOverlayAlign;
    shadow: boolean;
    outline: { enabled: boolean; color: string; widthPx: number };
  };
  background: { mode: MobileOverlayBackgroundMode; color: string; opacityPct: number; paddingPx: number; radiusPx: number };
  autoHide: { enabled: boolean; durationMs: number };
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function clamp01Center(v: number) {
  return clamp(v, 0.03, 0.97);
}

function normalizeElement(el: MobileOverlayElement): NormalizedOverlayElement {
  const t = {
    xPct: el.transform?.xPct ?? el.xPct ?? 0.5,
    yPct: el.transform?.yPct ?? el.yPct ?? 0.35,
    scale: el.transform?.scale ?? 1,
    rotationDeg: el.transform?.rotationDeg ?? 0,
  };

  const style = {
    ...DEFAULT_STYLE,
    ...(el.style ?? {}),
    outline: {
      ...DEFAULT_STYLE.outline,
      ...(el.style?.outline ?? {}),
    },
  };
  const background = { ...DEFAULT_BG, ...(el.background ?? {}) };
  const autoHide = el.autoHide ?? { enabled: false, durationMs: 4000 };
  return { ...el, transform: t, style, background, autoHide } as NormalizedOverlayElement;
}

function deg(rad: number) {
  return (rad * 180) / Math.PI;
}

function rad(degValue: number) {
  return (degValue * Math.PI) / 180;
}

export const MobileOverlayElementsLayer = memo(function MobileOverlayElementsLayer({ elements, onChange, onRequestEdit }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dragging = useRef<{
    id: string;
    rect: DOMRect;
    moved: boolean;
    startTransform: { xPct: number; yPct: number; scale: number; rotationDeg: number };
    pointers: Map<number, { x: number; y: number }>;
    startPointers: Map<number, { x: number; y: number }>;
    gesture?: {
      startMid: { x: number; y: number };
      startDist: number;
      startAngle: number;
    };
  } | null>(null);
  const lastTapById = useRef<Record<string, number>>({});

  const ordered = useMemo(() => elements.map(normalizeElement), [elements]);

  useEffect(() => {
    if (!selectedId) return;
    if (ordered.some((e) => e.id === selectedId)) return;
    setSelectedId(null);
  }, [ordered, selectedId]);

  const computeTextCss = (el: NormalizedOverlayElement) => {
    const s = el.style!;
    const bg = el.background!;

    const bgAlpha = clamp(bg.opacityPct, 0, 100) / 100;
    const backgroundColor =
      bg.mode === "none" ? "transparent" : hexToRgba(bg.color, bgAlpha);

    const padding =
      bg.mode === "none"
        ? 0
        : bg.mode === "highlight"
          ? clamp(bg.paddingPx, 0, 18)
          : clamp(bg.paddingPx, 0, 22);

    const radius =
      bg.mode === "none"
        ? 0
        : bg.mode === "highlight"
          ? clamp(bg.radiusPx, 0, 28)
          : clamp(bg.radiusPx, 0, 28);

    const fontFamily =
      s.fontPreset === "serif"
        ? "ui-serif, Georgia, Cambria, \"Times New Roman\", Times, serif"
        : s.fontPreset === "mono"
          ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"
          : "inherit";

    const fontWeight = s.fontPreset === "bold" ? 900 : 900;
    const neonGlow =
      s.fontPreset === "neon"
        ? `0 0 10px ${hexToRgba(s.textColor, 0.55)}, 0 0 24px ${hexToRgba(s.textColor, 0.35)}`
        : "";

    const baseShadow = s.shadow ? "0 2px 10px rgba(0,0,0,0.85)" : "";
    const textShadow = [baseShadow, neonGlow].filter(Boolean).join(", ");

    return {
      color: s.textColor,
      fontFamily,
      fontWeight,
      textAlign: s.align as any,
      background: backgroundColor,
      padding: bg.mode === "none" ? undefined : `${padding}px ${Math.max(6, Math.round(padding * 1.1))}px`,
      borderRadius: bg.mode === "none" ? undefined : `${radius}px`,
      textShadow: textShadow || undefined,
      WebkitTextStroke: s.outline.enabled ? `${s.outline.widthPx}px ${s.outline.color}` : undefined,
    } as React.CSSProperties;
  };

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-20">
      {ordered.map((el) => {
        const t = el.transform!;
        const isSelected = selectedId === el.id;

        const alertToneColor =
          el.tone === "success"
            ? "#34D399"
            : el.tone === "warning"
              ? "#FBBF24"
              : el.tone === "error"
                ? "#FB7185"
                : "#FFFFFF";

        const defaultAlertStyle: NonNullable<MobileOverlayElement["style"]> = {
          ...DEFAULT_STYLE,
          textColor: el.style?.textColor ?? alertToneColor,
        };

        const merged = el.type === "alert" ? { ...el, style: { ...defaultAlertStyle, ...(el.style ?? {}) } } : el;
        const css = computeTextCss(merged);

        return (
          <button
            key={el.id}
            type="button"
            className="absolute pointer-events-auto"
            style={{
              left: `${Math.round(t.xPct * 1000) / 10}%`,
              top: `${Math.round(t.yPct * 1000) / 10}%`,
              transform: `translate(-50%, -50%) rotate(${t.rotationDeg}deg) scale(${t.scale})`,
              touchAction: "none",
            }}
            aria-label={el.type === "alert" ? "Alert element" : "Text element"}
            onPointerDown={(e) => {
              const rect = containerRef.current?.getBoundingClientRect();
              if (!rect) return;
              setSelectedId(el.id);

              if (!dragging.current || dragging.current.id !== el.id) {
                dragging.current = {
                  id: el.id,
                  rect,
                  moved: false,
                  startTransform: { ...t },
                  pointers: new Map(),
                  startPointers: new Map(),
                };
              }

              dragging.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
              dragging.current.startPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

              // Initialize transform gesture when second pointer is down.
              if (dragging.current.pointers.size === 2) {
                const pts = Array.from(dragging.current.pointers.values());
                const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
                const dx = pts[1].x - pts[0].x;
                const dy = pts[1].y - pts[0].y;
                dragging.current.gesture = {
                  startMid: mid,
                  startDist: Math.max(1, Math.hypot(dx, dy)),
                  startAngle: Math.atan2(dy, dx),
                };
                dragging.current.startTransform = { ...t };
              }
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {}
            }}
            onPointerMove={(e) => {
              const d = dragging.current;
              if (!d || d.id !== el.id) return;
              if (!d.pointers.has(e.pointerId)) return;

              d.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

              const active = Array.from(d.pointers.entries());
              if (active.length === 1) {
                const start = d.startPointers.get(e.pointerId);
                if (!start) return;
                const dx = e.clientX - start.x;
                const dy = e.clientY - start.y;
                if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;

                const nextXPct = clamp01Center(d.startTransform.xPct + dx / Math.max(1, d.rect.width));
                const nextYPct = clamp01Center(d.startTransform.yPct + dy / Math.max(1, d.rect.height));
                onChange(el.id, { transform: { ...t, xPct: nextXPct, yPct: nextYPct } });
                return;
              }

              // Two-finger transform (pinch + rotate + move).
              const pts = active.slice(0, 2).map(([, p]) => p);
              const g = d.gesture;
              if (!g) return;

              const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
              const dx = pts[1].x - pts[0].x;
              const dy = pts[1].y - pts[0].y;
              const dist = Math.max(1, Math.hypot(dx, dy));
              const angle = Math.atan2(dy, dx);

              const midDx = mid.x - g.startMid.x;
              const midDy = mid.y - g.startMid.y;
              if (Math.abs(midDx) + Math.abs(midDy) > 6) d.moved = true;

              const nextScale = clamp(d.startTransform.scale * (dist / g.startDist), 0.5, 3.0);
              const nextRot = d.startTransform.rotationDeg + deg(angle - g.startAngle);
              const nextXPct = clamp01Center(d.startTransform.xPct + midDx / Math.max(1, d.rect.width));
              const nextYPct = clamp01Center(d.startTransform.yPct + midDy / Math.max(1, d.rect.height));

              onChange(el.id, {
                transform: { ...t, xPct: nextXPct, yPct: nextYPct, scale: nextScale, rotationDeg: nextRot },
              });
            }}
            onPointerUp={(e) => {
              const d = dragging.current;
              if (!d || d.id !== el.id) return;
              if (!d.pointers.has(e.pointerId)) return;
              d.pointers.delete(e.pointerId);
              d.startPointers.delete(e.pointerId);
              if (d.pointers.size === 1) {
                // Reset drag baseline for remaining pointer.
                const [pid, p] = Array.from(d.pointers.entries())[0];
                d.startPointers.set(pid, { ...p });
                d.startTransform = { ...(el.transform ?? t) };
                d.gesture = undefined;
              }

              if (d.pointers.size === 0) {
                dragging.current = null;
              }
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {}

              if (!d.moved && (!dragging.current || dragging.current.id !== el.id)) {
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
              if (!d || d.id !== el.id) return;
              if (d.pointers.has(e.pointerId)) {
                d.pointers.delete(e.pointerId);
                d.startPointers.delete(e.pointerId);
              }
              if (d.pointers.size === 0) dragging.current = null;
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {}
            }}
          >
            <div
              className="flex items-center gap-2"
              style={css}
            >
              {el.type === "alert" && <span className="material-icons text-[18px]">error_outline</span>}
              <span
                className={`${el.type === "text" ? "text-[18px] font-black" : "text-[14px] font-black"} whitespace-pre-wrap`}
              >
                {el.text}
              </span>
            </div>

            {isSelected && (
              <div
                className="absolute inset-[-8px] rounded-2xl pointer-events-none"
                style={{
                  boxShadow: "0 0 0 2px rgba(255,255,255,0.55), 0 0 0 4px rgba(0,0,0,0.25)",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
});

export default MobileOverlayElementsLayer;

function hexToRgba(hex: string, alpha: number) {
  const h = (hex || "#000000").replace("#", "").trim();
  const isShort = h.length === 3;
  const full = isShort ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0").slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const a = clamp(alpha, 0, 1);
  return `rgba(${Number.isFinite(r) ? r : 0},${Number.isFinite(g) ? g : 0},${Number.isFinite(b) ? b : 0},${a})`;
}
