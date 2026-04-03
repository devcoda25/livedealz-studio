"use client";

import { useEffect, useState, useRef } from "react";
import { AiHint } from "../shared/types";

interface AIPromptsToastProps {
  prompts: AiHint[];
  onDismiss: (id: string) => void;
}

export function AIPromptsToast({ prompts, onDismiss }: AIPromptsToastProps) {
  const [visiblePrompts, setVisiblePrompts] = useState<AiHint[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const visibleRef = useRef<AiHint[]>([]);
  const processedRef = useRef<Set<string>>(new Set());

  // Show new prompts as toasts (limit to 3 visible)
  useEffect(() => {
    const uniquePrompts = prompts.filter(
      (p, index, self) => index === self.findIndex((t) => t.id === p.id)
    );
    
    const newPrompts = uniquePrompts.filter(
      (p) => !dismissedIds.has(p.id) && !processedRef.current.has(p.id)
    );

    if (newPrompts.length > 0) {
      // Mark these as processed
      newPrompts.forEach((p) => processedRef.current.add(p.id));
      
      setVisiblePrompts((prev) => {
        const combined = [...prev, ...newPrompts];
        // Remove any duplicates by ID
        const seen = new Set<string>();
        const filtered = combined.filter((p) => {
          const duplicate = seen.has(p.id);
          seen.add(p.id);
          return !duplicate;
        });
        const result = filtered.slice(-3); // Keep only last 3
        visibleRef.current = result;
        return result;
      });
    }
  }, [prompts, dismissedIds]);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    visiblePrompts.forEach((prompt) => {
      const timer = setTimeout(() => {
        handleDismiss(prompt.id);
      }, 8000);
      timers.push(timer);
    });
    
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [visiblePrompts]);

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev.add(id)));
    setVisiblePrompts((prev) => {
      const result = prev.filter((p) => p.id !== id);
      visibleRef.current = result;
      return result;
    });
    processedRef.current.add(id);
    onDismiss(id);
  };

  if (visiblePrompts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {visiblePrompts.map((prompt) => (
        <div
          key={prompt.id}
          className="pointer-events-auto bg-card/95 backdrop-blur border border-border rounded-xl p-4 shadow-xl max-w-sm animate-in slide-in-from-right duration-300"
        >
          <div className="flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  prompt.severity === "warning" ? "bg-amber-500/20 border-amber-500/50 text-amber-600 dark:text-amber-400" :
                  prompt.severity === "info" ? "bg-blue-500/20 border-blue-500/50 text-blue-600 dark:text-blue-400" :
                  prompt.severity === "opportunity" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400" :
                  "bg-muted border-border text-muted-foreground"
                }`}>
                  {prompt.severity}
                </span>
                <span className="text-[10px] text-muted-foreground">{prompt.time}</span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{prompt.text}</p>
            </div>
            <button
              onClick={() => handleDismiss(prompt.id)}
              className="text-muted-foreground hover:text-foreground text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
