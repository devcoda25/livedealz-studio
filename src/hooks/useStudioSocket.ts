'use client';

import { useEffect, useReducer, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { 
    StudioState, ChatMessage, S2C_StatsUpdate, FlashDeal, MomentMarker, S2C_ModeUpdate
} from '@/types/studio';

type Action =
  | { type: 'SET_INITIAL_STATE'; payload: StudioState }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MODE'; payload: S2C_ModeUpdate }
  | { type: 'UPDATE_STATS'; payload: S2C_StatsUpdate }
  | { type: 'UPDATE_FLASH_DEAL'; payload: FlashDeal }
  | { type: 'UPDATE_MOMENTS'; payload: MomentMarker[] }
  | { type: 'UPDATE_AI_PROMPTS'; payload: string[] };

const initialState: StudioState = {
  mode: 'lobby',
  startedAt: null,
  chat: { messages: [] },
  stats: { viewers: 0, sales: 0, connection: 'Excellent', bitrate: '... Mbps' },
  salesEvents: [],
  commerceGoal: { targetUnits: 50, soldUnits: 0, cartCount: 0, last5MinSales: 0 },
  flashDeal: { active: false, endsAt: null, discountPercent: 0, durationSeconds: 0 },
  momentMarkers: [],
  aiPrompts: [],
};

function studioReducer(state: StudioState, action: Action): StudioState {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
      return action.payload;
    case 'ADD_CHAT_MESSAGE':
      // Avoid duplicates on optimistic updates
      if (state.chat.messages.some(m => m.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        chat: {
          messages: [...state.chat.messages, action.payload].slice(-100),
        },
      };
    case 'UPDATE_MODE':
      return { ...state, mode: action.payload.mode, startedAt: action.payload.startedAt };
    case 'UPDATE_STATS':
      return { 
          ...state, 
          stats: action.payload.stats,
          salesEvents: action.payload.salesEvents,
          commerceGoal: action.payload.commerceGoal,
          startedAt: action.payload.startedAt,
        };
    case 'UPDATE_FLASH_DEAL':
      return { ...state, flashDeal: action.payload };
    case 'UPDATE_MOMENTS':
      return { ...state, momentMarkers: action.payload };
    case 'UPDATE_AI_PROMPTS':
        return { ...state, aiPrompts: action.payload };
    default:
      return state;
  }
}

export function useStudioSocket(studioId: string) {
  const socketRef = useRef<Socket | null>(null);
  const [state, dispatch] = useReducer(studioReducer, initialState);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:9002');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('studio:join', { studioId });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // S2C Listeners
    socket.on('studio:state', (payload: StudioState) => dispatch({ type: 'SET_INITIAL_STATE', payload }));
    socket.on('chat:new', (payload: ChatMessage) => dispatch({ type: 'ADD_CHAT_MESSAGE', payload }));
    socket.on('mode:update', (payload: S2C_ModeUpdate) => dispatch({ type: 'UPDATE_MODE', payload }));
    socket.on('stats:update', (payload: S2C_StatsUpdate) => dispatch({ type: 'UPDATE_STATS', payload }));
    socket.on('flash:update', (payload: FlashDeal) => dispatch({ type: 'UPDATE_FLASH_DEAL', payload }));
    socket.on('moments:update', (payload: { moments: MomentMarker[] }) => dispatch({ type: 'UPDATE_MOMENTS', payload: payload.moments }));
    socket.on('ai_prompts:update', (payload: { prompts: string[] }) => dispatch({ type: 'UPDATE_AI_PROMPTS', payload: payload.prompts }));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [studioId]);

  // C2S Emitters
  const sendChat = useCallback((body: string) => {
    socketRef.current?.emit('chat:send', { body });
  }, []);

  const setMode = useCallback((mode: 'live' | 'lobby') => {
    socketRef.current?.emit('live:setMode', { mode });
  }, []);

  const markMoment = useCallback((label?: string) => {
    socketRef.current?.emit('moment:mark', { label });
  }, []);

  const startFlashDeal = useCallback((durationSeconds: number, discountPercent: number) => {
    socketRef.current?.emit('flash:start', { durationSeconds, discountPercent });
  }, []);

  const stopFlashDeal = useCallback(() => {
    socketRef.current?.emit('flash:stop');
  }, []);
  
  const actions = {
    sendChat,
    setMode,
    markMoment,
    startFlashDeal,
    stopFlashDeal,
  };

  return { state, actions };
}
