/**
 * Analytics Module Type Definitions
 * 
 * Defines interfaces for stream metrics, health monitoring,
 * and data export.
 */

// ==========================================
// Stream Metrics
// ==========================================

export interface StreamMetrics {
  sessionId: string;
  timestamp: number;
  
  // Viewer metrics
  viewers: {
    total: number;
    peak: number;
    concurrent: number;
    averageWatchTime: number;  // seconds
  };
  
  // Engagement metrics
  engagement: {
    messages: number;
    messagesPerMinute: number;
    reactions: number;
    questions: number;
    shares: number;
  };
  
  // Commerce metrics
  commerce: {
    cartAdds: number;
    cartAddsUnique: number;
    purchases: number;
    purchaseValue: number;
    conversionRate: number;
    averageOrderValue: number;
  };
  
  // Quality metrics
  quality: {
    averageBitrate: number;
    averageFps: number;
    droppedFrames: number;
    latency: number;
    healthScore: number;  // 0-100
  };
}

// ==========================================
// Time Series Data
// ==========================================

export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
}

export interface TimeSeries {
  name: string;
  data: TimeSeriesPoint[];
  unit?: string;
}

// ==========================================
// Aggregated Stats
// ==========================================

export interface StreamStats {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration: number;  // seconds
  
  // Totals
  totalViewers: number;
  peakViewers: number;
  totalMessages: number;
  totalReactions: number;
  totalQuestions: number;
  totalPurchases: number;
  totalRevenue: number;
  
  // Averages
  averageViewers: number;
  averageWatchTime: number;
  messagesPerMinute: number;
  conversionRate: number;
  averageOrderValue: number;
  
  // Quality
  averageBitrate: number;
  averageFps: number;
  healthScore: number;
}

// ==========================================
// Admin Dashboard
// ==========================================

export interface DashboardConfig {
  refreshInterval: number;  // ms
  showRealTime: boolean;
  metrics: string[];
}

export interface DashboardAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  metric?: string;
  value?: number;
  threshold?: number;
  timestamp: number;
}

// ==========================================
// Export
// ==========================================

export type ExportFormat = 'json' | 'csv' | 'xlsx';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  dateRange?: {
    start: number;
    end: number;
  };
  metrics?: string[];
}

// ==========================================
// Events
// ==========================================

export type AnalyticsEventType = 
  | 'metrics:updated'
  | 'stats:computed'
  | 'alert:triggered'
  | 'export:completed';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: number;
  data?: Record<string, unknown>;
}
