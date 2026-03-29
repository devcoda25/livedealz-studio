"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { useStudioSocket } from "@/hooks/useStudioSocket";
import { useEngines } from "@/hooks/useEngines";

// Local imports
import {
  Mode, PreviewMode, AudienceTab, ProductionMode, ExternalTool, SourceId,
  ViewerLang, ListenMode, Product, BuyerAgent, LiveViewer, ChatMsg,
  SaleEvent, AiHint, QaItem, AudioRequest, CurrentSpeaker, FlashDealState, SceneId, SCENES, LivePoll, Giveaway, Campaign, CampaignSession
} from "../components/types";
import {
  INITIAL_PRODUCTS, INITIAL_BUYERS, EV_ORANGE
} from "../components/constants";
import {
  uid, nowTimeLabel, formatHMS, randInt, pick, fmtMoneyUSD, buyerCartCount, buyerReminderCount,
  langTag, computeUrgency, useDeviceKind, sourceLabel, createInitialViewers
} from "../components/utils";

// Components
import { StatPill } from "../components/StatPill";
import { ProductionPanel } from "../components/ProductionPanel";
import { InventoryPanel } from "../components/InventoryPanel";
import { StagePanel } from "../components/StagePanel";
import { BuyerSimulatorPanel } from "../components/BuyerSimulatorPanel";
import { BuyerAppShell } from "../components/BuyerAppShell";
import { TeleprompterPanel } from "../components/TeleprompterPanel";
import { CampaignModal } from "../components/CampaignModal";
import { AIPromptsToast } from "../components/AIPromptsToast";
import { CommercePanel } from "../components/CommercePanel";
import { AudiencePanel } from "../components/AudiencePanel";
import { AiPanel } from "../components/AiPanel";
import { ControlBar } from "../components/ControlBar";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { MobileSlideMenu } from "../components/MobileSlideMenu";
import { FiltersTray } from "../components/FiltersTray";
import { FilterCategory } from "../../../engines/media/types";
import { VideoAudioPanel } from "../components/VideoAudioPanel";
import { CommerceHUD } from "../components/CommerceHUD";
import { CoHostsHUD } from "../components/CoHostsHUD";
import { AttachmentsHUD } from "../components/AttachmentsHUD";
import { SceneManagerHUD } from "../components/SceneManagerHUD";
import { FlashDealDialog } from "../components/FlashDealDialog";
import { LanguagePanel } from "../components/LanguagePanel";
import { ExpandedStageModal } from "../components/ExpandedStageModal";
import { SourcesPanel, CanvasSource } from "../components/SourcesPanel";
import { getOptimalCameraConstraints, detectDeviceCapabilities, clearCapabilitiesCache } from "@/lib/capabilityDetector";
import { DEFAULT_STREAM_CONFIGS, StreamQuality, StreamConfig } from "@/engines/streaming/types";

