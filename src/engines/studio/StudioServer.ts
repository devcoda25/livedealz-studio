import { Server as SocketIOServer, Socket } from 'socket.io';
import { studioStore } from './StudioStore';
import { StudioState, ChatMessage, FlashDeal } from './types';

export class StudioServer {
    private io: SocketIOServer;

    constructor(io: SocketIOServer) {
        this.io = io;
        this.initialize();
    }

    private initialize() {
        // connect store to io for broadcasting
        studioStore.attach(this.io);

        this.io.on('connection', (socket: Socket) => {
            this.handleConnection(socket);
        });
    }

    private handleConnection(socket: Socket) {
        console.log(`[StudioEngine] Client connected: ${socket.id}`);

        // Send initial complete state
        socket.emit('state:full', studioStore.getState());

        // Event Handlers
        this.handleChat(socket);
        this.handleDeals(socket);

        socket.on('disconnect', () => {
            console.log(`[StudioEngine] Client disconnected: ${socket.id}`);
        });
    }

    private handleChat(socket: Socket) {
        socket.on('chat:message', (msg: ChatMessage) => {
            // In a real app, we'd validate the user (from token) here
            // For now, we trust the client 'from' field or assume logged in
            studioStore.addMessage(msg);
            // 'chat:new' is broadcasted by the store
        });
    }

    private handleDeals(socket: Socket) {
        socket.on('flash:start', (deal: FlashDeal) => {
            console.log(`[StudioEngine] Flash Deal Started: ${deal.discountPct}%`);
            studioStore.setFlashDeal(deal);
        });

        socket.on('flash:stop', () => {
            console.log(`[StudioEngine] Flash Deal Stopped`);
            studioStore.setFlashDeal(null);
        });
    }
}
