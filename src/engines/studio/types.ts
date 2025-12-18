
export interface StudioState {
    live: boolean;
    viewers: number;
    sales: number;
    chat: ChatMessage[];
    flashDeal: FlashDeal | null;
}

export interface ChatMessage {
    id: string;
    from: string;
    body: string;
    time: string;
    system: boolean;
}

export interface FlashDeal {
    active: boolean;
    discountPct: number;
    endsAt: number | null;
    productId: string | null;
}
