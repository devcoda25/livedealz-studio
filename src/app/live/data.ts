export type BuyerMode = "retail" | "wholesale";
export type ViewerAuth = "guest" | "loggedIn";
export type SessionState = "liveNow" | "upcoming" | "replay";
export type LiveAudience = "retail" | "wholesale" | "mixed";
export type PanelTab = "products" | "chat" | "info";
export type ItemFilter = "all" | "products" | "services" | "retail" | "wholesale";
export type PackType = "Unit" | "Pack" | "Carton" | "Pallet";
export type RegulatedDesk = "Med" | "Edu" | "Faith";
export type LangCode = "en" | "sw" | "fr";
export type CurrencyCode = "USD" | "UGX" | "KES" | "TZS" | "EUR";

export type CurrencyDef = {
    code: CurrencyCode;
    label: string;
    perUsd: number;
    decimals: number;
};

export type WholesaleTier = {
    label: string;
    minQty: number;
    maxQty?: number;
    unitPrice: number;
};

export type ShipFrom = { countryCode: "CN" };

export type LiveProductItem = {
    kind: "product";
    id: string;
    title: string;
    thumbnailUrl: string;
    type: "retail" | "wholesale" | "mixed";
    category: string;
    shipFrom: ShipFrom;
    // retail pricing (USD base)
    retailOriginal?: number;
    retailPromo?: number;
    discountPct?: number;
    // inventory
    stockLeft?: number;
    stockTotal?: number;
    urgency?: string;
    countdown?: string;
    liveOnlyPrice?: boolean;
    isBundle?: boolean;
    // wholesale (USD base)
    wholesaleOnly?: boolean;
    alsoRetail?: boolean;
    moqLabel?: string;
    packType?: PackType;
    leadTime?: string;
    tiers?: WholesaleTier[];
    b2bNote?: string;
    // replay
    expired?: boolean;
};

export type ServiceMode = "Remote" | "On-site" | "Hybrid";
export type ConsultationMode = "onDemand" | "scheduled";
export type ServicePricingModel = "fixed" | "quote";

export type LiveServiceItem = {
    kind: "service";
    id: string;
    title: string;
    thumbnailUrl: string;
    category: string;
    providerName: string;
    rating?: number;
    serviceMode: ServiceMode;
    duration: string;
    nextAvailability: string;
    citiesCovered?: string[];
    limitedSeatsLabel?: string;
    // pricing (USD base)
    fromUsd?: number;
    servicePricingModel: ServicePricingModel;
    freeAssessment?: boolean;
    // service type
    serviceType: "service" | "consultation";
    consultationMode?: ConsultationMode;
    // wholesale/corporate packages (optional)
    b2bAvailable?: boolean;
    packages?: { label: string; priceUsd: number; minSeatsOrHours?: string }[];
    // cues
    bookAfterLive?: boolean;
};

export type LiveItem = LiveProductItem | LiveServiceItem;

export type ChatMessage = {
    id: string;
    author: string;
    role?: "host" | "mod" | "viewer" | "system";
    text: string;
    ts: string;
    type?: "text" | "qa" | "system";
};

export type Poll = {
    id: string;
    question: string;
    options: { id: string; label: string; votes: number }[];
};

export type HostInfo = {
    seller: {
        name: string;
        rating: number;
        sellerType: "Retail" | "Wholesale" | "Both";
    };
    creator?: {
        name: string;
        handle: string;
        level: "Bronze" | "Silver" | "Gold" | "Platinum";
        niches: string[];
        avgViewers: number;
        salesInfluence: string;
    };
};

export type LiveSession = {
    id: string;
    title: string;
    description: string;
    language: string; // original
    category: string;
    state: SessionState;
    audience: LiveAudience;
    viewers?: number;
    startsIn?: string;
    flashDeal?: { label: string; timeLeft: string; extraPct: number };
    liveTypeChips?: string[];
    regulated?: {
        desk: RegulatedDesk;
        badge: string;
        disclaimer: string;
        pinnedSafetyMessage: string;
    };
    hosts: { hostInfo: HostInfo; cohosted: boolean };
    items: LiveItem[];
    linkedDealz: { label: string; href: string }[];
};

