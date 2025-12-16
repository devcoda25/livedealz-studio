
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * MyLiveDealz Creator Live Studio (clean-code, single-file page)
 * Includes:
 * - Live simulation: sales ticks, chat, AI prompts, Q&A, viewers join/leave
 * - Flash deal: real countdown, urgency banners, discounted pricing
 * - Inventory: real stock numbers; stock hits zero triggers buyer CTAs
 * - Buyer preview: MULTIPLE buyers simulated (per-buyer carts + reminders)
 * - Audio request flow: viewers request mic, host accepts/declines, speaker timer
 * - Production mode: In-app vs OBS/vMix plan (virtual cam/RTMP)
 * - Preview sizing: auto device detect + manual (Auto/Desktop/Mobile)
 * - Expanded preview: modal + true Fullscreen API (double-click toggles)
 *
 * Notes:
 * - Uses Tailwind utility classes and "material-icons" for icons.
 * - Dark mode default for the Studio.
 */

const EV_GREEN = "#03cd8c";
const EV_ORANGE = "#f77f00";

type Mode = "lobby" | "live";
type PreviewMode = "auto" | "desktop" | "mobile";
type AudienceTab = "chat" | "qa" | "viewers";
type ProductionMode = "inapp" | "external";
type ExternalTool = "OBS" | "vMix";
type SourceId = "cam1" | "cam2" | "screen" | "obs" | "vmix";

type ViewerLang = "en" | "fr" | "sw" | "ar" | "pt";
type ListenMode = "original" | "ai_audio" | "ai_captions";

type Product = {
  id: string;
  name: string;
  basePrice: number;
  currency: "USD";
  stock: number;
  tag: string;
};

type BuyerAgent = {
  id: string;
  name: string;
  lang: ViewerLang;
  listenMode: ListenMode;
  carts: Record<string, number>; // productId -> qty
  reminders: Record<string, true>; // productId -> subscribed
  lastAction?: string;
  lastActionAt?: number;
};

type LiveViewer = {
  id: string;
  name: string;
  lang: ViewerLang;
  listenMode: ListenMode;
  joinedAt: number;
};

type ChatMsg = {
  id: string;
  from: string;
  body: string;
  time: string;
  system?: boolean;
  langTag?: string;
};

type SaleEvent = {
  id: string;
  label: string;
  time: string;
  amount?: string;
  langTag?: string;
};

type AiHint = {
  id: string;
  text: string;
  time: string;
  severity: "info" | "opportunity" | "warning";
};

type QaItem = {
  id: string;
  question: string;
  from: string;
  status: "unanswered" | "pinned" | "answered";
  langTag?: string;
  createdAt: number;
};

type AudioRequest = {
  id: string;
  viewerId: string;
  viewerName: string;
  langTag: string;
  time: string;
  status: "pending" | "accepted" | "declined" | "ended";
};

type CurrentSpeaker = {
  requestId: string;
  viewerName: string;
  langTag: string;
  endsAt: number;
};

type FlashDealState = {
  active: boolean;
  discountPct: number;
  endsAt: number | null;
  totalSeconds: number;
  secondsLeft: number;
  productId: string | null; // targeted product
};

const SCENES = [
  { id: "intro", label: "Intro + host", desc: "Single camera" },
  { id: "product", label: "Product close-up", desc: "Hero overlay" },
  { id: "split", label: "Split screen", desc: "Host + product" },
  { id: "offer", label: "Flash offer", desc: "Offer graphic" },
] as const;

type SceneId = (typeof SCENES)[number]["id"];

const INITIAL_PRODUCTS: Product[] = [
  { id: "P-101", name: "GlowUp Serum - 30ml", basePrice: 24, currency: "USD", stock: 18, tag: "Hero product" },
  { id: "P-102", name: "GlowUp Cleanser", basePrice: 14, currency: "USD", stock: 26, tag: "Bundle with serum" },
  { id: "P-103", name: "GlowUp Night Cream", basePrice: 29, currency: "USD", stock: 9, tag: "Upsell after serum" },
];

const INITIAL_BUYERS: BuyerAgent[] = [
  { id: "b1", name: "Buyer A", lang: "fr", listenMode: "ai_audio", carts: {}, reminders: {}, lastAction: "Joined", lastActionAt: Date.now() },
  { id: "b2", name: "Buyer B", lang: "sw", listenMode: "ai_captions", carts: {}, reminders: {}, lastAction: "Browsing", lastActionAt: Date.now() },
  { id: "b3", name: "Buyer C", lang: "ar", listenMode: "ai_audio", carts: {}, reminders: {}, lastAction: "Browsing", lastActionAt: Date.now() },
  { id: "b4", name: "Buyer D", lang: "en", listenMode: "original", carts: {}, reminders: {}, lastAction: "Browsing", lastActionAt: Date.now() },
  { id: "b5", name: "Buyer E", lang: "pt", listenMode: "ai_captions", carts: {}, reminders: {}, lastAction: "Browsing", lastActionAt: Date.now() },
];

