"use client";

import React, { useMemo, useState } from "react";
import { getRecordEffectCssFilter } from "../record/recordEffects";

export type RecordedClip = {
    id: string;
    title: string;
    createdAt: number;
    durationSec: number;
    url: string;
    mimeType: string;
    filterId: string;
    intensity: number;
};

interface VideosPageProps {
    onGoBack: () => void;
    onOpenSettings: () => void;
    clips?: RecordedClip[];
    darkMode?: boolean;
}

export function VideosPage({
    onGoBack,
    onOpenSettings,
    clips = [],
    darkMode = true,
}: VideosPageProps) {
    const [selectedFilter, setSelectedFilter] = useState<"all" | "live" | "recorded">("all");
    const [previewId, setPreviewId] = useState<string | null>(null);

    const recorded = useMemo(() => {
        return clips
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((c) => ({
                ...c,
                dateLabel: new Date(c.createdAt).toLocaleString(),
                durationLabel: `${Math.floor(c.durationSec / 60)}:${String(c.durationSec % 60).padStart(2, "0")}`,
            }));
    }, [clips]);

    const filters = [
        { id: "all", label: "All" },
        { id: "live", label: "Live" },
        { id: "recorded", label: "Recorded" },
    ] as const;

    const showRecorded = selectedFilter !== "live";

    return (
        <div className={`absolute inset-0 pointer-events-auto ${darkMode ? "bg-[#0a0a0a]" : "bg-slate-50"} overflow-y-auto`}>
            {/* Header */}
            <div className={`sticky top-0 z-10 px-4 pt-[env(safe-area-inset-top,0px)] pb-4 ${darkMode ? "bg-[#0a0a0a]/95 backdrop-blur-sm" : "bg-white/95"}`}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onGoBack}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-white/10" : "bg-slate-100"}`}
                        type="button"
                        aria-label="Back"
                    >
                        <span className={`material-icons ${darkMode ? "text-white" : "text-slate-700"}`}>arrow_back</span>
                    </button>
                    <h1 className={`text-xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>My Videos</h1>

                    <button
                        onClick={onOpenSettings}
                        className={`ml-auto w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-white/10" : "bg-slate-100"}`}
                        type="button"
                        aria-label="Settings"
                    >
                        <span className={`material-icons ${darkMode ? "text-white" : "text-slate-700"}`}>settings</span>
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mt-4">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setSelectedFilter(filter.id)}
                            type="button"
                            className={`
                                px-4 py-2 rounded-full text-sm font-semibold transition-all
                                ${selectedFilter === filter.id
                                    ? "bg-[#f77f00] text-white"
                                    : darkMode ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-600"
                                }
                            `}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Videos Grid */}
            <div className="px-4 pb-24">
                {showRecorded && recorded.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {recorded.map((video) => (
                            <button
                                type="button"
                                key={video.id}
                                onClick={() => setPreviewId(video.id)}
                                className={`rounded-2xl overflow-hidden text-left active:scale-[0.99] transition-transform ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-slate-200"}`}
                                aria-label={`Open ${video.title}`}
                            >
                                <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
                                    <video
                                        src={video.url}
                                        className="absolute inset-0 h-full w-full object-cover"
                                        style={{ filter: getRecordEffectCssFilter(video.filterId, video.intensity) }}
                                        muted
                                        playsInline
                                        preload="metadata"
                                    />
                                    <div className="absolute inset-0 bg-black/20" />
                                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs font-bold">
                                        {video.durationLabel}
                                    </span>
                                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-black tracking-wide uppercase">
                                        Recorded
                                    </span>
                                </div>
                                <div className="p-3">
                                    <p className={`font-bold text-sm line-clamp-2 ${darkMode ? "text-white" : "text-slate-900"}`}>
                                        {video.title}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className={`text-xs ${darkMode ? "text-white/50" : "text-slate-500"} truncate`}>
                                            {video.dateLabel}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <span className="text-5xl">🎥</span>
                        <p className={`mt-4 ${darkMode ? "text-white/60" : "text-slate-500"}`}>
                            {selectedFilter === "live" ? "No live replays yet" : "No videos yet"}
                        </p>
                        <p className={`text-sm ${darkMode ? "text-white/40" : "text-slate-400"}`}>
                            {selectedFilter === "live" ? "Your live replays will show up here" : "Start recording to see your videos here"}
                        </p>
                    </div>
                )}
            </div>

            {previewId && (
                <VideoPreviewModal
                    clip={recorded.find((c) => c.id === previewId) ?? null}
                    onClose={() => setPreviewId(null)}
                    darkMode={darkMode}
                />
            )}
        </div>
    );
}

export default VideosPage;

function VideoPreviewModal({
    clip,
    onClose,
    darkMode,
}: {
    clip: (RecordedClip & { dateLabel: string; durationLabel: string }) | null;
    onClose: () => void;
    darkMode: boolean;
}) {
    if (!clip) return null;

    const download = () => {
        const a = document.createElement("a");
        a.href = clip.url;
        const ext = clip.mimeType.includes("mp4") ? "mp4" : "webm";
        a.download = `${clip.title.replaceAll(" ", "-").toLowerCase()}-${clip.id}.${ext}`;
        a.click();
    };

    return (
        <div className="fixed inset-0 z-[200] pointer-events-auto">
            <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close preview" />
            <div className="absolute inset-x-0 bottom-0 pb-[env(safe-area-inset-bottom,0px)]">
                <div className={`mx-auto max-w-[620px] rounded-t-[28px] overflow-hidden border ${darkMode ? "bg-[#0a0a0a] border-white/10" : "bg-white border-slate-200"}`}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0">
                            <p className={`${darkMode ? "text-white" : "text-slate-900"} text-[14px] font-black truncate`}>{clip.title}</p>
                            <p className={`${darkMode ? "text-white/50" : "text-slate-500"} text-[11px] font-bold truncate`}>
                                {clip.dateLabel}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className={`h-10 w-10 rounded-2xl border flex items-center justify-center ${darkMode ? "border-white/10" : "border-slate-200"}`}
                            aria-label="Close"
                        >
                            <span className={`material-icons ${darkMode ? "text-white" : "text-slate-900"}`}>close</span>
                        </button>
                    </div>

                    <div className="relative aspect-video bg-black">
                        <video
                            src={clip.url}
                            className="absolute inset-0 h-full w-full object-cover"
                            style={{ filter: getRecordEffectCssFilter(clip.filterId, clip.intensity) }}
                            controls
                            playsInline
                        />
                    </div>

                    <div className="p-4">
                        <button
                            type="button"
                            onClick={download}
                            className="w-full h-11 rounded-2xl bg-[#f77f00] text-white font-black tracking-wide active:scale-[0.99] transition-transform"
                        >
                            Download
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
