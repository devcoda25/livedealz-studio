"use client";

import { useEffect, useReducer, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { StudioState, ChatMessage, FlashDeal } from "../engines/studio/types";

// Action Types
type Action =
    | { type: "SET_STATE"; payload: StudioState }
    | { type: "ADD_CHAT"; payload: ChatMessage }
    | { type: "UPDATE_FLASH"; payload: FlashDeal | null }
    | { type: "UPDATE_LIVE"; payload: boolean };

// Reducer
function reducer(state: StudioState, action: Action): StudioState {
    switch (action.type) {
        case "SET_STATE":
            return { ...action.payload };
        case "ADD_CHAT":
            return { ...state, chat: [...state.chat, action.payload].slice(-50) };
        case "UPDATE_FLASH":
            return { ...state, flashDeal: action.payload };
        case "UPDATE_LIVE":
            return { ...state, live: action.payload };
        default:
            return state;
    }
}

// Initial State (empty/loading)
const initialState: StudioState = {
    live: false,
    viewers: 0,
    sales: 0,
    chat: [],
    flashDeal: null,
};

export function useStudioSocket() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const socketRef = useRef<any>(null);

    useEffect(() => {
        // Initialize Socket
        const socket = io(); // Connects to same host/port by default
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Connected to studio socket");
            socket.emit("join"); // Join default room
        });

        socket.on("state:full", (fullState: StudioState) => {
            dispatch({ type: "SET_STATE", payload: fullState });
        });

        socket.on("chat:new", (msg: ChatMessage) => {
            dispatch({ type: "ADD_CHAT", payload: msg });
        });

        socket.on("flash:update", (deal: FlashDeal | null) => {
            dispatch({ type: "UPDATE_FLASH", payload: deal });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Actions
    const sendChat = (body: string, from: string) => {
        if (!socketRef.current) return;
        const msg: ChatMessage = {
            id: Date.now().toString(),
            from,
            body,
            time: new Date().toLocaleTimeString(),
            system: false,
        };
        // Optimistic update (optional, usually better to wait for echo)
        // dispatch({ type: 'ADD_CHAT', payload: msg });
        socketRef.current.emit("chat:message", msg);
    };

    const startFlash = (deal: FlashDeal) => {
        socketRef.current?.emit("flash:start", deal);
    };

    const stopFlash = () => {
        socketRef.current?.emit("flash:stop");
    };

    return {
        state,
        sendChat,
        startFlash,
        stopFlash,
    };
}
