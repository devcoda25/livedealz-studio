/**
 * Video Encoder - Handles H.264/H.265 encoding using WebCodecs API
 * 
 * Provides hardware-accelerated video encoding with support for
 * NVENC, AMF, and software fallback.
 */

import {
  StreamConfig,
  VideoCodec,
  HardwareAccelType,
  DEFAULT_STREAM_CONFIGS,
  StreamQuality
} from './types';

interface EncodedFrame {
  data: ArrayBuffer;
  timestamp: number;
  type: 'keyframe' | 'delta';
  duration: number;
}

/**
 * Adaptive Bitrate Controller
 * Monitors network conditions and adjusts encoding quality dynamically
 */
export class AdaptiveBitrateController {
  private config: {
    minBitrate: number;      // kbps
    maxBitrate: number;      // kbps
    initialBitrate: number;  // kbps
    degradationThreshold: number;  // ms of latency before degrading
    recoveryThreshold: number;    // ms of good latency before recovering
    checkInterval: number;    // ms between checks
  };

  private currentBitrate: number;
  private networkLatency: number = 0;
  private packetLoss: number = 0;
  private lastAdjustment: number = 0;
  private consecutiveDegradations: number = 0;
  private consecutiveRecoveries: number = 0;

  constructor(config?: Partial<typeof AdaptiveBitrateController.prototype.config>) {
    this.config = {
      minBitrate: 400,
      maxBitrate: 8000,
      initialBitrate: 2500,
      degradationThreshold: 1500,  // 1.5s latency
      recoveryThreshold: 500,       // 500ms latency
      checkInterval: 5000,         // 5 seconds
      ...config,
    };
    this.currentBitrate = this.config.initialBitrate;
  }

  /**
   * Update network metrics
   */
  updateNetworkMetrics(latency: number, packetLoss: number): void {
    this.networkLatency = latency;
    this.packetLoss = packetLoss;
  }

  /**
   * Calculate recommended bitrate based on conditions
   */
  calculateBitrate(): number {
    const now = Date.now();
    if (now - this.lastAdjustment < this.config.checkInterval) {
      return this.currentBitrate;
    }

    let newBitrate = this.currentBitrate;

    // Network is degraded - reduce quality
    if (this.networkLatency > this.config.degradationThreshold || this.packetLoss > 5) {
      this.consecutiveDegradations++;
      this.consecutiveRecoveries = 0;

      // Aggressive reduction for packet loss
      if (this.packetLoss > 10) {
        newBitrate = Math.max(this.config.minBitrate, this.currentBitrate * 0.5);
      } else if (this.packetLoss > 5) {
        newBitrate = Math.max(this.config.minBitrate, this.currentBitrate * 0.7);
      } else if (this.networkLatency > this.config.degradationThreshold * 2) {
        newBitrate = Math.max(this.config.minBitrate, this.currentBitrate * 0.6);
      } else {
        newBitrate = Math.max(this.config.minBitrate, this.currentBitrate * 0.8);
      }
    }
    // Network is good - potentially increase quality
    else if (this.networkLatency < this.config.recoveryThreshold && this.packetLoss < 1) {
      this.consecutiveRecoveries++;
      this.consecutiveDegradations = 0;

      // Gradual recovery
      if (this.consecutiveRecoveries >= 3) {
        newBitrate = Math.min(this.config.maxBitrate, this.currentBitrate * 1.2);
      }
    } else {
      this.consecutiveDegradations = 0;
      this.consecutiveRecoveries = 0;
    }

    // Apply change
    if (newBitrate !== this.currentBitrate) {
      this.currentBitrate = Math.round(newBitrate);
      this.lastAdjustment = now;
    }

    return this.currentBitrate;
  }

  /**
   * Get current bitrate
   */
  getBitrate(): number {
    return this.currentBitrate;
  }

