import type { StudioState } from '@/types/studio';
import { format } from 'date-fns';

// In-memory "database" for the studio state.
let studioState: StudioState = {
  mode: 'lobby',
  startedAt: null,
  chat: {
    messages: [
      { id: '1', from: 'Viewer #238', body: 'Is this serum okay for oily skin?', time: '18:42' },
      { id: '2', from: 'Viewer #102', body: 'Can you show the texture again?', time: '18:43' },
      { id: '3', from: 'System', body: '5 new viewers joined from Nairobi.', time: '18:44', system: true },
    ],
  },
  stats: {
    viewers: 842,
    sales: 37,
    connection: 'Excellent',
    bitrate: '4.5 Mbps',
  },
  salesEvents: [
    { id: 1, label: 'Mary (Kampala) bought GlowUp Serum', time: '18:41' },
    { id: 2, label: '2x GlowUp bundles sold', time: '18:39' },
    { id: 3, label: 'Viewer from Nairobi added Serum to cart', time: '18:38' },
  ],
  commerceGoal: {
    targetUnits: 50,
    soldUnits: 37,
    cartCount: 12,
    last5MinSales: 5,
  },
  flashDeal: {
    active: false,
    endsAt: null,
    discountPercent: 0,
    durationSeconds: 0,
  },
  momentMarkers: [],
  aiPrompts: [
    "Chat asking about skin type match – address oily vs dry quickly.",
    "Viewers reacted strongly when you mentioned 'glow in 7 days' – lean into that angle.",
    "Consider a quick poll: 'Serum vs Cream – what do you want to see next?'.",
    "Average watch time is spiking when you show before/after – keep visuals on screen.",
  ],
};

export function getStudioState(): StudioState {
  return { ...studioState };
}

export function setMode(mode: 'live' | 'lobby') {
  studioState.mode = mode;
  if (mode === 'live') {
    if (!studioState.startedAt) {
      studioState.startedAt = Date.now();
    }
  } else {
    // Reset on going back to lobby
    studioState.startedAt = null;
    studioState.flashDeal = { active: false, endsAt: null, discountPercent: 0, durationSeconds: 0 };
  }
  return { mode: studioState.mode, startedAt: studioState.startedAt };
}

export function addChatMessage(from: string, body: string) {
  const newMessage = {
    id: crypto.randomUUID(),
    from,
    body,
    time: format(new Date(), 'HH:mm'),
  };
  studioState.chat.messages.push(newMessage);
  if (studioState.chat.messages.length > 100) {
    studioState.chat.messages.shift();
  }
  return newMessage;
}

export function addMomentMarker(time: string, label?: string) {
  const newMarker = {
    id: crypto.randomUUID(),
    time,
    label: label || `Moment @ ${time}`,
  };
  studioState.momentMarkers.push(newMarker);
  return studioState.momentMarkers;
}

export function startFlashDeal(durationSeconds: number, discountPercent: number) {
  studioState.flashDeal = {
    active: true,
    endsAt: Date.now() + durationSeconds * 1000,
    discountPercent,
    durationSeconds,
  };
  return studioState.flashDeal;
}

export function stopFlashDeal() {
  studioState.flashDeal.active = false;
  return studioState.flashDeal;
}

export function updateAIPrompts(prompts: string[]) {
    studioState.aiPrompts = prompts;
    return studioState.aiPrompts;
}


// --- Data Simulation ---
export function simulateStatsUpdate() {
  if (studioState.mode !== 'live') return null;

  // Simulate viewer fluctuation
  studioState.stats.viewers += Math.floor(Math.random() * 11) - 5; // -5 to +5
  if (studioState.stats.viewers < 0) studioState.stats.viewers = 0;

  // Simulate sales
  if (Math.random() < 0.2) { // 20% chance of a sale each tick
    const saleAmount = Math.random() < 0.9 ? 1 : 2; // 1 or 2 items
    studioState.stats.sales += saleAmount;
    studioState.commerceGoal.soldUnits += saleAmount;

    const newSaleEvent = {
        id: Date.now(),
        label: `${saleAmount}x GlowUp product sold`,
        time: format(new Date(), 'HH:mm')
    };
    studioState.salesEvents.unshift(newSaleEvent);
    if (studioState.salesEvents.length > 10) {
        studioState.salesEvents.pop();
    }
  }

  // Simulate cart changes
  studioState.commerceGoal.cartCount += Math.floor(Math.random() * 3) - 1;
  if (studioState.commerceGoal.cartCount < 0) studioState.commerceGoal.cartCount = 0;

  return {
    stats: studioState.stats,
    salesEvents: studioState.salesEvents,
    commerceGoal: studioState.commerceGoal,
    startedAt: studioState.startedAt,
  };
}
