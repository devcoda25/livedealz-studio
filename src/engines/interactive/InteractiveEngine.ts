/**
 * Interactive Engine - Main orchestrator for interactive features
 * 
 * Handles alerts, co-hosting, Q&A, chat, and real-time
 * viewer interactions.
 */

import {
  Viewer,
  Alert,
  AnyAlert,
  Cohost,
  CohostInvite,
  QAQuestion,
  ChatMessage,
  ChatModerationRule,
  InteractiveEvent,
  InteractiveEventType,
  ClientInteractiveMessage,
  ServerInteractiveMessage,
} from './types';

type InteractiveEventCallback = (event: InteractiveEvent) => void;

export class InteractiveEngine {
  // State
  private currentUser: Viewer | null = null;
  private viewers: Map<string, Viewer> = new Map();
  private cohosts: Map<string, Cohost> = new Map();
  private pendingInvites: Map<string, CohostInvite> = new Map();
  private questions: Map<string, QAQuestion> = new Map();
  private messages: ChatMessage[] = [];
  private alerts: AnyAlert[] = [];
  private activeAlerts: AnyAlert[] = [];
  private alertQueue: AnyAlert[] = [];

  // Moderation
  private moderationRules: ChatModerationRule[] = [];
  private mutedUsers: Set<string> = new Set();
  private bannedUsers: Set<string> = new Set();

  // Configuration
  private maxMessages = 500;
  private maxQuestions = 100;
  private alertDisplayDuration = 5000;
  private maxConcurrentAlerts = 3;

  // WebSocket
  private socket: WebSocket | null = null;
  private socketUrl: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Events
  private eventListeners: Map<InteractiveEventType, Set<InteractiveEventCallback>> = new Map();

  // Callbacks
  private onViewerJoin: ((viewer: Viewer) => void) | null = null;
  private onViewerLeave: ((viewerId: string) => void) | null = null;
  private onNewMessage: ((message: ChatMessage) => void) | null = null;
  private onNewQuestion: ((question: QAQuestion) => void) | null = null;
  private onAlert: ((alert: AnyAlert) => void) | null = null;
  private onCohostUpdate: ((cohost: Cohost) => void) | null = null;

  constructor() {
    // Initialize with empty state
  }

  // ==========================================
  // User Management
  // ==========================================

  /**
   * Set current user
   */
  setCurrentUser(user: Viewer): void {
    this.currentUser = user;
    this.viewers.set(user.id, user);
  }

  /**
   * Get current user
   */
  getCurrentUser(): Viewer | null {
    return this.currentUser;
  }

  /**
   * Check if current user is host
   */
  isHost(): boolean {
    return this.currentUser?.isHost || false;
  }

  /**
   * Check if current user is moderator
   */
  isModerator(): boolean {
    return this.currentUser?.isModerator || false;
  }

  // ==========================================
  // Connection
  // ==========================================

  /**
   * Connect to interactive WebSocket server
   */
  connect(socketUrl: string): void {
    this.socketUrl = socketUrl;
    this.establishConnection();
  }

