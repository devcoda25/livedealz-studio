"use client";

import React, { Component, ErrorInfo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useStudioSocket } from "@/hooks/useStudioSocket";
import { useEngines } from "@/hooks/useEngines";
import { useAppTheme } from "@/components/ThemeProvider";
// StagePreview removed - using direct video element for camera
// Shared Components & Infrastructure
import { FloatingReactions } from "../components/shared/FloatingReactions";
import { FlashDealDialog } from "../components/shared/FlashDealDialog";
import { uid, nowTimeLabel, formatHMS, createInitialViewers, computeUrgency } from "../components/shared/utils";
import { INITIAL_PRODUCTS, INITIAL_BUYERS, EV_ORANGE } from "../components/shared/constants";
import {
    Mode, FlashDealState, LiveViewer, ChatMsg, SaleEvent, AiHint, QaItem,
    AudioRequest, CurrentSpeaker, Product, BuyerAgent, LivePoll, Giveaway,
    Campaign, CampaignSession
} from "../components/shared/types";

// Mobile-Specific Components - Shared
import { MobileTopNav } from "../components/mobile/shared/MobileTopNav";
import { MobileBottomNav } from "../components/mobile/shared/MobileBottomNav";
import { MobileRightActions } from "../components/mobile/shared/MobileRightActions";
import { MobileFilterSheet } from "../components/mobile/shared/MobileFilterSheet";
import { MobileSourcesSheet } from "../components/mobile/shared/MobileSourcesSheet";
import { MobileScenesSheet } from "../components/mobile/shared/MobileScenesSheet";
import { MobileSettingsSheet } from "../components/mobile/shared/MobileSettingsSheet";
import { MobileMultiCamSheet } from "../components/mobile/shared/MobileMultiCamSheet";
import { MobileSlideMenu } from "../components/mobile/shared/MobileSlideMenu";
import { MobileCommerceSheet } from "../components/mobile/shared/MobileCommerceSheet";

// Mobile-Specific Components - Live
import { MobileLiveChat } from "../components/mobile/live/MobileLiveChat";
import { MobileChatOverlay } from "../components/mobile/live/MobileChatOverlay";
import { MobilePollsSheet } from "../components/mobile/live/MobilePollsSheet";
import { MobileGiveawaysSheet } from "../components/mobile/live/MobileGiveawaysSheet";
import { MobileLiveNotification, LiveNotificationEvent } from "../components/mobile/live/MobileLiveNotification";
import { CartNotification, createCartEvent } from "../components/mobile/live/CartNotification";
import { SalesGoalBar } from "../components/mobile/live/SalesGoalBar";
import { MobileLiveHUD } from "../components/mobile/live/MobileLiveHUD";
import { LiveTogetherSheet, LiveGuest, LiveGuestLayout, LiveGuestRequest } from "../components/mobile/live/LiveTogetherSheet";
import { LiveGuestsOverlay } from "../components/mobile/live/LiveGuestsOverlay";
import { MobileOverlayElementsLayer, type MobileOverlayElement } from "../components/mobile/live/MobileOverlayElementsLayer";
import { MobileOverlayElementsSheet } from "../components/mobile/live/MobileOverlayElementsSheet";

// Mobile-Specific Components - Record / Rehearsal
import { MobileTeleprompterSheet } from "../components/mobile/record/MobileTeleprompterSheet";
import { MobileTeleprompterOverlay } from "../components/mobile/record/MobileTeleprompterOverlay";
import { MobileProductFormSheet } from "../components/mobile/record/MobileProductFormSheet";
import { MobileRecordHUD } from "../components/mobile/record/MobileRecordHUD";
import { RecordPage } from "../components/mobile/record/RecordPage";
import { MobileRehearsalHUD } from "../components/mobile/rehearsal/MobileRehearsalHUD";
import { MobileHomePage } from "../components/mobile/shared/MobileHomePage";
import { VideosPage } from "../components/mobile/shared/VideosPage";
import { CampaignsPage } from "../components/mobile/shared/CampaignsPage";
import { ProfilePage } from "../components/mobile/shared/ProfilePage";
import { SettingsPage } from "../components/mobile/shared/SettingsPage";
import { MorePage } from "../components/mobile/shared/MorePage";
import { PreLivePage } from "../components/mobile/live/PreLivePage";

import { FilterCategory } from "../../../engines/media/types";
import { Spinner } from "@/components/ui/spinner";
import { getRecordEffectCssFilter } from "../components/mobile/record/recordEffects";

// Error boundary to catch rendering errors
class MobileErrorBoundary extends Component<{ children: React.ReactNode; fallback?: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("[MobileStudio] Error boundary caught:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="fixed inset-0 bg-black flex items-center justify-center">
                    <p className="text-white text-sm">Something went wrong. Please refresh.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

export function MobileStudioView() {
    const { state: socketState, sendChat, startFlash, stopFlash, getSocket } = useStudioSocket();
    const {
        state: engineState,
        products: engineProducts,
        chatMessages: engineChatMessages,
        initializeStreaming: initStreaming,
        startCamera: engineStartCamera,
        startStream: engineStartStream,
        stopStream: engineStopStream,
        pinProduct: enginePinProduct,
        sendChatMessage: engineSendChat,
        setSocket: engineSetSocket,
        connect: engineConnect,
        disconnect: engineDisconnect,
        uploadAudio: engineUploadAudio,
        playAudio: enginePlayAudio,
        stopAudio: engineStopAudio,
        isRecording,
        recordingDuration,
        startRecording: engineStartRecording,
        stopRecording: engineStartStopRecording,
    } = useEngines();

    const { toast } = useToast();
    const [queuedToast, setQueuedToast] = useState<{ title: string; description?: string; variant?: any } | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const previewVideoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Theme (global)
    const { theme, toggleTheme } = useAppTheme();
    const darkMode = theme === "dark";

    // Session state
    const [mode, setMode] = useState<Mode>("lobby");
    const [lobbyPage, setLobbyPage] = useState<"home" | "videos" | "campaigns" | "profile" | "settings" | "more">("home");
    const [preLiveMode, setPreLiveMode] = useState(false);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isLivePaused, setIsLivePaused] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isDemoMode, setIsDemoMode] = useState(false);

