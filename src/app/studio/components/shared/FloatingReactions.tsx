import React, { useState, useEffect, memo } from 'react';

export interface FloatingReactionsProps {
    // A counter that tells the component to spawn another heart
    triggerHeartCount?: number;
    className?: string;
}

interface Particle {
    id: number;
    xOffset: number; // wobble range
    duration: number; // in ms
    scale: number;
    color: string;
    type: 'heart' | 'fire' | 'star';
}

const COLORS = [
    '#ef4444', // red-500
    '#f43f5e', // rose-500
    '#ec4899', // pink-500
    '#f59e0b', // amber-500
    '#fbbf24', // yellow-400
    '#8b5cf6', // violet-500
    '#3b82f6', // blue-500
];

const ICONS = {
    heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    fire: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"
};

export const FloatingReactions = memo(function FloatingReactions({ triggerHeartCount = 0, className }: FloatingReactionsProps) {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        if (particles.length === 0) return;
        const oldest = particles[0];
        const timer = setTimeout(() => {
            setParticles((prev) => prev.filter((p) => p.id !== oldest.id));
        }, oldest.duration + 100);
        return () => clearTimeout(timer);
    }, [particles]);

    useEffect(() => {
        if (triggerHeartCount > 0) {
            const types: ('heart' | 'fire' | 'star')[] = ['heart', 'heart', 'heart', 'fire', 'star'];
            const newParticle: Particle = {
                id: Date.now() + Math.random(),
                xOffset: Math.random() * 80 - 40,
                duration: Math.random() * 1500 + 2000,
                scale: Math.random() * 0.5 + 0.7,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                type: types[Math.floor(Math.random() * types.length)],
            };
            setParticles((prev) => [...prev, newParticle].slice(-40));
        }
    }, [triggerHeartCount]);

    return (
        <div className={`absolute bottom-[20%] right-4 w-16 h-80 pointer-events-none z-[60] overflow-visible flex flex-col justify-end items-center ${className ?? ""}`}>
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
                        <path d={ICONS[p.type]} />
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
                        transform: translateY(-300px) scale(1.2) translateX(var(--dyn-x));
                        opacity: 0;
                    }
                }
            `}} />
        </div>
    );
});
