export type Mode = 'lobby' | 'live';
export type AudienceTab = 'chat' | 'qa' | 'viewers';

export interface Product {
  id: string;
  name: string;
  price: string;
  stock: string;
  tag: string;
}

export interface Scene {
  id: string;
  label: string;
  desc: string;
}

export interface ChatMessage {
  id: string;
  from: string;
  body: string;
  time: string;
  system?: boolean;
}

export interface QAItem {
  id: number;
  question: string;
  from: string;
  status: 'unanswered' | 'pinned';
}

export interface Viewer {
  id: number;
  name: string;
  tag: string;
}

export interface CoHost {
  id: number;
  name: string;
  status: 'Accepted' | 'Pending';
}

export interface Attachment {
  id: number;
  from: string;
  type: 'image' | 'question';
  label: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  file?: File;
}

export interface RunOfShowItem {
  id: string;
  label: string;
  window: string;
  scene: string;
}

export interface SalesEvent {
  id: number;
  label: string;
  time: string;
}

export interface CommerceGoal {
  targetUnits: number;
  soldUnits: number;
  cartCount: number;
  last5MinSales: number;
}

export interface MomentMarker {
  id: string;
  time: string;
  label: string;
}

export interface FlashDeal {
  active: boolean;
  endsAt: number | null; // Timestamp
  discountPercent: number;
  durationSeconds: number;
}

export interface LiveStats {
    viewers: number;
    sales: number;
    connection: 'Excellent' | 'Good' | 'Poor';
    bitrate: string;
}

// Full server-side state
export interface StudioState {
  mode: Mode;
  startedAt: number | null; // Timestamp
  chat: {
    messages: ChatMessage[];
  };
  stats: LiveStats;
  salesEvents: SalesEvent[];
  commerceGoal: CommerceGoal;
  flashDeal: FlashDeal;
  momentMarkers: MomentMarker[];
  aiPrompts: string[];
  attachments: Attachment[];
}


// Socket Event Payloads
// C2S: Client to Server
export interface C2S_JoinStudio {
  studioId: string;
}
export interface C2S_SendChat {
  body: string;
  attachment?: {
    file: Buffer;
    name: string;
    mimeType: string;
  }
}
export interface C2S_SetMode {
  mode: Mode;
}
export interface C2S_StartFlashDeal {
  durationSeconds: number;
  discountPercent: number;
}
export interface C2S_StopFlashDeal {}
export interface C2S_MarkMoment {
  label?: string;
}
export interface C2S_ModerateAttachment {
    attachmentId: number;
    status: 'approved' | 'rejected';
}

// S2C: Server to Client
export type S2C_StudioState = StudioState;

export type S2C_ChatNew = ChatMessage;

export interface S2C_StatsUpdate {
    stats: LiveStats;
    salesEvents: SalesEvent[];
    commerceGoal: CommerceGoal;
    startedAt: number | null;
}

export type S2C_FlashUpdate = FlashDeal;

export interface S2C_MomentsUpdate {
  moments: MomentMarker[];
}

export interface S2C_AIPromptsUpdate {
  prompts: string[];
}

export interface S2C_ModeUpdate {
    mode: Mode;
    startedAt: number | null;
}

export interface S2C_AttachmentsUpdate {
  attachments: Attachment[];
}
