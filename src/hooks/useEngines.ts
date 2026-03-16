"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { StreamingEngine } from "@/engines/streaming/StreamingEngine";
import { CommerceEngine, LiveProduct } from "@/engines/commerce";
import { InteractiveEngine, Viewer, ChatMessage, QAQuestion, AnyAlert } from "@/engines/interactive";
import { ModerationEngine } from "@/engines/moderation";
import { AnalyticsEngine, StreamMetrics } from "@/engines/analytics";
import { AudioMixingEngine, AudioSourceConfig } from "@/engines/audio";
import { Product, ChatMsg, LiveViewer, SaleEvent, AiHint, QaItem, FlashDealState as StudioFlashDealState, ViewerLang, ListenMode } from "@/app/studio/components/types";
import { uid, nowTimeLabel } from "@/app/studio/components/utils";

export interface EngineState {
  streaming: {
    initialized: boolean;
    state: string;
    health: number;
  };
  commerce: {
    connected: boolean;
    pinningState: {
      productId: string | null;
      locked: boolean;
    };
    flashDeal: StudioFlashDealState;
  };
  interactive: {
    connected: boolean;
    viewerCount: number;
    messages: ChatMsg[];
    questions: QaItem[];
  };
  moderation: {
    enabled: boolean;
    mutedUsers: number;
  };
  analytics: {
    tracking: boolean;
    metrics: StreamMetrics | null;
  };
  audio: {
    initialized: boolean;
    sources: AudioSourceConfig[];
    masterVolume: number;
    masterMuted: boolean;
  };
}

interface UseEnginesOptions {
  sessionId?: string;
  onViewerJoin?: (viewer: LiveViewer) => void;
  onViewerLeave?: (viewerId: string) => void;
  onNewMessage?: (message: ChatMsg) => void;
  onNewQuestion?: (question: QaItem) => void;
  onSaleEvent?: (event: SaleEvent) => void;
  onMetricsUpdate?: (metrics: StreamMetrics) => void;
  onAiHint?: (hint: AiHint) => void;
}

// Sample products for demo (matching studio constants)
const SAMPLE_PRODUCTS: LiveProduct[] = [
  {
    id: "P-101",
    title: "GlowUp Serum - 30ml",
    description: "Premium anti-aging serum",
    thumbnailUrl: "/placeholder.jpg",
    type: "retail",
    category: "Skincare",
    pricing: {
      retailOriginal: 24,
      retailPromo: 24,
      discountPct: 0,
      currency: "USD",
    },
    inventory: {
      stockLeft: 18,
      stockTotal: 100,
    },
    tags: ["Hero product"],
  },
  {
    id: "P-102",
    title: "GlowUp Cleanser",
    description: "Gentle daily cleanser",
    thumbnailUrl: "/placeholder.jpg",
    type: "retail",
    category: "Skincare",
    pricing: {
      retailOriginal: 14,
      retailPromo: 14,
      currency: "USD",
    },
    inventory: {
      stockLeft: 26,
      stockTotal: 100,
    },
    tags: ["Bundle with serum"],
  },
  {
    id: "P-103",
    title: "GlowUp Night Cream",
    description: "Nourishing night treatment",
    thumbnailUrl: "/placeholder.jpg",
    type: "retail",
    category: "Skincare",
    pricing: {
      retailOriginal: 29,
      retailPromo: 29,
      currency: "USD",
    },
    inventory: {
      stockLeft: 9,
      stockTotal: 50,
    },
    tags: ["Upsell after serum"],
  },
];

// Helper to convert LiveProduct to UI Product
const toUiProduct = (lp: LiveProduct): Product => ({
  id: lp.id,
  name: lp.title,
  basePrice: lp.pricing.retailPromo || lp.pricing.retailOriginal || 0,
  currency: "USD",
  stock: lp.inventory.stockLeft || 0,
  tag: lp.tags?.[0] || "",
});

// Convert interactive engine Viewer to LiveViewer
const toLiveViewer = (v: Viewer): LiveViewer => ({
  id: v.id,
  name: v.name,
  lang: (v.language?.slice(0, 2) as ViewerLang) || "en",
  listenMode: "original" as ListenMode,
  joinedAt: v.joinedAt || Date.now(),
});

// Convert interactive ChatMessage to ChatMsg
const toChatMsg = (m: ChatMessage): ChatMsg => ({
  id: m.id,
  from: m.author.name,
  body: m.content,
  time: new Date(m.timestamp).toLocaleTimeString(),
  langTag: m.author.language?.slice(0, 2).toUpperCase(),
});

