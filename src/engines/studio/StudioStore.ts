import { Server as SocketIOServer } from 'socket.io';
import { StudioState, ChatMessage, FlashDeal } from './types';

// Initial State defaults
const initialState: StudioState = {
    live: false,
    viewers: 842, // Simulation baseline
    sales: 37,
    chat: [],
    flashDeal: {
        active: false,
        discountPct: 0,
        endsAt: null,
        productId: null,
    },
};

export class StudioStore {
    private state: StudioState = { ...initialState };
    private io: SocketIOServer | null = null;

    constructor() { }

    // Attach Socket.IO instance to enable broadcasting
    public attach(io: SocketIOServer) {
        this.io = io;
    }

    // Get current full state snapshot
    public getState(): StudioState {
        return this.state;
    }

    // Generic state update
    public update(partial: Partial<StudioState>) {
        this.state = { ...this.state, ...partial };
        this.broadcast('state:update', partial);
    }

    // Add chat message and trim history
    public addMessage(msg: ChatMessage) {
        this.state.chat = [...this.state.chat, msg].slice(-50); // Keep last 50
        this.broadcast('chat:new', msg);
    }

    // Manage Flash Deal state
    public setFlashDeal(deal: FlashDeal | null) {
        this.state.flashDeal = deal;
        this.broadcast('flash:update', deal);
    }

    // Internal broadcast helper
    private broadcast(event: string, data: any) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }
}

// Singleton instance
export const studioStore = new StudioStore();
