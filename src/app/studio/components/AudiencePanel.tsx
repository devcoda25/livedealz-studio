import React from "react";
import { AudienceTab, ChatMsg, QaItem, LiveViewer, AudioRequest, CurrentSpeaker } from "./types";
import { langTag, formatHMS } from "./utils";
import { EV_ORANGE } from "./constants";

export function AudiencePanel(props: {
    activeTab: AudienceTab;
    onTabChange: (t: AudienceTab) => void;
    messages: ChatMsg[];
    qaItems: QaItem[];
    viewers: LiveViewer[];
    liveLangMix: { label: string; pct: number }[];
    audioRequests: AudioRequest[];
    currentSpeaker: CurrentSpeaker | null;
    speakerSecondsLeft: number;
    onAcceptAudio: (id: string) => void;
    onDeclineAudio: (id: string) => void;
    onEndSpeaker: () => void;
    draft: string;
    onDraftChange: (v: string) => void;
    onSend: () => void;
}) {
    const {
        activeTab,
        onTabChange,
        messages,
        qaItems,
        viewers,
        liveLangMix,
        audioRequests,
        currentSpeaker,
        speakerSecondsLeft,
        onAcceptAudio,
        onDeclineAudio,
        onEndSpeaker,
        draft,
        onDraftChange,
        onSend,
    } = props;

    const pending = audioRequests.filter((r) => r.status === "pending");

    const renderBody = () => {
        if (activeTab === "qa") {
            return (
                <div className="space-y-2">
                    {qaItems.map((q) => (
                        <div key={q.id} className="rounded-xl px-3 py-2 bg-slate-950 border border-slate-800">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-semibold truncate text-[11px] text-slate-100">{q.question}</span>
                                <span className="text-[10px] text-slate-500 truncate">{q.from}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${q.status === "pinned"
                                    ? "bg-emerald-100/10 text-emerald-300 border-emerald-500/50"
                                    : q.status === "answered"
                                        ? "bg-slate-900 text-slate-300 border-slate-700"
                                        : "bg-slate-900 text-slate-300 border-slate-700"
                                    }`}>
                                    <span className="material-icons text-[13px]">{q.status === "pinned" ? "push_pin" : q.status === "answered" ? "check_circle" : "help_outline"}</span>
                                    {q.status === "pinned" ? "Pinned" : q.status === "answered" ? "Answered" : "Waiting"}
                                </span>
                                <span className="text-[10px] text-slate-400">{q.langTag ?? ""}</span>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (activeTab === "viewers") {
            return (
                <div className="space-y-1.5">
                    {viewers.slice(0, 18).map((v) => (
                        <div key={v.id} className="flex items-center justify-between gap-3 px-2 py-1 rounded-lg hover:bg-slate-900">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-[11px] font-semibold text-slate-100">
                                    {v.name.split(" ")[1]}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="truncate text-[11px] text-slate-100">{v.name}</span>
                                    <span className="text-[10px] text-slate-400">{langTag(v.lang, v.listenMode)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                                <button className="px-2 py-0.5 rounded-full border border-slate-700 text-slate-200 hover:bg-slate-900">Mute</button>
                                <button className="px-2 py-0.5 rounded-full border border-rose-500/70 text-rose-300 hover:bg-rose-900/40">Ban</button>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        // chat
        return (
            <div className="space-y-1.5">
                {messages.map((m) => (
                    <div key={m.id} className="text-[10px]">
                        <div className="flex items-center gap-2">
                            <span className={`font-semibold ${m.system ? "text-slate-400" : "text-slate-100"}`}>{m.system ? "System" : m.from}</span>
                            <span className="text-slate-500">· {m.time}</span>
                            {m.langTag && !m.system && (
                                <span className="px-2 py-0.5 rounded-full border border-slate-700 bg-slate-900 text-[9px] text-slate-200">
                                    {m.langTag}
                                </span>
                            )}
                        </div>
                        <p className="text-slate-200 whitespace-pre-line">{m.body}</p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col overflow-hidden flex-1">
            <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                    <h3 className="text-xs font-semibold">Live audience</h3>
                    <p className="text-[10px] text-slate-500">Chat, Q&A, viewers, language mix, audio requests</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="inline-flex rounded-full bg-slate-950 border border-slate-800 p-0.5 text-[10px]">
                        <button className={`px-3 py-1 rounded-full ${activeTab === "chat" ? "bg-white text-slate-900" : "text-slate-300"}`} onClick={() => onTabChange("chat")}>Chat</button>
                        <button className={`px-3 py-1 rounded-full ${activeTab === "qa" ? "bg-white text-slate-900" : "text-slate-300"}`} onClick={() => onTabChange("qa")}>Q&A</button>
                        <button className={`px-3 py-1 rounded-full ${activeTab === "viewers" ? "bg-white text-slate-900" : "text-slate-300"}`} onClick={() => onTabChange("viewers")}>Viewers</button>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                        {liveLangMix.map((s) => (
                            <span key={s.label} className="px-2 py-0.5 rounded-full border border-slate-700 bg-slate-950 text-[9px] text-slate-200">
                                {s.label} · {s.pct}%
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Audio requests block */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-2 mb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="material-icons text-[16px] text-emerald-300">mic</span>
                        <span className="text-[11px] font-semibold text-slate-100">Audio requests</span>
                        <span className="text-[10px] text-slate-400">({pending.length} pending)</span>
                    </div>
                    {currentSpeaker ? (
                        <button className="px-2.5 py-1 rounded-full border border-rose-500/70 bg-rose-500/10 text-[10px] text-rose-200 hover:bg-rose-500/20" onClick={onEndSpeaker}>
                            End live audio
                        </button>
                    ) : (
                        <span className="text-[10px] text-slate-500">Accept one at a time</span>
                    )}
                </div>

                {currentSpeaker && (
                    <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                        <span className="text-slate-200">
                            Live speaker: <span className="font-semibold">{currentSpeaker.viewerName}</span> · {currentSpeaker.langTag}
                        </span>
                        <span className="px-2 py-0.5 rounded-full border border-slate-700 bg-slate-900 text-slate-200">
                            {formatHMS(speakerSecondsLeft)}
                        </span>
                    </div>
                )}

                <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                    {pending.length === 0 ? (
                        <div className="text-[10px] text-slate-500">No pending requests right now.</div>
                    ) : (
                        pending.slice(0, 3).map((r) => (
                            <div key={r.id} className="flex items-center justify-between gap-2 text-[10px] border border-slate-800 rounded-lg px-2 py-1">
                                <div className="min-w-0">
                                    <div className="text-slate-100 truncate">{r.viewerName}</div>
                                    <div className="text-slate-500 truncate">{r.langTag} · {r.time}</div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px]" onClick={() => onAcceptAudio(r.id)}>Accept</button>
                                    <button className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 text-[9px]" onClick={() => onDeclineAudio(r.id)}>Decline</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-0 border border-slate-800 rounded-xl p-2.5 bg-slate-950 overflow-y-auto max-h-80">
                {renderBody()}
            </div>

            <div className="flex items-center gap-1 text-[10px] pt-2">
                <button className="h-7 w-7 rounded-full border border-slate-700 text-slate-200 flex items-center justify-center" title="Audio tools" onClick={() => onTabChange("viewers")}>
                    <span className="material-icons text-[16px]">mic</span>
                </button>
                <button className="h-7 w-7 rounded-full border border-slate-700 text-slate-200 flex items-center justify-center" title="Attach" onClick={() => alert("Attach file (demo)")}>
                    <span className="material-icons text-[16px]">attach_file</span>
                </button>
                <input
                    className="flex-1 border border-slate-700 rounded-full px-2 py-1 bg-slate-950 text-slate-100 outline-none"
                    placeholder="Type a reply or pin a highlight..."
                    value={draft}
                    onChange={(e) => onDraftChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            onSend();
                        }
                    }}
                />
                <button className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: EV_ORANGE }} onClick={onSend}>
                    Send
                </button>
            </div>
        </div>
    );
}