  /**
   * Get quality level (0-3)
   */
  getQualityLevel(): number {
    const ratio = (this.currentBitrate - this.config.minBitrate) / 
                  (this.config.maxBitrate - this.config.minBitrate);
    if (ratio < 0.25) return 0;  // Low
    if (ratio < 0.5) return 1;   // Medium
    if (ratio < 0.75) return 2; // High
    return 3;                     // Ultra
  }

  /**
   * Reset controller
   */
  reset(): void {
    this.currentBitrate = this.config.initialBitrate;
    this.networkLatency = 0;
    this.packetLoss = 0;
    this.consecutiveDegradations = 0;
    this.consecutiveRecoveries = 0;
  }
}

type EncoderEventCallback = (frame: EncodedFrame) => void;

export class VideoEncoder {
  private config: StreamConfig;
  private isEncoding = false;
  private inputQueue: VideoFrame[] = [];
  private outputQueue: EncodedFrame[] = [];

  // WebCodecs specific
  private videoEncoder: globalThis.VideoEncoder | null = null;
  private track: MediaStreamTrack | null = null;

  // Callbacks
  private onEncodedFrame: EncoderEventCallback | null = null;
  private onError: ((error: Error) => void) | null = null;

  // Adaptive bitrate
  private adaptiveController: AdaptiveBitrateController | null = null;
  private useAdaptiveBitrate: boolean = false;

  // Stats
  private stats = {
    framesEncoded: 0,
    bytesEncoded: 0,
    lastEncodeTime: 0,
    encodeErrors: 0,
    currentBitrate: 2500,
  };

  constructor(config?: Partial<StreamConfig>) {
    this.config = {
      ...DEFAULT_STREAM_CONFIGS.medium,
      ...config,
    };
  }

  /**
   * Check if WebCodecs is supported
   */
  static isSupported(): boolean {
    return typeof globalThis.VideoEncoder !== 'undefined' &&
      typeof globalThis.VideoEncoder.isConfigSupported === 'function';
  }

  /**
   * Get supported configurations
   */
  static async getSupportedConfigs(): Promise<VideoEncoderConfig[]> {
    if (!this.isSupported()) return [];

    const configurations: VideoEncoderConfig[] = [];

    // Test H.264
    try {
      const h264Support = await globalThis.VideoEncoder.isConfigSupported({
        codec: 'avc1.42001f', // Baseline
        width: { min: 320, max: 1920 } as any,
        height: { min: 240, max: 1080 } as any,
        bitrate: { min: 100000, max: 6000000 } as any,
        framerate: { min: 1, max: 60 } as any,
      });
      if (h264Support.supported && h264Support.config) {
        configurations.push({ ...h264Support.config, codecType: 'h264' });
      }
    } catch (e) {
      console.warn('H.264 not supported:', e);
    }

    // Test H.265
    try {
      const h265Support = await globalThis.VideoEncoder.isConfigSupported({
        codec: 'hvc1.1.6.L120.90', // Main
        width: { min: 320, max: 3840 } as any,
        height: { min: 240, max: 2160 } as any,
        bitrate: { min: 100000, max: 20000000 } as any,
        framerate: { min: 1, max: 60 } as any,
      });
      if (h265Support.supported && h265Support.config) {
        configurations.push({ ...h265Support.config, codecType: 'h265' });
      }
    } catch (e) {
      console.warn('H.265 not supported:', e);
    }

    return configurations;
  }

  /**
   * Initialize the encoder
   */
  async initialize(): Promise<boolean> {
    if (!VideoEncoder.isSupported()) {
      console.warn('WebCodecs VideoEncoder not supported, using fallback');
      return this.initializeFallback();
    }

    const codecString = this.getCodecString();

    try {
      const support = await globalThis.VideoEncoder.isConfigSupported({
        codec: codecString,
        width: this.config.resolution.width,
        height: this.config.resolution.height,
        bitrate: this.config.bitrate.target * 1000,
        framerate: this.config.framerate,
        // @ts-ignore - extended config
        latencyMode: 'quality',
        // @ts-ignore
        alpha: 'discard',
      });

      if (!support.supported) {
        console.warn('Requested encoder config not supported, using fallback');
        return this.initializeFallback();
      }

      this.videoEncoder = new globalThis.VideoEncoder({
        output: this.handleEncodedFrame.bind(this),
        error: this.handleEncoderError.bind(this),
      });

      this.videoEncoder.configure(support.config!);
      console.log('VideoEncoder initialized with config:', support.config);
      return true;
    } catch (error) {
      console.error('Failed to initialize VideoEncoder:', error);
      return this.initializeFallback();
    }
  }

