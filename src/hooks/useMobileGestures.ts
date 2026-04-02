/**
 * useMobileGestures - Swipe gesture detection hook
 * 
 * Detects swipe gestures in all four directions with configurable thresholds.
 * Used for TikTok-style navigation between panels.
 */

import { useRef, useCallback, useEffect } from "react";

export type SwipeDirection = "up" | "down" | "left" | "right";

export interface SwipeHandlers {
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
}

interface GestureConfig {
    threshold?: number;      // Minimum distance in pixels to trigger swipe
    velocityThreshold?: number; // Minimum velocity in px/ms
    preventDefault?: boolean;   // Whether to prevent default touch behavior
}

const DEFAULT_CONFIG: GestureConfig = {
    threshold: 50,
    velocityThreshold: 0.3,
    preventDefault: false,
};

export function useMobileGestures(
    handlers: SwipeHandlers,
    config: GestureConfig = {}
) {
    const { threshold, velocityThreshold, preventDefault } = { ...DEFAULT_CONFIG, ...config };
    const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
    const elementRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        const touch = e.touches[0];
        touchStart.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
        };
    }, []);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        if (!touchStart.current) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStart.current.x;
        const deltaY = touch.clientY - touchStart.current.y;
        const deltaTime = Date.now() - touchStart.current.time;

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        const velocity = Math.max(absX, absY) / deltaTime;

        // Determine if this is a valid swipe
        const isValidSwipe = (absX > threshold! || absY > threshold!) && velocity > velocityThreshold!;

        if (isValidSwipe) {
            // Determine primary direction
            if (absX > absY) {
                // Horizontal swipe
                if (deltaX > 0) {
                    handlers.onSwipeRight?.();
                } else {
                    handlers.onSwipeLeft?.();
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    handlers.onSwipeDown?.();
                } else {
                    handlers.onSwipeUp?.();
                }
            }
        }

        touchStart.current = null;
    }, [handlers, threshold, velocityThreshold]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (preventDefault) {
            e.preventDefault();
        }
    }, [preventDefault]);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        element.addEventListener("touchstart", handleTouchStart, { passive: true });
        element.addEventListener("touchend", handleTouchEnd, { passive: true });
        if (preventDefault) {
            element.addEventListener("touchmove", handleTouchMove, { passive: false });
        }

        return () => {
            element.removeEventListener("touchstart", handleTouchStart);
            element.removeEventListener("touchend", handleTouchEnd);
            if (preventDefault) {
                element.removeEventListener("touchmove", handleTouchMove);
            }
        };
    }, [handleTouchStart, handleTouchEnd, handleTouchMove, preventDefault]);

    return elementRef;
}

/**
 * useSwipePanel - Higher-level hook for managing swipe panel state
 * 
 * Manages which panel is currently active and handles swipe transitions.
 */
export function useSwipePanel(
    activePanel: string,
    setActivePanel: (panel: string) => void,
    panelOrder: string[] = ["none", "chat", "filters", "commerce"]
) {
    const handleSwipeUp = useCallback(() => {
        const currentIdx = panelOrder.indexOf(activePanel);
        if (currentIdx < panelOrder.length - 1) {
            setActivePanel(panelOrder[currentIdx + 1]);
        }
    }, [activePanel, panelOrder, setActivePanel]);

    const handleSwipeDown = useCallback(() => {
        const currentIdx = panelOrder.indexOf(activePanel);
        if (currentIdx > 0) {
            setActivePanel(panelOrder[currentIdx - 1]);
        }
    }, [activePanel, panelOrder, setActivePanel]);

    const handleSwipeLeft = useCallback(() => {
        if (activePanel === "none") {
            setActivePanel("filters");
        }
    }, [activePanel, setActivePanel]);

    const handleSwipeRight = useCallback(() => {
        if (activePanel === "none") {
            setActivePanel("commerce");
        } else {
            setActivePanel("none");
        }
    }, [activePanel, setActivePanel]);

    return {
        onSwipeUp: handleSwipeUp,
        onSwipeDown: handleSwipeDown,
        onSwipeLeft: handleSwipeLeft,
        onSwipeRight: handleSwipeRight,
    };
}

export default useMobileGestures;
