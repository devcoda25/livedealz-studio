import React, { useRef, useState } from "react";
import { AudienceTab, ChatMsg, QaItem, LiveViewer, AudioRequest, CurrentSpeaker, LivePoll, PollOption, Giveaway } from "./types";
import { uid } from "./utils";
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
    // New callbacks
    onSendMessage?: (message: string) => void;
    onPinQuestion?: (id: string) => void;
    onAnswerQuestion?: (id: string) => void;
    onMuteViewer?: (id: string) => void;
    onBanViewer?: (id: string) => void;
    draft: string;
    onDraftChange: (v: string) => void;
    onSend: () => void;
    // Poll props
    polls: LivePoll[];
    onCreatePoll?: (question: string, options: string[]) => void;
    onVotePoll?: (pollId: string, optionId: string) => void;
    onClosePoll?: (pollId: string) => void;
    onDeletePoll?: (pollId: string) => void;
    // Giveaway props
    giveaways: Giveaway[];
    onPickWinner?: (giveawayId: string) => void;
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
        onSendMessage,
        onPinQuestion,
        onAnswerQuestion,
        onMuteViewer,
        onBanViewer,
        draft,
        onDraftChange,
        onSend,
        polls,
        onCreatePoll,
        onVotePoll,
        onClosePoll,
        onDeletePoll,
        giveaways,
        onPickWinner,
    } = props;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const pending = audioRequests.filter((r) => r.status === "pending");

    const handleAttach = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // In a real app, this would upload the file
            console.log("Attached file:", file.name);
            // For now, just add a system message
            onSendMessage?.(`Attached file: ${file.name}`);
        }
        // Reset input
        e.target.value = "";
    };

    const renderQATab = () => (
        <div className="space-y-2">
            {qaItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-[11px]">
                    No questions yet. Viewers can ask questions in Q&A.
                </div>
            ) : (
                qaItems.map((q) => (
                    <div key={q.id} className="rounded-xl px-3 py-2.5 bg-muted/50 border border-border hover:border-primary/30 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                                <span className="font-semibold text-[11px] text-foreground block truncate">{q.question}</span>
                                <span className="text-[10px] text-muted-foreground">from {q.from}</span>
                            </div>
                            <span className="text-[9px] text-muted-foreground shrink-0">{q.langTag}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] border ${q.status === "pinned"
                                ? "bg-amber-100/10 text-amber-300 border-amber-500/50"
                                : q.status === "answered"
                                    ? "bg-emerald-100/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/50"
                                    : "bg-muted text-muted-foreground border-border"
                                }`}>
                                <span className="material-icons text-[12px]">
                                    {q.status === "pinned" ? "push_pin" : q.status === "answered" ? "check_circle" : "help_outline"}
                                </span>
                                {q.status === "pinned" ? "Pinned" : q.status === "answered" ? "Answered" : "Waiting"}
                            </span>
                            <div className="flex gap-1">
                                {q.status !== "pinned" && (
                                    <button
                                        onClick={() => onPinQuestion?.(q.id)}
                                        className="px-2 py-0.5 rounded-full border border-amber-500/50 text-amber-300 hover:bg-amber-500/20 text-[9px]"
                                    >
                                        Pin
                                    </button>
                                )}
                                {q.status !== "answered" && (
                                    <button
                                        onClick={() => onAnswerQuestion?.(q.id)}
                                        className="px-2 py-0.5 rounded-full border border-emerald-500/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-[9px]"
                                    >
                                        Mark Answered
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderViewersTab = () => (
        <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground mb-2">
                {viewers.length} viewers online
            </div>
            {viewers.slice(0, 20).map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
                            {v.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="truncate text-[11px] text-foreground font-medium">{v.name}</span>
                            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                                <span className="inline-flex items-center gap-0.5">
                                    <span className="material-icons text-[10px]">translate</span>
                                    {v.lang.toUpperCase()}
                                </span>
                                <span>·</span>
                                <span className="inline-flex items-center gap-0.5">
                                    {v.listenMode === "original" ? "🔊" : "🤖"} {v.listenMode === "original" ? "Original" : "AI"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onMuteViewer?.(v.id)}
                            className="p-1.5 rounded-full border border-border text-muted-foreground hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/50"
                            title="Mute"
                        >
                            <span className="material-icons text-[14px]">volume_off</span>
                        </button>
                        <button
                            onClick={() => onBanViewer?.(v.id)}
                            className="p-1.5 rounded-full border border-rose-500/50 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500"
                            title="Ban"
                        >
                            <span className="material-icons text-[14px]">block</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderChatTab = () => (
        <div className="space-y-2">
            {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-[11px]">
                    No messages yet. Start the conversation!
                </div>
            ) : (
                messages.map((m) => (
                    <div key={m.id} className="text-[10px] group">
                        <div className="flex items-center gap-1.5">
                            <span className={`font-semibold ${m.system ? "text-amber-400" : "text-foreground"}`}>
                                {m.system ? "🔔 System" : m.from}
                            </span>
                            <span className="text-muted-foreground text-[9px]">· {m.time}</span>
                            {m.langTag && !m.system && (
                                <span className="px-1.5 py-0.5 rounded-full border border-border bg-muted text-[8px] text-muted-foreground">
                                    {m.langTag}
                                </span>
                            )}
                        </div>
                        <p className="text-foreground whitespace-pre-line ml-0 mt-0.5">{m.body}</p>
                    </div>
                ))
            )}
        </div>
    );

    // Poll state for creating new polls
    const [showPollCreator, setShowPollCreator] = useState(false);
    const [newPollQuestion, setNewPollQuestion] = useState("");
    const [newPollOptions, setNewPollOptions] = useState(["", ""]);

    // Poll state for creating new polls

    const handleCreatePoll = () => {
        const validOptions = newPollOptions.filter(o => o.trim() !== "");
        if (newPollQuestion.trim() && validOptions.length >= 2) {
            onCreatePoll?.(newPollQuestion.trim(), validOptions);
            setNewPollQuestion("");
            setNewPollOptions(["", ""]);
            setShowPollCreator(false);
        }
    };

    const addPollOption = () => {
        if (newPollOptions.length < 6) {
            setNewPollOptions([...newPollOptions, ""]);
        }
    };

    const updatePollOption = (index: number, value: string) => {
        const updated = [...newPollOptions];
        updated[index] = value;
        setNewPollOptions(updated);
    };

    const removePollOption = (index: number) => {
        if (newPollOptions.length > 2) {
            const updated = newPollOptions.filter((_, i) => i !== index);
            setNewPollOptions(updated);
        }
    };

    // Giveaway winner picking state
    const [pickingWinner, setPickingWinner] = useState<{ giveawayId: string; isAnimating: boolean; winner: { id: string; name: string } | null } | null>(null);

    const renderPollsTab = () => (
        <div className="space-y-3">
            {/* Create Poll Button */}
            {!showPollCreator ? (
                <button
                    onClick={() => setShowPollCreator(true)}
                    className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-colors flex items-center justify-center gap-2 text-[11px] font-medium"
                >
                    <span className="material-icons text-[16px]">add_circle</span>
                    Create New Poll
                </button>
            ) : (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-3">
                    <div className="text-[11px] font-semibold text-foreground">New Poll</div>
                    <input
                        type="text"
                        value={newPollQuestion}
                        onChange={(e) => setNewPollQuestion(e.target.value)}
                        placeholder="Ask a question..."
                        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-[11px] outline-none focus:border-primary/50"
                    />
                    <div className="space-y-2">
                        {newPollOptions.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => updatePollOption(i, e.target.value)}
                                    placeholder={`Option ${i + 1}`}
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-[11px] outline-none focus:border-primary/50"
                                />
                                {newPollOptions.length > 2 && (
                                    <button
                                        onClick={() => removePollOption(i)}
                                        className="p-1 text-muted-foreground hover:text-rose-400"
                                    >
                                        <span className="material-icons text-[16px]">close</span>
                                    </button>
                                )}
                            </div>
                        ))}
                        {newPollOptions.length < 6 && (
                            <button
                                onClick={addPollOption}
                                className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1"
                            >
                                <span className="material-icons text-[14px]">add</span>
                                Add Option
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowPollCreator(false)}
                            className="flex-1 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted text-[11px]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreatePoll}
                            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] font-medium"
                        >
                            Launch Poll
                        </button>
                    </div>
                </div>
            )}

            {/* Active Polls */}
            {polls.length === 0 && !showPollCreator ? (
                <div className="text-center py-8 text-muted-foreground text-[11px]">
                    No polls yet. Create one to engage your audience!
                </div>
            ) : (
                polls.map((poll) => {
                    const topOption = poll.options.reduce((a, b) => a.votes > b.votes ? a : b, poll.options[0]);
                    return (
                        <div key={poll.id} className="rounded-xl border border-border bg-card overflow-hidden">
                            <div className="px-3 py-2.5 bg-muted/30 border-b border-border">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-[11px] font-semibold text-foreground">{poll.question}</span>
                                    {poll.isActive ? (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] border border-emerald-500/30 shrink-0">
                                            Live
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[9px] shrink-0">
                                            Ended
                                        </span>
                                    )}
                                </div>
                                <div className="text-[9px] text-muted-foreground mt-1">
                                    {poll.totalVotes} votes
                                </div>
                            </div>
                            <div className="p-2 space-y-1.5">
                                {poll.options.map((opt) => {
                                    const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                                    const isTop = opt.id === topOption?.id && poll.totalVotes > 0;
                                    return (
                                        <div
                                            key={opt.id}
                                            className={`relative rounded-lg border overflow-hidden cursor-pointer transition-colors ${poll.isActive
                                                ? "hover:border-primary/50"
                                                : ""
                                                }`}
                                            onClick={() => poll.isActive && onVotePoll?.(poll.id, opt.id)}
                                        >
                                            <div
                                                className="absolute inset-0 bg-primary/10 transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                            <div className="relative px-3 py-2 flex items-center justify-between gap-2">
                                                <span className={`text-[10px] ${isTop ? "font-semibold" : ""}`}>
                                                    {opt.text}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {pct}%
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {poll.isActive ? (
                                <div className="px-2 py-2 border-t border-border flex gap-2">
                                    <button
                                        onClick={() => onClosePoll?.(poll.id)}
                                        className="flex-1 py-1.5 rounded-lg border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 text-[10px]"
                                    >
                                        End Poll
                                    </button>
                                    <button
                                        onClick={() => onDeletePoll?.(poll.id)}
                                        className="px-3 py-1.5 rounded-lg border border-rose-500/50 text-rose-400 hover:bg-rose-500/10 text-[10px]"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ) : (
                                <div className="px-2 py-2 border-t border-border">
                                    <button
                                        onClick={() => onDeletePoll?.(poll.id)}
                                        className="w-full py-1.5 rounded-lg border border-rose-500/50 text-rose-400 hover:bg-rose-500/10 text-[10px]"
                                    >
                                        Delete Poll
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );

    const renderGiveawaysTab = () => (
        <div className="space-y-3">
            {/* Active Giveaways */}
            {giveaways.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-[11px]">
                    No active giveaways. Start one to boost engagement!
                </div>
            ) : (
                <div className="space-y-2">
                    {giveaways.map((giveaway) => (
                        <div
                            key={giveaway.id}
                            className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <div className="font-medium text-foreground text-[11px]">{giveaway.title}</div>
                                    {giveaway.description && (
                                        <div className="text-[10px] text-muted-foreground mt-1">{giveaway.description}</div>
                                    )}
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${giveaway.status === "active" ? "bg-amber-500/20 text-amber-500" :
                                    giveaway.status === "completed" ? "bg-green-500/20 text-green-700 dark:text-green-500" :
                                        "bg-rose-500/20 text-rose-500"
                                    }`}>
                                    {giveaway.status}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                                <span>{giveaway.participants.length} entries</span>
                                {giveaway.prizeValue && <span>Prize: ${giveaway.prizeValue} Gift Box</span>}
                            </div>

                            {giveaway.status === "active" && (
                                <div className="flex gap-2">
                                    {pickingWinner?.giveawayId === giveaway.id ? (
                                        <div className="flex-1 py-1.5 rounded-lg bg-amber-500/50 text-white text-[10px] font-medium flex items-center justify-center gap-2">
                                            <span className="animate-spin">🎰</span>
                                            {pickingWinner.isAnimating ? "Selecting..." : `Winner: ${pickingWinner.winner?.name}!`}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => onPickWinner?.(giveaway.id)}
                                            className="flex-1 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 text-[10px] font-medium"
                                        >
                                            Pick Winner 🎉
                                        </button>
                                    )}
                                </div>
                            )}

                            {giveaway.status === "completed" && giveaway.winnerName && (
                                <div className="mt-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <div className="text-[10px] text-green-500 font-medium">
                                        🎉 Winner: {giveaway.winnerName}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderBody = () => {
        if (activeTab === "qa") return renderQATab();
        if (activeTab === "viewers") return renderViewersTab();
        if (activeTab === "polls") return renderPollsTab();
        if (activeTab === "giveaways") return renderGiveawaysTab();
        return renderChatTab();
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-3 flex flex-col overflow-hidden flex-1 h-full">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                    <h3 className="text-xs font-semibold text-foreground">Live Audience</h3>
                </div>
                <div className="flex flex-col items-end gap-2">
                    {/* Tab buttons */}
                    <div className="inline-flex rounded-full bg-muted/50 border border-border p-0.5 text-[10px]">
                        <button
                            className={`px-3 py-1 rounded-full transition-all ${activeTab === "chat" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            onClick={() => onTabChange("chat")}
                        >
                            💬 Chat
                        </button>
                        <button
                            className={`px-3 py-1 rounded-full transition-all ${activeTab === "qa" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            onClick={() => onTabChange("qa")}
                        >
                            ❓ Q&A
                        </button>
                        <button
                            className={`px-3 py-1 rounded-full transition-all ${activeTab === "viewers" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            onClick={() => onTabChange("viewers")}
                        >
                            👁️ Viewers
                        </button>
                        <button
                            className={`px-3 py-1 rounded-full transition-all ${activeTab === "polls" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            onClick={() => onTabChange("polls")}
                        >
                            📊 Polls
                        </button>
                        <button
                            className={`px-3 py-1 rounded-full transition-all ${activeTab === "giveaways" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            onClick={() => onTabChange("giveaways")}
                        >
                            🎁 Giveaways
                        </button>
                    </div>
                </div>
            </div>

            {/* Audio requests block */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 mb-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="material-icons text-[16px] text-emerald-600 dark:text-emerald-400">mic</span>
                        <span className="text-[11px] font-semibold text-foreground">Live Audio Requests</span>
                        {pending.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-semibold">
                                {pending.length}
                            </span>
                        )}
                    </div>
                    {currentSpeaker ? (
                        <button
                            className="px-2.5 py-1 rounded-full border border-rose-500/70 bg-rose-500/10 text-[10px] text-rose-300 hover:bg-rose-500/30 transition-colors"
                            onClick={onEndSpeaker}
                        >
                            End Session
                        </button>
                    ) : (
                        <span className="text-[10px] text-muted-foreground">Accept one at a time</span>
                    )}
                </div>

                {currentSpeaker && (
                    <div className="mt-2 flex items-center justify-between gap-2 text-[10px] bg-muted/50 rounded-lg px-2 py-1.5">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                            <span className="text-foreground">
                                <span className="font-semibold">{currentSpeaker.viewerName}</span>
                                <span className="text-muted-foreground"> speaking in </span>
                                <span className="font-medium">{currentSpeaker.langTag}</span>
                            </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full border border-border bg-card text-foreground font-mono">
                            {formatHMS(speakerSecondsLeft)}
                        </span>
                    </div>
                )}

                <div className="mt-2 space-y-1.5 max-h-28 overflow-y-auto">
                    {pending.length === 0 ? (
                        <div className="text-[10px] text-muted-foreground py-2 text-center">
                            No pending requests
                        </div>
                    ) : (
                        pending.slice(0, 4).map((r) => (
                            <div key={r.id} className="flex items-center justify-between gap-2 text-[10px] border border-border/50 rounded-lg px-2 py-1.5 bg-muted/30">
                                <div className="min-w-0 flex-1">
                                    <div className="text-foreground font-medium truncate">{r.viewerName}</div>
                                    <div className="text-muted-foreground text-[9px]">{r.langTag}</div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        className="px-2 py-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-medium transition-colors"
                                        onClick={() => onAcceptAudio(r.id)}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className="px-2 py-1 rounded-full bg-muted hover:bg-secondary text-foreground text-[9px] transition-colors"
                                        onClick={() => onDeclineAudio(r.id)}
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat/Q&A/Viewers body */}
            <div className="flex-1 min-h-0 border border-border rounded-xl p-3 bg-muted/30 overflow-y-auto">
                {renderBody()}
            </div>

            {/* Message input */}
            <div className="flex items-center gap-1.5 pt-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                />
                <button
                    className="h-8 w-8 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors"
                    title="Attach file"
                    onClick={handleAttach}
                >
                    <span className="material-icons text-[16px]">attach_file</span>
                </button>
                <input
                    className="flex-1 border border-border rounded-full px-3 py-1.5 bg-card text-foreground text-[11px] outline-none focus:border-primary/50 transition-colors"
                    placeholder="Type a message..."
                    value={draft}
                    onChange={(e) => onDraftChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            onSend();
                        }
                    }}
                />
                <button
                    className="px-4 py-1.5 rounded-full text-[11px] font-semibold text-white hover:brightness-110 transition-all"
                    style={{ backgroundColor: EV_ORANGE }}
                    onClick={onSend}
                >
                    Send
                </button>
            </div>
        </div>
    );
}