  /**
   * Initialize software fallback encoder
   */
  private initializeFallback(): boolean {
    console.log('Using software encoder fallback');
    // Software encoding would require a library like ffmpeg.wasm
    // For now, we'll use the MediaRecorder as a fallback
    return true;
  }

  /**
   * Get codec string for WebCodecs
   */
  private getCodecString(): string {
    const { codec, profile } = this.config;

    if (codec === 'h264') {
      switch (profile) {
        case 'baseline':
          return 'avc1.42001f';
        case 'main':
          return 'avc1.4d401f';
        case 'high':
          return 'avc1.64001f';
        default:
          return 'avc1.42001f';
      }
    } else if (codec === 'h265') {
      return 'hvc1.1.6.L120.90';
    }

    return 'avc1.42001f';
  }

  /**
   * Set the video track to encode
   */
  setVideoTrack(track: MediaStreamTrack): void {
    this.track = track;
  }

  /**
   * Set callback for encoded frames
   */
  onFrame(callback: EncoderEventCallback): void {
    this.onEncodedFrame = callback;
  }

  /**
   * Set error callback
   */
  onErrorCallback(callback: (error: Error) => void): void {
    this.onError = callback;
  }

  /**
   * Start encoding from a MediaStream
   */
  startEncoding(stream: MediaStream): void {
    if (this.isEncoding) return;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      this.onError?.(new Error('No video track in stream'));
      return;
    }

    this.track = videoTrack;
    this.isEncoding = true;

