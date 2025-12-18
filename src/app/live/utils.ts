import { CurrencyDef, LangCode, WholesaleTier } from "./data";

export function applyPhraseMap(lang: LangCode, input: string) {
    if (lang === "en") return input;
    const map: Record<LangCode, Record<string, string>> = {
        en: {},
        sw: {
            "Hair Oil": "Mafuta ya Nywele",
            Consultation: "Mashauriano",
            Service: "Huduma",
            "Waiting room": "Chumba cha kusubiri",
            Replay: "Marudio",
        },
        fr: {
            "Hair Oil": "Huile capillaire",
            Consultation: "Consultation",
            Service: "Service",
            "Waiting room": "Salle d’attente",
            Replay: "Replay",
        },
    };

    let out = input;
    const langMap = map[lang];
    if (!langMap) return out;

    for (const [k, v] of Object.entries(langMap)) {
        out = out.replaceAll(k, v);
    }
    return out;
}

export function findTier(tiers: WholesaleTier[] | undefined, qty: number) {
    if (!tiers || tiers.length === 0) return null;
    for (const t of tiers) {
        if (qty >= t.minQty && (t.maxQty == null || qty <= t.maxQty)) return t;
    }
    return tiers[0];
}

export function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

export function formatMoney(usd: number | undefined, currency: CurrencyDef) {
    if (typeof usd !== "number") return "-";
    const v = usd * currency.perUsd;
    const formatted = v.toLocaleString(undefined, {
        minimumFractionDigits: currency.decimals,
        maximumFractionDigits: currency.decimals,
    });
    return `${currency.code} ${formatted}`;
}

export function flagEmoji(code: string) {
    const cc = (code || "").toUpperCase();
    if (cc.length !== 2) return "🏳️";
    const A = 0x1f1e6;
    return cc
        .split("")
        .map((c) => String.fromCodePoint(A + (c.charCodeAt(0) - 65)))
        .join("");
}

export const shipsFromLabel = (shipFrom: { countryCode: string }) =>
    `Ships from ${flagEmoji(shipFrom.countryCode)} ${shipFrom.countryCode}`;

export function todayIso() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}
