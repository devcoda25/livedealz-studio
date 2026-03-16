/**
 * Interactive Features Type Definitions
 * 
 * Defines interfaces for alerts, co-hosting, Q&A,
 * and real-time chat.
 */

// ==========================================
// Alert System
// ==========================================

export type AlertType = 'purchase' | 'follow' | 'gift' | 'subscription' | 'milestone';

export interface Alert {
  id: string;
  type: AlertType;
  viewer: Viewer;
  timestamp: number;
  displayDuration: number;
  priority: 'low' | 'normal' | 'high';
  animation?: 'slide' | 'fade' | 'pop' | 'bounce';
}

export interface PurchaseAlert extends Alert {
  type: 'purchase';
  productName: string;
  productImage?: string;
  quantity: number;
  amount: number;
  currency: string;
}

export interface FollowAlert extends Alert {
  type: 'follow';
  isNewFollower: boolean;
}

export interface GiftAlert extends Alert {
  type: 'gift';
  giftName: string;
  giftImage?: string;
  quantity: number;
  totalValue: number;
  currency: string;
}

export interface SubscriptionAlert extends Alert {
  type: 'subscription';
  tier?: string;
  months: number;
}

export interface MilestoneAlert extends Alert {
  type: 'milestone';
  milestone: string;
  value: number;
}

export type AnyAlert = PurchaseAlert | FollowAlert | GiftAlert | SubscriptionAlert | MilestoneAlert;

// ==========================================
// Viewer / User
// ==========================================

export interface Viewer {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
  isModerator: boolean;
  isSubscriber: boolean;
  subscriptionTier?: string;
  joinedAt?: number;
  language?: string;
}

// ==========================================
// Co-Hosting
// ==========================================

export type CohostState = 'invited' | 'accepting' | 'connecting' | 'active' | 'reconnecting' | 'ended';

export interface Cohost {
  id: string;
  viewer: Viewer;
  state: CohostState;
  joinedAt?: number;
  endedAt?: number;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
}

export interface CohostInvite {
  id: string;
  viewerId: string;
  viewerName: string;
  invitedAt: number;
  expiresAt: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

// ==========================================
// Q&A System
// ==========================================

export type QAStatus = 'pending' | 'pinned' | 'answered' | 'archived';

export interface QAQuestion {
  id: string;
  question: string;
  author: Viewer;
  status: QAStatus;
  language?: string;
  createdAt: number;
  pinnedAt?: number;
  answeredAt?: number;
  answer?: string;
  answerAuthor?: Viewer;
  upvotes: number;
  highlighted: number;  // Times highlighted by host
}

// ==========================================
// Chat
// ==========================================

export type ChatMessageType = 'text' | 'image' | 'emoji' | 'system' | 'question';

export interface ChatMessage {
  id: string;
  author: Viewer;
  content: string;
  type: ChatMessageType;
  timestamp: number;
  filtered: boolean;
  moderationAction?: ChatModerationAction;
  replyTo?: string;
  reactions: Record<string, number>;  // emoji -> count
}

export interface ChatReaction {
  emoji: string;
  count: number;
  viewerIds: string[];
}

// ==========================================
// Moderation
// ==========================================

export type ModerationActionType = 'warn' | 'mute' | 'kick' | 'ban' | 'delete';

export interface ChatModerationAction {
  id: string;
  type: ModerationActionType;
  userId: string;
  reason: string;
  moderatorId: string;
  timestamp: number;
  expiresAt?: number;
}

export interface ChatModerationRule {
  id: string;
  type: 'regex' | 'keyword' | 'domain' | 'user';
  pattern: string;
  action: 'block' | 'warn' | 'flag' | 'replace';
  severity: 'low' | 'medium' | 'high';
  enabled: boolean;
}

// ==========================================
// Events
// ==========================================

export type InteractiveEventType = 
  | 'alert:new'
  | 'alert:dismissed'
  | 'cohost:invited'
  | 'cohost:joined'
  | 'cohost:left'
  | 'qa:submitted'
  | 'qa:pinned'
  | 'qa:answered'
  | 'qa:highlighted'
  | 'chat:message'
  | 'chat:reaction'
  | 'moderation:action'
  | 'viewer:joined'
  | 'viewer:left';

export interface InteractiveEvent {
  type: InteractiveEventType;
  timestamp: number;
  data?: Record<string, unknown>;
}

// ==========================================
// WebSocket Messages
// ==========================================

// Client -> Server
export type ClientInteractiveMessage =
  | { type: 'chat:send'; content: string; replyTo?: string }
  | { type: 'chat:react'; messageId: string; emoji: string }
  | { type: 'qa:submit'; question: string; language?: string }
  | { type: 'qa:answer'; questionId: string; answer: string }
  | { type: 'qa:pin'; questionId: string }
  | { type: 'qa:unpin'; questionId: string }
  | { type: 'qa:upvote'; questionId: string }
  | { type: 'qa:highlight'; questionId: string }
  | { type: 'cohost:invite'; viewerId: string }
  | { type: 'cohost:remove'; viewerId: string }
  | { type: 'mod:warn'; userId: string; reason: string }
  | { type: 'mod:mute'; userId: string; duration: number }
  | { type: 'mod:kick'; userId: string }
  | { type: 'mod:ban'; userId: string; duration?: number };

// Server -> Client
export type ServerInteractiveMessage =
  | { type: 'chat:message'; message: ChatMessage }
  | { type: 'chat:reaction'; messageId: string; emoji: string; count: number }
  | { type: 'qa:question'; question: QAQuestion }
  | { type: 'qa:update'; question: QAQuestion }
  | { type: 'cohost:invite'; invite: CohostInvite }
  | { type: 'cohost:update'; cohost: Cohost }
  | { type: 'alert:new'; alert: AnyAlert }
  | { type: 'viewer:joined'; viewer: Viewer }
  | { type: 'viewer:left'; viewerId: string }
  | { type: 'viewers:count'; count: number };