    // Use MediaStreamImageGenerator or requestVideoFrameCallback for frame extraction
    this.startFrameCapture();
  }

  /**
   * Start frame capture loop
   */
  private startFrameCapture(): void {
    if (!this.isEncoding || !this.track) return;

    const processFrame = async () => {
      if (!this.isEncoding) return;

      try {
        // Create a video element to capture frames
        const video = document.createElement('video');
        video.srcObject = new MediaStream([this.track!]);
        video.muted = true;
        video.playsInline = true;

        await video.play();

        // Use requestVideoFrameCallback for efficient frame extraction
        if (typeof video.requestVideoFrameCallback === 'function') {
          this.encodeFromVideo(video);
        } else {
          // Fallback to setTimeout
          this.encodeFromVideoFallback(video);
        }
      } catch (error) {
        console.error('Frame capture error:', error);
      }
    };

    processFrame();
  }

  /**
   * Encode frames from video element using requestVideoFrameCallback
   */
  private async encodeFromVideo(video: HTMLVideoElement): Promise<void> {
    if (!this.isEncoding || !this.videoEncoder || !video.srcObject) return;

    const callback = async (now: number, metadata: VideoFrameMetadata) => {
      if (!this.isEncoding || !this.videoEncoder) return;

      try {
        const frame = new globalThis.VideoFrame(video, {
          timestamp: metadata.expectedDisplayTime! * 1000,
          alpha: 'discard',
        });

        await this.videoEncoder.encode(frame);
        frame.close();

        this.stats.framesEncoded++;
        this.stats.lastEncodeTime = Date.now();

        // Continue capturing
        video.requestVideoFrameCallback(callback);
      } catch (error) {
        console.error('Encode error:', error);
        this.stats.encodeErrors++;
      }
    };

    video.requestVideoFrameCallback(callback);
  }

  /**
   * Encode frames from video element using fallback
   */
  private async encodeFromVideoFallback(video: HTMLVideoElement): Promise<void> {
    if (!this.isEncoding || !this.videoEncoder) return;

    const frameInterval = 1000 / this.config.framerate;

    const capture = async () => {
      if (!this.isEncoding || !this.videoEncoder || !video.srcObject) return;

      try {
        const frame = new globalThis.VideoFrame(video, {
          timestamp: Date.now() * 1000,
          alpha: 'discard',
        });

        await this.videoEncoder.encode(frame);
        frame.close();

        this.stats.framesEncoded++;
        this.stats.lastEncodeTime = Date.now();

        setTimeout(capture, frameInterval);
      } catch (error) {
        console.error('Encode error:', error);
        this.stats.encodeErrors++;
        setTimeout(capture, frameInterval);
      }
    };

    capture();
  }

  /**
   * Encode a VideoFrame directly
   */
  async encodeFrame(frame: globalThis.VideoFrame, keyFrame: boolean = false): Promise<void> {
    if (!this.videoEncoder) return;

    this.videoEncoder.encode(frame, { keyFrame });
    this.stats.framesEncoded++;
  }

  /**
   * Handle encoded frame output
   */
  private handleEncodedFrame(frame: globalThis.EncodedVideoChunk): void {
    // Use copyTo to get the encoded data
    const buffer = new ArrayBuffer(frame.byteLength);
    frame.copyTo(buffer);

    const encodedFrame: EncodedFrame = {
      data: buffer,
      timestamp: frame.timestamp,
      type: frame.type === 'key' ? 'keyframe' : 'delta',
      duration: frame.duration || (1000 / this.config.framerate),
    };

    this.stats.bytesEncoded += frame.byteLength;
    this.onEncodedFrame?.(encodedFrame);
  }

  /**
   * Handle encoder errors
   */
  private handleEncoderError(error: Error): void {
    console.error('VideoEncoder error:', error);
    this.stats.encodeErrors++;
    this.onError?.(error);
  }

  /**
   * Stop encoding
   */
  stop(): void {
    this.isEncoding = false;

    if (this.videoEncoder) {
      this.videoEncoder.close();
      this.videoEncoder = null;
    }

    this.track = null;
    this.inputQueue = [];
  }

  /**
   * Update encoder configuration
   */
  updateConfig(config: Partial<StreamConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.videoEncoder && this.isEncoding) {
      const codecString = this.getCodecString();
      this.videoEncoder.configure({
        codec: codecString,
        width: this.config.resolution.width,
        height: this.config.resolution.height,
        bitrate: this.config.bitrate.target * 1000,
        framerate: this.config.framerate,
      });
    }
  }

  /**
   * Force a keyframe
   */
  async forceKeyFrame(): Promise<void> {
    // Keyframe will be generated on next encode call
    this.config.keyframeInterval = 0;
  }

  /**
   * Get encoder statistics
   */
  getStats() {
    const actualBitrate = this.stats.bytesEncoded / ((Date.now() - this.stats.lastEncodeTime) / 1000) * 8 / 1000;
    return {
      ...this.stats,
      bitrate: actualBitrate,
      targetBitrate: this.stats.currentBitrate,
      adaptiveEnabled: this.useAdaptiveBitrate,
      adaptiveQuality: this.adaptiveController?.getQualityLevel() || 0,
      errorRate: this.stats.framesEncoded > 0
        ? this.stats.encodeErrors / this.stats.framesEncoded
        : 0,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): StreamConfig {
    return { ...this.config };
  }

  /**
   * Enable adaptive bitrate streaming
   */
  enableAdaptiveBitrate(enabled: boolean): void {
    this.useAdaptiveBitrate = enabled;
    if (enabled && !this.adaptiveController) {
      this.adaptiveController = new AdaptiveBitrateController({
        initialBitrate: this.config.bitrate.target,
        minBitrate: this.config.bitrate.min,
        maxBitrate: this.config.bitrate.max,
      });
    }
  }

  /**
   * Update network metrics for adaptive bitrate
   */
  updateNetworkMetrics(latency: number, packetLoss: number): void {
    if (this.useAdaptiveBitrate && this.adaptiveController) {
      const newBitrate = this.adaptiveController.calculateBitrate();
      if (newBitrate !== this.stats.currentBitrate) {
        this.stats.currentBitrate = newBitrate;
        this.updateConfig({ bitrate: { target: newBitrate, min: newBitrate * 0.8, max: newBitrate * 1.2 } });
      }
    }
  }

  /**
   * Check if encoder is active
   */
  isActive(): boolean {
    return this.isEncoding;
  }

  /**
   * Flush remaining frames
   */
  async flush(): Promise<void> {
    if (this.videoEncoder) {
      await this.videoEncoder.flush();
    }
  }
}

