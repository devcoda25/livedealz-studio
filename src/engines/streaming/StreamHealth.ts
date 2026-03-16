/**
 * Stream Health Monitor - Tracks bitrate, dropped frames, and stream quality
 * 
 * Provides real-time health monitoring with alerts for:
 * - Bitrate issues
 * - Frame drops
 * - Network latency
 * - Encoder problems
 */

import { 
  StreamHealth, 
  HealthStatus, 
  HealthWarning,
  StreamState,
} from './types';

interface HealthThresholds {
  bitrate: {
    min: number;
    max: number;
  };
  fps: {
    min: number;
    max: number;
  };
  latency: {
    warn: number;
    critical: number;
  };
  droppedFrames: {
    warn: number;
    critical: number;
  };
  packetLoss: {
    warn: number;
    critical: number;
  };
}

interface HealthStats {
  // Rolling averages
  avgBitrate: number;
  avgFps: number;
  avgLatency: number;
  avgJitter: number;
  
  // Totals
  totalDroppedFrames: number;
  totalPacketsLost: number;
  
  // Counts
  warningsCount: number;
  criticalCount: number;
}

const DEFAULT_THRESHOLDS: HealthThresholds = {
  bitrate: {
    min: 500,     // kbps
    max: 10000,   // kbps
  },
  fps: {
    min: 24,
    max: 60,
  },
  latency: {
    warn: 1000,   // ms
    critical: 3000, // ms
  },
  droppedFrames: {
    warn: 1,      // per second
    critical: 5,  // per second
  },
  packetLoss: {
    warn: 1,      // percentage
    critical: 5,  // percentage
  },
};

type HealthChangeCallback = (health: StreamHealth) => void;
type WarningCallback = (warning: HealthWarning) => void;

export class StreamHealthMonitor {
  private thresholds: HealthThresholds;
  private health: StreamHealth;
  private stats: HealthStats;
  private warnings: Map<string, HealthWarning> = new Map();
  
  // Historical data
  private history: StreamHealth[] = [];
  private maxHistoryLength = 300; // 5 minutes at 1 sample/sec
  
  // Monitoring
  private monitorInterval: number | null = null;
  private isMonitoring = false;
  
  // Callbacks
  private onHealthChange: HealthChangeCallback | null = null;
  private onWarning: WarningCallback | null = null;
  
  // Metrics collection
  private currentBitrate = 0;
  private currentFps = 0;
  private currentLatency = 0;
  private currentJitter = 0;
  private currentPacketLoss = 0;
  private droppedFramesLastSecond = 0;
  
  // FPS calculation
  private frameTimestamps: number[] = [];
  private maxFpsSamples = 60;

