"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useEngines, EngineState } from "@/hooks/useEngines";
import { Product, ChatMsg, LiveViewer, SaleEvent, AiHint, QaItem, FlashDealState as StudioFlashDealState } from "@/app/studio/components/shared/types";

interface EngineContextValue {
  // State
  state: EngineState;
  products: Product[];
  viewers: LiveViewer[];
  chatMessages: ChatMsg[];
  salesEvents: SaleEvent[];
  qaItems: QaItem[];
  aiHints: AiHint[];
  flashDeal: StudioFlashDealState;
  
  // Streaming methods
  initializeStreaming: (canvas: HTMLCanvasElement, video: HTMLVideoElement) => Promise<boolean>;
  startCamera: (sourceId?: string, name?: string) => Promise<unknown>;
  startScreenShare: (sourceId?: string, name?: string) => Promise<unknown>;
  stopSource: (sourceId: string) => void;
  startStream: (protocol?: "webrtc" | "rtmp" | "hls", config?: Record<string, unknown>) => Promise<boolean>;
  stopStream: () => Promise<void>;
  getStreamHealth: () => unknown;
  getStreamStats: () => unknown;
  
  // Commerce methods
  pinProduct: (productId: string) => void;
  unpinProduct: () => void;
  startFlashDeal: (productId: string, durationSeconds?: number) => void;
  stopFlashDeal: () => void;
  
  // Interactive methods
  sendChatMessage: (content: string) => void;
  submitQuestion: (question: string, language?: string) => void;
  pinQuestion: (questionId: string) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  highlightQuestion: (questionId: string) => void;
  
  // Moderation methods
  muteUser: (userId: string, userName: string, durationSeconds?: number) => void;
  banUser: (userId: string, userName: string, reason?: string) => void;
  unbanUser: (userId: string, userName?: string) => void;
  filterMessage: (content: string, userId: string) => { flagged: boolean; action: string | null };
  
  // Analytics methods
  updateViewerCount: (count: number) => void;
  updateEngagement: (messages: number, reactions: number, questions: number) => void;
  updateCommerceMetrics: (purchases: number, purchaseValue: number) => void;
  updateQualityMetrics: (bitrate: number, fps: number, healthScore: number) => void;
  recordSample: () => void;
  getStats: () => unknown;
  
  // Helper methods
  addAiHint: (text: string, severity: AiHint["severity"]) => void;
  addSaleEvent: (label: string, amount?: string, langTag?: string) => void;
  connect: () => void;
  disconnect: () => void;
  
  // Engine refs
  engines: {
    streaming: unknown;
    commerce: unknown;
    interactive: unknown;
    moderation: unknown;
    analytics: unknown;
  };
}

const EngineContext = createContext<EngineContextValue | null>(null);

export function EngineProvider({ 
  children, 
  sessionId,
  onViewerJoin,
  onViewerLeave,
  onNewMessage,
  onNewQuestion,
  onSaleEvent,
  onMetricsUpdate,
  onAiHint
}: {
  children: ReactNode;
  sessionId?: string;
  onViewerJoin?: (viewer: LiveViewer) => void;
  onViewerLeave?: (viewerId: string) => void;
  onNewMessage?: (message: ChatMsg) => void;
  onNewQuestion?: (question: QaItem) => void;
  onSaleEvent?: (event: SaleEvent) => void;
  onMetricsUpdate?: (metrics: unknown) => void;
  onAiHint?: (hint: AiHint) => void;
}) {
  const engines = useEngines({
    sessionId,
    onViewerJoin,
    onViewerLeave,
    onNewMessage,
    onNewQuestion,
    onSaleEvent,
    onMetricsUpdate: onMetricsUpdate as (metrics: import("@/engines/analytics").StreamMetrics) => void,
    onAiHint,
  });

  return (
    <EngineContext.Provider value={engines}>
      {children}
    </EngineContext.Provider>
  );
}

export function useEngineContext() {
  const context = useContext(EngineContext);
  if (!context) {
    throw new Error("useEngineContext must be used within EngineProvider");
  }
  return context;
}

// Hook to get streaming engine specifically
export function useStreamingEngine() {
  const { initializeStreaming, startCamera, startScreenShare, stopSource, startStream, stopStream, getStreamHealth, getStreamStats, engines } = useEngineContext();
  return {
    initializeStreaming,
    startCamera,
    startScreenShare,
    stopSource,
    startStream,
    stopStream,
    getStreamHealth,
    getStreamStats,
    engine: engines.streaming,
  };
}

// Hook to get commerce engine specifically  
export function useCommerceEngine() {
  const { pinProduct, unpinProduct, startFlashDeal, stopFlashDeal, products, flashDeal, engines } = useEngineContext();
  return {
    pinProduct,
    unpinProduct,
    startFlashDeal,
    stopFlashDeal,
    products,
    flashDeal,
    engine: engines.commerce,
  };
}

// Hook to get interactive engine specifically
export function useInteractive() {
  const { sendChatMessage, submitQuestion, pinQuestion, answerQuestion, highlightQuestion, viewers, chatMessages, qaItems, engines } = useEngineContext();
  return {
    sendChatMessage,
    submitQuestion,
    pinQuestion,
    answerQuestion,
    highlightQuestion,
    viewers,
    chatMessages,
    qaItems,
    engine: engines.interactive,
  };
}

// Hook to get moderation engine specifically
export function useModeration() {
  const { muteUser, banUser, unbanUser, filterMessage, engines } = useEngineContext();
  return {
    muteUser,
    banUser,
    unbanUser,
    filterMessage,
    engine: engines.moderation,
  };
}

// Hook to get analytics engine specifically
export function useAnalytics() {
  const { updateViewerCount, updateEngagement, updateCommerceMetrics, updateQualityMetrics, recordSample, getStats, state, engines } = useEngineContext();
  return {
    updateViewerCount,
    updateEngagement,
    updateCommerceMetrics,
    updateQualityMetrics,
    recordSample,
    getStats,
    state: state.analytics,
    engine: engines.analytics,
  };
}
