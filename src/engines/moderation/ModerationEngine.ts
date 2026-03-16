/**
 * Moderation Engine - Handles chat filtering and user moderation
 * 
 * Provides regex-based chat filtering, user warnings,
 * muting, kicking, and banning.
 */

import { 
  ModerationRule,
  ModerationResult,
  FilterAction,
  UserModeration,
  ModerationAction,
  ChatFilterConfig,
  AutoModerationConfig,
  FilteredMessage,
  ModerationEvent,
  ModerationEventType,
} from './types';

type ModerationEventCallback = (event: ModerationEvent) => void;

export class ModerationEngine {
  // Rules and configuration
  private rules: ModerationRule[] = [];
  private chatFilterConfig: ChatFilterConfig = {
    enabled: true,
    caseSensitive: false,
    logViolations: true,
    notifyModerators: true,
  };
  private autoModConfig: AutoModerationConfig = {
    enabled: true,
    sensitivity: 'medium',
    maxStrikes: 3,
    autoBanThreshold: 5,
    slowMode: false,
    slowModeDelay: 5,
    followerOnlyChat: false,
    followerOnlyDuration: 0,
    subscriberOnlyChat: false,
    linkBlocking: false,
    blockedDomains: [],
  };
  
  // User moderation state
  private userModerations: Map<string, UserModeration> = new Map();
  private actionHistory: ModerationAction[] = [];
  private maxHistorySize = 1000;
  
  // Slow mode
  private userLastMessage: Map<string, number> = new Map();
  
  // Events
  private eventListeners: Map<ModerationEventType, Set<ModerationEventCallback>> = new Map();
  
