import { Product, BuyerAgent } from "./types";

export const EV_GREEN = "#03cd8c";
export const EV_ORANGE = "#f77f00";

export const INITIAL_PRODUCTS: Product[] = [
    { id: "P-101", name: "GlowUp Serum - 30ml", basePrice: 24, currency: "USD", stock: 18, tag: "Hero product" },
    { id: "P-102", name: "GlowUp Cleanser", basePrice: 14, currency: "USD", stock: 26, tag: "Bundle with serum" },
    { id: "P-103", name: "GlowUp Night Cream", basePrice: 29, currency: "USD", stock: 9, tag: "Upsell after serum" },
];

export const INITIAL_BUYERS: BuyerAgent[] = [
    { id: "b1", name: "Buyer A", lang: "fr", listenMode: "ai_audio", carts: {}, reminders: {}, lastAction: "Joined", lastActionAt: Date.now() },
    { id: "b2", name: "Buyer B", lang: "sw", listenMode: "ai_captions", carts: {}, reminders: {}, lastAction: "Browsing", lastActionAt: Date.now() },
    { id: "b3", name: "Buyer C", lang: "ar", listenMode: "ai_audio", carts: {}, reminders: {}, lastAction: "Browsing", lastActionAt: Date.now() },
    { id: "b4", name: "Buyer D", lang: "en", listenMode: "original", carts: {}, reminders: {}, lastAction: "Browsing", lastActionAt: Date.now() },
    { id: "b5", name: "Buyer E", lang: "pt", listenMode: "ai_captions", carts: {}, reminders: {}, lastAction: "Browsing", lastActionAt: Date.now() },
];
