
import { Server, Socket } from 'socket.io';
import * as state from './state';
import * as schemas from './schemas';
import { formatTimer, getCountdownSeconds } from '@/lib/utils';
import { suggestLivePrompts } from '@/ai/flows/suggest-live-prompts';

const STUDIO_ROOM = 'studio-main';

export function initSocketServer(io: Server) {
  // --- STATS SIMULATION ---
  // Periodically simulate stats updates and broadcast them
  setInterval(() => {
    const updates = state.simulateStatsUpdate();
    if (updates) {
      io.to(STUDIO_ROOM).emit('stats:update', updates);
    }
  }, 3000); // every 3 seconds

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] A client connected: ${socket.id}`);

    // --- EVENT: studio:join ---
    socket.on('studio:join', (payload) => {
      const result = schemas.c2sJoinStudioSchema.safeParse(payload);
      if (!result.success) {
        console.error('[Socket.IO] Invalid studio:join payload', result.error);
        return;
      }
      
      socket.join(STUDIO_ROOM);
      console.log(`[Socket.IO] Client ${socket.id} joined room ${STUDIO_ROOM}`);

      // Send the current full state to the newly connected client
      socket.emit('studio:state', state.getStudioState());
    });

    // --- EVENT: chat:send ---
    socket.on('chat:send', async (payload) => {
      const result = schemas.c2sSendChatSchema.safeParse(payload);
      if (!result.success) return;

      const newMessage = state.addChatMessage('You (Creator)', result.data.body);

      // Broadcast new message to all clients in the room (except sender for non-creator messages)
      socket.broadcast.to(STUDIO_ROOM).emit('chat:new', newMessage);

      // Trigger AI prompt suggestion
      try {
        const currentState = state.getStudioState();
        const chatHistory = currentState.chat.messages
            .slice(-5)
            .map(m => `${m.from}: ${m.body}`)
            .join('\n');
            
        const response = await suggestLivePrompts({
            chatHistory,
            currentTopic: "Autumn Beauty Flash · GlowUp Hub",
            viewerSentiment: "Generally positive and inquisitive"
        });

        if (response?.promptSuggestions) {
            const newPrompts = state.updateAIPrompts(response.promptSuggestions);
            io.to(STUDIO_ROOM).emit('ai_prompts:update', { prompts: newPrompts });
        }
      } catch (error) {
        console.error('[AI] Failed to get prompt suggestions:', error);
      }
    });
    
    // --- EVENT: chat:attachment ---
    socket.on('chat:attachment', (payload) => {
        const result = schemas.c2sSendAttachmentSchema.safeParse(payload);
        if (!result.success) return;

        const newAttachment = state.addAttachment('Viewer #123', result.data.name, result.data.mimeType.startsWith('image') ? 'image' : 'question');
        const updatedAttachments = state.getStudioState().attachments;
        
        io.to(STUDIO_ROOM).emit('attachments:update', { attachments: updatedAttachments });
    });


    // --- EVENT: live:setMode ---
    socket.on('live:setMode', (payload) => {
        const result = schemas.c2sSetModeSchema.safeParse(payload);
        if (!result.success) return;

        const updates = state.setMode(result.data.mode);
        io.to(STUDIO_ROOM).emit('mode:update', updates);

        // If going live, also reset stats
        if (result.data.mode === 'live') {
            const initialStats = {
                stats: state.getStudioState().stats,
                salesEvents: state.getStudioState().salesEvents,
                commerceGoal: state.getStudioState().commerceGoal,
                startedAt: state.getStudioState().startedAt
            }
            io.to(STUDIO_ROOM).emit('stats:update', initialStats);
        }
    });

    // --- EVENT: moment:mark ---
    socket.on('moment:mark', (payload) => {
        const result = schemas.c2sMarkMomentSchema.safeParse(payload);
        if (!result.success) return;
        
        const startedAt = state.getStudioState().startedAt;
        if (!startedAt) return; // Can only mark moments when live

        const elapsedSeconds = (Date.now() - startedAt) / 1000;
        const timestamp = formatTimer(elapsedSeconds);

        const updatedMoments = state.addMomentMarker(timestamp, result.data.label);
        io.to(STUDIO_ROOM).emit('moments:update', { moments: updatedMoments });
    });

    // --- EVENT: flash:start ---
    socket.on('flash:start', (payload) => {
        const result = schemas.c2sStartFlashDealSchema.safeParse(payload);
        if (!result.success) return;

        const deal = state.startFlashDeal(result.data.durationSeconds, result.data.discountPercent);
        io.to(STUDIO_ROOM).emit('flash:update', deal);
    });

    // --- EVENT: flash:stop ---
    socket.on('flash:stop', () => {
        const deal = state.stopFlashDeal();
        io.to(STUDIO_ROOM).emit('flash:update', deal);
    });
    
    // --- EVENT: attachment:moderate ---
    socket.on('attachment:moderate', (payload) => {
        const result = schemas.c2sModerateAttachmentSchema.safeParse(payload);
        if (!result.success) return;

        const updatedAttachments = state.moderateAttachment(result.data.attachmentId, result.data.status);
        if (updatedAttachments) {
            io.to(STUDIO_ROOM).emit('attachments:update', { attachments: updatedAttachments });
        }
    });


    // --- DISCONNECT ---
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] A client disconnected: ${socket.id}`);
    });
  });
}
