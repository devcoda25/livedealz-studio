/**
 * Stream Recorder - Records streaming output to files
 * 
 * Supports WebM (VP8/VP9) and MP4 (via MediaRecorder or muxing)
 */

import { StreamConfig } from './types';

export type RecordingFormat = 'webm' | 'mp4';

export interface RecordingOptions {
  format: RecordingFormat;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  videoCodec?: 'vp8' | 'vp9' | 'h264';
  audioCodec?: 'opus' | 'aac';
}

export interface RecordingStats {
  duration: number;
  size: number;
  state: RecordingState;
}

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

type RecordingEventCallback = (event: RecordingEvent) => void;

interface RecordingEvent {
  type: 'started' | 'stopped' | 'paused' | 'resumed' | 'error' | 'dataavailable';
  data?: unknown;
}

/**
 * StreamRecorder - Records MediaStream to video files
 */
export class StreamRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  
  private options: RecordingOptions;
  private state: RecordingState = 'idle';
  
  private startTime: number = 0;
  private pausedDuration: number = 0;
  private pauseStartTime: number = 0;
  
  private eventListeners: Set<RecordingEventCallback> = new Set();
  
  constructor(options?: Partial<RecordingOptions>) {
    this.options = {
      format: 'webm',
      videoBitsPerSecond: 2500000,
      audioBitsPerSecond: 128000,
      ...options,
    };
  }

  /**
   * Check if recording is supported
   */
  static isSupported(): boolean {
    return typeof MediaRecorder !== 'undefined' && 
           MediaRecorder.isTypeSupported('video/webm;codecs=vp9');
  }

  /**
   * Get supported formats
   */
  static getSupportedFormats(): RecordingFormat[] {
    const formats: RecordingFormat[] = [];
    
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      formats.push('webm');
    }
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      formats.push('webm');
    }
    // MP4 support depends on browser - may need muxing library
    if (typeof MediaRecorder !== 'undefined') {
      formats.push('mp4');
    }
    
    return formats;
  }

  /**
   * Start recording a stream
   */
  start(stream: MediaStream): boolean {
    if (this.state === 'recording') {
      console.warn('Already recording');
      return false;
    }

    this.stream = stream;
    this.recordedChunks = [];
    
    try {
      // Get supported MIME type
      const mimeType = this.getSupportedMimeType();
      if (!mimeType) {
        this.emit('error', { message: 'No supported recording format' });
        return false;
      }

      // Determine bitrate
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      
      const bitsPerSecond = (videoTrack ? (this.options.videoBitsPerSecond || 2500000) : 0) +
                           (audioTrack ? (this.options.audioBitsPerSecond || 128000) : 0);

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: bitsPerSecond,
      });

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
          this.emit('dataavailable', { size: event.data.size });
        }
      };

      // Handle errors
      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        this.emit('error', { error: event });
      };

      // Handle stop
      this.mediaRecorder.onstop = () => {
        this.state = 'stopped';
        this.emit('stopped', { 
          duration: this.getDuration(),
          chunks: this.recordedChunks.length 
        });
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.state = 'recording';
      this.startTime = Date.now();
      this.pausedDuration = 0;
      
      this.emit('started', { mimeType });
      
      console.log('StreamRecorder started with:', mimeType);
      return true;
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.emit('error', { error });
      return false;
    }
  }

  /**
   * Pause recording
   */
  pause(): boolean {
    if (this.state !== 'recording' || !this.mediaRecorder) {
      return false;
    }

    try {
      this.mediaRecorder.pause();
      this.state = 'paused';
      this.pauseStartTime = Date.now();
      this.emit('paused', {});
      return true;
    } catch (error) {
      console.error('Failed to pause recording:', error);
      return false;
    }
  }

  /**
   * Resume recording
   */
  resume(): boolean {
    if (this.state !== 'paused' || !this.mediaRecorder) {
      return false;
    }

    try {
      this.mediaRecorder.resume();
      this.pausedDuration += Date.now() - this.pauseStartTime;
      this.state = 'recording';
      this.emit('resumed', {});
      return true;
    } catch (error) {
      console.error('Failed to resume recording:', error);
      return false;
    }
  }

  /**
   * Stop recording and get the recorded video
   */
  stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.state === 'idle') {
        resolve(null);
        return;
      }

      // Handle final data
      this.mediaRecorder.onstop = () => {
        const blob = this.createBlob();
        this.state = 'stopped';
        this.emit('stopped', { 
          duration: this.getDuration(),
          size: blob.size 
        });
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Get the recorded video as Blob
   */
  getRecordedBlob(): Blob | null {
    if (this.recordedChunks.length === 0) {
      return null;
    }
    return this.createBlob();
  }

  /**
   * Download the recorded video
   */
  download(filename?: string): void {
    const blob = this.getRecordedBlob();
    if (!blob) {
      console.warn('No recording to download');
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `recording-${Date.now()}.${this.options.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get current recording duration in seconds
   */
  getDuration(): number {
    if (this.state === 'idle') return 0;
    
    const elapsed = Date.now() - this.startTime - this.pausedDuration;
    return elapsed / 1000;
  }

  /**
   * Get recording statistics
   */
  getStats(): RecordingStats {
    const blob = this.getRecordedBlob();
    return {
      duration: this.getDuration(),
      size: blob?.size || 0,
      state: this.state,
    };
  }

  /**
   * Get current state
   */
  getState(): RecordingState {
    return this.state;
  }

  /**
   * Subscribe to recording events
   */
  on(callback: RecordingEventCallback): void {
    this.eventListeners.add(callback);
  }

  /**
   * Unsubscribe from recording events
   */
  off(callback: RecordingEventCallback): void {
    this.eventListeners.delete(callback);
  }

  /**
   * Private methods
   */
  private getSupportedMimeType(): string | null {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return null;
  }

  private createBlob(): Blob {
    const mimeType = this.getSupportedMimeType() || 'video/webm';
    return new Blob(this.recordedChunks, { type: mimeType });
  }

  private emit(type: RecordingEvent['type'], data?: unknown): void {
    const event: RecordingEvent = { type, data };
    this.eventListeners.forEach(callback => callback(event));
  }
}
