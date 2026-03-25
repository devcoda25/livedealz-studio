export type Mode = "lobby" | "rehearsal" | "live";
export type PreviewMode = "auto" | "desktop" | "mobile";
export type AudienceTab = "chat" | "qa" | "viewers" | "polls";
export type ProductionMode = "inapp" | "external";
export type ExternalTool = "OBS" | "vMix";
export type SourceId = "cam1" | "cam2" | "screen" | "obs" | "vmix";

export type FilterCategory = {
    id: string;
    label: string;
    filters: { label: string; style: string; icon: string }[];
};

export type ViewerLang = "en" | "fr" | "sw" | "ar" | "pt";
export type ListenMode = "original" | "ai_audio" | "ai_captions";

export type Product = {
    id: string;
    name: string;
    basePrice: number;
    currency: "USD";
    stock: number;
    tag: string;
};

export type BuyerAgent = {
    id: string;
    name: string;
    lang: ViewerLang;
    listenMode: ListenMode;
    carts: Record<string, number>; // productId -> qty
    reminders: Record<string, true>; // productId -> subscribed
    lastAction?: string;
    lastActionAt?: number;
};

export type LiveViewer = {
    id: string;
    name: string;
    lang: ViewerLang;
    listenMode: ListenMode;
    joinedAt: number;
};

export type ChatMsg = {
    id: string;
    from: string;
    body: string;
    time: string;
    system?: boolean;
    langTag?: string;
};

export type SaleEvent = {
    id: string;
    label: string;
    time: string;
    amount?: string;
    langTag?: string;
};

export type AiHint = {
    id: string;
    text: string;
    time: string;
    severity: "info" | "opportunity" | "warning";
};

export type QaItem = {
    id: string;
    question: string;
    from: string;
    status: "unanswered" | "pinned" | "answered";
    langTag?: string;
    createdAt: number;
};

export type PollOption = {
    id: string;
    text: string;
    votes: number;
};

export type LivePoll = {
    id: string;
    question: string;
    options: PollOption[];
    totalVotes: number;
    isActive: boolean;
    endsAt: number | null;
    createdAt: number;
};

export type AudioRequest = {
    id: string;
    viewerId: string;
    viewerName: string;
    langTag: string;
    time: string;
    status: "pending" | "accepted" | "declined" | "ended";
};

export type CurrentSpeaker = {
    requestId: string;
    viewerName: string;
    langTag: string;
    endsAt: number;
};

export type FlashDealState = {
    active: boolean;
    discountPct: number;
    endsAt: number | null;
    totalSeconds: number;
    secondsLeft: number;
    productId: string | null; // targeted product
};

import { SCENE_PRESETS } from "../../../engines/SceneEngine";

export const SCENES = SCENE_PRESETS;

export type SceneId = (typeof SCENES)[number]["id"];
