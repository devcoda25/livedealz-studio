
'use client';

import { useEffect, useReducer, useState, useCallback } from 'react';
import { StreamChat, Channel, Event } from 'stream-chat';
import type {
    StudioState, ChatMessage, Attachment, Mode, MomentMarker
} from '@/types/studio';
import { format } from 'date-fns';
import { formatTimer } from '@/lib/utils';

const USER_ID_CREATOR = 'live-dealz-creator';


type Action =
  | { type: 'SET_INITIAL_STATE'; payload: Partial<StudioState> }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_CUSTOM_STATE'; payload: Partial<StudioState> }
  | { type: 'ADD_ATTACHMENT'; payload: Attachment };

const initialState: StudioState = {
  mode: 'lobby',
  startedAt: null,
  chat: { messages: [] },
  stats: { viewers: 842, sales: 37, connection: 'Excellent', bitrate: '4.5 Mbps', timer: '00:00:00' },
  salesEvents: [
    { id: 1, label: 'Mary (Kampala) bought GlowUp Serum', time: '18:41' },
    { id: 2, label: '2x GlowUp bundles sold', time: '18:39' },
  ],
  commerceGoal: { targetUnits: 50, soldUnits: 37, cartCount: 12, last5MinSales: 5 },
  flashDeal: { active: false, endsAt: null, discountPercent: 0, durationSeconds: 0 },
  momentMarkers: [],
  aiPrompts: [
    "Chat asking about skin type match – address oily vs dry quickly.",
    "Viewers reacted strongly when you mentioned 'glow in 7 days' – lean into that angle.",
  ],
  attachments: [
    { id: 1, from: 'Viewer #238', type: 'image', label: 'Before/after photo', status: 'Pending' },
  ],
};

function studioReducer(state: StudioState, action: Action): StudioState {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
        return { ...state, ...action.payload };
    case 'UPDATE_CUSTOM_STATE':
        // Make sure to merge nested objects like chat correctly
        if (action.payload.chat) {
            return { 
                ...state, 
                ...action.payload,
                chat: { messages: [...state.chat.messages, ...action.payload.chat.messages].slice(-100) }
            };
        }
        return { ...state, ...action.payload };
    case 'ADD_CHAT_MESSAGE':
      // Prevent duplicate messages
      if (state.chat.messages.some(m => m.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        chat: {
          messages: [...state.chat.messages, action.payload].slice(-100),
        },
      };
    case 'ADD_ATTACHMENT':
        if(state.attachments.some(a => a.id === action.payload.id)) {
            return state;
        }
        return {
            ...state,
            attachments: [action.payload, ...state.attachments]
        }
    default:
      return state;
  }
}

async function fetchStreamToken(userId: string) {
    try {
        const response = await fetch('/api/stream-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch stream token');
        }
        const { token } = await response.json();
        return token;
    } catch (error) {
        console.error("Error fetching stream token:", error);
        return null;
    }
}