  constructor(thresholds?: Partial<HealthThresholds>) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    
    this.health = this.createInitialHealth();
    this.stats = this.createInitialStats();
  }

  /**
   * Create initial health state
   */
  private createInitialHealth(): StreamHealth {
    return {
      status: 'unknown',
      timestamp: Date.now(),
      video: {
        bitrate: 0,
        fps: 0,
        droppedFrames: 0,
        droppedFramesPerSecond: 0,
        keyframes: 0,
        width: 0,
        height: 0,
      },
      audio: {
        bitrate: 0,
        sampleRate: 0,
        channels: 0,
        droppedPackets: 0,
      },
      network: {
        latency: 0,
        packetLoss: 0,
        jitter: 0,
        bandwidth: 0,
      },
      encoding: {
        cpuUsage: 0,
        gpuUsage: 0,
        encoderName: '',
        droppedFrames: 0,
      },
      warnings: [],
    };
  }

  /**
   * Create initial stats
   */
  private createInitialStats(): HealthStats {
    return {
      avgBitrate: 0,
      avgFps: 0,
      avgLatency: 0,
      avgJitter: 0,
      totalDroppedFrames: 0,
      totalPacketsLost: 0,
      warningsCount: 0,
      criticalCount: 0,
    };
  }

  /**
   * Set health change callback
   */
  onHealthChangeCallback(callback: HealthChangeCallback): void {
    this.onHealthChange = callback;
  }

  /**
   * Set warning callback
   */
  onWarningCallback(callback: WarningCallback): void {
    this.onWarning = callback;
  }

  /**
   * Start monitoring
   */
  startMonitoring(intervalMs: number = 1000): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitorInterval = window.setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
    
    console.log('Stream health monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
    console.log('Stream health monitoring stopped');
  }

  /**
   * Update video metrics
   */
  updateVideoMetrics(metrics: {
    bitrate?: number;
    fps?: number;
    droppedFrames?: number;
    keyframes?: number;
    width?: number;
    height?: number;
  }): void {
    if (metrics.bitrate !== undefined) this.currentBitrate = metrics.bitrate;
    if (metrics.fps !== undefined) {
      this.currentFps = metrics.fps;
      this.frameTimestamps.push(Date.now());
      if (this.frameTimestamps.length > this.maxFpsSamples) {
        this.frameTimestamps.shift();
      }
    }
    if (metrics.droppedFrames !== undefined) {
      this.droppedFramesLastSecond = metrics.droppedFrames;
    }
    if (metrics.width !== undefined) this.health.video.width = metrics.width;
    if (metrics.height !== undefined) this.health.video.height = metrics.height;
  }

  /**
   * Update network metrics
   */
  updateNetworkMetrics(metrics: {
    latency?: number;
    packetLoss?: number;
    jitter?: number;
    bandwidth?: number;
  }): void {
    if (metrics.latency !== undefined) this.currentLatency = metrics.latency;
    if (metrics.packetLoss !== undefined) this.currentPacketLoss = metrics.packetLoss;
    if (metrics.jitter !== undefined) this.currentJitter = metrics.jitter;
  }

  /**
   * Update encoding metrics
   */
  updateEncodingMetrics(metrics: {
    cpuUsage?: number;
    gpuUsage?: number;
    encoderName?: string;
    droppedFrames?: number;
  }): void {
    if (metrics.cpuUsage !== undefined) this.health.encoding.cpuUsage = metrics.cpuUsage;
    if (metrics.gpuUsage !== undefined) this.health.encoding.gpuUsage = metrics.gpuUsage;
    if (metrics.encoderName !== undefined) this.health.encoding.encoderName = metrics.encoderName;
    if (metrics.droppedFrames !== undefined) this.health.encoding.droppedFrames = metrics.droppedFrames;
  }

  /**
   * Update audio metrics
   */
  updateAudioMetrics(metrics: {
    bitrate?: number;
    sampleRate?: number;
    channels?: number;
    droppedPackets?: number;
  }): void {
    if (metrics.bitrate !== undefined) this.health.audio.bitrate = metrics.bitrate;
    if (metrics.sampleRate !== undefined) this.health.audio.sampleRate = metrics.sampleRate;
    if (metrics.channels !== undefined) this.health.audio.channels = metrics.channels;
    if (metrics.droppedPackets !== undefined) this.health.audio.droppedPackets = metrics.droppedPackets;
  }

  /**
   * Calculate actual FPS from timestamps
   */
  private calculateFps(): number {
    if (this.frameTimestamps.length < 2) return this.currentFps;
    
    const now = Date.now();
    const recentTimestamps = this.frameTimestamps.filter(
      t => now - t < 1000
    );
    
    return recentTimestamps.length;
  }

  /**
   * Collect and evaluate metrics
   */
  private collectMetrics(): void {
    // Update health object
    const calculatedFps = this.calculateFps();
    
    this.health.timestamp = Date.now();
    this.health.video.bitrate = this.currentBitrate;
    this.health.video.fps = calculatedFps;
    this.health.video.droppedFrames = this.droppedFramesLastSecond;
    this.health.video.droppedFramesPerSecond = this.droppedFramesLastSecond;
    
    this.health.network.latency = this.currentLatency;
    this.health.network.packetLoss = this.currentPacketLoss;
    this.health.network.jitter = this.currentJitter;
    
    // Calculate status
    this.health.status = this.evaluateHealthStatus();
    
    // Update warnings
    this.updateWarnings();
    
    // Add to history
    this.history.push({ ...this.health });
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
    
    // Update rolling stats
    this.updateStats();
    
    // Notify callbacks
    this.onHealthChange?.(this.health);
  }

  /**
   * Evaluate overall health status
   */
  private evaluateHealthStatus(): HealthStatus {
    // Check critical conditions first
    if (this.droppedFramesLastSecond >= this.thresholds.droppedFrames.critical) {
      return 'critical';
    }
    if (this.currentLatency >= this.thresholds.latency.critical) {
      return 'critical';
    }
    if (this.currentPacketLoss >= this.thresholds.packetLoss.critical) {
      return 'critical';
    }
    if (this.currentBitrate < this.thresholds.bitrate.min) {
      return 'critical';
    }
    
    // Check warning conditions
    if (this.droppedFramesLastSecond >= this.thresholds.droppedFrames.warn) {
      return 'degraded';
    }
    if (this.currentLatency >= this.thresholds.latency.warn) {
      return 'degraded';
    }
    if (this.currentPacketLoss >= this.thresholds.packetLoss.warn) {
      return 'degraded';
    }
    if (this.currentBitrate < this.thresholds.bitrate.min * 1.5) {
      return 'degraded';
    }
    if (calculateFpsValue(this.frameTimestamps) < this.thresholds.fps.min) {
      return 'degraded';
    }
    
    return 'good';
  }

  /**
   * Update warning list
   */
  private updateWarnings(): void {
    const currentWarnings: HealthWarning[] = [];
    const now = Date.now();
    
    // Check bitrate
    if (this.currentBitrate < this.thresholds.bitrate.min) {
      currentWarnings.push(this.createWarning(
        'bitrate',
        this.currentBitrate < this.thresholds.bitrate.min * 0.5 ? 'critical' : 'warning',
        `Bitrate too low: ${this.currentBitrate} kbps (min: ${this.thresholds.bitrate.min})`
      ));
    }
    if (this.currentBitrate > this.thresholds.bitrate.max) {
      currentWarnings.push(this.createWarning(
        'bitrate',
        'warning',
        `Bitrate too high: ${this.currentBitrate} kbps (max: ${this.thresholds.bitrate.max})`
      ));
    }
    
    // Check FPS
    const calculatedFps = this.calculateFps();
    if (calculatedFps < this.thresholds.fps.min) {
      currentWarnings.push(this.createWarning(
        'fps',
        'warning',
        `FPS too low: ${calculatedFps} fps (min: ${this.thresholds.fps.min})`
      ));
    }
    
    // Check latency
    if (this.currentLatency >= this.thresholds.latency.critical) {
      currentWarnings.push(this.createWarning(
        'latency',
        'critical',
        `Critical latency: ${this.currentLatency}ms`
      ));
    } else if (this.currentLatency >= this.thresholds.latency.warn) {
      currentWarnings.push(this.createWarning(
        'latency',
        'warning',
        `High latency: ${this.currentLatency}ms`
      ));
    }
    
    // Check dropped frames
    if (this.droppedFramesLastSecond >= this.thresholds.droppedFrames.critical) {
      currentWarnings.push(this.createWarning(
        'dropped',
        'critical',
        `Critical frame drops: ${this.droppedFramesLastSecond} frames/sec`
      ));
    } else if (this.droppedFramesLastSecond >= this.thresholds.droppedFrames.warn) {
      currentWarnings.push(this.createWarning(
        'dropped',
        'warning',
        `Frame drops detected: ${this.droppedFramesLastSecond} frames/sec`
      ));
    }
    
    // Check packet loss
    if (this.currentPacketLoss >= this.thresholds.packetLoss.critical) {
      currentWarnings.push(this.createWarning(
        'network',
        'critical',
        `Critical packet loss: ${this.currentPacketLoss}%`
      ));
    } else if (this.currentPacketLoss >= this.thresholds.packetLoss.warn) {
      currentWarnings.push(this.createWarning(
        'network',
        'warning',
        `Packet loss detected: ${this.currentPacketLoss}%`
      ));
    }
    
    // Update warnings map and health
    this.warnings.clear();
    currentWarnings.forEach(w => this.warnings.set(w.id, w));
    this.health.warnings = currentWarnings;
    
    // Notify new warnings
    currentWarnings.forEach(warning => {
      this.onWarning?.(warning);
    });
  }

  /**
   * Create a warning object
   */
  private createWarning(type: HealthWarning['type'], severity: HealthWarning['severity'], message: string): HealthWarning {
    return {
      id: `${type}-${Date.now()}`,
      type,
      severity,
      message,
      timestamp: Date.now(),
    };
  }

  /**
   * Update rolling statistics
   */
  private updateStats(): void {
    if (this.history.length === 0) return;
    
    const recent = this.history.slice(-30); // Last 30 samples
    
    this.stats.avgBitrate = recent.reduce((sum, h) => sum + h.video.bitrate, 0) / recent.length;
    this.stats.avgFps = recent.reduce((sum, h) => sum + h.video.fps, 0) / recent.length;
    this.stats.avgLatency = recent.reduce((sum, h) => sum + h.network.latency, 0) / recent.length;
    this.stats.avgJitter = recent.reduce((sum, h) => sum + h.network.jitter, 0) / recent.length;
    
    this.stats.totalDroppedFrames = recent.reduce((sum, h) => sum + h.video.droppedFrames, 0);
    this.stats.totalPacketsLost = recent.reduce((sum, h) => sum + h.network.packetLoss, 0);
    
    this.stats.warningsCount = this.warnings.size;
    this.stats.criticalCount = Array.from(this.warnings.values()).filter(
      w => w.severity === 'critical'
    ).length;
  }

  /**
   * Get current health
   */
  getHealth(): StreamHealth {
    return { ...this.health };
  }

  /**
   * Get statistics
   */
  getStats(): HealthStats {
    return { ...this.stats };
  }

  /**
   * Get health history
   */
  getHistory(length?: number): StreamHealth[] {
    if (length) {
      return this.history.slice(-length);
    }
    return [...this.history];
  }

  /**
   * Get health status
   */
  getStatus(): HealthStatus {
    return this.health.status;
  }

  /**
   * Get active warnings
   */
  getWarnings(): HealthWarning[] {
    return Array.from(this.warnings.values());
  }

  /**
   * Set thresholds
   */
  setThresholds(thresholds: Partial<HealthThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get quality score (0-100)
   */
  getQualityScore(): number {
    let score = 100;
    
    // Deduct for warnings
    this.warnings.forEach(warning => {
      if (warning.severity === 'critical') score -= 25;
      else if (warning.severity === 'warning') score -= 10;
    });
    
    // Deduct for poor metrics
    if (this.currentBitrate < this.thresholds.bitrate.min) {
      score -= 20;
    }
    if (this.calculateFps() < this.thresholds.fps.min) {
      score -= 20;
    }
    if (this.currentLatency > this.thresholds.latency.warn) {
      score -= 15;
    }
    
    return Math.max(0, score);
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.health = this.createInitialHealth();
    this.stats = this.createInitialStats();
    this.warnings.clear();
    this.history = [];
    this.frameTimestamps = [];
    this.currentBitrate = 0;
    this.currentFps = 0;
    this.currentLatency = 0;
    this.currentJitter = 0;
    this.currentPacketLoss = 0;
    this.droppedFramesLastSecond = 0;
  }

  /**
   * Destroy monitor
   */
  destroy(): void {
    this.stopMonitoring();
    this.reset();
  }
}

// Need to define calculatedFps at class level
function calculateFpsValue(frameTimestamps: number[]): number {
  if (frameTimestamps.length < 2) return 0;
  const now = Date.now();
  const recent = frameTimestamps.filter(t => now - t < 1000);
  return recent.length;
}
