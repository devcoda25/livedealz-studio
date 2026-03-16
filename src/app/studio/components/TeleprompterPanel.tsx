"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

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

export function TeleprompterPanel() {
  const [isLive, setIsLive] = useState(false);
  const [currentCueIndex, setCurrentCueIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [scriptCues] = useState<ScriptCue[]>([
    { id: "cue-1", text: "Welcome + short intro.", duration: 30 },
    { id: "cue-2", text: "Explain key benefits clearly.", duration: 60 },
    { id: "cue-3", text: "Mention flash deal and show the timer.", duration: 45 },
    { id: "cue-4", text: "Answer 2 top questions.", duration: 60 },
    { id: "cue-5", text: "Recommend the best bundle.", duration: 45 },
    { id: "cue-6", text: "Close with CTA and follow reminder.", duration: 30 },
  ]);

  const runOfShow: RunOfShowItem[] = [
    { id: "shot-1", label: "Intro + hook", window: "00:00-03:00", scene: "intro", duration: 180 },
    { id: "shot-2", label: "Hero demo", window: "03:00-08:00", scene: "product", duration: 300 },
    { id: "shot-3", label: "Offer + urgency", window: "08:00-12:00", scene: "offer", duration: 240 },
    { id: "shot-4", label: "Q&A", window: "12:00-18:00", scene: "split", duration: 360 },
  ];

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
        case "P":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setIsPaused((prev) => !prev);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLive, currentCueIndex, scriptCues.length]);

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

  const getCueProgress = () => {
    const currentCue = scriptCues[currentCueIndex];
    if (!currentCue?.duration) return 0;
    return Math.min((elapsedTime / currentCue.duration) * 100, 100);
  };

  const getShowProgress = () => {
    const currentShow = runOfShow[currentShowIndex];
    if (!currentShow?.duration) return 0;
    
    const segmentStart = runOfShow.slice(0, currentShowIndex).reduce((acc, s) => acc + (s.duration || 0), 0);
    const segmentElapsed = elapsedTime - segmentStart;
    return Math.min((segmentElapsed / currentShow.duration) * 100, 100);
  };

  const getSegmentElapsed = () => {
    const segmentStart = runOfShow.slice(0, currentShowIndex).reduce((acc, s) => acc + (s.duration || 0), 0);
    return Math.max(elapsedTime - segmentStart, 0);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 text-[11px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px]">📜</span>
          <h3 className="text-xs font-semibold">Teleprompter</h3>
        </div>
        
        {/* Live Control */}
        <div className="flex items-center gap-2">
          {!isLive ? (
            <button
              onClick={() => { setIsLive(true); setElapsedTime(0); setCurrentCueIndex(0); setCurrentShowIndex(0); }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/20 text-primary text-[10px] font-medium hover:bg-primary/30 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Start
            </button>
          ) : (
            <button
              onClick={() => setIsLive(false)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/20 text-destructive text-[10px] font-medium hover:bg-destructive/30 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Timer Display */}
      {isLive && (
        <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 border border-border">
          <div className="flex items-center gap-3">
            <span className="text-lg font-mono text-foreground">{formatTime(elapsedTime)}</span>
            {isPaused && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-600/20 text-amber-600 dark:text-amber-400">PAUSED</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused((p) => !p)}
              className="text-muted-foreground hover:text-foreground text-[10px]"
              title="Pause/Resume (Ctrl+P)"
            >
              {isPaused ? "▶ Resume" : "⏸ Pause"}
            </button>
            <span className="text-muted-foreground/50">|</span>
            <span className="text-muted-foreground text-[9px]">
              Cue {currentCueIndex + 1}/{scriptCues.length} • ↓ Space to advance
            </span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isLive && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] text-muted-foreground">
            <span>Current Cue</span>
            <span>{Math.round(getCueProgress())}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-orange-400 transition-all duration-500"
              style={{ width: `${getCueProgress()}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col gap-3">
        {/* Run-of-Show Section */}
        <div className="border border-border rounded-xl p-3 bg-card text-[11px] text-foreground max-h-40 overflow-y-auto hide-scrollbar">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
            <span>Run of Show</span>
            {isLive && (
              <span className="text-primary">
                {formatTime(getSegmentElapsed())} / {formatTime(runOfShow[currentShowIndex]?.duration || 0)}
              </span>
            )}
          </div>
          <ul className="space-y-1.5">
            {runOfShow.map((shot, idx) => (
              <li 
                key={shot.id}
                ref={(el) => { showRefs.current[idx] = el; }}
                className={`flex items-start gap-3 p-2 rounded-lg transition-all cursor-pointer ${
                  isLive && idx === currentShowIndex
                    ? "bg-primary/20 border border-primary/30"
                    : idx < (isLive ? currentShowIndex : runOfShow.length)
                    ? "opacity-50"
                    : "hover:bg-accent"
                }`}
                onClick={() => isLive && setCurrentShowIndex(idx)}
              >
                <div className="flex flex-col items-center gap-1 min-w-[40px]">
                  <span className="text-muted-foreground text-[9px]">{shot.window}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    isLive && idx === currentShowIndex 
                      ? "bg-primary text-primary-foreground" 
                      : idx === 0 
                      ? "bg-emerald-600/20 text-emerald-600 dark:text-emerald-400" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {idx + 1}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="font-medium text-foreground">{shot.label}</span>
                  <span className="text-muted-foreground text-[9px]">Scene: {shot.scene}</span>
                </div>
                {isLive && idx === currentShowIndex && (
                  <span className="text-[9px] text-primary animate-pulse">● LIVE</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Script Cues Section */}
        <div className="space-y-1 max-h-56 overflow-y-auto hide-scrollbar pr-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Script Cues</div>
          {scriptCues.map((cue, idx) => (
            <div 
              key={cue.id}
              ref={(el) => { cueRefs.current[idx] = el; }}
              className={`text-[11px] px-3 py-2.5 rounded-lg border transition-all cursor-pointer ${
                isLive && idx === currentCueIndex
                  ? "bg-primary/20 border-primary/30 text-foreground shadow-lg shadow-primary/10"
                  : idx < (isLive ? currentCueIndex : scriptCues.length)
                  ? "bg-muted/50 border-border text-muted-foreground opacity-60"
                  : "bg-card border-border text-foreground hover:bg-accent"
              }`}
              onClick={() => isLive && setCurrentCueIndex(idx)}
            >
              <div className="flex items-center justify-between mb-1">
                {isLive && idx === currentCueIndex && (
                  <span className="text-[9px] uppercase tracking-wide text-primary font-semibold">
                    Now:
                  </span>
                )}
                {!isLive && (
                  <span className="text-muted-foreground mr-2">•</span>
                )}
                {isLive && cue.duration && (
                  <span className="text-[9px] text-muted-foreground">
                    ~{cue.duration}s
                  </span>
                )}
              </div>
              {cue.text}
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      {isLive && (
        <div className="text-[9px] text-muted-foreground bg-muted rounded-lg p-2 flex items-center justify-center gap-4">
          <span><kbd className="px-1 py-0.5 bg-background rounded">↓</kbd> / <kbd className="px-1 py-0.5 bg-background rounded">Space</kbd> Next</span>
          <span><kbd className="px-1 py-0.5 bg-background rounded">↑</kbd> Previous</span>
          <span><kbd className="px-1 py-0.5 bg-background rounded">Ctrl+P</kbd> Pause</span>
        </div>
      )}
    </div>
  );
}