export default function MyLiveDealzLiveStudioFullPage() {
  // Socket & Real State
  const { state: socketState, sendChat, startFlash, stopFlash } = useStudioSocket();

  // Engine Integration - All 5 engines unified
  const {
    state: engineState,
    products: engineProducts,
    viewers: engineViewers,
    chatMessages: engineChatMessages,
    salesEvents: engineSalesEvents,
    qaItems: engineQaItems,
    aiHints: engineAiHints,
    flashDeal: engineFlashDeal,
    initializeStreaming: initStreaming,
    startCamera: engineStartCamera,
    startScreenShare: engineStartScreenShare,
    stopSource: engineStopSource,
    startStream: engineStartStream,
    stopStream: engineStopStream,
    getStreamHealth: engineGetHealth,
    getStreamStats: engineGetStreamStats,
    pinProduct: enginePinProduct,
    unpinProduct: engineUnpinProduct,
    startFlashDeal: engineStartFlash,
    stopFlashDeal: engineStopFlash,
    sendChatMessage: engineSendChat,
    submitQuestion: engineSubmitQ,
    pinQuestion: enginePinQ,
    answerQuestion: engineAnswerQ,
    highlightQuestion: engineHighlightQ,
    muteUser: engineMuteUser,
    banUser: engineBanUser,
    unbanUser: engineUnbanUser,
    filterMessage: engineFilterMsg,
    updateViewerCount: engineUpdateViewers,
    updateEngagement: engineUpdateEngagement,
    updateCommerceMetrics: engineUpdateCommerce,
    updateQualityMetrics: engineUpdateQuality,
    recordSample: engineRecordSample,
    getStats: engineGetAnalyticsStats,
    addAiHint: engineAddHint,
    addSaleEvent: engineAddSale,
    connect: engineConnect,
    disconnect: engineDisconnect,
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
    getStreamConfig,
    setStreamConfig,
  } = useEngines();

  // Detect system color scheme preference on mount
  const [darkMode, setDarkMode] = useState(false); // Default to avoid SSR mismatch, useEffect will update
  const [mode, setMode] = useState<Mode>("lobby");

  // Initialize dark mode from system preference on mount (client only)
  useEffect(() => {
    setDarkMode(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Sync darkMode with document class for CSS variables
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);
  const [simulate, setSimulate] = useState(false);

  // AI Prompts for live sessions
  const isLive = mode === "live";

  // Stream Provisioning
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [activeFilter, setActiveFilter] = useState("none");
  const [activeFilterCategory, setActiveFilterCategory] = useState<FilterCategory | null>(null);
  const [filterIntensity, setFilterIntensity] = useState(100);


  // Controls
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenShareOn, setScreenShareOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null!);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const expandedVideoRef = useRef<HTMLVideoElement>(null!);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pendingStream, setPendingStream] = useState<MediaStream | null>(null);
  // Track if we're in demo mode (no real camera available)
  const [isDemoMode, setIsDemoMode] = useState(false);
  const { toast } = useToast();

  // Retry camera access - trigger full camera re-initialization
  const retryCameraAccess = useCallback(async () => {
    setCameraError(null);
    setHasCameraPermission(true);
    setIsDemoMode(false); // Reset demo mode to try for real camera

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Reset video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    console.log("Retrying camera access...");
    // The camera will be re-initialized by the useEffect on mount
    // For now, we'll dispatch an event that triggers re-initialization
    window.dispatchEvent(new CustomEvent('retryCameraAccess'));
  }, []);

  // Production
  const [productionMode, setProductionMode] = useState<ProductionMode>("inapp");
  const [externalTool, setExternalTool] = useState<ExternalTool>("OBS");
  const [activeSourceId, setActiveSourceId] = useState<SourceId>("cam1");
  const [activeCameraDeviceId, setActiveCameraDeviceId] = useState<string | null>(null);

  // Track if camera switch is in progress
  const isSwitchingCamera = useRef(false);

  // Current video quality preset
  const [currentQuality, setCurrentQuality] = useState<StreamQuality>("medium");

  // Handle camera switching from ProductionPanel
  const handleCameraSwitch = useCallback(async (deviceId: string | null) => {
    if (!deviceId || isSwitchingCamera.current) return;

    // Prevent rapid consecutive switches
    isSwitchingCamera.current = true;
    setTimeout(() => { isSwitchingCamera.current = false; }, 1000);

    setActiveCameraDeviceId(deviceId);
    console.log("Switching to camera:", deviceId);

    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Small delay to allow camera to be released
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Request new camera stream with optimal constraints based on detected capabilities
      const constraints = await getOptimalCameraConstraints(deviceId);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      console.log("Camera switched successfully");
      toast({
        title: 'Camera Switched',
        description: 'Successfully switched to the selected camera.',
      });
    } catch (err: any) {
      console.error("Failed to switch camera:", err);

      // Provide specific error message based on error type
      let errorMessage = 'Could not switch to the selected camera. Please try again.';
      let errorTitle = 'Camera Switch Failed';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorTitle = 'Camera Access Denied';
        errorMessage = 'Camera permission was denied. Please check if another app is using the camera, or allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorTitle = 'Camera Not Found';
        errorMessage = 'The selected camera was not found. It may have been disconnected.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorTitle = 'Camera In Use';
        errorMessage = 'The camera is already in use by another application. Please close other apps using the camera.';
      } else if (err.name === 'OverconstrainedError') {
        errorTitle = 'Camera Not Compatible';
        errorMessage = 'The selected camera does not support the required settings.';
      }

      toast({
        variant: 'destructive',
        title: errorTitle,
        description: errorMessage,
      });
    }
  }, [toast]);

  // Handle quality preset change - resizes canvas, re-acquires camera, reconfigures encoder
  const handleQualityChange = useCallback(async (quality: StreamQuality) => {
    const preset = DEFAULT_STREAM_CONFIGS[quality];
    if (!preset) return;

    console.log(`[QualityChange] Switching to ${quality}:`, preset.resolution, `${preset.framerate}fps`);

    // 1. Update streaming engine config (encoder, bitrate, codec)
    setStreamConfig({
      resolution: preset.resolution,
      framerate: preset.framerate,
      bitrate: preset.bitrate,
      codec: preset.codec,
      audioCodec: preset.audioCodec,
      audioBitrate: preset.audioBitrate,
      keyframeInterval: preset.keyframeInterval,
      profile: preset.profile,
    });

    // 2. Resize canvas
    if (canvasRef.current) {
      canvasRef.current.width = preset.resolution.width;
      canvasRef.current.height = preset.resolution.height;
    }

    // 3. Re-acquire camera with new resolution/framerate constraints
    try {
      // Stop existing tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: preset.resolution.width },
          height: { ideal: preset.resolution.height },
          frameRate: { ideal: preset.framerate },
          ...(activeCameraDeviceId ? { deviceId: { exact: activeCameraDeviceId } } : {}),
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCurrentQuality(quality);

      toast({
        title: 'Quality Updated',
        description: `Switched to ${preset.resolution.width}x${preset.resolution.height} @ ${preset.framerate}fps`,
      });

      console.log(`[QualityChange] Successfully switched to ${quality}`);
    } catch (err: any) {
      console.error('[QualityChange] Failed to re-acquire camera:', err);

      // Quality config was still applied to encoder, just camera re-acquisition failed
      setCurrentQuality(quality);

      toast({
        variant: 'destructive',
        title: 'Camera Reconfiguration Warning',
        description: `Quality settings applied but camera couldn't be reconfigured. It may be in use by another app.`,
      });
    }
  }, [toast, activeCameraDeviceId, setStreamConfig]);

  // Handle individual video config changes (resolution, framerate, bitrate)
  const handleVideoConfigChange = useCallback(async (config: Partial<StreamConfig>) => {
    // Update encoder config
    setStreamConfig(config);

    // If resolution changed, resize canvas and re-acquire camera
    if (config.resolution) {
      if (canvasRef.current) {
        canvasRef.current.width = config.resolution.width;
        canvasRef.current.height = config.resolution.height;
      }

      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        await new Promise(resolve => setTimeout(resolve, 100));

        const constraints: MediaStreamConstraints = {
          video: {
            width: { ideal: config.resolution.width },
            height: { ideal: config.resolution.height },
            frameRate: { ideal: config.framerate || DEFAULT_STREAM_CONFIGS[currentQuality].framerate },
            ...(activeCameraDeviceId ? { deviceId: { exact: activeCameraDeviceId } } : {}),
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('[VideoConfig] Failed to re-acquire camera:', err);
      }
    }

    // If only framerate changed, try applying constraints without full camera restart
    if (config.framerate && !config.resolution && streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack && videoTrack.applyConstraints) {
        try {
          await videoTrack.applyConstraints({ frameRate: { ideal: config.framerate } });
        } catch {
          // Fallback: full camera restart
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
          await new Promise(resolve => setTimeout(resolve, 100));
          const constraints: MediaStreamConstraints = {
            video: {
              width: { ideal: DEFAULT_STREAM_CONFIGS[currentQuality].resolution.width },
              height: { ideal: DEFAULT_STREAM_CONFIGS[currentQuality].resolution.height },
              frameRate: { ideal: config.framerate },
              ...(activeCameraDeviceId ? { deviceId: { exact: activeCameraDeviceId } } : {}),
            },
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        }
      }
    }

    toast({ title: 'Video Config Updated', description: 'Settings applied successfully.' });
  }, [setStreamConfig, currentQuality, activeCameraDeviceId, toast]);

  // Scenes + preview
  const [activeSceneId, setActiveSceneId] = useState<SceneId>("intro_host");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("auto");
  const activeSceneLabel = SCENES.find(s => s.id === activeSceneId)?.label || activeSceneId;

  // Canvas sources management
  const [canvasSources, setCanvasSources] = useState<CanvasSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  // Transcription (Speech-to-Text)
  const [transcriptionOn, setTranscriptionOn] = useState(false);
  const [transcript, setTranscript] = useState("");

  // Audio Mixer
  const [audioMixerOpen, setAudioMixerOpen] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [showProduction, setShowProduction] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        return;
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        console.log("Speech recognition started");
      };

      recognitionRef.current.onend = () => {
        console.log("Speech recognition ended");
        // Auto-restart if it stopped but we still want it on
        if (transcriptionOn) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.warn("Restart failed", e);
          }
        }
      };

      recognitionRef.current.onresult = (event: any) => {
        let final = "";
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + " ";
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        console.log(`Speech result - Final: "${final}", Interim: "${interim}"`);

        setTranscript((prev) => {
          if (!final && !interim) return prev;
          return (prev + final + interim).slice(-200);
        });
      };

      recognitionRef.current.onnomatch = () => {
        console.log("Speech no match");
      };

      recognitionRef.current.onerror = (event: any) => {
        console.warn("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          setTranscriptionOn(false);
          toast({ variant: 'destructive', title: 'Microphone Access Denied', description: 'Please allow microphone access in your browser settings.' });
        } else if (event.error === 'no-speech') {
          // Ignore no-speech, it happens in silence
        } else {
          // For network or other generic errors, we might want to notify only if persistent
          console.log("Transient speech error:", event.error);
        }
      };
    }
  }, [transcriptionOn]);

  useEffect(() => {
    const r = recognitionRef.current;
    if (!r) return;

    if (transcriptionOn) {
      try {
        // Abort previous instances just in case
        r.abort();
        r.start();
        toast({ title: "Captions Active", description: "Listening..." });
      } catch (e) {
        console.warn("Start error", e);
      }
    } else {
      try { r.stop(); } catch (e) { /* ignore */ }
      setTranscript("");
    }

    return () => { try { r.stop(); } catch (e) { /* ignore */ } };
  }, [transcriptionOn]);
  const deviceKind = useDeviceKind();
  const resolvedPreviewMode: Exclude<PreviewMode, "auto"> =
    previewMode === "auto" ? deviceKind : previewMode;

  // Mobile state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = deviceKind === "mobile";

  // Overlays
  const [stageExpanded, setStageExpanded] = useState(false);
  const [flashConfigOpen, setFlashConfigOpen] = useState(false);
  const [languagePanelOpen, setLanguagePanelOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [buyersOpen, setBuyersOpen] = useState(false);
  const [commerceHudOpen, setCommerceHudOpen] = useState(false);
  const [sceneManagerOpen, setSceneManagerOpen] = useState(false);
  const [coHostsOpen, setCoHostsOpen] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);

  // Left panels
  // Use engine products if available, otherwise use local state
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const products = engineProducts.length > 0 ? engineProducts : localProducts;
  const setProducts = engineProducts.length > 0 ? (() => { }) : setLocalProducts;
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);

  const [coHosts, setCoHosts] = useState<{ id: number; name: string; status: string; isPresenting?: boolean }[]>([]);
  const [mainPresenterId, setMainPresenterId] = useState<number | null>(null);
  const [coHostIdCounter, setCoHostIdCounter] = useState(5);
  // Track if host is presenting (for split screen)
  const [hostPresenting, setHostPresenting] = useState(false);

  const [attachments] = useState<{ id: number; from: string; type: string; label: string; status: string }[]>([]);

  // Audience state
  const [audienceTab, setAudienceTab] = useState<AudienceTab>("chat");
  const [chatDraft, setChatDraft] = useState("");

  // Live Polls state
  const [polls, setPolls] = useState<LivePoll[]>([]);

  const handleCreatePoll = (question: string, options: string[]) => {
    const newPoll: LivePoll = {
      id: uid("poll"),
      question,
      options: options.map(opt => ({ id: uid("opt"), text: opt, votes: 0 })),
      totalVotes: 0,
      isActive: true,
      endsAt: null,
      createdAt: Date.now(),
    };
    setPolls(prev => [newPoll, ...prev]);
    pushSystem(`📊 Poll created: "${question}"`);
  };

  const handleVotePoll = (pollId: string, optionId: string) => {
    setPolls(prev => prev.map(poll => {
      if (poll.id !== pollId) return poll;
      return {
        ...poll,
        options: poll.options.map(opt =>
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        ),
        totalVotes: poll.totalVotes + 1,
      };
    }));
  };

  const handleClosePoll = (pollId: string) => {
    setPolls(prev => prev.map(poll =>
      poll.id === pollId ? { ...poll, isActive: false } : poll
    ));
    pushSystem("📊 Poll ended. Results are now visible to viewers.");
  };

  const handleDeletePoll = (pollId: string) => {
    setPolls(prev => prev.filter(poll => poll.id !== pollId));
    pushSystem("📊 Poll deleted.");
  };

  // Giveaways state - pre-populated from seller platform
  const [giveaways, setGiveaways] = useState<Giveaway[]>([
    {
      id: uid("gaw"),
      title: "Mystery Gift Box",
      description: "A surprise gift worth over $50!",
      prizeValue: 50,
      status: "active",
      participants: Array.from({ length: 46 }, (_, i) => ({
        id: uid("p"),
        name: `User${Math.floor(Math.random() * 1000)}`,
        avatar: undefined,
        joinedAt: Date.now() - Math.random() * 3600000,
      })),
      createdAt: Date.now() - 300000,
      endsAt: null,
    },
    {
      id: uid("gaw"),
      title: "Free Shipping Voucher",
      description: "Win free shipping on your next order!",
      prizeValue: 0,
      status: "active",
      participants: Array.from({ length: 128 }, (_, i) => ({
        id: uid("p"),
        name: `Shopper${Math.floor(Math.random() * 2000)}`,
        avatar: undefined,
        joinedAt: Date.now() - Math.random() * 7200000,
      })),
      createdAt: Date.now() - 600000,
      endsAt: null,
    },
    {
      id: uid("gaw"),
      title: "$100 Store Credit",
      description: "Credit to use on any product in the store",
      prizeValue: 100,
      status: "active",
      participants: Array.from({ length: 89 }, (_, i) => ({
        id: uid("p"),
        name: `Buyer${Math.floor(Math.random() * 1500)}`,
        avatar: undefined,
        joinedAt: Date.now() - Math.random() * 1800000,
      })),
      createdAt: Date.now() - 120000,
      endsAt: null,
    },
  ]);

  const handleCreateGiveaway = (data: { title: string; description: string; prizeValue?: number }) => {
    const newGiveaway: Giveaway = {
      id: uid("gaw"),
      title: data.title,
      description: data.description,
      prizeValue: data.prizeValue,
      status: "active",
      participants: [],
      createdAt: Date.now(),
      endsAt: null,
    };
    setGiveaways(prev => [newGiveaway, ...prev]);
    pushSystem(`🎁 Giveaway started: "${data.title}"`);
  };

  // Giveaway winner picking state
  const [pickingWinner, setPickingWinner] = useState<{ giveawayId: string; isAnimating: boolean; winner: { id: string; name: string } | null } | null>(null);

  // Campaigns/Teleprompter state
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: uid("camp"),
      name: "Summer Sale Event",
      description: "Main summer promotional campaign",
      sessions: [
        { id: uid("sess"), name: "Morning Session", description: "9AM - 12PM", duration: 10800, scriptCues: [], runOfShow: [] },
        { id: uid("sess"), name: "Afternoon Session", description: "2PM - 5PM", duration: 10800, scriptCues: [], runOfShow: [] },
        { id: uid("sess"), name: "Evening Session", description: "6PM - 9PM", duration: 10800, scriptCues: [], runOfShow: [] },
      ],
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 3600000,
    },
    {
      id: uid("camp"),
      name: "Product Launch",
      description: "New product announcement campaign",
      sessions: [
        { id: uid("sess"), name: "Launch Stream", description: "Main event", duration: 7200, scriptCues: [], runOfShow: [] },
      ],
      createdAt: Date.now() - 172800000,
      updatedAt: Date.now() - 7200000,
    },
  ]);
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [currentSession, setCurrentSession] = useState<CampaignSession | null>(null);

  const handleSelectCampaign = (campaign: Campaign) => {
    setCurrentCampaign(campaign);
    setCurrentSession(null);
  };

  const handleSelectSession = (session: CampaignSession) => {
    setCurrentSession(session);
  };

  const handlePickWinner = (giveawayId: string) => {
    const giveaway = giveaways.find(g => g.id === giveawayId);
    if (!giveaway || giveaway.participants.length === 0) return;
    
    // Start animation
    setPickingWinner({ giveawayId, isAnimating: true, winner: null });
    
    // Simulate spinning animation then pick winner
    setTimeout(() => {
      const winner = giveaway.participants[Math.floor(Math.random() * giveaway.participants.length)];
      setPickingWinner(prev => prev ? { ...prev, winner: { id: winner.id, name: winner.name }, isAnimating: false } : null);
      
      // Update the giveaway after animation completes
      setTimeout(() => {
        setGiveaways(prev => prev.map(g => {
          if (g.id !== giveawayId) return g;
          return {
            ...g,
            status: "completed" as const,
            winnerId: winner.id,
            winnerName: winner.name,
            winnerAvatar: winner.avatar,
          };
        }));
        setPickingWinner(null);
        pushSystem(`🎉 Winner selected: ${winner.name}!`);
      }, 1500);
    }, 2000);
  };

  const [viewers, setViewers] = useState<LiveViewer[]>([]);
  const [viewerCount, setViewerCount] = useState(0);

  // Multi-buyer simulation (per-buyer carts + reminders)
  const [buyers, setBuyers] = useState<BuyerAgent[]>(INITIAL_BUYERS.map(b => ({ ...b, lastActionAt: Date.now() })));
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | null>(INITIAL_BUYERS[0]?.id ?? null);

  // KPI stats
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [last5MinSales, setLast5MinSales] = useState(0);

  // Streams (Initialize with socket state if available, else local default)
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [salesEvents, setSalesEvents] = useState<SaleEvent[]>([]);
  const [aiHints, setAiHints] = useState<AiHint[]>([]);
  const [qaItems, setQaItems] = useState<QaItem[]>([]);

  // Flash deal (real countdown)
  const [flash, setFlash] = useState<FlashDealState>({
    active: false,
    discountPct: 0,
    endsAt: null,
    totalSeconds: 0,
    secondsLeft: 0,
    productId: null,
  });

  const flashUrgency = useMemo(() => {
    if (!flash.active) return "none";
    return computeUrgency(flash.secondsLeft);
  }, [flash.active, flash.secondsLeft]);

  // Audio request flow
  const [audioRequests, setAudioRequests] = useState<AudioRequest[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<CurrentSpeaker | null>(null);
  const [speakerSecondsLeft, setSpeakerSecondsLeft] = useState(0);

  // Connect engines on mount
  useEffect(() => {
    engineConnect();
    return () => {
      engineDisconnect();
    };
  }, [engineConnect, engineDisconnect]);

  // -------------------- refs for stable simulation --------------------
  const viewersRef = useRef(viewers);
  const productsRef = useRef(products);
  const buyersRef = useRef(buyers);
  const flashRef = useRef(flash);
  const last5SalesRef = useRef<number[]>([]);

  useEffect(() => { viewersRef.current = viewers; }, [viewers]);
  useEffect(() => { productsRef.current = products; }, [products]);
  useEffect(() => { buyersRef.current = buyers; }, [buyers]);
  useEffect(() => { flashRef.current = flash; }, [flash]);

  // Sync Socket State to Local UI State
  useEffect(() => {
    if (socketState.live !== (mode === 'live')) {
      // setMode(socketState.live ? 'live' : 'lobby'); // Optional: sync mode
    }
    // Update local counts from socket
    if (socketState.viewers > 0) setViewerCount(socketState.viewers);
  }, [socketState, mode]);

  // Provision Stream Handler
  const handleGoLive = async () => {
    if (mode === 'live') {
      // Stop streaming engine when going offline
      await engineStopStream();
      setMode('lobby');
      setStreamKey(null);
      setStreamUrl(null);
      toast({ title: "Stream Ended", description: "You are now off-air." });
      return;
    }

    // In-App Mode: Instant "Go Live" (with Engine)
    if (productionMode === "inapp") {
      // Try to start streaming engine
      try {
        await engineStartStream('webrtc');
      } catch (e) {
        console.log("Could not start streaming engine, using simulation mode");
      }

      setMode('live');
      setLiveSeconds(0);
      toast({
        title: "You are Live! (In-App)",
        description: "Broadcasting from browser camera. Viewers will see the stream instantly.",
      });
      console.log("Starting in-app broadcast with engine...");
      return;
    }

    // External Mode: Provision RTMP Key for OBS
    setIsProvisioning(true);
    try {
      const res = await fetch('/api/stream', { method: 'POST' });
      const data = await res.json();
      if (data.stream_key) {
        setStreamKey(data.stream_key);
        setStreamUrl(data.stream_url);
        setMode('live'); // Only go live after provisioning
        setLiveSeconds(0);
        toast({
          title: "Ready to Stream (External)",
          description: `Stream Key: ${data.stream_key} (Copied to console). Configure OBS to start.`,
        });
        console.log("STREAM CONFIG:", data);
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Stream Error", description: "Failed to provision stream." });
    } finally {
      setIsProvisioning(false);
    }
  };

  const onToggleLive = handleGoLive; // Replace the dummy toggle

  // Client-side only data initialization to prevent hydration errors
  useEffect(() => {
    // Only set local products if engine products not available
    if (engineProducts.length === 0) {
      setLocalProducts(INITIAL_PRODUCTS);
      setHighlightedProductId(INITIAL_PRODUCTS[0]?.id ?? null);
    } else {
      setHighlightedProductId(engineProducts[0]?.id ?? null);
    }
    setCoHosts([
      { id: 1, name: "Sarah Chen", status: "Accepted", isPresenting: true },
      { id: 2, name: "Mike Johnson", status: "Accepted", isPresenting: false },
      { id: 3, name: "Emily Davis", status: "Accepted", isPresenting: false },
      { id: 4, name: "Alex Kim", status: "Pending", isPresenting: false },
    ]);
    setMainPresenterId(1);
    setHostPresenting(true);

    setSimulate(true);
    // setMode("live"); // Don't force live, let logic decide
    setLiveSeconds(18 * 60 + 24);
    if (viewerCount === 0) setViewerCount(842);
    setSalesCount(37);
    setLast5MinSales(5);
    setViewers(createInitialViewers());

    const initialBuyers = INITIAL_BUYERS.map(b => ({ ...b, lastActionAt: Date.now() }));
    setBuyers(initialBuyers);
    if (initialBuyers.length > 0) {
      setSelectedBuyerId(initialBuyers[0].id);
    }

    setChatMessages([
      {
        id: uid("m"),
        from: "System",
        body: "Live simulation is running. Buyer preview simulates multiple buyers with per-buyer carts and reminders.",
        time: nowTimeLabel(),
        system: true,
        langTag: "System",
      },
    ]);

    setSalesEvents([
      {
        id: uid("s"),
        label: "Buyer A bought GlowUp Serum",
        time: nowTimeLabel(),
        amount: "$24.00",
        langTag: "FR audio",
      },
    ]);

    setAiHints([
      {
        id: uid("ai"),
        text: "Mobile buyers dominate. Keep pinned product CTAs simple and visible.",
        time: nowTimeLabel(),
        severity: "info",
      },
    ]);

    setQaItems([
      {
        id: uid("q"),
        question: "Is this safe for sensitive skin?",
        from: "Viewer #119",
        status: "pinned",
        langTag: "FR audio",
        createdAt: Date.now() - 60000,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    const getCameraPermission = async () => {
      // Try using streaming engine first
        try {
        // Create canvas for compositing if not exists
        let canvas = canvasRef.current;

        // Detect optimal capabilities for resolution/FPS
        const caps = await detectDeviceCapabilities();
        const canvasWidth = caps.cameraMaxResolution.width;
        const canvasHeight = caps.cameraMaxResolution.height;

        if (!canvas) {
          canvas = document.createElement('canvas');
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          canvasRef.current = canvas;
        } else {
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
        }

        // Initialize streaming engine
        if (initStreaming && videoRef.current) {
          const success = await initStreaming(canvas, videoRef.current);
          if (success) {
            // Start camera using engine with optimal constraints
            const source = await engineStartCamera("cam1", "Camera 1");
            if (source) {
              setHasCameraPermission(true);
              console.log("Streaming engine camera initialized at", canvasWidth + "x" + canvasHeight);
              return;
            }
          }
        }
      } catch (e) {
        console.log("Streaming engine not available, falling back to direct getUserMedia");
      }

      // Fallback to direct getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera API not available in this browser.");
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Not Available',
          description: 'Your browser does not support camera access.',
        });
        return;
      }

      try {
        // First check the permission status using the Permissions API
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
            console.log('Camera permission status:', cameraPermission.state);
            if (cameraPermission.state === 'denied') {
              setHasCameraPermission(false);
              toast({
                variant: 'destructive',
                title: 'Camera Permission Denied',
                description: 'Camera permission was previously denied. Please reset it in your browser settings and refresh the page.',
              });
              return;
            }
          } catch (permError) {
            console.log('Permissions API not supported or error:', permError);
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia(
          await getOptimalCameraConstraints()
        );
        streamRef.current = stream;
        setHasCameraPermission(true);

        // Store pending stream - will be applied when video element is ready
        setPendingStream(stream);
        console.log('Camera stream obtained, stored in pending stream');
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);

        // Check error type for better message
        let errorMessage = 'Please enable camera permissions in your browser settings to use this app.';
        let errorTitle = 'Camera Access Denied';

        if (error instanceof Error) {
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            // Check for system-level denial
            const errorMessageStr = error.message || '';
            if (errorMessageStr.includes('system') || errorMessageStr.includes('System')) {
              // System-level denial - camera might be in use or blocked by policy
              errorTitle = 'Camera Blocked by System';
              errorMessage = 'Camera is being used by another application (like TikTok Live Studio, OBS, Zoom, etc.). Please close the other app completely, then try again. If the issue persists, disconnect and reconnect your camera.';
            } else {
              // User denied or system denied
              errorMessage = 'Camera permission was denied. Please click the camera/lock icon in your browser\'s address bar to allow access, reset the permission, then refresh the page. Alternatively, check if another app is using the camera.';
            }
          } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            errorTitle = 'No Camera Found';
            errorMessage = 'No camera device was found. Please connect a camera and try again.';
          } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            errorTitle = 'Camera In Use';
            errorMessage = 'Camera is currently in use by another application (like TikTok Live Studio, OBS, Zoom, etc.). Please close the other app using the camera, then click the "Try Again" button below.';
          } else if (error.name === 'OverconstrainedError') {
            errorTitle = 'Camera Not Compatible';
            errorMessage = 'Your camera does not meet the required settings. Try a different camera or browser.';
          }
        }

        toast({
          variant: 'destructive',
          title: errorTitle,
          description: errorMessage,
        });

        // If camera access fails, enable demo mode with a placeholder
        // This allows the studio to work without a real camera
        setIsDemoMode(true);
        setHasCameraPermission(true); // Allow preview to show even in demo mode
      }
    };

    getCameraPermission();

    // Listen for retry events
    const handleRetry = () => {
      console.log("Retry camera access event received");
      // Reset demo mode to try again
      setIsDemoMode(false);
      setHasCameraPermission(true);
      getCameraPermission();
    };
    window.addEventListener('retryCameraAccess', handleRetry);

    // Cleanup function
    return () => {
      window.removeEventListener('retryCameraAccess', handleRetry);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast, initStreaming, engineStartCamera]);

  // Video element ready flag - will be set by child component when video element mounts
  const [videoElementReady, setVideoElementReady] = useState(false);

  // Sync stream to videoRef whenever it changes or stage expands
  useEffect(() => {
    if (streamRef.current) {
      const targetRef = stageExpanded ? expandedVideoRef : videoRef;
      if (targetRef.current) {
        // Only set if different to avoid unnecessary re-renders
        if (targetRef.current.srcObject !== streamRef.current) {
          targetRef.current.srcObject = streamRef.current;
          console.log('Stream synced to video ref:', stageExpanded ? 'expanded' : 'main');
        }
        targetRef.current.play().catch(e => console.warn("Auto-play error", e));
      }
    }
  }, [stageExpanded, mode, streamRef.current]);

  // Re-apply stream when video element is remounted (e.g., layout changes from co-hosts)
  useEffect(() => {
    const interval = setInterval(() => {
      if (streamRef.current && videoRef.current && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
        console.log('Stream re-applied to video element after remount');
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Apply pending stream when video element becomes available
  useEffect(() => {
    if (pendingStream && videoRef.current) {
      console.log('Applying pending stream to videoRef');
      videoRef.current.srcObject = pendingStream;
      videoRef.current.play().catch(e => console.warn("Auto-play error on pending stream", e));
      setPendingStream(null); // Clear pending stream
    }
  }, [pendingStream, videoElementReady]); // Changed from videoRef.current to videoElementReady


  // keep active source synced to production mode/tool
  useEffect(() => {
    if (productionMode === "external") {
      setActiveSourceId(externalTool === "OBS" ? "obs" : "vmix");
    } else {
      setActiveSourceId((prev) => (prev === "obs" || prev === "vmix" ? "cam1" : prev));
    }
  }, [productionMode, externalTool]);

  // derived: featured product + selected buyer
  const featuredProduct = useMemo(() => {
    if (!highlightedProductId) return null;
    return products.find((p) => p.id === highlightedProductId) ?? products[0];
  }, [products, highlightedProductId]);

  const selectedBuyer = useMemo(() => {
    if (!selectedBuyerId) return null;
    return buyers.find((b) => b.id === selectedBuyerId) ?? buyers[0];
  }, [buyers, selectedBuyerId]);

  // derived: aggregated carts/reminders (global shown, but sourced from per-buyer state)
  const totalCartItems = useMemo(() => buyers.reduce((s, b) => s + buyerCartCount(b), 0), [buyers]);
  const totalReminders = useMemo(() => buyers.reduce((s, b) => s + buyerReminderCount(b), 0), [buyers]);

  // discounted price helper (uses flashRef)
  const getPriceForProduct = (p: Product) => {
    const f = flashRef.current;
    const applies = f.active && f.productId === p.id;
    const price = applies ? p.basePrice * (1 - f.discountPct / 100) : p.basePrice;
    return { price, applies };
  };

  // language mix (from live viewers sample)
  const liveLangMix = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of viewers) {
      const k = langTag(v.lang, v.listenMode);
      counts[k] = (counts[k] || 0) + 1;
    }
    const entries = Object.entries(counts)
      .map(([label, n]) => ({ label, n }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 4);
    const total = Math.max(1, entries.reduce((s, e) => s + e.n, 0));
    return entries.map((e) => ({ label: e.label, pct: Math.round((e.n / total) * 100) }));
  }, [viewers]);

  // -------------------- core actions --------------------
  const pushSystem = (body: string) => {
    setChatMessages((prev) =>
      [...prev, { id: uid("m"), from: "System", body, time: nowTimeLabel(), system: true, langTag: "System" }].slice(-120)
    );
  };

  const pushAi = (text: string, severity: AiHint["severity"]) => {
    setAiHints((prev) =>
      [{ id: uid("ai"), text, time: nowTimeLabel(), severity }, ...prev].slice(0, 16)
    );
  };

  const updateBuyer = (buyerId: string, updater: (b: BuyerAgent) => BuyerAgent) => {
    setBuyers((prev) => prev.map((b) => (b.id === buyerId ? updater(b) : b)));
  };

  const restockProduct = (productId: string, qty: number) => {
    let becameAvailable = false;
    let productName = productId;
    setProducts((prev) => {
      return prev.map((p) => {
        if (p.id !== productId) return p;
        productName = p.name;
        const wasOut = p.stock <= 0;
        const nextStock = p.stock + qty;
        if (wasOut && nextStock > 0) becameAvailable = true;
        return { ...p, stock: nextStock };
      });
    });

    pushSystem(`Restocked ${qty} units for ${productName}.`);

    if (becameAvailable) {
      // notify all buyers who had reminders for this product
      const buyersNow = buyersRef.current;
      const notifyIds = buyersNow
        .filter((b) => !!b.reminders[productId])
        .map((b) => b.id);

      if (notifyIds.length) {
        setBuyers((prev) =>
          prev.map((b) => {
            if (!b.reminders[productId]) return b;
            const nextRem = { ...b.reminders };
            delete nextRem[productId];
            return {
              ...b,
              reminders: nextRem,
              lastAction: `Notified: ${productName} back in stock`,
              lastActionAt: Date.now(),
            };
          })
        );
        pushSystem(`Notified ${notifyIds.length} buyers: ${productName} is back in stock.`);
      }
    }
  };

  const buyerAddToCart = (buyerId: string, productId: string, qty = 1) => {
    updateBuyer(buyerId, (b) => {
      const nextQty = (b.carts[productId] || 0) + qty;
      return {
        ...b,
        carts: { ...b.carts, [productId]: nextQty },
        lastAction: `Added to cart(${qty})`,
        lastActionAt: Date.now(),
      };
    });
    pushSystem(`${buyerName(buyerId)} added an item to cart.`);
  };

  const buyerSetReminder = (buyerId: string, productId: string) => {
    updateBuyer(buyerId, (b) => {
      if (b.reminders[productId]) return b;
      return {
        ...b,
        reminders: { ...b.reminders, [productId]: true },
        lastAction: "Reminder set",
        lastActionAt: Date.now(),
      };
    });
    pushSystem(`${buyerName(buyerId)} requested a restock reminder.`);
  };

  const buyerBuyNow = (buyerId: string, productId: string, qty = 1) => {
    const buyersNow = buyersRef.current;
    const buyer = buyersNow.find((b) => b.id === buyerId);
    if (!buyer) return;

    let productName = productId;
    let finalQty = 0;
    let newStockAfter: number | null = null;
    let priceApplied = 0;
    let priceApplies = false;

    setProducts((prev) => {
      return prev.map((p) => {
        if (p.id !== productId) return p;
        productName = p.name;

        if (p.stock <= 0) {
          newStockAfter = 0;
          return p;
        }

        finalQty = Math.min(qty, p.stock);
        const nextStock = Math.max(0, p.stock - finalQty);
        newStockAfter = nextStock;

        const { price, applies } = getPriceForProduct(p);
        priceApplied = price;
        priceApplies = applies;

        return { ...p, stock: nextStock };
      });
    });

    if (finalQty <= 0) {
      // out of stock path
      pushSystem(`${buyer.name} tried to buy ${productName}, but it is out of stock.`);
      buyerSetReminder(buyerId, productId);
      return;
    }

    // update buyer cart (remove purchased qty if present)
    updateBuyer(buyerId, (b) => {
      const currentInCart = b.carts[productId] || 0;
      const remaining = Math.max(0, currentInCart - finalQty);
      const nextCarts = { ...b.carts };
      if (remaining === 0) delete nextCarts[productId];
      else nextCarts[productId] = remaining;

      return {
        ...b,
        carts: nextCarts,
        lastAction: `Purchased ${finalQty} `,
        lastActionAt: Date.now(),
      };
    });

    // increment sales + last 5-min sales approximation
    setSalesCount((s) => s + finalQty);
    last5SalesRef.current.push(finalQty);
    if (last5SalesRef.current.length > 20) last5SalesRef.current.shift();
    setLast5MinSales(last5SalesRef.current.reduce((a, b) => a + b, 0));

    // sales feed event
    const tag = langTag(buyer.lang, buyer.listenMode);
    setSalesEvents((prev) =>
      [
        {
          id: uid("s"),
          label: `${finalQty}x ${productName} sold · ${buyer.name} `,
          time: nowTimeLabel(),
          amount: fmtMoneyUSD(priceApplied),
          langTag: tag,
        },
        ...prev,
      ].slice(0, 24)
    );

    if (priceApplies) {
      pushAi("Flash conversion spike. Mention countdown and remaining stock.", "opportunity");
    }

    if (newStockAfter === 0) {
      pushSystem(`⚠️ ${productName} is now out of stock.Buyer CTAs switch to Out of stock / Remind me.`);
    } else if (newStockAfter !== null && newStockAfter <= 5) {
      pushSystem(`Low stock: ${productName} has only ${newStockAfter} left.`);
    }
  };

  const buyerName = (buyerId: string) => buyersRef.current.find((b) => b.id === buyerId)?.name ?? "Buyer";

  // Flash deal actions - use engine if available, otherwise local
  const handleStartFlashDeal = (durationMinutes: number, discountPct: number, targetProductId: string) => {
    // Try engine first
    if (engineFlashDeal) {
      engineStartFlash(targetProductId, durationMinutes * 60);
      return;
    }
    // Fallback to local
    const total = durationMinutes * 60;
    const endsAt = Date.now() + total * 1000;
    setFlash({
      active: true,
      discountPct,
      totalSeconds: total,
      endsAt,
      secondsLeft: total,
      productId: targetProductId,
    });
    pushSystem(`⚡ Flash deal started on ${targetProductId}: -${discountPct}% for ${durationMinutes} minutes.`);
    pushAi(`Flash deal live.Mention: "-${discountPct}% ends in ${formatHMS(total)}".`, "opportunity");
  };

  // Canvas source management
  const handleAddSource = (type: CanvasSource["type"]) => {
    const newSource: CanvasSource = {
      id: `source_${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${canvasSources.length + 1}`,
      type,
      enabled: true,
      visible: true,
      locked: false,
      muted: false,
      volume: 1,
      order: canvasSources.length,
      position: { x: 50, y: 50 },
      size: { width: 320, height: 180 },
    };
    setCanvasSources([...canvasSources, newSource]);
    setSelectedSourceId(newSource.id);
  };

  const handleRemoveSource = (id: string) => {
    setCanvasSources(canvasSources.filter(s => s.id !== id));
    if (selectedSourceId === id) {
      setSelectedSourceId(null);
    }
  };

  const handleToggleSourceVisibility = (id: string) => {
    setCanvasSources(canvasSources.map(s =>
      s.id === id ? { ...s, visible: !s.visible } : s
    ));
  };

  const handleToggleSourceLock = (id: string) => {
    setCanvasSources(canvasSources.map(s =>
      s.id === id ? { ...s, locked: !s.locked } : s
    ));
  };

  const handleToggleSourceMute = (id: string) => {
    setCanvasSources(canvasSources.map(s =>
      s.id === id ? { ...s, muted: !s.muted } : s
    ));
  };

  const handleUpdateSourceVolume = (id: string, volume: number) => {
    setCanvasSources(canvasSources.map(s =>
      s.id === id ? { ...s, volume } : s
    ));
  };

  const handleReorderSources = (sources: CanvasSource[]) => {
    setCanvasSources(sources);
  };

  // Flash deal actions - use engine if available, otherwise local
  const handleStopFlashDeal = () => {
    // Try engine first
    if (engineFlashDeal) {
      engineStopFlash();
      return;
    }
    // Fallback to local
    setFlash({ active: false, discountPct: 0, endsAt: null, totalSeconds: 0, secondsLeft: 0, productId: null });
    pushSystem("Flash deal ended.");
  };

  // Audio request actions
  const acceptAudioRequest = (reqId: string) => {
    const req = audioRequests.find((r) => r.id === reqId);
    if (!req) return;

    // end any current speaker
    if (currentSpeaker) {
      setAudioRequests((prev) => prev.map((r) => (r.id === currentSpeaker.requestId ? { ...r, status: "ended" } : r)));
    }

    setAudioRequests((prev) => prev.map((r) => (r.id === reqId ? { ...r, status: "accepted" } : r)));

    const durationSec = 45;
    const endsAt = Date.now() + durationSec * 1000;
    setCurrentSpeaker({ requestId: reqId, viewerName: req.viewerName, langTag: req.langTag, endsAt });
    setSpeakerSecondsLeft(durationSec);

    pushSystem(`🎙️ Accepted audio request: ${req.viewerName} (${req.langTag}) for ${durationSec}s.`);
    pushAi("Live audio active. Keep answers short and restate the CTA once.", "info");
  };

  const declineAudioRequest = (reqId: string) => {
    const req = audioRequests.find((r) => r.id === reqId);
    setAudioRequests((prev) => prev.map((r) => (r.id === reqId ? { ...r, status: "declined" } : r)));
    if (req) pushSystem(`Declined audio request: ${req.viewerName}.`);
  };

  const endCurrentSpeaker = () => {
    if (!currentSpeaker) return;
    setAudioRequests((prev) => prev.map((r) => (r.id === currentSpeaker.requestId ? { ...r, status: "ended" } : r)));
    pushSystem(`Audio ended by host: ${currentSpeaker.viewerName}.`);
    setCurrentSpeaker(null);
  };

  // -------------------- timers --------------------
  // live clock
  useEffect(() => {
    if (mode !== "live" || !simulate) return;
    const t = setInterval(() => {
      setLiveSeconds((s) => s + 1);
      // Record analytics sample every 5 seconds
      if (engineState.analytics.tracking) {
        engineRecordSample();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [mode, simulate]);

  // flash countdown (real)
  useEffect(() => {
    if (!flash.active || !flash.endsAt) return;
    const t = setInterval(() => {
      const diff = Math.max(0, flash.endsAt! - Date.now());
      const left = Math.ceil(diff / 1000);
      setFlash((prev) => {
        // if already stopped, do nothing
        if (!prev.active || !prev.endsAt) return prev;
        if (left <= 0) {
          pushSystem("Flash deal ended.");
          return { active: false, discountPct: 0, endsAt: null, totalSeconds: 0, secondsLeft: 0, productId: null };
        }
        return { ...prev, secondsLeft: left };
      });
    }, 250);
    return () => clearInterval(t);
  }, [flash.active, flash.endsAt]);

  // speaker countdown
  useEffect(() => {
    if (!currentSpeaker) return;
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((currentSpeaker.endsAt - Date.now()) / 1000));
      setSpeakerSecondsLeft(left);
      if (left <= 0) {
        setAudioRequests((prev) => prev.map((r) => (r.id === currentSpeaker.requestId ? { ...r, status: "ended" } : r)));
        pushSystem(`Audio ended: ${currentSpeaker.viewerName}.`);
        setCurrentSpeaker(null);
      }
    }, 500);
    return () => clearInterval(t);
  }, [currentSpeaker]);

  // -------------------- simulation streams --------------------
  useEffect(() => {
    if (mode !== "live" || !simulate) return;

    // Chat from viewers
    const chatTimer = setInterval(() => {
      const viewersNow = viewersRef.current;
      if (!viewersNow.length) return;
      const v = pick(viewersNow);
      const templates = [
        "Does this work for oily skin?",
        "What is the shipping time to my city?",
        "Can I pay on delivery?",
        "Show the texture closer please.",
        "Is there a bundle discount now?",
        "How many are left in stock?",
        "Do you have a smaller size?",
      ];
      setChatMessages((prev) =>
        [...prev, { id: uid("m"), from: v.name, body: pick(templates), time: nowTimeLabel(), langTag: langTag(v.lang, v.listenMode) }].slice(-120)
      );
      if (Math.random() < 0.12) {
        setChatMessages((prev) =>
          [...prev, { id: uid("m"), from: "System", body: `🔥 Engagement spike: ${randInt(10, 40)} likes in the last minute.`, time: nowTimeLabel(), system: true, langTag: "System" }].slice(-120)
        );
      }
    }, 1400);

    // AI prompts
    const aiTimer = setInterval(() => {
      const f = flashRef.current;
      const hints: Array<{ t: string; s: AiHint["severity"] }> = [
        { t: "Language mix shifting. Repeat key benefits slowly for AI translation accuracy.", s: "info" },
        { t: f.active ? "Flash deal live. Mention remaining time once every 60 seconds." : "Price sensitivity detected. Consider a short flash deal.", s: f.active ? "info" : "warning" },
        { t: "Mobile buyers dominate. Keep the pinned CTA visible and simple.", s: "opportunity" },
      ];
      const h = pick(hints);
      pushAi(h.t, h.s);
    }, 2600);

    // Q&A
    const qaTimer = setInterval(() => {
      const viewersNow = viewersRef.current;
      if (!viewersNow.length) return;

      if (Math.random() < 0.55) {
        const v = pick(viewersNow);
        const qTemplates = [
          "Is it suitable for teenagers?",
          "How long does one bottle last?",
          "Do you have a discount code?",
          "Can you show ingredients?",
          "Is there a fragrance?",
        ];
        setQaItems((prev) =>
          [
            {
              id: uid("q"),
              question: pick(qTemplates),
              from: v.name,
              status: "unanswered" as const,
              langTag: langTag(v.lang, v.listenMode),
              createdAt: Date.now(),
            },
            ...prev,
          ].slice(0, 14)
        );
      }

      if (Math.random() < 0.22) {
        setQaItems((prev) => {
          const idx = prev.findIndex((x) => x.status === "unanswered");
          if (idx === -1) return prev;
          const copy = [...prev];
          copy[idx] = { ...copy[idx], status: "pinned" };
          return copy;
        });
      }

      if (Math.random() < 0.16) {
        setQaItems((prev) => {
          const idx = prev.findIndex((x) => x.status === "pinned");
          if (idx === -1) return prev;
          const copy = [...prev];
          copy[idx] = { ...copy[idx], status: "answered" };
          return copy;
        });
      }
    }, 3200);

    // Viewers join/leave
    const viewerTimer = setInterval(() => {
      const join = Math.random() < 0.6;
      if (join) {
        const langs: ViewerLang[] = ["en", "fr", "sw", "ar", "pt"];
        const lang = pick(langs);
        const listenMode: ListenMode = lang === "en" ? "original" : pick(["ai_audio", "ai_captions"]);
        const nv: LiveViewer = { id: uid("v"), name: `Viewer #${randInt(100, 999)} `, lang, listenMode, joinedAt: Date.now() };
        setViewers((prev) => [nv, ...prev].slice(0, 28));
        setViewerCount((c) => c + randInt(1, 4));
        setChatMessages((prev) =>
          [...prev, { id: uid("m"), from: "System", body: `${nv.name} joined(${langTag(lang, listenMode)}).`, time: nowTimeLabel(), system: true, langTag: "System" }].slice(-120)
        );
      } else {
        setViewers((prev) => {
          if (prev.length < 4) return prev;
          const leaving = prev[randInt(0, Math.min(prev.length - 1, 6))];
          const next = prev.filter((x) => x.id !== leaving.id);
          setViewerCount((c) => Math.max(0, c - randInt(1, 3)));
          setChatMessages((cm) =>
            [...cm, { id: uid("m"), from: "System", body: `${leaving.name} left.`, time: nowTimeLabel(), system: true, langTag: "System" }].slice(-120)
          );
          return next;
        });
      }
    }, 4200);

    // Audio requests
    const audioReqTimer = setInterval(() => {
      const pending = audioRequests.filter((r) => r.status === "pending").length;
      if (pending >= 4) return;
      if (Math.random() < 0.35) {
        const viewersNow = viewersRef.current;
        if (!viewersNow.length) return;
        const v = pick(viewersNow);
        const alreadyPending = audioRequests.some((r) => r.viewerId === v.id && r.status === "pending");
        if (alreadyPending) return;

        const req: AudioRequest = {
          id: uid("ar"),
          viewerId: v.id,
          viewerName: v.name,
          langTag: langTag(v.lang, v.listenMode),
          time: nowTimeLabel(),
          status: "pending",
        };
        setAudioRequests((prev) => [req, ...prev].slice(0, 12));
        setChatMessages((prev) =>
          [...prev, { id: uid("m"), from: "System", body: `🎙️ Audio request: ${req.viewerName} (${req.langTag})`, time: nowTimeLabel(), system: true, langTag: "System" }].slice(-120)
        );
      }
    }, 5200);

    // MULTI-BUYER simulation (per-buyer carts + reminders)
    const buyerTimer = setInterval(() => {
      const buyersNow = buyersRef.current;
      const productsNow = productsRef.current;
      const f = flashRef.current;

      if (!buyersNow.length || !productsNow.length || !highlightedProductId) return;

      const buyer = pick(buyersNow);

      // Choose product to act on: prefer flash product when active, else featured, else random
      const flashTarget = f.active && f.productId ? productsNow.find((p) => p.id === f.productId) : null;

      let targetProduct: Product | undefined;
      if (flashTarget && flashTarget.stock > 0 && Math.random() < 0.65) {
        targetProduct = flashTarget;
      } else {
        targetProduct = productsNow.find((p) => p.id === highlightedProductId) ?? pick(productsNow);
      }

      if (!targetProduct) return;

      // If out of stock: set reminder (per buyer)
      if (targetProduct.stock <= 0) {
        const already = !!buyer.reminders[targetProduct.id];
        if (!already) buyerSetReminder(buyer.id, targetProduct.id);
        return;
      }

      // If low stock, more likely to buy now
      const lowStock = targetProduct.stock <= 5;
      const buyChance = f.active && f.productId === targetProduct.id ? 0.55 : lowStock ? 0.45 : 0.30;

      // If already in cart, also increases buy chance
      const inCartQty = buyer.carts[targetProduct.id] || 0;
      const boostedBuyChance = Math.min(0.85, buyChance + (inCartQty > 0 ? 0.20 : 0));

      const roll = Math.random();
      if (roll < boostedBuyChance) {
        buyerBuyNow(buyer.id, targetProduct.id, 1);
      } else {
        // add to cart (per buyer)
        buyerAddToCart(buyer.id, targetProduct.id, 1);
      }
    }, 1600);

    // Occasional restock to demonstrate "Remind me" notifications
    const restockTimer = setInterval(() => {
      const ps = productsRef.current;
      const out = ps.filter((p) => p.stock <= 0);
      if (!out.length) return;
      const p = pick(out);
      restockProduct(p.id, 12);
    }, 18000);

    return () => {
      clearInterval(chatTimer);
      clearInterval(aiTimer);
      clearInterval(qaTimer);
      clearInterval(viewerTimer);
      clearInterval(audioReqTimer);
      clearInterval(buyerTimer);
      clearInterval(restockTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, simulate, audioRequests, highlightedProductId]);

  // -------------------- UI computed --------------------
  const liveTimerLabel = mode === "live" ? formatHMS(liveSeconds) : "--:--";
  const typeLabel = mode === "live" ? "Live" : "Pre-live";
  const cameraHint = previewMode === "auto" ? `Auto(${deviceKind})` : previewMode === "mobile" ? "Mobile" : "Desktop";

  const flashOnFeatured = !!(featuredProduct && flash.active && flash.productId === featuredProduct.id);
  const featuredOOS = !!(featuredProduct && featuredProduct.stock <= 0);
  const featuredLow = !!(featuredProduct && featuredProduct.stock > 0 && featuredProduct.stock <= 5);

  const selectedBuyerHasReminder = !!(selectedBuyer && featuredProduct && selectedBuyer.reminders[featuredProduct.id]);
  const selectedBuyerCartQty = (selectedBuyer && featuredProduct && selectedBuyer.carts[featuredProduct.id]) || 0;

  const featuredPriceInfo = useMemo(() => {
    if (!featuredProduct) return { price: 0, applies: false };
    return getPriceForProduct(featuredProduct)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredProduct, flash.active, flash.discountPct, flash.productId, flash.secondsLeft]);

  const rootClass = darkMode
    ? "h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50"
    : "h-screen flex flex-col overflow-hidden bg-slate-50 text-slate-900";

  if (products.length === 0) {
    return (
      <div className={rootClass}>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner className="h-10 w-10 text-emerald-500" />
            <p className="text-sm text-slate-400">Loading studio...</p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------- render --------------------
  return (
    <div className={rootClass}>
      {/* Top bar */}
      <header
        className={
          "h-14 flex items-center justify-between px-4 md:px-6 border-b backdrop-blur-sm z-50 flex-shrink-0 " +
          (darkMode ? "border-slate-800/80 bg-slate-950/80 shadow-[0_8px_30px_rgba(15,23,42,0.7)]" : "border-slate-200 bg-white shadow-sm")
        }
      >
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: EV_ORANGE }}>
            LD
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-sm font-semibold truncate">Live Dealz Studio</span>
            <span className="text-[10px] text-slate-500 truncate hidden sm:block">Multi-buyer preview + stock-aware CTAs + flash urgency</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live status - Mic, Camera, Scene info */}
          <div className="hidden md:flex items-center gap-2 text-[10px]">
            {/* Mic status */}
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${micOn ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200' : 'bg-red-500/10 border-red-500/40 text-red-300'}`}>
              <span className="material-icons text-[12px]">{micOn ? 'mic' : 'mic_off'}</span>
              <span>{micOn ? 'Mic' : 'Muted'}</span>
            </div>
            {/* Camera status */}
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${camOn ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200' : 'bg-red-500/10 border-red-500/40 text-red-300'}`}>
              <span className="material-icons text-[12px]">{camOn ? 'videocam' : 'videocam_off'}</span>
              <span>{camOn ? 'Cam' : 'Off'}</span>
            </div>
            {/* Scene label */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
              <span className="material-icons text-[12px]">movie</span>
              <span>Scene: {activeSceneLabel}</span>
            </div>
            {/* AI Audio */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-200">
              <span className="material-icons text-[12px]">graphic_eq</span>
              <span>AI</span>
            </div>
            {/* Captions */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/40 text-sky-200">
              <span className="material-icons text-[12px]">subtitles</span>
              <span>CC</span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 text-slate-50 border border-slate-700">
            <span className={`h-1.5 w-1.5 rounded-full ${mode === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
            <span>
              {typeLabel} · {liveTimerLabel}
            </span>
          </span>
          <StatPill label="Viewers" value={viewerCount.toLocaleString()} />
          <StatPill label="Sales" value={String(salesCount)} />
          <StatPill label="Carts" value={String(totalCartItems)} />
          <StatPill label="Reminders" value={String(totalReminders)} />
        </div>

        <button
          onClick={() => setSimulate((v) => !v)}
          className={
            "hidden md:inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border " +
            (simulate ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200" : "border-slate-700 bg-slate-900 text-slate-200")
          }
          title="Toggle simulation"
        >
          <span className="material-icons text-sm">online_prediction</span>
          {simulate ? "Simulating" : "Paused"}
        </button>

        <button
          onClick={() => setLanguagePanelOpen(true)}
          className="hidden md:inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900 text-slate-100"
        >
          <span className="material-icons text-sm">translate</span>
          Language
        </button>

        <button
          onClick={() => setDarkMode((v) => !v)}
          className={
            "inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border " +
            (darkMode ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-300 bg-white text-slate-700")
          }
        >
          <span className="text-sm" role="img" aria-label="theme">{darkMode ? "🌙" : "☀️"}</span>
          <span className="hidden sm:inline">{darkMode ? "Dark" : "Light"}</span>
        </button>

        <div className="h-8 w-8 rounded-full bg-slate-400 flex items-center justify-center text-xs font-semibold text-white">
          CR
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden pb-16 md:pb-0">
        {/* Responsive wrapper */}
        <div className="flex-1 flex flex-col md:flex-row gap-3 p-3 min-w-0 overflow-hidden h-full">

          {/* Left Column (hidden on mobile, visible on desktop) */}
          <section className="hidden md:flex flex-col gap-3 w-full md:w-72 lg:w-80 flex-shrink-0 overflow-y-auto">
            <TeleprompterPanel currentSession={currentSession} />
            <InventoryPanel
              products={products}
              highlightedId={highlightedProductId}
              onSelectProduct={setHighlightedProductId}
              flash={flash}
              flashUrgency={flashUrgency}
              onOpenFlash={() => setFlashConfigOpen(true)}
              onStopFlash={handleStopFlashDeal}
              onRestock={restockProduct}
              getPriceForProduct={getPriceForProduct}
            />
          </section >

          {/* Center and Right columns wrapper */}
          <div className="flex-1 flex flex-col md:flex-row gap-3 min-w-0 min-h-0 h-full">
            {/* Center column - Camera/Stage */}
            <section className="flex-1 flex flex-col gap-3 min-w-0 min-h-0 h-full">
              <StagePanel
                darkMode={darkMode}
                mode={mode}
                activeSceneId={activeSceneId}
                onChangeScene={setActiveSceneId}
                previewMode={previewMode}
                onChangePreviewMode={setPreviewMode}
                resolvedPreviewMode={resolvedPreviewMode}
                forceMobileMode={deviceKind === "mobile"}
                cameraHint={cameraHint}
                liveTimerLabel={liveTimerLabel}
                viewerCount={viewerCount}
                liveLangMix={liveLangMix}
                productionMode={productionMode}
                externalTool={externalTool}
                activeSourceId={activeSourceId}
                flash={flash}
                flashUrgency={flashUrgency}
                micOn={micOn}
                camOn={camOn}
                screenShareOn={screenShareOn}
                currentSpeaker={currentSpeaker}
                speakerSecondsLeft={speakerSecondsLeft}
                onExpand={() => setStageExpanded(true)}
                videoRef={videoRef}
                hasCameraPermission={hasCameraPermission}
                onVideoElementReady={() => setVideoElementReady(true)}
                transcriptionOn={transcriptionOn}
                transcript={transcript}
                activeFilter={activeFilter}
                activeFilterCategory={activeFilterCategory}
                filterIntensity={filterIntensity}
                retryCameraAccess={retryCameraAccess}
                isDemoMode={isDemoMode}
                cameraError={cameraError}
                coHosts={coHosts}
                mainPresenterId={mainPresenterId}
                hostPresenting={hostPresenting}
                canvasSources={canvasSources}
                selectedSourceId={selectedSourceId}
                onSelectSource={setSelectedSourceId}
                onUpdateSourcePosition={(id, position) => {
                  setCanvasSources(canvasSources.map(s =>
                    s.id === id ? { ...s, position } : s
                  ));
                }}
                onUpdateSourceSize={(id, size) => {
                  setCanvasSources(canvasSources.map(s =>
                    s.id === id ? { ...s, size } : s
                  ));
                }}
              />
            </section >

            {/* Right Column - Chat/Audience */}
            <section className="w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col gap-3 min-h-0 overflow-hidden">
              <AudiencePanel
                activeTab={audienceTab}
                onTabChange={setAudienceTab}
                messages={chatMessages}
                qaItems={qaItems}
                viewers={viewers}
                liveLangMix={liveLangMix}
                audioRequests={audioRequests}
                currentSpeaker={currentSpeaker}
                speakerSecondsLeft={speakerSecondsLeft}
                onAcceptAudio={acceptAudioRequest}
                onDeclineAudio={declineAudioRequest}
                onEndSpeaker={endCurrentSpeaker}
                onSendMessage={(msg) => {
                  setChatMessages((prev) => [...prev, { id: uid("m"), from: "System", body: msg, time: nowTimeLabel(), system: true }].slice(-120));
                }}
                onPinQuestion={(id) => {
                  setQaItems((prev) => prev.map((q) => q.id === id ? { ...q, status: "pinned" as const } : q));
                }}
                onAnswerQuestion={(id) => {
                  setQaItems((prev) => prev.map((q) => q.id === id ? { ...q, status: "answered" as const } : q));
                }}
                onMuteViewer={(id) => {
                  console.log("Mute viewer:", id);
                  // In real app, this would send to backend
                }}
                onBanViewer={(id) => {
                  console.log("Ban viewer:", id);
                  setViewers((prev) => prev.filter((v) => v.id !== id));
                }}
                draft={chatDraft}
                onDraftChange={setChatDraft}
                onSend={() => {
                  const t = chatDraft.trim();
                  if (!t) return;
                  setChatMessages((prev) => [...prev, { id: uid("m"), from: "You", body: t, time: nowTimeLabel(), langTag: "en" }].slice(-120));
                  setChatDraft("");
                }}
                polls={polls}
                onCreatePoll={handleCreatePoll}
                onVotePoll={handleVotePoll}
                onClosePoll={handleClosePoll}
                onDeletePoll={handleDeletePoll}
                giveaways={giveaways}
                onPickWinner={handlePickWinner}
              />
              {/* AI Prompts Toast */}
              <AIPromptsToast
                prompts={aiHints}
                onDismiss={(id) => setAiHints(prev => prev.filter(h => h.id !== id))}
              />
            </section >
          </div >
        </div >
      </main >

      {/* Bottom control bar - hidden on mobile */}
      <div className="sticky bottom-0 z-40 hidden md:flex w-full">
        <ControlBar
          darkMode={darkMode}
          mode={mode}
          onToggleRehearsal={() => setMode((m) => (m === "rehearsal" ? "lobby" : "rehearsal"))}
          onToggleLive={() => setMode((m) => (m === "live" ? "lobby" : "live"))}
          micOn={micOn}
          onToggleMic={() => {
            if (streamRef.current) {
              streamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
              });
            }
            setMicOn((v) => !v);
          }}
          camOn={camOn}
          onToggleCam={() => {
            if (streamRef.current) {
              streamRef.current.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
              });
            }
            setCamOn((v) => !v);
          }}
          screenShareOn={screenShareOn}
          onToggleScreenShare={() => setScreenShareOn((v) => !v)}
          previewMode={previewMode}
          onCyclePreviewMode={() => {
            const order: PreviewMode[] = ["auto", "desktop", "mobile"];
            const idx = order.indexOf(previewMode);
            setPreviewMode(order[(idx + 1) % order.length]);
          }}
          cameraHint={cameraHint}
          flashActive={flash.active}
          onOpenFlashConfig={() => setFlashConfigOpen(true)}
          onStopFlash={handleStopFlashDeal}
          onOpenLanguage={() => setLanguagePanelOpen(true)}
          onToggleFilters={() => setFiltersOpen((v) => !v)}
          onToggleCommerceHud={() => setCommerceHudOpen((v) => !v)}
          commerceHudOpen={commerceHudOpen}
          onToggleCoHosts={() => setCoHostsOpen((v) => !v)}
          coHostsOpen={coHostsOpen}
          onToggleAttachments={() => setAttachmentsOpen((v) => !v)}
          attachmentsOpen={attachmentsOpen}
          showProduction={showProduction}
          onToggleProduction={() => setShowProduction(v => !v)}
          onToggleSceneManager={() => setSceneManagerOpen(v => !v)}
          onToggleAudioMixer={() => setAudioMixerOpen(v => !v)}
          audioMixerOpen={audioMixerOpen}
          showBuyers={buyersOpen}
          onToggleBuyers={() => setBuyersOpen(v => !v)}
          showSources={sourcesOpen}
          onToggleSources={() => setSourcesOpen(v => !v)}
          campaigns={campaigns}
          currentCampaign={currentCampaign}
          currentSession={currentSession}
          onSelectCampaign={handleSelectCampaign}
          onSelectSession={handleSelectSession}
          campaignModalOpen={campaignModalOpen}
          onToggleCampaignModal={() => setCampaignModalOpen(v => !v)}
          hostPresenting={hostPresenting}
          onToggleHostPresenting={() => setHostPresenting(v => !v)}
        />
      </div >

      {/* Mobile bottom nav - only visible on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <MobileBottomNav
          micOn={micOn}
          onToggleMic={() => {
            if (streamRef.current) {
              streamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
              });
            }
            setMicOn((v) => !v);
          }}
          camOn={camOn}
          onToggleCam={() => {
            if (streamRef.current) {
              streamRef.current.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
              });
            }
            setCamOn((v) => !v);
          }}
          isLive={mode === "live"}
          onToggleLive={() => setMode((m) => (m === "live" ? "lobby" : "live"))}
          flashActive={flash.active}
          onOpenFlashConfig={() => setFlashConfigOpen(true)}
          onStopFlash={handleStopFlashDeal}
          onOpenSlideMenu={() => setMobileMenuOpen(true)}
        />
      </div >

      {/* Mobile slide menu */}
      < MobileSlideMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)
        }
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((v) => !v)}
        onToggleSceneManager={() => setSceneManagerOpen(v => !v)}
        sourcesOpen={sourcesOpen}
        onToggleSources={() => setSourcesOpen(v => !v)}
        onToggleAudioMixer={() => setAudioMixerOpen(v => !v)}
        transcriptionOn={transcriptionOn}
        onToggleTranscription={() => setTranscriptionOn(v => !v)}
        onToggleCoHosts={() => setCoHostsOpen(v => !v)}
        onToggleProduction={() => setShowProduction(v => !v)}
      />

      {/* Production Overlay */}
      {
        showProduction && (
          <ProductionPanel
            productionMode={productionMode}
            externalTool={externalTool}
            activeSourceId={activeSourceId}
            onChangeProductionMode={setProductionMode}
            onChangeExternalTool={setExternalTool}
            onChangeSource={setActiveSourceId}
            onClose={() => setShowProduction(false)}
            onCameraSwitch={handleCameraSwitch}
          />
        )
      }

      {/* Overlays */}
      {
        filtersOpen && (
          <FiltersTray
            darkMode={darkMode}
            activeFilter={activeFilter}
            intensity={filterIntensity}
            onSelectFilter={(f, category) => {
              setActiveFilter(f);
              setActiveFilterCategory(category);
            }}
            onIntensityChange={(value) => {
              setFilterIntensity(value);
            }}
            onClose={() => setFiltersOpen(false)}
          />
        )
      }

      {
        audioMixerOpen && (
          <VideoAudioPanel
            darkMode={darkMode}
            isOpen={audioMixerOpen}
            onClose={() => setAudioMixerOpen(false)}
            sources={getAudioSources()}
            masterVolume={engineState.audio.masterVolume}
            masterMuted={engineState.audio.masterMuted}
            onSetSourceVolume={setSourceVolume}
            onSetSourcePan={setSourcePan}
            onSetSourceMuted={setSourceMuted}
            onSetSourceSolo={setSourceSolo}
            onSetMasterVolume={setMasterVolume}
            onSetMasterMuted={setMasterMuted}
            onEnableNoiseReduction={enableNoiseReduction}
            onAddMicrophone={addMicrophone}
            onAddScreenShareAudio={addScreenShareAudio}
            onRemoveSource={removeAudioSource}
            streamConfig={getStreamConfig() ?? undefined}
            onStreamConfigChange={handleVideoConfigChange}
            currentQuality={currentQuality}
            onQualityChange={handleQualityChange}
          />
        )
      }

      {
        sourcesOpen && (
          <SourcesPanel
            darkMode={darkMode}
            isOpen={sourcesOpen}
            onClose={() => setSourcesOpen(false)}
            sources={canvasSources}
            onAddSource={handleAddSource}
            onRemoveSource={handleRemoveSource}
            onToggleVisibility={handleToggleSourceVisibility}
            onToggleLock={handleToggleSourceLock}
            onToggleMute={handleToggleSourceMute}
            onUpdateVolume={handleUpdateSourceVolume}
            onReorderSources={handleReorderSources}
            selectedSourceId={selectedSourceId}
            onSelectSource={setSelectedSourceId}
          />
        )
      }

      {
        buyersOpen && (
          <BuyerAppShell
            darkMode={darkMode}
            isOpen={buyersOpen}
            onClose={() => setBuyersOpen(false)}
          />
        )
      }

      {
        commerceHudOpen && (
          <CommerceHUD
            darkMode={darkMode}
            targetUnits={50}
            soldUnits={salesCount}
            cartCount={totalCartItems}
            last5MinSales={last5MinSales}
            flash={flash}
            flashUrgency={flashUrgency}
            salesEvents={salesEvents}
            onClose={() => setCommerceHudOpen(false)}
          />
        )
      }

      {
        sceneManagerOpen && (
          <SceneManagerHUD
            darkMode={darkMode}
            scenes={SCENES.map(s => ({
              id: s.id,
              name: s.label,
              sources: []
            }))}
            activeSceneId={activeSceneId}
            onSceneChange={setActiveSceneId}
            onSourceToggle={() => { }}
            onSourceVisibility={() => { }}
            onClose={() => setSceneManagerOpen(false)}
          />
        )
      }

      {
        coHostsOpen && (
          <CoHostsHUD
            darkMode={darkMode}
            coHosts={coHosts}
            mainPresenterId={mainPresenterId}
            onInvite={(name) => { setCoHosts((p) => [...p, { id: coHostIdCounter, name, status: "Invited" }]); setCoHostIdCounter((v) => v + 1); }}
            onInviteAll={(names) => {
              setCoHosts((p) => {
                const newCoHosts = [...p];
                names.forEach((name) => {
                  newCoHosts.push({ id: coHostIdCounter + newCoHosts.length - p.length, name, status: "Invited" });
                });
                return newCoHosts;
              });
              setCoHostIdCounter((v) => v + names.length);
            }}
            onRemove={(id) => { setCoHosts((p) => p.filter(c => c.id !== id)); if (mainPresenterId === id) setMainPresenterId(null); }}
            onSetMainPresenter={(id) => setMainPresenterId(id)}
            onTogglePresenting={(id) => setCoHosts((p) => p.map(c => c.id === id ? { ...c, isPresenting: !c.isPresenting } : c))}
            onClose={() => setCoHostsOpen(false)}
          />
        )
      }

      {
        attachmentsOpen && (
          <AttachmentsHUD
            darkMode={darkMode}
            attachments={attachments}
            onApprove={(id) => pushSystem(`Approved attachment ${id} (demo).`)}
            onReject={(id) => pushSystem(`Rejected attachment ${id} (demo).`)}
            onClose={() => setAttachmentsOpen(false)}
          />
        )
      }

      {
        flashConfigOpen && (
          <FlashDealDialog
            onClose={() => setFlashConfigOpen(false)}
            onStart={(durationMin, discountPct) => {
              if (highlightedProductId) {
                handleStartFlashDeal(durationMin, discountPct, highlightedProductId);
                setFlashConfigOpen(false);
              }
            }}
          />
        )
      }

      {languagePanelOpen && <LanguagePanel onClose={() => setLanguagePanelOpen(false)} liveLangMix={liveLangMix} />}

      {
        stageExpanded && (
          <ExpandedStageModal
            darkMode={darkMode}
            onClose={() => setStageExpanded(false)}
            cameraHint={cameraHint}
            previewMode={previewMode}
            onChangePreviewMode={setPreviewMode}
            resolvedPreviewMode={resolvedPreviewMode}
            liveTimerLabel={liveTimerLabel}
            viewerCount={viewerCount}
            liveLangMix={liveLangMix}
            productionMode={productionMode}
            externalTool={externalTool}
            activeSourceId={activeSourceId}
            flash={flash}
            flashUrgency={flashUrgency}
            currentSpeaker={currentSpeaker}
            speakerSecondsLeft={speakerSecondsLeft}
            videoRef={expandedVideoRef}
            hasCameraPermission={hasCameraPermission}
            transcriptionOn={transcriptionOn}
            transcript={transcript}
            activeFilter={activeFilter}
            activeFilterCategory={activeFilterCategory}
            filterIntensity={filterIntensity}
          />
        )
      }

      {/* Campaign Modal */}
      <CampaignModal
        isOpen={campaignModalOpen}
        onClose={() => setCampaignModalOpen(false)}
        campaigns={campaigns}
        currentCampaign={currentCampaign}
        currentSession={currentSession}
        onSelectCampaign={handleSelectCampaign}
        onSelectSession={handleSelectSession}
      />

      {/* SVG Filters (Hidden but accessible via ID) */}
      <svg className="hidden">
        <defs>
          <filter id="filter-beauty-soft">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -7" result="goo" />
            <feBlend in="SourceGraphic" in2="blur" mode="screen" />
          </filter>
          <filter id="filter-beauty-glam">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feBlend in="SourceGraphic" in2="blur" mode="overlay" />
            <feColorMatrix type="saturate" values="1.2" />
          </filter>
        </defs>
      </svg>
    </div >
  );
}