export function useStudioStream(channelId: string, apiKey: string) {
  const [state, dispatch] = useReducer(studioReducer, initialState);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    let chatClient: StreamChat;
    let currentChannel: Channel;

    async function initStream() {
      try {
        if (!apiKey) {
            console.error("Stream API key was not provided to useStudioStream hook.");
            setIsConnecting(false); 
            return;
        }

        chatClient = StreamChat.getInstance(apiKey);
        
        const userToken = await fetchStreamToken(USER_ID_CREATOR);
        if (!userToken) {
            setIsConnecting(false);
            return;
        }
        
        await chatClient.connectUser(
          { id: USER_ID_CREATOR, name: 'Live Dealz Creator' },
          userToken
        );
        
        currentChannel = chatClient.channel('livestream', channelId, {
            name: 'Live Dealz Studio',
        });
        
        // Using watch() is key to getting real-time updates and state
        const channelState = await currentChannel.watch();
        setChannel(currentChannel);
        
        // The channel's custom data is the source of truth
        const customState = currentChannel.data?.custom || {};
        dispatch({ type: 'SET_INITIAL_STATE', payload: customState as Partial<StudioState> });

        // Load existing messages
        const messages = channelState.messages.map((m): ChatMessage => ({
             id: m.id,
             from: m.user?.name || m.user?.id || 'Anonymous',
             body: m.text || '',
             time: format(m.created_at, 'HH:mm'),
             system: m.type === 'system',
        }));
        dispatch({ type: 'UPDATE_CUSTOM_STATE', payload: { chat: { messages } } });
        

      } catch (error) {
        console.error('Stream connection error:', error);
      } finally {
        setIsConnecting(false);
      }
    }

    initStream();

    const handleEvent = (event: Event) => {
        if (event.type === 'message.new' && event.message) {
            // This handles both regular chat and system messages for attachments
            if (event.message.for_moderation) {
                const attachmentData = event.message.attachments?.[0];
                if(attachmentData && event.message.user) {
                   const newAttachment: Attachment = {
                       id: Date.now(), // Use a temp ID, or derive from message ID
                       from: event.message.user.name || event.message.user.id,
                       type: attachmentData.type as 'image' | 'question',
                       label: attachmentData.title || 'New Attachment',
                       status: 'Pending',
                       // In a real app, you'd handle the file properly
                       file: { name: attachmentData.title || "file" } as File, 
                   };
                   dispatch({ type: 'ADD_ATTACHMENT', payload: newAttachment });
                }
            } else {
                const msg = event.message;
                const newChatMessage: ChatMessage = {
                    id: msg.id,
                    from: msg.user?.name || msg.user?.id || 'Anonymous',
                    body: msg.text || '',
                    time: format(msg.created_at, 'HH:mm'),
                    system: msg.type === 'system',
                };
                dispatch({ type: 'ADD_CHAT_MESSAGE', payload: newChatMessage });
            }
        } else if (event.type === 'channel.updated' && event.channel?.custom) {
            // This is the primary way we get state updates
            dispatch({ type: 'UPDATE_CUSTOM_STATE', payload: event.channel.custom as Partial<StudioState> });
        }
    };
    
    if (channel) {
        channel.on(handleEvent);
    }
    
    return () => {
      if (channel) {
        channel.off(handleEvent);
      }
      chatClient?.disconnectUser();
    };
  }, [channelId, apiKey, channel]);

  const updateChannelState = useCallback(async (newState: Partial<StudioState>) => {
    if (!channel) return;
    try {
      // Use updatePartial to merge with existing state
      await channel.updatePartial({ set: { ...newState } });
    } catch (error) {
      console.error('Failed to update channel state:', error);
    }
  }, [channel]);

  // --- ACTIONS ---

  const sendChat = useCallback(async (body: string) => {
    if (!channel || !body.trim()) return;
    await channel.sendMessage({ text: body.trim() });
  }, [channel]);

  const sendAttachment = useCallback(async (file: File) => {
    if (!channel) return;
    // First, upload the file to Stream's CDN
    const response = await channel.sendImage(file);
    
    // Then, send a message flagged for moderation. This won't appear in the main chat.
    await channel.sendMessage({
      text: `Attachment for approval: ${file.name}`,
      attachments: [{
          type: 'image',
          title: file.name,
          image_url: response.file,
          thumb_url: response.file,
      }],
      for_moderation: true, // Custom flag
      silent: true, // Don't trigger push notifications
      show_in_channel: false, // Don't show in main channel UI
    });

    // We also update the local state immediately for the moderator UI
    const newAttachment: Attachment = {
        id: Date.now(),
        from: 'You', // Since creator is sending it
        type: 'image',
        label: file.name,
        status: 'Pending',
        file,
    };
    dispatch({ type: 'ADD_ATTACHMENT', payload: newAttachment });

  }, [channel]);

  const setMode = useCallback((mode: Mode) => {
    const startedAt = mode === 'live' ? Date.now() : null;
    updateChannelState({ mode, startedAt });
  }, [updateChannelState]);

  const markMoment = useCallback((label?: string) => {
    const startedAt = state.startedAt;
    if (!startedAt) return;

    const elapsedSeconds = (Date.now() - startedAt) / 1000;
    const timestamp = formatTimer(elapsedSeconds);
    const newMarker: MomentMarker = {
        id: crypto.randomUUID(),
        time: timestamp,
        label: label || `Moment @ ${timestamp}`,
    };
    updateChannelState({ momentMarkers: [...state.momentMarkers, newMarker] });
  }, [state.startedAt, state.momentMarkers, updateChannelState]);

  const startFlashDeal = useCallback((durationSeconds: number, discountPercent: number) => {
    const flashDeal = {
        active: true,
        endsAt: Date.now() + durationSeconds * 1000,
        discountPercent,
        durationSeconds,
    };
    updateChannelState({ flashDeal });
  }, [updateChannelState]);

  const stopFlashDeal = useCallback(() => {
    updateChannelState({ flashDeal: { ...state.flashDeal, active: false } });
  }, [state.flashDeal, updateChannelState]);

  const moderateAttachment = useCallback((attachmentId: number, status: 'approved' | 'rejected') => {
    // This action would typically happen on a backend for security.
    // For the client-side simulation, we just remove it from the queue.
    const updatedAttachments = state.attachments.filter(a => a.id !== attachmentId);

    if (status === 'approved') {
        const approvedAttachment = state.attachments.find(a => a.id === attachmentId);
        if (approvedAttachment && channel) {
            // If approved, send a new message to the channel that IS visible
            channel.sendMessage({
                text: `Attachment from ${approvedAttachment.from}:`,
                attachments: [{
                    type: 'image',
                    title: approvedAttachment.label,
                    // In a real app, you'd have the URL from the moderation event
                    image_url: 'https://placehold.co/400x300/orange/white?text=Approved',
                    thumb_url: 'https://placehold.co/400x300/orange/white?text=Approved'
                }]
            });
        }
    }
    
    updateChannelState({ attachments: updatedAttachments });
  }, [state.attachments, updateChannelState, channel]);

  const actions = {
    sendChat,
    sendAttachment,
    setMode,
    markMoment,
    startFlashDeal,
    stopFlashDeal,
    moderateAttachment,
  };

  return { state, actions, isConnecting };
}
