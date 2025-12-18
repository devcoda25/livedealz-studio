import { useState, useEffect } from "react";
import { AiHint, ViewerLang, ListenMode, BuyerAgent, SourceId, ProductionMode, ExternalTool, LiveViewer } from "./types";

export async function mockTranslate(text: string, targetLang: ViewerLang): Promise<string> {
    if (targetLang === "en") return text;

    // Simple simulator
    const prefix = `[${targetLang.toUpperCase()}] `;
    // We could use a dictionary here for demo words
    const dict: Record<string, Record<string, string>> = {
        fr: { "hello": "bonjour", "price": "prix", "buy": "acheter", "discount": "remise" },
        es: { "hello": "hola", "price": "precio", "buy": "comprar", "discount": "descuento" },
        // ...
    };

    // Very naive word replacement
    const lower = text.toLowerCase();
    let translated = lower;
    if (dict[targetLang]) {
        Object.entries(dict[targetLang]).forEach(([k, v]) => {
            translated = translated.replace(new RegExp(k, "g"), v);
        });
    }

    return prefix + translated;
}

export function createInitialViewers(): LiveViewer[] {
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

export function sourceLabel(id: SourceId, pm: ProductionMode, et: ExternalTool) {
    if (pm === "external") return et === "OBS" ? "OBS Virtual" : "vMix Output";
    const map: Record<SourceId, string> = {
        cam1: "Camera 1",
        cam2: "Camera 2",
        screen: "Screen Share",
        obs: "OBS",
        vmix: "vMix",
    };
    return map[id] || "Unknown";
}

export function uid(prefix: string) {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function pad2(n: number) {
    return n.toString().padStart(2, "0");
}

export function nowTimeLabel() {
    const d = new Date();
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatHMS(totalSeconds: number) {
    const s = Math.max(0, totalSeconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return h > 0 ? `${pad2(h)}:${pad2(m)}:${pad2(ss)}` : `${pad2(m)}:${pad2(ss)}`;
}

export function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function fmtMoneyUSD(n: number) {
    return `$${n.toFixed(2)}`;
}

export function buyerCartCount(b: BuyerAgent) {
    return Object.values(b.carts).reduce((a, v) => a + v, 0);
}

export function buyerReminderCount(b: BuyerAgent) {
    return Object.keys(b.reminders).length;
}

export function langTag(lang: ViewerLang, mode: ListenMode) {
    if (mode === "original") return "EN original";
    if (mode === "ai_audio") return `${lang.toUpperCase()} audio`;
    return `${lang.toUpperCase()} captions`;
}

export function severityPillClass(sev: AiHint["severity"]) {
    if (sev === "warning") return "border-orange-500/60 text-orange-200 bg-orange-500/10";
    if (sev === "opportunity") return "border-emerald-500/60 text-emerald-200 bg-emerald-500/10";
    return "border-slate-700 text-slate-300 bg-slate-900";
}

export function computeUrgency(secondsLeft: number) {
    if (secondsLeft <= 20) return "critical";
    if (secondsLeft <= 60) return "high";
    return "normal";
}

export function isMobileUA() {
    if (typeof navigator === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function useDeviceKind(): "mobile" | "desktop" {
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

export function requestFullscreen(el: HTMLElement) {
    const anyEl = el as any;
    const doc: any = document as any;
    if (anyEl.requestFullscreen) return anyEl.requestFullscreen();
    if (anyEl.webkitRequestFullscreen) return anyEl.webkitRequestFullscreen();
    if (anyEl.msRequestFullscreen) return anyEl.msRequestFullscreen();
    if (doc?.documentElement?.webkitRequestFullscreen) return doc.documentElement.webkitRequestFullscreen();
    return Promise.resolve();
}

export function getFullscreenElement() {
    if (typeof document === 'undefined') return null;
    const doc = document as any;
    return (
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
    );
}

export async function exitFullscreen() {
    const doc = document as any;
    if (doc.exitFullscreen) return doc.exitFullscreen();
    if (doc.webkitExitFullscreen) return doc.webkitExitFullscreen();
    if (doc.mozCancelFullScreen) return doc.mozCancelFullScreen();
    if (doc.msExitFullscreen) return doc.msExitFullscreen();
}
