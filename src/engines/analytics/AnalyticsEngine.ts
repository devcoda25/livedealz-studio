/**
 * Analytics Engine - Tracks stream metrics and provides analytics
 * 
 * Aggregates metrics from various sources, provides
 * real-time analytics, and supports data export.
 */

import { 
  StreamMetrics,
  StreamStats,
  TimeSeries,
  TimeSeriesPoint,
  DashboardAlert,
  ExportOptions,
  ExportFormat,
  AnalyticsEvent,
  AnalyticsEventType,
} from './types';

type AnalyticsEventCallback = (event: AnalyticsEvent) => void;

export class AnalyticsEngine {
  // Session
  private sessionId: string | null = null;
  private startTime: number = 0;
  private isTracking = false;
  
  // Real-time metrics
  private currentMetrics: StreamMetrics | null = null;
  private metricsHistory: StreamMetrics[] = [];
  private maxHistoryLength = 3600; // 1 hour at 1 sample/sec
  
  // Aggregated stats
  private stats: StreamStats | null = null;
  
  // Time series
  private timeSeries: Map<string, TimeSeries> = new Map();
  
  // Dashboard
  private alerts: DashboardAlert[] = [];
  private maxAlerts = 100;
  
  // Callbacks
  private onMetricsUpdate: ((metrics: StreamMetrics) => void) | null = null;
  private onAlert: ((alert: DashboardAlert) => void) | null = null;
  
  // Events
  private eventListeners: Map<AnalyticsEventType, Set<AnalyticsEventCallback>> = new Map();

  constructor() {
    // Initialize empty session
  }

  // ==========================================
  // Session Management
  // ==========================================

  /**
   * Start tracking for a session
   */
  startSession(sessionId: string): void {
    this.sessionId = sessionId;
    this.startTime = Date.now();
    this.isTracking = true;
    this.metricsHistory = [];
    this.alerts = [];
    this.timeSeries.clear();
    
    // Initialize stats
    this.stats = {
      sessionId,
      startTime: this.startTime,
      duration: 0,
      totalViewers: 0,
      peakViewers: 0,
      totalMessages: 0,
      totalReactions: 0,
      totalQuestions: 0,
      totalPurchases: 0,
      totalRevenue: 0,
      averageViewers: 0,
      averageWatchTime: 0,
      messagesPerMinute: 0,
      conversionRate: 0,
      averageOrderValue: 0,
      averageBitrate: 0,
      averageFps: 0,
      healthScore: 100,
    };
    
    // Initialize current metrics
    this.currentMetrics = this.createEmptyMetrics();
    
    console.log('AnalyticsEngine: Started session', sessionId);
  }

