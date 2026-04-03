/**
 * MobileAudioVisualizer - Vertical VU meter for seller confidence
 * 
 * Takes an AnalyserNode or a simple 'volume' prop and 
 * renders a pulsating bars to show mic activity.
 */

import React, { useState, useEffect, memo } from "react";

interface MobileAudioVisualizerProps {
    stream: MediaStream | null;
    isOn: boolean;
}

export const MobileAudioVisualizer = memo(function MobileAudioVisualizer({
    stream,
    isOn,
}: MobileAudioVisualizerProps) {
    const [level, setLevel] = useState(0);

    useEffect(() => {
        if (!stream || !isOn) {
            setLevel(0);
            return;
        }

        let animationFrameId: number;
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const update = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                setLevel(average);
                animationFrameId = requestAnimationFrame(update);
            };

            update();

            return () => {
                cancelAnimationFrame(animationFrameId);
                source.disconnect();
                analyser.disconnect();
                audioContext.close();
            };
        } catch (err) {
            console.error("[AudioVisualizer] Error:", err);
        }
    }, [stream, isOn]);

    // Normalize level to 0-100
    const normalized = Math.min(100, Math.round((level / 128) * 100));

    return (
        <div className="flex flex-col items-center gap-0.5 h-10 w-1 justify-end pointer-events-none">
            {/* 5 bars */}
            {[...Array(5)].map((_, i) => {
                const threshold = (4 - i) * 20;
                const active = normalized > threshold;
                return (
                    <div
                        key={i}
                        className={`w-1 h-1.5 rounded-full transition-all duration-75 ${
                            active 
                                ? i === 0 ? "bg-red-500" : "bg-[#FF5C00]" 
                                : "bg-white/20"
                        }`}
                        style={{
                            opacity: active ? 1 : 0.3,
                            transform: active ? 'scaleX(1.2)' : 'scaleX(1)'
                        }}
                    />
                );
            })}
        </div>
    );
});