export type LiveOverride = {
    displayLang: LangCode;
    audioLang: LangCode;
    currencyCode: CurrencyCode;
    voiceTranslationOn: boolean;
    captionsOn: boolean;
    translateChatOn: boolean;
};

export const SAMPLE_SESSIONS: LiveSession[] = [
    {
        id: "sess-live-mixed",
        title: "Hair Care Mega Live",
        description: "Ask questions, see demos, and shop retail or wholesale in real time. Plus book consultations after the live.",
        language: "EN",
        category: "Beauty & Skincare",
        state: "liveNow",
        audience: "mixed",
        viewers: 2480,
        flashDeal: { label: "FLASH DEAL", timeLeft: "05:10", extraPct: 10 },
        liveTypeChips: ["Product demo", "Consultation live", "Book after live"],
        hosts: {
            cohosted: true,
            hostInfo: {
                seller: { name: "BeautyCo", rating: 4.7, sellerType: "Both" },
                creator: {
                    name: "Anna Beauty",
                    handle: "@AnnaBeauty",
                    level: "Gold",
                    niches: ["Beauty", "Skincare"],
                    avgViewers: 3200,
                    salesInfluence: "$920k driven",
                },
            },
        },
        items: [
            {
                kind: "product",
                id: "p1",
                title: "Hair Oil 100ml (Live-only price)",
                thumbnailUrl: "https://images.pexels.com/photos/3738341/pexels-photo-3738341.jpeg?auto=compress&cs=tinysrgb&w=800",
                type: "mixed",
                category: "Hair",
                shipFrom: { countryCode: "CN" },
                retailOriginal: 10,
                retailPromo: 7,
                discountPct: 30,
                stockLeft: 8,
                stockTotal: 40,
                urgency: "Only 8 left",
                countdown: "Ends in 06:24",
                liveOnlyPrice: true,
                wholesaleOnly: false,
                alsoRetail: true,
                moqLabel: "MOQ 50 units",
                packType: "Unit",
                leadTime: "Ready to ship in 3 days",
                tiers: [
                    { label: "50–199", minQty: 50, maxQty: 199, unitPrice: 0.95 },
                    { label: "200+", minQty: 200, unitPrice: 0.85 },
                ],
                b2bNote: "Volume discount at 200+",
            },
            {
                kind: "product",
                id: "p2",
                title: "Hydrating Skincare Set",
                thumbnailUrl: "https://images.pexels.com/photos/3738340/pexels-photo-3738340.jpeg?auto=compress&cs=tinysrgb&w=800",
                type: "retail",
                category: "Skincare",
                shipFrom: { countryCode: "CN" },
                retailOriginal: 99,
                retailPromo: 69,
                discountPct: 30,
                stockLeft: 2,
                stockTotal: 60,
                urgency: "Low stock",
                countdown: "Flash 12:10",
                isBundle: true,
            },
            {
                kind: "product",
                id: "p3",
                title: "Hair Oil Case Pack (Carton of 24)",
                thumbnailUrl: "https://images.pexels.com/photos/6170450/pexels-photo-6170450.jpeg?auto=compress&cs=tinysrgb&w=800",
                type: "wholesale",
                category: "Salon",
                shipFrom: { countryCode: "CN" },
                wholesaleOnly: true,
                alsoRetail: false,
                moqLabel: "MOQ 3 cartons (72 units)",
                packType: "Carton",
                leadTime: "Ready to ship in 5 days",
                tiers: [
                    { label: "3–4 cartons", minQty: 3, maxQty: 4, unitPrice: 2.9 },
                    { label: "5+ cartons", minQty: 5, unitPrice: 2.6 },
                ],
                b2bNote: "Pre-book next season",
            },
            {
                kind: "service",
                id: "s1",
                title: "Salon Consultation: Hair & Scalp Check (30 mins)",
                thumbnailUrl: "https://images.pexels.com/photos/3184431/pexels-photo-3184431.jpeg?auto=compress&cs=tinysrgb&w=800",
                category: "Beauty Services",
                providerName: "Glow Hair Clinic",
                rating: 4.8,
                serviceMode: "On-site",
                duration: "30 mins",
                nextAvailability: "Today · 16:00",
                citiesCovered: ["Kampala", "Entebbe"],
                limitedSeatsLabel: "Limited slots",
                fromUsd: 18,
                servicePricingModel: "fixed",
                serviceType: "consultation",
                consultationMode: "scheduled",
                bookAfterLive: true,
                b2bAvailable: false,
            },
            {
                kind: "service",
                id: "s2",
                title: "On-demand Live Consult: Store Setup Review (15 mins)",
                thumbnailUrl: "https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=800",
                category: "eCommerce Enablement",
                providerName: "Spark Creative Studio",
                rating: 4.7,
                serviceMode: "Remote",
                duration: "15 mins",
                nextAvailability: "Available now",
                citiesCovered: ["Remote"],
                limitedSeatsLabel: "Limited seats",
                fromUsd: 25,
                servicePricingModel: "fixed",
                serviceType: "consultation",
                consultationMode: "onDemand",
                bookAfterLive: true,
                b2bAvailable: true,
                packages: [
                    { label: "5 consults", priceUsd: 105, minSeatsOrHours: "min 5/month" },
                    { label: "12 consults", priceUsd: 228, minSeatsOrHours: "min 12/month" },
                ],
            },
            {
                kind: "service",
                id: "s4",
                title: "On-site: Painting Service (Assessment + Quote)",
                thumbnailUrl: "https://images.pexels.com/photos/585419/pexels-photo-585419.jpeg?auto=compress&cs=tinysrgb&w=800",
                category: "Construction & Engineering",
                providerName: "Prime Painters",
                rating: 4.6,
                serviceMode: "On-site",
                duration: "Varies",
                nextAvailability: "This week",
                citiesCovered: ["Kampala", "Entebbe"],
                limitedSeatsLabel: "Free assessment",
                fromUsd: 0,
                servicePricingModel: "quote",
                freeAssessment: true,
                serviceType: "service",
                bookAfterLive: true,
            },
        ],
        linkedDealz: [
            { label: "Main Promo Adz", href: "/dealz/promo-001" },
            { label: "Deal details", href: "/deal/deal-dual-1" },
        ],
    },
    {
        id: "sess-upcoming-b2b",
        title: "B2B Line Show: Hair Oil Packs",
        description: "Wholesale line presentation and MOQ packs for resellers. Book supplier support sessions after the show.",
        language: "EN",
        category: "Beauty & Skincare",
        state: "upcoming",
        audience: "wholesale",
        startsIn: "05:32",
        liveTypeChips: ["Booking live", "B2B line show"],
        hosts: {
            cohosted: false,
            hostInfo: {
                seller: { name: "WholesaleHub", rating: 4.5, sellerType: "Wholesale" },
            },
        },
        items: [
            {
                kind: "product",
                id: "b1",
                title: "Hair Oil Case Pack (Carton of 24)",
                thumbnailUrl: "https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&w=800",
                type: "wholesale",
                category: "Salon",
                shipFrom: { countryCode: "CN" },
                wholesaleOnly: true,
                moqLabel: "MOQ 3 cartons (72 units)",
                packType: "Carton",
                leadTime: "Ready to ship in 5 days",
                tiers: [
                    { label: "3–4 cartons", minQty: 3, maxQty: 4, unitPrice: 2.9 },
                    { label: "5+ cartons", minQty: 5, unitPrice: 2.6 },
                ],
                b2bNote: "Line show pricing",
            },
            {
                kind: "service",
                id: "s3",
                title: "Supplier Support Call: MOQ Planning (20 mins)",
                thumbnailUrl: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800",
                category: "Wholesale Support",
                providerName: "WholesaleHub Support",
                rating: 4.6,
                serviceMode: "Remote",
                duration: "20 mins",
                nextAvailability: "Tomorrow · 11:00",
                citiesCovered: ["Remote"],
                fromUsd: 12,
                servicePricingModel: "fixed",
                serviceType: "service",
                bookAfterLive: true,
                b2bAvailable: true,
                packages: [
                    { label: "Monthly (4 calls)", priceUsd: 40, minSeatsOrHours: "min 4/month" },
                    { label: "Monthly (10 calls)", priceUsd: 85, minSeatsOrHours: "min 10/month" },
                ],
            },
        ],
        linkedDealz: [{ label: "Main Promo Adz", href: "/dealz/promo-002" }],
    },
    {
        id: "sess-replay-med",
        title: "Hygiene Pack Replay",
        description: "Replay of a regulated session. Deals may be limited.",
        language: "EN",
        category: "Medical & Health",
        state: "replay",
        audience: "mixed",
        liveTypeChips: ["Product demo"],
        hosts: {
            cohosted: false,
            hostInfo: {
                seller: { name: "MedSupply", rating: 4.4, sellerType: "Wholesale" },
            },
        },
        regulated: {
            desk: "Med",
            badge: "Med Desk Approved",
            disclaimer: "Medical content is not a substitute for professional advice. Follow all local regulations.",
            pinnedSafetyMessage: "Safety: This stream discusses regulated products. Do not self-prescribe. Seek professional guidance where appropriate.",
        },
        items: [
            {
                kind: "product",
                id: "m1",
                title: "OTC Hygiene Pack",
                thumbnailUrl: "https://images.pexels.com/photos/7615466/pexels-photo-7615466.jpeg?auto=compress&cs=tinysrgb&w=800",
                type: "wholesale",
                category: "Hygiene",
                shipFrom: { countryCode: "CN" },
                wholesaleOnly: true,
                moqLabel: "MOQ 2 cartons",
                packType: "Carton",
                leadTime: "Ready to ship in 3 days",
                tiers: [
                    { label: "2–4 cartons", minQty: 2, maxQty: 4, unitPrice: 1.9 },
                    { label: "5+ cartons", minQty: 5, unitPrice: 1.7 },
                ],
                b2bNote: "Compliance docs available",
            },
            {
                kind: "product",
                id: "m2",
                title: "Expired sample deal",
                thumbnailUrl: "https://images.pexels.com/photos/7615466/pexels-photo-7615466.jpeg?auto=compress&cs=tinysrgb&w=800",
                type: "retail",
                category: "Hygiene",
                shipFrom: { countryCode: "CN" },
                retailOriginal: 12,
                retailPromo: 9,
                discountPct: 25,
                expired: true,
            },
        ],
        linkedDealz: [{ label: "Main Promo Adz", href: "/dealz/promo-003" }],
    },
];