// Convert interactive QAQuestion to QaItem
const toQaItem = (q: QAQuestion): QaItem => ({
  id: q.id,
  question: q.question,
  from: q.author.name,
  status: q.status === "pinned" ? "pinned" : q.status === "answered" ? "answered" : "unanswered",
  langTag: q.language?.slice(0, 2).toUpperCase(),
  createdAt: q.createdAt,
});

export function useEngines(options: UseEnginesOptions = {}) {
  const [state, setState] = useState<EngineState>({
    streaming: { initialized: false, state: "idle", health: 100 },
    commerce: { connected: false, pinningState: { productId: null, locked: false }, flashDeal: { active: false, discountPct: 0, endsAt: null, totalSeconds: 0, secondsLeft: 0, productId: null } },
    interactive: { connected: false, viewerCount: 0, messages: [], questions: [] },
    moderation: { enabled: true, mutedUsers: 0 },
    analytics: { tracking: false, metrics: null },
    audio: { initialized: false, sources: [], masterVolume: 1, masterMuted: false },
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [viewers, setViewers] = useState<LiveViewer[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [salesEvents, setSalesEvents] = useState<SaleEvent[]>([]);
  const [qaItems, setQaItems] = useState<QaItem[]>([]);
  const [aiHints, setAiHints] = useState<AiHint[]>([]);
  const [flashDeal, setFlashDeal] = useState<StudioFlashDealState>({
    active: false,
    discountPct: 0,
    endsAt: null,
    totalSeconds: 0,
    secondsLeft: 0,
    productId: null,
  });

  // Engine refs
  const streamingEngine = useRef<StreamingEngine | null>(null);
  const commerceEngine = useRef<CommerceEngine | null>(null);
  const interactiveEngine = useRef<InteractiveEngine | null>(null);
  const moderationEngine = useRef<ModerationEngine | null>(null);
  const analyticsEngine = useRef<AnalyticsEngine | null>(null);
  const audioEngine = useRef<AudioMixingEngine | null>(null);

  // Track if initialized
  const initialized = useRef(false);

  // Initialize all engines
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Create engines
    const streaming = new StreamingEngine("medium");
    const commerce = new CommerceEngine();
    const interactive = new InteractiveEngine();
    const moderation = new ModerationEngine();
    const analytics = new AnalyticsEngine();
    const audio = new AudioMixingEngine();

    streamingEngine.current = streaming;
    commerceEngine.current = commerce;
    interactiveEngine.current = interactive;
    moderationEngine.current = moderation;
    analyticsEngine.current = analytics;
    audioEngine.current = audio;

    // ===== SET UP ENGINE CALLBACKS =====

    // Commerce Engine callbacks
    commerce.onFlashDealChangeCallback((flashState) => {
      const studioFlash: StudioFlashDealState = {
        active: flashState.active,
        discountPct: flashState.discountPct,
        endsAt: flashState.deal?.endTime || null,
        totalSeconds: flashState.deal ? Math.floor((flashState.deal.endTime - flashState.deal.startTime) / 1000) : 0,
        secondsLeft: flashState.secondsLeft,
        productId: flashState.deal?.productId || null,
      };
      setFlashDeal(studioFlash);
      setState(prev => ({
        ...prev,
        commerce: { ...prev.commerce, flashDeal: studioFlash }
      }));
    });

    commerce.onPinningChangeCallback((pinState) => {
      setState(prev => ({
        ...prev,
        commerce: { ...prev.commerce, pinningState: { productId: pinState.productId, locked: pinState.locked } }
      }));
    });

    // Interactive Engine callbacks
    interactive.onViewerJoinCallback((viewer) => {
      const liveViewer = toLiveViewer(viewer);
      setViewers(prev => [...prev, liveViewer]);
      setState(prev => ({
        ...prev,
        interactive: { ...prev.interactive, viewerCount: prev.interactive.viewerCount + 1 }
      }));
      options.onViewerJoin?.(liveViewer);
    });

    interactive.onViewerLeaveCallback((viewerId) => {
      setViewers(prev => prev.filter(v => v.id !== viewerId));
      setState(prev => ({
        ...prev,
        interactive: { ...prev.interactive, viewerCount: Math.max(0, prev.interactive.viewerCount - 1) }
      }));
      options.onViewerLeave?.(viewerId);
    });

    interactive.onNewMessageCallback((message) => {
      const chatMsg = toChatMsg(message);
      setChatMessages(prev => [...prev, chatMsg].slice(-120));
      setState(prev => ({
        ...prev,
        interactive: { ...prev.interactive, messages: [...prev.interactive.messages, chatMsg] }
      }));
      options.onNewMessage?.(chatMsg);
    });

    interactive.onNewQuestionCallback((question) => {
      const qaItem = toQaItem(question);
      setQaItems(prev => [...prev, qaItem]);
      options.onNewQuestion?.(qaItem);
    });

    // Analytics Engine callbacks
    analytics.onMetricsUpdateCallback((metrics) => {
      setState(prev => ({
        ...prev,
        analytics: { ...prev.analytics, metrics }
      }));
      options.onMetricsUpdate?.(metrics);
    });

    // Load products into commerce engine
    commerce.loadProducts(SAMPLE_PRODUCTS);
    setProducts(SAMPLE_PRODUCTS.map(toUiProduct));

    // Set initial state
    setState({
      streaming: { initialized: false, state: "idle", health: 100 },
      commerce: { connected: true, pinningState: { productId: null, locked: false }, flashDeal: { active: false, discountPct: 0, endsAt: null, totalSeconds: 0, secondsLeft: 0, productId: null } },
      interactive: { connected: true, viewerCount: 0, messages: [], questions: [] },
      moderation: { enabled: true, mutedUsers: 0 },
      analytics: { tracking: false, metrics: null },
      audio: { initialized: false, sources: [], masterVolume: 1, masterMuted: false },
    });

    console.log("✅ All Engines initialized and connected");
  }, []);

  // Initialize streaming (requires DOM)
  const initializeStreaming = useCallback(async (canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
    if (!streamingEngine.current) return false;

    try {
      const success = await streamingEngine.current.initialize(canvas, video);
      setState((prev) => ({
        ...prev,
        streaming: { ...prev.streaming, initialized: success },
      }));
      return success;
    } catch (e) {
      console.error("Failed to initialize streaming:", e);
      return false;
    }
  }, []);

  // Start camera
  const startCamera = useCallback(async (sourceId: string = "cam1", name: string = "Camera 1") => {
    if (!streamingEngine.current) return null;

    try {
      const source = await streamingEngine.current.addCamera(sourceId, name, true);

      // Get the scene and add source
      const sceneManager = streamingEngine.current.getSceneManager();
      const scenes = sceneManager.getScenes();
      if (scenes.length > 0) {
        sceneManager.addSourceToScene(scenes[0].id, sourceId, 0);
        sceneManager.setSourceVisible(scenes[0].id, sourceId, true);
      }

      console.log("✅ Camera started:", sourceId);
      return source;
    } catch (e) {
      console.error("Failed to start camera:", e);
      return null;
    }
  }, []);

  // Start screen share
  const startScreenShare = useCallback(async (sourceId: string = "screen", name: string = "Screen Share") => {
    if (!streamingEngine.current) return null;

    try {
      const source = await streamingEngine.current.addScreenShare(sourceId, name, false);

      // Add to scene
      const sceneManager = streamingEngine.current.getSceneManager();
      const scenes = sceneManager.getScenes();
      if (scenes.length > 0) {
        sceneManager.addSourceToScene(scenes[0].id, sourceId, 1);
        sceneManager.setSourceVisible(scenes[0].id, sourceId, true);
      }

      console.log("✅ Screen share started:", sourceId);
      return source;
    } catch (e) {
      console.error("Failed to start screen share:", e);
      return null;
    }
  }, []);

  // Stop source
  const stopSource = useCallback((sourceId: string) => {
    if (!streamingEngine.current) return;
    streamingEngine.current.removeSource(sourceId);
    console.log("✅ Source stopped:", sourceId);
  }, []);

  // Start stream
  const startStream = useCallback(async (protocol: "webrtc" | "rtmp" | "hls" = "webrtc", config?: Record<string, unknown>) => {
    if (!streamingEngine.current) return false;

    try {
      const success = await streamingEngine.current.startStream(protocol, config);

      if (success) {
        // Start analytics session
        const sessionId = options.sessionId || "session-" + Date.now();
        analyticsEngine.current?.startSession(sessionId);

        setState((prev) => ({
          ...prev,
          streaming: { ...prev.streaming, state: "live" },
          analytics: { ...prev.analytics, tracking: true },
        }));

        console.log("✅ Stream started:", protocol);
      }

      return success;
    } catch (e) {
      console.error("Failed to start stream:", e);
      return false;
    }
  }, [options.sessionId]);

  // Stop stream
  const stopStream = useCallback(async () => {
    if (!streamingEngine.current) return;

    await streamingEngine.current.stopStream();
    analyticsEngine.current?.stopSession();

    setState((prev) => ({
      ...prev,
      streaming: { ...prev.streaming, state: "idle" },
      analytics: { ...prev.analytics, tracking: false },
    }));
    console.log("✅ Stream stopped");
  }, []);

  // Get stream health
  const getStreamHealth = useCallback(() => {
    return streamingEngine.current?.getStreamHealth() || null;
  }, []);

  // Get stream stats
  const getStreamStats = useCallback(() => {
    return streamingEngine.current?.getStats() || null;
  }, []);

  // ===== COMMERCE ENGINE FUNCTIONS =====

  // Pin product
  const pinProduct = useCallback((productId: string) => {
    commerceEngine.current?.pinProduct(productId, "host");
    console.log("✅ Product pinned:", productId);
  }, []);

  // Unpin product
  const unpinProduct = useCallback(() => {
    commerceEngine.current?.unpinProduct();
    console.log("✅ Product unpinned");
  }, []);

  // Start flash deal
  const startFlashDeal = useCallback((productId: string, durationSeconds: number = 300) => {
    commerceEngine.current?.startFlashDeal(productId, durationSeconds);
    console.log("✅ Flash deal started:", productId, durationSeconds);
  }, []);

  // Stop flash deal
  const stopFlashDeal = useCallback(() => {
    commerceEngine.current?.stopFlashDeal();
    console.log("✅ Flash deal stopped");
  }, []);

  // Update product stock (for demo - modify local state)
  const updateProductStock = useCallback((productId: string, newStock: number) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, stock: newStock } : p
    ));

    // Also update in commerce engine
    const product = commerceEngine.current?.getProduct(productId);
    if (product) {
      product.inventory.stockLeft = newStock;
    }
  }, []);

  // ===== INTERACTIVE ENGINE FUNCTIONS =====

  // Send chat message
  const sendChatMessage = useCallback((content: string) => {
    interactiveEngine.current?.sendMessage(content);
  }, []);

  // Submit question
  const submitQuestion = useCallback((question: string, language?: string) => {
    interactiveEngine.current?.submitQuestion(question, language);
  }, []);

  // Pin question
  const pinQuestion = useCallback((questionId: string) => {
    interactiveEngine.current?.pinQuestion(questionId);
  }, []);

  // Answer question
  const answerQuestion = useCallback((questionId: string, answer: string) => {
    interactiveEngine.current?.answerQuestion(questionId, answer);
  }, []);

  // Highlight question
  const highlightQuestion = useCallback((questionId: string) => {
    interactiveEngine.current?.highlightQuestion(questionId);
  }, []);

  // Add a demo viewer (for testing)
  const addDemoViewer = useCallback((name: string, lang: ViewerLang = "en", listenMode: ListenMode = "original") => {
    const viewer: Viewer = {
      id: uid("v"),
      name,
      isHost: false,
      isModerator: false,
      isSubscriber: false,
      language: lang,
      joinedAt: Date.now(),
    };

    // Manually trigger viewer join
    setViewers(prev => [...prev, toLiveViewer(viewer)]);
    setState(prev => ({
      ...prev,
      interactive: { ...prev.interactive, viewerCount: prev.interactive.viewerCount + 1 }
    }));

    console.log("✅ Demo viewer added:", name);
  }, []);

  // Add a demo chat message
  const addDemoMessage = useCallback((from: string, body: string, lang?: string) => {
    const message: ChatMessage = {
      id: uid("m"),
      author: {
        id: uid("u"),
        name: from,
        isHost: false,
        isModerator: false,
        isSubscriber: false,
        language: lang || "en",
      },
      content: body,
      type: "text",
      timestamp: Date.now(),
      filtered: false,
      reactions: {},
    };

    const chatMsg = toChatMsg(message);
    setChatMessages(prev => [...prev, chatMsg].slice(-120));
  }, []);

  // ===== MODERATION ENGINE FUNCTIONS =====

  // Mute user
  const muteUser = useCallback((userId: string, userName: string, durationSeconds: number = 300) => {
    moderationEngine.current?.muteUser(userId, userName, durationSeconds, "Muted by host", "host", "Host");
    setState(prev => ({
      ...prev,
      moderation: { ...prev.moderation, mutedUsers: prev.moderation.mutedUsers + 1 }
    }));
    console.log("✅ User muted:", userName);
  }, []);

  // Ban user
  const banUser = useCallback((userId: string, userName: string, reason: string = "Banned by host") => {
    moderationEngine.current?.banUser(userId, userName, reason, "host", "Host");
    console.log("✅ User banned:", userName);
  }, []);

  // Unban user
  const unbanUser = useCallback((userId: string, userName: string = "Unknown") => {
    moderationEngine.current?.unbanUser(userId, userName, "Unbanned by host");
    console.log("✅ User unbanned:", userName);
  }, []);

  // Filter message
  const filterMessage = useCallback((content: string, userId: string) => {
    return moderationEngine.current?.filterMessage(content, userId) || { flagged: false, action: null };
  }, []);

  // ===== ANALYTICS ENGINE FUNCTIONS =====

  // Update viewer count
  const updateViewerCount = useCallback((count: number) => {
    analyticsEngine.current?.updateViewers(count);
    setState(prev => ({
      ...prev,
      interactive: { ...prev.interactive, viewerCount: count },
    }));
  }, []);

  const updateEngagement = useCallback((messages: number, reactions: number, questions: number) => {
    analyticsEngine.current?.updateEngagement({ messages, reactions, questions });
  }, []);

  const updateCommerceMetrics = useCallback((purchases: number, purchaseValue: number) => {
    analyticsEngine.current?.updateCommerce({ purchases, purchaseValue });
  }, []);

  const updateQualityMetrics = useCallback((bitrate: number, fps: number, healthScore: number) => {
    analyticsEngine.current?.updateQuality({ averageBitrate: bitrate, averageFps: fps, healthScore });
  }, []);

  // Record analytics sample
  const recordSample = useCallback(() => {
    analyticsEngine.current?.recordSample();
  }, []);

  // Get analytics stats
  const getStats = useCallback(() => {
    return analyticsEngine.current?.getStats() || null;
  }, []);

  // ===== AI HINTS =====

  // Add AI hint
  const addAiHint = useCallback((text: string, severity: AiHint["severity"]) => {
    const hint: AiHint = {
      id: uid("ai"),
      text,
      time: nowTimeLabel(),
      severity,
    };
    setAiHints((prev) => [hint, ...prev].slice(0, 16));
    options.onAiHint?.(hint);
  }, [options]);

  // Add sale event
  const addSaleEvent = useCallback((label: string, amount?: string, langTagValue?: string) => {
    const event: SaleEvent = {
      id: uid("s"),
      label,
      time: nowTimeLabel(),
      amount,
      langTag: langTagValue,
    };
    setSalesEvents((prev) => [event, ...prev].slice(0, 24));
    options.onSaleEvent?.(event);
  }, [options]);

  // ===== CONNECTION MANAGEMENT =====

  // Connect to servers (would be real URLs in production)
  const connect = useCallback(() => {
    setState((prev) => ({
      ...prev,
      commerce: { ...prev.commerce, connected: true },
      interactive: { ...prev.interactive, connected: true },
    }));
    console.log("✅ Engines connected");
  }, []);

  // Disconnect from servers
  const disconnect = useCallback(() => {
    setState((prev) => ({
      ...prev,
      commerce: { ...prev.commerce, connected: false },
      interactive: { ...prev.interactive, connected: false },
    }));
    console.log("❌ Engines disconnected");
  }, []);

  // ===== AUDIO ENGINE FUNCTIONS =====

  // Initialize audio engine
  const initializeAudio = useCallback(async () => {
    if (!audioEngine.current) return false;
    try {
      const success = await audioEngine.current.initialize();
      setState(prev => ({
        ...prev,
        audio: { ...prev.audio, initialized: success }
      }));
      return success;
    } catch (e) {
      console.error("Failed to initialize audio engine:", e);
      return false;
    }
  }, []);

  // Add microphone
  const addMicrophone = useCallback(async (deviceId?: string) => {
    if (!audioEngine.current) return null;
    const sourceId = await audioEngine.current.addMicrophone(deviceId);
    if (sourceId) {
      setState(prev => ({
        ...prev,
        audio: { ...prev.audio, sources: audioEngine.current?.getSources() || [] }
      }));
    }
    return sourceId;
  }, []);

  // Add screen share audio
  const addScreenShareAudio = useCallback(async () => {
    if (!audioEngine.current) return null;
    const sourceId = await audioEngine.current.addScreenShareAudio();
    if (sourceId) {
      setState(prev => ({
        ...prev,
        audio: { ...prev.audio, sources: audioEngine.current?.getSources() || [] }
      }));
    }
    return sourceId;
  }, []);

  // Add background music
  const addBackgroundMusic = useCallback(async (url: string, name?: string) => {
    if (!audioEngine.current) return null;
    const sourceId = await audioEngine.current.addBackgroundMusic(url, name);
    if (sourceId) {
      setState(prev => ({
        ...prev,
        audio: { ...prev.audio, sources: audioEngine.current?.getSources() || [] }
      }));
    }
    return sourceId;
  }, []);

  // Set source volume
  const setSourceVolume = useCallback((sourceId: string, volume: number) => {
    return audioEngine.current?.setSourceVolume(sourceId, volume) ?? false;
  }, []);

  // Set source pan
  const setSourcePan = useCallback((sourceId: string, pan: number) => {
    return audioEngine.current?.setSourcePan(sourceId, pan) ?? false;
  }, []);

  // Set source muted
  const setSourceMuted = useCallback((sourceId: string, muted: boolean) => {
    return audioEngine.current?.setSourceMuted(sourceId, muted) ?? false;
  }, []);

  // Set source solo
  const setSourceSolo = useCallback((sourceId: string, solo: boolean) => {
    return audioEngine.current?.setSourceSolo(sourceId, solo) ?? false;
  }, []);

  // Set master volume
  const setMasterVolume = useCallback((volume: number) => {
    audioEngine.current?.setMasterVolume(volume);
    setState(prev => ({
      ...prev,
      audio: { ...prev.audio, masterVolume: volume }
    }));
  }, []);

  // Set master muted
  const setMasterMuted = useCallback((muted: boolean) => {
    audioEngine.current?.setMasterMuted(muted);
    setState(prev => ({
      ...prev,
      audio: { ...prev.audio, masterMuted: muted }
    }));
  }, []);

  // Enable noise reduction
  const enableNoiseReduction = useCallback((sourceId: string, enable: boolean) => {
    return audioEngine.current?.enableNoiseReduction(sourceId, enable) ?? false;
  }, []);

  // Get audio sources
  const getAudioSources = useCallback(() => {
    return audioEngine.current?.getSources() ?? [];
  }, []);

  // Remove audio source
  const removeAudioSource = useCallback((sourceId: string) => {
    audioEngine.current?.removeSource(sourceId);
    setState(prev => ({
      ...prev,
      audio: { ...prev.audio, sources: audioEngine.current?.getSources() || [] }
    }));
  }, []);

  // Get raw engine instances (for advanced usage)
  const getEngines = useCallback(() => ({
    streaming: streamingEngine.current,
    commerce: commerceEngine.current,
    interactive: interactiveEngine.current,
    moderation: moderationEngine.current,
    analytics: analyticsEngine.current,
    audio: audioEngine.current,
  }), []);

  return {
    // State
    state,
    products,
    viewers,
    chatMessages,
    salesEvents,
    qaItems,
    aiHints,
    flashDeal,

    // Streaming methods
    initializeStreaming,
    startCamera,
    startScreenShare,
    stopSource,
    startStream,
    stopStream,
    getStreamHealth,
    getStreamStats,

    // Commerce methods
    pinProduct,
    unpinProduct,
    startFlashDeal,
    stopFlashDeal,
    updateProductStock,

    // Interactive methods
    sendChatMessage,
    submitQuestion,
    pinQuestion,
    answerQuestion,
    highlightQuestion,
    addDemoViewer,
    addDemoMessage,

    // Moderation methods
    muteUser,
    banUser,
    unbanUser,
    filterMessage,

    // Analytics methods
    updateViewerCount,
    updateEngagement,
    updateCommerceMetrics,
    updateQualityMetrics,
    recordSample,
    getStats,

    // Helper methods
    addAiHint,
    addSaleEvent,
    connect,
    disconnect,
    getEngines,
    engines: getEngines(),

    // Audio methods
    initializeAudio,
    addMicrophone,
    addScreenShareAudio,
    addBackgroundMusic,
    setSourceVolume,
    setSourcePan,
    setSourceMuted,
    setSourceSolo,
    setMasterVolume,
    setMasterMuted,
    enableNoiseReduction,
    getAudioSources,
    removeAudioSource,
  };
}