  // Callbacks
  private onUserAction: ((action: ModerationAction) => void) | null = null;
  private onMessageFiltered: ((result: FilteredMessage) => void) | null = null;

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize with default moderation rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: Omit<ModerationRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Spam',
        type: 'regex',
        pattern: '\\b(buy now|click here|free money|win prize|congratulations)\\b',
        action: 'flag',
        severity: 'medium',
        enabled: true,
        caseSensitive: false,
      },
      {
        name: 'URL Shortener',
        type: 'regex',
        pattern: '(bit\\.ly|tinyurl\\.com|t\\.co|goo\\.gl)',
        action: 'flag',
        severity: 'low',
        enabled: true,
        caseSensitive: false,
      },
    ];

    defaultRules.forEach(rule => {
      this.addRule({
        ...rule,
        id: `rule-${Date.now()}-${Math.random()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
  }

  // ==========================================
  // Rules Management
  // ==========================================

  /**
   * Add a moderation rule
   */
  addRule(rule: ModerationRule): void {
    // Validate regex if needed
    if (rule.type === 'regex') {
      try {
        new RegExp(rule.pattern);
      } catch (e) {
        console.error('Invalid regex pattern:', rule.pattern);
        return;
      }
    }
    
    this.rules.push(rule);
    this.emit('rule:added', { rule });
  }

  /**
   * Update a rule
   */
  updateRule(ruleId: string, updates: Partial<ModerationRule>): void {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index < 0) return;
    
    const oldRule = this.rules[index];
    this.rules[index] = {
      ...oldRule,
      ...updates,
      updatedAt: Date.now(),
    };
    
    this.emit('rule:updated', { rule: this.rules[index], oldRule });
  }

  /**
   * Remove a rule
   */
  removeRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) return;
    
    this.rules = this.rules.filter(r => r.id !== ruleId);
    this.emit('rule:removed', { rule });
  }

  /**
   * Get all rules
   */
  getRules(): ModerationRule[] {
    return [...this.rules];
  }

  /**
   * Get enabled rules
   */
  getEnabledRules(): ModerationRule[] {
    return this.rules.filter(r => r.enabled);
  }

  /**
   * Set all rules
   */
  setRules(rules: ModerationRule[]): void {
    this.rules = rules;
  }

  // ==========================================
  // Configuration
  // ==========================================

  /**
   * Set chat filter config
   */
  setChatFilterConfig(config: Partial<ChatFilterConfig>): void {
    this.chatFilterConfig = { ...this.chatFilterConfig, ...config };
  }

  /**
   * Get chat filter config
   */
  getChatFilterConfig(): ChatFilterConfig {
    return { ...this.chatFilterConfig };
  }

  /**
   * Set auto-moderation config
   */
  setAutoModConfig(config: Partial<AutoModerationConfig>): void {
    this.autoModConfig = { ...this.autoModConfig, ...config };
  }

  /**
   * Get auto-moderation config
   */
  getAutoModConfig(): AutoModerationConfig {
    return { ...this.autoModConfig };
  }

  // ==========================================
  // Message Filtering
  // ==========================================

  /**
   * Set message filtered callback
   */
  onMessageFilteredCallback(callback: (result: FilteredMessage) => void): void {
    this.onMessageFiltered = callback;
  }

  /**
   * Filter a message
   */
  filterMessage(content: string, userId: string): ModerationResult {
    if (!this.chatFilterConfig.enabled) {
      return { flagged: false, action: null };
    }

    const enabledRules = this.getEnabledRules();
    
    for (const rule of enabledRules) {
      const matches = this.checkRule(rule, content);
      
      if (matches) {
        let filteredContent = content;
        let action = rule.action;
        
        // Handle replacement
        if (rule.action === 'replace' && rule.replacement) {
          filteredContent = content.replace(new RegExp(rule.pattern, rule.caseSensitive ? '' : 'gi'), rule.replacement);
        }
        
        // Log violation
        if (this.chatFilterConfig.logViolations) {
          this.logViolation(userId, rule);
        }
        
        const result: ModerationResult = {
          flagged: action === 'block' || action === 'flag',
          action: action as FilterAction,
          rule,
          reason: `Matched rule: ${rule.name}`,
        };
        
        // Notify if needed
        if (this.chatFilterConfig.notifyModerators) {
          this.emit('message:flagged', { userId, content, rule });
        }
        
        if (action === 'block' || action === 'delete') {
          this.emit('message:filtered', { 
            original: content, 
            filtered: filteredContent, 
            rule 
          });
          
          this.onMessageFiltered?.({
            original: content,
            filtered: filteredContent,
            rule,
            severity: rule.severity,
          });
        }
        
        return result;
      }
    }
    
    return { flagged: false, action: null };
  }

  /**
   * Check if content matches a rule
   */
  private checkRule(rule: ModerationRule, content: string): boolean {
    const flags = rule.caseSensitive ? '' : 'i';
    
    try {
      switch (rule.type) {
        case 'regex':
          return new RegExp(rule.pattern, flags).test(content);
          
        case 'keyword':
          const searchContent = rule.caseSensitive ? content : content.toLowerCase();
          return searchContent.includes(rule.pattern.toLowerCase());
          
        case 'domain':
          const domainPattern = rule.caseSensitive 
            ? rule.pattern 
            : rule.pattern.toLowerCase();
          return content.toLowerCase().includes(domainPattern);
          
        case 'user':
          return content.includes(rule.pattern);
          
        default:
          return false;
      }
    } catch (e) {
      console.error('Error checking rule:', e);
      return false;
    }
  }

  /**
   * Log a violation
   */
  private logViolation(userId: string, rule: ModerationRule): void {
    let userMod = this.userModerations.get(userId);
    
    if (!userMod) {
      userMod = {
        userId,
        userName: 'Unknown',
        status: 'active',
        warnCount: 0,
        strikeCount: 0,
        createdAt: Date.now(),
      };
      this.userModerations.set(userId, userMod);
    }
    
    // Add strike based on severity
    switch (rule.severity) {
      case 'low':
        userMod.strikeCount += 1;
        break;
      case 'medium':
        userMod.strikeCount += 2;
        break;
      case 'high':
        userMod.strikeCount += 3;
        break;
    }
    
    // Auto-ban if threshold reached
    if (this.autoModConfig.enabled && 
        userMod.strikeCount >= this.autoModConfig.autoBanThreshold) {
      this.banUser(userId, 'Unknown', 'Automatic ban: Strike threshold exceeded', 'system', 'Auto-Moderator');
    }
  }

  // ==========================================
  // User Moderation
  // ==========================================

  /**
   * Set user action callback
   */
  onUserActionCallback(callback: (action: ModerationAction) => void): void {
    this.onUserAction = callback;
  }

  /**
   * Get user moderation status
   */
  getUserModeration(userId: string): UserModeration | undefined {
    return this.userModerations.get(userId);
  }

  /**
   * Check if user can send message (slow mode, etc)
   */
  canSendMessage(userId: string): { allowed: boolean; reason?: string } {
    // Check if banned
    const userMod = this.userModerations.get(userId);
    if (userMod?.status === 'banned') {
      return { allowed: false, reason: 'You are banned' };
    }
    
    // Check if muted
    if (userMod?.status === 'muted') {
      if (userMod.mutedUntil && Date.now() > userMod.mutedUntil) {
        // Mute expired, reset status
        userMod.status = 'active';
        userMod.mutedUntil = undefined;
      } else {
        return { allowed: false, reason: 'You are temporarily muted' };
      }
    }
    
    // Check slow mode
    if (this.autoModConfig.slowMode) {
      const lastMessage = this.userLastMessage.get(userId);
      if (lastMessage) {
        const timeSinceLastMessage = Date.now() - lastMessage;
        if (timeSinceLastMessage < this.autoModConfig.slowModeDelay * 1000) {
          return { 
            allowed: false, 
            reason: `Slow mode enabled. Please wait ${this.autoModConfig.slowModeDelay} seconds between messages` 
          };
        }
      }
      this.userLastMessage.set(userId, Date.now());
    }
    
    return { allowed: true };
  }

  /**
   * Warn a user
   */
  warnUser(userId: string, userName: string, reason: string, moderatorId: string, moderatorName: string): void {
    let userMod = this.userModerations.get(userId);
    
    if (!userMod) {
      userMod = {
        userId,
        userName,
        status: 'active',
        warnCount: 0,
        strikeCount: 0,
        createdAt: Date.now(),
      };
      this.userModerations.set(userId, userMod);
    }
    
    userMod.warnCount++;
    userMod.reason = reason;
    userMod.moderatorId = moderatorId;
    
    const action: ModerationAction = {
      id: `action-${Date.now()}`,
      type: 'warn',
      userId,
      userName,
      reason,
      moderatorId,
      moderatorName,
      timestamp: Date.now(),
    };
    
    this.recordAction(action);
    this.emit('user:warned', { userId, userName, reason, action });
    this.onUserAction?.(action);
  }

  /**
   * Mute a user
   */
  muteUser(userId: string, userName: string, durationSeconds: number, reason: string, moderatorId: string, moderatorName: string): void {
    let userMod = this.userModerations.get(userId);
    
    if (!userMod) {
      userMod = {
        userId,
        userName,
        status: 'active',
        warnCount: 0,
        strikeCount: 0,
        createdAt: Date.now(),
      };
      this.userModerations.set(userId, userMod);
    }
    
    userMod.status = 'muted';
    userMod.mutedUntil = Date.now() + (durationSeconds * 1000);
    userMod.reason = reason;
    userMod.moderatorId = moderatorId;
    
    const action: ModerationAction = {
      id: `action-${Date.now()}`,
      type: 'mute',
      userId,
      userName,
      reason,
      moderatorId,
      moderatorName,
      timestamp: Date.now(),
      expiresAt: userMod.mutedUntil,
    };
    
    this.recordAction(action);
    this.emit('user:muted', { userId, userName, duration: durationSeconds, action });
    this.onUserAction?.(action);
    
    // Auto-unmute after duration
    setTimeout(() => {
      if (userMod?.status === 'muted') {
        userMod.status = 'active';
        userMod.mutedUntil = undefined;
      }
    }, durationSeconds * 1000);
  }

  /**
   * Kick a user
   */
  kickUser(userId: string, userName: string, reason: string, moderatorId: string, moderatorName: string): void {
    const action: ModerationAction = {
      id: `action-${Date.now()}`,
      type: 'kick',
      userId,
      userName,
      reason,
      moderatorId,
      moderatorName,
      timestamp: Date.now(),
    };
    
    this.recordAction(action);
    this.emit('user:kicked', { userId, userName, reason, action });
    this.onUserAction?.(action);
  }

  /**
   * Ban a user
   */
  banUser(userId: string, userName: string, reason: string, moderatorId: string, moderatorName: string, durationMinutes?: number): void {
    let userMod = this.userModerations.get(userId);
    
    if (!userMod) {
      userMod = {
        userId,
        userName,
        status: 'active',
        warnCount: 0,
        strikeCount: 0,
        createdAt: Date.now(),
      };
      this.userModerations.set(userId, userMod);
    }
    
    userMod.status = 'banned';
    if (durationMinutes) {
      userMod.bannedUntil = Date.now() + (durationMinutes * 60 * 1000);
    }
    userMod.reason = reason;
    userMod.moderatorId = moderatorId;
    
    const action: ModerationAction = {
      id: `action-${Date.now()}`,
      type: 'ban',
      userId,
      userName,
      reason,
      moderatorId,
      moderatorName,
      timestamp: Date.now(),
      expiresAt: userMod.bannedUntil,
    };
    
    this.recordAction(action);
    this.emit('user:banned', { userId, userName, reason, duration: durationMinutes, action });
    this.onUserAction?.(action);
    
    // Auto-unban after duration
    if (durationMinutes) {
      setTimeout(() => {
        if (userMod?.status === 'banned') {
          this.unbanUser(userId, userName, 'Automatic unban: Ban duration expired');
        }
      }, durationMinutes * 60 * 1000);
    }
  }

  /**
   * Unban a user
   */
  unbanUser(userId: string, userName: string, reason: string = 'Manually unbanned'): void {
    const userMod = this.userModerations.get(userId);
    if (!userMod) return;
    
    userMod.status = 'active';
    userMod.bannedUntil = undefined;
    
    const action: ModerationAction = {
      id: `action-${Date.now()}`,
      type: 'ban',
      userId,
      userName,
      reason,
      moderatorId: 'system',
      moderatorName: 'System',
      timestamp: Date.now(),
    };
    
    this.emit('user:unbanned', { userId, userName, reason });
  }

  /**
   * Get moderation history
   */
  getActionHistory(userId?: string, limit?: number): ModerationAction[] {
    let history = userId 
      ? this.actionHistory.filter(a => a.userId === userId)
      : this.actionHistory;
    
    if (limit) {
      history = history.slice(-limit);
    }
    
    return history;
  }

  /**
   * Record action in history
   */
  private recordAction(action: ModerationAction): void {
    this.actionHistory.push(action);
    
    // Trim old actions
    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory = this.actionHistory.slice(-this.maxHistorySize);
    }
  }

  // ==========================================
  // Event System
  // ==========================================

  /**
   * Subscribe to events
   */
  on(event: ModerationEventType, callback: ModerationEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event: ModerationEventType, callback: ModerationEventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Emit event
   */
  private emit(type: ModerationEventType, data?: Record<string, unknown>): void {
    const event: ModerationEvent = {
      type,
      timestamp: Date.now(),
      data,
    };

    this.eventListeners.get(type)?.forEach(callback => callback(event));
  }

  // ==========================================
  // Cleanup
  // ==========================================

  /**
   * Reset all moderation data
   */
  reset(): void {
    this.userModerations.clear();
    this.actionHistory = [];
    this.userLastMessage.clear();
  }

  /**
   * Destroy the engine
   */
  destroy(): void {
    this.reset();
    this.eventListeners.clear();
    this.rules = [];
  }
}

export const moderationEngine = new ModerationEngine();