export const LANGS: { code: LangCode; label: string; native: string }[] = [
    { code: "en", label: "English", native: "English" },
    { code: "sw", label: "Swahili", native: "Kiswahili" },
    { code: "fr", label: "French", native: "Français" },
];

export const CURRENCIES: CurrencyDef[] = [
    { code: "USD", label: "US Dollar", perUsd: 1, decimals: 2 },
    { code: "UGX", label: "Ugandan Shilling", perUsd: 3800, decimals: 0 },
    { code: "KES", label: "Kenyan Shilling", perUsd: 160, decimals: 0 },
    { code: "TZS", label: "Tanzanian Shilling", perUsd: 2600, decimals: 0 },
    { code: "EUR", label: "Euro", perUsd: 0.92, decimals: 2 },
];

export const I18N: Record<LangCode, Record<string, string>> = {
    en: {
        products: "Products",
        chat: "Chat",
        hostInfo: "Host Info",
        buyNow: "Buy Now",
        addToCart: "Add to cart",
        view: "View",
        pin: "Pin",
        pinned: "Pinned",
        retail: "Retail",
        wholesale: "Wholesale",
        all: "All",
        live: "LIVE",
        replay: "Replay",
        waitingRoom: "Waiting room",
        startsIn: "Starts in",
        message: "Message",
        question: "Question",
        setReminder: "Set reminder",
        addToCalendar: "Add to calendar",
        viewRetail: "View retail",
        viewWholesale: "View wholesale",
        wholesaleLocked: "Wholesale pricing locked",
        preferences: "Language & Currency",
        audioLanguage: "Audio language",
        displayLanguage: "Display language",
        audio: "Audio",
        captions: "Captions",
        translateChat: "Translate chat",
        currency: "Currency",
        language: "Language",
        original: "Original",
        reportStream: "Report stream",
        hideChat: "Hide chat",
        showChat: "Show chat",
        poll: "Poll",
        vote: "Vote",
        services: "Services",
        requestBooking: "Request booking",
        requestQuote: "Request quote",
        freeAssessment: "Free assessment",
        bookSlot: "Book slot",
        startNow: "Request start now",
        consultation: "Consultation",
        service: "Service",
        bookAfterLive: "Book after live",
        shipsFrom: "Ships from",
        outOfStock: "Out of stock",
        remindMe: "Remind me",
        reminding: "Reminding",
        useShellDefaults: "Use shell defaults",
        liveOverride: "Live override",
        resetToShell: "Reset to shell",
        category: "Category",
        audience: "Audience",
        sessionInfo: "Session Info",
    },
    sw: {
        products: "Bidhaa",
        chat: "Soga",
        hostInfo: "Taarifa",
        buyNow: "Nunua sasa",
        addToCart: "Weka kwenye kikapu",
        view: "Tazama",
        pin: "Bandika",
        pinned: "Iliyobandikwa",
        retail: "Rejareja",
        wholesale: "Jumla",
        all: "Zote",
        live: "MOJA KWA MOJA",
        replay: "Marudio",
        waitingRoom: "Chumba cha kusubiri",
        startsIn: "Itaanza baada ya",
        message: "Ujumbe",
        question: "Swali",
        setReminder: "Weka kikumbusho",
        addToCalendar: "Ongeza kalenda",
        viewRetail: "Tazama rejareja",
        viewWholesale: "Tazama jumla",
        wholesaleLocked: "Bei za jumla zimefungwa",
        preferences: "Lugha & Sarafu",
        audioLanguage: "Lugha ya sauti",
        displayLanguage: "Lugha ya UI",
        audio: "Sauti",
        captions: "Manukuu",
        translateChat: "Tafsiri soga",
        currency: "Sarafu",
        language: "Lugha",
        original: "Asili",
        reportStream: "Ripoti live",
        hideChat: "Ficha soga",
        showChat: "Onyesha soga",
        poll: "Kura",
        vote: "Piga kura",
        services: "Huduma",
        requestBooking: "Weka nafasi",
        requestQuote: "Omba bei",
        freeAssessment: "Ukaguzi bure",
        bookSlot: "Weka nafasi",
        startNow: "Anza sasa",
        consultation: "Mashauriano",
        service: "Huduma",
        bookAfterLive: "Weka nafasi baada ya live",
        shipsFrom: "Hutoka",
        outOfStock: "Haipo",
        remindMe: "Nikumbushe",
        reminding: "Inakukumbusha",
        useShellDefaults: "Tumia mipangilio ya shell",
        liveOverride: "Mabadiliko ya live",
        resetToShell: "Rudisha shell",
        category: "Kategoria",
        audience: "Watazamaji",
        sessionInfo: "Taarifa za Kipindi",
    },
    fr: {
        products: "Produits",
        chat: "Chat",
        hostInfo: "Infos",
        buyNow: "Acheter",
        addToCart: "Ajouter au panier",
        view: "Voir",
        pin: "Épingler",
        pinned: "Épinglé",
        retail: "Détail",
        wholesale: "Gros",
        all: "Tous",
        live: "EN DIRECT",
        replay: "Replay",
        waitingRoom: "Salle d’attente",
        startsIn: "Commence dans",
        message: "Message",
        question: "Question",
        setReminder: "Rappel",
        addToCalendar: "Ajouter au calendrier",
        viewRetail: "Voir détail",
        viewWholesale: "Voir gros",
        wholesaleLocked: "Tarifs de gros verrouillés",
        preferences: "Langue & Devise",
        audioLanguage: "Langue audio",
        displayLanguage: "Langue UI",
        audio: "Audio",
        captions: "Sous-titres",
        translateChat: "Traduire le chat",
        currency: "Devise",
        language: "Langue",
        original: "Original",
        reportStream: "Signaler le live",
        hideChat: "Masquer le chat",
        showChat: "Afficher le chat",
        poll: "Sondage",
        vote: "Voter",
        services: "Services",
        requestBooking: "Réserver",
        requestQuote: "Demander un devis",
        freeAssessment: "Évaluation gratuite",
        bookSlot: "Réserver un créneau",
        startNow: "Démarrer",
        consultation: "Consultation",
        service: "Service",
        bookAfterLive: "Réserver après le live",
        shipsFrom: "Expédié depuis",
        outOfStock: "Rupture",
        remindMe: "Me prévenir",
        reminding: "Prévenu",
        useShellDefaults: "Utiliser le shell",
        liveOverride: "Override live",
        resetToShell: "Réinitialiser",
        category: "Catégorie",
        audience: "Audience",
        sessionInfo: "Infos session",
    },
};
