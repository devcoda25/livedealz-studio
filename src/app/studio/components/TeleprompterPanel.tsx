"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { CampaignSession } from "./types";

interface ScriptCue {
  id: string;
  text: string;
  duration?: number;
}

interface RunOfShowItem {
  id: string;
  label: string;
  window: string;
  scene: string;
  duration?: number;
}

export function TeleprompterPanel(props: {
  currentSession: CampaignSession | null;
}) {
  const { currentSession } = props;

  // Use session data if available, otherwise fallback to defaults
  const defaultCues: ScriptCue[] = [
    { id: "cue-1", text: "Welcome + short intro.", duration: 30 },
    { id: "cue-2", text: "Explain key benefits clearly.", duration: 60 },
    { id: "cue-3", text: "Mention flash deal and show the timer.", duration: 45 },
    { id: "cue-4", text: "Answer 2 top questions.", duration: 60 },
    { id: "cue-5", text: "Recommend the best bundle.", duration: 45 },
    { id: "cue-6", text: "Close with CTA and follow reminder.", duration: 30 },
  ];

  const defaultShow: RunOfShowItem[] = [
    { id: "shot-1", label: "Intro + hook", window: "00:00-03:00", scene: "intro", duration: 180 },
    { id: "shot-2", label: "Hero demo", window: "03:00-08:00", scene: "product", duration: 300 },
    { id: "shot-3", label: "Offer + urgency", window: "08:00-12:00", scene: "offer", duration: 240 },
    { id: "shot-4", label: "Q&A", window: "12:00-18:00", scene: "split", duration: 360 },
  ];

  const [isLive, setIsLive] = useState(false);
  const [currentCueIndex, setCurrentCueIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [scriptCues, setScriptCues] = useState<ScriptCue[]>(defaultCues);
  const [runOfShow, setRunOfShow] = useState<RunOfShowItem[]>(defaultShow);

  // Update content when session changes
  useEffect(() => {
    if (currentSession) {
      if (currentSession.scriptCues?.length) {
        setScriptCues(currentSession.scriptCues);
      }
      if (currentSession.runOfShow?.length) {
        setRunOfShow(currentSession.runOfShow);
      }
    }
  }, [currentSession]);

  const [currentShowIndex, setCurrentShowIndex] = useState(0);
  const cueRefs = useRef<(HTMLDivElement | null)[]>([]);
  const showRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Timer effect
  useEffect(() => {
    if (!isLive || isPaused) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive, isPaused]);

  // Auto-scroll to current cue
  useEffect(() => {
    if (cueRefs.current[currentCueIndex]) {
      cueRefs.current[currentCueIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentCueIndex]);

  // Auto-scroll to current show segment
  useEffect(() => {
    if (showRefs.current[currentShowIndex]) {
      showRefs.current[currentShowIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentShowIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLive) return;

      switch (e.key) {
        case "ArrowDown":
        case " ":
        case "PageDown":
          e.preventDefault();
          advanceCue();
          break;
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          previousCue();
          break;
        case "Home":
          e.preventDefault();
          setCurrentCueIndex(0);
          break;
        case "End":
          e.preventDefault();
          setCurrentCueIndex(scriptCues.length - 1);
          break;
        case "p":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setIsPaused((prev) => !prev);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLive, scriptCues.length]);

  const advanceCue = useCallback(() => {
    setCurrentCueIndex((prev) => Math.min(prev + 1, scriptCues.length - 1));
  }, [scriptCues.length]);

  const previousCue = useCallback(() => {
    setCurrentCueIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="material-icons text-[16px] text-primary">subtitles</span>
          <span className="text-[11px] font-semibold text-foreground">
            {currentSession ? `${currentSession.name}` : "Teleprompter"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!isLive ? (
            <button
              onClick={() => setIsLive(true)}
              className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/30"
            >
              Go Live
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsPaused((v) => !v)}
                className="p-1 rounded hover:bg-muted"
                title={isPaused ? "Resume" : "Pause"}
              >
                <span className="material-icons text-[14px]">{isPaused ? "play_arrow" : "pause"}</span>
              </button>
              <button
                onClick={() => setIsLive(false)}
                className="p-1 rounded hover:bg-muted"
                title="Stop"
              >
                <span className="material-icons text-[14px] text-rose-400">stop</span>
              </button>
              <span className="text-[10px] text-muted-foreground ml-2 font-mono">
                {formatTime(elapsedTime)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      {!currentSession ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <span className="material-icons text-[32px] text-muted-foreground/50">campaign</span>
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-2">No Session Loaded</h3>
          <p className="text-[11px] text-muted-foreground mb-4">
            Add a session plan to your teleprompter from My Campaigns
          </p>
          <button
            className="px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 text-[11px] font-medium"
            onClick={() => {
              // This would trigger the campaign modal - handled by parent
            }}
          >
            Select Campaign
          </button>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          {/* Script cues */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {scriptCues.map((cue, index) => (
            <div
              key={cue.id}
              ref={(el) => { cueRefs.current[index] = el; }}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer ${index === currentCueIndex
                  ? "bg-primary/10 border-primary/30 shadow-sm"
                  : "bg-muted/20 border-transparent hover:bg-muted/40"
                }`}
              onClick={() => setCurrentCueIndex(index)}
            >
              <div className="flex items-start gap-2">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${index === currentCueIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-[11px] text-foreground leading-relaxed">{cue.text}</p>
                  {cue.duration && (
                    <span className="text-[9px] text-muted-foreground mt-1 block">
                      ⏱ {cue.duration}s
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Navigation hint */}
      {isLive && (
        <div className="px-3 py-1.5 border-t border-border bg-muted/20 text-[9px] text-muted-foreground flex items-center justify-between">
          <span>↑↓ Navigate • Space Next • P Pause</span>
          <span>Current: {currentCueIndex + 1}/{scriptCues.length}</span>
        </div>
      )}
    </div>
  );
}
