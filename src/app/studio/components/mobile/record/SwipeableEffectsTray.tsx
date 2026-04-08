"use client";

import React, { memo, useEffect, useMemo, useRef } from "react";
import type { RecordEffect } from "./recordEffects";

type Props = {
  effects: RecordEffect[];
  activeEffectId: string;
  onPreviewEffect: (id: string) => void;
  onSelectEffect: (id: string) => void;
  darkMode?: boolean;
  variant?: "full" | "compact";
  showLabels?: boolean;
};

export const SwipeableEffectsTray = memo(function SwipeableEffectsTray({
  effects,
  activeEffectId,
  onPreviewEffect,
  onSelectEffect,
  darkMode = true,
  variant = "full",
  showLabels = true,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const rafId = useRef<number | null>(null);
  const scrollEndTimer = useRef<number | null>(null);
  const lastPreviewId = useRef<string | null>(null);

  const effectIndex = useMemo(() => {
    const index = new Map<string, number>();
    effects.forEach((e, idx) => index.set(e.id, idx));
    return index;
  }, [effects]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = effectIndex.get(activeEffectId);
    if (idx === undefined) return;
    const child = el.children.item(idx) as HTMLElement | null;
    child?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeEffectId, effectIndex]);

  const previewClosestToCenter = () => {
    const el = scrollerRef.current;
    if (!el) return;

    const containerRect = el.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;

    let bestId: string | null = null;
    let bestDist = Number.POSITIVE_INFINITY;

    for (let i = 0; i < el.children.length; i++) {
      const child = el.children.item(i) as HTMLElement | null;
      if (!child) continue;
      const id = child.dataset.effectId;
      if (!id) continue;

      const rect = child.getBoundingClientRect();
      const childCenterX = rect.left + rect.width / 2;
      const dist = Math.abs(childCenterX - centerX);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = id;
      }
    }

    if (bestId && lastPreviewId.current !== bestId) {
      lastPreviewId.current = bestId;
      onPreviewEffect(bestId);
    }
  };

  const schedulePreview = () => {
    if (rafId.current != null) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(previewClosestToCenter);

    if (scrollEndTimer.current) window.clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = window.setTimeout(() => {
      const id = lastPreviewId.current;
      if (id) onSelectEffect(id);
    }, 140);
  };

  useEffect(() => {
    return () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
      if (scrollEndTimer.current) window.clearTimeout(scrollEndTimer.current);
    };
  }, []);

  return (
    <div className="relative">
      {/* Edge fade */}
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 ${variant === "compact" ? "w-8" : "w-12"} ${
          darkMode ? "bg-gradient-to-r from-black/70" : "bg-gradient-to-r from-white/70"
        } to-transparent`}
      />
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 ${variant === "compact" ? "w-8" : "w-12"} ${
          darkMode ? "bg-gradient-to-l from-black/70" : "bg-gradient-to-l from-white/70"
        } to-transparent`}
      />

      <div
        ref={scrollerRef}
        onScroll={schedulePreview}
        className={`no-scrollbar flex overflow-x-auto scroll-smooth snap-x snap-mandatory ${
          variant === "compact" ? "gap-2 px-4 py-2" : "gap-3 px-16 py-3"
        }`}
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      >
        {effects.map((effect) => {
          const isActive = effect.id === activeEffectId;
          return (
            <button
              key={effect.id}
              type="button"
              data-effect-id={effect.id}
              onClick={() => onSelectEffect(effect.id)}
              className={`snap-center flex flex-col items-center outline-none active:scale-95 transition-transform ${
                variant === "compact" ? "gap-1.5 min-w-[58px]" : "gap-2 min-w-[72px]"
              }`}
              >
                <div
                  className={`
                  relative rounded-full bg-gradient-to-br ${effect.gradient}
                  flex items-center justify-center shadow-lg
                  ${variant === "compact" ? "h-11 w-11" : "h-14 w-14"}
                  ${isActive ? "ring-2 ring-white/90 ring-offset-2 ring-offset-black/60 scale-110" : "opacity-90"}
                `}
                >
                  <span className={`material-icons text-white ${variant === "compact" ? "text-[18px]" : "text-[22px]"}`}>{effect.icon}</span>
                </div>
              {showLabels && (
                <span
                  className={`font-black tracking-wide ${variant === "compact" ? "text-[9px]" : "text-[10px]"} ${
                    isActive ? "text-white" : "text-white/70"
                  }`}
                >
                  {effect.name}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default SwipeableEffectsTray;