    // More page state
    const [ordersOpen, setOrdersOpen] = useState(false);
    const [earningsOpen, setEarningsOpen] = useState(false);
    const [audienceOpen, setAudienceOpen] = useState(false);
    const [messagesOpen, setMessagesOpen] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);

    // Media state
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
    const [screenShareOn, setScreenShareOn] = useState(false);
    const [activeFilter, setActiveFilter] = useState("none");
    const [recordPreviewFilter, setRecordPreviewFilter] = useState<string | null>(null);
    const [activeFilterCategory, setActiveFilterCategory] = useState<FilterCategory | null>(null);
    const [filterIntensity, setFilterIntensity] = useState(100);
    const [captionsOn, setCaptionsOn] = useState(false);
    const [transcriptionOn, setTranscriptionOn] = useState(false);
    const [transcript, setTranscript] = useState("");

    // Stats
    const [viewerCount, setViewerCount] = useState(0);
    const [heartCount, setHeartCount] = useState(0);
    const [liveSeconds, setLiveSeconds] = useState(0);
    const [viewers, setViewers] = useState<LiveViewer[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
    const [salesEvents, setSalesEvents] = useState<SaleEvent[]>([]);
    const [aiHints, setAiHints] = useState<AiHint[]>([]);
    const [qaItems, setQaItems] = useState<QaItem[]>([]);
    const [audioRequests, setAudioRequests] = useState<AudioRequest[]>([]);
    const [currentSpeaker, setCurrentSpeaker] = useState<CurrentSpeaker | null>(null);

    // Commerce
    const [products, setProducts] = useState<Product[]>([]);
    const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
    const [salesCount, setSalesCount] = useState(0);
    const [last5MinSales, setLast5MinSales] = useState(0);
    const [buyers, setBuyers] = useState<BuyerAgent[]>([]);
    const [flash, setFlash] = useState<FlashDealState>({
        active: false, discountPct: 0, endsAt: null, totalSeconds: 0, secondsLeft: 0, productId: null,
    });
    // Commerce power features
    const [salesGoal, setSalesGoal] = useState(500);
    const [cartEvents, setCartEvents] = useState<any[]>([]);
    const [showPinnedProduct, setShowPinnedProduct] = useState(true);

    // Multi-guest / LIVE Together (simulated)
    const [guestRequests, setGuestRequests] = useState<LiveGuestRequest[]>([]);
    const [liveGuests, setLiveGuests] = useState<LiveGuest[]>([]);
    const [guestLayout, setGuestLayout] = useState<LiveGuestLayout>("panel");
    const [pinnedGuestId, setPinnedGuestId] = useState<string | null>(null);
    const maxGuestsOnStage = 5;

    // UI state
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [flashConfigOpen, setFlashConfigOpen] = useState(false);
    const [simulate, setSimulate] = useState(true);

    // New sheet states
    const [sourcesOpen, setSourcesOpen] = useState(false);
    const [scenesOpen, setScenesOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [pollsOpen, setPollsOpen] = useState(false);
    const [giveawaysOpen, setGiveawaysOpen] = useState(false);
    const [multiCamOpen, setMultiCamOpen] = useState(false);
    const [teleprompterSheetOpen, setTeleprompterSheetOpen] = useState(false);
    const [activePrompterSession, setActivePrompterSession] = useState<CampaignSession | null>(null);
    const [productFormOpen, setProductFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [currentNotification, setCurrentNotification] = useState<LiveNotificationEvent | null>(null);

    // On-screen overlay elements (text/alerts) for mobile live
    const [overlayElements, setOverlayElements] = useState<MobileOverlayElement[]>([]);
    const [overlaySheetOpen, setOverlaySheetOpen] = useState(false);
    const [overlaySheetFocusId, setOverlaySheetFocusId] = useState<string | null>(null);

    // Sources state
    const [sources, setSources] = useState([
        { id: "cam1", name: "Main Camera", type: "camera", icon: "videocam", active: true, visible: true },
    ]);

    // Scenes state
    const [activeSceneId, setActiveSceneId] = useState("main");

    // Settings state
    const [videoQuality, setVideoQuality] = useState("720p30");
    const [audioBitrate, setAudioBitrate] = useState("128");
    const [mirrorVideo, setMirrorVideo] = useState(true);

    // Polls state
    const [polls, setPolls] = useState<any[]>([]);

    // Giveaways state
    const [giveaways, setGiveaways] = useState<any[]>([]);

    // Campaigns state
    const [campaigns, setCampaigns] = useState<Campaign[]>([
        {
            id: uid("camp"),
            name: "Summer Sale Event",
            description: "Main summer promotional campaign",
            sessions: [
                {
                    id: uid("sess"),
                    name: "Morning Session",
                    description: "9AM - 12PM",
                    duration: 10800,
                    scriptCues: [
                        { id: "cue-1", text: "Welcome + short intro. Tell them who you are!" },
                        { id: "cue-2", text: "Explain key benefits clearly. Focus on the durability." },
                        { id: "cue-3", text: "Mention flash deal and show the timer on screen." },
                        { id: "cue-4", text: "Answer 2 top questions from current chat." },
                        { id: "cue-5", text: "Recommend the best summer bundle for value." },
                    ],
                    runOfShow: []
                },
                { id: uid("sess"), name: "Afternoon Session", description: "2PM - 5PM", duration: 10800, scriptCues: [], runOfShow: [] },
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

    // Cameras state
    const [cameras] = useState([
        { id: "front", label: "Front Camera", facing: "user", active: true },
        { id: "back", label: "Back Camera", facing: "environment", active: false },
    ]);
    const [activeCameraId, setActiveCameraId] = useState("front");

    // Swipe panel state
    const [activePanel, setActivePanel] = useState<"none" | "chat" | "filters" | "commerce" | "cohosts">("none");

    const isLive = mode === "live" && isSessionActive;
    const flashUrgency = useMemo(() => {
        if (!flash.active) return "none";
        return computeUrgency(flash.secondsLeft);
    }, [flash.active, flash.secondsLeft]);

    const liveTimerLabel = useMemo(() => formatHMS(liveSeconds), [liveSeconds]);
    const recordingTimerLabel = useMemo(() => formatHMS(recordingDuration), [recordingDuration]);

    // Mount only once - must match between server and client
    useEffect(() => {
        setIsMounted(true);
        engineConnect();
        return () => engineDisconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Avoid "setState while rendering a different component" warnings by dispatching toast after commit.
    useEffect(() => {
        if (!queuedToast) return;
        toast(queuedToast);
        setQueuedToast(null);
    }, [queuedToast, toast]);

    // Note: theme class is managed globally by ThemeProvider.

    // Placeholder video URL (Pexels - Woman showing ingredients)
    const PLACEHOLDER_VIDEO = "https://videos.pexels.com/video-files/6595455/6595455-uhd_1440_2560_30fps.mp4";

    // Initialize camera - falls back to placeholder video if camera unavailable
    useEffect(() => {
        if (!isMounted) return;
        const initCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
                    audio: true,
                });
                streamRef.current = stream;
                console.log("[MobileStudio] Camera stream obtained, setting on video element");
                // Set stream on preview video element
                if (previewVideoRef.current) {
                    previewVideoRef.current.srcObject = stream;
                    previewVideoRef.current.play().catch(e => console.log("[MobileStudio] Play error:", e));
                }
                setHasCameraPermission(true);
                console.log("[MobileStudio] Camera initialized successfully");
            } catch (err: any) {
                console.log("[MobileStudio] Camera not available, using placeholder video");
                // Use placeholder video instead of showing error
                if (previewVideoRef.current) {
                    previewVideoRef.current.srcObject = null;
                    previewVideoRef.current.src = PLACEHOLDER_VIDEO;
                    previewVideoRef.current.loop = true;
                    previewVideoRef.current.muted = true;
                    previewVideoRef.current.play().catch(e => console.log("[MobileStudio] Placeholder play error:", e));
                }
                setHasCameraPermission(true);
                setIsDemoMode(true);
            }
        };
        // Small delay to ensure video element is mounted
        const timer = setTimeout(initCamera, 100);
        return () => {
            clearTimeout(timer);
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, [isMounted]);

    // Attach the already-acquired stream to the preview <video> whenever the preview layer mounts.
    // (The camera stream is initialized while we are still in "lobby", where the preview <video> isn't rendered yet.)
    useEffect(() => {
        if (!isMounted) return;
        if (mode === "lobby" || preLiveMode) return;
        const el = previewVideoRef.current;
        if (!el) return;

        const stream = streamRef.current;
        if (stream && el.srcObject !== stream) {
            el.srcObject = stream;
            el.play().catch(() => { });
        } else if (!stream && el.src) {
            el.play().catch(() => { });
        }
    }, [isMounted, mode, preLiveMode]);

    // Initialize data - NO co-hosts by default
    useEffect(() => {
        if (!isMounted) return;
        setProducts(INITIAL_PRODUCTS);
        setHighlightedProductId(INITIAL_PRODUCTS[0]?.id ?? null);
        setViewerCount(842);
        setSalesCount(37);
        setLast5MinSales(5);
        setViewers(createInitialViewers());
        setChatMessages([
            { id: uid("m"), from: "System", body: "Welcome to Live Dealz!", time: nowTimeLabel(), system: true, langTag: "System" },
        ]);
        setBuyers(INITIAL_BUYERS.map(b => ({ ...b, lastActionAt: Date.now() })));
        setGuestRequests([]);
        setLiveGuests([]);
    }, [isMounted]);

    // Live timer
    useEffect(() => {
        if (!isLive) return;
        const interval = setInterval(() => setLiveSeconds(v => v + 1), 1000);
        return () => clearInterval(interval);
    }, [isLive]);

    // Heart animation
    useEffect(() => {
        if (!isLive || !simulate) return;
        const interval = setInterval(() => {
            if (Math.random() > 0.4) setHeartCount(v => v + Math.floor(Math.random() * 4) + 1);
        }, 800);
        return () => clearInterval(interval);
    }, [isLive, simulate]);

    // Chat simulation
    useEffect(() => {
        if (!isLive || !simulate) return;
        const names = ["ShopQueen", "DealHunter", "SavvyShopper", "LiveLover", "BargainBoss", "TrendTracker", "SmartBuyer"];
        const msgs = ["Love this! 🔥", "What's the price??", "Adding to cart! 🛒", "Best deal ever!", "Take my money! 💰", "Is shipping free?", "This is amazing 😍"];
        const interval = setInterval(() => {
            const msg: ChatMsg = {
                id: uid("m"),
                from: names[Math.floor(Math.random() * names.length)],
                body: msgs[Math.floor(Math.random() * msgs.length)],
                time: nowTimeLabel(),
                langTag: Math.random() > 0.7 ? ["ES", "FR", "DE", "PT"][Math.floor(Math.random() * 4)] : undefined,
            };
            setChatMessages(prev => [...prev, msg].slice(-50));
        }, 1400);
        return () => clearInterval(interval);
    }, [isLive, simulate]);

    // Simulate viewers requesting to join (TikTok-like)
    useEffect(() => {
        if (!isLive || !simulate) return;
        const names = ["Amina", "Brian", "Cynthia", "David", "Esther", "Felix", "Grace", "Hassan", "Ivy", "James"];
        const interval = setInterval(() => {
            if (Math.random() < 0.65) return;
            const name = `${names[Math.floor(Math.random() * names.length)]}${Math.floor(Math.random() * 99)}`;
            const id = uid("req");
            setGuestRequests((prev) => {
                if (prev.length >= 8) return prev;
                return [{ id, name, requestedAt: Date.now() }, ...prev];
            });
        }, 9000);
        return () => clearInterval(interval);
    }, [isLive, simulate]);

    // Viewer simulation
    useEffect(() => {
        if (!isLive || !simulate) return;
        const interval = setInterval(() => {
            setViewerCount(v => Math.max(0, v + Math.floor(Math.random() * 7) - 3));
        }, 3000);
        return () => clearInterval(interval);
    }, [isLive, simulate]);

    // Sale simulation
    useEffect(() => {
        if (!isLive || !simulate) return;
        const interval = setInterval(() => {
            if (Math.random() > 0.6) {
                setSalesCount(v => v + 1);
                setLast5MinSales(v => v + 1);
                const product = products[Math.floor(Math.random() * products.length)];
                if (product) {
                    const buyerName = ["ShopQueen", "DealHunter", "SavvyShopper"][Math.floor(Math.random() * 3)];
                    setSalesEvents(prev => [...prev, {
                        id: uid("s"),
                        label: `${buyerName} bought ${product.name}`,
                        time: nowTimeLabel(),
                        amount: `$${product.basePrice.toFixed(2)}`,
                    }].slice(-20));
                    // Add cart notification
                    const isPurchase = Math.random() > 0.3;
                    setCartEvents(prev => [...prev, createCartEvent(
                        buyerName,
                        product.name,
                        isPurchase ? "purchase" : "cart",
                        `$${product.basePrice.toFixed(2)}`
                    )].slice(-5));
                    // Clear old cart events
                    setTimeout(() => {
                        setCartEvents(prev => prev.slice(-3));
                    }, 3500);
                }
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [isLive, simulate, products]);

    /**
     * Auto-Hype: Spawns reactions periodically when the session is active
     * to simulate viewer engagement (Whatnot/TikTok Style).
     */
    useEffect(() => {
        if (!isSessionActive) return;

        const spawn = () => {
            setHeartCount(v => v + 1);
            // Random delay between 400ms and 2500ms
            const delay = Math.random() * 2100 + 400;
            timer = setTimeout(spawn, delay);
        };

        let timer = setTimeout(spawn, 1000);
        return () => clearTimeout(timer);
    }, [isSessionActive]);

    /**
     * High-Stakes Hype: Bursts of reactions during flash deals
     */
    useEffect(() => {
        if (flash.active && flash.secondsLeft > 0) {
            // Spawn a burst of 3-5 reactions every few seconds
            const burstInterval = setInterval(() => {
                const burstSize = Math.floor(Math.random() * 3) + 3;
                for (let i = 0; i < burstSize; i++) {
                    setTimeout(() => setHeartCount(v => v + 1), i * 150);
                }
            }, 3000);
            return () => clearInterval(burstInterval);
        }
    }, [flash.active, flash.secondsLeft > 0]); // Trigger when flash active state changes

    /**
     * Social Proof Simulator: Randomly spawns "Added to Cart" or "Purchased" notifications
     */
    useEffect(() => {
        if (!isSessionActive) return;

        const spawnNotification = () => {
            const buyers = ["Sarah J.", "Mike L.", "Emma W.", "John D.", "Liam K.", "Olivia R."];
            const productsInFeed = products.slice(0, 5);
            const randomBuyer = buyers[Math.floor(Math.random() * buyers.length)];
            const randomProduct = productsInFeed[Math.floor(Math.random() * productsInFeed.length)];
            const isPurchase = Math.random() > 0.7;

            const newEvent: LiveNotificationEvent = {
                id: uid("notif"),
                type: isPurchase ? "purchase" : "cart",
                userNode: <span className="text-[#f77f00]">{randomBuyer}</span>,
                message: isPurchase 
                    ? `just purchased ${randomProduct?.name || "an item"}` 
                    : `added ${randomProduct?.name || "an item"} to cart`,
                duration: 4000
            };

            setCurrentNotification(newEvent);

            // Schedule next notification (8-20 seconds)
            const nextDelay = Math.random() * 12000 + 8000;
            timer = setTimeout(spawnNotification, nextDelay);
        };

        let timer = setTimeout(spawnNotification, 5000); // Start after 5 seconds
        return () => clearTimeout(timer);
    }, [isSessionActive, products]);

    // LIVE Together handlers (simulated, no WebRTC)
    const handleInviteGuest = useCallback((name: string) => {
        const newGuest: LiveGuest = {
            id: uid("g"),
            name,
            status: "invited",
            isOnStage: false,
            isMuted: false,
            videoOn: true,
        };
        setLiveGuests((prev) => [newGuest, ...prev]);
        setQueuedToast({ title: "Invite sent", description: `Invited ${name} to join` });

        // Simulate acceptance + connection
        setTimeout(() => {
            setLiveGuests((prev) => prev.map((g) => (g.id === newGuest.id ? { ...g, status: "connecting" } : g)));
        }, 900 + Math.random() * 800);
        setTimeout(() => {
            setLiveGuests((prev) => prev.map((g) => (g.id === newGuest.id ? { ...g, status: "joined" } : g)));
            setQueuedToast({ title: "Guest joined", description: `${name} is in the room` });
        }, 2200 + Math.random() * 1600);
    }, []);

    const handleCancelInvite = useCallback((guestId: string) => {
        setLiveGuests((prev) => prev.filter((g) => g.id !== guestId));
    }, []);

    const handleKickGuest = useCallback((guestId: string) => {
        setLiveGuests((prev) => prev.filter((g) => g.id !== guestId));
        setPinnedGuestId((p) => (p === guestId ? null : p));
        setQueuedToast({ title: "Guest removed" });
    }, []);

    const handleToggleGuestStage = useCallback((guestId: string) => {
        setLiveGuests((prev) => {
            const onStageCount = prev.filter((g) => g.isOnStage).length;
            return prev.map((g) => {
                if (g.id !== guestId) return g;
                if (!g.isOnStage && onStageCount >= maxGuestsOnStage) return g;
                return { ...g, isOnStage: !g.isOnStage };
            });
        });
    }, [maxGuestsOnStage]);

    const handleToggleGuestMute = useCallback((guestId: string) => {
        setLiveGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, isMuted: !g.isMuted } : g)));
    }, []);

    const handleToggleGuestVideo = useCallback((guestId: string) => {
        setLiveGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, videoOn: !g.videoOn } : g)));
    }, []);

    const handleAcceptGuestRequest = useCallback((requestId: string) => {
        const req = guestRequests.find((r) => r.id === requestId);
        if (!req) return;
        
        const newGuest: LiveGuest = {
            id: uid("g"),
            name: req.name,
            status: "joined",
            isOnStage: true,
            isMuted: false,
            videoOn: true,
        };
        
        setLiveGuests((gprev) => [newGuest, ...gprev]);
        setGuestRequests((prev) => prev.filter((r) => r.id !== requestId));
        setQueuedToast({ title: "Request accepted", description: `${req.name} joined` });
    }, [guestRequests]);

    const handleDeclineGuestRequest = useCallback((requestId: string) => {
        setGuestRequests((prev) => prev.filter((r) => r.id !== requestId));
    }, []);

    // Camera flip handler
    const handleFlipCamera = useCallback(async () => {
        const newFacing = cameraFacing === "user" ? "environment" : "user";
        setCameraFacing(newFacing);
        try {
            // Stop current stream
            streamRef.current?.getTracks().forEach(t => t.stop());
            // Get new stream with flipped camera
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: newFacing, width: { ideal: 720 }, height: { ideal: 1280 } },
                audio: true,
            });
            streamRef.current = stream;
            if (previewVideoRef.current) {
                previewVideoRef.current.srcObject = stream;
                previewVideoRef.current.play().catch(() => { });
            }
        } catch (err) {
            console.error("[MobileStudio] Failed to flip camera:", err);
            // Revert on failure
            setCameraFacing(cameraFacing);
        }
    }, [cameraFacing]);

    // Mode change handler - ONLY changes mode, does NOT auto-start
    const handleModeChange = useCallback((newMode: Mode) => {
        setMode(newMode);
        setRecordPreviewFilter(null);
        setIsLivePaused(false);
        // If switching modes while active, stop current session
        if (isSessionActive) {
            setIsSessionActive(false);
            toast({ title: "Session stopped", description: `Switched to ${newMode} mode` });
        }
    }, [isSessionActive, toast]);

    // Play button handler - starts session based on current mode
    const handlePlayButton = useCallback(async () => {
        if (isSessionActive || isRecording) {
            // Stop current session
            if (isRecording) {
                const blob = await engineStartStopRecording();
                if (blob) {
                   // Auto download
                   const url = URL.createObjectURL(blob);
                   const a = document.createElement("a");
                   a.href = url;
                   a.download = `recording-${Date.now()}.webm`;
                   a.click();
                   URL.revokeObjectURL(url);
                   toast({ title: "Recording Saved", description: "Your video has been downloaded." });
                }
            }
            setIsSessionActive(false);
            setIsLivePaused(false);
            toast({ title: "Session Ended" });
        } else {
            // Start session based on current mode
            if (mode === "live") {
                setIsSessionActive(true);
                setIsLivePaused(false);
                setLiveSeconds(0);
                toast({ title: "You are Live!", description: "Broadcasting to viewers" });
            } else if (mode === "record") {
                setRecordPreviewFilter(null);
                const success = await engineStartRecording();
                if (success) {
                   setIsSessionActive(true);
                   toast({ title: "Recording Started", description: "Recording locally" });
                } else {
                   toast({ title: "Recording Failed", variant: "destructive" });
                }
            } else {
                setIsSessionActive(true);
                toast({ title: "Rehearsal Started", description: "Practice mode active" });
            }
        }
    }, [isSessionActive, isRecording, mode, engineStartRecording, engineStartStopRecording, toast]);

    const recordStartInFlight = useRef(false);

    const handleStartRecord = useCallback(async () => {
        if (recordStartInFlight.current) return;
        if (isSessionActive || isRecording) return;
        if (mode !== "record") return;

        recordStartInFlight.current = true;
        try {
            setRecordPreviewFilter(null);
            const success = await engineStartRecording();
            if (success) {
                setIsSessionActive(true);
                toast({ title: "Recording Started", description: "Recording locally" });
            } else {
                toast({ title: "Recording Failed", variant: "destructive" });
            }
        } finally {
            recordStartInFlight.current = false;
        }
    }, [engineStartRecording, isRecording, isSessionActive, mode, toast]);

    const handleStopRecord = useCallback(async () => {
        if (mode !== "record") return;

        const blob = await engineStartStopRecording();
        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `recording-${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            toast({ title: "Recording Saved", description: "Your video has been downloaded." });
        }
        setIsSessionActive(false);
    }, [engineStartStopRecording, mode, toast]);

    const handleToggleMic = useCallback(() => {
        const next = !micOn;
        setMicOn(next);
        if (streamRef.current) {
            const livePaused = mode === "live" && isSessionActive && isLivePaused;
            streamRef.current.getAudioTracks().forEach((t) => (t.enabled = next && !livePaused));
        }
    }, [isLivePaused, isSessionActive, micOn, mode]);

    const handleToggleLivePause = useCallback(() => {
        if (mode !== "live" || !isSessionActive) return;

        setIsLivePaused((prev) => {
            const next = !prev;
            if (streamRef.current) {
                streamRef.current.getVideoTracks().forEach((t) => (t.enabled = !next));
                streamRef.current.getAudioTracks().forEach((t) => (t.enabled = !next && micOn));
            }
            return next;
        });
    }, [isSessionActive, micOn, mode]);

    const handleEndLiveAndExit = useCallback(() => {
        if (mode !== "live") {
            setMode("lobby");
            return;
        }

        if (isSessionActive) {
            setIsSessionActive(false);
            toast({ title: "Live ended" });
        }

        setIsLivePaused(false);
        if (streamRef.current) {
            streamRef.current.getVideoTracks().forEach((t) => (t.enabled = true));
            streamRef.current.getAudioTracks().forEach((t) => (t.enabled = micOn));
        }
        setMode("lobby");
    }, [isSessionActive, micOn, mode, toast]);

    const handleSendLiveMessage = useCallback((body: string) => {
        const message = body.trim();
        if (!message) return;
        const msg: ChatMsg = {
            id: uid("m"),
            from: "Host",
            body: message,
            time: nowTimeLabel(),
        };
        setChatMessages(prev => [...prev, msg].slice(-50));
    }, []);

    const handleToggleCam = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getVideoTracks().forEach(t => t.enabled = !t.enabled);
        }
        setCamOn(v => !v);
    }, []);

    const handleEndLive = useCallback(() => {
        if (isLive) {
            setIsSessionActive(false);
            setMode("rehearsal");
        }
    }, [isLive]);

    const handleSelectProduct = useCallback((id: string) => {
        setHighlightedProductId(id);
        enginePinProduct(id);
        toast({ title: "Product Pinned", description: "Visible to all viewers" });
    }, [enginePinProduct, toast]);

    const handleStopFlashDeal = useCallback(() => {
        stopFlash();
        setFlash(prev => ({ ...prev, active: false }));
        toast({ title: "Flash Deal Stopped" });
    }, [stopFlash, toast]);

    const handleOpenTool = useCallback((tool: "polls" | "giveaways" | "cohosts" | "multicam" | "filters") => {
        setSettingsOpen(false); // Close settings first
        setTimeout(() => {
            switch (tool) {
                case "polls": setPollsOpen(true); break;
                case "giveaways": setGiveawaysOpen(true); break;
                case "cohosts": setActivePanel("cohosts"); break;
                case "multicam": setMultiCamOpen(true); break;
                case "filters": setFiltersOpen(true); break;
            }
        }, 300);
    }, []);


    if (!isMounted) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center gap-6" suppressHydrationWarning>
                <img
                    src="/assets/logos/evlogovert.png"
                    alt="LiveDealz"
                    className="w-16 h-24 object-contain animate-pulse"
                />
                <div className="flex items-center gap-2">
                    <Spinner className="h-4 w-4 text-[#FF5C00]" />
                    <p className="text-slate-400 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <MobileErrorBoundary>
        <div 
            className={`fixed inset-0 ${darkMode ? "bg-black" : "bg-white"} overflow-hidden touch-none`} 
            style={{ height: '100dvh' }}
            suppressHydrationWarning 
            aria-label="mobile-studio"
        >
            {/* Camera/Video preview - visible layer on top - hidden in lobby/prelive modes */}
            {mode !== "lobby" && !preLiveMode && (
            <div className="absolute inset-0 z-[1] bg-gradient-to-br from-slate-900 to-slate-800">
                <video
                    ref={previewVideoRef}
                    className="absolute inset-0 w-full h-full object-cover bg-black"
                    style={{
                        filter: getRecordEffectCssFilter(
                            mode === "record" ? (recordPreviewFilter ?? activeFilter) : activeFilter,
                            filterIntensity
                        ),
                    }}
                    autoPlay
                    playsInline
                    muted
                    loop
                    controls={false}
                    preload="auto"
                />
                {/* No UI backgrounds on Live: keep feed fully clear */}
                {mode !== "live" && (
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
                )}
                {/* Camera indicator */}
                {!camOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <div className="text-center">
                            <span className="material-icons text-white/40 text-5xl">videocam_off</span>
                            <p className="text-white/60 text-sm mt-2">Camera Off</p>
                        </div>
                    </div>
                )}
            </div>
            )}

            {/* Floating overlay layer */}
            <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between">
                {/* Mode-Specific HUD UI */}
                {mode === "lobby" && !preLiveMode && (
                    <div className="pointer-events-auto">
                        <MobileHomePage
                            hostName="Studio Host"
                            storeHandle="yourstore"
                            activeTab={lobbyPage}
                            onGoToPreLive={() => setPreLiveMode(true)}
                            onStartRecording={() => {
                                setMode("record");
                            }}
                            onStartRehearsal={() => {
                                setMode("rehearsal");
                            }}
                            onOpenCampaigns={() => setLobbyPage("campaigns")}
                            onOpenProducts={() => setActivePanel("commerce")}
                            onOpenSettings={() => setLobbyPage("settings")}
                            onOpenAnalytics={() => {
                                toast({ title: "Analytics", description: "View your performance metrics" });
                            }}
                            onGoHome={() => setLobbyPage("home")}
                            onOpenVideos={() => setLobbyPage("videos")}
                            onOpenProfile={() => setLobbyPage("profile")}
                            onOpenMore={() => setLobbyPage("more")}
                            darkMode={darkMode}
                        />
                    </div>
                )}

                {mode === "lobby" && lobbyPage === "videos" && (
                    <div className="pointer-events-auto">
                        <VideosPage
                            onGoBack={() => setLobbyPage("home")}
                            onOpenSettings={() => setSettingsOpen(true)}
                            darkMode={darkMode}
                        />
                    </div>
                )}

                {mode === "lobby" && lobbyPage === "campaigns" && (
                    <div className="pointer-events-auto">
                        <CampaignsPage
                            onGoBack={() => setLobbyPage("home")}
                            onOpenSettings={() => setSettingsOpen(true)}
                            darkMode={darkMode}
                        />
                    </div>
                )}

                {mode === "lobby" && lobbyPage === "profile" && (
                    <div className="pointer-events-auto">
                        <ProfilePage
                            onGoBack={() => setLobbyPage("home")}
                            onOpenSettings={() => setSettingsOpen(true)}
                            storeHandle="yourstore"
                            darkMode={darkMode}
                        />
                    </div>
                )}

                {mode === "lobby" && lobbyPage === "settings" && (
                    <div className="pointer-events-auto">
                        <SettingsPage
                            onGoBack={() => setLobbyPage("home")}
                            onOpenSettings={() => setSettingsOpen(true)}
                            darkMode={darkMode}
                        />
                    </div>
                )}

                {mode === "lobby" && lobbyPage === "more" && (
                    <div className="pointer-events-auto">
                        <MorePage
                            onGoBack={() => setLobbyPage("home")}
                            onOpenAnalytics={() => toast({ title: "Analytics", description: "View your performance metrics" })}
                            onOpenProducts={() => setActivePanel("commerce")}
                            onOpenOrders={() => toast({ title: "Orders", description: "View customer orders" })}
                            onOpenEarnings={() => setEarningsOpen(true)}
                            onOpenAudience={() => setAudienceOpen(true)}
                            onOpenMessages={() => setMessagesOpen(true)}
                            onOpenTranslations={() => {}}
                            onOpenSoundLibrary={() => {}}
                            onOpenBackgrounds={() => {}}
                            onOpenStickers={() => {}}
                            darkMode={darkMode}
                        />
                    </div>
                )}

                {preLiveMode && (
                    <div className="pointer-events-auto">
                        <PreLivePage
                            hostName="Studio Host"
                            storeHandle="yourstore"
                            followerCount={12500}
                            onGoLive={() => {
                                setPreLiveMode(false);
                                setMode("live");
                                setIsLivePaused(false);
                                setIsSessionActive(true);
                                setLiveSeconds(0);
                                toast({ title: "You are Live!", description: "Broadcasting to viewers" });
                            }}
                            onOpenProducts={() => setActivePanel("commerce")}
                            onOpenCampaigns={() => setLobbyPage("campaigns")}
                            onOpenAnalytics={() => {
                                toast({ title: "Analytics", description: "View your performance metrics" });
                            }}
                            onOpenSettings={() => setSettingsOpen(true)}
                            onFlipCamera={handleFlipCamera}
                            onGoBack={() => setPreLiveMode(false)}
                            darkMode={darkMode}
                        />
                    </div>
                )}

                {/* HUDs - hidden in lobby mode */}
                {mode !== "lobby" && !preLiveMode && (
                <>
                {mode === "live" ? (
                    <div className="pointer-events-auto">
                        <MobileLiveHUD
                            hostName="Studio Host"
                            viewerCount={viewerCount}
                            liveTimerLabel={liveTimerLabel}
                            onEndLive={handleEndLiveAndExit}
                            onModeChange={handleModeChange}
                            onSendMessage={handleSendLiveMessage}
                            isLiveActive={isLive}
                            isPaused={isLivePaused}
                            onTogglePause={handleToggleLivePause}
                            onOpenGuests={() => setActivePanel("cohosts")}
                            cameraFacing={cameraFacing}
                            onFlipCamera={handleFlipCamera}
                            micOn={micOn}
                            onToggleMic={handleToggleMic}
                            stream={streamRef.current}
                            onOpenSettings={() => setSettingsOpen(true)}
                            onOpenCommerce={() => setActivePanel("commerce")}
                            onOpenFilters={() => setFiltersOpen(true)}
                            onOpenElements={() => setOverlaySheetOpen(true)}
                            onSendReaction={() => setHeartCount(prev => prev + 1)}
                            productCount={products.length}
                            isChatOpen={activePanel === "chat"}
                            onToggleChat={(open: boolean) => setActivePanel(open ? "chat" : "none")}
                            currentNotification={currentNotification}
                            onNotificationComplete={() => setCurrentNotification(null)}
                            triggerHeartCount={heartCount}
                            salesGoal={salesGoal}
                            salesCount={salesCount}
                            cartEvents={cartEvents}
                            darkMode={darkMode}
                        />
                    </div>
                ) : mode === "record" ? (
                    <div className="pointer-events-auto">
                        <RecordPage
                            hostName="Studio Host"
                            isRecording={isSessionActive}
                            recordingTime={recordingTimerLabel}
                            micOn={micOn}
                            activeFilter={activeFilter}
                            previewFilter={recordPreviewFilter}
                            onFlipCamera={handleFlipCamera}
                            onToggleMic={handleToggleMic}
                            onStartRecording={handleStartRecord}
                            onStopRecording={handleStopRecord}
                            onPreviewFilter={(filter) => setRecordPreviewFilter(filter)}
                            onClearPreviewFilter={() => setRecordPreviewFilter(null)}
                            onSelectFilter={(filter) => {
                                setActiveFilter(filter);
                                setRecordPreviewFilter(null);
                            }}
                            onGoBack={() => setMode("lobby")}
                            darkMode={darkMode}
                        />
                    </div>
                ) : (
                    <div className="pointer-events-auto">
                        <MobileRehearsalHUD
                            hostName="Studio Host"
                            mode={mode}
                            onEndLive={handlePlayButton}
                            onModeChange={handleModeChange}
                            cameraFacing={cameraFacing}
                            onFlipCamera={handleFlipCamera}
                            micOn={micOn}
                            onToggleMic={() => setMicOn(!micOn)}
                            stream={streamRef.current}
                            onOpenSettings={() => setSettingsOpen(true)}
                            onOpenCommerce={() => setActivePanel("commerce")}
                            onOpenCampaigns={() => setTeleprompterSheetOpen(true)}
                            onSendReaction={() => setHeartCount(prev => prev + 1)}
                            productCount={products.length}
                            darkMode={darkMode}
                        />
                    </div>
                )}
                </>)}

                {/* Center area - chat bubbles - hidden in lobby */}
                {isLive && (
                <div className="flex-1 relative pointer-events-none">
                    {/* Guest stage overlay (LIVE Together) */}
                    <LiveGuestsOverlay
                        guests={liveGuests}
                        layout={guestLayout}
                        pinnedGuestId={pinnedGuestId}
                        onPin={setPinnedGuestId}
                        maxGuests={maxGuestsOnStage}
                        onOpenCoHosts={() => setActivePanel("cohosts")}
                        darkMode={darkMode}
                    />

                    {/* Overlay elements (draggable text/alerts) */}
                    <MobileOverlayElementsLayer
                        elements={overlayElements}
                        onChange={(id, patch) => {
                            setOverlayElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...patch } : el)));
                        }}
                        onRequestEdit={(id) => {
                            setOverlaySheetOpen(true);
                            setOverlaySheetFocusId(id);
                            // Bring edited element to front
                            setOverlayElements((prev) => {
                                const idx = prev.findIndex((e) => e.id === id);
                                if (idx < 0) return prev;
                                const el = prev[idx];
                                return [el, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
                            });
                        }}
                    />
                    {/* Chat bubbles - left side, bottom aligned */}
                    <div className="absolute bottom-20 left-0">
                        <MobileLiveChat
                            messages={chatMessages}
                            mode={mode}
                            isEnabled={true}
                            variant="tiktok"
                            maxVisible={6}
                        />
                    </div>
                </div>
                )}

                {/* Product overlays removed for now (they were covering core Live UI). */}

                {/* Bottom nav - hidden in lobby/record/live/prelive */}
                {mode !== "lobby" && mode !== "record" && mode !== "live" && !preLiveMode && (
                <MobileBottomNav
                    mode={mode}
                    isSessionActive={isSessionActive}
                    darkMode={darkMode}
                    onToggleLive={handlePlayButton}
                    onOpenSources={() => setSourcesOpen(true)}
                    onOpenScenes={() => setScenesOpen(true)}
                    onOpenSettings={() => setSettingsOpen(true)}
                    onOpenCampaigns={() => setTeleprompterSheetOpen(true)}
                />
                )}
            </div>

            {/* Teleprompter Overlay */}
            {activePrompterSession && (
                <MobileTeleprompterOverlay
                    session={activePrompterSession}
                    isRecording={isSessionActive}
                    onClose={() => setActivePrompterSession(null)}
                    darkMode={darkMode}
                />
            )}

            {/* Filter sheet */}
            <MobileFilterSheet
                isOpen={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                activeFilter={activeFilter}
                onSelectFilter={setActiveFilter}
                intensity={filterIntensity}
                onIntensityChange={setFilterIntensity}
                darkMode={darkMode}
            />

            {/* Overlay elements sheet */}
            <MobileOverlayElementsSheet
                open={overlaySheetOpen}
                focusId={overlaySheetFocusId}
                onClose={() => {
                    setOverlaySheetOpen(false);
                    setOverlaySheetFocusId(null);
                }}
                elements={overlayElements}
                onAdd={(type) => {
                    const id = uid("el");
                    const next: MobileOverlayElement = {
                        id,
                        type,
                        text: type === "text" ? "New text" : "Alert message",
                        tone: type === "alert" ? "info" : undefined,
                        xPct: 0.5,
                        yPct: 0.35,
                    };
                    setOverlayElements((prev) => [next, ...prev]);
                }}
                onUpdate={(id, patch) => setOverlayElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...patch } : el)))}
                onRemove={(id) => setOverlayElements((prev) => prev.filter((el) => el.id !== id))}
                darkMode={darkMode}
            />

            {/* Sources sheet */}
            <MobileSourcesSheet
                isOpen={sourcesOpen}
                onClose={() => setSourcesOpen(false)}
                sources={sources as any}
                onToggleSource={(id) => setSources(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s))}
                onAddSource={(type) => {
                    const newSource = {
                        id: `src_${Date.now()}`,
                        name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${sources.length + 1}`,
                        type,
                        icon: type === "camera" ? "videocam" : type === "screen" ? "screen_share" : type === "image" ? "image" : type === "video" ? "movie" : "mic",
                        active: false,
                        visible: true,
                    };
                    setSources(prev => [...prev, newSource]);
                    toast({ title: "Source Added", description: `${newSource.name} added` });
                }}
                onRemoveSource={(id) => {
                    setSources(prev => prev.filter(s => s.id !== id));
                    // Also remove from engine if it's an audio source
                    engineStopAudio(id);
                }}
                onUploadAudio={async (file) => {
                    const sourceId = await engineUploadAudio(file);
                    if (sourceId) {
                        setSources(prev => [...prev, {
                            id: sourceId,
                            name: file.name,
                            type: "audioFile",
                            icon: "library_music",
                            active: false,
                            visible: true,
                            isPlaying: false
                        }]);
                        toast({ title: "Audio Uploaded", description: file.name });
                    }
                } }
                onPlayAudio={(id) => {
                    enginePlayAudio(id);
                    setSources(prev => prev.map(s => s.id === id ? { ...s, isPlaying: true } : s));
                }}
                onStopAudio={(id) => {
                    engineStopAudio(id);
                    setSources(prev => prev.map(s => s.id === id ? { ...s, isPlaying: false } : s));
                }}
                darkMode={darkMode}
            />

            {/* Teleprompter selection sheet */}
            <MobileTeleprompterSheet
                isOpen={teleprompterSheetOpen}
                onClose={() => setTeleprompterSheetOpen(false)}
                campaigns={campaigns}
                onSelectSession={(session) => {
                    setActivePrompterSession(session);
                    toast({
                        title: "Prompter Loaded",
                        description: `Loaded session: ${session.name}`
                    });
                }}
                darkMode={darkMode}
            />

            {/* Scenes sheet */}
            <MobileScenesSheet
                isOpen={scenesOpen}
                onClose={() => setScenesOpen(false)}
                scenes={[
                    { id: "main", name: "Main Camera", icon: "videocam" },
                    { id: "split", name: "Split Screen", icon: "splitscreen" },
                    { id: "pip", name: "Picture in Picture", icon: "picture_in_picture" },
                    { id: "guest", name: "Guest View", icon: "group" },
                    { id: "product", name: "Product Focus", icon: "shopping_bag" },
                    { id: "screen", name: "Screen Share", icon: "screen_share" },
                ]}
                activeSceneId={activeSceneId}
                onSelectScene={(id) => {
                    setActiveSceneId(id);
                    toast({ title: "Scene Changed", description: `Switched to ${id}` });
                }}
                onAddScene={() => toast({ title: "Add Scene", description: "Coming soon!" })}
                darkMode={darkMode}
            />

            {/* Settings sheet */}
            <MobileSettingsSheet
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                videoQuality={videoQuality}
                onVideoQualityChange={setVideoQuality}
                mirrorVideo={mirrorVideo}
                onMirrorVideoChange={setMirrorVideo}
                audioBitrate={audioBitrate}
                onAudioBitrateChange={setAudioBitrate}
                mode={mode}
                onModeChange={handleModeChange}
                darkMode={darkMode}
                onToggleDarkMode={toggleTheme}
                onOpenTool={handleOpenTool}
            />

            {/* Polls sheet */}
            <MobilePollsSheet
                isOpen={pollsOpen}
                onClose={() => setPollsOpen(false)}
                polls={polls}
                onCreatePoll={(question, options) => {
                    const newPoll = {
                        id: `poll_${Date.now()}`,
                        question,
                        options: options.map((text, i) => ({ id: `opt_${i}`, text, votes: 0 })),
                        isActive: true,
                        totalVotes: 0,
                    };
                    setPolls(prev => [newPoll, ...prev]);
                    toast({ title: "Poll Started", description: question });
                }}
                onEndPoll={(id) => {
                    setPolls(prev => prev.map(p => p.id === id ? { ...p, isActive: false } : p));
                    toast({ title: "Poll Ended" });
                }}
                darkMode={darkMode}
            />

            {/* Giveaways sheet */}
            <MobileGiveawaysSheet
                isOpen={giveawaysOpen}
                onClose={() => setGiveawaysOpen(false)}
                giveaways={giveaways}
                onCreateGiveaway={(prize, winners, duration) => {
                    const newGiveaway = {
                        id: `give_${Date.now()}`,
                        prize,
                        winners,
                        entries: 0,
                        isActive: true,
                        countdown: duration,
                    };
                    setGiveaways(prev => [newGiveaway, ...prev]);
                    toast({ title: "Giveaway Started", description: prize });
                }}
                onEndGiveaway={(id) => {
                    setGiveaways(prev => prev.map(g => g.id === id ? { ...g, isActive: false, winnerNames: ["Winner1"] } : g));
                    toast({ title: "Giveaway Ended" });
                }}
                darkMode={darkMode}
            />

            {/* Multi-cam sheet */}
            <MobileMultiCamSheet
                isOpen={multiCamOpen}
                onClose={() => setMultiCamOpen(false)}
                cameras={cameras as any}
                activeCameraId={activeCameraId}
                onSelectCamera={(id) => {
                    setActiveCameraId(id);
                    const cam = cameras.find(c => c.id === id);
                    if (cam) {
                        setCameraFacing(cam.facing as "user" | "environment");
                        handleFlipCamera();
                    }
                }}
                darkMode={darkMode}
            />

            {/* Slide menu */}
            <MobileSlideMenu
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                filtersOpen={filtersOpen}
                onToggleFilters={() => {
                    setMobileMenuOpen(false);
                    setFiltersOpen(v => !v);
                }}
                onToggleSceneManager={() => setMobileMenuOpen(false)}
                sourcesOpen={false}
                onToggleSources={() => setMobileMenuOpen(false)}
                onToggleAudioMixer={() => setMobileMenuOpen(false)}
                transcriptionOn={transcriptionOn}
                onToggleTranscription={() => {
                    setTranscriptionOn(v => !v);
                    setMobileMenuOpen(false);
                }}
                onToggleCoHosts={() => {
                    setMobileMenuOpen(false);
                    setActivePanel("cohosts");
                }}
                onToggleProduction={() => setMobileMenuOpen(false)}
            />

            {/* Co-hosts panel */}
            {activePanel === "cohosts" && (
                <LiveTogetherSheet
                    open={true}
                    onClose={() => setActivePanel("none")}
                    darkMode={darkMode}
                    requests={guestRequests}
                    onAcceptRequest={handleAcceptGuestRequest}
                    onDeclineRequest={handleDeclineGuestRequest}
                    onSimulateRequest={() => {
                        const name = `Guest${Math.floor(Math.random() * 900 + 100)}`;
                        setGuestRequests((prev) => [{ id: uid("req"), name, requestedAt: Date.now() }, ...prev].slice(0, 8));
                    }}
                    guests={liveGuests}
                    maxGuests={5}
                    onInvite={handleInviteGuest}
                    onCancelInvite={handleCancelInvite}
                    onKick={handleKickGuest}
                    onToggleStage={handleToggleGuestStage}
                    onToggleMute={handleToggleGuestMute}
                    onToggleVideo={handleToggleGuestVideo}
                    layout={guestLayout}
                    onSetLayout={(l) => setGuestLayout(l)}
                    pinnedGuestId={pinnedGuestId}
                    onPin={setPinnedGuestId}
                />
            )}

            {/* Commerce sheet */}
            <MobileCommerceSheet
                isOpen={activePanel === "commerce"}
                onClose={() => setActivePanel("none")}
                products={products}
                salesEvents={salesEvents}
                salesCount={salesCount}
                last5MinSales={last5MinSales}
                flash={flash}
                highlightedProductId={highlightedProductId}
                onSelectProduct={handleSelectProduct}
                onOpenFlashConfig={() => setFlashConfigOpen(true)}
                onStopFlash={handleStopFlashDeal}
                onAddProduct={() => {
                    setEditingProduct(null);
                    setProductFormOpen(true);
                }}
                onEditProduct={(p) => {
                    setEditingProduct(p);
                    setProductFormOpen(true);
                }}
                onDeleteProduct={(id) => {
                    setProducts(prev => prev.filter(p => p.id !== id));
                    if (highlightedProductId === id) setHighlightedProductId(null);
                    toast({ title: "Product Deleted" });
                }}
            />

            {/* Product form sheet */}
            <MobileProductFormSheet
                isOpen={productFormOpen}
                onClose={() => setProductFormOpen(false)}
                product={editingProduct}
                onSave={(data) => {
                    if (editingProduct) {
                        // Update
                        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...data } : p));
                        toast({ title: "Product Updated" });
                    } else {
                        // Add
                        const newProduct = {
                            id: uid("prd"),
                            ...data,
                            currency: "USD",
                        } as Product;
                        setProducts(prev => [...prev, newProduct]);
                        toast({ title: "Product Added", description: newProduct.name });
                    }
                }}
                darkMode={darkMode}
            />

            {/* Flash deal dialog */}
            {flashConfigOpen && (
                <FlashDealDialog
                    onClose={() => setFlashConfigOpen(false)}
                    onStart={(durationMin, discountPct) => {
                        const durationSec = durationMin * 60;
                        setFlash({
                            active: true,
                            discountPct,
                            endsAt: Date.now() + durationSec * 1000,
                            totalSeconds: durationSec,
                            secondsLeft: durationSec,
                            productId: highlightedProductId || products[0]?.id || null,
                        });
                        setFlashConfigOpen(false);
                    }}
                />
            )}
        </div>
        </MobileErrorBoundary>
    );
}
