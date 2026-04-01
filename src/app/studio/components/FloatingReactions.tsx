import React, { useState, useEffect, memo } from 'react';

export interface FloatingReactionsProps {
    // A counter that tells the component to spawn another heart
    triggerHeartCount?: number;
}

interface Particle {
    id: number;
    xOffset: number; // wobble range
    duration: number; // in ms
    scale: number;
    color: string;
}

const COLORS = [
    '#ef4444', // red-500
    '#f43f5e', // rose-500
    '#ec4899', // pink-500
    '#d946ef', // fuchsia-500
    '#8b5cf6', // violet-500
    '#3b82f6', // blue-500
    '#06b6d4', // cyan-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
];

export const FloatingReactions = memo(function FloatingReactions({ triggerHeartCount = 0 }: FloatingReactionsProps) {
    const [particles, setParticles] = useState<Particle[]>([]);

    // Automatically remove old particles so the DOM doesn't burst
    useEffect(() => {
        if (particles.length === 0) return;

        // Clean up the oldest particle according to its duration
        const oldest = particles[0];
        const timer = setTimeout(() => {
            setParticles((prev) => prev.filter((p) => p.id !== oldest.id));
        }, oldest.duration + 100); // slight buffer

        return () => clearTimeout(timer);
    }, [particles]);

    // Spawn a new particle whenever triggerHeartCount increases
    useEffect(() => {
        if (triggerHeartCount > 0) {
            const newParticle: Particle = {
                id: Date.now() + Math.random(),
                xOffset: Math.random() * 60 - 30, // -30px to +30px sway
                duration: Math.random() * 1500 + 2000, // 2s to 3.5s lifetime
                scale: Math.random() * 0.6 + 0.6, // 0.6x to 1.2x size
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
            };
            // Limit to max 35 hearts on screen at any given moment for performance
            setParticles((prev) => [...prev, newParticle].slice(-35));
        }
    }, [triggerHeartCount]);

    return (
        <div className="absolute bottom-[20%] right-4 w-16 h-80 pointer-events-none z-[60] overflow-visible flex flex-col justify-end items-center">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute bottom-0 drop-shadow-lg"
                    style={{
                        animation: `floatUp ${p.duration}ms cubic-bezier(0.25, 1, 0.5, 1) forwards`,
                        color: p.color,
                        '--dyn-scale': p.scale,
                        '--dyn-x': `${p.xOffset}px`,
                    } as React.CSSProperties}
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                </div>
            ))}
            
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes floatUp {
                    0% {
                        transform: translateY(20px) scale(0.3) translateX(0);
                        opacity: 0;
                    }
                    15% {
                        opacity: 1;
                        transform: translateY(-20px) scale(var(--dyn-scale));
                    }
                    80% {
                        opacity: 0.8;
                    }
                    100% {
                        transform: translateY(-250px) scale(1) translateX(var(--dyn-x));
                        opacity: 0;
                    }
                }
            `}} />
        </div>
    );
});