// -------------------- helpers --------------------
function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function nowTimeLabel() {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatHMS(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h > 0 ? `${pad2(h)}:${pad2(m)}:${pad2(ss)}` : `${pad2(m)}:${pad2(ss)}`;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fmtMoneyUSD(n: number) {
  return `$${n.toFixed(2)}`;
}

function buyerCartCount(b: BuyerAgent) {
  return Object.values(b.carts).reduce((a, v) => a + v, 0);
}

function buyerReminderCount(b: BuyerAgent) {
  return Object.keys(b.reminders).length;
}

function langTag(lang: ViewerLang, mode: ListenMode) {
  if (mode === "original") return "EN original";
  if (mode === "ai_audio") return `${lang.toUpperCase()} audio`;
  return `${lang.toUpperCase()} captions`;
}

function severityPillClass(sev: AiHint["severity"]) {
  if (sev === "warning") return "border-orange-500/60 text-orange-200 bg-orange-500/10";
  if (sev === "opportunity") return "border-emerald-500/60 text-emerald-200 bg-emerald-500/10";
  return "border-slate-700 text-slate-300 bg-slate-900";
}

function computeUrgency(secondsLeft: number) {
  if (secondsLeft <= 20) return "critical";
  if (secondsLeft <= 60) return "high";
  return "normal";
}

function isMobileUA() {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function useDeviceKind(): "mobile" | "desktop" {
  const [kind, setKind] = useState<"mobile" | "desktop">("desktop");
  useEffect(() => {
    const detect = () => {
      if (typeof window === "undefined") return;
      const small = window.matchMedia("(max-width: 768px)").matches;
      setKind(isMobileUA() || small ? "mobile" : "desktop");
    };
    detect();
    window.addEventListener("resize", detect);
    return () => window.removeEventListener("resize", detect);
  }, []);
  return kind;
}

// Fullscreen helpers (cross-browser)
function requestFullscreen(el: HTMLElement) {
  const anyEl = el as any;
  const doc: any = document as any;
  if (anyEl.requestFullscreen) return anyEl.requestFullscreen();
  if (anyEl.webkitRequestFullscreen) return anyEl.webkitRequestFullscreen();
  if (anyEl.msRequestFullscreen) return anyEl.msRequestFullscreen();
  if (doc?.documentElement?.webkitRequestFullscreen) return doc.documentElement.webkitRequestFullscreen();
  return Promise.resolve();
}

function exitFullscreen() {
  const doc: any = document as any;
  if (doc.exitFullscreen) return doc.exitFullscreen();
  if (doc.webkitExitFullscreen) return doc.webkitExitFullscreen();
  if (doc.msExitFullscreen) return doc.msExitFullscreen();
  return Promise.resolve();
}

function getFullscreenElement(): Element | null {
  const doc: any = document as any;
  return doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement || null;
}

function sourceLabel(sourceId: SourceId, productionMode: ProductionMode, externalTool: ExternalTool) {
  if (productionMode === "external") return externalTool === "OBS" ? "OBS Program" : "vMix Output";
  if (sourceId === "cam1") return "Camera 1";
  if (sourceId === "cam2") return "Camera 2";
  if (sourceId === "screen") return "Screen";
  return "Camera";
}

function createInitialViewers(): LiveViewer[] {
  const langs: ViewerLang[] = ["en", "fr", "sw", "ar", "pt"];
  const listenModes: ListenMode[] = ["ai_audio", "ai_captions"];
  return Array.from({ length: 12 }).map((_, i) => {
    const lang = pick(langs);
    const listenMode: ListenMode = lang === "en" ? "original" : pick(listenModes);
    return {
      id: uid("v"),
      name: `Viewer #${randInt(100, 999)}`,
      lang,
      listenMode,
      joinedAt: Date.now() - i * 15000,
    };
  });
}

// -------------------- page --------------------
export default function MyLiveDealzLiveStudioFullPage() {
  // Defaults
  const [darkMode, setDarkMode] = useState(true);
  const [mode, setMode] = useState<Mode>("lobby");
  const [simulate, setSimulate] = useState(false);

  // Controls
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenShareOn, setScreenShareOn] = useState(false);

  // Production
  const [productionMode, setProductionMode] = useState<ProductionMode>("external");
  const [externalTool, setExternalTool] = useState<ExternalTool>("OBS");
  const [activeSourceId, setActiveSourceId] = useState<SourceId>("obs");

  // Scenes + preview
  const [activeSceneId, setActiveSceneId] = useState<SceneId>("intro");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("auto");
  const deviceKind = useDeviceKind();
  const resolvedPreviewMode: Exclude<PreviewMode, "auto"> =
    previewMode === "auto" ? deviceKind : previewMode;

  // Overlays
  const [stageExpanded, setStageExpanded] = useState(false);
  const [flashConfigOpen, setFlashConfigOpen] = useState(false);
  const [languagePanelOpen, setLanguagePanelOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Left panels
  const [products, setProducts] = useState<Product[]>([]);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);

  const [coHosts, setCoHosts] = useState<{ id: number; name: string; status: string }[]>([]);

  const [attachments] = useState<{ id: number; from: string; type: string; label: string; status: string }[]>([]);

  // Audience state
  const [audienceTab, setAudienceTab] = useState<AudienceTab>("chat");
  const [chatDraft, setChatDraft] = useState("");

  const [viewers, setViewers] = useState<LiveViewer[]>([]);
  const [viewerCount, setViewerCount] = useState(0);

  // Multi-buyer simulation (per-buyer carts + reminders)
  const [buyers, setBuyers] = useState<BuyerAgent[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | null>(null);

  // KPI stats
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [last5MinSales, setLast5MinSales] = useState(0);

  // Streams
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

  // Client-side only data initialization to prevent hydration errors
  useEffect(() => {
    setProducts(INITIAL_PRODUCTS);
    setHighlightedProductId(INITIAL_PRODUCTS[0].id);
    setCoHosts([
      { id: 1, name: "Dacy (Producer)", status: "Accepted" },
      { id: 2, name: "Grace (Brand rep)", status: "Pending" },
    ]);
    
    setSimulate(true);
    setMode("live");
    setLiveSeconds(18 * 60 + 24);
    setViewerCount(842);
    setSalesCount(37);
    setLast5MinSales(5);
    setViewers(createInitialViewers());
    setBuyers(INITIAL_BUYERS);
    if(INITIAL_BUYERS.length > 0) {
      setSelectedBuyerId(INITIAL_BUYERS[0].id);
    }


    setChatMessages([
      {
        id: uid("m"),
        from: "System",
        body: "Live simulation is running. Buyer preview simulates multiple buyers with per-buyer carts and reminders.",
        time: nowTimeLabel(),
        system: true,
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
  }, []);

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
      [...prev, { id: uid("m"), from: "System", body, time: nowTimeLabel(), system: true }].slice(-120)
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
        lastAction: `Added to cart (${qty})`,
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
        lastAction: `Purchased ${finalQty}`,
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
          label: `${finalQty}x ${productName} sold · ${buyer.name}`,
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
      pushSystem(`⚠️ ${productName} is now out of stock. Buyer CTAs switch to Out of stock / Remind me.`);
    } else if (newStockAfter !== null && newStockAfter <= 5) {
      pushSystem(`Low stock: ${productName} has only ${newStockAfter} left.`);
    }
  };

  const buyerName = (buyerId: string) => buyersRef.current.find((b) => b.id === buyerId)?.name ?? "Buyer";

  // Flash deal actions
  const startFlashDeal = (durationMinutes: number, discountPct: number, targetProductId: string) => {
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
    pushAi(`Flash deal live. Mention: "-${discountPct}% ends in ${formatHMS(total)}".`, "opportunity");
  };

  const stopFlashDeal = () => {
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
    const t = setInterval(() => setLiveSeconds((s) => s + 1), 1000);
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
          [...prev, { id: uid("m"), from: "System", body: `🔥 Engagement spike: ${randInt(10, 40)} likes in the last minute.`, time: nowTimeLabel(), system: true }].slice(-120)
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
              status: "unanswered",
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
        const nv: LiveViewer = { id: uid("v"), name: `Viewer #${randInt(100, 999)}`, lang, listenMode, joinedAt: Date.now() };
        setViewers((prev) => [nv, ...prev].slice(0, 28));
        setViewerCount((c) => c + randInt(1, 4));
        setChatMessages((prev) =>
          [...prev, { id: uid("m"), from: "System", body: `${nv.name} joined (${langTag(lang, listenMode)}).`, time: nowTimeLabel(), system: true }].slice(-120)
        );
      } else {
        setViewers((prev) => {
          if (prev.length < 4) return prev;
          const leaving = prev[randInt(0, Math.min(prev.length - 1, 6))];
          const next = prev.filter((x) => x.id !== leaving.id);
          setViewerCount((c) => Math.max(0, c - randInt(1, 3)));
          setChatMessages((cm) =>
            [...cm, { id: uid("m"), from: "System", body: `${leaving.name} left.`, time: nowTimeLabel(), system: true }].slice(-120)
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
          [...prev, { id: uid("m"), from: "System", body: `🎙️ Audio request: ${req.viewerName} (${req.langTag})`, time: nowTimeLabel(), system: true }].slice(-120)
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
  const cameraHint = previewMode === "auto" ? `Auto (${deviceKind})` : previewMode === "mobile" ? "Mobile" : "Desktop";

  const flashOnFeatured = !!(featuredProduct && flash.active && flash.productId === featuredProduct.id);
  const featuredOOS = !!(featuredProduct && featuredProduct.stock <= 0);
  const featuredLow = !!(featuredProduct && featuredProduct.stock > 0 && featuredProduct.stock <= 5);

  const selectedBuyerHasReminder = !!(selectedBuyer && featuredProduct && selectedBuyer.reminders[featuredProduct.id]);
  const selectedBuyerCartQty = (selectedBuyer && featuredProduct && selectedBuyer.carts[featuredProduct.id]) || 0;

  const featuredPriceInfo = useMemo(() => {
    if (!featuredProduct) return { price: 0, applies: false };
    return getPriceForProduct(featuredProduct)
  }, [featuredProduct, flash.active, flash.discountPct, flash.productId, flash.secondsLeft]);

  const rootClass = darkMode
    ? "min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50"
    : "min-h-screen flex flex-col bg-slate-50 text-slate-900";

  if (!products.length || !highlightedProductId) {
    return (
      <div className={rootClass}>
        <div className="flex-1 flex items-center justify-center">
          <p>Loading studio...</p>
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
          "h-14 flex items-center justify-between px-4 md:px-6 border-b backdrop-blur-sm sticky top-0 z-50 " +
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
          <div className="hidden lg:flex items-center gap-2 text-[10px] mr-2">
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
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left column (Desktop) / Main Column (Mobile) */}
        <div className="flex-1 flex flex-col gap-3 p-3 min-w-0 overflow-y-auto">
          {/* Top section for mobile */}
          <div className="md:hidden flex flex-col gap-3">
             <ProductionPanel
                productionMode={productionMode}
                externalTool={externalTool}
                activeSourceId={activeSourceId}
                onChangeProductionMode={setProductionMode}
                onChangeExternalTool={setExternalTool}
                onChangeSource={setActiveSourceId}
              />
               <InventoryPanel
                  products={products}
                  highlightedId={highlightedProductId}
                  onSelectProduct={setHighlightedProductId}
                  flash={flash}
                  flashUrgency={flashUrgency}
                  onOpenFlash={() => setFlashConfigOpen(true)}
                  onStopFlash={stopFlashDeal}
                  onRestock={restockProduct}
                  getPriceForProduct={getPriceForProduct}
                />
          </div>

          <StagePanel
            mode={mode}
            activeSceneId={activeSceneId}
            onChangeScene={setActiveSceneId}
            previewMode={previewMode}
            onChangePreviewMode={setPreviewMode}
            resolvedPreviewMode={resolvedPreviewMode}
            cameraHint={cameraHint}
            liveTimerLabel={liveTimerLabel}
            viewerCount={viewerCount}
            langMix={liveLangMix}
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
          />

          {featuredProduct && selectedBuyer && (
            <BuyerSimulatorPanel
              buyers={buyers}
              selectedBuyerId={selectedBuyerId}
              onSelectBuyer={setSelectedBuyerId}
              featuredProduct={featuredProduct}
              featuredPrice={featuredPriceInfo}
              flashOnFeatured={flashOnFeatured}
              flashDiscountPct={flash.discountPct}
              flashSecondsLeft={flash.secondsLeft}
              flashUrgency={flashUrgency}
              selectedBuyerHasReminder={selectedBuyerHasReminder}
              selectedBuyerCartQty={selectedBuyerCartQty}
              outOfStock={featuredOOS}
              lowStock={featuredLow}
              onBuyNow={() => buyerBuyNow(selectedBuyer.id, featuredProduct!.id, 1)}
              onAddToCart={() => buyerAddToCart(selectedBuyer.id, featuredProduct!.id, 1)}
              onRemindMe={() => buyerSetReminder(selectedBuyer.id, featuredProduct!.id)}
            />
          )}

          <TeleprompterPanel />

          <div className="md:hidden flex flex-col gap-3">
              <CoHostsPanel coHosts={coHosts} onInvite={(name) => setCoHosts((p) => [...p, { id: p.length + 1, name, status: "Invited" }])} />
              <AttachmentsPanel
                attachments={attachments}
                onApprove={(id) => pushSystem(`Approved attachment ${id} (demo).`)}
                onReject={(id) => pushSystem(`Rejected attachment ${id} (demo).`)}
              />
          </div>

          <CommercePanel
                targetUnits={50}
                soldUnits={salesCount}
                cartCount={totalCartItems}
                last5MinSales={last5MinSales}
                flash={flash}
                flashUrgency={flashUrgency}
                salesEvents={salesEvents}
              />
        </div>

        {/* Right Column (Desktop & Tablet) */}
        <div className="w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col gap-3 p-3 overflow-y-auto">
           <div className="hidden md:flex md:flex-col gap-3">
              <ProductionPanel
                productionMode={productionMode}
                externalTool={externalTool}
                activeSourceId={activeSourceId}
                onChangeProductionMode={setProductionMode}
                onChangeExternalTool={setExternalTool}
                onChangeSource={setActiveSourceId}
              />
              <InventoryPanel
                products={products}
                highlightedId={highlightedProductId}
                onSelectProduct={setHighlightedProductId}
                flash={flash}
                flashUrgency={flashUrgency}
                onOpenFlash={() => setFlashConfigOpen(true)}
                onStopFlash={stopFlashDeal}
                onRestock={restockProduct}
                getPriceForProduct={getPriceForProduct}
              />
              <CoHostsPanel coHosts={coHosts} onInvite={(name) => setCoHosts((p) => [...p, { id: p.length + 1, name, status: "Invited" }])} />
              <AttachmentsPanel
                attachments={attachments}
                onApprove={(id) => pushSystem(`Approved attachment ${id} (demo).`)}
                onReject={(id) => pushSystem(`Rejected attachment ${id} (demo).`)}
              />
            </div>

          <AudiencePanel
            activeTab={audienceTab}
            onTabChange={setAudienceTab}
            messages={chatMessages}
            qaItems={qaItems}
            viewers={viewers}
            langMix={liveLangMix}
            audioRequests={audioRequests}
            currentSpeaker={currentSpeaker}
            speakerSecondsLeft={speakerSecondsLeft}
            onAcceptAudio={acceptAudioRequest}
            onDeclineAudio={declineAudioRequest}
            onEndSpeaker={endCurrentSpeaker}
            draft={chatDraft}
            onDraftChange={setChatDraft}
            onSend={() => {
              const t = chatDraft.trim();
              if (!t) return;
              setChatMessages((prev) => [...prev, { id: uid("m"), from: "You", body: t, time: nowTimeLabel() }].slice(-120));
              setChatDraft("");
            }}
          />

          <AiPanel prompts={aiHints} />
        </div>
      </div>

      {/* Bottom control bar */}
      <div className="sticky bottom-0 z-40">
        <ControlBar
          mode={mode}
          onToggleLive={() => setMode((m) => (m === "live" ? "lobby" : "live"))}
          micOn={micOn}
          onToggleMic={() => setMicOn((v) => !v)}
          camOn={camOn}
          onToggleCam={() => setCamOn((v) => !v)}
          screenShareOn={screenShareOn}
          onToggleScreenShare={() => setScreenShareOn((v) => !v)}
          activeSceneId={activeSceneId}
          onChangeScene={setActiveSceneId}
          previewMode={previewMode}
          onCyclePreviewMode={() => {
            const order: PreviewMode[] = ["auto", "desktop", "mobile"];
            const idx = order.indexOf(previewMode);
            setPreviewMode(order[(idx + 1) % order.length]);
          }}
          cameraHint={cameraHint}
          flashActive={flash.active}
          onOpenFlashConfig={() => setFlashConfigOpen(true)}
          onStopFlash={stopFlashDeal}
          onOpenLanguage={() => setLanguagePanelOpen(true)}
          onToggleFilters={() => setFiltersOpen((v) => !v)}
        />
      </div>

      {/* Overlays */}
      {filtersOpen && <FiltersTray onClose={() => setFiltersOpen(false)} />}

      {flashConfigOpen && (
        <FlashDealDialog
          onClose={() => setFlashConfigOpen(false)}
          onStart={(durationMin, discountPct) => {
            if (highlightedProductId) {
              startFlashDeal(durationMin, discountPct, highlightedProductId);
              setFlashConfigOpen(false);
            }
          }}
        />
      )}

      {languagePanelOpen && <LanguagePanel onClose={() => setLanguagePanelOpen(false)} langMix={liveLangMix} />}

      {stageExpanded && (
        <ExpandedStageModal
          onClose={() => setStageExpanded(false)}
          cameraHint={cameraHint}
          previewMode={previewMode}
          onChangePreviewMode={setPreviewMode}
          resolvedPreviewMode={resolvedPreviewMode}
          liveTimerLabel={liveTimerLabel}
          viewerCount={viewerCount}
          langMix={langMix}
          productionMode={productionMode}
          externalTool={externalTool}
          activeSourceId={activeSourceId}
          flash={flash}
          flashUrgency={flashUrgency}
          currentSpeaker={currentSpeaker}
          speakerSecondsLeft={speakerSecondsLeft}
        />
      )}
    </div>
  );
}

// -------------------- UI components --------------------
function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex flex-col items-start px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px]">
      <span className="text-[9px] text-slate-400">{label}</span>
      <span className="text-[11px] font-semibold text-slate-50">{value}</span>
    </span>
  );
}

function ProductionPanel(props: {
  productionMode: ProductionMode;
  externalTool: ExternalTool;
  activeSourceId: SourceId;
  onChangeProductionMode: (v: ProductionMode) => void;
  onChangeExternalTool: (v: ExternalTool) => void;
  onChangeSource: (v: SourceId) => void;
}) {
  const { productionMode, externalTool, activeSourceId, onChangeProductionMode, onChangeExternalTool, onChangeSource } = props;

  const sources = [
    { id: "cam1" as const, label: "Camera 1", desc: "USB/Integrated" },
    { id: "cam2" as const, label: "Camera 2", desc: "HDMI capture" },
    { id: "screen" as const, label: "Screen", desc: "Share window" },
    { id: "obs" as const, label: "OBS Program", desc: "Virtual cam / RTMP" },
    { id: "vmix" as const, label: "vMix Output", desc: "Switcher / RTMP" },
  ];

  const visibleSources = sources.filter((s) => {
    if (productionMode === "external") return s.id === (externalTool === "OBS" ? "obs" : "vmix");
    return s.id !== "obs" && s.id !== "vmix";
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 text-[11px]">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold">Production</h3>
        <span className="text-[10px] text-slate-500">Multi-camera</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-full bg-slate-950 border border-slate-800 p-0.5 text-[10px]">
          <button
            className={`px-2.5 py-1 rounded-full ${productionMode === "inapp" ? "bg-white text-slate-900" : "text-slate-300"}`}
            onClick={() => onChangeProductionMode("inapp")}
          >
            In-app
          </button>
          <button
            className={`px-2.5 py-1 rounded-full ${productionMode === "external" ? "bg-white text-slate-900" : "text-slate-300"}`}
            onClick={() => onChangeProductionMode("external")}
          >
            OBS/vMix
          </button>
        </div>

        {productionMode === "external" && (
          <select
            className="px-2 py-1 rounded-full border border-slate-700 bg-slate-950 text-slate-100 text-[10px]"
            value={externalTool}
            onChange={(e) => onChangeExternalTool(e.target.value as ExternalTool)}
          >
            <option value="OBS">OBS Studio</option>
            <option value="vMix">vMix</option>
          </select>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-[10px] text-slate-300">
        {productionMode === "external" ? (
          <>
            Send one clean program feed from <span className="text-slate-100 font-semibold">{externalTool}</span> using Virtual Camera or RTMP.
            Keep audio consistent for best AI translation accuracy.
          </>
        ) : (
          <>Use in-app sources and select the active camera below.</>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {visibleSources.map((s) => {
          const active = s.id === activeSourceId;
          return (
            <button
              key={s.id}
              onClick={() => onChangeSource(s.id)}
              className={`rounded-xl border px-2 py-2 text-left ${active ? "border-emerald-400 bg-emerald-500/10 text-emerald-200" : "border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-600"}`}
            >
              <div className="text-[10px] font-semibold">{s.label}</div>
              <div className="text-[9px] text-slate-500">{s.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-700 text-[10px] text-slate-100 hover:bg-slate-900" onClick={() => alert("Copy ingest URL (demo)")}>
          <span className="material-icons text-[14px]">content_copy</span>
          Copy ingest
        </button>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-700 text-[10px] text-slate-100 hover:bg-slate-900" onClick={() => alert("Open setup guide (demo)")}>
          <span className="material-icons text-[14px]">menu_book</span>
          Setup guide
        </button>
      </div>
    </div>
  );
}

function InventoryPanel(props: {
  products: Product[];
  highlightedId: string | null;
  onSelectProduct: (id: string) => void;
  flash: FlashDealState;
  flashUrgency: string;
  onOpenFlash: () => void;
  onStopFlash: () => void;
  onRestock: (productId: string, qty: number) => void;
  getPriceForProduct: (p: Product) => { price: number; applies: boolean };
}) {
  const { products, highlightedId, onSelectProduct, flash, flashUrgency, onOpenFlash, onStopFlash, onRestock, getPriceForProduct } = props;

  const bannerTone =
    flashUrgency === "critical"
      ? "bg-red-600/20 border-red-500/50 text-red-200"
      : flashUrgency === "high"
      ? "bg-orange-500/15 border-orange-400/60 text-orange-200"
      : "bg-[#f77f00]/10 border-[#f77f00]/50 text-slate-100";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 text-[11px]">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold">Products</h3>
        <span className="text-[10px] text-slate-500">{products.length} items</span>
      </div>

      {flash.active ? (
        <div className={`rounded-xl border px-3 py-2 ${bannerTone}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold">⚡ Flash deal live</span>
            <span className="text-[10px]">-{flash.discountPct}% · {formatHMS(flash.secondsLeft)}</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-900/60 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.round((flash.secondsLeft / Math.max(1, flash.totalSeconds)) * 100)}%`,
                backgroundColor: flashUrgency === "critical" ? "#ef4444" : EV_ORANGE,
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-300">Target: {flash.productId ?? "Featured"}</span>
            <button className="px-2.5 py-1 rounded-full text-[10px] border border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800" onClick={onStopFlash}>
              Stop
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-[10px] text-slate-300">
          No flash deal running. Start one to boost urgency.
        </div>
      )}

      <div className="space-y-1.5 max-h-56 overflow-y-auto">
        {products.map((p) => {
          const active = p.id === highlightedId;
          const dealOnThis = flash.active && flash.productId === p.id;
          const oos = p.stock <= 0;
          const low = p.stock > 0 && p.stock <= 5;

          const { price, applies } = getPriceForProduct(p);

          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              className={`w-full text-left border rounded-xl px-2.5 py-1.5 flex flex-col gap-0.5 cursor-pointer ${
                active ? "bg-[#f77f00]/10 border-[#f77f00] text-slate-50" : "bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-600"
              }`}
              onClick={() => onSelectProduct(p.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectProduct(p.id); }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold truncate">{p.name}</span>
                <span className="text-[10px] text-emerald-300">
                  {applies ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="line-through text-slate-500">{fmtMoneyUSD(p.basePrice)}</span>
                      <span className="text-emerald-300">{fmtMoneyUSD(price)}</span>
                    </span>
                  ) : (
                    fmtMoneyUSD(p.basePrice)
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span>{oos ? "Out of stock" : `${p.stock} in stock`}</span>
                  {low && !oos && (
                    <span className="px-2 py-0.5 rounded-full border border-orange-500/60 bg-orange-500/10 text-orange-200 text-[9px]">Low</span>
                  )}
                  {dealOnThis && (
                    <span className="px-2 py-0.5 rounded-full border border-orange-500/60 bg-orange-500/10 text-orange-200 text-[9px]">
                      FLASH · {formatHMS(flash.secondsLeft)}
                    </span>
                  )}
                </div>
                <span className="truncate">{p.tag}</span>
              </div>

              <div className="mt-1 flex items-center justify-between">
                <button
                  type="button"
                  className="px-2 py-0.5 rounded-full text-[9px] border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestock(p.id, 10);
                  }}
                >
                  Restock +10
                </button>
                <span className="text-[9px] text-slate-500">ID: {p.id}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-1 flex items-center justify-between">
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-700 text-[10px] text-slate-100 hover:bg-slate-800" onClick={onOpenFlash}>
          <span className="material-icons text-[14px]" style={{ color: EV_ORANGE }}>bolt</span>
          Configure flash deal
        </button>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-700 text-[10px] text-slate-100 hover:bg-slate-800" onClick={() => alert("Open product manager (demo)")}>
          <span className="material-icons text-[14px]">inventory_2</span>
          Catalog
        </button>
      </div>
    </div>
  );
}

function CoHostsPanel(props: { coHosts: { id: number; name: string; status: string }[]; onInvite: (name: string) => void }) {
  const { coHosts, onInvite } = props;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-[11px]">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold">Co-host & crew</h3>
        <button className="text-[10px] text-[#f77f00] hover:underline" onClick={() => { const name = window.prompt("Enter co-host name (demo):"); if (name) onInvite(name); }}>
          Invite
        </button>
      </div>
      <div className="mt-2 space-y-1 max-h-28 overflow-y-auto">
        {coHosts.map((c) => (
          <div key={c.id} className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-100">
                {c.name.split(" ").map((w) => w[0]).join("")}
              </span>
              <div className="min-w-0">
                <div className="text-slate-100 truncate">{c.name}</div>
                <div className="text-slate-500">{c.status}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="px-2 py-0.5 rounded-full border border-slate-700 text-slate-100 text-[9px]" onClick={() => alert("Accept (demo)")}>Accept</button>
              <button className="px-2 py-0.5 rounded-full border border-slate-700 text-slate-300 text-[9px]" onClick={() => alert("Remove (demo)")}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttachmentsPanel(props: { attachments: { id: number; from: string; type: string; label: string; status: string }[]; onApprove: (id: number) => void; onReject: (id: number) => void }) {
  const { attachments, onApprove, onReject } = props;
  const pending = attachments.filter((a) => a.status === "Pending");
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-[11px]">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold">Attachments</h3>
        <span className="text-[10px] text-slate-500">{pending.length} pending</span>
      </div>
      <div className="mt-2 space-y-1 max-h-28 overflow-y-auto">
        {pending.map((a) => (
          <div key={a.id} className="flex items-center justify-between text-[10px] border border-slate-800 rounded-lg px-2 py-1 bg-slate-950">
            <div className="min-w-0">
              <div className="text-slate-100 truncate">{a.label}</div>
              <div className="text-slate-500 truncate">{a.type.toUpperCase()} · {a.from}</div>
            </div>
            <div className="flex items-center gap-1">
              <button className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px]" onClick={() => onApprove(a.id)}>Approve</button>
              <button className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 text-[9px]" onClick={() => onReject(a.id)}>Reject</button>
            </div>
          </div>
        ))}
        {pending.length === 0 && <div className="text-[10px] text-slate-500">No pending attachments.</div>}
      </div>
    </div>
  );
}

function StagePanel(props: {
  mode: Mode;
  activeSceneId: SceneId;
  onChangeScene: (id: SceneId) => void;
  previewMode: PreviewMode;
  onChangePreviewMode: (m: PreviewMode) => void;
  resolvedPreviewMode: "mobile" | "desktop";
  cameraHint: string;
  liveTimerLabel: string;
  viewerCount: number;
  langMix: { label: string; pct: number }[];
  productionMode: ProductionMode;
  externalTool: ExternalTool;
  activeSourceId: SourceId;
  flash: FlashDealState;
  flashUrgency: string;
  micOn: boolean;
  camOn: boolean;
  screenShareOn: boolean;
  currentSpeaker: CurrentSpeaker | null;
  speakerSecondsLeft: number;
  onExpand: () => void;
}) {
  const {
    mode,
    activeSceneId,
    onChangeScene,
    previewMode,
    onChangePreviewMode,
    resolvedPreviewMode,
    cameraHint,
    liveTimerLabel,
    viewerCount,
    langMix,
    productionMode,
    externalTool,
    activeSourceId,
    flash,
    flashUrgency,
    micOn,
    camOn,
    screenShareOn,
    currentSpeaker,
    speakerSecondsLeft,
    onExpand,
  } = props;

  const activeScene = SCENES.find((s) => s.id === activeSceneId) ?? SCENES[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 md:p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-300">Camera view</span>
          <span className="text-[10px] text-slate-500">{cameraHint}</span>
        </div>
        <PreviewModeToggle previewMode={previewMode} onChange={onChangePreviewMode} />
      </div>

      {mode === "lobby" ? (
        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-6 text-center">
          <div className="text-[11px] text-slate-300 font-semibold">Pre-live lobby</div>
          <div className="text-[10px] text-slate-500 mt-1">Device and scene check before going live</div>
        </div>
      ) : (
        <StagePreview
          resolvedPreviewMode={resolvedPreviewMode}
          activeSceneLabel={activeScene.label}
          liveTimerLabel={liveTimerLabel}
          viewerCount={viewerCount}
          langMix={langMix}
          source={sourceLabel(activeSourceId, productionMode, externalTool)}
          flash={flash}
          flashUrgency={flashUrgency}
          micOn={micOn}
          camOn={camOn}
          screenShareOn={screenShareOn}
          currentSpeaker={currentSpeaker}
          speakerSecondsLeft={speakerSecondsLeft}
          onExpand={onExpand}
        />
      )}

      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span>Scene presets</span>
        <span>Active: {activeScene.label}</span>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {SCENES.map((s) => (
          <button
            key={s.id}
            className={`px-2.5 py-1 rounded-xl border text-[10px] min-w-[120px] text-left ${
              s.id === activeSceneId
                ? "bg-[#f77f00] border-[#f77f00] text-white"
                : "bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-900"
            }`}
            onClick={() => onChangeScene(s.id)}
          >
            <span className="font-semibold">{s.label}</span>
            <span className="block text-[9px] text-slate-400">{s.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StagePreview(props: {
  resolvedPreviewMode: "mobile" | "desktop";
  activeSceneLabel: string;
  liveTimerLabel: string;
  viewerCount: number;
  langMix: { label: string; pct: number }[];
  source: string;
  flash: FlashDealState;
  flashUrgency: string;
  micOn: boolean;
  camOn: boolean;
  screenShareOn: boolean;
  currentSpeaker: CurrentSpeaker | null;
  speakerSecondsLeft: number;
  onExpand: () => void;
}) {
  const {
    resolvedPreviewMode,
    activeSceneLabel,
    liveTimerLabel,
    viewerCount,
    langMix,
    source,
    flash,
    flashUrgency,
    micOn,
    camOn,
    screenShareOn,
    currentSpeaker,
    speakerSecondsLeft,
    onExpand,
  } = props;

  const isMobile = resolvedPreviewMode === "mobile";
  const aspect = isMobile ? "9 / 16" : "16 / 9";

  const flashTone =
    flashUrgency === "critical"
      ? "bg-red-600 border-red-400/60"
      : flashUrgency === "high"
      ? "bg-orange-600 border-orange-400/60"
      : "bg-[#f77f00] border-[#f77f00]/70";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onExpand}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onExpand(); }}
      className="relative w-full flex items-center justify-center cursor-pointer"
      title="Tap to expand preview"
    >
      <div
        className={"relative rounded-2xl border overflow-hidden shadow-[0_24px_80px_rgba(15,23,42,0.7)] bg-slate-950 border-slate-800 " + (isMobile ? "w-[360px] max-w-[80%]" : "w-full")}
        style={{ aspectRatio: aspect }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-600" />

        {/* Live pill */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 text-[10px]">
          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-black/60 border border-white/10 text-slate-100">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-red-500" />
              LIVE
            </span>
            <span className="opacity-80">{liveTimerLabel}</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 border border-white/10 text-slate-100">
            <span className="material-icons text-[14px]">visibility</span>
            <span>{viewerCount.toLocaleString()} viewers</span>
          </div>
        </div>

        {/* AI chips */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 text-[10px] items-end">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-emerald-200 border border-emerald-400/60">
            <span className="material-icons text-[14px]">graphic_eq</span>
            <span>AI Audio: ON (Multi)</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-sky-100 border border-sky-400/60">
            <span className="material-icons text-[14px]">subtitles</span>
            <span>Captions: ON</span>
          </div>
        </div>

        {/* Speaker */}
        {currentSpeaker && (
          <div className="absolute top-12 right-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/60 text-emerald-200 text-[10px]">
              <span className="material-icons text-[14px]">mic</span>
              <span className="font-semibold">Live audio</span>
              <span className="text-emerald-100">{currentSpeaker.viewerName}</span>
              <span className="text-emerald-200/80">({currentSpeaker.langTag})</span>
              <span className="px-2 py-0.5 rounded-full bg-black/40 border border-white/10">
                {formatHMS(speakerSecondsLeft)}
              </span>
            </div>
          </div>
        )}

        {/* Flash banner */}
        {flash.active && (
          <div className="absolute left-1/2 -translate-x-1/2 top-12">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] text-white shadow ${flashTone}`}>
              <span className="material-icons text-[14px]">bolt</span>
              <span className="font-semibold">FLASH</span>
              <span>-{flash.discountPct}%</span>
              <span className="opacity-90">ends in {formatHMS(flash.secondsLeft)}</span>
              <span className="ml-1 h-1.5 w-16 rounded-full bg-black/30 overflow-hidden">
                <span
                  className="block h-full"
                  style={{ width: `${Math.round((flash.secondsLeft / Math.max(1, flash.totalSeconds)) * 100)}%`, backgroundColor: "rgba(255,255,255,0.9)" }}
                />
              </span>
            </div>
          </div>
        )}

        {/* Scene label */}
        <div className="absolute top-12 left-2 text-[10px] px-2 py-0.5 rounded-full bg-black/55 border border-white/10 text-slate-100">
          Scene: <span className="font-semibold">{activeSceneLabel}</span>
        </div>

        {/* Source + language mix */}
        <div className="absolute left-2 right-2 bottom-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] text-slate-200">Viewer languages (sample)</span>
            <span className="text-[10px] text-slate-300">Source: {source}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-900/70 border border-white/10 overflow-hidden flex">
            {langMix.map((seg, idx) => (
              <div
                key={seg.label}
                className="h-full"
                style={{ width: `${seg.pct}%`, backgroundColor: idx % 2 === 0 ? EV_ORANGE : EV_GREEN, opacity: 0.8 }}
                title={`${seg.label} · ${seg.pct}%`}
              />
            ))}
          </div>
        </div>

        {/* Status */}
        {screenShareOn && (
          <div className="absolute bottom-24 right-2 text-[10px] px-2 py-0.5 rounded-full bg-slate-900/70 border border-slate-700 text-slate-100">
            Screen sharing
          </div>
        )}
        {!camOn && (
          <div className="absolute bottom-24 left-2 text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white">
            Camera off
          </div>
        )}

        <div className="absolute bottom-24 right-2 flex flex-col items-end gap-1 text-[10px]">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-slate-100 border border-white/10">
            <span className="material-icons text-[14px]">{micOn ? "mic" : "mic_off"}</span>
            <span>{micOn ? "Mic live" : "Mic muted"}</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-slate-100 border border-white/10">
            <span className="material-icons text-[14px]">{camOn ? "videocam" : "videocam_off"}</span>
            <span>{camOn ? "Camera on" : "Camera off"}</span>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="text-xs text-slate-200">Preview</div>
            <div className="text-sm font-semibold text-white mt-1">Tap to expand</div>
            <div className="text-[11px] text-slate-300 mt-2">Mobile-first framing included</div>
          </div>
        </div>

        {isMobile && <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />}
      </div>
    </div>
  );
}

function PreviewModeToggle({ previewMode, onChange }: { previewMode: PreviewMode; onChange: (m: PreviewMode) => void }) {
  const chip = (id: PreviewMode, label: string, icon: string) => {
    const active = previewMode === id;
    return (
      <button
        key={id}
        onClick={() => onChange(id)}
        className={
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] border transition " +
          (active ? "bg-white text-slate-900 border-white shadow-sm" : "bg-slate-950 text-slate-200 border-slate-700 hover:bg-slate-900")
        }
      >
        <span className="material-icons text-[13px]">{icon}</span>
        {label}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-1">
      {chip("auto", "Auto", "auto_awesome")}
      {chip("desktop", "Desktop", "desktop_windows")}
      {chip("mobile", "Mobile", "smartphone")}
    </div>
  );
}

function BuyerSimulatorPanel(props: {
  buyers: BuyerAgent[];
  selectedBuyerId: string | null;
  onSelectBuyer: (id: string) => void;
  featuredProduct: Product;
  featuredPrice: { price: number; applies: boolean };
  flashOnFeatured: boolean;
  flashDiscountPct: number;
  flashSecondsLeft: number;
  flashUrgency: string;
  selectedBuyerHasReminder: boolean;
  selectedBuyerCartQty: number;
  outOfStock: boolean;
  lowStock: boolean;
  onBuyNow: () => void;
  onAddToCart: () => void;
  onRemindMe: () => void;
}) {
  const {
    buyers,
    selectedBuyerId,
    onSelectBuyer,
    featuredProduct,
    featuredPrice,
    flashOnFeatured,
    flashDiscountPct,
    flashSecondsLeft,
    flashUrgency,
    selectedBuyerHasReminder,
    selectedBuyerCartQty,
    outOfStock,
    lowStock,
    onBuyNow,
    onAddToCart,
    onRemindMe,
  } = props;

  const selected = buyers.find((b) => b.id === selectedBuyerId) ?? buyers[0];
  if (!selected) return null; // Should not happen if buyers are initialized

  const modeLabel = selected.listenMode === "ai_audio" ? "AI audio" : selected.listenMode === "ai_captions" ? "Captions" : "Original";

  const primaryLabel = outOfStock ? "Out of stock" : "Buy now";
  const secondaryLabel = outOfStock ? (selectedBuyerHasReminder ? "Reminder set" : "Remind me") : "Add to cart";

  const flashTone =
    flashUrgency === "critical"
      ? "border-red-500/60 bg-red-500/10 text-red-200"
      : flashUrgency === "high"
      ? "border-orange-500/60 bg-orange-500/10 text-orange-200"
      : "border-[#f77f00]/70 bg-[#f77f00]/10 text-slate-100";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-[11px]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div>
          <div className="text-xs font-semibold">Buyer view preview</div>
          <div className="text-[10px] text-slate-500">Multiple buyers, per-buyer carts and reminders</div>
        </div>
        <div className="text-[10px] text-slate-300">
          Selected: <span className="font-semibold">{selected.name}</span>
        </div>
      </div>

      <div className="flex items-start gap-4">
        {/* Phone frame */}
        <div className="w-[250px] max-w-full rounded-2xl border border-slate-700 bg-slate-950 overflow-hidden shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
          <div className="h-[280px] bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-700 relative">
            {/* top HUD */}
            <div className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-slate-100">
              LIVE · {modeLabel}
            </div>
            <div className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-slate-100">
              {selected.lang.toUpperCase()}
            </div>

            {/* flash banner */}
            {flashOnFeatured && (
              <div className="absolute top-10 inset-x-2">
                <div className={`px-3 py-1 rounded-full border text-[10px] inline-flex items-center gap-2 ${flashTone}`}>
                  <span className="material-icons text-[14px]">bolt</span>
                  <span className="font-semibold">FLASH</span>
                  <span>-{flashDiscountPct}%</span>
                  <span className="opacity-90">{formatHMS(flashSecondsLeft)}</span>
                </div>
              </div>
            )}

            {/* bottom sheet */}
            <div className="absolute bottom-0 left-0 right-0 bg-slate-950/95 border-t border-slate-800 p-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-100 truncate">{featuredProduct.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {outOfStock ? (
                      <span className="text-rose-300">Out of stock</span>
                    ) : lowStock ? (
                      <span className="text-orange-200">Only {featuredProduct.stock} left</span>
                    ) : (
                      <span>{featuredProduct.stock} in stock</span>
                    )}
                    {selectedBuyerCartQty > 0 && (
                      <span className="ml-2 text-slate-300">In cart: {selectedBuyerCartQty}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {flashOnFeatured && featuredPrice.applies ? (
                    <div className="text-[10px] text-slate-300">
                      <span className="line-through text-slate-500">{fmtMoneyUSD(featuredProduct.basePrice)}</span>
                      <div className="text-emerald-300 font-semibold">{fmtMoneyUSD(featuredPrice.price)}</div>
                    </div>
                  ) : (
                    <div className="text-emerald-300 font-semibold text-[11px]">{fmtMoneyUSD(featuredProduct.basePrice)}</div>
                  )}
                </div>
              </div>

              <div className="mt-2 flex gap-2">
                <button
                  className={`flex-1 px-3 py-2 rounded-xl text-[11px] font-semibold ${outOfStock ? "bg-slate-800 text-slate-400 cursor-not-allowed" : "text-white"}`}
                  style={{ backgroundColor: outOfStock ? undefined : EV_GREEN }}
                  onClick={outOfStock ? undefined : onBuyNow}
                >
                  {primaryLabel}
                </button>

                <button
                  className={`flex-1 px-3 py-2 rounded-xl text-[11px] font-semibold border ${
                    outOfStock
                      ? (selectedBuyerHasReminder ? "border-slate-700 bg-slate-800 text-slate-400 cursor-not-allowed" : "border-slate-700 bg-slate-950 text-slate-200")
                      : "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
                  }`}
                  onClick={
                    outOfStock
                      ? (selectedBuyerHasReminder ? undefined : onRemindMe)
                      : onAddToCart
                  }
                >
                  {secondaryLabel}
                </button>
              </div>

              {outOfStock && (
                <div className="mt-2 text-[10px] text-slate-400">
                  When stock is zero, Add to cart becomes <span className="text-slate-200 font-semibold">Remind me</span>.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buyer list */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-slate-500">Buyers (select one to preview)</div>
          <div className="mt-2 space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {buyers.map((b) => {
              const selectedRow = b.id === selectedBuyerId;
              return (
                <button
                  key={b.id}
                  onClick={() => onSelectBuyer(b.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left ${selectedRow ? "border-sky-500 bg-sky-500/10" : "border-slate-800 bg-slate-950 hover:border-slate-600"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-[11px] font-semibold text-slate-100">
                        {b.name.split(" ")[1] ?? "B"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-slate-100 truncate">{b.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{langTag(b.lang, b.listenMode)}</div>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-300">
                      <div>Carts: {buyerCartCount(b)}</div>
                      <div>Remind: {buyerReminderCount(b)}</div>
                    </div>
                  </div>

                  {b.lastAction && (
                    <div className="mt-2 text-[10px] text-slate-500 truncate">
                      Last: {b.lastAction}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-950 text-[10px] text-slate-100 hover:bg-slate-800" onClick={onBuyNow}>
              Test Buy now
            </button>
            <button className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-950 text-[10px] text-slate-100 hover:bg-slate-800" onClick={onAddToCart}>
              Test Add to cart
            </button>
            <button className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-950 text-[10px] text-slate-100 hover:bg-slate-800" onClick={onRemindMe}>
              Test Remind me
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeleprompterPanel() {
  const scriptCues = [
    "Welcome + short intro.",
    "Explain key benefits clearly.",
    "Mention flash deal and show the timer.",
    "Answer 2 top questions.",
    "Recommend the best bundle.",
    "Close with CTA and follow reminder.",
  ];
  const runOfShow = [
    { id: "shot-1", label: "Intro + hook", window: "00:00-03:00", scene: "intro" },
    { id: "shot-2", label: "Hero demo", window: "03:00-08:00", scene: "product" },
    { id: "shot-3", label: "Offer + urgency", window: "08:00-12:00", scene: "offer" },
    { id: "shot-4", label: "Q&A", window: "12:00-18:00", scene: "split" },
  ];
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 text-[11px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px]">📜</span>
          <h3 className="text-xs font-semibold">Teleprompter</h3>
        </div>
        <span className="text-[10px] text-slate-500">Run-of-show</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-2">
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {scriptCues.map((cue, idx) => (
            <div key={idx} className={`text-[10px] px-2 py-1 rounded-lg ${idx === 2 ? "bg-[#f77f00]/20 text-slate-50" : "bg-slate-950 text-slate-200"}`}>
              {idx === 2 && <span className="mr-1 text-[9px] uppercase tracking-wide text-[#f77f00]">Now:</span>}
              {cue}
            </div>
          ))}
        </div>
        <div className="border border-slate-800 rounded-xl p-2 bg-slate-950 text-[10px] text-slate-200 max-h-32 overflow-y-auto">
          <ul className="space-y-1">
            {runOfShow.map((shot) => (
              <li key={shot.id} className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-medium">{shot.label}</span>
                  <span className="text-slate-500">Scene: {shot.scene}</span>
                </div>
                <span className="text-slate-400 text-[9px]">{shot.window}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function CommercePanel(props: {
  targetUnits: number;
  soldUnits: number;
  cartCount: number;
  last5MinSales: number;
  flash: FlashDealState;
  flashUrgency: string;
  salesEvents: SaleEvent[];
}) {
  const { targetUnits, soldUnits, cartCount, last5MinSales, flash, flashUrgency, salesEvents } = props;
  const progress = Math.min(soldUnits / Math.max(1, targetUnits), 1);

  const flashTone =
    flashUrgency === "critical"
      ? "border-red-500/60 bg-red-500/10 text-red-200"
      : flashUrgency === "high"
      ? "border-orange-500/60 bg-orange-500/10 text-orange-200"
      : "border-[#f77f00]/70 bg-[#f77f00]/10 text-slate-100";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 text-[11px]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px]">💰</span>
          <div>
            <h3 className="text-xs font-semibold">Commerce HUD</h3>
            <p className="text-[10px] text-slate-500">Sales feed and goal tracking</p>
          </div>
        </div>
        {flash.active && (
          <span className={`px-2 py-1 rounded-full text-[10px] border ${flashTone}`}>
            ⚡ -{flash.discountPct}% ends in {formatHMS(flash.secondsLeft)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 text-[10px]">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400">Progress</span>
            <span className="text-slate-100">{soldUnits}/{targetUnits} sold</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, backgroundColor: EV_ORANGE }} />
          </div>
        </div>
        <div className="flex flex-col items-end text-[10px]">
          <span className="text-slate-400">In carts</span>
          <span className="text-slate-100 font-semibold">{cartCount}</span>
          <span className="text-slate-500">{last5MinSales} sales · 5 min</span>
        </div>
      </div>

      <div className="border border-slate-800 rounded-xl p-2 bg-slate-950">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-[10px] font-semibold text-slate-200">Live sales feed</h4>
          <span className="text-[9px] text-slate-500">latest first</span>
        </div>
        <ul className="space-y-1 max-h-28 overflow-y-auto text-[10px] text-slate-200">
          {salesEvents.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="truncate">{e.label}</span>
                {e.amount && <span className="ml-2 text-[9px] text-emerald-300">{e.amount}</span>}
                {e.langTag && <span className="ml-2 text-[9px] text-slate-500">({e.langTag})</span>}
              </div>
              <span className="text-slate-500 text-[9px]">{e.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AudiencePanel(props: {
  activeTab: AudienceTab;
  onTabChange: (t: AudienceTab) => void;
  messages: ChatMsg[];
  qaItems: QaItem[];
  viewers: LiveViewer[];
  langMix: { label: string; pct: number }[];
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
    langMix,
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
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                  q.status === "pinned"
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col h-full overflow-hidden">
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
            {langMix.map((s) => (
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

      <div className="flex-1 min-h-0 border border-slate-800 rounded-xl p-2.5 bg-slate-950 overflow-y-auto max-h-96">
        {renderBody()}
      </div>

      <div className="mt-2 flex items-center gap-1 text-[10px]">
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

function AiPanel({ prompts }: { prompts: AiHint[] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 text-[11px] overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px]">💡</span>
          <h3 className="text-xs font-semibold">Live AI prompts</h3>
        </div>
        <span className="text-[10px] text-slate-500">Real-time hints</span>
      </div>
      <ul className="space-y-1 max-h-52 overflow-y-auto">
        {prompts.map((p) => (
          <li key={p.id} className="border border-slate-800 rounded-xl px-2.5 py-1.5 bg-slate-950 text-[10px] text-slate-200">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full border text-[9px] ${severityPillClass(p.severity)}`}>{p.severity}</span>
              <span className="text-[9px] text-slate-500">{p.time}</span>
            </div>
            {p.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ControlBar(props: {
  mode: Mode;
  onToggleLive: () => void;
  micOn: boolean;
  onToggleMic: () => void;
  camOn: boolean;
  onToggleCam: () => void;
  screenShareOn: boolean;
  onToggleScreenShare: () => void;
  activeSceneId: SceneId;
  onChangeScene: (id: SceneId) => void;
  previewMode: PreviewMode;
  onCyclePreviewMode: () => void;
  cameraHint: string;
  flashActive: boolean;
  onOpenFlashConfig: () => void;
  onStopFlash: () => void;
  onOpenLanguage: () => void;
  onToggleFilters: () => void;
}) {
  const {
    mode,
    onToggleLive,
    micOn,
    onToggleMic,
    camOn,
    onToggleCam,
    screenShareOn,
    onToggleScreenShare,
    activeSceneId,
    onChangeScene,
    onCyclePreviewMode,
    cameraHint,
    flashActive,
    onOpenFlashConfig,
    onStopFlash,
    onOpenLanguage,
    onToggleFilters,
  } = props;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 md:px-6 py-2 border-t border-slate-800 bg-slate-950/95 text-[11px]">
      <div className="flex items-center gap-2">
        <button
          className={`px-4 py-1.5 rounded-full text-[11px] font-semibold ${mode === "live" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-[#f77f00] hover:bg-[#e26f00] text-white"}`}
          onClick={onToggleLive}
        >
          {mode === "live" ? "End live" : "Go live"}
        </button>

        <button className={`px-3 py-1.5 rounded-full border text-[10px] ${micOn ? "bg-slate-900 border-slate-600 text-slate-100" : "bg-slate-950 border-slate-800 text-slate-400"}`} onClick={onToggleMic}>
          {micOn ? "Mic on" : "Mic off"}
        </button>

        <button className={`px-3 py-1.5 rounded-full border text-[10px] ${camOn ? "bg-slate-900 border-slate-600 text-slate-100" : "bg-slate-950 border-slate-800 text-slate-400"}`} onClick={onToggleCam}>
          {camOn ? "Cam on" : "Cam off"}
        </button>
      </div>

      <div className="flex items-center gap-2 text-[10px]">
        
        <button className={`px-3 py-1.5 rounded-full border text-[10px] hidden sm:inline-flex ${screenShareOn ? "bg-slate-900 border-slate-600 text-slate-100" : "bg-slate-950 border-slate-800 text-slate-400"}`} onClick={onToggleScreenShare}>
          Screen share
        </button>

        <button className="px-3 py-1.5 rounded-full border border-slate-600 text-[10px] text-slate-100 hover:bg-slate-900 hidden sm:inline-flex items-center gap-1.5" onClick={onToggleFilters}>
          <span className="material-icons text-[14px]">auto_awesome</span>
          AR Filters
        </button>

        <button className="px-3 py-1.5 rounded-full border border-slate-700 text-[10px] text-slate-100 hover:bg-slate-900 hidden sm:inline-flex items-center gap-1.5" onClick={onOpenLanguage}>
          <span className="material-icons text-[14px]">translate</span>
          Language
        </button>

        {flashActive ? (
          <button className="px-3 py-1.5 rounded-full border border-rose-500/70 bg-rose-500/10 text-[10px] text-rose-200 hover:bg-rose-500/20 inline-flex items-center gap-1.5" onClick={onStopFlash}>
            <span className="material-icons text-[14px]">bolt</span>
            Stop deal
          </button>
        ) : (
          <button className="px-3 py-1.5 rounded-full border border-orange-500/70 bg-orange-500/10 text-[10px] text-orange-200 hover:bg-orange-500/20 inline-flex items-center gap-1.5" onClick={onOpenFlashConfig}>
            <span className="material-icons text-[14px]">bolt</span>
            Start deal
          </button>
        )}
        <select
          className="border border-slate-700 rounded-full px-2 py-0.5 bg-slate-950 text-slate-100 hidden sm:block"
          value={activeSceneId}
          onChange={(e) => onChangeScene(e.target.value as SceneId)}
        >
          {SCENES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function FiltersTray({ onClose }: { onClose: () => void }) {
  const categories = ["Beauty", "Fun", "Background", "Brand"];
  const filters = ["Soft Glam", "Studio Glow", "Neon Night", "Clean Backdrop", "Brand Frame"];
  return (
    <div className="fixed inset-x-0 bottom-4 z-[70] flex justify-center px-3">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 shadow-xl px-3 py-2 md:px-4 md:py-3 bg-slate-950/95">
        <div className="flex items-center justify-between mb-2 text-[11px]">
          <span className="font-semibold inline-flex items-center gap-1">
            <span className="material-icons text-[14px] text-amber-500">auto_awesome</span>
            AR Filters
          </span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 overflow-x-auto max-w-[60%]">
              {categories.map((c) => (
                <span key={c} className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-200 text-[10px] whitespace-nowrap">
                  {c}
                </span>
              ))}
            </div>
            <button className="text-[10px] text-slate-300 hover:text-white" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f}
              className="min-w-[110px] rounded-xl bg-slate-800 border border-slate-600 flex flex-col items-center justify-center py-2 cursor-pointer hover:border-emerald-400"
              onClick={() => alert(`Applied filter: ${f} (demo)`)}
            >
              <div className="h-9 w-9 rounded-full bg-slate-700 mb-1" />
              <span className="text-[10px] text-center px-1 text-slate-100">{f}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FlashDealDialog(props: { onClose: () => void; onStart: (durationMin: number, discountPct: number) => void }) {
  const { onClose, onStart } = props;
  const [duration, setDuration] = useState(5);
  const [discount, setDiscount] = useState(15);
  const durationOptions = [5, 10, 15];

  return (
    <div className="fixed right-4 top-20 z-[70]">
      <div className="w-80 rounded-2xl border border-slate-800 bg-slate-950 shadow-xl px-4 py-3 text-[11px]">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-icons text-[16px]" style={{ color: EV_ORANGE }}>bolt</span>
            <div className="flex flex-col">
              <span className="text-[12px] font-semibold text-white">Flash Deal Control</span>
              <span className="text-[10px] text-slate-400">Countdown + urgency + buyer CTAs</span>
            </div>
          </div>
          <button className="text-[10px] text-slate-400 hover:text-white" onClick={onClose}>Close</button>
        </div>

        <p className="text-[11px] text-slate-300 mb-3">
          Start a limited-time offer. Discount applies to the currently featured product.
        </p>

        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[10px] text-slate-400">Duration</span>
          <div className="flex gap-1">
            {durationOptions.map((d) => (
              <button
                key={d}
                className={`px-2 py-0.5 rounded-full text-[10px] border ${duration === d ? "bg-white text-slate-900 border-white" : "bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800"}`}
                onClick={() => setDuration(d)}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="text-[10px] text-slate-400">Extra discount</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="w-14 px-2 py-1 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-[11px] outline-none"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            />
            <span className="text-[10px] text-slate-400">%</span>
          </div>
        </div>

        <button
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold text-white shadow-sm"
          style={{ backgroundColor: EV_ORANGE }}
          onClick={() => onStart(duration, discount)}
        >
          <span className="material-icons text-[14px]">play_arrow</span>
          Start flash deal
        </button>
      </div>
    </div>
  );
}

function LanguagePanel({ onClose, langMix }: { onClose: () => void; langMix: { label: string; pct: number }[] }) {
  return (
    <div className="fixed right-4 top-20 z-[70]">
      <div className="w-80 rounded-2xl border border-slate-800 bg-slate-950 shadow-xl px-4 py-3 text-[11px]">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-icons text-[16px] text-slate-200">translate</span>
            <span className="text-[12px] font-semibold text-white">Language & AI audio</span>
          </div>
          <button className="text-[10px] text-slate-400 hover:text-white" onClick={onClose}>Close</button>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-[10px] text-slate-400 mb-1">Live viewer language mix (sample)</div>
            <div className="flex flex-wrap gap-1">
              {langMix.map((s) => (
                <span key={s.label} className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] text-slate-100">
                  {s.label} · {s.pct}%
                </span>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-slate-400">
            Buyers choose their preferred language, and whether they hear AI audio or read captions.
          </p>
        </div>
      </div>
    </div>
  );
}

function ExpandedStageModal(props: {
  onClose: () => void;
  cameraHint: string;
  previewMode: PreviewMode;
  onChangePreviewMode: (m: PreviewMode) => void;
  resolvedPreviewMode: "mobile" | "desktop";
  liveTimerLabel: string;
  viewerCount: number;
  langMix: { label: string; pct: number }[];
  productionMode: ProductionMode;
  externalTool: ExternalTool;
  activeSourceId: SourceId;
  flash: FlashDealState;
  flashUrgency: string;
  currentSpeaker: CurrentSpeaker | null;
  speakerSecondsLeft: number;
}) {
  const {
    onClose,
    cameraHint,
    previewMode,
    onChangePreviewMode,
    resolvedPreviewMode,
    liveTimerLabel,
    viewerCount,
    langMix,
    productionMode,
    externalTool,
    activeSourceId,
    flash,
    flashUrgency,
    currentSpeaker,
    speakerSecondsLeft,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onFsChange = () => setIsFs(!!getFullscreenElement());
    document.addEventListener("fullscreenchange", onFsChange);
    // @ts-ignore
    document.addEventListener("webkitfullscreenchange", onFsChange);
    // @ts-ignore
    document.addEventListener("MSFullscreenChange", onFsChange);
    onFsChange();
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      // @ts-ignore
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      // @ts-ignore
      document.removeEventListener("MSFullscreenChange", onFsChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!containerRef.current) return;
      const fsEl = getFullscreenElement();
      if (fsEl) await exitFullscreen();
      else await requestFullscreen(containerRef.current);
    } catch (e) {
      console.warn("Fullscreen error", e);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Expanded preview</span>
            <span className="text-[11px] text-slate-300">{cameraHint}</span>
          </div>

          <div className="flex items-center gap-2">
            <PreviewModeToggle previewMode={previewMode} onChange={onChangePreviewMode} />
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-600 text-slate-100 hover:bg-slate-900 text-[11px]"
              onClick={toggleFullscreen}
              title="Uses the browser Fullscreen API"
            >
              <span className="material-icons text-[14px]">{isFs ? "fullscreen_exit" : "fullscreen"}</span>
              {isFs ? "Exit fullscreen" : "Fullscreen"}
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-600 text-slate-100 hover:bg-slate-900 text-[11px]"
              onClick={async () => {
                const fsEl = getFullscreenElement();
                if (fsEl) await exitFullscreen();
                onClose();
              }}
            >
              <span className="material-icons text-[14px]">close</span>
              Close
            </button>
          </div>
        </div>

        <div
          ref={containerRef}
          className="bg-slate-950 border border-slate-800 rounded-3xl p-3 shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
          onDoubleClick={toggleFullscreen}
        >
          <StagePreview
            resolvedPreviewMode={resolvedPreviewMode}
            activeSceneLabel="Expanded"
            liveTimerLabel={liveTimerLabel}
            viewerCount={viewerCount}
            langMix={langMix}
            source={sourceLabel(activeSourceId, productionMode, externalTool)}
            flash={flash}
            flashUrgency={flashUrgency}
            micOn={true}
            camOn={true}
            screenShareOn={false}
            currentSpeaker={currentSpeaker}
            speakerSecondsLeft={speakerSecondsLeft}
            onExpand={toggleFullscreen}
          />
          <div className="mt-3 text-[11px] text-slate-300 flex items-center justify-between">
            <span>Tip: double-click the preview to toggle fullscreen.</span>
            <span className="text-slate-500">ESC exits fullscreen</span>
          </div>
        </div>
      </div>
    </div>
  );
}
