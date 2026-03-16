/**
 * Moderation Module Type Definitions
 * 
 * Defines interfaces for chat filtering, user moderation,
 * and admin actions.
 */

// ==========================================
// Moderation Rules
// ==========================================

export type ModerationRuleType = 'regex' | 'keyword' | 'domain' | 'user' | 'image';
export type FilterAction = 'block' | 'warn' | 'flag' | 'replace' | 'delete';
export type ModerationSeverity = 'low' | 'medium' | 'high';

export interface ModerationRule {
  id: string;
  name: string;
  type: ModerationRuleType;
  pattern: string;
  replacement?: string;
  action: FilterAction;
  severity: ModerationSeverity;
  enabled: boolean;
  caseSensitive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ModerationResult {
  flagged: boolean;
  action: FilterAction | null;
  rule?: ModerationRule;
  reason?: string;
}

// ==========================================
// User Moderation
// ==========================================

export type UserModerationStatus = 'active' | 'muted' | 'kicked' | 'banned';

export interface UserModeration {
  userId: string;
  userName: string;
  status: UserModerationStatus;
  mutedUntil?: number;
  bannedUntil?: number;
  warnCount: number;
  strikeCount: number;
  reason?: string;
  moderatorId?: string;
  createdAt: number;
}

export interface ModerationAction {
  id: string;
  type: 'warn' | 'mute' | 'kick' | 'ban' | 'delete';
  userId: string;
  userName: string;
  reason: string;
  moderatorId: string;
  moderatorName: string;
  timestamp: number;
  expiresAt?: number;
  details?: Record<string, unknown>;
}

// ==========================================
// Chat Filtering
// ==========================================

export interface ChatFilterConfig {
  enabled: boolean;
  caseSensitive: boolean;
  logViolations: boolean;
  notifyModerators: boolean;
}

export interface FilteredMessage {
  original: string;
  filtered: string;
  rule: ModerationRule;
  severity: ModerationSeverity;
}

// ==========================================
// Auto-Moderation
// ==========================================

export interface AutoModerationConfig {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  maxStrikes: number;
  autoBanThreshold: number;
  slowMode: boolean;
  slowModeDelay: number;  // seconds
  followerOnlyChat: boolean;
  followerOnlyDuration: number;  // minutes
  subscriberOnlyChat: boolean;
  linkBlocking: boolean;
  blockedDomains: string[];
}

// ==========================================
// Events
// ==========================================

export type ModerationEventType = 
  | 'rule:added'
  | 'rule:updated'
  | 'rule:removed'
  | 'user:warned'
  | 'user:muted'
  | 'user:kicked'
  | 'user:banned'
  | 'user:unbanned'
  | 'message:flagged'
  | 'message:filtered'
  | 'message:deleted';

export interface ModerationEvent {
  type: ModerationEventType;
  timestamp: number;
  data?: Record<string, unknown>;
}