  /**
   * Establish WebSocket connection
   */
  private establishConnection(): void {
    if (!this.socketUrl) return;

    try {
      this.socket = new WebSocket(this.socketUrl);

      this.socket.onopen = () => {
        console.log('InteractiveEngine connected');
        this.reconnectAttempts = 0;

        // Rejoin any active cohost sessions
        this.cohosts.forEach(cohost => {
          this.send({ type: 'cohost:invite', viewerId: cohost.viewer.id });
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const message: ServerInteractiveMessage = JSON.parse(event.data);
          this.handleServerMessage(message);
        } catch (e) {
          console.error('Failed to parse interactive message:', e);
        }
      };

      this.socket.onclose = () => {
        console.log('InteractiveEngine disconnected');
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('InteractiveEngine error:', error);
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    setTimeout(() => {
      this.establishConnection();
    }, delay);
  }

  /**
   * Handle incoming server message
   */
  private handleServerMessage(message: ServerInteractiveMessage): void {
    switch (message.type) {
      case 'chat:message':
        this.handleNewMessage(message.message);
        break;

      case 'qa:question':
        this.handleNewQuestion(message.question);
        break;

      case 'qa:update':
        this.handleQuestionUpdate(message.question);
        break;

      case 'cohost:invite':
        this.handleCohostInvite(message.invite);
        break;

      case 'cohost:update':
        this.handleCohostUpdate(message.cohost);
        break;

      case 'alert:new':
        this.queueAlert(message.alert);
        break;

      case 'viewer:joined':
        this.handleViewerJoined(message.viewer);
        break;

      case 'viewer:left':
        this.handleViewerLeft(message.viewerId);
        break;

      case 'viewers:count':
        // Handle viewer count update
        break;
    }
  }

  /**
   * Send message to server
   */
  private send(message: ClientInteractiveMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  // ==========================================
  // Viewer Management
  // ==========================================

  /**
   * Set viewer join/leave callbacks
   */
  onViewerJoinCallback(callback: (viewer: Viewer) => void): void {
    this.onViewerJoin = callback;
  }

  onViewerLeaveCallback(callback: (viewerId: string) => void): void {
    this.onViewerLeave = callback;
  }

  /**
   * Handle viewer joined
   */
  private handleViewerJoined(viewer: Viewer): void {
    this.viewers.set(viewer.id, viewer);
    this.emit('alert:new', { viewer });
    this.onViewerJoin?.(viewer);
  }

  /**
   * Handle viewer left
   */
  private handleViewerLeft(viewerId: string): void {
    this.viewers.delete(viewerId);
    this.emit('viewer:left', { viewerId });
    this.onViewerLeave?.(viewerId);
  }

  /**
   * Get viewer by ID
   */
  getViewer(viewerId: string): Viewer | undefined {
    return this.viewers.get(viewerId);
  }

  /**
   * Get all viewers
   */
  getViewers(): Viewer[] {
    return Array.from(this.viewers.values());
  }

  /**
   * Get viewer count
   */
  getViewerCount(): number {
    return this.viewers.size;
  }

  // ==========================================
  // Chat
  // ==========================================

  /**
   * Set message callback
   */
  onNewMessageCallback(callback: (message: ChatMessage) => void): void {
    this.onNewMessage = callback;
  }

  /**
   * Handle new message
   */
  private handleNewMessage(message: ChatMessage): void {
    // Check if user is muted
    if (this.mutedUsers.has(message.author.id)) {
      return;
    }

    // Check if user is banned
    if (this.bannedUsers.has(message.author.id)) {
      return;
    }

    // Apply moderation
    const moderated = this.moderateMessage(message);
    if (moderated.moderationAction) {
      message.filtered = true;
    }

    // Add to messages
    this.messages.push(message);

    // Trim old messages
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }

    this.emit('chat:message', { message });
    this.onNewMessage?.(message);
  }

  /**
   * Send a chat message
   */
  sendMessage(content: string, replyTo?: string): void {
    if (!this.currentUser) {
      console.warn('No current user');
      return;
    }

    // Check if muted
    if (this.mutedUsers.has(this.currentUser.id)) {
      console.warn('You are muted');
      return;
    }

    this.send({ type: 'chat:send', content, replyTo });
  }

  /**
   * React to a message
   */
  reactToMessage(messageId: string, emoji: string): void {
    this.send({ type: 'chat:react', messageId, emoji });
  }

  /**
   * Get chat messages
   */
  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  /**
   * Get recent messages
   */
  getRecentMessages(count: number = 50): ChatMessage[] {
    return this.messages.slice(-count);
  }

  // ==========================================
  // Q&A
  // ==========================================

  /**
   * Set question callback
   */
  onNewQuestionCallback(callback: (question: QAQuestion) => void): void {
    this.onNewQuestion = callback;
  }

  /**
   * Handle new question
   */
  private handleNewQuestion(question: QAQuestion): void {
    this.questions.set(question.id, question);

    // Trim old questions
    if (this.questions.size > this.maxQuestions) {
      const sorted = Array.from(this.questions.values())
        .sort((a, b) => a.createdAt - b.createdAt);
      sorted.slice(0, this.questions.size - this.maxQuestions)
        .forEach(q => this.questions.delete(q.id));
    }

    this.emit('qa:submitted', { question });
    this.onNewQuestion?.(question);
  }

  /**
   * Handle question update
   */
  private handleQuestionUpdate(question: QAQuestion): void {
    const old = this.questions.get(question.id);
    this.questions.set(question.id, question);

    if (question.status === 'pinned' && (!old || old.status !== 'pinned')) {
      this.emit('qa:pinned', { question });
    } else if (question.status === 'answered' && (!old || old.status !== 'answered')) {
      this.emit('qa:answered', { question });
    }
  }

  /**
   * Submit a question
   */
  submitQuestion(questionText: string, language?: string): void {
    if (!this.currentUser) return;

    this.send({ type: 'qa:submit', question: questionText, language });
  }

  /**
   * Pin a question
   */
  pinQuestion(questionId: string): void {
    this.send({ type: 'qa:pin', questionId });
  }

  /**
   * Unpin a question
   */
  unpinQuestion(questionId: string): void {
    this.send({ type: 'qa:unpin', questionId });
  }

  /**
   * Answer a question
   */
  answerQuestion(questionId: string, answer: string): void {
    this.send({ type: 'qa:answer', questionId, answer });
  }

  /**
   * Highlight a question (show on stream)
   */
  highlightQuestion(questionId: string): void {
    this.send({ type: 'qa:highlight', questionId });

    // Update local state
    const question = this.questions.get(questionId);
    if (question) {
      question.highlighted++;
      this.emit('qa:highlighted', { question });
    }
  }

  /**
   * Upvote a question
   */
  upvoteQuestion(questionId: string): void {
    this.send({ type: 'qa:upvote', questionId });
  }

  /**
   * Get all questions
   */
  getQuestions(): QAQuestion[] {
    return Array.from(this.questions.values());
  }

  /**
   * Get questions by status
   */
  getQuestionsByStatus(status: QAQuestion['status']): QAQuestion[] {
    return this.getQuestions().filter(q => q.status === status);
  }

  /**
   * Get pinned question
   */
  getPinnedQuestion(): QAQuestion | undefined {
    return Array.from(this.questions.values()).find(q => q.status === 'pinned');
  }

  /**
   * Get highlighted question
   */
  getHighlightedQuestion(): QAQuestion | undefined {
    const questions = this.getQuestions();
    return questions.reduce((max, q) =>
      q.highlighted > (max?.highlighted || 0) ? q : max
      , undefined as QAQuestion | undefined);
  }

  // ==========================================
  // Co-Hosting
  // ==========================================

  /**
   * Set cohost callback
   */
  onCohostUpdateCallback(callback: (cohost: Cohost) => void): void {
    this.onCohostUpdate = callback;
  }

  /**
   * Handle cohost invite
   */
  private handleCohostInvite(invite: CohostInvite): void {
    this.pendingInvites.set(invite.id, invite);
  }

  /**
   * Handle cohost update
   */
  private handleCohostUpdate(cohost: Cohost): void {
    if (cohost.state === 'ended') {
      this.cohosts.delete(cohost.id);
      this.emit('cohost:left', { cohost });
    } else {
      this.cohosts.set(cohost.id, cohost);
      this.emit('cohost:joined', { cohost });
    }
    this.onCohostUpdate?.(cohost);
  }

  /**
   * Invite a viewer to co-host
   */
  inviteCohost(viewerId: string): void {
    this.send({ type: 'cohost:invite', viewerId });
  }

  /**
   * Remove a cohost
   */
  removeCohost(viewerId: string): void {
    this.send({ type: 'cohost:remove', viewerId });
    this.cohosts.delete(viewerId);
  }

  /**
   * Get all cohosts
   */
  getCohosts(): Cohost[] {
    return Array.from(this.cohosts.values());
  }

  /**
   * Get active cohosts
   */
  getActiveCohosts(): Cohost[] {
    return this.getCohosts().filter(c => c.state === 'active');
  }

  // ==========================================
  // Alerts
  // ==========================================

  /**
   * Set alert callback
   */
  onAlertCallback(callback: (alert: AnyAlert) => void): void {
    this.onAlert = callback;
  }

  /**
   * Queue an alert for display
   */
  private queueAlert(alert: AnyAlert): void {
    this.alerts.push(alert);

    // Add to display queue
    this.alertQueue.push(alert);

    // Process queue
    this.processAlertQueue();

    this.emit('alert:new', { alert });
    this.onAlert?.(alert);
  }

  /**
   * Process alert queue
   */
  private processAlertQueue(): void {
    // Show alerts based on priority
    this.alertQueue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Display up to max concurrent
    while (this.activeAlerts.length < this.maxConcurrentAlerts && this.alertQueue.length > 0) {
      const alert = this.alertQueue.shift()!;
      this.activeAlerts.push(alert);

      // Schedule removal
      setTimeout(() => {
        this.dismissAlert(alert.id);
      }, alert.displayDuration);
    }
  }

  /**
   * Dismiss an alert
   */
  dismissAlert(alertId: string): void {
    this.activeAlerts = this.activeAlerts.filter(a => a.id !== alertId);
    this.emit('alert:dismissed', { alertId });

    // Process next in queue
    this.processAlertQueue();
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): AnyAlert[] {
    return [...this.activeAlerts];
  }

  // ==========================================
  // Moderation
  // ==========================================

  /**
   * Set moderation rules
   */
  setModerationRules(rules: ChatModerationRule[]): void {
    this.moderationRules = rules.filter(r => r.enabled);
  }

  /**
   * Add moderation rule
   */
  addModerationRule(rule: ChatModerationRule): void {
    if (rule.enabled) {
      this.moderationRules.push(rule);
    }
  }

  /**
   * Moderate a message
   */
  private moderateMessage(message: ChatMessage): { filtered: boolean; moderationAction?: any } {
    for (const rule of this.moderationRules) {
      let matches = false;

      if (rule.type === 'regex') {
        try {
          const regex = new RegExp(rule.pattern, 'i');
          matches = regex.test(message.content);
        } catch (e) {
          console.warn('Invalid regex rule:', rule.pattern);
        }
      } else if (rule.type === 'keyword') {
        matches = message.content.toLowerCase().includes(rule.pattern.toLowerCase());
      }

      if (matches) {
        return {
          filtered: rule.action === 'block',
          moderationAction: {
            type: rule.action === 'block' ? 'delete' : 'warn',
            reason: `Matched rule: ${rule.pattern}`,
          },
        };
      }
    }

    return { filtered: false };
  }

  /**
   * Warn a user
   */
  warnUser(userId: string, reason: string): void {
    this.send({ type: 'mod:warn', userId, reason });
  }

  /**
   * Mute a user
   */
  muteUser(userId: string, duration: number): void {
    this.mutedUsers.add(userId);
    this.send({ type: 'mod:mute', userId, duration });

    // Auto-unmute after duration
    setTimeout(() => {
      this.mutedUsers.delete(userId);
    }, duration * 1000);
  }

  /**
   * Kick a user
   */
  kickUser(userId: string): void {
    this.send({ type: 'mod:kick', userId });
  }

  /**
   * Ban a user
   */
  banUser(userId: string, duration?: number): void {
    this.bannedUsers.add(userId);
    this.send({ type: 'mod:ban', userId, duration });

    // Auto-unban after duration
    if (duration) {
      setTimeout(() => {
        this.bannedUsers.delete(userId);
      }, duration * 1000);
    }
  }

  /**
   * Check if user is muted
   */
  isMuted(userId: string): boolean {
    return this.mutedUsers.has(userId);
  }

  /**
   * Check if user is banned
   */
  isBanned(userId: string): boolean {
    return this.bannedUsers.has(userId);
  }

  // ==========================================
  // Event System
  // ==========================================

  /**
   * Subscribe to events
   */
  on(event: InteractiveEventType, callback: InteractiveEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event: InteractiveEventType, callback: InteractiveEventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Emit event
   */
  private emit(type: InteractiveEventType, data?: Record<string, unknown>): void {
    const event: InteractiveEvent = {
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
   * Disconnect and cleanup
   */
  destroy(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.eventListeners.clear();
    this.viewers.clear();
    this.cohosts.clear();
    this.questions.clear();
    this.messages = [];
    this.alerts = [];
    this.activeAlerts = [];
    this.alertQueue = [];
  }
}

export const interactiveEngine = new InteractiveEngine();