  /**
   * Stop tracking
   */
  stopSession(): void {
    if (!this.isTracking) return;
    
    this.isTracking = false;
    
    if (this.stats) {
      this.stats.endTime = Date.now();
      this.stats.duration = Math.floor((this.stats.endTime - this.stats.startTime) / 1000);
    }
    
    // Compute final stats
    this.computeStats();
    
    console.log('AnalyticsEngine: Stopped session', this.sessionId);
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  // ==========================================
  // Metrics
  // ==========================================

  /**
   * Set metrics update callback
   */
  onMetricsUpdateCallback(callback: (metrics: StreamMetrics) => void): void {
    this.onMetricsUpdate = callback;
  }

  /**
   * Create empty metrics
   */
  private createEmptyMetrics(): StreamMetrics {
    return {
      sessionId: this.sessionId || '',
      timestamp: Date.now(),
      viewers: {
        total: 0,
        peak: 0,
        concurrent: 0,
        averageWatchTime: 0,
      },
      engagement: {
        messages: 0,
        messagesPerMinute: 0,
        reactions: 0,
        questions: 0,
        shares: 0,
      },
      commerce: {
        cartAdds: 0,
        cartAddsUnique: 0,
        purchases: 0,
        purchaseValue: 0,
        conversionRate: 0,
        averageOrderValue: 0,
      },
      quality: {
        averageBitrate: 0,
        averageFps: 0,
        droppedFrames: 0,
        latency: 0,
        healthScore: 100,
      },
    };
  }

  /**
   * Update viewer metrics
   */
  updateViewers(count: number): void {
    if (!this.currentMetrics) return;
    
    this.currentMetrics.viewers.concurrent = count;
    
    if (count > this.currentMetrics.viewers.peak) {
      this.currentMetrics.viewers.peak = count;
    }
    
    this.recordTimeSeries('viewers', count);
    this.checkViewerAlerts(count);
  }

  /**
   * Update engagement metrics
   */
  updateEngagement(metrics: Partial<StreamMetrics['engagement']>): void {
    if (!this.currentMetrics) return;
    
    this.currentMetrics.engagement = {
      ...this.currentMetrics.engagement,
      ...metrics,
    };
    
    // Record time series
    if (metrics.messages) {
      this.recordTimeSeries('messages', this.currentMetrics.engagement.messages);
    }
    if (metrics.reactions) {
      this.recordTimeSeries('reactions', this.currentMetrics.engagement.reactions);
    }
  }

  /**
   * Update commerce metrics
   */
  updateCommerce(metrics: Partial<StreamMetrics['commerce']>): void {
    if (!this.currentMetrics) return;
    
    this.currentMetrics.commerce = {
      ...this.currentMetrics.commerce,
      ...metrics,
    };
    
    // Calculate conversion rate
    if (this.currentMetrics.viewers.total > 0) {
      this.currentMetrics.commerce.conversionRate = 
        (this.currentMetrics.commerce.purchases / this.currentMetrics.viewers.total) * 100;
    }
    
    // Record revenue time series
    if (metrics.purchaseValue) {
      this.recordTimeSeries('revenue', this.currentMetrics.commerce.purchaseValue);
    }
  }

  /**
   * Update quality metrics
   */
  updateQuality(metrics: Partial<StreamMetrics['quality']>): void {
    if (!this.currentMetrics) return;
    
    this.currentMetrics.quality = {
      ...this.currentMetrics.quality,
      ...metrics,
    };
    
    // Record time series
    if (metrics.averageBitrate) {
      this.recordTimeSeries('bitrate', metrics.averageBitrate);
    }
    if (metrics.averageFps) {
      this.recordTimeSeries('fps', metrics.averageFps);
    }
    if (metrics.healthScore) {
      this.recordTimeSeries('health', metrics.healthScore);
      this.checkHealthAlerts(metrics.healthScore);
    }
  }

  /**
   * Record a metric sample
   */
  recordSample(): void {
    if (!this.currentMetrics || !this.isTracking) return;
    
    this.currentMetrics.timestamp = Date.now();
    
    // Calculate messages per minute
    const minutes = (Date.now() - this.startTime) / 60000;
    this.currentMetrics.engagement.messagesPerMinute = 
      minutes > 0 ? this.currentMetrics.engagement.messages / minutes : 0;
    
    // Add to history
    this.metricsHistory.push({ ...this.currentMetrics });
    
    // Trim history
    if (this.metricsHistory.length > this.maxHistoryLength) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistoryLength);
    }
    
    // Update stats
    this.updateStats();
    