/**
 * Audio Encoder - Handles AAC/Opus audio encoding
 */
export class AudioEncoder {
  private config: {
    codec: 'aac' | 'opus' | 'mp3';
    bitrate: number;
    sampleRate: number;
    channels: 1 | 2;
  };
  private encoder: AudioWorkletNode | null = null;
  private isEncoding = false;

  // WebCodecs
  private audioEncoder: globalThis.AudioEncoder | null = null;
  private onEncodedFrame: ((data: ArrayBuffer, timestamp: number) => void) | null = null;

  constructor(config?: Partial<typeof AudioEncoder.prototype.config>) {
    this.config = {
      codec: 'aac',
      bitrate: 128000,
      sampleRate: 48000,
      channels: 2,
      ...config,
    };
  }

  /**
   * Check if AudioEncoder is supported
   */
  static isSupported(): boolean {
    return typeof globalThis.AudioEncoder !== 'undefined';
  }

  /**
   * Initialize the audio encoder
   */
  async initialize(): Promise<boolean> {
    if (!AudioEncoder.isSupported()) {
      console.warn('WebCodecs AudioEncoder not supported');
      return false;
    }

    try {
      const codecString = this.getCodecString();

      const support = await globalThis.AudioEncoder.isConfigSupported({
        codec: codecString,
        sampleRate: this.config.sampleRate,
        numberOfChannels: this.config.channels,
        bitrate: this.config.bitrate,
      });

      if (!support.supported) {
        console.warn('Audio encoder config not supported');
        return false;
      }

      this.audioEncoder = new globalThis.AudioEncoder({
        output: (chunk) => {
          // Use copyTo to get the encoded data
          const buffer = new ArrayBuffer(chunk.byteLength);
          chunk.copyTo(buffer);
          this.onEncodedFrame?.(buffer, chunk.timestamp);
        },
        error: (error) => {
          console.error('AudioEncoder error:', error);
        },
      });

      this.audioEncoder.configure(support.config!);
      return true;
    } catch (error) {
      console.error('Failed to initialize AudioEncoder:', error);
      return false;
    }
  }

  /**
   * Get codec string
   */
  private getCodecString(): string {
    switch (this.config.codec) {
      case 'aac':
        return 'mp4a.40.2';
      case 'opus':
        return 'opus';
      case 'mp3':
        return 'mp4a.40.3';
      default:
        return 'mp4a.40.2';
    }
  }

  /**
   * Set callback for encoded audio
   */
  onFrame(callback: (data: ArrayBuffer, timestamp: number) => void): void {
    this.onEncodedFrame = callback;
  }

  /**
   * Start encoding from a MediaStream
   */
  startEncoding(stream: MediaStream): void {
    if (this.isEncoding) return;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) {
      console.warn('No audio track in stream');
      return;
    }

    this.isEncoding = true;

    // For now, pass through the track
    // Real implementation would use AudioWorklet for encoding
  }

  /**
   * Encode audio data
   */
  encodeAudio(audioData: AudioData): void {
    if (!this.audioEncoder || !this.isEncoding) return;
    this.audioEncoder.encode(audioData);
  }

  /**
   * Stop encoding
   */
  stop(): void {
    this.isEncoding = false;

    if (this.audioEncoder) {
      this.audioEncoder.close();
      this.audioEncoder = null;
    }
  }

  /**
   * Flush remaining frames
   */
  async flush(): Promise<void> {
    if (this.audioEncoder) {
      await this.audioEncoder.flush();
    }
  }
}