    // Notify callbacks
    this.onMetricsUpdate?.(this.currentMetrics);
    this.emit('metrics:updated', { metrics: this.currentMetrics });
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): StreamMetrics | null {
    return this.currentMetrics ? { ...this.currentMetrics } : null;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(length?: number): StreamMetrics[] {
    if (length) {
      return this.metricsHistory.slice(-length);
    }
    return [...this.metricsHistory];
  }

  // ==========================================
  // Time Series
  // ==========================================

  /**
   * Record a time series point
   */
  private recordTimeSeries(name: string, value: number): void {
    const point: TimeSeriesPoint = {
      timestamp: Date.now(),
      value,
    };
    
    if (!this.timeSeries.has(name)) {
      this.timeSeries.set(name, { name, data: [] });
    }
    
    const series = this.timeSeries.get(name)!;
    series.data.push(point);
    
    // Trim old data (keep last hour)
    const oneHourAgo = Date.now() - 3600000;
    series.data = series.data.filter(p => p.timestamp > oneHourAgo);
  }

  /**
   * Get time series
   */
  getTimeSeries(name: string): TimeSeries | undefined {
    return this.timeSeries.get(name);
  }

  /**
   * Get all time series
   */
  getAllTimeSeries(): TimeSeries[] {
    return Array.from(this.timeSeries.values());
  }

  // ==========================================
  // Stats
  // ==========================================

  /**
   * Update running stats
   */
  private updateStats(): void {
    if (!this.stats || !this.currentMetrics) return;
    
    // Update totals
    this.stats.totalViewers = Math.max(this.stats.totalViewers, this.currentMetrics.viewers.concurrent);
    this.stats.peakViewers = Math.max(this.stats.peakViewers, this.currentMetrics.viewers.peak);
    this.stats.totalMessages = this.currentMetrics.engagement.messages;
    this.stats.totalReactions = this.currentMetrics.engagement.reactions;
    this.stats.totalQuestions = this.currentMetrics.engagement.questions;
    this.stats.totalPurchases = this.currentMetrics.commerce.purchases;
    this.stats.totalRevenue = this.currentMetrics.commerce.purchaseValue;
    
    // Update averages
    this.stats.averageViewers = this.metricsHistory.reduce(
      (sum, m) => sum + m.viewers.concurrent, 0
    ) / Math.max(1, this.metricsHistory.length);
    
    this.stats.averageBitrate = this.metricsHistory.reduce(
      (sum, m) => sum + m.quality.averageBitrate, 0
    ) / Math.max(1, this.metricsHistory.length);
    
    this.stats.averageFps = this.metricsHistory.reduce(
      (sum, m) => sum + m.quality.averageFps, 0
    ) / Math.max(1, this.metricsHistory.length);
    
    this.stats.healthScore = this.metricsHistory.reduce(
      (sum, m) => sum + m.quality.healthScore, 0
    ) / Math.max(1, this.metricsHistory.length);
    
    // Conversion
    if (this.stats.totalViewers > 0) {
      this.stats.conversionRate = (this.stats.totalPurchases / this.stats.totalViewers) * 100;
    }
    
    if (this.stats.totalPurchases > 0) {
      this.stats.averageOrderValue = this.stats.totalRevenue / this.stats.totalPurchases;
    }
  }

  /**
   * Compute final stats
   */
  private computeStats(): void {
    this.updateStats();
    this.emit('stats:computed', { stats: this.stats });
  }

  /**
   * Get stats
   */
  getStats(): StreamStats | null {
    return this.stats ? { ...this.stats } : null;
  }

  // ==========================================
  // Alerts
  // ==========================================

  /**
   * Set alert callback
   */
  onAlertCallback(callback: (alert: DashboardAlert) => void): void {
    this.onAlert = callback;
  }

  /**
   * Add alert
   */
  private addAlert(type: DashboardAlert['type'], message: string, metric?: string, value?: number, threshold?: number): void {
    const alert: DashboardAlert = {
      id: `alert-${Date.now()}`,
      type,
      message,
      metric,
      value,
      threshold,
      timestamp: Date.now(),
    };
    
    this.alerts.push(alert);
    
    // Trim old alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }
    
    this.emit('alert:triggered', { alert });
    this.onAlert?.(alert);
  }

  /**
   * Check viewer alerts
   */
  private checkViewerAlerts(count: number): void {
    if (count === 0) {
      this.addAlert('error', 'No viewers in stream', 'viewers', count);
    }
  }

  /**
   * Check health alerts
   */
  private checkHealthAlerts(score: number): void {
    if (score < 50) {
      this.addAlert('error', 'Stream health is critical', 'health', score, 50);
    } else if (score < 75) {
      this.addAlert('warning', 'Stream health is degraded', 'health', score, 75);
    }
  }

  /**
   * Get alerts
   */
  getAlerts(): DashboardAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  // ==========================================
  // Export
  // ==========================================

  /**
   * Export data
   */
  async exportData(options: ExportOptions): Promise<string> {
    const { format, includeMetadata, dateRange, metrics } = options;
    
    let data: unknown;
    
    // Filter by date range if specified
    let filteredHistory = this.metricsHistory;
    if (dateRange) {
      filteredHistory = this.metricsHistory.filter(
        m => m.timestamp >= dateRange.start && m.timestamp <= dateRange.end
      );
    }
    
    // Filter by metrics if specified
    let exportData: StreamMetrics[] | Record<string, unknown>[] = filteredHistory;
    if (metrics && metrics.length > 0) {
      exportData = filteredHistory.map(m => {
        const filtered: Record<string, unknown> = {};
        metrics.forEach(key => {
          if (key in m) {
            filtered[key] = (m as unknown as Record<string, unknown>)[key];
          }
        });
        return filtered;
      });
    }
    
    switch (format) {
      case 'json':
        data = includeMetadata ? {
          sessionId: this.sessionId,
          startTime: this.startTime,
          endTime: Date.now(),
          stats: this.stats,
          metrics: exportData,
        } : exportData;
        return JSON.stringify(data, null, 2);
        
      case 'csv':
        return this.convertToCSV(exportData);
        
      default:
        return JSON.stringify(exportData);
    }
  }

  /**
   * Convert to CSV
   */
  private convertToCSV(data: unknown[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0] as object);
    const rows = data.map(row => 
      headers.map(h => JSON.stringify((row as Record<string, unknown>)[h] ?? '')).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  }

  // ==========================================
  // Event System
  // ==========================================

  /**
   * Subscribe to events
   */
  on(event: AnalyticsEventType, callback: AnalyticsEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event: AnalyticsEventType, callback: AnalyticsEventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Emit event
   */
  private emit(type: AnalyticsEventType, data?: Record<string, unknown>): void {
    const event: AnalyticsEvent = {
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
   * Reset analytics
   */
  reset(): void {
    this.sessionId = null;
    this.startTime = 0;
    this.isTracking = false;
    this.currentMetrics = null;
    this.metricsHistory = [];
    this.stats = null;
    this.timeSeries.clear();
    this.alerts = [];
  }

  /**
   * Destroy the engine
   */
  destroy(): void {
    this.reset();
    this.eventListeners.clear();
  }
}

export const analyticsEngine = new AnalyticsEngine();
